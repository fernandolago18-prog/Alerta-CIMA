import os
import pandas as pd
from supabase import create_client, Client
from dotenv import load_dotenv

def get_supabase_client() -> Client:
    """Read credentials from .env.local and return Supabase client."""
    # Since the script runs locally in python_sync or root, we want to load the root .env.local
    dotenv_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), '.env.local')
    if not os.path.exists(dotenv_path):
        dotenv_path = '.env.local'
    load_dotenv(dotenv_path)

    url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
    key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

    if not url or not key:
        raise ValueError("Supabase URL and Key must be defined in .env.local")

    return create_client(url, key)

def process_and_upload_excel(file_path: str):
    """
    Reads the Excel file, transforms it to match the 'inventario_local' table schema,
    and performs an UPSERT to Supabase.
    """
    print(f"Reading Excel file from {file_path}")
    
    try:
        # 1. Read the Excel file
        df = pd.read_excel(file_path)
        
        # 2. Transform the dataframe to match our database schema
        # Expected Excel Columns (modify these if your Excel has different header names):
        # 'Código Nacional', 'Descripción', 'Lote', 'F. Caducidad', 'Stock'
        # 
        # Target DB SQL schema: cn, nombre, lote, fecha_caducidad, cantidad
        
        # Mapping dict: Excel column -> DB column
        column_mapping = {
            'Código Nacional': 'cn',
            'Descripción': 'nombre',
            'Lote': 'lote',
            'F. Caducidad': 'fecha_caducidad',
            'Stock': 'cantidad'
        }
        
        # Keep only mapped columns that exist in the dataframe
        cols_to_keep = [col for col in column_mapping.keys() if col in df.columns]
        df = df[cols_to_keep]
        
        # Rename columns to match DB
        df = df.rename(columns=column_mapping)
        
        # Clean up NaNs before string casting to prevent creating literal "nan" strings
        df = df.fillna('')

        # Some basic cleanup
        df['cn'] = df['cn'].astype(str).str.strip()
        df['cn'] = df['cn'].replace('nan', '')
        
        df['lote'] = df['lote'].astype(str).str.strip().str.upper().str.replace(' ', '', regex=False).str.replace('-', '', regex=False)
        df['lote'] = df['lote'].replace('NAN', '')
        
        # Convert date column if it exists and to string ISO format safely
        if 'fecha_caducidad' in df.columns:
            df['fecha_caducidad'] = pd.to_datetime(df['fecha_caducidad'], errors='coerce').dt.strftime('%Y-%m-%d')
            
        # Convert remaining NaNs, NaTs, and empty strings completely to None for Supabase JSON handling
        df = df.where(pd.notna(df), None)
        df = df.replace({'': None})
        
        records = df.to_dict(orient='records')
        print(f"Extracted {len(records)} local records. Uploading to Supabase...")
        
        # 3. Upload to Supabase ('inventario_local' table)
        client = get_supabase_client()
        
        # Upsert: Will update if (cn, lote) exists perfectly, or insert if new. 
        # (Assuming the UNIQUE constraint on cn, lote is active in SQL)
        response = client.table("inventario_local").upsert(
            records, 
            on_conflict="cn,lote"
        ).execute()
        
        print("Upload completed successfully!")
        return response

    except Exception as e:
        print(f"An error occurred: {e}")
        raise

if __name__ == "__main__":
    import sys
    
    # Path to the mock excel or real excel provided as argument
    # Example: python sync.py ../mock_inventario.xlsx
    
    if len(sys.argv) > 1:
        excel_path = sys.argv[1]
    else:
        # Default mock path
        excel_path = "mock_inventario.xlsx"
        
    process_and_upload_excel(excel_path)
