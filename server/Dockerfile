# Render Dockerfile for BunkBuddy Server
# Includes Node.js, Python, Chromium deps for Puppeteer, and ddddocr

FROM node:20-slim

# Install Python, pip, and system dependencies for Chromium/Puppeteer
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    chromium \
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
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm ci --only=production

# Copy server code
COPY . .

# Install Python dependencies for OCR
RUN pip3 install --no-cache-dir ddddocr

# Expose port
EXPOSE 3001

# Start the server
CMD ["node", "server.js"]
