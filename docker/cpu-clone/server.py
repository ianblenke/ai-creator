# OmniVoice on CPU behind the same HTTP routes the tts stage uses. One request at a time (CPU bound).
import io
import os
import tempfile
import threading
from importlib.metadata import version

import soundfile as sf
import torch
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import Response
from omnivoice import OmniVoice
from pydantic import BaseModel

# Same preset names as the GPU server; any other name is passed through as a voice-design instruct string.
PRESETS = {"male_en": "male, american accent", "female_en": "female, american accent"}
DEFAULT_STEPS = int(os.environ.get("NUM_STEPS", "32"))

torch.set_num_threads(int(os.environ.get("THREADS", os.cpu_count() or 4)))
MODEL = os.environ.get("MODEL", "k2-fsa/OmniVoice")
ENGINE = f"{os.environ.get('VOICE_ENGINE_TAG', 'omnivoice-cpu')} omnivoice=={version('omnivoice')} {MODEL}"  # part of the tts cache key
model = OmniVoice.from_pretrained(MODEL, device_map="cpu", dtype=torch.float32)  # before the server starts, so /health means ready
lock = threading.Lock()
app = FastAPI()


def wav(**kwargs):
    with lock:
        try:
            audio = model.generate(**kwargs)[0]
        except ValueError as e:  # e.g. an unknown voice-design word, or an empty reference after silence removal
            raise HTTPException(400, str(e))
    buf = io.BytesIO()
    sf.write(buf, audio, model.sampling_rate, format="WAV", subtype="PCM_16")
    return Response(buf.getvalue(), media_type="audio/wav")


class Speech(BaseModel):
    input: str
    voice: str = "male_en"
    num_step: int | None = None


@app.get("/health")
def health():
    return {"ok": True, "ready": True, "engine": ENGINE}


@app.get("/v1/voices")
def voices():
    return {"voices": [{"name": k, "instruct": v} for k, v in PRESETS.items()]}


@app.post("/v1/audio/speech")
def speech(req: Speech):
    if not req.input.strip():
        raise HTTPException(400, "empty input")
    return wav(text=req.input, instruct=PRESETS.get(req.voice, req.voice), num_step=req.num_step or DEFAULT_STEPS)


@app.post("/v1/audio/speech/clone")
def clone(input: str = Form(...), ref_audio: UploadFile = File(...), ref_text: str = Form(...),
          language: str = Form("en"), num_step: int = Form(0)):
    with tempfile.NamedTemporaryFile(suffix=".wav") as f:
        f.write(ref_audio.file.read())
        f.flush()
        return wav(text=input, ref_audio=f.name, ref_text=ref_text, language=language, num_step=num_step or DEFAULT_STEPS)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8080)
