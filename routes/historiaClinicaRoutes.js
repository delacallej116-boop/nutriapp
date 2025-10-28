const express = require('express');
const router = express.Router();
const HistoriaClinicaController = require('../controllers/historiaClinicaController');
const { authenticateToken } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Rutas de historia clínica
router.get('/paciente/:pacienteId', HistoriaClinicaController.getHistoriaClinica);
router.post('/paciente/:pacienteId/consulta', HistoriaClinicaController.createConsulta);
router.post('/paciente/:pacienteId/medicion', HistoriaClinicaController.createMedicion);
router.post('/paciente/:pacienteId/plan', HistoriaClinicaController.createPlanAlimentacion);
router.post('/paciente/:pacienteId/documento', HistoriaClinicaController.uploadDocumento);

// Ruta de prueba
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API de historia clínica funcionando correctamente',
        endpoints: [
            'GET /paciente/:pacienteId - Obtener historia clínica completa',
            'GET /paciente/:pacienteId/exportar - Exportar historia clínica a PDF',
            'POST /paciente/:pacienteId/consulta - Crear nueva consulta',
            'POST /paciente/:pacienteId/medicion - Crear nueva medición',
            'POST /paciente/:pacienteId/plan - Crear nuevo plan alimentario',
            'POST /paciente/:pacienteId/documento - Subir documento'
        ]
    });
});

module.exports = router;
