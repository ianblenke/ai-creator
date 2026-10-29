# CPU fallback voice server: Kokoro-82M (Apache-2.0 code and weights). No GPU, no cloning. See README.md here.
FROM python:3.12.12-slim-bookworm
RUN apt-get update && apt-get install -y --no-install-recommends espeak-ng && rm -rf /var/lib/apt/lists/*
# CPU-only torch wheel first, so kokoro does not pull the multi-gigabyte CUDA build
RUN pip install --no-cache-dir torch==2.11.0 --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir kokoro==0.9.4 misaki[en]==0.9.4 soundfile==0.13.1 \
    https://github.com/explosion/spacy-models/releases/download/en_core_web_sm-3.8.0/en_core_web_sm-3.8.0-py3-none-any.whl
WORKDIR /app
COPY server.py .
EXPOSE 8080
CMD ["python", "-u", "server.py"]
