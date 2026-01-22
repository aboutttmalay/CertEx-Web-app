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

def planner_agent(user_question, schema_info):
    """
    Generates SQL based on the user question and schema.
    Note: We pass schema_info as an argument to keep it pure.
    """
    system_prompt = f"""
    You are a SQL Expert (SQLite).
    Table: uploaded_data
    Columns Detected: {schema_info}
    User Question: "{user_question}"
    Return ONLY valid SQL.
    """

    try:
        response = client.chat.completions.create(
            model="mistralai/mistral-7b-instruct", 
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_question}
            ],
            temperature=0.0
        )
        return response.choices[0].message.content.replace("```sql", "").replace("```", "").strip()
    except Exception as e:
        return f"-- Error: {str(e)}"