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
}

module.exports = AuthController;

