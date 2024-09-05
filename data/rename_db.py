import os
import psycopg2
from psycopg2 import OperationalError, Error
from dotenv import load_dotenv

def connect_db(host, dbname, user, password=None):
    """
    Establishes a connection to the PostgreSQL database.
    """
    try:
        conn_params = {
            "host": host,
            "dbname": dbname,
            "user": user,
        }
        
        if password is not None:
            conn_params["password"] = password
        
        conn = psycopg2.connect(**conn_params)
        return conn
    except OperationalError as e:
        print(f"Error connecting to the database: {e}")
        return None

def rename_columns(conn, table_name, column_mapping):
    """
    Renames columns in the specified table according to the column mapping.
    """
    try:
        with conn.cursor() as cur:
            for old_name, new_name in column_mapping.items():
                alter_query = f"""
                    ALTER TABLE {table_name}
                    RENAME COLUMN {old_name} TO {new_name};
                """
                cur.execute(alter_query)
                print(f"Renamed column '{old_name}' to '{new_name}' in table '{table_name}'")
            conn.commit()
    except Error as e:
        conn.rollback()
        print(f"Error renaming columns in table '{table_name}': {e}")

def main():
    # Load environment variables
    load_dotenv()
    
    # Database connection details
    host = os.getenv("DB_HOST")
    dbname = os.getenv("DB_NAME")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    
    # Connect to the database
    conn = connect_db(host, dbname, user, password)
    if not conn:
        print("Database connection failed. Exiting.")
        return
    
    # Define column renaming mappings for each table
    column_mappings = {
        'adm0_country': {
            'fid': 'field_id',
            'shape_leng': 'shape_length',
            'adm0_en': 'admin0_english',
            'adm0_pcode': 'admin0_pcode',
            'adm0_ref': 'admin0_ref',
            'adm0alt1en': 'admin0_alt1_english',
            'adm0alt2en': 'admin0_alt2_english',
            'validon': 'valid_on',
            'validto': 'valid_to',
            '_ogr_geometry_': 'ogr_geometry'
        },
        'adm1_division': {
            'fid': 'field_id',
            'shape_leng': 'shape_length',
            'adm1_en': 'admin1_english',
            'adm1_pcode': 'admin1_pcode',
            'adm1_ref': 'admin1_ref',
            'adm1alt1en': 'admin1_alt1_english',
            'adm1alt2en': 'admin1_alt2_english',
            'adm0_en': 'admin0_english',
            'adm0_pcode': 'admin0_pcode_fkey',
            'validon': 'valid_on',
            'validto': 'valid_to',
            '_ogr_geometry_': 'ogr_geometry'
        },
        'adm2_district': {
            'fid': 'field_id',
            'shape_leng': 'shape_length',
            'adm2_en': 'admin2_english',
            'adm2_pcode': 'admin2_pcode',
            'adm2_ref': 'admin2_ref',
            'adm2alt1en': 'admin2_alt1_english',
            'adm2alt2en': 'admin2_alt2_english',
            'adm1_en': 'admin1_english',
            'adm1_pcode': 'admin1_pcode',
            'adm0_en': 'admin0_english',
            'adm0_pcode': 'admin0_pcode_fkey',
            'validon': 'valid_on',
            'validto': 'valid_to',
            '_ogr_geometry_': 'ogr_geometry'
        },
        'adm3_upazila': {
            'fid': 'field_id',
            'shape_leng': 'shape_length',
            'adm3_en': 'admin3_english',
            'adm3_pcode': 'admin3_pcode',
            'adm3_ref': 'admin3_ref',
            'adm3alt1en': 'admin3_alt1_english',
            'adm3alt2en': 'admin3_alt2_english',
            'adm2_en': 'admin2_english',
            'adm2_pcode': 'admin2_pcode',
            'adm1_en': 'admin1_english',
            'adm1_pcode': 'admin1_pcode',
            'adm0_en': 'admin0_english',
            'adm0_pcode': 'admin0_pcode_fkey',
            'validon': 'valid_on',
            'validto': 'valid_to',
            '_ogr_geometry_': 'ogr_geometry'
        },
        'adm4_thana_union': {
            'fid': 'field_id',
            'shape_leng': 'shape_length',
            'adm4_en': 'admin4_english',
            'adm4_pcode': 'admin4_pcode',
            'adm4_ref': 'admin4_ref',
            'adm4alt1en': 'admin4_alt1_english',
            'adm4alt2en': 'admin4_alt2_english',
            'adm3_en': 'admin3_english',
            'adm3_pcode': 'admin3_pcode',
            'adm2_en': 'admin2_english',
            'adm2_pcode': 'admin2_pcode',
            'adm1_en': 'admin1_english',
            'adm1_pcode': 'admin1_pcode',
            'adm0_en': 'admin0_english',
            'adm0_pcode': 'admin0_pcode_fkey',
            'validon': 'valid_on',
            'validto': 'valid_to',
            '_ogr_geometry_': 'ogr_geometry'
        }
    }
    
    # Rename columns for each table
    for table_name, column_mapping in column_mappings.items():
        rename_columns(conn, table_name, column_mapping)
    
    # Close the database connection
    conn.close()

if __name__ == "__main__":
    main()
