# Fix para Errores de Base de Datos

## Problemas Identificados

### 1. Error: `Unknown column 'c.paciente_externo_nombre' in 'field list'`

**Causa**: El código en `models/agenda.js` intenta consultar columnas (`paciente_externo_nombre`, `paciente_externo_telefono`, `paciente_externo_email`) que no existen en la tabla `consultas` de la base de datos de producción.

**Impacto**: Todas las consultas a la agenda fallan con error 500.

### 2. Error: `Column 'usuario' cannot be null`

**Causa**: El campo `usuario` en la tabla `usuarios` está definido como `NOT NULL`, pero el código intenta crear pacientes sin nombre de usuario (pacientes sin cuenta de login).

**Impacto**: No se pueden crear nuevos pacientes desde la interfaz.

## Solución Implementada

### 1. Actualización del Código (`models/agenda.js`)

Se modificaron las consultas SQL para no depender de las columnas `paciente_externo_*`. En su lugar, se usan valores por defecto cuando no hay información de un usuario registrado:

```sql
-- Antes (causaba error):
COALESCE(u.apellido_nombre, c.paciente_externo_nombre) as paciente_nombre

-- Después (funciona sin las columnas):
COALESCE(u.apellido_nombre, 'Paciente externo') as paciente_nombre
```

**Métodos actualizados**:
- `getConsultasByDate()`
- `getConsultasByDateRange()`
- `getConsultasByPaciente()`

### 2. Actualización del Schema (`sql/schema.sql`)

Se modificó el campo `usuario` para que sea nullable:

```sql
-- Antes:
usuario VARCHAR(50) NOT NULL UNIQUE

-- Después:
usuario VARCHAR(50) NULL UNIQUE
```

### 3. Migración SQL para Producción

Se creó el archivo `sql/migrations/001_fix_production.sql` que debe ejecutarse en la base de datos de producción para:

1. Hacer el campo `usuario` nullable en la tabla `usuarios`
2. Agregar las columnas `paciente_externo_*` a la tabla `consultas` (por si acaso se necesitan en el futuro)

## Pasos para Aplicar la Solución

### En Producción (Render/Base de Datos):

1. **Ejecutar la migración SQL**:
   ```bash
   # Conectarse a la base de datos de producción
   mysql -u [usuario] -p nutricionista_app < sql/migrations/001_fix_production.sql
   ```

2. **Reiniciar la aplicación** (el código ya está corregido en el repositorio)

### Archivos Modificados

1. `sql/schema.sql` - Campo `usuario` ahora es nullable
2. `models/agenda.js` - Consultas actualizadas para no depender de columnas inexistentes
3. `sql/migrations/001_fix_production.sql` - Script de migración para producción
4. `sql/migrations/001_fix_consultas_and_usuarios.sql` - Script de migración alternativo

## Verificación

Después de aplicar los cambios:

1. **Errores de agenda**: Ya no deberían aparecer errores al cargar la agenda
2. **Crear pacientes**: Ahora se pueden crear pacientes sin cuenta de login
3. **Consultas**: Deberían mostrar "Paciente externo" cuando no hay información de usuario

## Notas Adicionales

- El campo `usuario` ahora puede ser NULL, pero sigue siendo UNIQUE (permitiendo múltiples NULLs en MySQL)
- Los pacientes pueden existir sin tener una cuenta de login
- Si un paciente necesita acceso al sistema más tarde, se puede crear una cuenta de usuario después

