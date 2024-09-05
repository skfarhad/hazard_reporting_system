/*
adm0_country
*/
-- Add a Unique Constraint to admin0_pcode in adm0_country
ALTER TABLE adm0_country
    ADD CONSTRAINT unique_admin0_pcode UNIQUE (admin0_pcode);

/*
adm1_division
*/
-- 1. Add the new pcode_key column
ALTER TABLE adm1_division
    ADD COLUMN admin1_pcode_fkey SMALLINT;

-- 2. Add unique constraint and set foreign key constraint
ALTER TABLE adm1_division
    ADD CONSTRAINT unique_admin1_pcode_fkey UNIQUE (admin1_pcode_fkey),
    ADD CONSTRAINT fk_admin0_pcode FOREIGN KEY (admin0_pcode_fkey) REFERENCES adm0_country(admin0_pcode);

-- 3. Update the new column by removing 'BD' prefix and converting the value to SMALLINT
UPDATE adm1_division
SET admin1_pcode_fkey = CAST(SUBSTRING(admin1_pcode FROM 3 FOR CHAR_LENGTH(admin1_pcode) - 2) AS SMALLINT);

-- 4. Drop redundant column
ALTER TABLE adm1_division
    DROP COLUMN admin0_english;


/*
adm2_district
*/
-- 1. Add the new pcode_key column
ALTER TABLE adm2_district
    ADD COLUMN admin2_pcode_fkey SMALLINT,
    ADD COLUMN admin1_pcode_fkey SMALLINT;

-- 2. Add unique constraint and set foreign key constraints
ALTER TABLE adm2_district
    ADD CONSTRAINT unique_admin2_pcode_fkey UNIQUE (admin2_pcode_fkey),
    ADD CONSTRAINT fk_admin1_pcode FOREIGN KEY (admin1_pcode_fkey) REFERENCES adm1_division(admin1_pcode_fkey),
    ADD CONSTRAINT fk_admin0_pcode FOREIGN KEY (admin0_pcode_fkey) REFERENCES adm0_country(admin0_pcode);

-- 3. Update the new column by removing 'BD' prefix and converting the value to SMALLINT
UPDATE adm2_district
SET admin2_pcode_fkey = CAST(SUBSTRING(admin2_pcode FROM 3 FOR CHAR_LENGTH(admin2_pcode) - 2) AS SMALLINT),
    admin1_pcode_fkey = CAST(SUBSTRING(admin1_pcode FROM 3 FOR CHAR_LENGTH(admin1_pcode) - 2) AS SMALLINT);

-- 4. Drop redundant columns
ALTER TABLE adm2_district
    DROP COLUMN admin1_english,
    DROP COLUMN admin1_pcode,
    DROP COLUMN admin0_english;


/*
adm3_upazila
*/
-- 1. Add the new pcode_key column
ALTER TABLE adm3_upazila
    ADD COLUMN admin3_pcode_fkey INTEGER,
    ADD COLUMN admin2_pcode_fkey SMALLINT,
    ADD COLUMN admin1_pcode_fkey SMALLINT;

-- 2. Add unique constraint and set foreign key constraints
ALTER TABLE adm3_upazila
    ADD CONSTRAINT unique_admin3_pcode_fkey UNIQUE (admin3_pcode_fkey),
    ADD CONSTRAINT fk_admin2_pcode FOREIGN KEY (admin2_pcode_fkey) REFERENCES adm2_district(admin2_pcode_fkey),
    ADD CONSTRAINT fk_admin1_pcode FOREIGN KEY (admin1_pcode_fkey) REFERENCES adm1_division(admin1_pcode_fkey),
    ADD CONSTRAINT fk_admin0_pcode FOREIGN KEY (admin0_pcode_fkey) REFERENCES adm0_country(admin0_pcode);

-- 3. Update the new column by removing 'BD' prefix and converting the value to INTEGER
UPDATE adm3_upazila
SET admin3_pcode_fkey = CAST(SUBSTRING(admin3_pcode FROM 3 FOR CHAR_LENGTH(admin3_pcode) - 2) AS INTEGER),
    admin2_pcode_fkey = CAST(SUBSTRING(admin2_pcode FROM 3 FOR CHAR_LENGTH(admin2_pcode) - 2) AS SMALLINT),
    admin1_pcode_fkey = CAST(SUBSTRING(admin1_pcode FROM 3 FOR CHAR_LENGTH(admin1_pcode) - 2) AS SMALLINT);

-- 4. Drop redundant columns
ALTER TABLE adm3_upazila
    DROP COLUMN admin2_english,
    DROP COLUMN admin2_pcode,
    DROP COLUMN admin1_english,
    DROP COLUMN admin1_pcode,
    DROP COLUMN admin0_english;


/*
adm4_thana_union
*/
-- 1. Add the new pcode_key column
ALTER TABLE adm4_thana_union
    ADD COLUMN admin3_pcode_fkey INTEGER,
    ADD COLUMN admin2_pcode_fkey SMALLINT,
    ADD COLUMN admin1_pcode_fkey SMALLINT;

-- 2. Add unique constraint and set foreign key constraints
ALTER TABLE adm4_thana_union
    ADD CONSTRAINT fk_admin3_pcode FOREIGN KEY (admin3_pcode_fkey) REFERENCES adm3_upazila(admin3_pcode_fkey),
    ADD CONSTRAINT fk_admin2_pcode FOREIGN KEY (admin2_pcode_fkey) REFERENCES adm2_district(admin2_pcode_fkey),
    ADD CONSTRAINT fk_admin1_pcode FOREIGN KEY (admin1_pcode_fkey) REFERENCES adm1_division(admin1_pcode_fkey),
    ADD CONSTRAINT fk_admin0_pcode FOREIGN KEY (admin0_pcode_fkey) REFERENCES adm0_country(admin0_pcode);

-- 3. Update the new column by removing 'BD' prefix and converting the value to INTEGER
UPDATE adm4_thana_union
SET admin3_pcode_fkey = CAST(SUBSTRING(admin3_pcode FROM 3 FOR CHAR_LENGTH(admin3_pcode) - 2) AS INTEGER),
    admin2_pcode_fkey = CAST(SUBSTRING(admin2_pcode FROM 3 FOR CHAR_LENGTH(admin2_pcode) - 2) AS SMALLINT),
    admin1_pcode_fkey = CAST(SUBSTRING(admin1_pcode FROM 3 FOR CHAR_LENGTH(admin1_pcode) - 2) AS SMALLINT);

-- 4. Drop the old pcode column
ALTER TABLE adm4_thana_union
    DROP COLUMN admin3_english,
    DROP COLUMN admin3_pcode,
    DROP COLUMN admin2_english,
    DROP COLUMN admin2_pcode,
    DROP COLUMN admin1_english,
    DROP COLUMN admin1_pcode,
    DROP COLUMN admin0_english;
