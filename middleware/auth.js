const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const Profesional = require('../models/profesional');
const Usuario = require('../models/usuario');

// Middleware de autenticación JWT
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Token de acceso requerido'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret-key', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                message: 'Token inválido o expirado'
            });
        }
        req.user = user;
        next();
    });
};

// Función para generar JWT
const generateToken = (user) => {
    return jwt.sign(
        {
            id: user.id,
            usuario: user.usuario,
            rol: user.rol,
            nombre: user.nombre
        },
        process.env.JWT_SECRET || 'fallback-secret-key',
        { expiresIn: '24h' }
    );
};

// Función para autenticar profesional
const authenticateProfessional = async (usuario, password) => {
    try {
        const profesional = await Profesional.findByUsuario(usuario);
        
        if (!profesional) {
            return {
                success: false,
                message: 'Usuario o contraseña incorrectos'
            };
        }

        const isValidPassword = await bcrypt.compare(password, profesional.contrasena);
        
        if (!isValidPassword) {
            return {
                success: false,
                message: 'Usuario o contraseña incorrectos'
            };
        }

        return {
            success: true,
            user: {
                id: profesional.id,
                usuario: profesional.usuario,
                nombre: profesional.nombre,
                email: profesional.email,
                rol: 'profesional',
                timezone: profesional.timezone
            }
        };
    } catch (error) {
        console.error('Error authenticating professional:', error);
        return {
            success: false,
            message: 'Error interno del servidor'
        };
    }
};

// Función para autenticar paciente
const authenticatePatient = async (usuario, password) => {
    try {
        // Buscar paciente por usuario, email o número de documento
        let paciente = await Usuario.findByUsuario(usuario);
        
        // Si no se encuentra por usuario, intentar por email
        if (!paciente) {
            paciente = await Usuario.findByEmail(usuario);
        }
        
        // Si aún no se encuentra, intentar por número de documento
        if (!paciente) {
            const query = 'SELECT * FROM usuarios WHERE numero_documento = ? AND rol = "paciente"';
            const results = await Usuario.executeQuery(query, [usuario]);
            paciente = results.length > 0 ? new Usuario(results[0]) : null;
        }
        
        if (!paciente) {
            return {
                success: false,
                message: 'Usuario o contraseña incorrectos'
            };
        }

        if (!paciente.activo) {
            return {
                success: false,
                message: 'Cuenta desactivada. Contacta a tu profesional.'
            };
        }

        const isValidPassword = await bcrypt.compare(password, paciente.contrasena);
        
        if (!isValidPassword) {
            return {
                success: false,
                message: 'Usuario o contraseña incorrectos'
            };
        }

        return {
            success: true,
            user: {
                id: paciente.id,
                usuario: paciente.usuario,
                nombre: paciente.apellido_nombre,
                email: paciente.email,
                rol: 'paciente',
                profesional_id: paciente.profesional_id,
                numero_documento: paciente.numero_documento,
                telefono: paciente.telefono
            }
        };
    } catch (error) {
        console.error('Error authenticating patient:', error);
        return {
            success: false,
            message: 'Error interno del servidor'
        };
    }
};

// Función principal de autenticación - SOLO PROFESIONALES
const authenticateUser = async (usuario, password) => {
    // Solo autenticar profesionales
    const professionalAuth = await authenticateProfessional(usuario, password);
    if (professionalAuth.success) {
        return professionalAuth;
    }

    // Los pacientes ya no pueden acceder al sistema
    return {
        success: false,
        message: 'Usuario o contraseña incorrectos'
    };
};

module.exports = {
    authenticateToken,
    generateToken,
    authenticateUser,
    authenticateProfessional,
    authenticatePatient
};

