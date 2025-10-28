const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

// Rutas de autenticación
router.post('/login', AuthController.login);                    // Login de usuario
router.post('/logout', AuthController.logout);                  // Logout de usuario
router.get('/verify', authenticateToken, AuthController.verifyToken); // Verificar token
router.get('/me', authenticateToken, AuthController.getCurrentUser); // Obtener usuario actual

module.exports = router;