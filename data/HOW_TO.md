The following instructions will guide you to create and populate the database `bd_admin_boundaries` locally.

1. Install PostGIS on local machine (assuming you have PostgreSQL 16 installed).
    
    ```bash
    sudo apt install postgis postgresql-16-postgis-3
    ```
    
2. Login as the default `postgres` user.
    
    ```bash
    sudo -i -u postgres
    ```
    
3. Set a password for the `postgres` user.
    
    ```bash
    \password postgres
    ```
    
4. Switch to postgres command line tool.
    
    ```bash
    psql
    ```
    
5. Create database.
    
    ```sql
    CREATE DATABASE bd_admin_boundaries;
    ```
    
6. Create a `.env` file in the root directory of your forked repo and populate it with the following parameters:
    
    ```bash
    DB_HOST=localhost
    DB_NAME=bd_admin_boundaries
    DB_USER=postgres
    DB_PASSWORD=<insert_db_password_here>
    ```
    
7. Download the geoJSON files to your local machine. (Download link)
8. In `geojson_to_postgres.py`, scroll down to the `main()` → `geojson_files` dictionary variable and replace the path to each geoJSON file with the appropriate local filepath in your machine.
9. Execute the script `populate_db.py` . This script will populate the database and rename some columns to display more intuitive column names. However, the database doesn’t have any relationships at this stage.
10. Now, go back to your logged in database (in the terminal or using your favourite database tool) and execute the SQL (DDL) statements for each table, one by one, from the script `normalize_db.sql`. After successfully completing this step, you should be able to see the normalized dimension tables for all five admin boundaries and their relationships.
