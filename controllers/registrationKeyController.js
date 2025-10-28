const { isValidRegistrationKey, getKeyDescription } = require('../config/registrationKeys');

// Validar clave de registro
const validateRegistrationKey = async (req, res) => {
    try {
        const { clave } = req.body;

        if (!clave) {
            return res.status(400).json({
                success: false,
                message: 'La clave de registro es requerida'
            });
        }

        // Validar formato básico
        const claveRegex = /^NUTRI-[A-Z0-9]+$/;
        if (!claveRegex.test(clave)) {
            return res.status(400).json({
                success: false,
                valid: false,
                message: 'Formato de clave inválido. Debe ser NUTRI-XXXX'
            });
        }

        // Validar con las claves del .env
        if (isValidRegistrationKey(clave)) {
            res.json({
                success: true,
                valid: true,
                message: 'Clave de registro válida',
                clave: {
                    descripcion: getKeyDescription(clave)
                }
            });
        } else {
            res.json({
                success: true,
                valid: false,
                message: 'Clave de registro inválida'
            });
        }
    } catch (error) {
        console.error('Error validating registration key:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener todas las claves de registro (para administración)
const getAllRegistrationKeys = async (req, res) => {
    try {
        const { getValidRegistrationKeys, getKeyDescription } = require('../config/registrationKeys');
        const validKeys = getValidRegistrationKeys();
        
        const claves = validKeys.map(clave => ({
            clave: clave,
            descripcion: getKeyDescription(clave),
            activa: true,
            usada_por: null,
            fecha_creacion: new Date().toISOString(),
            fecha_uso: null,
            creada_por: 'admin'
        }));
        
        res.json({
            success: true,
            claves: claves
        });
    } catch (error) {
        console.error('Error getting registration keys:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Crear nueva clave de registro (para administración)
const createRegistrationKey = async (req, res) => {
    try {
        const { clave, descripcion, creada_por = 'admin' } = req.body;

        if (!clave) {
            return res.status(400).json({
                success: false,
                message: 'La clave es requerida'
            });
        }

        // Validar formato
        const claveRegex = /^NUTRI-[A-Z0-9]+$/;
        if (!claveRegex.test(clave)) {
            return res.status(400).json({
                success: false,
                message: 'Formato de clave inválido. Debe ser NUTRI-XXXX'
            });
        }

        // Nota: En un sistema real, aquí se actualizaría la variable REGISTRATION_KEYS en el .env
        // Por ahora, solo validamos el formato
        res.status(201).json({
            success: true,
            message: 'Clave de registro creada exitosamente. Recuerda agregarla a REGISTRATION_KEYS en el .env'
        });
    } catch (error) {
        console.error('Error creating registration key:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    validateRegistrationKey,
    getAllRegistrationKeys,
    createRegistrationKey
};
