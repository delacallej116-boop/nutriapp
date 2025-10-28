const Antropometria = require('../models/antropometria');
const cacheService = require('../service/cacheService');
const Usuario = require('../models/usuario');

class AntropometriaController {
    constructor() {
        this.antropometriaModel = new Antropometria();
    }

    async createAntropometria(req, res) {
        try {
            const {
                usuario_id,
                fecha,
                peso,
                altura,
                imc,
                pliegue_tricipital,
                pliegue_subescapular,
                circunferencia_cintura,
                circunferencia_cadera,
                porcentaje_grasa,
                masa_muscular,
                observaciones
            } = req.body;

            // Validaciones básicas
            if (!usuario_id || !fecha) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario y fecha son requeridos.'
                });
            }

            if (!peso || peso <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El peso debe ser un valor válido mayor a 0.'
                });
            }

            if (!altura || altura <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La altura debe ser un valor válido mayor a 0.'
                });
            }

            // Calcular IMC si no se proporciona
            let calculatedIMC = null;
            if (!imc && peso && altura) {
                calculatedIMC = peso / Math.pow(altura / 100, 2);
            } else if (imc) {
                calculatedIMC = parseFloat(imc);
            }

            const antropometriaData = {
                usuario_id,
                fecha,
                peso: parseFloat(peso),
                altura: parseFloat(altura),
                imc: calculatedIMC ? parseFloat(calculatedIMC.toFixed(2)) : null,
                pliegue_tricipital: pliegue_tricipital ? parseFloat(pliegue_tricipital) : null,
                pliegue_subescapular: pliegue_subescapular ? parseFloat(pliegue_subescapular) : null,
                circunferencia_cintura: circunferencia_cintura ? parseFloat(circunferencia_cintura) : null,
                circunferencia_cadera: circunferencia_cadera ? parseFloat(circunferencia_cadera) : null,
                porcentaje_grasa: porcentaje_grasa ? parseFloat(porcentaje_grasa) : null,
                masa_muscular: masa_muscular ? parseFloat(masa_muscular) : null,
                observaciones: observaciones || null
            };

            const antropometriaId = await this.antropometriaModel.create(antropometriaData);

            // Invalidar caché del profesional para actualizar peso actual
            await this.invalidateProfesionalCache(usuario_id);

            res.status(201).json({
                success: true,
                message: 'Medición antropométrica guardada correctamente.',
                data: { id: antropometriaId }
            });

        } catch (error) {
            console.error('Error en createAntropometria:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al guardar la medición.'
            });
        }
    }

    async getAntropometriaByUsuario(req, res) {
        try {
            const { usuarioId } = req.params;
            
            console.log('🔍 Debug Controller - usuarioId recibido:', {
                usuarioId: usuarioId,
                type: typeof usuarioId,
                isNaN: isNaN(usuarioId)
            });
            
            const mediciones = await this.antropometriaModel.getByUsuario(usuarioId);

            res.json({
                success: true,
                data: mediciones
            });

        } catch (error) {
            console.error('Error en getAntropometriaByUsuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener las mediciones.'
            });
        }
    }

    async getAntropometriaById(req, res) {
        try {
            const { id } = req.params;
            const medicion = await this.antropometriaModel.getById(id);

            if (!medicion) {
                return res.status(404).json({
                    success: false,
                    message: 'Medición antropométrica no encontrada.'
                });
            }

            res.json({
                success: true,
                data: medicion
            });

        } catch (error) {
            console.error('Error en getAntropometriaById:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener la medición.'
            });
        }
    }

    async updateAntropometria(req, res) {
        try {
            const { id } = req.params;
            const {
                fecha,
                peso,
                altura,
                imc,
                pliegue_tricipital,
                pliegue_subescapular,
                circunferencia_cintura,
                circunferencia_cadera,
                porcentaje_grasa,
                masa_muscular,
                observaciones
            } = req.body;

            // Validaciones básicas
            if (!fecha) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha es requerida.'
                });
            }

            if (peso && peso <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El peso debe ser un valor válido mayor a 0.'
                });
            }

            if (altura && altura <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La altura debe ser un valor válido mayor a 0.'
                });
            }

            // Calcular IMC si se proporcionan peso y altura
            let calculatedIMC = null;
            if (!imc && peso && altura) {
                calculatedIMC = peso / Math.pow(altura / 100, 2);
            } else if (imc) {
                calculatedIMC = parseFloat(imc);
            }

            const antropometriaData = {
                fecha,
                peso: peso ? parseFloat(peso) : null,
                altura: altura ? parseFloat(altura) : null,
                imc: calculatedIMC ? parseFloat(calculatedIMC.toFixed(2)) : null,
                pliegue_tricipital: pliegue_tricipital ? parseFloat(pliegue_tricipital) : null,
                pliegue_subescapular: pliegue_subescapular ? parseFloat(pliegue_subescapular) : null,
                circunferencia_cintura: circunferencia_cintura ? parseFloat(circunferencia_cintura) : null,
                circunferencia_cadera: circunferencia_cadera ? parseFloat(circunferencia_cadera) : null,
                porcentaje_grasa: porcentaje_grasa ? parseFloat(porcentaje_grasa) : null,
                masa_muscular: masa_muscular ? parseFloat(masa_muscular) : null,
                observaciones: observaciones || null
            };

            const updated = await this.antropometriaModel.update(id, antropometriaData);

            if (updated) {
                // Obtener el usuario_id de la medición para invalidar caché
                const medicion = await this.antropometriaModel.getById(id);
                if (medicion && medicion.usuario_id) {
                    await this.invalidateProfesionalCache(medicion.usuario_id);
                }

                res.json({
                    success: true,
                    message: 'Medición antropométrica actualizada correctamente.'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Medición antropométrica no encontrada.'
                });
            }

        } catch (error) {
            console.error('Error en updateAntropometria:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al actualizar la medición.'
            });
        }
    }

    async deleteAntropometria(req, res) {
        try {
            const { id } = req.params;
            
            // Obtener el usuario_id antes de eliminar para invalidar caché
            const medicion = await this.antropometriaModel.getById(id);
            
            const deleted = await this.antropometriaModel.delete(id);

            if (deleted) {
                // Invalidar caché del profesional para actualizar peso actual
                if (medicion && medicion.usuario_id) {
                    await this.invalidateProfesionalCache(medicion.usuario_id);
                }

                res.json({
                    success: true,
                    message: 'Medición antropométrica eliminada correctamente.'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Medición antropométrica no encontrada.'
                });
            }

        } catch (error) {
            console.error('Error en deleteAntropometria:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al eliminar la medición.'
            });
        }
    }

    async getAntropometriaStats(req, res) {
        try {
            const { usuarioId } = req.params;
            const stats = await this.antropometriaModel.getStats(usuarioId);

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error en getAntropometriaStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener estadísticas.'
            });
        }
    }

    async getAntropometriaEvolution(req, res) {
        try {
            const { usuarioId } = req.params;
            const { limit = 10 } = req.query;
            const evolution = await this.antropometriaModel.getEvolution(usuarioId, parseInt(limit));

            res.json({
                success: true,
                data: evolution
            });

        } catch (error) {
            console.error('Error en getAntropometriaEvolution:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor al obtener la evolución.'
            });
        }
    }

    // Método helper para invalidar caché del profesional
    async invalidateProfesionalCache(usuarioId) {
        try {
            // Obtener el profesional_id del usuario
            const usuario = await Usuario.findById(usuarioId);
            if (usuario && usuario.profesional_id) {
                // Invalidar caché de pacientes del profesional
                cacheService.invalidateProfesionalCache(usuario.profesional_id);
                console.log(`🔄 Caché invalidado para profesional ${usuario.profesional_id} después de actualizar antropometría del usuario ${usuarioId}`);
            }
        } catch (error) {
            console.error('Error invalidando caché del profesional:', error);
        }
    }
}

module.exports = AntropometriaController;
