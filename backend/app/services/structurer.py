import pandas as pd
import re
import io

def load_file_buffer(file_content: bytes, filename: str):
    """Loads bytes content into a Pandas DataFrame."""
    try:
        if filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(file_content))
        elif filename.endswith(('.xls', '.xlsx')):
            df = pd.read_excel(io.BytesIO(file_content))
        else:
            return None, "Unsupported file format. Please upload CSV or Excel."
        return df, None
    except Exception as e:
        return None, str(e)

def detect_and_expand_structure(df: pd.DataFrame):
    """
    Scans for 'Raw_Content' and auto-extracts patterns (Logs, Emails).
    """
    target_col = None
    if "Raw_Content" in df.columns:
        target_col = "Raw_Content"
    else:
        text_cols = df.select_dtypes(include=['object']).columns
        if len(text_cols) > 0:
            target_col = text_cols[0]

    if not target_col:
        return df

    # Regex Logic
    df['Detected_Timestamp'] = df[target_col].astype(str).str.extract(r'\[(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2})')
    df['Detected_Email']     = df[target_col].astype(str).str.extract(r'([\w\.-]+@[\w\.-]+\.[a-zA-Z]{2,})')
    df['Detected_Error_Code']= df[target_col].astype(str).str.extract(r'Code:\s*(\d+)')
    
    return df

# --- VALIDATORS ---
def clean_email(email):
    s = str(email).strip()
    return s.lower() if re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', s) else None

def clean_phone(phone):
    digits = re.sub(r'\D', '', str(phone))
    return digits if 10 <= len(digits) <= 15 else None

def clean_currency(value):
    try:
        s = str(value).replace(',', '').replace('$', '').replace('€', '').replace('£', '').strip()
        return float(s)
    except:
        return None

def clean_date(value):
    try:
        return pd.to_datetime(value, errors='coerce').date()
    except:
        return None

def clean_and_structure_data(df, column_mapping):
    structured_data = pd.DataFrame()
    report_log = []

    for target_col, rules in column_mapping.items():
        source_col = rules['source']
        rule_type = rules['type']

        if source_col not in df.columns:
            continue

        series = df[source_col].copy()

        if rule_type == 'email': series = series.apply(clean_email)
        elif rule_type == 'phone': series = series.apply(clean_phone)
        elif rule_type == 'currency': series = series.apply(clean_currency)
        elif rule_type == 'date': series = series.apply(clean_date)
        elif rule_type == 'text': series = series.astype(str).str.strip().str.title()
        
        if series.isna().sum() > 0:
            report_log.append(f"Cleaned invalid rows in {target_col}")

        structured_data[target_col] = series

    return structured_data, report_log