FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first (for Docker layer caching)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code and model artifacts
COPY api.py .
COPY config.py .
COPY prediction_service.py .
COPY feature_engineering.py .
COPY patient_risk_model.pkl .
COPY scaler.pkl .
COPY feature_names.pkl .

# Cloud Run sets the PORT environment variable
ENV PORT=8080

# Run the FastAPI server
CMD exec uvicorn api:app --host 0.0.0.0 --port ${PORT} --workers 1
