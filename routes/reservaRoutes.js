const express = require('express');
const router = express.Router();
const ReservaController = require('../controllers/reservaController');

// Rutas para reservas de turnos
router.post('/', ReservaController.createReserva);                         // Crear nueva reserva
router.post('/crear', ReservaController.createReserva);                   // Crear nueva reserva (alias)
router.get('/horarios/:fecha', ReservaController.getHorariosDisponibles); // Obtener horarios disponibles
router.get('/disponibilidad', ReservaController.getAvailableSlots);      // Obtener horarios disponibles (query params)
router.post('/cancelar', ReservaController.cancelarReserva);             // Cancelar reserva
router.get('/estadisticas', ReservaController.getEstadisticas);          // Obtener estadísticas

module.exports = router;
