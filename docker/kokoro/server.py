# CPU fallback voice server (Kokoro-82M): the same routes as the GPU server, so tools/stages/tts.js works unchanged.
#   POST /v1/audio/speech        JSON {input, voice, num_step} -> 24 kHz mono 16-bit WAV (num_step is ignored)
#   POST /v1/audio/speech/clone  -> 501: this fallback cannot clone
#   GET  /v1/voices              -> {"voices": [...]}      GET /health -> {"ok", "ready", "engine"} (the model loads before the server starts)
import io
import json
import os
from importlib.metadata import version
from http.server import BaseHTTPRequestHandler, HTTPServer

import numpy as np
import soundfile as sf
from kokoro import KModel, KPipeline

REPO = 'hexgrad/Kokoro-82M'
RATE = 24000
# English voices only (prefix a = American, b = British); other languages need extra phonemizer packages.
VOICES = [
    'af_heart', 'af_alloy', 'af_aoede', 'af_bella', 'af_jessica', 'af_kore', 'af_nicole', 'af_nova', 'af_river', 'af_sarah', 'af_sky',
    'am_adam', 'am_echo', 'am_eric', 'am_fenrir', 'am_liam', 'am_michael', 'am_onyx', 'am_puck', 'am_santa',
    'bf_alice', 'bf_emma', 'bf_isabella', 'bf_lily', 'bm_daniel', 'bm_fable', 'bm_george', 'bm_lewis',
]
DEFAULT_VOICE = 'af_heart'
ENGINE = f"{os.environ.get('VOICE_ENGINE_TAG', 'kokoro')} kokoro=={version('kokoro')} {REPO}"  # part of the tts cache key

model = KModel(repo_id=REPO).eval()  # downloads the weights into the cache volume on first start
pipelines = {code: KPipeline(lang_code=code, repo_id=REPO, model=model) for code in 'ab'}


def synthesize(text, voice):
    chunks = [r.audio.numpy() for r in pipelines[voice[0]](text, voice=voice) if r.audio is not None]
    if not chunks:
        raise ValueError('nothing to say')
    buf = io.BytesIO()
    sf.write(buf, np.concatenate(chunks), RATE, format='WAV', subtype='PCM_16')
    return buf.getvalue()


class Handler(BaseHTTPRequestHandler):
    def send(self, status, body, ctype='text/plain; charset=utf-8'):
        if isinstance(body, str):
            body = (body + '\n').encode()
        self.send_response(status)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == '/health':
            self.send(200, json.dumps({'ok': True, 'ready': True, 'engine': ENGINE}), 'application/json')
        elif self.path == '/v1/voices':
            self.send(200, json.dumps({'voices': VOICES, 'default': DEFAULT_VOICE}), 'application/json')
        else:
            self.send(404, 'not found')

    def do_POST(self):
        length = int(self.headers.get('Content-Length') or 0)
        body = self.rfile.read(length)
        if self.path == '/v1/audio/speech/clone':
            self.send(501, 'This CPU fallback (Kokoro) cannot clone a voice. Unset VOICE_REF and set VOICE_NAME to a Kokoro voice id, '
                           'or use a server that can clone.')
            return
        if self.path != '/v1/audio/speech':
            self.send(404, 'not found')
            return
        try:
            req = json.loads(body or b'{}')
            text = str(req.get('input') or '').strip()
            voice = req.get('voice') or DEFAULT_VOICE
        except (ValueError, AttributeError):
            self.send(400, 'expected JSON {"input": "...", "voice": "af_heart"}')
            return
        if not text:
            self.send(400, 'missing input text')
            return
        if voice not in VOICES:
            self.send(400, f'unknown voice {voice!r}; GET /v1/voices lists the ids')
            return
        try:
            self.send(200, synthesize(text, voice), 'audio/wav')
        except Exception as e:  # report, keep serving
            self.send(500, f'synthesis failed: {e}')


if __name__ == '__main__':
    print('kokoro voice server on :8080', flush=True)
    HTTPServer(('0.0.0.0', 8080), Handler).serve_forever()  # one request at a time, on purpose: CPU-bound
