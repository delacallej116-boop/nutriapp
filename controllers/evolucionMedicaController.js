const EvolucionMedica = require('../models/evolucionMedica');

class EvolucionMedicaController {
    constructor() {
        this.evolucionMedica = EvolucionMedica;
    }

    // Crear nueva evolución médica
    async createEvolucion(req, res) {
        try {
            const userId = req.user.id;
            const profesionalId = req.user.profesional_id || req.user.id;
            
            const {
                usuario_id,
                fecha,
                motivo_consulta,
                evaluacion,
                plan_tratamiento,
                observaciones,
                condiciones_medicas,
                notas_profesional
            } = req.body;

            // Validaciones
            if (!usuario_id || !fecha || !motivo_consulta) {
                return res.status(400).json({
                    success: false,
                    message: 'Usuario, fecha y motivo son campos requeridos'
                });
            }

            const evolucionData = {
                usuario_id,
                profesional_id: profesionalId,
                fecha,
                motivo_consulta,
                evaluacion,
                plan_tratamiento,
                observaciones,
                condiciones_medicas,
                notas_profesional,
                estado: 'completado'
            };

            const evolucionId = await this.evolucionMedica.create(evolucionData);

            res.status(201).json({
                success: true,
                message: 'Evolución médica creada exitosamente',
                data: {
                    id: evolucionId
                }
            });

        } catch (error) {
            console.error('Error en createEvolucion:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener evoluciones por usuario
    async getEvolucionesByUsuario(req, res) {
        try {
            const { usuarioId } = req.params;

            if (!usuarioId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario es requerido'
                });
            }

            const evoluciones = await this.evolucionMedica.getByUsuario(usuarioId);
            
            res.json({
                success: true,
                data: evoluciones
            });

        } catch (error) {
            console.error('Error en getEvolucionesByUsuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener evolución específica
    async getEvolucion(req, res) {
        try {
            const { evolucionId } = req.params;

            if (!evolucionId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de evolución es requerido'
                });
            }

            const evolucion = await this.evolucionMedica.getById(evolucionId);

            if (!evolucion) {
                return res.status(404).json({
                    success: false,
                    message: 'Evolución no encontrada'
                });
            }

            res.json({
                success: true,
                data: evolucion
            });

        } catch (error) {
            console.error('Error en getEvolucion:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Actualizar evolución
    async updateEvolucion(req, res) {
        try {
            const { evolucionId } = req.params;
            
            const {
                motivo_consulta,
                evaluacion,
                plan_tratamiento,
                observaciones,
                condiciones_medicas,
                notas_profesional
            } = req.body;

            if (!evolucionId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de evolución es requerido'
                });
            }

            const evolucionData = {
                motivo_consulta,
                evaluacion,
                plan_tratamiento,
                observaciones,
                condiciones_medicas,
                notas_profesional
            };

            const result = await this.evolucionMedica.update(evolucionId, evolucionData);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Evolución no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Evolución médica actualizada exitosamente'
            });

        } catch (error) {
            console.error('Error en updateEvolucion:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Eliminar evolución
    async deleteEvolucion(req, res) {
        try {
            const { evolucionId } = req.params;

            if (!evolucionId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de evolución es requerido'
                });
            }

            const result = await this.evolucionMedica.delete(evolucionId);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Evolución no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Evolución médica eliminada exitosamente'
            });

        } catch (error) {
            console.error('Error en deleteEvolucion:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener estadísticas de evoluciones
    async getEvolucionesStats(req, res) {
        try {
            const { usuarioId } = req.params;

            if (!usuarioId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario es requerido'
                });
            }

            const stats = await this.evolucionMedica.getStatsByUsuario(usuarioId);

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error en getEvolucionesStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = new EvolucionMedicaController();
