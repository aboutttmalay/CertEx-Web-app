from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Dict, List, Any
import json
import io
import pandas as pd

from app.services import structurer
from app.services import ingestion
from app.services import reflexion   
from app.services import ghost_factory  
from app.db import database
from app.config import settings

router = APIRouter()
uploaded_dataframes = {}


def _validate_upload_size(content: bytes):
    max_bytes = settings.MAX_UPLOAD_MB * 1024 * 1024
    if len(content) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail=f"File too large. Max upload size is {settings.MAX_UPLOAD_MB}MB.",
        )


@router.get("/capabilities")
async def get_capabilities():
    return {
        "product": "CertEx",
        "supported_file_types": structurer.supported_extensions(),
        "max_upload_mb": settings.MAX_UPLOAD_MB,
        "reflexion_max_retries": reflexion.MAX_REFLEXION_RETRIES,
        "modules": [
            "analyze-file",
            "transform-data",
            "ingest-sql",
            "ask-agent",
            "run-ghost-factory",
        ],
    }


@router.get("/workflow")
async def get_workflow():
    return {
        "stages": [
            {
                "name": "Upload",
                "description": "Ingest CSV, TSV, Excel, JSON/JSONL, TXT, or Parquet.",
            },
            {
                "name": "Auto-Structure",
                "description": "Detect schema and enrich with timestamp/email/error-code fields.",
            },
            {
                "name": "SQLite Build",
                "description": "Generate SQL script and load ephemeral SQLite table.",
            },
            {
                "name": "Reflexion",
                "description": "Generate SQL, execute, catch errors, and retry with self-correction.",
            },
            {
                "name": "Simulate",
                "description": "Generate adversarial synthetic queries via Ghost Factory.",
            },
        ]
    }


@router.get("/integrity-check")
async def integrity_check():
    """Runs a lightweight runtime integrity check for core CertEx services."""
    schema_info = database.get_schema_info()
    schema_ready = schema_info != "unknown"

    model_ok, model_error = ingestion.check_model_connection()
    checks = [
        {
            "name": "api",
            "label": "Backend API",
            "status": "ok",
            "detail": "FastAPI service reachable.",
        },
        {
            "name": "model",
            "label": "LLM Endpoint",
            "status": "ok" if model_ok else "error",
            "detail": "Model endpoint reachable and authenticated." if model_ok else model_error,
        },
        {
            "name": "database",
            "label": "SQLite Workspace",
            "status": "ok" if schema_ready else "warning",
            "detail": (
                f"Active schema detected: {schema_info}."
                if schema_ready
                else "No active dataset in SQLite. Upload and ingest a file first."
            ),
        },
        {
            "name": "ghost_factory",
            "label": "Ghost Factory",
            "status": "ok" if schema_ready else "warning",
            "detail": (
                "Ready to simulate synthetic prompts."
                if schema_ready
                else "Waiting for schema before simulation can run."
            ),
        },
    ]

    if all(check["status"] == "ok" for check in checks):
        overall_status = "healthy"
    elif any(check["status"] == "error" for check in checks):
        overall_status = "degraded"
    else:
        overall_status = "needs_setup"

    return {
        "status": overall_status,
        "checks": checks,
        "summary": "Integrity check completed.",
    }

# ==========================================
#  MODULE 1: UNSTRUCTURED CONVERTER
# ==========================================

@router.post("/analyze-file")
async def analyze_file(file: UploadFile = File(...)):
    content = await file.read()
    _validate_upload_size(content)
    df, error = structurer.load_file_buffer(content, file.filename)
    if error: raise HTTPException(status_code=400, detail=error)
    df = structurer.detect_and_expand_structure(df)
    uploaded_dataframes['converter'] = df
    return {
        "filename": file.filename,
        "columns": df.columns.tolist(),
        "preview": df.head(10).fillna("").to_dict(orient="records"),
        "total_rows": len(df)
    }

@router.get("/download-dataset")
async def download_dataset(source: str = "converter"):
    if source not in uploaded_dataframes or uploaded_dataframes[source] is None:
        raise HTTPException(status_code=400, detail="No dataset available")
    df = uploaded_dataframes[source]
    csv_buffer = io.StringIO()
    df.to_csv(csv_buffer, index=False)
    return StreamingResponse(
        iter([csv_buffer.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=full_dataset.csv"}
    )

@router.post("/transform-data")
async def transform_data(file: UploadFile = File(...), mapping: str = Form(...)):
    content = await file.read()
    _validate_upload_size(content)
    df, error = structurer.load_file_buffer(content, file.filename)
    if error:
        raise HTTPException(status_code=400, detail=error)
    try: column_mapping = json.loads(mapping)
    except: raise HTTPException(status_code=400, detail="Invalid mapping JSON")
    df = structurer.detect_and_expand_structure(df) 
    clean_df, logs = structurer.clean_and_structure_data(df, column_mapping)
    stream = io.StringIO()
    clean_df.to_csv(stream, index=False)
    return StreamingResponse(
        iter([stream.getvalue()]), media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=cleaned_data.csv"}
    )

# ==========================================
#  MODULE 2: SQL INTELLIGENCE & AGENTS
# ==========================================

@router.post("/ingest-sql")
async def ingest_sql(file: UploadFile = File(...)):
    content = await file.read()
    _validate_upload_size(content)
    df, error = structurer.load_file_buffer(content, file.filename)
    if error: raise HTTPException(status_code=400, detail=error)
    script, err = ingestion.generate_sql_script(df)
    if err: raise HTTPException(status_code=500, detail=err)
    success, msg = database.run_script(script)
    if not success: raise HTTPException(status_code=500, detail=msg)
    return {"status": "success", "message": "Database built successfully"}

# --- INTELLIGENCE ENDPOINT (Updated with Reflexion) ---

class QueryRequest(BaseModel):
    question: str
    history: List[Dict[str, Any]] = [] 

@router.post("/ask-agent")
async def ask_agent(request: QueryRequest):
    """
    Uses the Reflexion Engine to self-correct SQL errors.
    Replaces the old manual stream generator with the reflexion loop.
    """
    schema_info = database.get_schema_info()
    if schema_info == "unknown":
        raise HTTPException(status_code=400, detail="No database active. Upload and ingest a dataset first.")

    model_ok, model_error = ingestion.check_model_connection()
    if not model_ok:
        raise HTTPException(status_code=503, detail=model_error)
    
    # Delegate the logic to the Reflexion Service
    return StreamingResponse(
        reflexion.reflection_loop(request.question, schema_info, request.history), 
        media_type="text/plain"
    )

# --- GHOST FACTORY ENDPOINT (New) ---

@router.post("/run-ghost-factory")
async def run_ghost_factory():
    """
    Triggers the Teacher Model to generate a Golden Dataset.
    """
    schema_info = database.get_schema_info()
    if schema_info == "unknown":
        raise HTTPException(status_code=400, detail="No database active. Upload a file first.")
        
    dataset, error = ghost_factory.generate_synthetic_dataset(schema_info, num_samples=5)
    
    if error:
        raise HTTPException(status_code=500, detail=f"Factory Error: {error}")
        
    return {"status": "success", "dataset": dataset}