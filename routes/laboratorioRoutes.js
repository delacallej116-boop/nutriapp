const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const LaboratorioController = require('../controllers/laboratorioController');

// Instanciar el controlador
const laboratorioController = new LaboratorioController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para laboratorios
router.post('/', (req, res) => laboratorioController.createLaboratorio(req, res));

router.get('/usuario/:usuarioId', (req, res) => laboratorioController.getLaboratoriosByUsuario(req, res));

router.get('/profesional/:profesionalId', (req, res) => laboratorioController.getLaboratoriosByProfesional(req, res));

router.get('/:laboratorioId', (req, res) => laboratorioController.getLaboratorioById(req, res));

router.put('/:laboratorioId', (req, res) => laboratorioController.updateLaboratorio(req, res));

router.delete('/:laboratorioId', (req, res) => laboratorioController.deleteLaboratorio(req, res));

// Ruta para actualizar estado de resultado específico
router.put('/resultado/:resultadoId', (req, res) => laboratorioController.updateResultadoStatus(req, res));

// Rutas para estadísticas
router.get('/stats/:profesionalId', (req, res) => laboratorioController.getLaboratorioStats(req, res));

// Rutas para evolución de parámetros
router.get('/evolucion/:usuarioId/:parametro', (req, res) => laboratorioController.getEvolucionParametro(req, res));

// Rutas para parámetros fuera de rango
router.get('/fuera-rango/:usuarioId', (req, res) => laboratorioController.getParametrosFueraRango(req, res));

// Rutas para búsqueda por rango de fechas
router.get('/fechas/:profesionalId', (req, res) => laboratorioController.getLaboratoriosByDateRange(req, res));

module.exports = router;
