const express = require('express');
const ProfesionalController = require('../controllers/profesionalController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Rutas para profesionales
router.post('/', ProfesionalController.create);                    // Crear profesional
router.post('/register', ProfesionalController.register);          // Registro de profesional
router.get('/', ProfesionalController.getAll);                      // Obtener todos los profesionales
router.get('/:id', ProfesionalController.getById);                  // Obtener profesional por ID
router.put('/:id', ProfesionalController.update);                  // Actualizar profesional
router.delete('/:id', ProfesionalController.delete);               // Eliminar profesional
router.get('/:id/stats', ProfesionalController.getStats);         // Obtener estadísticas
router.get('/email/:email', ProfesionalController.getByEmail);    // Buscar por email
router.get('/usuario/:usuario', ProfesionalController.getByUsuario); // Buscar por usuario
router.put('/:id/password', ProfesionalController.changePassword); // Cambiar contraseña con clave de registro

// Ruta protegida para obtener perfil del profesional actual
router.get('/perfil', authenticateToken, ProfesionalController.getPerfil);

module.exports = router;
