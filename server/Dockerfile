# Render Dockerfile for BunkBuddy Server
# Build context: repo root
FROM node:20-slim

# Install Python, pip, system deps, and Chromium
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    chromium \
    unzip \
    tar \
    libgbm1 \
    libasound2 \
    libatk1.0-0 \
    libatk-bridge2.0-0 \
    libcups2 \
    libdbus-1-3 \
    libdrm2 \
    libgtk-3-0 \
    libnspr4 \
    libnss3 \
    libxcomposite1 \
    libxdamage1 \
    libxrandr2 \
    xdg-utils \
    fonts-liberation \
    fonts-noto-color-emoji \
    libglib2.0-0 \
    libsm6 \
    libxext6 \
    libxrender1 \
    && rm -rf /var/lib/apt/lists/*

# Tell Puppeteer to skip downloading Chrome during npm install
ENV PUPPETEER_SKIP_DOWNLOAD=1

# Set working directory
WORKDIR /app

# Copy package files from server subdirectory
COPY server/package*.json ./

# Install Node dependencies (skip Puppeteer Chrome download)
RUN npm ci --only=production

# Copy entire repo so all imports resolve (server/, experimental/, etc.)
COPY . .

# Install Python dependencies for OCR
RUN python3 -m venv /opt/venv && /opt/venv/bin/pip install --no-cache-dir ddddocr
ENV PATH="/opt/venv/bin:$PATH"

# Expose port
EXPOSE 3001

# Use system Chromium installed above
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV OMP_NUM_THREADS=1
ENV OPENBLAS_NUM_THREADS=1
ENV MKL_NUM_THREADS=1
ENV VECLIB_MAXIMUM_THREADS=1
ENV NUMEXPR_NUM_THREADS=1

# Start the server
CMD ["node", "server/server.js"]
