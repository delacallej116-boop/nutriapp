const HistoriaClinica = require('../models/historiaClinica');
const HistoriaClinicaResumen = require('../models/historiaClinicaResumen');
const Usuario = require('../models/usuario');

class HistoriaClinicaController {
    // Obtener historia clínica completa de un paciente
    static async getHistoriaClinica(req, res) {
        try {
            const { pacienteId } = req.params;
            
            // Verificar que el paciente existe
            const paciente = await Usuario.findById(pacienteId);
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }
            
            // Obtener datos básicos del paciente
            const datosPaciente = paciente.toPublicObject();
            
            // Obtener resumen optimizado
            let resumen = await HistoriaClinicaResumen.getResumenByPaciente(pacienteId);
            
            // Si no existe resumen, crearlo
            if (!resumen) {
                await HistoriaClinicaResumen.createOrUpdateResumen(pacienteId, paciente.profesional_id);
                resumen = await HistoriaClinicaResumen.getResumenByPaciente(pacienteId);
            }
            
            // Obtener consultas
            const consultasQuery = `
                SELECT c.*, p.nombre as profesional_nombre
                FROM consultas c
                LEFT JOIN profesionales p ON c.profesional_id = p.id
                WHERE c.usuario_id = ?
                ORDER BY c.fecha DESC
            `;
            const consultas = await HistoriaClinica.executeQuery(consultasQuery, [pacienteId]);
            
            // Obtener mediciones antropométricas
            const medicionesQuery = `
                SELECT * FROM antropometria
                WHERE usuario_id = ?
                ORDER BY fecha DESC
            `;
            const mediciones = await HistoriaClinica.executeQuery(medicionesQuery, [pacienteId]);
            
            // Obtener planes de alimentación
            const planesQuery = `
                SELECT * FROM planes_alimentacion
                WHERE usuario_id = ?
                ORDER BY fecha_inicio DESC
            `;
            const planes = await HistoriaClinica.executeQuery(planesQuery, [pacienteId]);
            
            // Obtener laboratorios con sus resultados
            const laboratoriosQuery = `
                SELECT 
                    l.*,
                    p.nombre as profesional_nombre
                FROM laboratorios l
                LEFT JOIN profesionales p ON l.profesional_id = p.id
                WHERE l.usuario_id = ?
                ORDER BY l.fecha_estudio DESC
            `;
            const laboratorios = await HistoriaClinica.executeQuery(laboratoriosQuery, [pacienteId]);
            
            // Obtener resultados para cada laboratorio
            for (let lab of laboratorios) {
                const resultadosQuery = `
                    SELECT * FROM resultados_laboratorio
                    WHERE laboratorio_id = ?
                    ORDER BY parametro ASC
                `;
                lab.resultados = await HistoriaClinica.executeQuery(resultadosQuery, [lab.id]);
            }
            
            res.json({
                success: true,
                data: {
                    paciente: datosPaciente,
                    resumen: resumen,
                    consultas,
                    mediciones,
                    planes,
                    laboratorios
                }
            });
        } catch (error) {
            console.error('Error obteniendo historia clínica:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Crear nueva consulta
    static async createConsulta(req, res) {
        try {
            const { pacienteId } = req.params;
            const consultaData = {
                ...req.body,
                usuario_id: pacienteId,
                fecha_consulta: new Date()
            };
            
            const consultaId = await HistoriaClinica.createConsulta(consultaData);
            
            // Actualizar resumen de historia clínica
            await HistoriaClinicaResumen.updateResumenAfterChange(pacienteId, consultaData.profesional_id);
            
            res.status(201).json({
                success: true,
                message: 'Consulta creada exitosamente',
                data: { id: consultaId }
            });
        } catch (error) {
            console.error('Error creando consulta:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Crear nueva medición antropométrica
    static async createMedicion(req, res) {
        try {
            const { pacienteId } = req.params;
            const medicionData = {
                ...req.body,
                usuario_id: pacienteId,
                fecha_medicion: new Date()
            };
            
            const medicionId = await HistoriaClinica.createMedicion(medicionData);
            
            // Actualizar resumen de historia clínica
            const paciente = await Usuario.findById(pacienteId);
            await HistoriaClinicaResumen.updateResumenAfterChange(pacienteId, paciente.profesional_id);
            
            res.status(201).json({
                success: true,
                message: 'Medición creada exitosamente',
                data: { id: medicionId }
            });
        } catch (error) {
            console.error('Error creando medición:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Crear nuevo plan de alimentación
    static async createPlanAlimentacion(req, res) {
        try {
            const { pacienteId } = req.params;
            const planData = {
                ...req.body,
                usuario_id: pacienteId,
                fecha_creacion: new Date()
            };
            
            const planId = await HistoriaClinica.createPlanAlimentacion(planData);
            
            // Actualizar resumen de historia clínica
            await HistoriaClinicaResumen.updateResumenAfterChange(pacienteId, planData.profesional_id);
            
            res.status(201).json({
                success: true,
                message: 'Plan de alimentación creado exitosamente',
                data: { id: planId }
            });
        } catch (error) {
            console.error('Error creando plan:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Subir documento
    static async uploadDocumento(req, res) {
        try {
            const { pacienteId } = req.params;
            const documentoData = {
                ...req.body,
                usuario_id: pacienteId,
                fecha_subida: new Date()
            };
            
            const documentoId = await HistoriaClinica.createDocumento(documentoData);
            
            // Actualizar resumen de historia clínica
            const paciente = await Usuario.findById(pacienteId);
            await HistoriaClinicaResumen.updateResumenAfterChange(pacienteId, paciente.profesional_id);
            
            res.status(201).json({
                success: true,
                message: 'Documento subido exitosamente',
                data: { id: documentoId }
            });
        } catch (error) {
            console.error('Error subiendo documento:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }
}

module.exports = HistoriaClinicaController;
