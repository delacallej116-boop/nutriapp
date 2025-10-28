const Consulta = require('../models/consulta');
const Usuario = require('../models/usuario');
const Profesional = require('../models/profesional');
const cacheService = require('../service/cacheService');
const EmailService = require('../service/emailService');

class ConsultaController {
    // Obtener consultas/turnos de un profesional con filtros
    static async getConsultasByProfesional(req, res) {
        try {
            const { id } = req.params;
            const { estado, fecha, paciente, periodo } = req.query;
            
            // Validar que el profesional existe
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de profesional inválido' 
                });
            }

            // Construir filtros
            const filtros = {
                profesional_id: parseInt(id),
                estado: estado || null,
                fecha: fecha || null,
                paciente: paciente || null,
                periodo: periodo || null
            };

            console.log('🔍 Buscando consultas con filtros:', filtros);

            const consultas = await Consulta.findByProfesional(filtros);
            
            // Formatear datos para el frontend
            const consultasFormateadas = consultas.map(consulta => ({
                id: consulta.id,
                fecha: consulta.fecha,
                hora: consulta.hora,
                estado: consulta.estado,
                objetivo: consulta.objetivo,
                motivo_consulta: consulta.motivo_consulta,
                condiciones_medicas: consulta.condiciones_medicas,
                notas_profesional: consulta.notas_profesional,
                codigo_cancelacion: consulta.codigo_cancelacion,
                paciente_nombre: consulta.paciente_nombre,
                paciente_email: consulta.paciente_email,
                paciente_telefono: consulta.paciente_telefono,
                creado_en: consulta.creado_en
            }));

            console.log(`✅ ${consultasFormateadas.length} consultas encontradas`);

            res.json({
                success: true,
                data: consultasFormateadas,
                total: consultasFormateadas.length
            });

        } catch (error) {
            console.error('Error al obtener consultas:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al obtener consultas' 
            });
        }
    }

    // Obtener estadísticas de consultas de un profesional
    static async getConsultasStats(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de profesional inválido' 
                });
            }

            const stats = await Consulta.getStatsByProfesional(parseInt(id));
            
            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error al obtener estadísticas de consultas:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al obtener estadísticas' 
            });
        }
    }

    // Completar una consulta
    static async completarConsulta(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de consulta inválido' 
                });
            }

            const consulta = await Consulta.findById(parseInt(id));
            
            if (!consulta) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Consulta no encontrada' 
                });
            }

            if (consulta.estado !== 'activo') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Solo se pueden completar consultas activas' 
                });
            }

            const actualizada = await Consulta.update(parseInt(id), {
                estado: 'completado',
                actualizado_en: new Date()
            });

            if (actualizada) {
                // Invalidar caché del profesional
                cacheService.invalidateProfesionalCache(consulta.profesional_id);
                
                console.log(`✅ Consulta ${id} completada exitosamente`);
                
                res.json({
                    success: true,
                    message: 'Consulta completada exitosamente',
                    data: { id: parseInt(id), estado: 'completado' }
                });
            } else {
                throw new Error('Error al actualizar la consulta');
            }

        } catch (error) {
            console.error('Error al completar consulta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al completar consulta' 
            });
        }
    }

    // Marcar consulta como ausente
    static async marcarAusente(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de consulta inválido' 
                });
            }

            const consulta = await Consulta.findById(parseInt(id));
            
            if (!consulta) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Consulta no encontrada' 
                });
            }

            if (consulta.estado !== 'activo') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Solo se pueden marcar como ausentes consultas activas' 
                });
            }

            const actualizada = await Consulta.update(parseInt(id), {
                estado: 'ausente',
                actualizado_en: new Date()
            });

            if (actualizada) {
                // Invalidar caché del profesional
                cacheService.invalidateProfesionalCache(consulta.profesional_id);
                
                console.log(`✅ Consulta ${id} marcada como ausente`);
                
                res.json({
                    success: true,
                    message: 'Consulta marcada como ausente exitosamente',
                    data: { id: parseInt(id), estado: 'ausente' }
                });
            } else {
                throw new Error('Error al actualizar la consulta');
            }

        } catch (error) {
            console.error('Error al marcar consulta como ausente:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al marcar consulta como ausente' 
            });
        }
    }

    // Obtener detalles de una consulta específica
    static async getConsultaById(req, res) {
        try {
            const { id } = req.params;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de consulta inválido' 
                });
            }

            const consulta = await Consulta.findById(parseInt(id));
            
            if (!consulta) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Consulta no encontrada' 
                });
            }

            // Formatear datos para el frontend
            const consultaFormateada = {
                id: consulta.id,
                fecha: consulta.fecha,
                hora: consulta.hora,
                estado: consulta.estado,
                objetivo: consulta.objetivo,
                motivo_consulta: consulta.motivo_consulta,
                condiciones_medicas: consulta.condiciones_medicas,
                notas_profesional: consulta.notas_profesional,
                codigo_cancelacion: consulta.codigo_cancelacion,
                paciente_nombre: consulta.paciente_nombre,
                paciente_email: consulta.paciente_email,
                paciente_telefono: consulta.paciente_telefono,
                peso: consulta.peso,
                altura: consulta.altura,
                evaluacion: consulta.evaluacion,
                plan_tratamiento: consulta.plan_tratamiento,
                observaciones: consulta.observaciones,
                creado_en: consulta.creado_en,
                actualizado_en: consulta.actualizado_en
            };

            res.json({
                success: true,
                data: consultaFormateada
            });

        } catch (error) {
            console.error('Error al obtener consulta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al obtener consulta' 
            });
        }
    }

    // Crear nueva consulta (para reservar turnos)
    static async createConsulta(req, res) {
        try {
            const profesional_id = req.user.id; // Obtenido del token JWT
            console.log('Profesional ID del token:', profesional_id);
            const { 
                usuario_id, 
                paciente_externo,
                tipo_paciente,
                fecha, 
                hora, 
                objetivo, 
                motivo_consulta, 
                condiciones_medicas 
            } = req.body;

            console.log('📝 Datos recibidos para crear consulta:', {
                tipo_paciente,
                usuario_id,
                paciente_externo,
                fecha,
                hora,
                objetivo,
                motivo_consulta,
                condiciones_medicas,
                peso: req.body.peso,
                altura: req.body.altura,
                notas_profesional: req.body.notas_profesional
            });

            // Validaciones básicas
            if (!fecha || !hora || !objetivo) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Fecha, hora y objetivo son obligatorios' 
                });
            }

            // Validar según tipo de paciente
            if (tipo_paciente === 'registrado') {
                if (!usuario_id) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'ID de usuario es obligatorio para pacientes registrados' 
                    });
                }
            } else if (tipo_paciente === 'externo') {
                if (!paciente_externo || !paciente_externo.nombre || !paciente_externo.telefono) {
                    return res.status(400).json({ 
                        success: false, 
                        message: 'Nombre y teléfono son obligatorios para pacientes externos' 
                    });
                }
            } else {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Tipo de paciente debe ser "registrado" o "externo"' 
                });
            }

            // VERIFICAR SI ES DÍA NO LABORAL
            const { executeQuery } = require('../config/db');
            const diaNoLaboralQuery = `
                SELECT COUNT(*) as count 
                FROM excepciones_horarios 
                WHERE profesional_id = ? AND fecha = ? AND activo = TRUE
            `;
            const diaNoLaboralResult = await executeQuery(diaNoLaboralQuery, [profesional_id, fecha]);
            const esDiaNoLaboral = diaNoLaboralResult[0].count > 0;
            
            if (esDiaNoLaboral) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Este día está marcado como no laboral y no se pueden agendar turnos' 
                });
            }

            // Verificar disponibilidad
            const disponible = await Consulta.checkAvailability(profesional_id, fecha, hora);
            if (!disponible) {
                return res.status(409).json({ 
                    success: false, 
                    message: 'El horario seleccionado no está disponible' 
                });
            }

            // Función helper para convertir undefined a null
            const toNull = (value) => value === undefined ? null : value;

            // Generar código de cancelación único
            const codigo_cancelacion = Consulta.generateCancellationCode();

            let consultaData = {
                profesional_id,
                fecha,
                hora,
                objetivo,
                motivo_consulta: toNull(motivo_consulta),
                condiciones_medicas: toNull(condiciones_medicas),
                peso: toNull(req.body.peso),
                altura: toNull(req.body.altura),
                notas_profesional: toNull(req.body.notas_profesional),
                codigo_cancelacion,
                estado: 'activo'
            };

            // Agregar datos específicos según tipo de paciente
            if (tipo_paciente === 'registrado') {
                consultaData.usuario_id = parseInt(usuario_id);
            } else if (tipo_paciente === 'externo') {
                consultaData.paciente_externo_nombre = paciente_externo.nombre;
                consultaData.paciente_externo_telefono = paciente_externo.telefono;
                consultaData.paciente_externo_email = paciente_externo.email || null;
                consultaData.usuario_id = null; // No hay usuario registrado
            }

            console.log('📝 Datos finales para crear consulta:', consultaData);

            const consultaId = await Consulta.create(consultaData);

            // Invalidar caché del profesional
            cacheService.invalidateProfesionalCache(profesional_id);

            console.log(`✅ Consulta ${consultaId} creada exitosamente para ${tipo_paciente}`);

            res.status(201).json({
                success: true,
                message: `Consulta creada exitosamente para ${tipo_paciente === 'registrado' ? 'paciente registrado' : 'paciente externo'}`,
                data: {
                    id: consultaId,
                    codigo_cancelacion,
                    tipo_paciente
                }
            });

        } catch (error) {
            console.error('Error al crear consulta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al crear consulta' 
            });
        }
    }

    // Cancelar consulta
    static async cancelarConsulta(req, res) {
        try {
            const { id } = req.params;
            const { codigo_cancelacion, motivo } = req.body;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de consulta inválido' 
                });
            }

            if (!codigo_cancelacion) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Código de cancelación es obligatorio' 
                });
            }

            const consulta = await Consulta.findById(parseInt(id));
            
            if (!consulta) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Consulta no encontrada' 
                });
            }

            if (consulta.codigo_cancelacion !== codigo_cancelacion) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Código de cancelación inválido' 
                });
            }

            if (consulta.estado !== 'activo') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Solo se pueden cancelar consultas activas' 
                });
            }

            // Obtener datos del paciente y profesional para el email
            let paciente = null;
            let profesional = null;

            if (consulta.usuario_id) {
                paciente = await Usuario.findById(consulta.usuario_id);
            }

            if (consulta.profesional_id) {
                profesional = await Profesional.findById(consulta.profesional_id);
            }

            const actualizada = await Consulta.update(parseInt(id), {
                estado: 'cancelado',
                notas_profesional: motivo || 'Consulta cancelada',
                actualizado_en: new Date()
            });

            if (actualizada) {
                // Invalidar caché del profesional
                cacheService.invalidateProfesionalCache(consulta.profesional_id);
                
                // Enviar email de notificación al paciente (si existe y tiene email)
                if (paciente && paciente.email && profesional) {
                    try {
                        const emailService = new EmailService();
                        await emailService.sendCancelacionNotificacion({
                            pacienteNombre: paciente.apellido_nombre,
                            pacienteEmail: paciente.email,
                            profesionalNombre: profesional.nombre,
                            fecha: consulta.fecha,
                            hora: consulta.hora,
                            motivo: motivo || 'Sin motivo especificado'
                        });
                        console.log(`📧 Email de cancelación enviado a ${paciente.email}`);
                    } catch (emailError) {
                        console.warn('Error enviando email de cancelación:', emailError);
                        // No fallar la operación si el email falla
                    }
                }
                
                console.log(`✅ Consulta ${id} cancelada exitosamente`);
                
                res.json({
                    success: true,
                    message: 'Consulta cancelada exitosamente y notificación enviada por email',
                    data: { id: parseInt(id), estado: 'cancelado' }
                });
            } else {
                throw new Error('Error al actualizar la consulta');
            }

        } catch (error) {
            console.error('Error al cancelar consulta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al cancelar consulta',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Reprogramar consulta
    static async reprogramarConsulta(req, res) {
        try {
            const { id } = req.params;
            const { nueva_fecha, nueva_hora, motivo } = req.body;
            
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de consulta inválido' 
                });
            }

            if (!nueva_fecha || !nueva_hora) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'La nueva fecha y hora son requeridas' 
                });
            }

            // Verificar que la consulta existe
            const consulta = await Consulta.findById(parseInt(id));
            
            if (!consulta) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Consulta no encontrada' 
                });
            }

            if (consulta.estado !== 'activo') {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Solo se pueden reprogramar consultas activas' 
                });
            }

            // Verificar que la nueva fecha no sea en el pasado
            const nuevaFechaCompleta = new Date(`${nueva_fecha}T${nueva_hora}`);
            const ahora = new Date();
            
            if (nuevaFechaCompleta <= ahora) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'La nueva fecha y hora deben ser en el futuro' 
                });
            }

            // Verificar disponibilidad en la nueva fecha/hora
            const disponible = await Consulta.checkAvailability(
                consulta.profesional_id, 
                nueva_fecha, 
                nueva_hora
            );
            
            if (!disponible) {
                return res.status(409).json({ 
                    success: false, 
                    message: 'El horario seleccionado no está disponible' 
                });
            }

            // Obtener datos del paciente y profesional para el email
            let paciente = null;
            let profesional = null;

            if (consulta.usuario_id) {
                paciente = await Usuario.findById(consulta.usuario_id);
            }

            if (consulta.profesional_id) {
                profesional = await Profesional.findById(consulta.profesional_id);
            }

            // Guardar datos originales para el email
            const fechaOriginal = consulta.fecha;
            const horaOriginal = consulta.hora;

            // Actualizar la consulta
            const actualizada = await Consulta.update(parseInt(id), {
                fecha: nueva_fecha,
                hora: nueva_hora,
                notas_profesional: motivo || consulta.notas_profesional || 'Consulta reprogramada',
                actualizado_en: new Date()
            });

            if (actualizada) {
                // Invalidar caché del profesional
                cacheService.invalidateProfesionalCache(consulta.profesional_id);

                // Enviar email de notificación al paciente (si existe y tiene email)
                if (paciente && paciente.email && profesional) {
                    try {
                        const emailService = new EmailService();
                        await emailService.sendReprogramacionNotificacion({
                            pacienteNombre: paciente.apellido_nombre,
                            pacienteEmail: paciente.email,
                            profesionalNombre: profesional.nombre,
                            fechaOriginal: fechaOriginal,
                            horaOriginal: horaOriginal,
                            nuevaFecha: nueva_fecha,
                            nuevaHora: nueva_hora,
                            motivo: motivo || 'Sin motivo especificado'
                        });
                        console.log(`📧 Email de reprogramación enviado a ${paciente.email}`);
                    } catch (emailError) {
                        console.warn('Error enviando email de reprogramación:', emailError);
                        // No fallar la operación si el email falla
                    }
                }

                console.log(`✅ Consulta ${id} reprogramada exitosamente`);
                
                res.json({
                    success: true,
                    message: 'Consulta reprogramada exitosamente y notificación enviada por email',
                    data: { 
                        id: parseInt(id), 
                        fecha: nueva_fecha, 
                        hora: nueva_hora,
                        motivo: motivo
                    }
                });
            } else {
                throw new Error('Error al actualizar la consulta');
            }

        } catch (error) {
            console.error('Error al reprogramar consulta:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Error interno del servidor al reprogramar consulta',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener consultas de un paciente específico
    static async getConsultasByPaciente(req, res) {
        try {
            const { pacienteId } = req.params;
            
            if (!pacienteId || isNaN(pacienteId)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de paciente inválido' 
                });
            }

            const consultas = await Consulta.getByPaciente(pacienteId);
            
            res.json({
                success: true,
                data: consultas
            });
        } catch (error) {
            console.error('Error al obtener consultas del paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Actualizar consulta existente
    static async updateConsulta(req, res) {
        try {
            const { id } = req.params;
            const profesional_id = req.user.id; // Obtenido del token JWT
            
            if (!id || isNaN(id)) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'ID de consulta inválido' 
                });
            }

            const { 
                fecha, 
                hora, 
                objetivo, 
                estado,
                motivo_consulta, 
                condiciones_medicas,
                notas_profesional,
                peso,
                altura
            } = req.body;

            console.log('📝 Datos recibidos para actualizar consulta:', {
                id,
                fecha,
                hora,
                objetivo,
                estado,
                motivo_consulta,
                condiciones_medicas,
                notas_profesional,
                peso,
                altura
            });

            // Validaciones básicas
            if (!fecha || !hora || !objetivo || !estado) {
                return res.status(400).json({ 
                    success: false, 
                    message: 'Fecha, hora, objetivo y estado son obligatorios' 
                });
            }

            // Verificar que la consulta existe y pertenece al profesional
            const consultaExistente = await Consulta.findById(id);
            if (!consultaExistente) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Consulta no encontrada' 
                });
            }

            if (consultaExistente.profesional_id !== profesional_id) {
                return res.status(403).json({ 
                    success: false, 
                    message: 'No tiene permisos para editar esta consulta' 
                });
            }

            // Función helper para convertir undefined a null
            const toNull = (value) => value === undefined ? null : value;

            const consultaData = {
                fecha,
                hora,
                objetivo,
                estado,
                motivo_consulta: toNull(motivo_consulta),
                condiciones_medicas: toNull(condiciones_medicas),
                notas_profesional: toNull(notas_profesional),
                peso: toNull(peso),
                altura: toNull(altura)
            };

            console.log('📝 Datos finales para actualizar consulta:', consultaData);

            const resultado = await Consulta.update(id, consultaData);

            // Invalidar caché del profesional
            cacheService.invalidateProfesionalCache(profesional_id);

            console.log(`✅ Consulta ${id} actualizada exitosamente`);

            res.json({
                success: true,
                message: 'Consulta actualizada exitosamente',
                data: {
                    id: id,
                    ...consultaData
                }
            });
        } catch (error) {
            console.error('Error al actualizar consulta:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al actualizar consulta',
                error: error.message
            });
        }
    }
}

module.exports = ConsultaController;
