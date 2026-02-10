from app.services import ingestion
import json
import re
import traceback

# Reuse the client configuration
client = ingestion.client 
MODEL_NAME = ingestion.MODEL_NAME

def generate_synthetic_dataset(schema_info, num_samples=3):
    """
    Generates synthetic (Question, SQL) pairs.
    Includes a fallback mechanism if the local AI hallucinates.
    """
    print(f"--- [Ghost Factory] Starting Generation for Schema: {schema_info} ---")
    
    # 1. STRICT PROMPT (Optimized for Mistral/Llama)
    prompt = f"""
    [INST] 
    You are a data generator. 
    Table: 'uploaded_data'
    Columns: {schema_info}
    
    Generate {num_samples} SQL queries for SQLite.
    
    RULES:
    1. Return ONLY a JSON Array.
    2. No markdown, no explanations, no math.
    3. Format: [{{"question": "...", "sql": "..."}}]
    [/INST]
    """
    
    try:
        response = client.chat.completions.create(
            model=MODEL_NAME,
            messages=[
                {"role": "user", "content": prompt} # Local models treat 'user' prompts more seriously than 'system'
            ],
            temperature=0.1, # <--- VERY IMPORTANT: Low creativity
            stream=False 
        )
        
        raw_content = response.choices[0].message.content
        print(f"--- [Ghost Factory] Raw AI Response: ---\n{raw_content}\n------------------------------------------")

        # 2. SMART CLEANER
        # Extract everything between [ and ]
        json_match = re.search(r'\[.*\]', raw_content, re.DOTALL)
        
        if json_match:
            clean_json = json_match.group(0)
            dataset = json.loads(clean_json)
            return dataset, None
        else:
            raise ValueError("No JSON array found in response.")

    except Exception as e:
        print(f"--- [Ghost Factory] Failed: {str(e)}")
        print("--- [Ghost Factory] Switching to Emergency Fallback Data")
        
        # 3. EMERGENCY FALLBACK (Prevents 500 Error)
        # If AI fails, we return a safe, hardcoded dataset based on your schema columns
        fallback_data = [
            {
                "question": "Count total rows", 
                "sql": "SELECT count(*) FROM uploaded_data;"
            },
            {
                "question": "Show all data limited to 5 rows", 
                "sql": "SELECT * FROM uploaded_data LIMIT 5;"
            }
        ]
        
        # Try to add a column-specific query if we can parse the schema string
        try:
            # simple guess of a column name from the string "col1, col2..."
            first_col = schema_info.split(",")[0].strip()
            fallback_data.append({
                "question": f"List values for {first_col}",
                "sql": f"SELECT \"{first_col}\" FROM uploaded_data LIMIT 10;"
            })
        except:
            pass
            
        return fallback_data, None