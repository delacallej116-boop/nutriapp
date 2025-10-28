const express = require('express');
const router = express.Router();
const PlanAlimentacionController = require('../controllers/planAlimentacionController');
const planComidasController = require('../controllers/planComidasController');
const { authenticateToken } = require('../middleware/auth');

// Crear instancia del controlador
const planAlimentacionController = new PlanAlimentacionController();

// Aplicar middleware de autenticación a todas las rutas
router.use(authenticateToken);

// Rutas para planes alimentarios
router.get('/profesional/:profesionalId/planes', (req, res) => planAlimentacionController.getPlanes(req, res));
router.get('/profesional/:profesionalId/stats', (req, res) => planAlimentacionController.getPlanStats(req, res));
router.get('/profesional/:profesionalId/pacientes', (req, res) => planAlimentacionController.getPacientes(req, res));
router.post('/profesional/:profesionalId/crear-plan', (req, res) => planAlimentacionController.createPlan(req, res));

// Rutas para plan específico
router.get('/plan/:planId', (req, res) => planAlimentacionController.getPlan(req, res));
router.get('/plan/:planId/pacientes', (req, res) => planAlimentacionController.getPacientesAsignados(req, res));
router.put('/plan/:planId', (req, res) => planAlimentacionController.updatePlan(req, res));
router.delete('/plan/:planId', (req, res) => planAlimentacionController.deletePlan(req, res));

// Rutas para comidas del plan
router.get('/plan/:planId/comidas', (req, res) => planComidasController.getComidas(req, res));
router.post('/plan/:planId/comidas', (req, res) => planComidasController.createComida(req, res));
router.post('/plan/:planId/comidas/multiple', (req, res) => planComidasController.createMultipleComidasHTTP(req, res));
router.get('/plan/:planId/nutritional-summary', (req, res) => planComidasController.getNutritionalSummary(req, res));

// Rutas para comida específica
router.put('/comida/:comidaId', (req, res) => planComidasController.updateComida(req, res));
router.delete('/comida/:comidaId', (req, res) => planComidasController.deleteComida(req, res));

module.exports = router;
