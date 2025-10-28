const PlanAlimentacion = require('../models/planAlimentacion');
const PlanComidas = require('../models/planComidas');
const Usuario = require('../models/usuario');
const planComidasController = require('./planComidasController');

class PlanAlimentacionController {
    constructor() {
        this.planAlimentacion = new PlanAlimentacion();
        this.planComidas = new PlanComidas();
    }

    // Crear nuevo plan alimentario
    async createPlan(req, res) {
        try {
            const { profesionalId } = req.params;
            const { comidas, ...planData } = req.body;
            
            const planDataWithProfesional = {
                ...planData,
                profesional_id: profesionalId
            };

            // Validaciones básicas
            if (!planDataWithProfesional.nombre || !planDataWithProfesional.tipo || !planDataWithProfesional.fecha_inicio) {
                return res.status(400).json({
                    success: false,
                    message: 'Nombre, tipo y fecha de inicio son requeridos'
                });
            }

            // Crear el plan
            const result = await this.planAlimentacion.createPlan(planDataWithProfesional);
            const planId = result.id;
            
            // Si hay comidas, guardarlas
            if (comidas && Object.keys(comidas).length > 0) {
                const comidasArray = [];
                
                // Convertir comidas de objeto a array
                Object.keys(comidas).forEach(dia => {
                    Object.keys(comidas[dia]).forEach(tipo => {
                        const comida = comidas[dia][tipo];
                        comidasArray.push({
                            ...comida,
                            plan_id: planId
                        });
                    });
                });
                
                // Guardar todas las comidas
                if (comidasArray.length > 0) {
                    await planComidasController.createMultipleComidas(comidasArray);
                }
            }
            
            res.status(201).json({
                success: true,
                message: 'Plan alimentario creado exitosamente',
                data: { id: planId }
            });
        } catch (error) {
            console.error('Error en createPlan:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener plan por ID
    async getPlan(req, res) {
        try {
            const { planId } = req.params;

            if (!planId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del plan es requerido'
                });
            }

            const plan = await this.planAlimentacion.getPlanById(planId);
            
            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan no encontrado'
                });
            }

            res.json({
                success: true,
                data: plan
            });
        } catch (error) {
            console.error('Error en getPlan:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener todos los planes de un profesional
    async getPlanes(req, res) {
        try {
            const { profesionalId } = req.params;

            if (!profesionalId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del profesional es requerido'
                });
            }

            const planes = await this.planAlimentacion.getPlanesByProfesional(profesionalId);
            
            res.json({
                success: true,
                data: planes
            });
        } catch (error) {
            console.error('Error en getPlanes:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Actualizar plan
    async updatePlan(req, res) {
        try {
            const { planId } = req.params;
            const { comidas, ...planData } = req.body;

            if (!planId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del plan es requerido'
                });
            }

            // Actualizar el plan
            const result = await this.planAlimentacion.updatePlan(planId, planData);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan no encontrado'
                });
            }

            // Procesar comidas si se proporcionan
            if (comidas) {
                // Eliminar comidas existentes del plan
                await this.planComidas.deleteComidasByPlan(planId);
                
                // Preparar comidas para guardar
                const comidasArray = [];
                Object.keys(comidas).forEach(dia => {
                    Object.keys(comidas[dia]).forEach(tipo => {
                        const comida = comidas[dia][tipo];
                        if (comida && comida.nombre_comida) {
                            comidasArray.push({
                                plan_id: planId,
                                dia_semana: comida.dia_semana,
                                tipo_comida: comida.tipo_comida,
                                nombre_comida: comida.nombre_comida,
                                descripcion: comida.descripcion || null,
                                hora: comida.hora || null,
                                calorias: comida.calorias || null,
                                proteinas: comida.proteinas || null,
                                carbohidratos: comida.carbohidratos || null,
                                grasas: comida.grasas || null,
                                fibra: comida.fibra || null,
                                azucares: comida.azucares || null,
                                sodio: comida.sodio || null,
                                ingredientes: comida.ingredientes || null,
                                preparacion: comida.preparacion || null,
                                tiempo_preparacion: comida.tiempo_preparacion || null,
                                dificultad: comida.dificultad || 'facil',
                                porciones: comida.porciones || 1,
                                notas: comida.notas || null
                            });
                        }
                    });
                });
                
                // Guardar todas las comidas
                if (comidasArray.length > 0) {
                    await planComidasController.createMultipleComidas(comidasArray);
                }
            }

            res.json({
                success: true,
                message: 'Plan actualizado exitosamente'
            });
        } catch (error) {
            console.error('Error en updatePlan:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Eliminar plan
    async deletePlan(req, res) {
        try {
            const { planId } = req.params;

            if (!planId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del plan es requerido'
                });
            }

            // Eliminar comidas del plan primero
            await this.planComidas.deleteComidasByPlan(planId);
            
            // Eliminar el plan
            const result = await this.planAlimentacion.deletePlan(planId);
            
            if (result.affectedRows === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan no encontrado'
                });
            }

            res.json({
                success: true,
                message: 'Plan eliminado exitosamente'
            });
        } catch (error) {
            console.error('Error en deletePlan:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener estadísticas de planes
    async getPlanStats(req, res) {
        try {
            const { profesionalId } = req.params;

            if (!profesionalId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del profesional es requerido'
                });
            }

            const stats = await this.planAlimentacion.getPlanStats(profesionalId);
            
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error en getPlanStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener pacientes para crear plan
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
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener pacientes asignados a un plan específico
    async getPacientesAsignados(req, res) {
        try {
            const { planId } = req.params;

            if (!planId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del plan es requerido'
                });
            }

            const pacientes = await this.planAlimentacion.getPacientesAsignados(planId);
            
            res.json({
                success: true,
                data: pacientes
            });
        } catch (error) {
            console.error('Error en getPacientesAsignados:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }
}

module.exports = PlanAlimentacionController;
