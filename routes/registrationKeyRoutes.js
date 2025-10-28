const express = require('express');
const router = express.Router();
const {
    validateRegistrationKey,
    getAllRegistrationKeys,
    createRegistrationKey
} = require('../controllers/registrationKeyController');

// Validar clave de registro
router.post('/validate-registration-key', validateRegistrationKey);

// Obtener todas las claves de registro (para administración)
router.get('/registration-keys', getAllRegistrationKeys);

// Crear nueva clave de registro (para administración)
router.post('/registration-keys', createRegistrationKey);

module.exports = router;
