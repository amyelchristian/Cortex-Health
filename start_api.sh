#!/usr/bin/env bash
# start_api.sh – launch the Patient Risk API from ANY working directory
#
# Usage:
#   ./start_api.sh              (default: port 8000, auto-reload OFF)
#   ./start_api.sh --reload     (enable auto-reload for development)
#   PORT=9000 ./start_api.sh    (use a custom port)

set -euo pipefail

# Resolve the patient_risk_model directory relative to this script's location
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
APP_DIR="${SCRIPT_DIR}/patient_risk_model"

PORT="${PORT:-8000}"

if [[ ! -f "${APP_DIR}/api.py" ]]; then
  echo "ERROR: Cannot find ${APP_DIR}/api.py"
  echo "       Make sure this script lives next to the patient_risk_model/ folder."
  exit 1
fi

if [[ ! -f "${APP_DIR}/patient_risk_model.pkl" ]]; then
  echo "WARNING: Model artefacts not found in ${APP_DIR}/"
  echo "         Run:  cd patient_risk_model && python3 train_model.py"
  echo "         Then re-run this script."
  exit 1
fi

echo "Starting Patient Risk API..."
echo "  App dir : ${APP_DIR}"
echo "  URL     : http://0.0.0.0:${PORT}"
echo "  Docs    : http://127.0.0.1:${PORT}/docs"
echo ""

# --app-dir tells uvicorn where to look for the 'api' module
exec uvicorn api:app \
  --app-dir "${APP_DIR}" \
  --host 0.0.0.0 \
  --port "${PORT}" \
  "$@"
