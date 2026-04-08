import json
from app.services import ingestion
from app.db import database

MAX_REFLEXION_RETRIES = 3

async def reflection_loop(question, schema_info, history, max_retries=MAX_REFLEXION_RETRIES):
    """
    The Reflexion Engine:
    Stream Thoughts -> Generate SQL -> Execute -> Self-Correct if needed.
    """
    current_history = history.copy()
    attempt = 0
    
    while attempt < max_retries:
        attempt += 1
        full_response_accumulator = ""
        
        # 1. Stream the Thought Process & SQL
        try:
            agent_generator = ingestion.planner_agent(question, schema_info, current_history)
            for chunk in agent_generator:
                full_response_accumulator += chunk
                yield chunk 
        except Exception as e:
            yield f"-- Critical Agent Error: {str(e)}"
            return

        # 2. Extract ONLY the SQL from the reasoning text
        clean_sql = ingestion.clean_sql(full_response_accumulator)
        
        if not clean_sql or clean_sql.startswith("-- Error"):
            yield "|||RESULT_START|||"
            # If no SQL found, maybe it's just chatting. Return the text as is.
            if not clean_sql: 
                # Create a dummy error to stop execution but show text
                yield json.dumps({"type": "error", "message": "No executable SQL found in response."})
            else:
                yield json.dumps({"type": "error", "message": clean_sql})
            return

        # 3. Execution Attempt
        df, error = database.execute_query(clean_sql)
        
        if error:
            # --- SMART ERROR HANDLING (Reflexion Logic) ---
            hint = ""
            if "no such table" in str(error).lower() and "information_schema" in clean_sql.lower():
                hint = "HINT: SQLite does not have information_schema. Use 'PRAGMA table_info(table_name)' to get column metadata."
            
            # Feed the error + hint back to the AI
            reflexion_msg = f"\n\n-- ❌ Execution Failed: {error}\n-- 🧠 Reflexion Engine: {hint} Retrying ({attempt}/{max_retries})...\n\n"
            yield reflexion_msg
            
            current_history.append({"role": "ai", "content": full_response_accumulator})
            current_history.append({"role": "user", "content": f"The previous query failed: {error}. {hint} Please correct the SQL."})
            continue
        
        else:
            # --- SUCCESS ---
            yield "|||RESULT_START|||"
            response_data = {
                "type": "success",
                "sql": clean_sql,
                "columns": df.columns.tolist(),
                "results": df.fillna("").to_dict(orient='records'),
                "reflexion_steps": attempt
            }
            yield json.dumps(response_data)
            return

    # If retries exhausted
    yield "|||RESULT_START|||"
    yield json.dumps({"type": "error", "message": "Reflexion failed. Too many errors."})