const express = require('express');
const router = express.Router();
const AgendaController = require('../controllers/agendaController');
const auth = require('../middleware/auth');

const agendaController = new AgendaController();

// Middleware de autenticación para todas las rutas
router.use(auth.authenticateToken);

// Rutas de consultas
router.get('/profesional/:profesionalId/consultas/fecha/:fecha', agendaController.getConsultasByDate.bind(agendaController));
router.get('/profesional/:profesionalId/consultas/rango', agendaController.getConsultasByDateRange.bind(agendaController));
router.get('/profesional/:profesionalId/consultas/paciente/:pacienteId', agendaController.getConsultasByPaciente.bind(agendaController));
router.post('/profesional/:profesionalId/consultas', agendaController.crearConsulta.bind(agendaController));
router.put('/consultas/:consultaId', agendaController.updateConsulta.bind(agendaController));
router.delete('/consultas/:consultaId', agendaController.deleteConsulta.bind(agendaController));

// Rutas de estadísticas
router.get('/profesional/:profesionalId/stats', agendaController.getAgendaStats.bind(agendaController));

// Rutas de horarios disponibles
router.get('/profesional/:profesionalId/horarios-disponibles', agendaController.getHorariosDisponibles.bind(agendaController));
router.get('/profesional/:profesionalId/horarios-disponibles/:fecha', agendaController.getHorariosDisponibles.bind(agendaController));

// Rutas de pacientes
router.get('/profesional/:profesionalId/pacientes', agendaController.getPacientes.bind(agendaController));

module.exports = router;

