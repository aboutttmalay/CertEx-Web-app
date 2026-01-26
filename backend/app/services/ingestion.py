import os
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime
import re

load_dotenv()

client = OpenAI(
    api_key=os.getenv("ROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

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

def clean_sql(raw_sql):
    """Helper to clean the raw LLM output into executable SQL."""
    clean = raw_sql.replace("```sql", "").replace("```", "").strip()
    clean = re.sub(r"^(SQL|Query|Executed SQL|Here is):?\s*", "", clean, flags=re.IGNORECASE).strip()
    return clean

def planner_agent(user_question, schema_info, history=[]):
    """
    Generates SQL using Mistral 7B with Streaming enabled.
    Yields chunks of text instead of returning a full string.
    """
    # --- FIX: Explicitly state the Table Name ---
    system_prompt = f"""
    You are a read-only SQL Agent for a SQLite database.
    
    The table name is: 'uploaded_data' (ALWAYS use this table name).
    The columns are: {schema_info}
    
    Rules:
    1. Output ONLY valid SQL. No explanations.
    2. Use 'LIKE' for text searches.
    3. Do not use Markdown (```). 
    4. If the question is unsafe (DROP/DELETE), reply with '-- Error: Unsafe Query'.
    5. Resolve pronouns (it, them) using the context.
    """

    messages = [{"role": "system", "content": system_prompt}]

    # Inject History (Limit to last 3 turns)
    recent_history = history[-6:] 
    for msg in recent_history:
        role = "assistant" if msg['role'] == 'ai' else "user"
        content = str(msg.get('content', ''))
        clean_content = re.sub(r"^(Executed SQL:|SQL:|Query:)\s*", "", content).strip()
        if clean_content and "Error" not in clean_content: 
            messages.append({"role": role, "content": clean_content})

    messages.append({"role": "user", "content": user_question})

    try:
        # --- ENABLE STREAMING ---
        stream = client.chat.completions.create(
            model="mistralai/mistral-7b-instruct", 
            messages=messages,
            temperature=0.0,
            stream=True  # <--- Key Change: Streaming Enabled
        )
        
        # Yield chunks as they arrive
        for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content

    except Exception as e:
        yield f"-- Error: {str(e)}"