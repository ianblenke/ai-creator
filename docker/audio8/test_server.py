# Offline tests with a stub model (no download):  python -m unittest discover docker/audio8
# Needs: torch fastapi httpx python-multipart numpy (the stub still builds tensors; httpx is only for the test client).
import io
import os
import sys
import unittest
import wave

import torch
from fastapi.testclient import TestClient

sys.path.insert(0, os.path.dirname(__file__))
import server


class Stub(torch.nn.Module):
    calls = []

    def __init__(self):
        super().__init__()
        self.p = torch.nn.Parameter(torch.zeros(1))
        self.config = type("C", (), {"codec_sample_rate": 44100})()

    def generate(self, **kw):
        Stub.calls.append(kw)
        return type("O", (), {"codes": None})()

    def decode_audio(self, codes):
        return torch.zeros(1, 44100), torch.tensor([44100])


def stub_processor(**kw):
    return {"x": torch.zeros(1)}


def wav_bytes(secs):
    b = io.BytesIO()
    with wave.open(b, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(24000)
        w.writeframes(b"\0\0" * int(24000 * secs))
    return b.getvalue()


class T(unittest.TestCase):
    def setUp(self):
        server._model, server._processor = Stub(), stub_processor
        Stub.calls.clear()
        self.c = TestClient(server.app)

    def post(self, **data):
        return self.c.post("/v1/audio/speech/clone", data=data, files={"ref_audio": ("ref.wav", wav_bytes(6), "audio/wav")})

    def test_clone_returns_mono_24k_wav_resampled_from_the_codec_rate(self):
        r = self.post(input="Hello.", ref_text="The words.")
        self.assertEqual(r.status_code, 200)
        with wave.open(io.BytesIO(r.content)) as w:
            self.assertEqual((w.getnchannels(), w.getframerate(), w.getnframes()), (1, 24000, 24000))
        kw = Stub.calls[0]
        self.assertEqual((kw["temperature"], kw["top_p"], kw["top_k"]), (0.8, 0.95, 50))

    def test_missing_reference_text_is_400_and_says_what_to_set(self):
        r = self.post(input="Hello.")
        self.assertEqual(r.status_code, 400)
        self.assertIn("VOICE_REF_TEXT", r.json()["detail"])

    def test_empty_input_is_400(self):
        self.assertEqual(self.post(input=" ", ref_text="x").status_code, 400)

    def test_json_route_explains_clone_only(self):
        r = self.c.post("/v1/audio/speech", json={"input": "Hello."})
        self.assertEqual(r.status_code, 400)
        self.assertIn("clone-only", r.json()["detail"])

    def test_health_engine_names_the_lane_pin_and_sampling(self):
        h = self.c.get("/health").json()
        self.assertTrue(h["ready"])
        self.assertIn("audio8-realistic-0.6b", h["engine"])
        self.assertIn("t=0.8", h["engine"])


if __name__ == "__main__":
    unittest.main()
