const express = require('express');
const router = express.Router();
const ReporteController = require('../controllers/reporteController');

// Ruta para obtener estadísticas rápidas
router.get('/stats', ReporteController.getQuickStats);

// Ruta para obtener reportes recientes
router.get('/recent', ReporteController.getRecentReports);

// Ruta para generar nuevo reporte
router.post('/generate', ReporteController.generateReport);

// Ruta para eliminar reporte
router.delete('/:id', ReporteController.deleteReport);

// Ruta para obtener lista de pacientes para filtros
router.get('/patients-filter', ReporteController.getPatientsFilter);

module.exports = router;
