# cpu-clone: OmniVoice on CPU (your own voice, no GPU)

    docker compose --profile cpu-clone up -d voice-cpu-clone    # first start downloads about 3.1 GB of weights (time not recorded)
    mkdir -p episodes && cp -r examples/ep01-kettle episodes/my-kettle   # never synthesize into the shipped example
    docker compose run --rm media tts episodes/my-kettle

The service answers as `voice` on the compose network, so `VOICE_URL` stays `http://voice:8080`. Run one voice profile at a time
(`chatterbox`, `chatterbox-cpu`, `gpu`, `stub`, `cpu`, `cpu-clone` all claim that name). Set `VOICE_TRANSPORT=http`, `VOICE_REF` and `VOICE_REF_TEXT` in `.env.local` to clone your voice
(see `docs/voice-reference.md`). Without `VOICE_TRANSPORT=http` the `.env.example` default `fixture` stays in force and `tts` writes
silence without asking the server.

Routes (same as the GPU server): `POST /v1/audio/speech` (JSON `input`, `voice`, `num_step`; `male_en` and `female_en` map to
"male/female, american accent", any other value is passed as a voice-design string), `POST /v1/audio/speech/clone` (multipart
`input`, `ref_audio`, `ref_text`, `language`, `num_step`), `GET /v1/voices`, `GET /health`. Output: 24 kHz mono 16-bit WAV.
Requests run one at a time. The `tts` stage always sends `num_step` (`VOICE_NUM_STEP`, 24 unless you change it), so the server's own
`NUM_STEPS` default only applies to requests that send none.

Measured 2026-10-27, 16-core x86_64, 92 GB RAM, no GPU, one 4.7 s sentence, one run per row except where a range is given:

| route | steps | wall time | x real time |
|---|---|---|---|
| preset `male_en` | 32 | 31 s | 6.5 |
| clone (5 s reference) | 32 | 51 to 53 s | 11 |
| clone | 24 | 40 s | 8.4 |
| clone | 16 | 27 s | 5.8 |

So the example (182.8 s of narration) would take roughly 26 minutes to clone at 24 steps, more with retakes (an estimate, not a timed run). Image 2.5 GB, build about 2 minutes,
model cache 3.1 GB more, 1.3 GB RAM while idle. Raw output is quiet (about -25 LUFS); the tts stage normalizes it.

**Licence (not legal advice):** the OmniVoice code page says Apache-2.0, but the model card says the WEIGHTS are CC-BY-NC
(non-commercial), read 2026-10-28 by an AI agent (`docs/licences.md`). If your channel is or becomes monetized, or a sponsor or
client is involved, that licence may not allow it. Read the model card yourself before any such use. For a cloned voice without
that term, use the Chatterbox lane (`docker/chatterbox/README.md`).
