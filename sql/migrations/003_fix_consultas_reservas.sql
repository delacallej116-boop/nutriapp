-- Migration: Fix consultas table for reservations
-- This script adds missing columns and fixes defaults needed for reservas

-- Step 1: Ensure usuario_id can be NULL and has a default
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'consultas' 
      AND COLUMN_NAME = 'usuario_id'
);

SET @sql_fix_usuario = IF(@col_exists > 0,
    'ALTER TABLE consultas MODIFY COLUMN usuario_id INT NULL DEFAULT NULL',
    'SELECT "usuario_id column does not exist" AS message'
);

PREPARE stmt FROM @sql_fix_usuario;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Add paciente_externo_nombre if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'consultas' 
      AND COLUMN_NAME = 'paciente_externo_nombre'
);

SET @sql_nombre = IF(@col_exists = 0,
    'ALTER TABLE consultas ADD COLUMN paciente_externo_nombre VARCHAR(255) NULL',
    'SELECT "Column paciente_externo_nombre already exists" AS message'
);

PREPARE stmt FROM @sql_nombre;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Add paciente_externo_telefono if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'consultas' 
      AND COLUMN_NAME = 'paciente_externo_telefono'
);

SET @sql_telefono = IF(@col_exists = 0,
    'ALTER TABLE consultas ADD COLUMN paciente_externo_telefono VARCHAR(50) NULL',
    'SELECT "Column paciente_externo_telefono already exists" AS message'
);

PREPARE stmt FROM @sql_telefono;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Add paciente_externo_email if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'consultas' 
      AND COLUMN_NAME = 'paciente_externo_email'
);

SET @sql_email = IF(@col_exists = 0,
    'ALTER TABLE consultas ADD COLUMN paciente_externo_email VARCHAR(255) NULL',
    'SELECT "Column paciente_externo_email already exists" AS message'
);

PREPARE stmt FROM @sql_email;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 5: Add motivo_consulta if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'consultas' 
      AND COLUMN_NAME = 'motivo_consulta'
);

SET @sql_motivo = IF(@col_exists = 0,
    'ALTER TABLE consultas ADD COLUMN motivo_consulta TEXT NULL',
    'SELECT "Column motivo_consulta already exists" AS message'
);

PREPARE stmt FROM @sql_motivo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 6: Add observaciones if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'consultas' 
      AND COLUMN_NAME = 'observaciones'
);

SET @sql_observaciones = IF(@col_exists = 0,
    'ALTER TABLE consultas ADD COLUMN observaciones TEXT NULL',
    'SELECT "Column observaciones already exists" AS message'
);

PREPARE stmt FROM @sql_observaciones;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 7: Add creado_en if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'consultas' 
      AND COLUMN_NAME = 'creado_en'
);

SET @sql_creado = IF(@col_exists = 0,
    'ALTER TABLE consultas ADD COLUMN creado_en DATETIME DEFAULT CURRENT_TIMESTAMP',
    'SELECT "Column creado_en already exists" AS message'
);

PREPARE stmt FROM @sql_creado;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 8: Verify table structure
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    COLUMN_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'consultas'
  AND COLUMN_NAME IN (
    'usuario_id',
    'paciente_externo_nombre',
    'paciente_externo_telefono',
    'paciente_externo_email',
    'motivo_consulta',
    'observaciones',
    'creado_en'
  )
ORDER BY ORDINAL_POSITION;

