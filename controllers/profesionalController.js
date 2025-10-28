const Profesional = require('../models/profesional');
const { isValidRegistrationKey } = require('../config/registrationKeys');

class ProfesionalController {
    // Crear un nuevo profesional
    static async create(req, res) {
        try {
            const { nombre, email, telefono, contrasena, timezone } = req.body;
            
            // Validaciones básicas
            if (!nombre || !email || !contrasena) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre, email y contraseña son obligatorios'
                });
            }
            
            // Verificar si el email ya existe
            const profesionalExistente = await Profesional.findByEmail(email);
            if (profesionalExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un profesional con este email'
                });
            }
            
            const profesionalData = {
                nombre,
                email,
                telefono,
                contrasena,
                timezone
            };
            
            const profesionalId = await Profesional.create(profesionalData);
            
            res.status(201).json({
                success: true,
                message: 'Profesional creado exitosamente',
                data: { id: profesionalId }
            });
            
        } catch (error) {
            console.error('Error creando profesional:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Registro de profesional (con validación de clave)
    static async register(req, res) {
        try {
            const { 
                nombre, 
                usuario, 
                email, 
                telefono, 
                timezone, 
                password, 
                confirmPassword,
                especialidad, 
                matricula, 
                experiencia, 
                descripcion, 
                clave_registro,
                terminos 
            } = req.body;
            
            // Validaciones básicas
            if (!nombre || !usuario || !password || !clave_registro) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre, usuario, contraseña y clave de registro son obligatorios'
                });
            }

            // Validar términos y condiciones
            if (!terminos) {
                return res.status(400).json({
                    success: false,
                    message: 'Debes aceptar los términos y condiciones'
                });
            }

            // Validar contraseñas
            if (password !== confirmPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Las contraseñas no coinciden'
                });
            }

            // Validar clave de registro
            if (!isValidRegistrationKey(clave_registro)) {
                return res.status(400).json({
                    success: false,
                    message: 'Clave de registro inválida'
                });
            }

            // Verificar si el usuario ya existe
            const usuarioExistente = await Profesional.findByUsuario(usuario);
            if (usuarioExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un profesional con este usuario'
                });
            }

            // Verificar si el email ya existe (si se proporciona)
            if (email) {
                const emailExistente = await Profesional.findByEmail(email);
                if (emailExistente) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe un profesional con este email'
                    });
                }
            }
            
            const profesionalData = {
                nombre,
                usuario,
                email: email || null,
                telefono: telefono || null,
                contrasena: password,
                timezone: timezone || 'UTC',
                especialidad: especialidad || null,
                matricula: matricula || null,
                experiencia: experiencia || null,
                descripcion: descripcion || null,
                clave_registro_usada: clave_registro
            };
            
            const profesionalId = await Profesional.create(profesionalData);
            
            res.status(201).json({
                success: true,
                message: 'Profesional registrado exitosamente',
                data: { 
                    id: profesionalId,
                    usuario: usuario,
                    nombre: nombre
                }
            });
            
        } catch (error) {
            console.error('Error registrando profesional:', error);
            
            // Manejar errores específicos de MySQL
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    success: false,
                    message: 'El usuario o email ya existe'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener todos los profesionales
    static async getAll(req, res) {
        try {
            const profesionales = await Profesional.findAll();
            
            res.json({
                success: true,
                message: 'Profesionales obtenidos exitosamente',
                data: profesionales.map(p => p.toPublicObject()),
                count: profesionales.length
            });
            
        } catch (error) {
            console.error('Error obteniendo profesionales:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener profesional por ID
    static async getById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de profesional inválido'
                });
            }
            
            const profesional = await Profesional.findById(id);
            
            if (!profesional) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesional no encontrado'
                });
            }
            
            res.json({
                success: true,
                message: 'Profesional obtenido exitosamente',
                data: profesional.toPublicObject()
            });
            
        } catch (error) {
            console.error('Error obteniendo profesional:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Actualizar profesional
    static async update(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de profesional inválido'
                });
            }
            
            const profesional = await Profesional.findById(id);
            
            if (!profesional) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesional no encontrado'
                });
            }
            
            // Si se está actualizando el email, verificar que no exista otro profesional con ese email
            if (updateData.email && updateData.email !== profesional.email) {
                const profesionalExistente = await Profesional.findByEmail(updateData.email);
                if (profesionalExistente) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe un profesional con este email'
                    });
                }
            }
            
            await profesional.update(updateData);
            
            res.json({
                success: true,
                message: 'Profesional actualizado exitosamente',
                data: profesional.toPublicObject()
            });
            
        } catch (error) {
            console.error('Error actualizando profesional:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Eliminar profesional
    static async delete(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de profesional inválido'
                });
            }
            
            const profesional = await Profesional.findById(id);
            
            if (!profesional) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesional no encontrado'
                });
            }
            
            await profesional.delete();
            
            res.json({
                success: true,
                message: 'Profesional eliminado exitosamente'
            });
            
        } catch (error) {
            console.error('Error eliminando profesional:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener estadísticas del profesional
    static async getStats(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de profesional inválido'
                });
            }
            
            const profesional = await Profesional.findById(id);
            
            if (!profesional) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesional no encontrado'
                });
            }
            
            const stats = await Profesional.getStats(id);
            
            res.json({
                success: true,
                message: 'Estadísticas obtenidas exitosamente',
                data: stats
            });
            
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Buscar profesional por email
    static async getByEmail(req, res) {
        try {
            const { email } = req.params;
            
            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email es obligatorio'
                });
            }
            
            const profesional = await Profesional.findByEmail(email);
            
            if (!profesional) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesional no encontrado'
                });
            }
            
            res.json({
                success: true,
                message: 'Profesional obtenido exitosamente',
                data: profesional.toPublicObject()
            });
            
        } catch (error) {
            console.error('Error obteniendo profesional por email:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Buscar profesional por usuario
    static async getByUsuario(req, res) {
        try {
            const { usuario } = req.params;
            
            if (!usuario) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario es obligatorio'
                });
            }
            
            const profesional = await Profesional.findByUsuario(usuario);
            
            if (!profesional) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesional no encontrado'
                });
            }
            
            res.json({
                success: true,
                message: 'Profesional obtenido exitosamente',
                data: profesional.toPublicObject()
            });
            
        } catch (error) {
            console.error('Error obteniendo profesional por usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Cambiar contraseña usando clave de registro
    static async changePassword(req, res) {
        try {
            const { id } = req.params;
            const { registrationKey, newPassword } = req.body;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de profesional inválido'
                });
            }
            
            if (!registrationKey || !newPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Clave de registro y nueva contraseña son obligatorias'
                });
            }
            
            // Validar longitud de contraseña
            if (newPassword.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva contraseña debe tener al menos 6 caracteres'
                });
            }
            
            const profesional = await Profesional.findById(id);
            
            if (!profesional) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesional no encontrado'
                });
            }
            
            // Verificar que la clave de registro coincida con la usada
            if (profesional.clave_registro_usada !== registrationKey) {
                return res.status(400).json({
                    success: false,
                    message: 'La clave de registro no es correcta'
                });
            }
            
            // Actualizar la contraseña
            await profesional.update({ contrasena: newPassword });
            
            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });
            
        } catch (error) {
            console.error('Error cambiando contraseña:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener perfil del profesional actual
    static async getPerfil(req, res) {
        try {
            const profesionalId = req.user.id;
            
            const profesional = await Profesional.findById(profesionalId);
            
            if (!profesional) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesional no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Perfil obtenido exitosamente',
                data: profesional.toPublicObject()
            });

        } catch (error) {
            console.error('Error obteniendo perfil del profesional:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = ProfesionalController;
