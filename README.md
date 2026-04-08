# 🛡️ CertEx: The Air-Gapped AI Data Analyst

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![Python](https://img.shields.io/badge/python-3.10%2B-blue) ![React](https://img.shields.io/badge/react-18.2-cyan) ![Status](https://img.shields.io/badge/status-Enterprise%20Ready-green)

**CertEx** is a local-first intelligence layer that converts enterprise data into structured SQL databases on the fly. It features a **Self-Correcting "Reflexion" Engine** that guarantees accurate SQL generation and a **"Ghost Factory"** for adversarial stress-testing.

> **Why CertEx?** Unlike generic AI wrappers, CertEx runs fully locally (via Ollama/Mistral) ensures **Zero Data Leakage**, making it compliant for Finance, Healthcare, and Audit sectors.

---

## 🧠 Core Architecture

CertEx operates on a "Brain-Translator-Hands" architecture designed for mathematical certainty in data analysis.

### 1. The Reflexion Engine (Runtime Self-Correction)

- **What it is:** A recursive loop that catches SQL errors in real-time.
- **How it works:** If the AI generates invalid SQL (e.g., querying a non-existent column), the **Reflexion Engine** intercepts the database error, feeds it back to the AI with a "Correction Prompt," and regenerates the query automatically.
- **Result:** Mathematically verified answers, minimizing hallucinations.

### 2. The Ghost Factory (Adversarial Simulation)

- **What it is:** A synthetic data generator that acts as a "Teacher Model."
- **How it works:** It analyzes your uploaded schema and mathematically generates thousands of complex "User Questions" and "Ground Truth SQL" pairs.
- **Use Case:** Used to stress-test the system or fine-tune smaller local models (SLMs) on your specific data.

### 3. Intelligent Ingestion Layer

- **Auto-Discovery:** Automatically detects and indexes metadata:
  - `Detected_Timestamp`: ISO 8601 normalization.
  - `Detected_Email`: PII scanning and extraction.
  - `Detected_Error_Code`: Log anomaly tagging.

---

## 🚀 Key Features

### 🖥️ Enterprise Frontend

- **Workflow Studio:** OpenAI-style pipeline view showing how CertEx processes data from upload to validated SQL answers.
- **Collapsible Navigation:** A responsive, space-efficient sidebar with smooth `transition-all` animations.
- **Persistent State:** Chat history and database ingestion state are saved via `localStorage`, surviving page refreshes.
- **Unified Data Preview:** Live, low-latency preview of large datasets (limited to 10 rows for speed) with **Full CSV Download** capability.
- **Multi-Format Ingestion:** Instant processing of `.csv`, `.tsv`, `.xls`, `.xlsx`, `.json`, `.jsonl`, `.ndjson`, `.txt`, and `.parquet` into SQLite.

### 🔐 Security & Compliance

- **Air-Gapped Ready:** Supports local LLM inference via **Ollama**.
- **Ephemeral Databases:** Data lives in temporary SQLite instances; nothing is stored in the cloud.
- **Audit Trail:** Every AI decision is logged in the chat history.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | **FastAPI** (Python) | High-performance Async API |
| **Frontend** | **React** + **Tailwind** | Responsive, modern UI/UX |
| **Database** | **SQLite** / **Pandas** | In-memory data structuring |
| **AI Inference** | **Ollama** (Local) or **OpenRouter** | Mistral 7B / Llama 3.2 |
| **State Mgmt** | **LocalStorage API** | Frontend persistence |

---

## ⚡ Quick Start

### 1. Backend Setup (The Brain)

```bash
cd backend

# 1. Install dependencies
pip install -r requirements.txt

# 2. Configure Environment
# Create a .env file. For local use, point to Ollama:
# OPENAI_BASE_URL=http://localhost:11434/v1
# OPENAI_API_KEY=ollama
# OPENAI_MODEL=mistral
# CERTEX_MAX_UPLOAD_MB=25
# CERTEX_CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# 3. Start local model server (required for Reflexion)
# In a separate terminal:
# ollama serve
# ollama pull mistral

# 4. Start the Server
uvicorn app.main:app --reload --port 8000
```

Server running at: http://localhost:8000

### 2. Frontend Setup (The Face)

```bash
cd frontend

# 1. Install Node modules
npm install

# 2. Start the React App
# Optional for non-local deployments:
# set REACT_APP_API_BASE_URL=http://your-api-host:8000
npm start
```

UI running at: http://localhost:3000

---

## 📚 API Documentation

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/analyze-file` | POST | Ingests raw files and returns schema preview. |
| `/api/transform-data` | POST | Applies deterministic field mapping + validation and returns cleaned CSV. |
| `/api/ingest-sql` | POST | Builds the SQLite database and runs auto-discovery. |
| `/api/ask-agent` | POST | Reflexion Engine endpoint. Streams reasoning + SQL + Data. |
| `/api/run-ghost-factory` | POST | Triggers the Teacher Model to generate synthetic training data. |
| `/api/download-dataset` | GET | Exports the full cleaned dataset as CSV. |
| `/api/capabilities` | GET | Returns runtime capabilities (formats, limits, enabled modules). |
| `/api/workflow` | GET | Returns OpenAI-style CertEx stage definitions for the frontend. |

---

## 🧭 CertEx Workflow (OpenAI-Style)

1. **Upload:** Accept enterprise dataset files and parse into DataFrame.
2. **Auto-Structure:** Detect useful fields like timestamps, emails, and error codes.
3. **Build SQL:** Generate deterministic schema and load ephemeral SQLite table.
4. **Reason + Execute:** Use Reflexion to generate SQL, execute, and self-correct on failure.
5. **Simulate:** Run Ghost Factory to generate synthetic edge-case prompts for validation.

---

## 🏭 Production Readiness Checklist

- Configure `.env` with model endpoint, API key, model name, upload limit, and CORS policy.
- Set `REACT_APP_API_BASE_URL` in frontend for environment-specific backend routing.
- Deploy backend behind a reverse proxy (Nginx/Caddy) with request limits and TLS.
- Add API auth (JWT/API key gateway) before internet exposure.
- Store structured logs and metrics (request latency, failed SQL retries, ingestion failures).
- Run load tests with large CSV/Parquet datasets before go-live.

---

## 🤝 Contributing

- Fork the repository.
- Create a feature branch (`git checkout -b feature/amazing-feature`).
- Commit your changes (`git commit -m 'feat: Add AmazingFeature'`).
- Push to the branch (`git push origin feature/amazing-feature`).
- Open a Pull Request.

---

## 📄 License

Distributed under the MIT License. See LICENSE for more information.

---

© 2026 CertEx Inc. Built for the Future of Data.
