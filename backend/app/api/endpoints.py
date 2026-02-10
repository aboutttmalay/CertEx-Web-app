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

router = APIRouter()
uploaded_dataframes = {}

# ==========================================
#  MODULE 1: UNSTRUCTURED CONVERTER
# ==========================================

@router.post("/analyze-file")
async def analyze_file(file: UploadFile = File(...)):
    content = await file.read()
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
    df, _ = structurer.load_file_buffer(content, file.filename)
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