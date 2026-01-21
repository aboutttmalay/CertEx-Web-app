import sqlite3
import pandas as pd

DB_NAME = "certex_data.db"

def run_script(sql_script):
    """Executes a full SQL script (Create + Insert)."""
    try:
        conn = sqlite3.connect(DB_NAME)
        cursor = conn.cursor()
        cursor.execute("DROP TABLE IF EXISTS uploaded_data")
        cursor.executescript(sql_script)
        conn.commit()
        conn.close()
        return True, "Database built successfully!"
    except Exception as e:
        return False, str(e)

def execute_query(query):
    """Executes a SELECT query and returns data."""
    try:
        conn = sqlite3.connect(DB_NAME)
        df = pd.read_sql(query, conn)
        conn.close()
        return df, None
    except Exception as e:
        return None, str(e)

def get_schema_info():
    """Helper to get column names for the Agent."""
    try:
        df, _ = execute_query("PRAGMA table_info(uploaded_data);")
        if df is not None and not df.empty:
            return ", ".join(df['name'].tolist())
    except:
        pass
    return "unknown"