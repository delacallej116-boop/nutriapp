// Configuración de claves de registro profesional
require('dotenv').config();

const REGISTRATION_KEYS = process.env.REGISTRATION_KEYS || 'NUTRI-ADMIN,NUTRI-MED001,NUTRI-NUT001,NUTRI-CLIN001,NUTRI-DEP001';

// Parsear las claves desde la variable de entorno
const parseRegistrationKeys = () => {
    return REGISTRATION_KEYS.split(',').map(key => key.trim()).filter(key => key.length > 0);
};

// Validar si una clave está en la lista permitida
const isValidRegistrationKey = (clave) => {
    const validKeys = parseRegistrationKeys();
    return validKeys.includes(clave);
};

// Obtener todas las claves válidas
const getValidRegistrationKeys = () => {
    return parseRegistrationKeys();
};

// Generar descripción para cada clave
const getKeyDescription = (clave) => {
    const descriptions = {
        'NUTRI-ADMIN': 'Clave maestra para administradores del sistema',
        'NUTRI-MED001': 'Clave para profesionales médicos especializados',
        'NUTRI-NUT001': 'Clave para nutricionistas certificados',
        'NUTRI-CLIN001': 'Clave para profesionales clínicos',
        'NUTRI-DEP001': 'Clave para nutricionistas deportivos'
    };
    return descriptions[clave] || 'Clave de registro profesional';
};

module.exports = {
    isValidRegistrationKey,
    getValidRegistrationKeys,
    getKeyDescription,
    parseRegistrationKeys
};
