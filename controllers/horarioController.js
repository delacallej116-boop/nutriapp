const HorarioDisponible = require('../models/horarioDisponible');
const DiaNoLaboral = require('../models/diaNoLaboral');
const { authenticateToken } = require('../middleware/auth');

class HorarioController {
    // Obtener horarios de un profesional
    static async getHorariosByProfesional(req, res) {
        try {
            const { profesionalId } = req.params;
            
            // Verificar que el profesional existe y el usuario tiene acceso
            if (req.user.rol === 'profesional' && req.user.id !== parseInt(profesionalId)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para acceder a estos horarios'
                });
            }

            const horarios = await HorarioDisponible.findByProfesionalId(profesionalId);
            
            res.json({
                success: true,
                message: 'Horarios obtenidos exitosamente',
                data: horarios.map(h => h.toPublicObject())
            });

        } catch (error) {
            console.error('Error obteniendo horarios:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener estadísticas de horarios
    static async getStats(req, res) {
        try {
            const { profesionalId } = req.params;
            
            // Verificar permisos
            if (req.user.rol === 'profesional' && req.user.id !== parseInt(profesionalId)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para acceder a estas estadísticas'
                });
            }

            const stats = await HorarioDisponible.getStats(profesionalId);
            
            res.json({
                success: true,
                message: 'Estadísticas obtenidas exitosamente',
                data: stats
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Crear nuevo horario
    static async createHorario(req, res) {
        try {
            const { dia_semana, hora_inicio, hora_fin, duracion_minutos, activo } = req.body;
            const profesionalId = req.user.id;

            // Validaciones
            if (!dia_semana || !hora_inicio || !hora_fin) {
                return res.status(400).json({
                    success: false,
                    message: 'Día de la semana, hora de inicio y hora de fin son obligatorios'
                });
            }

            // Validar que la hora de fin sea posterior a la hora de inicio
            if (hora_fin <= hora_inicio) {
                return res.status(400).json({
                    success: false,
                    message: 'La hora de fin debe ser posterior a la hora de inicio'
                });
            }

            // Verificar conflictos de horarios
            const hasConflict = await HorarioDisponible.checkConflict(
                profesionalId, 
                dia_semana, 
                hora_inicio, 
                hora_fin
            );

            if (hasConflict) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un horario que se superpone con el horario especificado'
                });
            }

            const horarioData = {
                profesional_id: profesionalId,
                dia_semana,
                hora_inicio,
                hora_fin,
                duracion_minutos: duracion_minutos || 30,
                activo: activo !== undefined ? activo : true
            };

            const horarioId = await HorarioDisponible.create(horarioData);
            
            res.status(201).json({
                success: true,
                message: 'Horario creado exitosamente',
                data: { id: horarioId }
            });

        } catch (error) {
            console.error('Error creando horario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Actualizar horario
    static async updateHorario(req, res) {
        try {
            const { id } = req.params;
            const { dia_semana, hora_inicio, hora_fin, duracion_minutos, activo } = req.body;
            const profesionalId = req.user.id;

            // Verificar que el horario existe y pertenece al profesional
            const horario = await HorarioDisponible.findById(id);
            if (!horario) {
                return res.status(404).json({
                    success: false,
                    message: 'Horario no encontrado'
                });
            }

            if (horario.profesional_id !== profesionalId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para modificar este horario'
                });
            }

            // Validaciones
            if (hora_fin && hora_inicio && hora_fin <= hora_inicio) {
                return res.status(400).json({
                    success: false,
                    message: 'La hora de fin debe ser posterior a la hora de inicio'
                });
            }

            // Verificar conflictos si se están cambiando horarios
            if (dia_semana || hora_inicio || hora_fin) {
                const checkDia = dia_semana || horario.dia_semana;
                const checkInicio = hora_inicio || horario.hora_inicio;
                const checkFin = hora_fin || horario.hora_fin;

                const hasConflict = await HorarioDisponible.checkConflict(
                    profesionalId, 
                    checkDia, 
                    checkInicio, 
                    checkFin,
                    id
                );

                if (hasConflict) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe un horario que se superpone con el horario especificado'
                    });
                }
            }

            const updateData = {};
            if (dia_semana !== undefined) updateData.dia_semana = dia_semana;
            if (hora_inicio !== undefined) updateData.hora_inicio = hora_inicio;
            if (hora_fin !== undefined) updateData.hora_fin = hora_fin;
            if (duracion_minutos !== undefined) updateData.duracion_minutos = duracion_minutos;
            if (activo !== undefined) updateData.activo = activo;

            const success = await HorarioDisponible.update(id, updateData);
            
            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo actualizar el horario'
                });
            }

            res.json({
                success: true,
                message: 'Horario actualizado exitosamente'
            });

        } catch (error) {
            console.error('Error actualizando horario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Eliminar horario
    static async deleteHorario(req, res) {
        try {
            const { id } = req.params;
            const profesionalId = req.user.id;

            // Verificar que el horario existe y pertenece al profesional
            const horario = await HorarioDisponible.findById(id);
            if (!horario) {
                return res.status(404).json({
                    success: false,
                    message: 'Horario no encontrado'
                });
            }

            if (horario.profesional_id !== profesionalId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para eliminar este horario'
                });
            }

            const success = await HorarioDisponible.delete(id);
            
            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo eliminar el horario'
                });
            }

            res.json({
                success: true,
                message: 'Horario eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error eliminando horario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener días no laborales de un profesional
    static async getDiasNoLaborales(req, res) {
        try {
            const { profesionalId } = req.params;
            
            // Verificar permisos
            if (req.user.rol === 'profesional' && req.user.id !== parseInt(profesionalId)) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para acceder a estos días no laborales'
                });
            }

            const diasNoLaborales = await DiaNoLaboral.findByProfesionalId(profesionalId);
            
            res.json({
                success: true,
                message: 'Días no laborales obtenidos exitosamente',
                data: diasNoLaborales.map(d => d.toPublicObject())
            });

        } catch (error) {
            console.error('Error obteniendo días no laborales:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Crear nuevo día no laboral
    static async createDiaNoLaboral(req, res) {
        try {
            const { fecha, motivo, activo } = req.body;
            const profesionalId = req.user.id;

            // Validaciones
            if (!fecha) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha es obligatoria'
                });
            }

            // Verificar que la fecha no sea en el pasado
            const fechaDia = new Date(fecha);
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);
            
            if (fechaDia < hoy) {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede agregar un día no laboral en el pasado'
                });
            }

            // Verificar que no exista ya un día no laboral para esa fecha
            const diaExistente = await DiaNoLaboral.findByFecha(profesionalId, fecha);
            if (diaExistente) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe un día no laboral para la fecha especificada'
                });
            }

            const diaData = {
                profesional_id: profesionalId,
                fecha,
                motivo: motivo || null,
                activo: activo !== undefined ? activo : true
            };

            const diaId = await DiaNoLaboral.create(diaData);
            
            res.status(201).json({
                success: true,
                message: 'Día no laboral creado exitosamente',
                data: { id: diaId }
            });

        } catch (error) {
            console.error('Error creando día no laboral:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Actualizar día no laboral
    static async updateDiaNoLaboral(req, res) {
        try {
            const { id } = req.params;
            const { fecha, motivo, activo } = req.body;
            const profesionalId = req.user.id;

            // Verificar que el día no laboral existe y pertenece al profesional
            const dia = await DiaNoLaboral.findById(id);
            if (!dia) {
                return res.status(404).json({
                    success: false,
                    message: 'Día no laboral no encontrado'
                });
            }

            if (dia.profesional_id !== profesionalId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para modificar este día no laboral'
                });
            }

            // Validaciones
            if (fecha) {
                const fechaDia = new Date(fecha);
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                
                if (fechaDia < hoy) {
                    return res.status(400).json({
                        success: false,
                        message: 'No se puede establecer un día no laboral en el pasado'
                    });
                }

                // Verificar que no exista ya un día no laboral para esa fecha (excluyendo el actual)
                const diaExistente = await DiaNoLaboral.findByFecha(profesionalId, fecha);
                if (diaExistente && diaExistente.id !== parseInt(id)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya existe un día no laboral para la fecha especificada'
                    });
                }
            }

            const updateData = {};
            if (fecha !== undefined) updateData.fecha = fecha;
            if (motivo !== undefined) updateData.motivo = motivo;
            if (activo !== undefined) updateData.activo = activo;

            const success = await DiaNoLaboral.update(id, updateData);
            
            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo actualizar el día no laboral'
                });
            }

            res.json({
                success: true,
                message: 'Día no laboral actualizado exitosamente'
            });

        } catch (error) {
            console.error('Error actualizando día no laboral:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Eliminar día no laboral
    static async deleteDiaNoLaboral(req, res) {
        try {
            const { id } = req.params;
            const profesionalId = req.user.id;

            // Verificar que el día no laboral existe y pertenece al profesional
            const dia = await DiaNoLaboral.findById(id);
            if (!dia) {
                return res.status(404).json({
                    success: false,
                    message: 'Día no laboral no encontrado'
                });
            }

            if (dia.profesional_id !== profesionalId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para eliminar este día no laboral'
                });
            }

            const success = await DiaNoLaboral.delete(id);
            
            if (!success) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo eliminar el día no laboral'
                });
            }

            res.json({
                success: true,
                message: 'Día no laboral eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error eliminando día no laboral:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = HorarioController;