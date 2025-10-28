const express = require('express');
const router = express.Router();
const UsuarioController = require('../controllers/usuarioController');
const { authenticateToken } = require('../middleware/auth');

// Middleware de autenticación para todas las rutas
router.use(authenticateToken);

// Rutas de pacientes por profesional
router.get('/profesional/:profesionalId/pacientes', UsuarioController.getPacientesByProfesional);
router.get('/profesional/:profesionalId/pacientes/stats', UsuarioController.getPacientesStats);
router.post('/profesional/:profesionalId/pacientes', UsuarioController.createPaciente);

// Rutas de paciente individual
router.get('/paciente/:id', UsuarioController.getPacienteById);
router.put('/paciente/:id', UsuarioController.updatePaciente);
router.delete('/paciente/:id', UsuarioController.deletePaciente);

// Rutas de caché (para debugging)
router.get('/cache/stats', UsuarioController.getCacheStats);
router.delete('/cache/clear', UsuarioController.clearCache);

// Ruta para verificar si un usuario existe
router.get('/check-user/:username', UsuarioController.checkUserExists);

// Ruta directa para crear paciente (usa el profesional del token)
router.post('/paciente', UsuarioController.createPacienteDirect);

// Ruta para crear cuenta de usuario para paciente existente
router.post('/paciente/:id/crear-cuenta', UsuarioController.createAccountForPatient);

// Ruta para resetear contraseña de paciente
router.put('/paciente/:id/resetear-contrasena', UsuarioController.resetPatientPassword);

// Ruta para limpiar usuario temporal
router.delete('/paciente/:id/limpiar-temporal', UsuarioController.limpiarUsuarioTemporal);

// Ruta para que el paciente obtenga los datos de su profesional asignado
router.get('/mi-profesional', UsuarioController.getMyProfesional);

// Ruta de prueba
router.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'API de usuarios funcionando correctamente',
        endpoints: [
            'GET /profesional/:profesionalId/pacientes - Obtener pacientes',
            'GET /profesional/:profesionalId/pacientes/stats - Estadísticas',
            'POST /profesional/:profesionalId/pacientes - Crear paciente',
            'GET /paciente/:id - Obtener paciente',
            'PUT /paciente/:id - Actualizar paciente',
            'DELETE /paciente/:id - Eliminar paciente'
        ]
    });
});

module.exports = router;
