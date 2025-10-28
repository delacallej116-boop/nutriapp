-- Migration: Fix consultas table and usuarios table
-- Date: 2025-10-28
-- Purpose: 
--   1. Add paciente_externo columns to consultas table if they don't exist
--   2. Make usuario column nullable in usuarios table

USE nutricionista_app;

-- Step 1: Check if paciente_externo columns exist, and add them if they don't
-- We'll use conditional logic to add columns only if they don't exist

-- Note: MySQL doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- We'll need to check and add manually, or use a procedure
-- For now, we'll create a safe migration that can be run multiple times

-- Add paciente_externo_nombre column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'nutricionista_app' 
    AND TABLE_NAME = 'consultas' 
    AND COLUMN_NAME = 'paciente_externo_nombre'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE consultas ADD COLUMN paciente_externo_nombre VARCHAR(255) NULL COMMENT "Nombre completo del paciente externo"',
    'SELECT "Column paciente_externo_nombre already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add paciente_externo_telefono column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'nutricionista_app' 
    AND TABLE_NAME = 'consultas' 
    AND COLUMN_NAME = 'paciente_externo_telefono'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE consultas ADD COLUMN paciente_externo_telefono VARCHAR(50) NULL COMMENT "Teléfono del paciente externo"',
    'SELECT "Column paciente_externo_telefono already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Add paciente_externo_email column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM INFORMATION_SCHEMA.COLUMNS 
    WHERE TABLE_SCHEMA = 'nutricionista_app' 
    AND TABLE_NAME = 'consultas' 
    AND COLUMN_NAME = 'paciente_externo_email'
);

SET @sql = IF(@col_exists = 0,
    'ALTER TABLE consultas ADD COLUMN paciente_externo_email VARCHAR(255) NULL COMMENT "Email del paciente externo (opcional)"',
    'SELECT "Column paciente_externo_email already exists" as message'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Make usuario column nullable in usuarios table
-- This allows creating patients without login accounts
ALTER TABLE usuarios MODIFY COLUMN usuario VARCHAR(50) NULL;

-- Update the unique constraint to allow multiple NULL values
-- In MySQL, multiple NULL values are allowed in a UNIQUE column by default
-- But let's be explicit about it
-- Note: MySQL treats NULL values differently in UNIQUE constraints
-- Multiple NULLs are allowed, which is what we want

SELECT 'Migration completed successfully' as message;

