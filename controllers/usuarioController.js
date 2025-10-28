const Usuario = require('../models/usuario');
const pacienteService = require('../service/pacienteService');

class UsuarioController {
    // Obtener pacientes por profesional (OPTIMIZADO CON CACHÉ)
    static async getPacientesByProfesional(req, res) {
        try {
            const { profesionalId } = req.params;
            const { search, status, sortBy, forceRefresh, page = 1, limit = 10 } = req.query;
            
            if (!profesionalId || isNaN(profesionalId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de profesional inválido'
                });
            }
            
            
            // Usar el servicio optimizado con caché
            const result = await pacienteService.getPacientesByProfesional(profesionalId, {
                search,
                status,
                sortBy,
                forceRefresh: forceRefresh === 'true',
                page: parseInt(page),
                limit: parseInt(limit)
            });
            
            res.json(result);
            
        } catch (error) {
            console.error('Error obteniendo pacientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener estadísticas de pacientes
    static async getPacientesStats(req, res) {
        try {
            const { profesionalId } = req.params;
            
            if (!profesionalId || isNaN(profesionalId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de profesional inválido'
                });
            }
            
            const pacientes = await Usuario.findByProfesionalId(profesionalId);
            
            // Obtener estadísticas de consultas
            const consultasQuery = `
                SELECT 
                    COUNT(*) as total_consultas,
                    COUNT(CASE WHEN fecha >= CURDATE() AND estado = 'activo' THEN 1 END) as consultas_pendientes,
                    COUNT(CASE WHEN fecha >= CURDATE() - INTERVAL 30 DAY THEN 1 END) as consultas_ultimo_mes
                FROM consultas 
                WHERE profesional_id = ?
            `;
            const [consultasStats] = await Usuario.executeQuery(consultasQuery, [profesionalId]);
            
            const stats = {
                total_pacientes: pacientes.length,
                pacientes_activos: pacientes.filter(p => p.activo).length,
                pacientes_inactivos: pacientes.filter(p => !p.activo).length,
                consultas_pendientes: consultasStats.consultas_pendientes || 0,
                con_consultas: consultasStats.consultas_ultimo_mes || 0
            };
            
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

    // Crear nuevo paciente
    static async createPaciente(req, res) {
        try {
            const { profesionalId } = req.params;
            const pacienteData = req.body;
            
            if (!profesionalId || isNaN(profesionalId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de profesional inválido'
                });
            }
            
            // Validaciones básicas
            if (!pacienteData.apellido_nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'Apellido y nombre son obligatorios'
                });
            }
            
            // Asignar el profesional_id
            pacienteData.profesional_id = parseInt(profesionalId);
            
            const pacienteId = await Usuario.create(pacienteData);
            
            // Invalidar caché del profesional
            pacienteService.invalidateProfesionalCache(profesionalId);
            
            res.status(201).json({
                success: true,
                message: 'Paciente creado exitosamente',
                data: { id: pacienteId }
            });
            
        } catch (error) {
            console.error('Error creando paciente:', error);
            
            // Manejar errores específicos de MySQL
            if (error.code === 'ER_DUP_ENTRY') {
                let message = 'Ya existe un paciente con este documento';
                
                // Detectar qué campo específico está duplicado
                if (error.sqlMessage.includes('numero_documento')) {
                    message = 'Ya existe un paciente con este número de documento';
                } else if (error.sqlMessage.includes('numero_historia_clinica')) {
                    message = 'Ya existe un paciente con este número de historia clínica';
                } else if (error.sqlMessage.includes('email')) {
                    message = 'Ya existe un paciente con este email';
                }
                
                return res.status(400).json({
                    success: false,
                    message: message,
                    field: error.sqlMessage.includes('numero_documento') ? 'numero_documento' : 
                           error.sqlMessage.includes('numero_historia_clinica') ? 'numero_historia_clinica' :
                           error.sqlMessage.includes('email') ? 'email' : null
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener paciente por ID
    static async getPacienteById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de paciente inválido'
                });
            }
            
            const paciente = await Usuario.findById(id);
            
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }
            
            res.json({
                success: true,
                message: 'Paciente obtenido exitosamente',
                data: paciente.toPublicObject()
            });
            
        } catch (error) {
            console.error('Error obteniendo paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Actualizar paciente
    static async updatePaciente(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de paciente inválido'
                });
            }
            
            const paciente = await Usuario.findById(id);
            
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }
            
            // Si se está actualizando la contraseña, hashearla
            if (updateData.contrasena) {
                const bcrypt = require('bcryptjs');
                updateData.contrasena = await bcrypt.hash(updateData.contrasena, 10);
            }
            
            const updated = await Usuario.update(id, updateData);
            
            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo actualizar el paciente'
                });
            }
            
            // Invalidar caché del paciente y su profesional
            pacienteService.invalidatePacienteCache(id, paciente.profesional_id);
            
            res.json({
                success: true,
                message: 'Paciente actualizado exitosamente'
            });
            
        } catch (error) {
            console.error('Error actualizando paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Eliminar paciente (soft delete)
    static async deletePaciente(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de paciente inválido'
                });
            }
            
            const paciente = await Usuario.findById(id);
            
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }
            
            const deleted = await Usuario.delete(id);
            
            if (!deleted) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo eliminar el paciente'
                });
            }
            
            res.json({
                success: true,
                message: 'Paciente eliminado exitosamente'
            });
            
        } catch (error) {
            console.error('Error eliminando paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener estadísticas del caché (para debugging)
    static async getCacheStats(req, res) {
        try {
            const stats = pacienteService.getCacheStats();
            
            res.json({
                success: true,
                message: 'Estadísticas del caché obtenidas',
                data: stats
            });
            
        } catch (error) {
            console.error('Error obteniendo estadísticas del caché:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Limpiar caché (para debugging)
    static async clearCache(req, res) {
        try {
            pacienteService.clearCache();
            
            res.json({
                success: true,
                message: 'Caché limpiado exitosamente'
            });
            
        } catch (error) {
            console.error('Error limpiando caché:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Verificar si un usuario ya existe
    static async checkUserExists(req, res) {
        try {
            const { username } = req.params;
            
            if (!username) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre de usuario requerido'
                });
            }

            const exists = await Usuario.checkUserExists(username);
            
            res.json({
                success: true,
                exists: exists
            });
            
        } catch (error) {
            console.error('Error verificando usuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Crear paciente directamente (usa el profesional del token)
    static async createPacienteDirect(req, res) {
        try {
            const profesionalId = req.user.id; // Obtener del token
            const pacienteData = { ...req.body, profesional_id: profesionalId };
            
            // Validar datos básicos requeridos
            if (!pacienteData.apellido_nombre) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre del paciente es obligatorio'
                });
            }
            
            // Los pacientes ya no pueden crear cuentas de usuario
            // Siempre establecer crear_cuenta como false
            pacienteData.crear_cuenta = false;
            delete pacienteData.usuario;
            delete pacienteData.contrasena;

            // Crear paciente
            const pacienteId = await Usuario.create(pacienteData);
            
            // Invalidar caché del profesional
            pacienteService.invalidateProfesionalCache(profesionalId);
            
            const message = 'Paciente creado exitosamente (sin acceso al sistema)';
            
            res.status(201).json({
                success: true,
                message: message,
                data: { 
                    id: pacienteId,
                    tiene_cuenta: false
                }
            });
            
        } catch (error) {
            console.error('Error creando paciente:', error);
            
            // Manejar errores específicos de MySQL
            if (error.code === 'ER_DUP_ENTRY') {
                let message = 'Ya existe un paciente con este documento';
                
                // Detectar qué campo específico está duplicado
                if (error.sqlMessage.includes('numero_documento')) {
                    message = 'Ya existe un paciente con este número de documento';
                } else if (error.sqlMessage.includes('numero_historia_clinica')) {
                    message = 'Ya existe un paciente con este número de historia clínica';
                } else if (error.sqlMessage.includes('email')) {
                    message = 'Ya existe un paciente con este email';
                }
                
                return res.status(400).json({
                    success: false,
                    message: message,
                    field: error.sqlMessage.includes('numero_documento') ? 'numero_documento' : 
                           error.sqlMessage.includes('numero_historia_clinica') ? 'numero_historia_clinica' :
                           error.sqlMessage.includes('email') ? 'email' : null
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Resetear contraseña de paciente
    static async resetPatientPassword(req, res) {
        try {
            const { id } = req.params;
            const { nueva_contrasena } = req.body;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de paciente inválido'
                });
            }
            
            if (!nueva_contrasena) {
                return res.status(400).json({
                    success: false,
                    message: 'Nueva contraseña es obligatoria'
                });
            }
            
            if (nueva_contrasena.length < 6) {
                return res.status(400).json({
                    success: false,
                    message: 'La contraseña debe tener al menos 6 caracteres'
                });
            }
            
            // Verificar que el paciente existe
            const paciente = await Usuario.findById(id);
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }
            
            // Verificar que el paciente tiene cuenta
            const tieneCuenta = await Usuario.hasValidAccount(id);
            if (!tieneCuenta) {
                return res.status(400).json({
                    success: false,
                    message: 'El paciente no tiene cuenta de usuario'
                });
            }
            
            // Hashear la nueva contraseña
            const hashedPassword = await bcrypt.hash(nueva_contrasena, 10);
            
            // Actualizar la contraseña
            const query = 'UPDATE usuarios SET contrasena = ? WHERE id = ?';
            await Usuario.executeQuery(query, [hashedPassword, id]);
            
            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente',
                data: {
                    paciente_id: id,
                    paciente_nombre: paciente.apellido_nombre,
                    usuario: paciente.usuario
                }
            });
            
        } catch (error) {
            console.error('Error reseteando contraseña:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Limpiar usuarios temporales y permitir crear cuenta real
    static async limpiarUsuarioTemporal(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de paciente inválido'
                });
            }
            
            // Verificar que el paciente existe
            const paciente = await Usuario.findById(id);
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }
            
            // Verificar si tiene usuario temporal
            const esUsuarioTemporal = paciente.usuario && (
                paciente.usuario.startsWith('temp_') || 
                paciente.contrasena && paciente.contrasena.startsWith('temp_password_')
            );
            
            if (!esUsuarioTemporal) {
                return res.status(400).json({
                    success: false,
                    message: 'El paciente no tiene usuario temporal'
                });
            }
            
            // Limpiar usuario y contraseña temporal
            const query = 'UPDATE usuarios SET usuario = NULL, contrasena = NULL WHERE id = ?';
            await Usuario.executeQuery(query, [id]);
            
            res.json({
                success: true,
                message: 'Usuario temporal limpiado exitosamente. Ahora puedes crear una cuenta real.',
                data: {
                    paciente_id: id,
                    paciente_nombre: paciente.apellido_nombre
                }
            });
            
        } catch (error) {
            console.error('Error limpiando usuario temporal:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Crear cuenta de usuario para paciente existente
    static async createAccountForPatient(req, res) {
        try {
            const { id } = req.params;
            const { usuario, contrasena } = req.body;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de paciente inválido'
                });
            }
            
            if (!usuario || !contrasena) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario y contraseña son obligatorios'
                });
            }
            
            // Verificar que el paciente existe
            const paciente = await Usuario.findById(id);
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }
            
            // Verificar que el usuario no esté en uso
            const userExists = await Usuario.checkUserExists(usuario);
            if (userExists) {
                return res.status(400).json({
                    success: false,
                    message: 'Este nombre de usuario ya está en uso'
                });
            }
            
            // Crear la cuenta
            const success = await Usuario.createAccountForPatient(id, { usuario, contrasena });
            
            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo crear la cuenta de usuario'
                });
            }
            
            // Invalidar caché del profesional
            pacienteService.invalidateProfesionalCache(paciente.profesional_id);
            
            res.json({
                success: true,
                message: 'Cuenta de usuario creada exitosamente',
                data: { paciente_id: id, usuario: usuario }
            });
            
        } catch (error) {
            console.error('Error creando cuenta de usuario:', error);
            
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario ya está en uso'
                });
            }
            
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener datos del profesional asignado al paciente
    static async getMyProfesional(req, res) {
        try {
            const pacienteId = req.user.id;
            
            // Obtener los datos del paciente para acceder al profesional_id
            const paciente = await Usuario.findById(pacienteId);
            
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            if (!paciente.profesional_id) {
                return res.status(404).json({
                    success: false,
                    message: 'No tienes un profesional asignado'
                });
            }

            // Obtener los datos del profesional
            const Profesional = require('../models/profesional');
            const profesional = await Profesional.findById(paciente.profesional_id);
            
            if (!profesional) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesional asignado no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Datos del profesional obtenidos exitosamente',
                data: profesional.toPublicObject()
            });

        } catch (error) {
            console.error('Error obteniendo datos del profesional:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = UsuarioController;