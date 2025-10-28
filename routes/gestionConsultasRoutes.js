const express = require('express');
const router = express.Router();
const GestionConsultasController = require('../controllers/gestionConsultasController');
const { authenticateToken } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Obtener consultas del profesional con filtros y paginación
router.get('/profesional/:profesionalId/consultas', GestionConsultasController.getConsultasByProfesional);

// Obtener estadísticas de consultas del profesional
router.get('/profesional/:profesionalId/estadisticas', GestionConsultasController.getEstadisticasConsultas);

// Obtener horarios disponibles del profesional para una fecha específica
router.get('/profesional/:profesionalId/horarios-disponibles', GestionConsultasController.getHorariosDisponibles);

// Reprogramar una consulta específica
router.post('/consulta/:consultaId/reprogramar', GestionConsultasController.reprogramarConsulta);

// Cancelar una consulta específica
router.post('/consulta/:consultaId/cancelar', GestionConsultasController.cancelarConsulta);

module.exports = router;
