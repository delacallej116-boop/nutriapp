-- Script para permitir NULL en usuario_id para pacientes externos
-- Ejecutar paso a paso o todo junto

-- Paso 1: Eliminar el FOREIGN KEY constraint
ALTER TABLE consultas 
  DROP FOREIGN KEY consultas_ibfk_1;

-- Paso 2: Modificar usuario_id para permitir NULL
ALTER TABLE consultas 
  MODIFY COLUMN usuario_id INT NULL;

-- Paso 3: Recrear el FOREIGN KEY con ON DELETE SET NULL (más apropiado para NULL)
ALTER TABLE consultas 
  ADD CONSTRAINT consultas_ibfk_1 
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id) 
  ON DELETE SET NULL;

-- Paso 4: Verificar que el cambio se aplicó
SELECT COLUMN_NAME, IS_NULLABLE, COLUMN_DEFAULT 
FROM information_schema.COLUMNS 
WHERE TABLE_SCHEMA = DATABASE() 
  AND TABLE_NAME = 'consultas' 
  AND COLUMN_NAME = 'usuario_id';

