const express = require('express');
const router = express.Router();
const evolucionMedicaController = require('../controllers/evolucionMedicaController');
const { authenticateToken } = require('../middleware/auth');

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para evoluciones médicas
router.post('/', (req, res) => evolucionMedicaController.createEvolucion(req, res));
router.get('/usuario/:usuarioId', (req, res) => evolucionMedicaController.getEvolucionesByUsuario(req, res));
router.get('/stats/:usuarioId', (req, res) => evolucionMedicaController.getEvolucionesStats(req, res));
router.get('/:evolucionId', (req, res) => evolucionMedicaController.getEvolucion(req, res));
router.put('/:evolucionId', (req, res) => evolucionMedicaController.updateEvolucion(req, res));
router.delete('/:evolucionId', (req, res) => evolucionMedicaController.deleteEvolucion(req, res));

module.exports = router;
