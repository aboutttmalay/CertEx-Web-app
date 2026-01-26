from fastapi import APIRouter, UploadFile, File, HTTPException, Form
from fastapi.responses import JSONResponse, StreamingResponse
from pydantic import BaseModel
from typing import Dict, List, Any
import json
import io
import pandas as pd

from app.services import structurer
from app.services import ingestion
from app.db import database

router = APIRouter()
uploaded_dataframes = {}

# --- MODULE 1: UNSTRUCTURED CONVERTER ---
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

# --- MODULE 2: SQL INTELLIGENCE ---
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

class QueryRequest(BaseModel):
    question: str
    history: List[Dict[str, Any]] = [] 

@router.post("/ask-agent")
async def ask_agent(request: QueryRequest):
    """
    Streams: SQL Text -> Separator -> JSON Data
    """
    schema_info = database.get_schema_info()
    
    async def generate_stream():
        full_sql_accumulator = ""
        
        # 1. Stream the Thought Process (SQL Generation)
        for chunk in ingestion.planner_agent(request.question, schema_info, request.history):
            full_sql_accumulator += chunk
            yield chunk 
        
        # 2. Execution Phase
        clean_sql = ingestion.clean_sql(full_sql_accumulator)
        yield "|||RESULT_START|||"
        
        if clean_sql.startswith("-- Error"):
            yield json.dumps({"type": "error", "message": clean_sql})
            return

        df, error = database.execute_query(clean_sql)
        
        if error:
            yield json.dumps({"type": "sql_error", "message": error, "sql": clean_sql})
        else:
            response_data = {
                "type": "success",
                "sql": clean_sql,
                "columns": df.columns.tolist(),
                "results": df.fillna("").to_dict(orient='records')
            }
            yield json.dumps(response_data)

    return StreamingResponse(generate_stream(), media_type="text/plain")