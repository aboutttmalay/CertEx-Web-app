import os
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime
import re
from app.config import settings

load_dotenv()

# ==========================================
#  CONFIGURATION: LOCAL (OLLAMA)
# ==========================================
client = OpenAI(
    api_key=settings.OPENAI_API_KEY,
    base_url=settings.OPENAI_BASE_URL,
)
MODEL_NAME = settings.OPENAI_MODEL

# ==========================================
#  LOGIC
# ==========================================

def check_model_connection():
    """Validate that the configured model endpoint is reachable before streaming."""
    try:
        # This probes the OpenAI-compatible endpoint and fails fast if service is down.
        client.models.list()
        return True, None
    except Exception as e:
        message = (
            f"Cannot connect to model endpoint at {settings.OPENAI_BASE_URL}. "
            f"Configured model: {MODEL_NAME}. "
            "Start Ollama (`ollama serve`) and ensure the model exists "
            f"(`ollama pull {MODEL_NAME}`), or update OPENAI_BASE_URL/OPENAI_MODEL in backend/.env. "
            f"Underlying error: {str(e)}"
        )
        return False, message

def add_detected_columns(df):
    """Add auto-detected columns if they don't already exist."""
    if "Detected_Timestamp" not in df.columns:
        df["Detected_Timestamp"] = datetime.now().isoformat()
    if "Detected_Email" not in df.columns:
        df["Detected_Email"] = df.apply(
            lambda row: next((str(val) for val in row if isinstance(val, str) and '@' in val), "unknown@example.com"),
            axis=1
        )
    if "Detected_Error_Code" not in df.columns:
        df["Detected_Error_Code"] = "NO_ERROR"
    return df

def generate_sql_script(df, table_name="uploaded_data"):
    """Generates CREATE and INSERT statements from a DataFrame."""
    try:
        df = add_detected_columns(df)
        type_mapping = {'int64': 'INTEGER', 'float64': 'REAL', 'object': 'TEXT', 'bool': 'INTEGER'}
        columns_sql = [f'"{col}" {type_mapping.get(str(dtype), "TEXT")}' for col, dtype in df.dtypes.items()]
        cols_str = ",\n    ".join(columns_sql)
        create_sql = f"CREATE TABLE IF NOT EXISTS {table_name} (\n    {cols_str}\n);"
        
        insert_statements = []
        for _, row in df.iterrows():
            values = []
            for val in row:
                if pd.isna(val): values.append("NULL")
                elif isinstance(val, str): 
                    safe_val = val.replace("'", "''").replace("\n", " ").replace("\r", "")
                    values.append(f"'{safe_val}'")
                else: values.append(str(val))
            insert_statements.append(f"INSERT INTO {table_name} VALUES ({', '.join(values)});")
            
        return f"{create_sql}\n" + "\n".join(insert_statements), None
    except Exception as e:
        return None, str(e)

def clean_sql(raw_text):
    """
    Smart Cleaner: Extracts SQL from Markdown blocks to allow 'Reasoning' text.
    """
    # 1. Try to find content inside ```sql ... ``` blocks
    match = re.search(r"```sql\s*(.*?)```", raw_text, re.DOTALL | re.IGNORECASE)
    if match:
        return match.group(1).strip()
    
    # 2. Fallback: Extract first SQL statement ending with semicolon
    statement_match = re.search(
        r"((SELECT|WITH|PRAGMA)\b[\s\S]*?;)",
        raw_text,
        re.IGNORECASE,
    )
    if statement_match:
        return statement_match.group(1).strip()

    # 3. Last-resort cleanup
    clean = raw_text.replace("```sql", "").replace("```", "").strip()
    clean = re.sub(r"^(SQL|Query|Executed SQL|Here is):?\s*", "", clean, flags=re.IGNORECASE).strip()
    return clean

def planner_agent(user_question, schema_info, history=None):
    """
    Generates Reasoning + SQL using the local model.
    """
    system_prompt = f"""
    You are a high-performance SQL Agent for a SQLite database.
    
    Table Name: 'uploaded_data'
    Schema: {schema_info}
    
    --- SQLITE CHEAT SHEET (CRITICAL) ---
    1. Count Rows: SELECT count(*) FROM uploaded_data;
    2. Count Columns: SELECT count(*) FROM pragma_table_info('uploaded_data');
    3. List Columns: SELECT name FROM pragma_table_info('uploaded_data');
    4. FORBIDDEN: Do NOT use information_schema. It does not exist in SQLite.
    -------------------------------------

    Instructions:
    1. First, Explain your thought process briefly (e.g., "To find X, I need to query Y...").
    2. Then, Output the SQL query strictly inside a markdown block: 
       ```sql
       SELECT ...
       ```
    """

    messages = [{"role": "system", "content": system_prompt}]

    # Inject History
    if history is None:
        history = []

    recent_history = history[-6:]
    for msg in recent_history:
        role = "assistant" if msg['role'] == 'ai' else "user"
        content = str(msg.get('content', ''))
        # We strip old SQL to keep context clean
        if "```sql" in content:
            # Keep the reasoning, discard the code for context window efficiency if needed
            # For now, just passing it is fine
            pass
        messages.append({"role": role, "content": content})

    messages.append({"role": "user", "content": user_question})

    try:
        stream = client.chat.completions.create(
            model=MODEL_NAME,   
            messages=messages,
            temperature=0.0, 
            stream=True 
        )
        
        for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content

    except Exception as e:
        yield f"-- Error: {str(e)}"