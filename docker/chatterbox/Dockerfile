# Chatterbox (original, 500M) on CPU or NVIDIA GPU. Build arg TORCH_INDEX picks the wheels:
#   cpu  (default): https://download.pytorch.org/whl/cpu      cuda: https://download.pytorch.org/whl/cu124
FROM python:3.12-slim
ARG TORCH_INDEX=https://download.pytorch.org/whl/cpu
ENV PIP_NO_CACHE_DIR=1 PYTHONUNBUFFERED=1
RUN apt-get update && apt-get install -y --no-install-recommends libsndfile1 && rm -rf /var/lib/apt/lists/*
RUN pip install torch==2.6.0 torchaudio==2.6.0 --index-url ${TORCH_INDEX}
COPY requirements.txt /tmp/requirements.txt
# setuptools<81 matters: without pkg_resources the Perth watermarker is None and the model constructor raises TypeError.
RUN pip install -r /tmp/requirements.txt --extra-index-url ${TORCH_INDEX}
# Weights revision of ResembleAI/chatterbox on Hugging Face (latest commit when checked on 2026-10-29: "Add S3Gen v3 weights").
ENV CHATTERBOX_REVISION=5bb1f6ee58e50c3b8d408bc82a6d3740c2db6e18 HF_HOME=/models
RUN useradd -m -u 1000 tts && mkdir /models && chown tts /models
USER tts
WORKDIR /app
COPY server.py .
EXPOSE 8080
VOLUME /models
# healthy = the model is loaded (the first start downloads about 3 GB of weights)
HEALTHCHECK --interval=30s --timeout=5s --start-period=600s CMD python -c "import json, sys, urllib.request; sys.exit(0 if json.load(urllib.request.urlopen('http://127.0.0.1:8080/health'))['ready'] else 1)"
CMD ["python", "server.py"]
