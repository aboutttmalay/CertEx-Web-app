# 🛡️ CertEx Engine (Enterprise Edition)

**CertEx** is a full-stack AI application designed to transform unstructured data (PDFs, CSVs, Logs) into structured formats and enable natural language SQL querying.

Built with **FastAPI** (Backend) and **React** (Frontend).

---

## 🚀 Features

### 1. 📄 Unstructured to Structured Converter
* **Auto-Discovery:** Automatically detects emails, timestamps, and error codes in raw text.
* **Deterministic Mapping:** Users can define strict schema rules (e.g., "Must be a valid Email").
* **Live Preview:** View data transformations before downloading.

### 2. 🧠 SQL Intelligence (Chat)
* **AI Agent:** Converts natural language questions (e.g., *"Show me all errors from yesterday"*) into SQL queries.
* **Ingestion Engine:** Instantly spins up a temporary SQLite database for uploaded files.
* **Visualization:** Auto-generates tables and basic charts for query results.

---

## 🛠️ Tech Stack

* **Frontend:** React, Tailwind CSS, Lucide Icons, Axios
* **Backend:** Python, FastAPI, Pandas, SQLite
* **AI Engine:** Mistral 7B (via OpenRouter API)

---

## ⚙️ Configuration (.env)

You must configure the backend with your API keys for the AI features to work.

1.  Navigate to the `backend/` folder.
2.  Create a file named `.env`.
3.  Add the following variables:

```ini
# --- AI Provider (OpenRouter) ---
# Get your key at: [https://openrouter.ai/keys](https://openrouter.ai/keys)
ROUTER_API_KEY=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

# --- Database (Optional) ---
# Default is a local file named 'certex_data.db'
DATABASE_URL=sqlite:///./certex_data.db