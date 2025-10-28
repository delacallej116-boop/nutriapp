const express = require('express');
const router = express.Router();
const AntropometriaController = require('../controllers/antropometriaController');
const { authenticateToken } = require('../middleware/auth');

const antropometriaController = new AntropometriaController();

// Apply authentication middleware to all anthropometry routes
router.use(authenticateToken);

// POST create new anthropometry measurement
router.post('/', (req, res) => antropometriaController.createAntropometria(req, res));

// GET anthropometry measurements by user ID
router.get('/usuario/:usuarioId', (req, res) => antropometriaController.getAntropometriaByUsuario(req, res));

// GET anthropometry measurement by ID
router.get('/:id', (req, res) => antropometriaController.getAntropometriaById(req, res));

// PUT update anthropometry measurement
router.put('/:id', (req, res) => antropometriaController.updateAntropometria(req, res));

// DELETE anthropometry measurement
router.delete('/:id', (req, res) => antropometriaController.deleteAntropometria(req, res));

// GET anthropometry statistics by user ID
router.get('/usuario/:usuarioId/stats', (req, res) => antropometriaController.getAntropometriaStats(req, res));

// GET anthropometry evolution by user ID
router.get('/usuario/:usuarioId/evolution', (req, res) => antropometriaController.getAntropometriaEvolution(req, res));

module.exports = router;
