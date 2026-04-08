import pandas as pd
import re
import io


SUPPORTED_FILE_EXTENSIONS = {
    ".csv",
    ".tsv",
    ".txt",
    ".xls",
    ".xlsx",
    ".json",
    ".jsonl",
    ".ndjson",
    ".parquet",
}


def supported_extensions():
    return sorted(SUPPORTED_FILE_EXTENSIONS)


def _has_ext(filename: str, *extensions: str) -> bool:
    name = (filename or "").lower()
    return name.endswith(extensions)

def load_file_buffer(file_content: bytes, filename: str):
    """Loads bytes content into a Pandas DataFrame."""
    try:
        if _has_ext(filename, '.csv'):
            df = pd.read_csv(io.BytesIO(file_content))
        elif _has_ext(filename, '.tsv'):
            df = pd.read_csv(io.BytesIO(file_content), sep='\t')
        elif _has_ext(filename, '.txt'):
            # Treat txt as delimiter-detected table/log-like text.
            df = pd.read_csv(io.BytesIO(file_content), sep=None, engine='python')
        elif _has_ext(filename, '.xls', '.xlsx'):
            df = pd.read_excel(io.BytesIO(file_content))
        elif _has_ext(filename, '.json'):
            raw = io.BytesIO(file_content)
            try:
                df = pd.read_json(raw)
            except ValueError:
                raw.seek(0)
                df = pd.read_json(raw, lines=True)
        elif _has_ext(filename, '.jsonl', '.ndjson'):
            df = pd.read_json(io.BytesIO(file_content), lines=True)
        elif _has_ext(filename, '.parquet'):
            df = pd.read_parquet(io.BytesIO(file_content))
        else:
            return None, (
                "Unsupported file format. Supported types: "
                + ", ".join(supported_extensions())
            )

        if df is None or df.empty:
            return None, "Dataset is empty or could not be parsed into tabular rows."

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