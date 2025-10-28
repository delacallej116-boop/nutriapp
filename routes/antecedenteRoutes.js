const express = require('express');
const router = express.Router();
const AntecedenteController = require('../controllers/antecedenteController');
const { authenticateToken } = require('../middleware/auth');

const antecedenteController = new AntecedenteController();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Rutas de antecedentes
router.get('/usuario/:usuarioId', (req, res) => antecedenteController.getAntecedentesByUsuario(req, res));
router.post('/', (req, res) => antecedenteController.createOrUpdateAntecedentes(req, res));
router.put('/usuario/:usuarioId', (req, res) => antecedenteController.createOrUpdateAntecedentes(req, res));
router.delete('/usuario/:usuarioId', (req, res) => antecedenteController.deleteAntecedentes(req, res));
router.get('/stats', (req, res) => antecedenteController.getAntecedentesStats(req, res));

module.exports = router;
