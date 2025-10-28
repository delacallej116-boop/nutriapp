const Laboratorio = require('../models/laboratorio');
const ResultadoLaboratorio = require('../models/resultadoLaboratorio');

class LaboratorioController {
    constructor() {
        this.laboratorio = new Laboratorio();
        this.resultadoLaboratorio = new ResultadoLaboratorio();
    }

    // Crear un nuevo estudio de laboratorio con sus resultados
    async createLaboratorio(req, res) {
        try {
            const {
                usuario_id,
                profesional_id,
                fecha_estudio,
                laboratorio,
                medico_solicitante,
                notas,
                resultados
            } = req.body;

            // Validar datos requeridos
            if (!usuario_id || !profesional_id || !fecha_estudio) {
                return res.status(400).json({
                    success: false,
                    message: 'Por favor complete todos los campos requeridos: paciente, profesional y fecha del estudio'
                });
            }

            // Crear el laboratorio
            const laboratorioId = await this.laboratorio.createLaboratorio({
                usuario_id,
                profesional_id,
                fecha_estudio,
                laboratorio,
                medico_solicitante,
                notas
            });

            // Crear resultados si se proporcionan
            if (resultados && resultados.length > 0) {
                const resultadosArray = resultados.map(resultado => ({
                    ...resultado,
                    laboratorio_id: laboratorioId
                }));

                await this.resultadoLaboratorio.createMultipleResultados(resultadosArray);
            }

            res.status(201).json({
                success: true,
                message: 'Laboratorio creado exitosamente',
                data: { laboratorio_id: laboratorioId }
            });

        } catch (error) {
            console.error('Error en createLaboratorio:', error);
            res.status(500).json({
                success: false,
                message: 'Ha ocurrido un error. Por favor, intente nuevamente.',
                error: error.message
            });
        }
    }

    // Obtener laboratorios por usuario
    async getLaboratoriosByUsuario(req, res) {
        try {
            const { usuarioId } = req.params;

            if (!usuarioId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario requerido'
                });
            }

            const laboratorios = await this.laboratorio.getLaboratoriosByUsuario(usuarioId);

            res.json({
                success: true,
                data: laboratorios
            });

        } catch (error) {
            console.error('Error en getLaboratoriosByUsuario:', error);
            res.status(500).json({
                success: false,
                message: 'Ha ocurrido un error. Por favor, intente nuevamente.',
                error: error.message
            });
        }
    }

    // Obtener laboratorios por profesional
    async getLaboratoriosByProfesional(req, res) {
        try {
            const { profesionalId } = req.params;

            if (!profesionalId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de profesional requerido'
                });
            }

            const laboratorios = await this.laboratorio.getLaboratoriosByProfesional(profesionalId);

            res.json({
                success: true,
                data: laboratorios
            });

        } catch (error) {
            console.error('Error en getLaboratoriosByProfesional:', error);
            res.status(500).json({
                success: false,
                message: 'Ha ocurrido un error. Por favor, intente nuevamente.',
                error: error.message
            });
        }
    }

    // Obtener un laboratorio específico con sus resultados
    async getLaboratorioById(req, res) {
        try {
            const { laboratorioId } = req.params;

            if (!laboratorioId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de laboratorio requerido'
                });
            }

            const laboratorio = await this.laboratorio.getLaboratorioById(laboratorioId);

            if (!laboratorio) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró el estudio de laboratorio solicitado'
                });
            }

            res.json({
                success: true,
                data: laboratorio
            });

        } catch (error) {
            console.error('Error en getLaboratorioById:', error);
            res.status(500).json({
                success: false,
                message: 'Ha ocurrido un error. Por favor, intente nuevamente.',
                error: error.message
            });
        }
    }

    // Actualizar un laboratorio
    async updateLaboratorio(req, res) {
        try {
            const { laboratorioId } = req.params;
            const {
                fecha_estudio,
                laboratorio,
                medico_solicitante,
                notas,
                resultados
            } = req.body;

            if (!laboratorioId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de laboratorio requerido'
                });
            }

            // Actualizar el laboratorio
            const updated = await this.laboratorio.updateLaboratorio(laboratorioId, {
                fecha_estudio,
                laboratorio,
                medico_solicitante,
                notas
            });

            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró el estudio de laboratorio solicitado'
                });
            }

            // Actualizar resultados si se proporcionan
            if (resultados && resultados.length > 0) {
                // Eliminar resultados existentes
                await this.resultadoLaboratorio.deleteResultadosByLaboratorio(laboratorioId);

                // Crear nuevos resultados
                const resultadosArray = resultados.map(resultado => ({
                    ...resultado,
                    laboratorio_id: laboratorioId
                }));

                await this.resultadoLaboratorio.createMultipleResultados(resultadosArray);
            }

            res.json({
                success: true,
                message: 'Laboratorio actualizado exitosamente'
            });

        } catch (error) {
            console.error('Error en updateLaboratorio:', error);
            res.status(500).json({
                success: false,
                message: 'Ha ocurrido un error. Por favor, intente nuevamente.',
                error: error.message
            });
        }
    }

    // Eliminar un laboratorio
    async deleteLaboratorio(req, res) {
        try {
            const { laboratorioId } = req.params;

            if (!laboratorioId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de laboratorio requerido'
                });
            }

            const deleted = await this.laboratorio.deleteLaboratorio(laboratorioId);

            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: 'No se encontró el estudio de laboratorio solicitado'
                });
            }

            res.json({
                success: true,
                message: 'Laboratorio eliminado exitosamente'
            });

        } catch (error) {
            console.error('Error en deleteLaboratorio:', error);
            res.status(500).json({
                success: false,
                message: 'Ha ocurrido un error. Por favor, intente nuevamente.',
                error: error.message
            });
        }
    }

    // Obtener estadísticas de laboratorios
    async getLaboratorioStats(req, res) {
        try {
            const { profesionalId } = req.params;

            if (!profesionalId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de profesional requerido'
                });
            }

            const stats = await this.laboratorio.getLaboratorioStats(profesionalId);
            const resultadoStats = await this.resultadoLaboratorio.getResultadoStats(profesionalId);

            res.json({
                success: true,
                data: {
                    laboratorios: stats,
                    resultados: resultadoStats
                }
            });

        } catch (error) {
            console.error('Error en getLaboratorioStats:', error);
            res.status(500).json({
                success: false,
                message: 'Ha ocurrido un error. Por favor, intente nuevamente.',
                error: error.message
            });
        }
    }

    // Obtener evolución de un parámetro específico
    async getEvolucionParametro(req, res) {
        try {
            const { usuarioId, parametro } = req.params;

            if (!usuarioId || !parametro) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario y parámetro requeridos'
                });
            }

            const evolucion = await this.resultadoLaboratorio.getEvolucionParametro(usuarioId, parametro);

            res.json({
                success: true,
                data: evolucion
            });

        } catch (error) {
            console.error('Error en getEvolucionParametro:', error);
            res.status(500).json({
                success: false,
                message: 'Ha ocurrido un error. Por favor, intente nuevamente.',
                error: error.message
            });
        }
    }

    // Obtener parámetros con valores fuera de rango
    async getParametrosFueraRango(req, res) {
        try {
            const { usuarioId } = req.params;

            if (!usuarioId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de usuario requerido'
                });
            }

            const parametros = await this.resultadoLaboratorio.getParametrosFueraRango(usuarioId);

            res.json({
                success: true,
                data: parametros
            });

        } catch (error) {
            console.error('Error en getParametrosFueraRango:', error);
            res.status(500).json({
                success: false,
                message: 'Ha ocurrido un error. Por favor, intente nuevamente.',
                error: error.message
            });
        }
    }

    // Obtener laboratorios por rango de fechas
    async getLaboratoriosByDateRange(req, res) {
        try {
            const { profesionalId } = req.params;
            const { fechaInicio, fechaFin } = req.query;

            if (!profesionalId || !fechaInicio || !fechaFin) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de profesional, fecha de inicio y fecha de fin requeridos'
                });
            }

            const laboratorios = await this.laboratorio.getLaboratoriosByDateRange(
                profesionalId, 
                fechaInicio, 
                fechaFin
            );

            res.json({
                success: true,
                data: laboratorios
            });

        } catch (error) {
            console.error('Error en getLaboratoriosByDateRange:', error);
            res.status(500).json({
                success: false,
                message: 'Ha ocurrido un error. Por favor, intente nuevamente.',
                error: error.message
            });
        }
    }

    // Actualizar estado de un resultado específico
    async updateResultadoStatus(req, res) {
        try {
            const { resultadoId } = req.params;
            const { estado } = req.body;

            if (!resultadoId || !estado) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de resultado y estado son requeridos'
                });
            }

            // Validar que el estado sea válido
            const estadosValidos = ['normal', 'alto', 'bajo', 'critico'];
            if (!estadosValidos.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado inválido. Debe ser: normal, alto, bajo, critico'
                });
            }

            const updated = await this.resultadoLaboratorio.updateResultadoStatus(resultadoId, estado);

            if (updated) {
                res.json({
                    success: true,
                    message: 'Estado del resultado actualizado correctamente'
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'No se encontró el resultado solicitado'
                });
            }

        } catch (error) {
            console.error('Error en updateResultadoStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Ha ocurrido un error. Por favor, intente nuevamente.',
                error: error.message
            });
        }
    }
}

module.exports = LaboratorioController;
