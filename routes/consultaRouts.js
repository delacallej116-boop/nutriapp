const express = require('express');
const router = express.Router();
const ConsultaController = require('../controllers/consultaController');
const { authenticateToken } = require('../middleware/auth');

// Rutas para gestión de consultas/turnos

// Obtener consultas de un paciente específico
router.get('/paciente/:pacienteId', authenticateToken, ConsultaController.getConsultasByPaciente);

// Obtener consultas de un profesional con filtros
router.get('/profesional/:id', authenticateToken, ConsultaController.getConsultasByProfesional);

// Obtener estadísticas de consultas de un profesional
router.get('/profesional/:id/stats', authenticateToken, ConsultaController.getConsultasStats);

// Obtener detalles de una consulta específica
router.get('/:id', authenticateToken, ConsultaController.getConsultaById);

// Crear nueva consulta (reservar turno)
router.post('/', authenticateToken, ConsultaController.createConsulta);

// Actualizar consulta existente
router.put('/:id', authenticateToken, ConsultaController.updateConsulta);

// Reprogramar consulta
router.put('/:id/reprogramar', authenticateToken, ConsultaController.reprogramarConsulta);

// Completar consulta
router.put('/:id/completar', authenticateToken, ConsultaController.completarConsulta);

// Marcar consulta como ausente
router.put('/:id/ausente', authenticateToken, ConsultaController.marcarAusente);

// Cancelar consulta
router.put('/:id/cancelar', authenticateToken, ConsultaController.cancelarConsulta);

module.exports = router;
