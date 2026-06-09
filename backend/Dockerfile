FROM python:3.10-slim

WORKDIR /app

# Install build tools in case any pip packages need compiling
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Default fallback port. Render/Railway will override this with PORT env var.
ENV PORT=8000

CMD uvicorn app.main:app --host 0.0.0.0 --port $PORT
