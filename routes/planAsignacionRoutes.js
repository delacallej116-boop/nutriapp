const express = require('express');
const router = express.Router();
const PlanAsignacionController = require('../controllers/planAsignacionController');
const { authenticateToken } = require('../middleware/auth');

// Instantiate controller
const planAsignacionController = new PlanAsignacionController();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Routes
router.post('/assign', (req, res) => planAsignacionController.assignPlan(req, res));
router.get('/usuario/:usuarioId', (req, res) => planAsignacionController.getAsignacionesByUsuario(req, res));
router.get('/usuario/:usuarioId/activa', (req, res) => planAsignacionController.getAsignacionActivaByUsuario(req, res));
router.get('/plan/:planId', (req, res) => planAsignacionController.getAsignacionesByPlan(req, res));
router.put('/:asignacionId', (req, res) => planAsignacionController.updateAsignacion(req, res));
router.delete('/:asignacionId', (req, res) => planAsignacionController.unassignPlan(req, res));
router.delete('/:asignacionId/delete', (req, res) => planAsignacionController.deleteAsignacion(req, res));
router.get('/stats', (req, res) => planAsignacionController.getStats(req, res));

module.exports = router;
