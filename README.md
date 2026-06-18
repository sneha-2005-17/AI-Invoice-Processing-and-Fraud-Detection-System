# AI Invoice Processing and Fraud Detection System

Enterprise-ready invoice processing platform with OCR extraction, fraud scoring, RAG-based finance policy assistance, LangGraph multi-agent workflows, analytics dashboards, RBAC, evaluation metrics, and deployment configuration.

## Architecture

- `backend/`: FastAPI API, PostgreSQL models, OCR, fraud engine, RAG, LangGraph agents, reporting, evaluation, and security controls.
- `frontend/`: Next.js 15 dashboard app with TypeScript, Tailwind CSS, ShadCN-style components, Recharts analytics, dark mode, upload flows, policy chat, and admin screens.
- `docker-compose.yml`: Local PostgreSQL, ChromaDB, backend, and frontend stack.

## Quick Start

1. Copy environment files:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

2. Start with Docker:

```bash
docker compose up --build
```

3. Open:

- Frontend: <http://localhost:3001>
- Backend API: <http://localhost:8000/docs>

## Backend Local Development

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Frontend Local Development

```bash
cd frontend
npm install
npm run dev
```

## Required Environment Variables

Backend:

- `DATABASE_URL`
- `SECRET_KEY`
- `GEMINI_API_KEY`
- `CHROMA_HOST`
- `CHROMA_PORT`
- `ALLOWED_ORIGINS`

Frontend:

- `NEXT_PUBLIC_API_URL`

## Deployment

- Deploy `frontend/` to Vercel and set `NEXT_PUBLIC_API_URL` to the Render backend URL.
- Deploy `backend/` to Render using `backend/render.yaml`.
- Use managed PostgreSQL for production.
- Use a persistent ChromaDB service or managed vector store for production RAG data.

## Resume Statement

Built an AI Invoice Processing and Fraud Detection System using OCR, RAG, LangGraph multi-agent workflows, fraud risk scoring, finance policy compliance verification, analytics dashboards, and enterprise-grade security controls.
