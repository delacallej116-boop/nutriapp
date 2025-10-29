-- Migration: Fix planes_alimentacion table structure
-- This script adds missing columns to planes_alimentacion table if they don't exist

-- Step 1: Add 'activo' column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'planes_alimentacion' 
      AND COLUMN_NAME = 'activo'
);

SET @sql_activo = IF(@col_exists = 0,
    'ALTER TABLE planes_alimentacion ADD COLUMN activo BOOLEAN DEFAULT TRUE AFTER observaciones',
    'SELECT "Column activo already exists" AS message'
);

PREPARE stmt FROM @sql_activo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 2: Add 'tipo' column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'planes_alimentacion' 
      AND COLUMN_NAME = 'tipo'
);

SET @sql_tipo = IF(@col_exists = 0,
    'ALTER TABLE planes_alimentacion ADD COLUMN tipo ENUM(\'simple\', \'intermedio\', \'avanzado\') NOT NULL DEFAULT \'simple\' AFTER nombre',
    'SELECT "Column tipo already exists" AS message'
);

PREPARE stmt FROM @sql_tipo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 3: If 'tipo' column exists, modify it to include 'avanzado' option
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'planes_alimentacion' 
      AND COLUMN_NAME = 'tipo'
);

SET @sql_modify_tipo = IF(@col_exists > 0,
    'ALTER TABLE planes_alimentacion MODIFY COLUMN tipo ENUM(\'simple\', \'intermedio\', \'avanzado\') NOT NULL DEFAULT \'simple\'',
    'SELECT "Column tipo does not exist, it was just created above" AS message'
);

PREPARE stmt FROM @sql_modify_tipo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 4: Add 'nombre' column if it doesn't exist (NOT NULL with default for existing rows)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'planes_alimentacion' 
      AND COLUMN_NAME = 'nombre'
);

SET @sql_nombre = IF(@col_exists = 0,
    'ALTER TABLE planes_alimentacion ADD COLUMN nombre VARCHAR(255) NOT NULL DEFAULT \'Sin nombre\' FIRST',
    'SELECT "Column nombre already exists" AS message'
);

PREPARE stmt FROM @sql_nombre;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 5: Add 'objetivo' column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'planes_alimentacion' 
      AND COLUMN_NAME = 'objetivo'
);

SET @sql_objetivo = IF(@col_exists = 0,
    'ALTER TABLE planes_alimentacion ADD COLUMN objetivo VARCHAR(255) NULL AFTER descripcion',
    'SELECT "Column objetivo already exists" AS message'
);

PREPARE stmt FROM @sql_objetivo;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 6: Add 'calorias_diarias' column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'planes_alimentacion' 
      AND COLUMN_NAME = 'calorias_diarias'
);

SET @sql_calorias = IF(@col_exists = 0,
    'ALTER TABLE planes_alimentacion ADD COLUMN calorias_diarias INT NULL AFTER objetivo',
    'SELECT "Column calorias_diarias already exists" AS message'
);

PREPARE stmt FROM @sql_calorias;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 7: Add 'caracteristicas' column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'planes_alimentacion' 
      AND COLUMN_NAME = 'caracteristicas'
);

SET @sql_caracteristicas = IF(@col_exists = 0,
    'ALTER TABLE planes_alimentacion ADD COLUMN caracteristicas TEXT NULL AFTER calorias_diarias',
    'SELECT "Column caracteristicas already exists" AS message'
);

PREPARE stmt FROM @sql_caracteristicas;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 8: Add 'observaciones' column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'planes_alimentacion' 
      AND COLUMN_NAME = 'observaciones'
);

SET @sql_observaciones = IF(@col_exists = 0,
    'ALTER TABLE planes_alimentacion ADD COLUMN observaciones TEXT NULL AFTER caracteristicas',
    'SELECT "Column observaciones already exists" AS message'
);

PREPARE stmt FROM @sql_observaciones;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 9: Add 'creado_en' column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'planes_alimentacion' 
      AND COLUMN_NAME = 'creado_en'
);

SET @sql_creado_en = IF(@col_exists = 0,
    'ALTER TABLE planes_alimentacion ADD COLUMN creado_en DATETIME DEFAULT CURRENT_TIMESTAMP AFTER activo',
    'SELECT "Column creado_en already exists" AS message'
);

PREPARE stmt FROM @sql_creado_en;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 10: Add 'fecha_creacion' column if it doesn't exist
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'planes_alimentacion' 
      AND COLUMN_NAME = 'fecha_creacion'
);

SET @sql_fecha_creacion = IF(@col_exists = 0,
    'ALTER TABLE planes_alimentacion ADD COLUMN fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP AFTER descripcion',
    'SELECT "Column fecha_creacion already exists" AS message'
);

PREPARE stmt FROM @sql_fecha_creacion;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 11: Ensure usuario_id can be NULL (for generic plans)
SET @col_exists = (
    SELECT COUNT(*) 
    FROM information_schema.COLUMNS 
    WHERE TABLE_SCHEMA = DATABASE() 
      AND TABLE_NAME = 'planes_alimentacion' 
      AND COLUMN_NAME = 'usuario_id'
);

SET @sql_fix_usuario = IF(@col_exists > 0,
    'ALTER TABLE planes_alimentacion MODIFY COLUMN usuario_id INT NULL DEFAULT NULL',
    'SELECT "usuario_id column does not exist" AS message'
);

PREPARE stmt FROM @sql_fix_usuario;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Step 12: Verify table structure
SELECT 
    COLUMN_NAME, 
    DATA_TYPE, 
    COLUMN_TYPE, 
    IS_NULLABLE, 
    COLUMN_DEFAULT
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'planes_alimentacion'
  AND COLUMN_NAME IN (
    'id',
    'nombre',
    'tipo',
    'usuario_id',
    'profesional_id',
    'activo',
    'objetivo',
    'calorias_diarias',
    'creado_en'
  )
ORDER BY ORDINAL_POSITION;

