# Scripts de Utilidad

## insertar-consultas-prueba.js

Script para insertar consultas de prueba en la base de datos. Crea 8 consultas con diferentes fechas y estados para poder visualizarlas en la agenda.

### Uso

```bash
# Opción 1: Usando npm script
npm run insertar-consultas

# Opción 2: Ejecutando directamente
node scripts/insertar-consultas-prueba.js
```

### Requisitos

- Debe existir al menos un profesional en la base de datos
- Si hay pacientes (usuarios) registrados, se usarán para las consultas
- Si no hay pacientes, se crearán consultas con pacientes externos

### Características

- Crea 8 consultas distribuidas en los próximos 7 días
- Genera códigos de cancelación únicos automáticamente
- Soporta tanto pacientes registrados como externos
- Maneja errores y muestra un resumen al finalizar

### Consultas creadas

Las consultas se crean con:
- Fechas: desde mañana hasta 7 días en el futuro
- Horarios: variados (09:00, 10:30, 11:00, 14:00, 15:30, 16:00, 18:00)
- Estados: todas en estado 'activo'
- Objetivos: variados (perdida_peso, ganancia_masa, salud, rendimiento, otro)
- Motivos: diferentes motivos de consulta

### Notas

- El script verifica que los códigos de cancelación sean únicos
- Si hay conflictos de horarios, se mostrarán errores pero el script continuará
- Las consultas se asocian al primer profesional encontrado en la base de datos

