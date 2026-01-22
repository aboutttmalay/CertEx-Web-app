import os
import pandas as pd
from openai import OpenAI
from dotenv import load_dotenv
from datetime import datetime
import re

load_dotenv()

# We load environment variables here for the service
client = OpenAI(
    api_key=os.getenv("ROUTER_API_KEY"),
    base_url="https://openrouter.ai/api/v1"
)

def add_detected_columns(df):
    """Add auto-detected columns if they don't already exist."""
    # Add Detected_Timestamp if not present
    if "Detected_Timestamp" not in df.columns:
        df["Detected_Timestamp"] = datetime.now().isoformat()
    
    # Add Detected_Email if not present (detect from data or use placeholder)
    if "Detected_Email" not in df.columns:
        df["Detected_Email"] = df.apply(
            lambda row: next(
                (str(val) for val in row if isinstance(val, str) and '@' in val),
                "unknown@example.com"
            ),
            axis=1
        )
    
    # Add Detected_Error_Code if not present
    if "Detected_Error_Code" not in df.columns:
        df["Detected_Error_Code"] = "NO_ERROR"
    
    return df

def smart_parse_dataframe(df):
    """(Kept same as original) Adaptive Parsing Logic"""
    if "Raw_Content" not in df.columns: return df

    # ... [Same Regex logic as your uploaded file] ...
    # (For brevity, assuming the extraction logic is copied here)
    
    return df

def generate_sql_script(df, table_name="uploaded_data"):
    """Generates CREATE and INSERT statements from a DataFrame."""
    try:
        # Run smart parser first
        df = smart_parse_dataframe(df)
        
        # Add auto-detected columns
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

# --- CHANGED: Added history parameter and context loop ---
def planner_agent(user_question, schema_info, history=[]):
    """
    Generates SQL based on the user question, schema, and conversation history.
    """
    # --- CHANGED: Stronger instruction to use immediate context ---
    system_prompt = f"""
    You are a readonly SQL Generator for SQLite.
    Table: uploaded_data
    Columns: {schema_info}
    Current Question: "{user_question}"
    
    CRITICAL RULES:
    1. Output ONLY a single SQL query. NO text, NO markdown.
    2. RESOLVE PRONOUNS ('it', 'them', 'that') using the LAST message.
    3. INHERIT FILTERS: If the user asks to "count them" or "average it" after a filtering query, YOU MUST RE-APPLY THE SAME 'WHERE' CLAUSE.
       - Bad: SELECT COUNT(*) FROM uploaded_data;
       - Good: SELECT COUNT(*) FROM uploaded_data WHERE Detected_Error_Code = 'Error';
    """

    messages = [{"role": "system", "content": system_prompt}]

    # Inject History (Limit to last 3 turns to prevent confusion)
    # We slice history[-6:] to keep only the last 3 user/ai pairs
    recent_history = history[-6:] 
    
    for msg in recent_history:
        role = "assistant" if msg['role'] == "ai" else "user"
        content = str(msg.get('content', ''))
        # Clean out "Executed SQL:" labels from history so AI sees raw code
        clean_content = re.sub(r"^(Executed SQL:|SQL:|Query:)\s*", "", content).strip()
        
        if clean_content and "Error" not in clean_content: 
            messages.append({"role": role, "content": clean_content})

    messages.append({"role": "user", "content": user_question})

    try:
        response = client.chat.completions.create(
            model="mistralai/mistral-7b-instruct", 
            messages=messages,
            temperature=0.0
        )
        
        # Cleanup Logic
        raw = response.choices[0].message.content.strip()
        clean = raw.replace("```sql", "").replace("```", "").strip()
        clean = re.sub(r"^(SQL|Query|Executed SQL|Here is):?\s*", "", clean, flags=re.IGNORECASE).strip()
        
        # Extract last SELECT
        match = re.search(r'(SELECT.*)', clean, re.IGNORECASE | re.DOTALL)
        if match: return match.group(1).strip()
        return clean

    except Exception as e:
        return f"-- Error: {str(e)}"