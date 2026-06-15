# CORTEX Health

CORTEX Health is an AI-assisted clinical risk assessment project for patient deterioration monitoring. The repository combines a React/Firebase patient dashboard, a FastAPI agent backend, and Python machine-learning pipelines for training and evaluating clinical risk models.

[Live App](https://cortex-health-app.vercel.app)

> This project is for research, prototyping, and hackathon/demo use. It is not a substitute for clinical judgment or a certified medical device.

## What Is Inside

- `Landing Page/` - Main React 19 + Vite app with Firebase authentication, dashboard tabs, document views, health chat, assessment forms, and deployment config.
- `cortex-agent/` - FastAPI backend and agent layer for document-aware health chat, Firebase/Firestore integration, local JSON fallback storage, and ML prediction support.
- `patient_risk_model/` - Standalone patient risk model package with preprocessing, feature engineering, model training, evaluation, API serving, Dockerfile, plots, and test summaries.
- Root training scripts - `train_cortex_v3.py`, `evaluate_cortex_v3.py`, `evaluate_production.py`, and related reports for the CORTEX model workflow.
- `Assets/` and `Documents/` - Demo clinical PDFs, design assets, and project documentation.

Large datasets, local model binaries, virtual environments, service account keys, and environment files are intentionally ignored by Git.

## Main Features

- Patient dashboard with home, assessment, documents, database, analytics, and health chat views.
- Firebase Authentication and Firestore-backed user profile and assessment data.
- FastAPI backend for agent workflows, document handling, and prediction endpoints.
- ML risk scoring pipeline with clinical feature engineering, evaluation reports, and safety-oriented threshold configuration.
- Demo medical documents for testing document upload and dashboard flows.
- Dockerfiles for backend/model services and Firebase/Vercel deployment files for the frontend.

## Tech Stack

| Area | Tools |
| --- | --- |
| Frontend | React 19, Vite, React Router, Tailwind CSS, Lucide React, Axios |
| Auth/Data | Firebase Authentication, Firestore, Firebase Hosting config |
| Backend | Python, FastAPI, Uvicorn, Pydantic |
| AI/Agent | Google Generative AI, OpenAI SDK, NVIDIA API placeholder config |
| ML | pandas, NumPy, scikit-learn, XGBoost, joblib |
| Deployment | Docker, Google Cloud Run-oriented backend files, Firebase/Vercel frontend config |

## Repository Structure

```text
Cortex/
├── Assets/
│   └── demo docs/                 # Sample clinical PDFs
├── Documents/                     # Project PDFs and supporting docs
├── Landing Page/                  # Main React/Firebase frontend
│   ├── functions/                 # Firebase functions package
│   ├── login/                     # Legacy/static login page
│   ├── signup/                    # Legacy/static signup page
│   └── src/
│       ├── components/
│       ├── context/
│       ├── lib/
│       └── pages/
├── cortex-agent/
│   ├── agent/                     # Agent, database, Gemini, and ML predictor modules
│   ├── api/                       # FastAPI entrypoint
│   ├── data/                      # Local JSON fallback data
│   ├── frontend/                  # Secondary Vite frontend scaffold
│   └── models/                    # Local model training script
├── patient_risk_model/            # Standalone ML package and API
├── evaluate_cortex_v3.py
├── evaluate_production.py
├── train_cortex_model.py
├── train_cortex_v2.py
├── train_cortex_v3.py
└── threshold_config.json
```

## Prerequisites

- Node.js 18+ and npm
- Python 3.10+
- Firebase project for authentication and Firestore
- Optional: Google Cloud SDK for Cloud Run/Firebase deployment

## Frontend Setup

```bash
cd "Landing Page"
npm install
npm run dev
```

Create a local `.env` or deployment environment with values like:

```bash
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_CORTEX_API_URL=http://localhost:8000
```

## Backend Setup

```bash
cd cortex-agent
python3 -m venv cortex_env
source cortex_env/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload --port 8000
```

For local AI features, copy the example environment file and add your key:

```bash
cp .env.example .env
```

`cortex-agent/serviceAccountKey.json` and real `.env` files are ignored and should never be committed.

## Patient Risk Model Setup

```bash
cd patient_risk_model
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python train_model.py
python run_evaluation.py
```

The package includes model training, evaluation, API serving, plots, and a `test_results_summary.json` report.

## CORTEX Model Training

From the repository root:

```bash
python train_cortex_v3.py
python evaluate_cortex_v3.py
```

The training scripts expect clinical demo data locally under `Data/`. Dataset folders are ignored because clinical datasets and generated artifacts should not be published to GitHub.

## Useful Commands

```bash
# Frontend lint
cd "Landing Page"
npm run lint

# Frontend production build
cd "Landing Page"
npm run build

# Start backend API
cd cortex-agent
uvicorn api.main:app --reload --port 8000
```

## Deployment Notes

- Live Vercel app: https://cortex-health-app.vercel.app
- The frontend includes Firebase Hosting, Vercel, and Firebase Functions configuration files.
- The backend includes Dockerfiles for container-based deployment.
- Runtime secrets should be configured in the hosting platform, not committed to the repository.
- Local model artifacts such as `.pkl` files are ignored. Store production model artifacts in cloud storage, release assets, or another approved artifact store.

## Security Notes

- Do not commit `.env`, `.env.*`, Firebase service account keys, API keys, local datasets, or trained model binaries.
- Firestore rules are included in `Landing Page/firestore.rules`.
- Review CORS, Firebase security rules, and cloud IAM before using this outside a demo environment.

## Project Status

This repository currently contains multiple active parts of the CORTEX prototype: the main dashboard, an agent backend, model training/evaluation scripts, demo assets, and generated project documentation. Some local files are intentionally excluded from Git because they contain secrets, dependencies, datasets, or large model artifacts.
