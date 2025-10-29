-- Migration: Fix antropometria table structure
-- This script adds missing columns to antropometria table if they don't exist

-- Step 1: Add circunferencia_cintura if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'antropometria' 
      AND COLUMN_NAME = 'circunferencia_cintura'
);

SET @sql_cintura = IF(@col_exists = 0,
    'ALTER TABLE antropometria ADD COLUMN circunferencia_cintura DECIMAL(5,2) NULL AFTER pliegue_subescapular',
    'SELECT "Column circunferencia_cintura already exists" AS message'
);

PREPARE stmt FROM @sql_cintura;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Add circunferencia_cadera if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'antropometria' 
      AND COLUMN_NAME = 'circunferencia_cadera'
);

SET @sql_cadera = IF(@col_exists = 0,
    'ALTER TABLE antropometria ADD COLUMN circunferencia_cadera DECIMAL(5,2) NULL AFTER circunferencia_cintura',
    'SELECT "Column circunferencia_cadera already exists" AS message'
);

PREPARE stmt FROM @sql_cadera;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: Add porcentaje_grasa if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'antropometria' 
      AND COLUMN_NAME = 'porcentaje_grasa'
);

SET @sql_grasa = IF(@col_exists = 0,
    'ALTER TABLE antropometria ADD COLUMN porcentaje_grasa DECIMAL(5,2) NULL AFTER circunferencia_cadera',
    'SELECT "Column porcentaje_grasa already exists" AS message'
);

PREPARE stmt FROM @sql_grasa;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Add masa_muscular if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'antropometria' 
      AND COLUMN_NAME = 'masa_muscular'
);

SET @sql_masa = IF(@col_exists = 0,
    'ALTER TABLE antropometria ADD COLUMN masa_muscular DECIMAL(5,2) NULL AFTER porcentaje_grasa',
    'SELECT "Column masa_muscular already exists" AS message'
);

PREPARE stmt FROM @sql_masa;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 5: Add observaciones if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'antropometria' 
      AND COLUMN_NAME = 'observaciones'
);

SET @sql_obs = IF(@col_exists = 0,
    'ALTER TABLE antropometria ADD COLUMN observaciones TEXT NULL AFTER masa_muscular',
    'SELECT "Column observaciones already exists" AS message'
);

PREPARE stmt FROM @sql_obs;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 6: Add creado_en if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'antropometria' 
      AND COLUMN_NAME = 'creado_en'
);

SET @sql_creado = IF(@col_exists = 0,
    'ALTER TABLE antropometria ADD COLUMN creado_en DATETIME DEFAULT CURRENT_TIMESTAMP AFTER observaciones',
    'SELECT "Column creado_en already exists" AS message'
);

PREPARE stmt FROM @sql_creado;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 7: Add fecha_medicion if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'antropometria' 
      AND COLUMN_NAME = 'fecha_medicion'
);

SET @sql_fecha_med = IF(@col_exists = 0,
    'ALTER TABLE antropometria ADD COLUMN fecha_medicion DATETIME DEFAULT CURRENT_TIMESTAMP AFTER pliegue_subescapular',
    'SELECT "Column fecha_medicion already exists" AS message'
);

PREPARE stmt FROM @sql_fecha_med;
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
  AND TABLE_NAME = 'antropometria'
  AND COLUMN_NAME IN (
    'circunferencia_cintura',
    'circunferencia_cadera',
    'porcentaje_grasa',
    'masa_muscular',
    'observaciones',
    'creado_en',
    'fecha_medicion'
  )
ORDER BY ORDINAL_POSITION;

