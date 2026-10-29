#!/bin/bash
# Render an episode and run EVERY verification, in order. Usage: tools/pipeline.sh episodes/<id>
# In the tools container: docker compose run --rm --entrypoint bash media tools/pipeline.sh examples/ep01-kettle
#   1 determinism sweep (a swept frame must equal a pure render; a failure prints when MEDIA_DETERMINISM_DB=44 is safe)
#   2 render (the clip cache re-renders only scenes whose code or audio changed)   3 clip verification against a fresh render (worst frame vs 36 dB)
#   4 encode (clean and burned-in subtitles; encode verifies fps, size, codecs)     5 decode errors, loudness, silences
#   6 final audio check: the delivered video's own audio transcribed against the whole script (skipped for VOICE_TRANSPORT=fixture)
# Env: WORKERS (render workers; default: the render stage's own), VERIFY_STEP (clip verification step, default 0.35 s).
# Prints a short summary; the full output of each step goes to out/pipeline.log. Exit code 1 if any step fails.
cd "$(dirname "$0")/.." || exit 2
EP=${1:?usage: tools/pipeline.sh episodes/<id>}
TRANSPORT=${VOICE_TRANSPORT:-$(node -e "import('./tools/env.js').then((m) => console.log(m.loadEnv().VOICE_TRANSPORT || ''))")}
N=$(basename "$EP"); LOG="$EP/out/pipeline.log"; mkdir -p "$EP/out"; : > "$LOG"
fail=0
step() { echo "== $1" | tee -a "$LOG"; }
step "determinism";   node tools/cli.js render "$EP" --check --step 1 >>"$LOG" 2>&1 || { echo "DETERMINISM FAILED (see $LOG)"; grep -v "syncing" "$LOG" | tail -8; exit 1; }
grep -E "determinism check passed" "$LOG" | tail -1
step "render";        node tools/cli.js render "$EP" ${WORKERS:+--workers "$WORKERS"} >>"$LOG" 2>&1 || { echo "RENDER FAILED (see $LOG)"; tail -8 "$LOG"; exit 1; }
step "clip verification"; node tools/cli.js verifyclips "$EP" --step "${VERIFY_STEP:-0.35}" 2>&1 | tee -a "$LOG" | grep -E "clip verification|match a fresh|MISMATCH|flagged|dB" | tail -6; [ "${PIPESTATUS[0]}" = 0 ] || fail=1
step "encode";        node tools/cli.js encode "$EP" >>"$LOG" 2>&1 && node tools/cli.js encode "$EP" --burn >>"$LOG" 2>&1 || { echo "ENCODE FAILED"; tail -8 "$LOG"; exit 1; }
grep -E "verified .* fps" "$LOG" | tail -2
for f in "$EP/out/$N.mp4"; do
  echo "decode errors: $(ffmpeg -v error -i "$f" -f null - 2>&1 | head -3 | tr '\n' ' ')"
  ffmpeg -nostats -i "$f" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+I:|Peak:" | tail -2 | tr '\n' ' '; echo
  echo "silences >1.5s: $(ffmpeg -nostats -i "$f" -af silencedetect=noise=-50dB:d=1.5 -f null - 2>&1 | grep -c silence_start)"
done | tee -a "$LOG"
if [ "$TRANSPORT" = fixture ]; then step "final audio check"; echo "skipped: fixture audio is silence"
else step "final audio check"; node tools/cli.js finalcheck "$EP" 2>&1 | grep -v "syncing\|rsync" | tee -a "$LOG" | head -12; [ "${PIPESTATUS[0]}" = 0 ] || fail=1; fi
echo "PIPELINE-DONE-$N (exit $fail)"; exit $fail
