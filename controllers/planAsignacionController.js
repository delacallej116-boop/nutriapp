const PlanAsignacion = require('../models/planAsignacion');

class PlanAsignacionController {
    constructor() {
        this.planAsignacion = new PlanAsignacion();
    }

    // Asignar plan a paciente
    async assignPlan(req, res) {
        try {
            const { plan_id, usuario_id, fecha_inicio, fecha_fin, observaciones } = req.body;

            if (!plan_id || !usuario_id || !fecha_inicio) {
                return res.status(400).json({
                    success: false,
                    message: 'Plan ID, Usuario ID y fecha de inicio son requeridos'
                });
            }

            // Verificar si el usuario ya tiene un plan activo
            const existingAsignacion = await this.planAsignacion.getAsignacionActivaByUsuario(usuario_id);
            
            if (existingAsignacion) {
                console.log(`🔄 Desactivando asignación existente ID: ${existingAsignacion.id} para usuario: ${usuario_id}`);
                // Desactivar asignación existente
                await this.planAsignacion.desactivarAsignacion(existingAsignacion.id);
            }

            // Crear nueva asignación
            const result = await this.planAsignacion.createAsignacion({
                plan_id,
                usuario_id,
                fecha_inicio,
                fecha_fin,
                activo: true,
                observaciones
            });

            res.status(201).json({
                success: true,
                message: 'Plan asignado exitosamente',
                data: {
                    id: result.insertId
                }
            });

        } catch (error) {
            console.error('Error en assignPlan:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener asignaciones por usuario
    async getAsignacionesByUsuario(req, res) {
        try {
            const { usuarioId } = req.params;

            if (!usuarioId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario es requerido'
                });
            }

            const asignaciones = await this.planAsignacion.getAsignacionesByUsuario(usuarioId);

            res.json({
                success: true,
                data: asignaciones
            });

        } catch (error) {
            console.error('Error en getAsignacionesByUsuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener asignación activa por usuario
    async getAsignacionActivaByUsuario(req, res) {
        try {
            const { usuarioId } = req.params;

            if (!usuarioId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario es requerido'
                });
            }

            const asignacion = await this.planAsignacion.getAsignacionActivaByUsuario(usuarioId);

            res.json({
                success: true,
                data: asignacion
            });

        } catch (error) {
            console.error('Error en getAsignacionActivaByUsuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener asignaciones por plan
    async getAsignacionesByPlan(req, res) {
        try {
            const { planId } = req.params;

            if (!planId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de plan es requerido'
                });
            }

            const asignaciones = await this.planAsignacion.getAsignacionesByPlan(planId);

            res.json({
                success: true,
                data: asignaciones
            });

        } catch (error) {
            console.error('Error en getAsignacionesByPlan:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Desasignar plan (desactivar asignación)
    async unassignPlan(req, res) {
        try {
            const { asignacionId } = req.params;

            if (!asignacionId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de asignación es requerido'
                });
            }

            const result = await this.planAsignacion.desactivarAsignacion(asignacionId);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Asignación no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Plan desasignado exitosamente'
            });

        } catch (error) {
            console.error('Error en unassignPlan:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Actualizar asignación
    async updateAsignacion(req, res) {
        try {
            const { asignacionId } = req.params;
            const { fecha_inicio, fecha_fin, activo, observaciones } = req.body;

            if (!asignacionId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de asignación es requerido'
                });
            }

            const result = await this.planAsignacion.updateAsignacion(asignacionId, {
                fecha_inicio,
                fecha_fin,
                activo,
                observaciones
            });

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Asignación no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Asignación actualizada exitosamente'
            });

        } catch (error) {
            console.error('Error en updateAsignacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Eliminar asignación
    async deleteAsignacion(req, res) {
        try {
            const { asignacionId } = req.params;

            if (!asignacionId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de asignación es requerido'
                });
            }

            const result = await this.planAsignacion.deleteAsignacion(asignacionId);

            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Asignación no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Asignación eliminada exitosamente'
            });

        } catch (error) {
            console.error('Error en deleteAsignacion:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener estadísticas
    async getStats(req, res) {
        try {
            const stats = await this.planAsignacion.getAsignacionesStats();

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error en getStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = PlanAsignacionController;
