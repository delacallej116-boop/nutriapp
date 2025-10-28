const Agenda = require('../models/agenda');
const Usuario = require('../models/usuario');

class AgendaController {
    constructor() {
        this.agenda = new Agenda();
        // No instanciamos Usuario aquí, usaremos métodos estáticos
    }

    // Obtener consultas por fecha
    async getConsultasByDate(req, res) {
        try {
            const { profesionalId, fecha } = req.params;
            
            if (!profesionalId || !fecha) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del profesional y fecha son requeridos'
                });
            }

            const consultas = await this.agenda.getConsultasByDate(profesionalId, fecha);
            
            res.json({
                success: true,
                data: consultas
            });
        } catch (error) {
            console.error('Error en getConsultasByDate:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener consultas por fecha',
                error: error.message
            });
        }
    }

    // Obtener consultas por rango de fechas
    async getConsultasByDateRange(req, res) {
        try {
            const { profesionalId } = req.params;
            const { fechaInicio, fechaFin } = req.query;
            
            if (!profesionalId || !fechaInicio || !fechaFin) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del profesional, fecha de inicio y fecha de fin son requeridos'
                });
            }

            const consultas = await this.agenda.getConsultasByDateRange(profesionalId, fechaInicio, fechaFin);
            
            res.json({
                success: true,
                data: consultas
            });
        } catch (error) {
            console.error('Error en getConsultasByDateRange:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener consultas por rango de fechas',
                error: error.message
            });
        }
    }

    // Obtener consultas por paciente
    async getConsultasByPaciente(req, res) {
        try {
            const { profesionalId, pacienteId } = req.params;
            
            if (!profesionalId || !pacienteId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del profesional y ID del paciente son requeridos'
                });
            }

            const consultas = await this.agenda.getConsultasByPaciente(profesionalId, pacienteId);
            
            res.json({
                success: true,
                data: consultas
            });
        } catch (error) {
            console.error('Error en getConsultasByPaciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener consultas por paciente',
                error: error.message
            });
        }
    }

    // Crear nueva consulta
    async createConsulta(req, res) {
        try {
            const { profesionalId } = req.params;
            const {
                usuario_id,
                fecha_hora,
                tipo_consulta,
                motivo_consulta,
                observaciones,
                estado
            } = req.body;

            // Validaciones
            if (!usuario_id || !fecha_hora || !tipo_consulta) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario, fecha/hora y tipo de consulta son requeridos'
                });
            }

            // Verificar disponibilidad
            const fecha = fecha_hora.split(' ')[0];
            const hora = fecha_hora.split(' ')[1];
            const disponible = await this.agenda.verificarDisponibilidad(profesionalId, fecha, hora);
            
            if (!disponible) {
                return res.status(409).json({
                    success: false,
                    message: 'El horario seleccionado no está disponible'
                });
            }

            const consultaData = {
                profesional_id: profesionalId,
                usuario_id,
                fecha_hora,
                tipo_consulta,
                motivo_consulta,
                observaciones,
                estado
            };

            const consultaId = await this.agenda.createConsulta(consultaData);
            
            res.status(201).json({
                success: true,
                message: 'Consulta creada exitosamente',
                data: { id: consultaId }
            });
        } catch (error) {
            console.error('Error en createConsulta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al crear consulta',
                error: error.message
            });
        }
    }

    // Actualizar consulta
    async updateConsulta(req, res) {
        try {
            const { consultaId } = req.params;
            const {
                fecha_hora,
                tipo_consulta,
                motivo_consulta,
                observaciones,
                estado
            } = req.body;

            if (!consultaId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de consulta es requerido'
                });
            }

            const consultaData = {
                fecha_hora,
                tipo_consulta,
                motivo_consulta,
                observaciones,
                estado
            };

            const updated = await this.agenda.updateConsulta(consultaId, consultaData);
            
            if (updated) {
                res.json({
                    success: true,
                    message: 'Consulta actualizada exitosamente'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Consulta no encontrada'
                });
            }
        } catch (error) {
            console.error('Error en updateConsulta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al actualizar consulta',
                error: error.message
            });
        }
    }

    // Eliminar consulta
    async deleteConsulta(req, res) {
        try {
            const { consultaId } = req.params;
            
            if (!consultaId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de consulta es requerido'
                });
            }

            const deleted = await this.agenda.deleteConsulta(consultaId);
            
            if (deleted) {
                res.json({
                    success: true,
                    message: 'Consulta eliminada exitosamente'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Consulta no encontrada'
                });
            }
        } catch (error) {
            console.error('Error en deleteConsulta:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar consulta',
                error: error.message
            });
        }
    }

    // Obtener estadísticas de agenda
    async getAgendaStats(req, res) {
        try {
            const { profesionalId } = req.params;
            const { fechaInicio, fechaFin } = req.query;
            
            if (!profesionalId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del profesional es requerido'
                });
            }

            // Si no se proporcionan fechas, usar el mes actual
            const now = new Date();
            const startDate = fechaInicio || new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
            const endDate = fechaFin || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];

            const stats = await this.agenda.getAgendaStats(profesionalId, startDate, endDate);
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error en getAgendaStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas de agenda',
                error: error.message
            });
        }
    }

    // Obtener horarios disponibles
    async getHorariosDisponibles(req, res) {
        try {
            const { profesionalId, fecha } = req.params;
            
            if (!profesionalId || !fecha) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del profesional y fecha son requeridos'
                });
            }

            const horarios = await this.agenda.getHorariosDisponibles(profesionalId, fecha);
            
            res.json({
                success: true,
                data: horarios
            });
        } catch (error) {
            console.error('Error en getHorariosDisponibles:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener horarios disponibles',
                error: error.message
            });
        }
    }

    // Obtener pacientes para selector
    async getPacientes(req, res) {
        try {
            const { profesionalId } = req.params;
            
            if (!profesionalId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del profesional es requerido'
                });
            }

            const pacientes = await Usuario.findByProfesionalId(profesionalId);
            
            res.json({
                success: true,
                data: pacientes
            });
        } catch (error) {
            console.error('Error en getPacientes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener pacientes',
                error: error.message
            });
        }
    }

    // Crear nueva consulta
    async crearConsulta(req, res) {
        try {
            const { profesionalId } = req.params;
            const consultaData = {
                ...req.body,
                profesional_id: profesionalId
            };

            // Verificar disponibilidad
            const disponible = await this.agenda.verificarDisponibilidad(
                profesionalId, 
                consultaData.fecha, 
                consultaData.hora
            );

            if (!disponible) {
                return res.status(400).json({
                    success: false,
                    message: 'El horario seleccionado no está disponible'
                });
            }

            const resultado = await this.agenda.createConsulta(consultaData);
            
            res.json({
                success: true,
                data: resultado,
                message: 'Consulta creada exitosamente'
            });
        } catch (error) {
            console.error('Error en crearConsulta:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = AgendaController;
