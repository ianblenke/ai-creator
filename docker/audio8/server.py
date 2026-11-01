# Audio8-TTS-Realistic-0.6B behind the HTTP routes the tts stage uses. One request at a time.
# Cloning needs the reference clip AND its exact transcript (ref_text; tts sends VOICE_REF_TEXT). Output: 24 kHz mono 16-bit WAV.
import io
import logging
import os
import tempfile
import threading
import wave

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from pydantic import BaseModel

log = logging.getLogger("audio8")
logging.basicConfig(level=logging.INFO)
MODEL_ID = "Edge0/Audio8-TTS-Realistic-0.6b"
TEMPERATURE = float(os.environ.get("AUDIO8_TEMPERATURE", "0.8"))
TOP_P = float(os.environ.get("AUDIO8_TOP_P", "0.95"))
TOP_K = int(os.environ.get("AUDIO8_TOP_K", "50"))
MAX_NEW_TOKENS = int(os.environ.get("AUDIO8_MAX_NEW_TOKENS", "1024"))  # about 21.5 tokens per second of audio
SEED = os.environ.get("AUDIO8_SEED") or None  # unset or empty = random
REVISION = os.environ.get("AUDIO8_REVISION")
ENGINE_TAG = os.environ.get("VOICE_ENGINE_TAG", "audio8")
OUT_SR = 24000

_model = None
_processor = None
_load_error = None
lock = threading.Lock()  # one synthesis at a time
load_lock = threading.Lock()
app = FastAPI()


def get_model():
    """Load once (the startup thread does it in the background); torch is imported here so the module and tests run without it."""
    global _model, _processor, _load_error
    with load_lock:
        if _model is None:
            try:
                import torch
                from huggingface_hub import snapshot_download
                from transformers import AutoModel, AutoProcessor
                device = "cuda" if torch.cuda.is_available() else "cpu"
                if device == "cpu" and torch.version.cuda:
                    log.warning("this is the GPU build, but no CUDA device is visible: running on CPU, many times slower")
                path = snapshot_download(MODEL_ID, revision=REVISION, token=False)  # public repo: no token is ever sent
                _processor = AutoProcessor.from_pretrained(path, trust_remote_code=True)
                dtype = torch.bfloat16 if device == "cuda" else torch.float32
                _model = AutoModel.from_pretrained(path, trust_remote_code=True, dtype=dtype).eval().to(device)
                _load_error = None
                log.info("model loaded on %s (revision %s)", device, REVISION)
            except Exception as e:
                _load_error = f"{type(e).__name__}: {e}"
                raise
    return _model


def preload():
    try:
        get_model()
    except Exception:
        log.exception("model load failed; /health reports the error")


def to_wav(a, sr):
    if sr != OUT_SR:
        import torch
        import torchaudio.functional as F
        a = F.resample(torch.from_numpy(a).float()[None], sr, OUT_SR)[0].numpy()
    pcm = (np.clip(a, -1, 1) * 32767).astype("<i2")
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(OUT_SR)
        w.writeframes(pcm.tobytes())
    return buf.getvalue()


def synth(text, ref_path, ref_text):
    if not text.strip():
        raise HTTPException(400, "empty input")
    if not ref_text.strip():
        raise HTTPException(400, "this lane needs the exact words spoken in the reference clip: set VOICE_REF_TEXT in .env.local")
    import torch
    with lock:
        model = get_model()
        if SEED is not None:
            torch.manual_seed(int(SEED))
        dev = next(model.parameters()).device
        inputs = _processor(text=[text], reference_audio=[ref_path], reference_text=[ref_text], return_tensors="pt")
        inputs = {k: v.to(dev) for k, v in inputs.items()}
        with torch.inference_mode():
            out = model.generate(**inputs, max_new_tokens=MAX_NEW_TOKENS, temperature=TEMPERATURE, top_p=TOP_P, top_k=TOP_K,
                                 do_sample=True, return_dict_in_generate=True)
            waves, lengths = model.decode_audio(out.codes)
        a = waves[0, : int(lengths[0])].float().cpu().numpy()
        sr = model.config.codec_sample_rate
    return Response(to_wav(a, sr), media_type="audio/wav")


class Speech(BaseModel):
    input: str
    voice: str = ""
    num_step: int | None = None


@app.get("/health")
def health():
    # engine: tts puts it in its cache key, so a new lane, pin or sampling setting never reuses an old take
    return {"ok": True, "ready": _model is not None, "error": _load_error, "engine": engine_id()}


def engine_id():
    return (f"{ENGINE_TAG} audio8-realistic-0.6b weights@{REVISION or 'unpinned'} "
            f"t={TEMPERATURE} top_p={TOP_P} top_k={TOP_K}")


@app.post("/v1/audio/speech")
def speech(req: Speech):
    raise HTTPException(400, "this lane is clone-only: send a reference clip and its transcript to /v1/audio/speech/clone "
                             "(set VOICE_REF and VOICE_REF_TEXT in .env.local)")


@app.post("/v1/audio/speech/clone")
def clone(input: str = Form(...), ref_audio: UploadFile = File(...), ref_text: str = Form(""),
          language: str = Form("en"), num_step: int = Form(0)):
    # language and num_step are accepted for transport compatibility and ignored.
    data = ref_audio.file.read()
    try:
        with wave.open(io.BytesIO(data)) as w:
            secs = w.getnframes() / w.getframerate()
        if secs < 5 or secs > 40:
            log.warning("reference clip is %.1f s; 5 to 40 s works best", secs)
    except (wave.Error, EOFError):
        raise HTTPException(400, "ref_audio is not a readable PCM WAV file (convert it: ffmpeg -i in.m4a -ac 1 -ar 24000 ref.wav)")
    with tempfile.NamedTemporaryFile(suffix=".wav") as f:
        f.write(data)
        f.flush()
        return synth(input, f.name, ref_text)


if __name__ == "__main__":
    import uvicorn
    threading.Thread(target=preload, daemon=True).start()
    uvicorn.run(app, host="0.0.0.0", port=8080)
