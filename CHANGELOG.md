# CertEx Application - Changelog

## February 10, 2026 - Intelligence Upgrade

### Summary
Implemented the "Reflexion Engine" for self-correcting SQL generation and the "Ghost Factory" for adversarial simulation. Added support for local offline inference via Ollama.

---

## Backend Changes

### New Services
* **`backend/app/services/reflexion.py`**: Added the `reflection_loop` function. It captures SQL execution errors and recursively re-prompts the LLM with error details until a valid query is generated.
* **`backend/app/services/ghost_factory.py`**: Added `generate_synthetic_dataset` with strict JSON output parsing. Includes fallback mechanisms to prevent crashes during simulation.

### `backend/app/services/ingestion.py`
* Updated `planner_agent` to support **Local Ollama** inference.
* Added a "SQLite Cheat Sheet" to the system prompt to prevent `information_schema` errors.
* Enhanced `clean_sql` regex to extract SQL code blocks from "Reasoning" text.

### `backend/app/api/endpoints.py`
* Added `POST /run-ghost-factory` endpoint.
* Updated `POST /ask-agent` to route requests through the new Reflexion Engine instead of the raw agent.

---

## Frontend Changes

### `frontend/src/components/SqlChat.jsx`
* **Reflexion UI:** Added a collapsible "Brain" accordion in the chat bubble to display the AI's reasoning/thoughts separately from the final answer.
* **Ghost Factory Integration:** Added a "Run Simulation" button to the side panel.
* **Streaming Support:** Updated `fetch` logic to handle streaming JSON responses from the Reflexion engine.

---

## Configuration
* Updated `.env` requirements to support `OPENAI_BASE_URL` for local inference.

---

**Status:** 🟢 Production Ready (Offline Capable)