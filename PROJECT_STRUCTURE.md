# CertEx Web App - Project Structure

## Overview
CertEx is a full-stack web application built with Python FastAPI backend and React frontend, designed for certificate management and analysis.

---

## Directory Structure

```
CertEx-Web-app/
│
├── 📂 backend/                      # Python FastAPI Backend (The Brain)
│   ├── 📂 app/
│   │   ├── 📂 api/                  # API Routes (Bridge to Frontend)
│   │   │   ├── endpoints.py         # REST endpoints: /analyze-file, /ask-agent, /run-ghost-factory
│   │   │   └── __init__.py
│   │   │
│   │   ├── 📂 db/                   # Database Layer
│   │   │   ├── database.py          # SQLite connection & query logic
│   │   │   └── __init__.py
│   │   │
│   │   ├── 📂 services/             # Business Logic (The Engines)
│   │   │   ├── reflexion.py         # Runtime Self-Correction Engine
│   │   │   ├── ghost_factory.py     # Synthetic Data Generator
│   │   │   ├── structurer.py        # Certificate structure parsing
│   │   │   ├── ingestion.py         # ETL & AI Client Integration
│   │   │   └── __init__.py
│   │   │
│   │   ├── main.py                  # FastAPI App Entry Point
│   │   └── __init__.py
│   │
│   ├── requirements.txt             # Python dependencies
│   ├── start_server.bat             # Server startup script
│   └── .env                         # API Keys (Ollama/OpenRouter)
│
├── 📂 frontend/                     # React Frontend (The Face)
│   ├── 📂 public/
│   │   └── index.html               # HTML template
│   │
│   ├── 📂 src/
│   │   ├── 📂 components/           # UI Building Blocks
│   │   │   ├── SqlChat.jsx          # Main Intelligence Interface
│   │   │   ├── Sidebar.jsx          # Collapsible Navigation
│   │   │   ├── ConverterDashboard.jsx # Unstructured Data ETL
│   │   │   └── SkeletonChat.jsx     # Loading skeleton UI
│   │   │
│   │   ├── App.js                   # Main Layout & Routing
│   │   ├── index.js                 # React Entry Point
│   │   └── index.css                # Tailwind/CSS Styles
│   │
│   ├── package.json                 # Node.js dependencies
│   ├── package-lock.json            # Dependency lock file
│   └── tailwind.config.js           # Tailwind CSS configuration
│
├── README.md                        # Main documentation
├── PROJECT_STRUCTURE.md             # This file
├── CHANGELOG.md                     # Version history
├── FRONTEND_UPDATES.md              # Frontend change log
└── LICENSE                          # License information
```


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
