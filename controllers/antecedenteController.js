const Antecedente = require('../models/antecedente');

class AntecedenteController {
    constructor() {
        this.antecedente = new Antecedente();
    }

    // Obtener antecedentes de un usuario
    async getAntecedentesByUsuario(req, res) {
        try {
            const { usuarioId } = req.params;

            if (!usuarioId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario es requerido'
                });
            }

            const antecedentes = await this.antecedente.getByUsuario(usuarioId);

            if (antecedentes) {
                res.json({
                    success: true,
                    data: antecedentes
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'No se encontraron antecedentes para este paciente',
                    data: null
                });
            }

        } catch (error) {
            console.error('Error en getAntecedentesByUsuario:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener los antecedentes del paciente',
                error: error.message
            });
        }
    }

    // Crear o actualizar antecedentes
    async createOrUpdateAntecedentes(req, res) {
        try {
            const { usuario_id, antecedentes_personales, antecedentes_familiares, alergias, medicamentos_habituales, cirugias } = req.body;

            // Validaciones básicas
            if (!usuario_id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario es requerido'
                });
            }

            const antecedenteData = {
                usuario_id,
                antecedentes_personales: antecedentes_personales || '',
                antecedentes_familiares: antecedentes_familiares || '',
                alergias: alergias || '',
                medicamentos_habituales: medicamentos_habituales || '',
                cirugias: cirugias || ''
            };

            const result = await this.antecedente.createOrUpdate(antecedenteData);

            res.json({
                success: true,
                message: result.message,
                data: { id: result.id }
            });

        } catch (error) {
            console.error('Error en createOrUpdateAntecedentes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al guardar los antecedentes del paciente',
                error: error.message
            });
        }
    }

    // Eliminar antecedentes
    async deleteAntecedentes(req, res) {
        try {
            const { usuarioId } = req.params;

            if (!usuarioId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario es requerido'
                });
            }

            const deleted = await this.antecedente.deleteByUsuario(usuarioId);

            if (deleted) {
                res.json({
                    success: true,
                    message: 'Antecedentes eliminados correctamente'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'No se encontraron antecedentes para eliminar'
                });
            }

        } catch (error) {
            console.error('Error en deleteAntecedentes:', error);
            res.status(500).json({
                success: false,
                message: 'Error al eliminar los antecedentes del paciente',
                error: error.message
            });
        }
    }

    // Obtener estadísticas de antecedentes
    async getAntecedentesStats(req, res) {
        try {
            const stats = await this.antecedente.getStats();

            res.json({
                success: true,
                data: stats
            });

        } catch (error) {
            console.error('Error en getAntecedentesStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error al obtener estadísticas de antecedentes',
                error: error.message
            });
        }
    }
}

module.exports = AntecedenteController;
