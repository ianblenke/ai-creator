# Audio8-TTS-Realistic-0.6B (Apache-2.0 per its model card) on an NVIDIA GPU or CPU. Build arg TORCH_INDEX picks the wheels:
#   cpu (default): https://download.pytorch.org/whl/cpu      cuda: https://download.pytorch.org/whl/cu124
FROM python:3.12-slim
ARG TORCH_INDEX=https://download.pytorch.org/whl/cpu
ENV PIP_NO_CACHE_DIR=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends libsndfile1 && rm -rf /var/lib/apt/lists/*
RUN pip install torch==2.6.0 torchaudio==2.6.0 --index-url ${TORCH_INDEX}
COPY requirements.txt /tmp/requirements.txt
RUN pip install -r /tmp/requirements.txt --extra-index-url ${TORCH_INDEX}
# Weights AND custom code revision of Edge0/Audio8-TTS-Realistic-0.6b (latest commit when read on 2026-11-01). The model runs its own Python
# (trust_remote_code), so the pin is what keeps that code the code that was read: bump it only after reading the new files.
ENV AUDIO8_REVISION=1e857568bfd4f02931aca3988ee773a44d2d26d3 HF_HOME=/models
RUN useradd -m -u 1000 tts && mkdir /models && chown tts /models
USER tts
WORKDIR /app
COPY server.py .
EXPOSE 8080
VOLUME /models
HEALTHCHECK --interval=30s --timeout=5s --start-period=600s CMD python -c "import json, sys, urllib.request; sys.exit(0 if json.load(urllib.request.urlopen('http://127.0.0.1:8080/health'))['ready'] else 1)"
CMD ["python", "server.py"]
