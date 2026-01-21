# CertEx Web App - Project Structure

## Overview
CertEx is a full-stack web application built with Python FastAPI backend and React frontend, designed for certificate management and analysis.

---

## Directory Structure

```
certex-web-app/
├── 📂 backend/                 # PYTHON (The Brain) - FastAPI
│   ├── 📂 app/
│   │   ├── 📂 api/             # API Routes (The "bridge" to frontend)
│   │   │   ├── endpoints.py    # Define /analyze-file, /ask-agent
│   │   ├── 📂 core/            # Config & Security
│   │   │   ├── config.py       # Load .env, API keys here
│   │   ├── 📂 services/        # BUSINESS LOGIC (Moved from 'modules')
│   │   │   ├── structurer.py   # [MOVED] logic from modules/structurer.py
│   │   │   ├── ingestion.py    # [MOVED] logic from modules/ingestion.py
│   │   │   ├── ai_engine.py    # [MOVED] Mistral/OpenRouter client logic
│   │   ├── 📂 db/              # DATABASE
│   │   │   ├── database.py     # [MOVED] logic from modules/database.py
│   │   │   ├── models.py       # SQL Alchemy models (optional upgrade)
│   │   ├── main.py             # FastAPI App Entry Point
│   ├── .env                    # [MOVED] Your API Keys
│   ├── requirements.txt        # Python dependencies
│   └── certex_data.db          # Your SQLite DB
│
├── 📂 frontend/                # JAVASCRIPT (The Face) - React
│   ├── 📂 public/              # Icons, index.html
│   ├── 📂 src/
│   │   ├── 📂 components/      # UI Building Blocks
│   │   │   ├── Sidebar.jsx     # Navigation
│   │   │   ├── FileUpload.jsx  # Drag & Drop Zone
│   │   │   ├── ChatWindow.jsx  # The SQL Chat Interface
│   │   │   ├── DataTable.jsx   # The Mapping Table
│   │   ├── 📂 pages/           # Full Screens
│   │   │   ├── Dashboard.jsx   # The "Universal Converter" Screen
│   │   │   ├── AdminPanel.jsx  # The "Ghost Factory" Screen
│   │   ├── 📂 api/             # Frontend API Calls
│   │   │   ├── client.js       # Config for axios (points to localhost:8000)
│   │   ├── App.js              # Main Layout
│   │   ├── index.css           # Tailwind/CSS Styles
│   ├── package.json            # Node.js dependencies
│   └── .gitignore
│
└── README.md                   # Documentation

```

---

## Component Descriptions

### Backend (Python/FastAPI)

#### `backend/core/config.py`
- Configuration settings
- Security/API keys management
- Load environment variables from `.env`

#### `backend/services/`
**Consolidated business logic from original 'modules' folder:**
- **structure.py**: Logic for parsing certificate structures
- **ingestion.py**: Data ingestion and processing
- **ai_engine.py**: Mistral/OpenRouter AI client integration

#### `backend/app/api/endpoints.py`
- `/analyze-file` - Endpoint to analyze uploaded certificate files
- `/ask-agent` - Endpoint for agent queries

#### `backend/db/`
- **database.py**: [MOVED] Database connection and query logic
- **models.py**: SQLAlchemy ORM models (optional)

#### `backend/main.py`
- FastAPI application entry point
- Route registration and middleware setup

#### `backend/.env`
- [MOVED] API keys and secrets
- Mistral/OpenRouter credentials

#### `backend/requirements.txt`
- All Python dependencies
- FastAPI, SQLAlchemy, etc.

#### `backend/certex_data.db`
- SQLite database file
- Stores application data

---

### Frontend (React/JavaScript)

#### `frontend/src/components/`
**Reusable UI Components:**
- **Sidebar.jsx**: Navigation menu
- **FileUpload.jsx**: Drag & drop file upload zone
- **ChatWindow.jsx**: Interactive SQL chat interface
- **DataTable.jsx**: Results mapping and display table

#### `frontend/src/pages/`
**Full-page screens:**
- **Dashboard.jsx**: "Universal Converter" - main analysis screen
- **AdminPanel.jsx**: "Ghost Factory" - admin controls screen

#### `frontend/src/api/client.js`
- Axios configuration
- Base URL: `localhost:8000` (backend)
- API request helpers

#### `frontend/App.js`
- Main application component
- Route layout and structure

#### `frontend/index.css`
- Global styles
- Tailwind CSS or custom CSS

#### `frontend/package.json`
- React dependencies
- Build scripts

---

## Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Backend** | Python, FastAPI | REST API, business logic |
| **AI Integration** | Mistral/OpenRouter API | LLM capabilities |
| **Database** | SQLite | Data persistence |
| **ORM** | SQLAlchemy (optional) | Database abstraction |
| **Frontend** | React, JavaScript | User interface |
| **HTTP Client** | Axios | API communication |
| **Styling** | Tailwind/CSS | UI styling |
| **Build Tool** | Node.js, npm | Frontend dependency management |

---

## Key Features

✅ **File Upload & Analysis** - Upload certificates for processing  
✅ **AI-Powered Chat** - Query results using natural language  
✅ **Data Mapping** - Visual table for data transformation  
✅ **Admin Panel** - Ghost Factory for backend controls  
✅ **Responsive Design** - Works on desktop and tablet

---

## Getting Started

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python main.py
```
API will run on `http://localhost:8000`

### Frontend Setup
```bash
cd frontend
npm install
npm start
```
UI will run on `http://localhost:3000`

---

## Environment Variables

Create `.env` file in `backend/`:
```
MISTRAL_API_KEY=your_key_here
OPENROUTER_API_KEY=your_key_here
DATABASE_URL=sqlite:///./certex_data.db
```

---

## Important Migrations

- ✅ **modules/** → **services/**: Business logic consolidated
- ✅ **.env relocation**: Moved from root to `backend/`
- ✅ **Database logic**: Centralized in `backend/db/`

---

*Last Updated: 20 January 2026*
