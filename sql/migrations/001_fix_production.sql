-- Migration: Fix production database issues
-- Date: 2025-10-28
-- Run this script on your production database to fix:
--   1. Make usuario column nullable in usuarios table
--   2. Make contrasena column nullable in usuarios table
--   3. Add paciente_externo columns to consultas table

USE nutricionista_app;

-- Step 1: Make usuario column nullable in usuarios table
-- This allows creating patients without login accounts
ALTER TABLE usuarios MODIFY COLUMN usuario VARCHAR(50) NULL;

-- Step 2: Make contrasena column nullable in usuarios table
-- Patients without login accounts don't need passwords
ALTER TABLE usuarios MODIFY COLUMN contrasena VARCHAR(255) NULL;

-- Step 3: Add paciente_externo_nombre column (safe to run multiple times)
ALTER TABLE consultas 
ADD COLUMN IF NOT EXISTS paciente_externo_nombre VARCHAR(255) NULL 
COMMENT 'Nombre completo del paciente externo';

-- Step 4: Add paciente_externo_telefono column (safe to run multiple times)
ALTER TABLE consultas 
ADD COLUMN IF NOT EXISTS paciente_externo_telefono VARCHAR(50) NULL 
COMMENT 'Teléfono del paciente externo';

-- Step 5: Add paciente_externo_email column (safe to run multiple times)
ALTER TABLE consultas 
ADD COLUMN IF NOT EXISTS paciente_externo_email VARCHAR(255) NULL 
COMMENT 'Email del paciente externo (opcional)';

-- Note: If ADD COLUMN IF NOT EXISTS doesn't work in your MySQL version,
-- you can manually check if the columns exist before running this

SELECT 'Migration completed successfully' as message;

