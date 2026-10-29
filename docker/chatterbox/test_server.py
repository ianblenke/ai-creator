# Offline tests with a stub model (no torch, no download):  python -m unittest discover docker/chatterbox
# Needs: fastapi httpx python-multipart numpy (see requirements.txt; httpx is only for the test client).
import io
import os
import sys
import types
import unittest
import wave
from unittest import mock

import numpy as np
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(__file__))
import server


class Stub:
    sr = 24000
    calls = []

    def generate(self, text, **kw):
        self.calls.append((text, kw))
        return np.zeros((1, 24000), dtype="float32")


def wav_bytes(secs):
    b = io.BytesIO()
    with wave.open(b, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000)
        w.writeframes(b"\0\0" * int(24000 * secs))
    return b.getvalue()


class T(unittest.TestCase):
    def setUp(self):
        server._model = Stub()
        Stub.calls.clear()
        self.c = TestClient(server.app)

    def test_clone_returns_mono_24k_wav_with_f_defaults(self):
        r = self.c.post("/v1/audio/speech/clone", data={"input": "Hello.", "ref_text": "x", "language": "en", "num_step": "24"},
                        files={"ref_audio": ("ref.wav", wav_bytes(6), "audio/wav")})
        self.assertEqual(r.status_code, 200)
        with wave.open(io.BytesIO(r.content)) as w:
            self.assertEqual((w.getnchannels(), w.getframerate(), w.getnframes()), (1, 24000, 24000))
        kw = Stub.calls[0][1]
        self.assertEqual((kw["exaggeration"], kw["cfg_weight"], kw["temperature"]), (0.6, 0.3, 0.9))

    def test_empty_input_is_400(self):
        r = self.c.post("/v1/audio/speech/clone", data={"input": " "}, files={"ref_audio": ("r.wav", wav_bytes(6), "audio/wav")})
        self.assertEqual(r.status_code, 400)

    def test_json_route_explains_clone_only(self):
        r = self.c.post("/v1/audio/speech", json={"input": "Hello.", "voice": "male_en"})
        self.assertEqual(r.status_code, 400)
        self.assertIn("clone-only", r.json()["detail"])

    def test_json_route_uses_default_ref_when_set(self):
        old = server.DEFAULT_REF
        server.DEFAULT_REF = __file__  # any existing path; the stub does not read it
        try:
            self.assertEqual(self.c.post("/v1/audio/speech", json={"input": "Hi."}).status_code, 200)
        finally:
            server.DEFAULT_REF = old

    def test_short_reference_warns(self):
        with self.assertLogs("chatterbox", "WARNING"):
            self.c.post("/v1/audio/speech/clone", data={"input": "Hi."}, files={"ref_audio": ("r.wav", wav_bytes(2), "audio/wav")})


    def test_truncated_or_non_wav_reference_is_400(self):
        for data in (b"RIFF\0\0", b"ID3\x03\0\0\0\0\0\x00 not a wav"):
            r = self.c.post("/v1/audio/speech/clone", data={"input": "Hi."}, files={"ref_audio": ("r.wav", data, "audio/wav")})
            self.assertEqual(r.status_code, 400, data)
            self.assertIn("PCM WAV", r.json()["detail"])

    def test_health_reports_ready_and_load_errors(self):
        self.assertEqual(self.c.get("/health").json()["ready"], True)
        with mock.patch.object(server, "REVISION", "abc123"), mock.patch.object(server, "ENGINE_TAG", "chatterbox-cpu"):
            self.assertRegex(self.c.get("/health").json()["engine"], r"^chatterbox-cpu chatterbox-tts==\S+ weights@abc123$")
        server._model = None
        self.assertEqual(self.c.get("/health").json()["ready"], False)
        with mock.patch.dict(sys.modules, {"torch": None}):  # import torch fails
            server.preload()
        h = self.c.get("/health").json()
        self.assertEqual(h["ready"], False)
        self.assertIn("torch", h["error"])
        server._load_error = None

    def test_a_fixed_seed_reseeds_before_every_request(self):
        seeds = []
        fake = types.SimpleNamespace(manual_seed=seeds.append)
        with mock.patch.dict(sys.modules, {"torch": fake}), mock.patch.object(server, "SEED", "7"):
            for _ in range(2):
                r = self.c.post("/v1/audio/speech/clone", data={"input": "Hi."}, files={"ref_audio": ("r.wav", wav_bytes(6), "audio/wav")})
                self.assertEqual(r.status_code, 200)
        self.assertEqual(seeds, [7, 7])

    def test_gpu_build_without_a_cuda_device_warns(self):
        server._model = None
        torch = types.SimpleNamespace(set_num_threads=lambda n: None, cuda=types.SimpleNamespace(is_available=lambda: False),
                                      version=types.SimpleNamespace(cuda="12.4"))
        tts = types.SimpleNamespace(ChatterboxTTS=types.SimpleNamespace(from_local=lambda path, device: Stub()))
        hub = types.SimpleNamespace(snapshot_download=lambda *a, **k: "/nowhere")
        with mock.patch.dict(sys.modules, {"torch": torch, "chatterbox": types.ModuleType("chatterbox"), "chatterbox.tts": tts, "huggingface_hub": hub}):
            with self.assertLogs("chatterbox", "WARNING") as logs:
                server.get_model()
        self.assertTrue(any("no CUDA device" in m for m in logs.output))


if __name__ == "__main__":
    unittest.main()
