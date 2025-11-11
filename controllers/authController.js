const { authenticateUser, generateToken } = require('../middleware/auth');

class AuthController {
    // Login de usuario (profesional o paciente)
    static async login(req, res) {
        try {
            const { usuario, password } = req.body;

            // Validaciones básicas
            if (!usuario || !password) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario y contraseña son obligatorios'
                });
            }

            // Validar formato de usuario - más flexible para pacientes
            const usuarioRegex = /^[a-zA-Z0-9_@.-]{3,50}$/;
            if (!usuarioRegex.test(usuario)) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario debe tener entre 3 y 50 caracteres (letras, números, guiones bajos, @, . y -)'
                });
            }
            
            // Autenticar usuario
            const authResult = await authenticateUser(usuario, password);

            if (!authResult.success) {
                return res.status(401).json({
                    success: false,
                    message: authResult.message
                });
            }

            // Generar token JWT
            const token = generateToken(authResult.user);

            // Respuesta exitosa
            res.json({
                success: true,
                message: 'Inicio de sesión exitoso',
                data: {
                    token,
                    user: authResult.user
                }
            });

        } catch (error) {
            console.error('Error en login:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Verificar token y obtener información del usuario
    static async verifyToken(req, res) {
        try {
            // El middleware authenticateToken ya validó el token
            res.json({
                success: true,
                message: 'Token válido',
                data: {
                    user: req.user
                }
            });
        } catch (error) {
            console.error('Error verificando token:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Logout (invalidar token del lado del cliente)
    static async logout(req, res) {
        try {
            // En un sistema JWT stateless, el logout se maneja del lado del cliente
            // eliminando el token del localStorage/sessionStorage
            res.json({
                success: true,
                message: 'Sesión cerrada exitosamente'
            });
        } catch (error) {
            console.error('Error en logout:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener información del usuario actual
    static async getCurrentUser(req, res) {
        try {
            // El middleware authenticateToken ya validó el token y agregó req.user
            res.json({
                success: true,
                message: 'Usuario obtenido exitosamente',
                data: {
                    user: req.user
                }
            });
        } catch (error) {
            console.error('Error obteniendo usuario actual:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Solicitar recuperación de contraseña
    static async requestPasswordReset(req, res) {
        try {
            const { usuarioOEmail, codigoRegistro } = req.body;

            // Validaciones básicas
            if (!usuarioOEmail || !codigoRegistro) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario/Email y código de registro son obligatorios'
                });
            }

            // Validar código de registro
            const { isValidRegistrationKey } = require('../config/registrationKeys');
            if (!isValidRegistrationKey(codigoRegistro)) {
                return res.status(400).json({
                    success: false,
                    message: 'Código de registro inválido'
                });
            }

            // Buscar profesional por usuario o email
            const Profesional = require('../models/profesional');
            let profesional = await Profesional.findByUsuario(usuarioOEmail);
            
            if (!profesional) {
                profesional = await Profesional.findByEmail(usuarioOEmail);
            }

            if (!profesional) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró ningún profesional con ese usuario o email'
                });
            }

            // Verificar que el código de registro coincida con el usado en el registro
            if (profesional.clave_registro_usada !== codigoRegistro) {
                return res.status(400).json({
                    success: false,
                    message: 'El código de registro no coincide con el usado en el registro'
                });
            }

            // Retornar información de confirmación (sin datos sensibles)
            res.json({
                success: true,
                message: 'Validación exitosa. Puedes proceder a cambiar tu contraseña.',
                data: {
                    usuario: profesional.usuario,
                    nombre: profesional.nombre
                }
            });

        } catch (error) {
            console.error('Error en requestPasswordReset:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Resetear contraseña
    static async resetPassword(req, res) {
        try {
            const bcrypt = require('bcryptjs');
            const { usuarioOEmail, codigoRegistro, nuevaContraseña } = req.body;

            // Validaciones básicas
            if (!usuarioOEmail || !codigoRegistro || !nuevaContraseña) {
                return res.status(400).json({
                    success: false,
                    message: 'Todos los campos son obligatorios'
                });
            }

            // Validar código de registro
            const { isValidRegistrationKey } = require('../config/registrationKeys');
            if (!isValidRegistrationKey(codigoRegistro)) {
                return res.status(400).json({
                    success: false,
                    message: 'Código de registro inválido'
                });
            }

            // Validar contraseña
            if (nuevaContraseña.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }

            // Buscar profesional por usuario o email
            const Profesional = require('../models/profesional');
            let profesional = await Profesional.findByUsuario(usuarioOEmail);
            
            if (!profesional) {
                profesional = await Profesional.findByEmail(usuarioOEmail);
            }

            if (!profesional) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró ningún profesional con ese usuario o email'
                });
            }

            // Verificar que el código de registro coincida
            if (profesional.clave_registro_usada !== codigoRegistro) {
                return res.status(400).json({
                    success: false,
                    message: 'El código de registro no coincide con el usado en el registro'
                });
            }

            // Verificar que el profesional tenga contraseña actual
            if (!profesional.contrasena) {
                // Si no tiene contraseña, permitir establecerla sin verificar la antigua
                // El método update hashea automáticamente, pasamos texto plano
                await profesional.update({ contrasena: nuevaContraseña });

                return res.json({
                    success: true,
                    message: 'Contraseña establecida exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
                });
            }

            // Verificar que la nueva contraseña sea diferente a la actual
            const esMismaContraseña = await bcrypt.compare(nuevaContraseña, profesional.contrasena);

            if (esMismaContraseña) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva contraseña no puede ser igual a la contraseña actual. Por favor, elige una contraseña diferente.'
                });
            }

            // Actualizar contraseña (el método update hashea automáticamente)
            // Pasamos la contraseña en texto plano, no el hash
            await profesional.update({ contrasena: nuevaContraseña });

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente. Ya puedes iniciar sesión con tu nueva contraseña.'
            });

        } catch (error) {
            console.error('Error en resetPassword:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = AuthController;

