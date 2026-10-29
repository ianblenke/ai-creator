# Tools image: Node, ffmpeg, Chromium (Playwright) and the Python environment for alignment and ASR. CPU only; the voice server is separate.
FROM mcr.microsoft.com/playwright:v1.64.0-noble
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg python3 python3-venv python3-pip git xz-utils tesseract-ocr \
    && rm -rf /var/lib/apt/lists/*
# The base image ships a Node release that predates the October 2026 security fixes (needs 22.23.4 or newer): install a patched one, checksum verified.
ARG NODE_VERSION=22.23.4
RUN set -e; arch=$(dpkg --print-architecture); case "$arch" in amd64) a=x64;; arm64) a=arm64;; *) echo "unsupported $arch"; exit 1;; esac; \
    f=node-v${NODE_VERSION}-linux-${a}.tar.xz; cd /tmp; \
    curl -fsSLO https://nodejs.org/dist/v${NODE_VERSION}/$f; curl -fsSLO https://nodejs.org/dist/v${NODE_VERSION}/SHASUMS256.txt; \
    grep " $f\$" SHASUMS256.txt | sha256sum -c -; \
    tar -xJf $f -C /usr/local --strip-components=1; rm -f $f SHASUMS256.txt; node -v
WORKDIR /work
COPY requirements-align.txt ./
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir -r requirements-align.txt
ENV PATH=/opt/venv/bin:$PATH MEDIA_PYTHON=/opt/venv/bin/python
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
ENTRYPOINT ["node", "tools/cli.js"]
