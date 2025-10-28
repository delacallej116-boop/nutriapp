const express = require('express');
const router = express.Router();
const AsistenciaController = require('../controllers/asistenciaController');
const { authenticateToken } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Obtener consultas pendientes de confirmación de asistencia
router.get('/profesional/:profesionalId/pendientes', AsistenciaController.getConsultasPendientes);

// Confirmar asistencia de una consulta
router.post('/consulta/:consultaId/confirmar', AsistenciaController.confirmarAsistencia);

// Cambiar estado de una consulta (para ver detalles)
router.put('/consulta/:consultaId/cambiar-estado', AsistenciaController.cambiarEstadoConsulta);

// Obtener estadísticas de asistencia
router.get('/profesional/:profesionalId/estadisticas', AsistenciaController.getEstadisticasAsistencia);

module.exports = router;
