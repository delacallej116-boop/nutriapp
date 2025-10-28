const PlanComidas = require('../models/planComidas');

class PlanComidasController {
    constructor() {
        this.planComidas = new PlanComidas();
    }

    // Crear nueva comida
    async createComida(req, res) {
        try {
            const comidaData = req.body;

            // Validaciones básicas
            if (!comidaData.plan_id || !comidaData.dia_semana || !comidaData.tipo_comida || !comidaData.nombre_comida) {
                return res.status(400).json({
                    success: false,
                    message: 'Plan ID, día de semana, tipo de comida y nombre son requeridos'
                });
            }

            const result = await this.planComidas.createComida(comidaData);
            
            res.status(201).json({
                success: true,
                message: 'Comida creada exitosamente',
                data: { id: result.id }
            });
        } catch (error) {
            console.error('Error en createComida:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener comidas por plan
    async getComidas(req, res) {
        try {
            const { planId } = req.params;

            if (!planId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del plan es requerido'
                });
            }

            const comidas = await this.planComidas.getComidasByPlan(planId);
            
            res.json({
                success: true,
                data: comidas
            });
        } catch (error) {
            console.error('Error en getComidas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Actualizar comida
    async updateComida(req, res) {
        try {
            const { comidaId } = req.params;

            if (!comidaId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de la comida es requerido'
                });
            }

            const result = await this.planComidas.updateComida(comidaId, req.body);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Comida no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Comida actualizada exitosamente'
            });
        } catch (error) {
            console.error('Error en updateComida:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Eliminar comida
    async deleteComida(req, res) {
        try {
            const { comidaId } = req.params;

            if (!comidaId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de la comida es requerido'
                });
            }

            const result = await this.planComidas.deleteComida(comidaId);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Comida no encontrada'
                });
            }

            res.json({
                success: true,
                message: 'Comida eliminada exitosamente'
            });
        } catch (error) {
            console.error('Error en deleteComida:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener resumen nutricional
    async getNutritionalSummary(req, res) {
        try {
            const { planId } = req.params;

            if (!planId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del plan es requerido'
                });
            }

            const summary = await this.planComidas.getNutritionalSummary(planId);
            
            res.json({
                success: true,
                data: summary
            });
        } catch (error) {
            console.error('Error en getNutritionalSummary:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Crear múltiples comidas (para un plan completo)
    async createMultipleComidas(comidasArray) {
        try {
            if (!comidasArray || !Array.isArray(comidasArray)) {
                throw new Error('Array de comidas es requerido');
            }

            const results = [];
            
            for (const comida of comidasArray) {
                const result = await this.planComidas.createComida(comida);
                results.push(result);
            }

            return results;
        } catch (error) {
            console.error('Error en createMultipleComidas:', error);
            throw error;
        }
    }

    // Crear múltiples comidas (endpoint HTTP)
    async createMultipleComidasHTTP(req, res) {
        try {
            const { planId, comidas } = req.body;

            if (!planId || !comidas || !Array.isArray(comidas)) {
                return res.status(400).json({
                    success: false,
                    message: 'Plan ID y array de comidas son requeridos'
                });
            }

            const results = await this.createMultipleComidas(comidas);

            res.status(201).json({
                success: true,
                message: `${results.length} comidas creadas exitosamente`,
                data: results
            });
        } catch (error) {
            console.error('Error en createMultipleComidasHTTP:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = new PlanComidasController();
