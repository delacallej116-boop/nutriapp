const Usuario = require('../models/usuario');
const Consulta = require('../models/consulta');
const Antropometria = require('../models/antropometria');
const PlanAlimentacion = require('../models/planAlimentacion');
const PlanAsignacion = require('../models/planAsignacion');
const PlanComidas = require('../models/planComidas');

class PacienteController {
    // Obtener información completa del paciente
    static async getPacienteInfo(req, res) {
        try {
            const pacienteId = req.user.id;
            
            // Obtener información básica del paciente
            const paciente = await Usuario.findById(pacienteId);
            
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            // Obtener próxima consulta
            const proximaConsulta = await Consulta.getNextConsulta();
            
            // Obtener última medición antropométrica
            const antropometria = new Antropometria();
            const ultimaMedicion = await antropometria.getUltimaMedicion(pacienteId);
            
            // Obtener plan alimentario activo usando sistema de asignaciones
            const planAsignacion = new PlanAsignacion();
            const asignacionActiva = await planAsignacion.getAsignacionActivaByUsuario(pacienteId);
            
            let planActivo = null;
            if (asignacionActiva) {
                // Obtener detalles completos del plan con comidas
                const planComidas = new PlanComidas();
                const comidas = await planComidas.getComidasByPlan(asignacionActiva.plan_id);
                
                planActivo = {
                    ...asignacionActiva,
                    comidas: comidas,
                    fecha_asignacion: asignacionActiva.fecha_asignacion,
                    fecha_inicio: asignacionActiva.fecha_inicio,
                    fecha_fin: asignacionActiva.fecha_fin
                };
            }
            
            // Obtener estadísticas básicas
            const stats = await PacienteController.getPacienteStats(pacienteId);

            res.json({
                success: true,
                message: 'Información del paciente obtenida exitosamente',
                data: {
                    paciente: paciente.toPublicObject(),
                    proximaConsulta,
                    ultimaMedicion,
                    planActivo,
                    stats
                }
            });

        } catch (error) {
            console.error('Error obteniendo información del paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener consultas del paciente
    static async getConsultasPaciente(req, res) {
        try {
            const pacienteId = req.user.id;
            const { limit = 10, offset = 0 } = req.query;

            const consultas = await Consulta.getByPaciente(pacienteId, { limit, offset });

            res.json({
                success: true,
                message: 'Consultas obtenidas exitosamente',
                data: consultas
            });

        } catch (error) {
            console.error('Error obteniendo consultas del paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener mediciones antropométricas del paciente
    static async getMedicionesPaciente(req, res) {
        try {
            const pacienteId = req.user.id;
            const { limit = 20, offset = 0 } = req.query;

            const antropometria = new Antropometria();
            const mediciones = await antropometria.getByUsuario(pacienteId, { limit, offset });

            res.json({
                success: true,
                message: 'Mediciones obtenidas exitosamente',
                data: mediciones
            });

        } catch (error) {
            console.error('Error obteniendo mediciones del paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener plan alimentario del paciente
    static async getPlanAlimentarioPaciente(req, res) {
        try {
            const pacienteId = req.user.id;

            // Usar sistema de asignaciones para obtener plan activo
            const planAsignacion = new PlanAsignacion();
            const asignacionActiva = await planAsignacion.getAsignacionActivaByUsuario(pacienteId);

            if (!asignacionActiva) {
                return res.json({
                    success: true,
                    message: 'No hay plan alimentario activo',
                    data: null
                });
            }

            // Obtener detalles completos del plan con comidas
            const planComidas = new PlanComidas();
            const comidas = await planComidas.getComidasByPlan(asignacionActiva.plan_id);
            
            // Obtener resumen nutricional
            const resumenNutricional = await planComidas.getNutritionalSummary(asignacionActiva.plan_id);

            const planCompleto = {
                ...asignacionActiva,
                comidas: comidas,
                resumen_nutricional: resumenNutricional,
                fecha_asignacion: asignacionActiva.fecha_asignacion,
                fecha_inicio: asignacionActiva.fecha_inicio,
                fecha_fin: asignacionActiva.fecha_fin
            };

            res.json({
                success: true,
                message: 'Plan alimentario obtenido exitosamente',
                data: planCompleto
            });

        } catch (error) {
            console.error('Error obteniendo plan alimentario del paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener estadísticas del paciente
    static async getPacienteStats(pacienteId) {
        try {
            const stats = {};
            
            // Contar consultas
            const consultasQuery = 'SELECT COUNT(*) as total FROM consultas WHERE usuario_id = ?';
            const [consultasResult] = await Usuario.executeQuery(consultasQuery, [pacienteId]);
            stats.consultas_totales = consultasResult.total;
            
            // Contar mediciones
            const medicionesQuery = 'SELECT COUNT(*) as total FROM antropometria WHERE usuario_id = ?';
            const [medicionesResult] = await Usuario.executeQuery(medicionesQuery, [pacienteId]);
            stats.mediciones_totales = medicionesResult.total;
            
            // Contar planes alimentarios activos (sin JOIN con planes_asignacion)
            const planesQuery = `
                SELECT COUNT(*) as total 
                FROM planes_alimentacion 
                WHERE usuario_id = ? AND activo = 1
            `;
            const [planesResult] = await Usuario.executeQuery(planesQuery, [pacienteId]);
            stats.planes_activos = planesResult.total;
            
            // Obtener próxima consulta
            const proximaConsultaQuery = `
                SELECT fecha, hora 
                FROM consultas 
                WHERE usuario_id = ? AND fecha >= CURDATE() AND estado = 'activo'
                ORDER BY fecha, hora ASC 
                LIMIT 1
            `;
            const [proximaConsultaResult] = await Usuario.executeQuery(proximaConsultaQuery, [pacienteId]);
            stats.proximaConsulta = proximaConsultaResult;
            
            // Obtener última medición
            const ultimaMedicionQuery = `
                SELECT peso, altura, imc, fecha 
                FROM antropometria 
                WHERE usuario_id = ? 
                ORDER BY fecha DESC 
                LIMIT 1
            `;
            const [ultimaMedicionResult] = await Usuario.executeQuery(ultimaMedicionQuery, [pacienteId]);
            stats.ultimaMedicion = ultimaMedicionResult;
            
            return stats;
        } catch (error) {
            console.error('Error obteniendo estadísticas del paciente:', error);
            return {};
        }
    }

    // Actualizar perfil del paciente
    static async updatePerfilPaciente(req, res) {
        try {
            const pacienteId = req.user.id;
            const updateData = req.body;
            
            // Campos permitidos para actualizar por el paciente
            const allowedFields = ['email', 'telefono', 'domicilio', 'localidad'];
            const filteredData = {};
            
            Object.keys(updateData).forEach(key => {
                if (allowedFields.includes(key)) {
                    filteredData[key] = updateData[key];
                }
            });

            if (Object.keys(filteredData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'No hay campos válidos para actualizar'
                });
            }

            const updated = await Usuario.update(pacienteId, filteredData);
            
            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo actualizar el perfil'
                });
            }

            res.json({
                success: true,
                message: 'Perfil actualizado exitosamente'
            });

        } catch (error) {
            console.error('Error actualizando perfil del paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Cambiar contraseña del paciente
    static async cambiarContrasena(req, res) {
        try {
            const pacienteId = req.user.id;
            const { contrasenaActual, nuevaContrasena } = req.body;

            if (!contrasenaActual || !nuevaContrasena) {
                return res.status(400).json({
                    success: false,
                    message: 'Contraseña actual y nueva contraseña son obligatorias'
                });
            }

            // Obtener paciente con contraseña
            const paciente = await Usuario.findById(pacienteId);
            
            if (!paciente) {
                return res.status(404).json({
                    success: false,
                    message: 'Paciente no encontrado'
                });
            }

            // Verificar contraseña actual
            const bcrypt = require('bcryptjs');
            const isValidPassword = await bcrypt.compare(contrasenaActual, paciente.contrasena);
            
            if (!isValidPassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Contraseña actual incorrecta'
                });
            }

            // Hashear nueva contraseña
            const hashedNewPassword = await bcrypt.hash(nuevaContrasena, 10);

            // Actualizar contraseña
            const updated = await Usuario.update(pacienteId, { contrasena: hashedNewPassword });
            
            if (!updated) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo actualizar la contraseña'
                });
            }

            res.json({
                success: true,
                message: 'Contraseña actualizada exitosamente'
            });

        } catch (error) {
            console.error('Error cambiando contraseña del paciente:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Generar PDF del plan alimentario
    static async generatePlanPDF(req, res) {
        try {
            const pacienteId = req.user.id;

            // Usar sistema de asignaciones para obtener plan activo
            const planAsignacion = new PlanAsignacion();
            const asignacionActiva = await planAsignacion.getAsignacionActivaByUsuario(pacienteId);

            if (!asignacionActiva) {
                return res.status(404).json({
                    success: false,
                    message: 'No hay plan alimentario activo para generar PDF'
                });
            }

            // Obtener detalles completos del plan con comidas
            const planComidas = new PlanComidas();
            const comidas = await planComidas.getComidasByPlan(asignacionActiva.plan_id);
            
            // Obtener resumen nutricional
            const resumenNutricional = await planComidas.getNutritionalSummary(asignacionActiva.plan_id);

            // Obtener información del paciente
            const paciente = await Usuario.findById(pacienteId);

            const planCompleto = {
                ...asignacionActiva,
                comidas: comidas,
                resumen_nutricional: resumenNutricional,
                paciente: paciente.toPublicObject()
            };

            // Generar PDF usando el servicio PDF
            const pdfService = require('../service/pdfService');
            const pdfBuffer = await pdfService.generatePlanPDF(planCompleto);

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="plan-alimentario-${paciente.apellido_nombre || 'paciente'}-${new Date().toISOString().split('T')[0]}.pdf"`);
            res.send(pdfBuffer);

        } catch (error) {
            console.error('Error generando PDF del plan alimentario:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = PacienteController;
