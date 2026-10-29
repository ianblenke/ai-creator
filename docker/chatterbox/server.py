# Chatterbox (original) behind the HTTP routes the tts stage uses. One request at a time.
# The Resemble Perth watermark is applied inside generate() and is deliberately left on (see NOTICE).
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

log = logging.getLogger("chatterbox")
logging.basicConfig(level=logging.INFO)
# Settings "F" (chosen by listening, see docs/voice-engine-bakeoff.md); override per environment.
EXAGGERATION = float(os.environ.get("CHATTERBOX_EXAGGERATION", "0.6"))
CFG_WEIGHT = float(os.environ.get("CHATTERBOX_CFG_WEIGHT", "0.3"))
TEMPERATURE = float(os.environ.get("CHATTERBOX_TEMPERATURE", "0.9"))
SEED = os.environ.get("CHATTERBOX_SEED") or None  # unset or empty = random
DEFAULT_REF = os.environ.get("CHATTERBOX_DEFAULT_REF")  # optional mounted reference for the JSON route
REVISION = os.environ.get("CHATTERBOX_REVISION")  # Hugging Face commit; the Dockerfile pins it
ENGINE_TAG = os.environ.get("VOICE_ENGINE_TAG", "chatterbox")  # compose sets one per lane
FILES = ["ve.safetensors", "t3_cfg.safetensors", "s3gen.safetensors", "tokenizer.json", "conds.pt"]

_model = None
_load_error = None
lock = threading.Lock()  # one synthesis at a time
load_lock = threading.Lock()
app = FastAPI()


def get_model():
    """Load once (the startup thread does it in the background); torch is imported here so the module and tests run without it."""
    global _model, _load_error
    with load_lock:
        if _model is None:
            try:
                import torch
                from chatterbox.tts import ChatterboxTTS
                from huggingface_hub import snapshot_download
                torch.set_num_threads(int(os.environ.get("THREADS", os.cpu_count() or 4)))
                device = "cuda" if torch.cuda.is_available() else "cpu"
                if device == "cpu" and torch.version.cuda:
                    log.warning("this is the GPU build, but no CUDA device is visible: running on CPU, many times slower "
                                "(check the NVIDIA driver and the container toolkit)")
                path = snapshot_download("ResembleAI/chatterbox", revision=REVISION, allow_patterns=FILES)
                _model = ChatterboxTTS.from_local(path, device)
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


def synth(text, ref_path):
    if not text.strip():
        raise HTTPException(400, "empty input")
    with lock:
        model = get_model()
        if SEED is not None:
            import torch
            torch.manual_seed(int(SEED))
        out = model.generate(text, audio_prompt_path=ref_path, exaggeration=EXAGGERATION,
                             cfg_weight=CFG_WEIGHT, temperature=TEMPERATURE)
    a = out.squeeze().cpu().numpy() if hasattr(out, "cpu") else np.asarray(out).squeeze()
    pcm = (np.clip(a, -1, 1) * 32767).astype("<i2")
    buf = io.BytesIO()
    with wave.open(buf, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(model.sr)
        w.writeframes(pcm.tobytes())
    return Response(buf.getvalue(), media_type="audio/wav")


class Speech(BaseModel):
    input: str
    voice: str = ""
    num_step: int | None = None


@app.get("/health")
def health():
    # ready: the model is loaded (the startup thread loads it; the first start downloads the weights first)
    # engine: tts puts it in its cache key, so a new lane, package or weights pin never reuses an old take
    return {"ok": True, "ready": _model is not None, "error": _load_error, "engine": engine_id()}


def engine_id():
    try:
        from importlib.metadata import version
        pkg = version("chatterbox-tts")
    except Exception:
        pkg = "unknown"
    return f"{ENGINE_TAG} chatterbox-tts=={pkg} weights@{REVISION or 'unpinned'}"


@app.post("/v1/audio/speech")
def speech(req: Speech):
    if not (DEFAULT_REF and os.path.exists(DEFAULT_REF)):
        raise HTTPException(400, "this lane is clone-only: send a reference clip to /v1/audio/speech/clone "
                                 "(set VOICE_REF in .env.local), or mount one and set CHATTERBOX_DEFAULT_REF")
    return synth(req.input, DEFAULT_REF)


@app.post("/v1/audio/speech/clone")
def clone(input: str = Form(...), ref_audio: UploadFile = File(...), ref_text: str = Form(""),
          language: str = Form("en"), num_step: int = Form(0)):
    # ref_text, language and num_step are accepted for transport compatibility and ignored.
    data = ref_audio.file.read()
    try:
        with wave.open(io.BytesIO(data)) as w:
            secs = w.getnframes() / w.getframerate()
        if secs < 5 or secs > 40:
            log.warning("reference clip is %.1f s; 5 to 40 s works best", secs)
    except (wave.Error, EOFError):  # EOFError: a truncated file
        raise HTTPException(400, "ref_audio is not a readable PCM WAV file (convert it: ffmpeg -i in.m4a -ac 1 -ar 24000 ref.wav)")
    with tempfile.NamedTemporaryFile(suffix=".wav") as f:
        f.write(data)
        f.flush()
        return synth(input, f.name)


if __name__ == "__main__":
    import uvicorn
    threading.Thread(target=preload, daemon=True).start()
    uvicorn.run(app, host="0.0.0.0", port=8080)
