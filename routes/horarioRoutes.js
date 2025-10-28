const express = require('express');
const router = express.Router();
const HorarioController = require('../controllers/horarioController');
const { authenticateToken } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Rutas para horarios de trabajo
router.get('/profesional/:profesionalId/horarios', HorarioController.getHorariosByProfesional);
router.get('/profesional/:profesionalId/horarios/stats', HorarioController.getStats);
router.post('/horario', HorarioController.createHorario);
router.put('/horario/:id', HorarioController.updateHorario);
router.delete('/horario/:id', HorarioController.deleteHorario);

// Rutas para días no laborales
router.get('/profesional/:profesionalId/dias-no-laborales', HorarioController.getDiasNoLaborales);
router.post('/dia-no-laboral', HorarioController.createDiaNoLaboral);
router.put('/dia-no-laboral/:id', HorarioController.updateDiaNoLaboral);
router.delete('/dia-no-laboral/:id', HorarioController.deleteDiaNoLaboral);

module.exports = router;