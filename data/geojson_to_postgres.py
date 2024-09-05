'''
Postgres 16.4
PostGIS 3.4.2
sudo apt install postgis postgresql-16-postgis-3
'''

import os
import geopandas as gpd
import psycopg2
from psycopg2 import sql
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


def enable_postgis(conn):
    """
    Enables the PostGIS extension in the PostgreSQL database.
    """
    with conn.cursor() as cur:
        try:
            cur.execute("CREATE EXTENSION IF NOT EXISTS postgis;")
            conn.commit()
        except Exception as e:
            print(f"Error enabling PostGIS extension: {e}")
            conn.rollback()


def create_table(conn, create_table_query):
    """
    Creates a table in the database if it doesn't already exist.
    """
    try:
        with conn.cursor() as cur:
            cur.execute(create_table_query)
            conn.commit()
    except Error as e:
        print(f"Error creating table: {e}")
        conn.rollback()


def check_table_exists(conn, table_name):
    """
    Checks if a table exists in the database.
    """
    try:
        with conn.cursor() as cur:
            cur.execute(
                sql.SQL(
                    """SELECT EXISTS (
                        SELECT 1
                        FROM information_schema.tables
                        WHERE table_name = %s
                    );"""
                ),
                [table_name]
            )
            exists = cur.fetchone()[0]
            if exists:
                print(f"Table '{table_name}' exists.")
            else:
                print(f"Table '{table_name}' does not exist.")
        print()
    except Error as e:
        print(f"Error checking if table exists: {e}")


def insert_geojson_to_db(conn, geojson_path, table_name):
    """
    Inserts GeoJSON data into the specified PostgreSQL table.
    """
    try:
        gdf = gpd.read_file(geojson_path)
    except Exception as e:
        print(f"Error reading GeoJSON file '{geojson_path}': {e}")
        return

    try:
        with conn.cursor() as cur:
            for _, row in gdf.iterrows():
                geom = row.geometry.wkt  # Convert geometry to WKT format
                properties = row.drop('geometry')
                columns = [col.lower() for col in properties.index]
                values = list(properties.values)

                # Insert the data into the table
                insert_query = sql.SQL("""
                    INSERT INTO {table} ({fields}, _ogr_geometry_)
                    VALUES ({values}, ST_GeomFromText(%s, 4326))
                """).format(
                    table=sql.Identifier(table_name),
                    fields=sql.SQL(', ').join(map(sql.Identifier, columns)),
                    values=sql.SQL(', ').join(sql.Placeholder() * len(values))
                )

                cur.execute(insert_query, values + [geom])
                # print(f"Inserted row into {table_name}")

            conn.commit()
    except Error as e:
        conn.rollback()
        raise RuntimeError(
            f"Error inserting data into table '{table_name}': {e}")


def count_rows(conn, table_name):
    """
    Counts the number of rows in the specified table.
    """
    try:
        with conn.cursor() as cur:
            cur.execute(sql.SQL("SELECT COUNT(*) FROM {table};")
                        .format(table=sql.Identifier(table_name)))
            row_count = cur.fetchone()[0]
            print(f"Table '{table_name}' has {row_count} rows.\n")
    except Error as e:
        print(f"Error counting rows in table '{table_name}': {e}")


def main():
    # Database connection details
    # You should have created the database already
    host = os.getenv("DB_HOST")
    dbname = os.getenv("DB_NAME")
    user = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")

    # Connect to the database
    conn = connect_db(host, dbname, user, password)
    if not conn:
        print("Database connection failed. Exiting.")
        return

    # Enable PostGIS
    enable_postgis(conn)

    # Define table creation queries for each administrative level
    create_table_queries = {
        'adm0_country': """CREATE TABLE IF NOT EXISTS adm0_country (
            id SERIAL PRIMARY KEY,
            fid SMALLINT,
            shape_leng NUMERIC(12, 9),
            shape_area NUMERIC(12, 10),
            adm0_en CHAR(10),
            adm0_pcode CHAR(2),
            adm0_ref VARCHAR(30),
            adm0alt1en VARCHAR(30),
            adm0alt2en VARCHAR(30),
            date DATE,
            validon DATE,
            validto DATE,
            _ogr_geometry_ GEOMETRY(Geometry, 4326)
        );""",
        'adm1_division': """CREATE TABLE IF NOT EXISTS adm1_division (
            id SERIAL PRIMARY KEY,
            fid SMALLINT,
            shape_leng NUMERIC(13, 11),
            shape_area NUMERIC(13, 12),
            adm1_en CHAR(10),
            adm1_pcode CHAR(4),
            adm1_ref CHAR(10),
            adm1alt1en VARCHAR(30),
            adm1alt2en VARCHAR(30),
            adm0_en CHAR(10),
            adm0_pcode CHAR(2),
            date DATE,
            validon DATE,
            validto DATE,
            _ogr_geometry_ GEOMETRY(Geometry, 4326)
        );""",
        'adm2_district': """CREATE TABLE IF NOT EXISTS adm2_district (
            id SERIAL PRIMARY KEY,
            fid SMALLINT,
            shape_leng NUMERIC(13, 11),
            shape_area NUMERIC(14, 13),
            adm2_en CHAR(13),
            adm2_pcode CHAR(6),
            adm2_ref CHAR(13),
            adm2alt1en VARCHAR(30),
            adm2alt2en VARCHAR(30),
            adm1_en CHAR(10),
            adm1_pcode CHAR(4),
            adm0_en CHAR(10),
            adm0_pcode CHAR(2),
            date DATE,
            validon DATE,
            validto DATE,
            _ogr_geometry_ GEOMETRY(Geometry, 4326)
        );""",
        'adm3_upazila': """CREATE TABLE IF NOT EXISTS adm3_upazila (
            id SERIAL PRIMARY KEY,
            fid SMALLINT,
            shape_leng NUMERIC(14, 13),
            shape_area NUMERIC(16, 15),
            adm3_en CHAR(25),
            adm3_pcode CHAR(8),
            adm3_ref CHAR(16),
            adm3alt1en VARCHAR(30),
            adm3alt2en VARCHAR(30),
            adm2_en CHAR(13),
            adm2_pcode CHAR(6),
            adm1_en CHAR(10),
            adm1_pcode CHAR(4),
            adm0_en CHAR(10),
            adm0_pcode CHAR(2),
            date DATE,
            validon DATE,
            validto DATE,
            _ogr_geometry_ GEOMETRY(Geometry, 4326)
        );""",
        'adm4_thana_union': """CREATE TABLE IF NOT EXISTS adm4_thana_union (
            id SERIAL PRIMARY KEY,
            fid SMALLINT,
            shape_leng NUMERIC(14, 13),
            shape_area NUMERIC(16, 15),
            adm4_en CHAR(30),
            adm4_pcode CHAR(10),
            adm4_ref CHAR(21),
            adm4alt1en VARCHAR(30),
            adm4alt2en VARCHAR(30),
            adm3_en CHAR(25),
            adm3_pcode CHAR(8),
            adm2_en CHAR(13),
            adm2_pcode CHAR(6),
            adm1_en CHAR(10),
            adm1_pcode CHAR(4),
            adm0_en CHAR(10),
            adm0_pcode CHAR(2),
            date DATE,
            validon DATE,
            validto DATE,
            _ogr_geometry_ GEOMETRY(Geometry, 4326)
        );"""
    }

    # Create tables
    for table_name, create_table_query in create_table_queries.items():
        create_table(conn, create_table_query)
        # Check if the table was created
        check_table_exists(conn, table_name)

    # Insert GeoJSON data into each table
    # Since this is a one-time execution, locally populate the DB.
    # Replace '/path/to/...' with your geojson filepaths.
    geojson_files = {
        # 'adm0_country': '/path/to/adm0.geojson',
        # 'adm1_division': '/path/to/adm1.geojson',
        # 'adm2_district': '/path/to/adm2.geojson',
        # 'adm3_upazila': '/path/to/adm3.geojson',
        # 'adm4_thana_union': '/path/to/adm4.geojson',
    }

    for table_name, geojson_path in geojson_files.items():
        print(f'Populating {table_name}')
        insert_geojson_to_db(conn, geojson_path, table_name)
        # Check the number of rows in the table
        count_rows(conn, table_name)

    # Close the database connection
    conn.close()


if __name__ == "__main__":
    # Load environment variables from the .env file
    load_dotenv()

    main()
