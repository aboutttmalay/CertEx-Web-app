from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Dict
import json
import io

# --- CHANGED: Direct imports for flat structure ---
from app.services import structurer
from app.services import ingestion
from app.db import database

router = APIRouter()

# --- MODULE 1: UNSTRUCTURED CONVERTER ---

@router.post("/analyze-file")
async def analyze_file(file: UploadFile = File(...)):
    """
    Receives a file, runs Auto-Discovery, returns Schema & Preview.
    """
    content = await file.read()
    df, error = structurer.load_file_buffer(content, file.filename)
    
    if error:
        raise HTTPException(status_code=400, detail=error)
    
    # Run the "Brain" (Auto-Discovery)
    df = structurer.detect_and_expand_structure(df)
    
    # Return JSON for React to render the table
    return {
        "filename": file.filename,
        "columns": df.columns.tolist(),
        "preview": df.head(5).fillna("").to_dict(orient="records"),
        "total_rows": len(df)
    }

@router.post("/transform-data")
async def transform_data(
    file: UploadFile = File(...), 
    mapping: str = Form(...) # JSON string of mapping rules
):
    """
    Receives file + mapping rules, returns the Cleaned CSV.
    """
    # 1. Load File
    content = await file.read()
    df, _ = structurer.load_file_buffer(content, file.filename)
    
    # 2. Parse Mapping JSON from React
    try:
        column_mapping = json.loads(mapping)
    except:
        raise HTTPException(status_code=400, detail="Invalid mapping JSON")
    
    # 3. Apply Deterministic Logic
    # Run auto-discovery first in case user mapped a detected column
    df = structurer.detect_and_expand_structure(df) 
    clean_df, logs = structurer.clean_and_structure_data(df, column_mapping)
    
    # 4. Return as downloadable CSV
    stream = io.StringIO()
    clean_df.to_csv(stream, index=False)
    response = StreamingResponse(iter([stream.getvalue()]), media_type="text/csv")
    response.headers["Content-Disposition"] = "attachment; filename=cleaned_data.csv"
    return response

# --- MODULE 2: SQL INTELLIGENCE ---

@router.post("/ingest-sql")
async def ingest_sql(file: UploadFile = File(...)):
    """
    Uploads a file directly to the SQLite Database.
    """
    content = await file.read()
    df, error = structurer.load_file_buffer(content, file.filename)
    
    if error: raise HTTPException(status_code=400, detail=error)
    
    # Generate SQL Script
    script, err = ingestion.generate_sql_script(df)
    if err: raise HTTPException(status_code=500, detail=err)
    
    # Run Script
    success, msg = database.run_script(script)
    if not success: raise HTTPException(status_code=500, detail=msg)
    
    return {"status": "success", "message": "Database built successfully"}

class QueryRequest(BaseModel):
    question: str

@router.post("/ask-agent")
async def ask_agent(request: QueryRequest):
    """
    The Chatbot Endpoint.
    """
    # 1. Get Schema Context
    schema_info = database.get_schema_info()
    
    # 2. Plan SQL (Mistral)
    generated_sql = ingestion.planner_agent(request.question, schema_info)
    
    if generated_sql.startswith("-- Error"):
        return {"type": "error", "message": generated_sql}
        
    # 3. Execute SQL
    df, error = database.execute_query(generated_sql)
    
    if error:
        return {"type": "sql_error", "message": error, "sql": generated_sql}
        
    return {
        "type": "data",
        "sql": generated_sql,
        "results": df.fillna("").to_dict(orient="records")
    }