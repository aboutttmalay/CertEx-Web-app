import pandas as pd
import re
import io
import json
import xml.etree.ElementTree as ET
# import pdfplumber  # requires: pip install pdfplumber
# from unstructured.partition.auto import partition # requires: pip install unstructured

def load_file_buffer(content: bytes, filename: str):
    """
    Universal data loader. Converts any file type into a normalized Pandas DataFrame.
    """
    ext = filename.split('.')[-1].lower()
    try:
        if ext == 'csv':
            df = pd.read_csv(io.BytesIO(content))
        elif ext in ['xls', 'xlsx']:
            df = pd.read_excel(io.BytesIO(content))
        elif ext == 'json':
            # Handle both JSON arrays and nested JSON objects
            data = json.loads(content.decode('utf-8'))
            df = pd.json_normalize(data)
        elif ext == 'xml':
            # Basic XML flattening
            df = pd.read_xml(io.BytesIO(content))
        elif ext == 'pdf':
            # Strategy: Extract tables directly, or extract text and use an LLM to parse into tabular format.
            import pdfplumber
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                all_tables = []
                for page in pdf.pages:
                    table = page.extract_table()
                    if table:
                        all_tables.extend(table)
                if all_tables:
                    # Assume first row is header
                    df = pd.DataFrame(all_tables[1:], columns=all_tables[0])
                else:
                    return None, "No tabular data found in PDF. Use LLM OCR extraction."
        elif ext == 'txt':
            # For unstructured text, you might chunk it and store it as a single column DataFrame
            # which can then be parsed by your `detect_and_expand_structure` using local LLMs.
            text = content.decode('utf-8')
            chunks = [text[i:i+500] for i in range(0, len(text), 500)]
            df = pd.DataFrame({"raw_text_chunk": chunks})
        else:
            return None, f"Unsupported file extension: {ext}"
        # Standardize column names (remove weird characters)
        df.columns = df.columns.str.strip().str.replace('[^0-9a-zA-Z_]', '_', regex=True)
        return df, None
    except Exception as e:
        return None, f"Failed to parse {ext} file: {str(e)}"

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