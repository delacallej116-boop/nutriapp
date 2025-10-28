const express = require('express');
const router = express.Router();
const EmailController = require('../controllers/emailController');
const { authenticateToken } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Middleware para verificar que el usuario es un profesional
router.use((req, res, next) => {
    if (req.user.rol !== 'profesional') {
        return res.status(403).json({
            success: false,
            message: 'Acceso denegado. Solo los profesionales pueden acceder a esta sección.'
        });
    }
    next();
});

// Rutas del servicio de email
router.post('/send-plan', EmailController.sendPlanAlimentario);
router.post('/test', EmailController.sendTestEmail);
router.get('/status', EmailController.checkEmailService);
router.get('/test-pdf/:planId', EmailController.testPDFGeneration);

// Ruta de información de la API
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API de Email funcionando correctamente',
        user: req.user,
        endpoints: [
            'POST /send-plan - Enviar plan alimentario por email',
            'POST /test - Enviar email de prueba',
            'GET /status - Verificar estado del servicio de email',
            'GET /test-pdf/:planId - Probar generación de PDF'
        ]
    });
});

module.exports = router;
