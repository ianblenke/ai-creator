# OmniVoice on CPU (no GPU needed). Small base + CPU-only torch wheels, not the large GPU image.
FROM python:3.12-slim
ENV PIP_NO_CACHE_DIR=1 PYTHONUNBUFFERED=1
RUN pip install torch==2.11.0+cpu torchaudio==2.11.0+cpu --index-url https://download.pytorch.org/whl/cpu
RUN pip install omnivoice==0.1.5 transformers==5.21.0 fastapi==0.162.0 uvicorn==0.54.0 python-multipart==0.0.32 soundfile==0.14.0 \
    torch==2.11.0+cpu torchaudio==2.11.0+cpu --extra-index-url https://download.pytorch.org/whl/cpu
WORKDIR /app
COPY server.py .
EXPOSE 8080
HEALTHCHECK --interval=30s --timeout=5s --start-period=600s CMD python -c "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8080/health')"
CMD ["python", "server.py"]
