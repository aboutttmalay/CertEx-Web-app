# CertEx Web App - Project Structure

## Overview
CertEx is a full-stack web application built with Python FastAPI backend and React frontend, designed for certificate management and analysis.

---

## Directory Structure

certex-web-app/ ├── 📂 backend/ # PYTHON (The Brain) - FastAPI │ ├── 📂 app/ │ │ ├── 📂 api/ # API Routes (The "bridge" to frontend) │ │ │ ├── endpoints.py # Define /analyze-file, /ask-agent, /run-ghost-factory │ │ ├── 📂 core/ # Config & Security │ │ │ ├── config.py # Load .env, API keys here │ │ ├── 📂 services/ # BUSINESS LOGIC (The Engines) │ │ │ ├── reflexion.py # [NEW] Runtime Self-Correction Engine │ │ │ ├── ghost_factory.py # [NEW] Synthetic Data Generator │ │ │ ├── structurer.py # Parsing certificate structures │ │ │ ├── ingestion.py # ETL & AI Client Integration │ │ ├── 📂 db/ # DATABASE │ │ │ ├── database.py # Database connection and query logic │ │ ├── main.py # FastAPI App Entry Point │ ├── .env # API Keys (Ollama/OpenRouter) │ ├── requirements.txt # Python dependencies │ └── certex_data.db # Local SQLite DB │ ├── 📂 frontend/ # JAVASCRIPT (The Face) - React │ ├── 📂 public/ # Icons, index.html │ ├── 📂 src/ │ │ ├── 📂 components/ # UI Building Blocks │ │ │ ├── Sidebar.jsx # Collapsible Navigation │ │ │ ├── SqlChat.jsx # Main Intelligence Interface │ │ │ ├── ConverterDashboard.jsx # Unstructured Data ETL │ │ ├── 📂 api/ # Frontend API Calls │ │ │ ├── client.js # Config for axios │ │ ├── App.js # Main Layout & Routing │ │ ├── index.css # Tailwind/CSS Styles │ ├── package.json # Node.js dependencies │ └── .gitignore │ └── README.md # Documentation


---

## Key Components

### Backend Services (`backend/app/services/`)
- **Reflexion Engine (`reflexion.py`)**: Intercepts SQL errors from the database and loops them back to the AI for self-correction.
- **Ghost Factory (`ghost_factory.py`)**: Generates synthetic "User Question" and "SQL" pairs to stress-test the schema.
- **Ingestion (`ingestion.py`)**: Handles file parsing, auto-column detection (`Detected_Email`, etc.), and LLM client management.

### Frontend Components (`frontend/src/components/`)
- **SqlChat.jsx**: The central hub. Handles chat history, displays the "Reflexion" reasoning steps, and provides data visualization.
- **Sidebar.jsx**: Manages navigation state and module switching.

---

## Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Python, FastAPI | REST API, business logic |
| **AI Integration** | Ollama (Local) / OpenRouter | LLM Inference |
| **Database** | SQLite | Data persistence |
| **Frontend** | React, JavaScript | User interface |
| **Styling** | Tailwind/CSS | UI styling |

---

*Last Updated: February 2026*
