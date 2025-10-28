const EmailService = require('../service/emailService');
const PlanAlimentacion = require('../models/planAlimentacion');
const PlanComidas = require('../models/planComidas');
const Usuario = require('../models/usuario');

class EmailController {
    constructor() {
        this.emailService = new EmailService();
    }

    // Enviar plan alimentario por email
    static async sendPlanAlimentario(req, res) {
        try {
            const { planId, pacienteId, emailDestino, subject, message } = req.body;
            const profesionalId = req.user.profesional_id || req.user.id;

            if (!planId) {
                return res.status(400).json({
                    success: false,
                    message: 'Plan ID es requerido'
                });
            }

            // Determinar el email de destino
            let emailToSend = '';
            let pacienteNombre = 'Destinatario';

            if (emailDestino) {
                // Email personalizado
                emailToSend = emailDestino;
                pacienteNombre = 'Destinatario';
            } else if (pacienteId) {
                // Email del paciente asignado
                const paciente = await Usuario.findById(pacienteId);
                if (!paciente) {
                    return res.status(404).json({
                        success: false,
                        message: 'Paciente no encontrado'
                    });
                }
                emailToSend = paciente.email;
                pacienteNombre = paciente.apellido_nombre;
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Debe proporcionar pacienteId o emailDestino'
                });
            }

            if (!emailToSend) {
                return res.status(400).json({
                    success: false,
                    message: 'No se pudo determinar el email de destino'
                });
            }

            // Obtener información del plan
            const planAlimentacion = new PlanAlimentacion();
            const plan = await planAlimentacion.getPlanById(planId);

            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan alimentario no encontrado'
                });
            }

            // Verificar que el plan pertenece al profesional
            if (plan.profesional_id !== profesionalId) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para enviar este plan'
                });
            }

            // Obtener información del profesional
            const profesional = await Usuario.findById(profesionalId);
            if (!profesional) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesional no encontrado'
                });
            }

            // Obtener comidas del plan
            const planComidas = new PlanComidas();
            const comidas = await planComidas.getComidasByPlan(planId);

            // Preparar datos del plan
            const planData = {
                ...plan,
                comidas: comidas
            };

            // Enviar email
            const emailService = new EmailService();
            const result = await emailService.sendPlanAlimentario(
                planData,
                emailToSend,
                profesional.apellido_nombre || profesional.nombre,
                {
                    subject: subject || `Plan Alimentario - ${plan.nombre}`,
                    message: message
                }
            );

            if (result.success) {
                res.json({
                    success: true,
                    message: 'Plan alimentario enviado exitosamente',
                    data: {
                        messageId: result.messageId,
                        destinatario: pacienteNombre,
                        email: emailToSend,
                        planNombre: plan.nombre
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }

        } catch (error) {
            console.error('Error enviando plan alimentario por email:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Enviar email de prueba
    static async sendTestEmail(req, res) {
        try {
            const { email } = req.body;

            if (!email) {
                return res.status(400).json({
                    success: false,
                    message: 'Email es requerido'
                });
            }

            const emailService = new EmailService();
            const result = await emailService.sendTestEmail(email);

            if (result.success) {
                res.json({
                    success: true,
                    message: 'Email de prueba enviado exitosamente',
                    data: {
                        messageId: result.messageId,
                        email: email
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: result.message,
                    error: result.error
                });
            }

        } catch (error) {
            console.error('Error enviando email de prueba:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Verificar estado del servicio de email
    static async checkEmailService(req, res) {
        try {
            console.log('🔍 Verificando configuración de email...');
            console.log('📧 Variables de entorno:', {
                SMTP_HOST: process.env.SMTP_HOST || 'No configurado',
                SMTP_PORT: process.env.SMTP_PORT || 'No configurado',
                SMTP_SECURE: process.env.SMTP_SECURE || 'No configurado',
                SMTP_USER: process.env.SMTP_USER ? 'Configurado' : 'No configurado',
                SMTP_PASS: process.env.SMTP_PASS ? 'Configurado' : 'No configurado'
            });

            const emailService = new EmailService();
            const isConnected = await emailService.verifyConnection();

            res.json({
                success: true,
                data: {
                    connected: isConnected,
                    smtpHost: process.env.SMTP_HOST || 'smtp.gmail.com',
                    smtpPort: process.env.SMTP_PORT || 587,
                    smtpUser: process.env.SMTP_USER ? 'Configurado' : 'No configurado',
                    smtpPass: process.env.SMTP_PASS ? 'Configurado' : 'No configurado',
                    smtpSecure: process.env.SMTP_SECURE || 'false'
                }
            });

        } catch (error) {
            console.error('Error verificando servicio de email:', error);
            res.status(500).json({
                success: false,
                message: 'Error verificando servicio de email',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Endpoint para probar generación de PDF
    static async testPDFGeneration(req, res) {
        try {
            const { planId } = req.params;
            
            if (!planId) {
                return res.status(400).json({
                    success: false,
                    message: 'ID del plan es requerido'
                });
            }

            // Obtener datos del plan
            const planAlimentacion = new PlanAlimentacion();
            const plan = await planAlimentacion.getPlanById(planId);
            
            if (!plan) {
                return res.status(404).json({
                    success: false,
                    message: 'Plan no encontrado'
                });
            }

            // Obtener comidas del plan
            const planComidas = new PlanComidas();
            const comidas = await planComidas.getComidasByPlan(planId);

            // Preparar datos del plan
            const planData = {
                ...plan,
                comidas: comidas
            };

            console.log('📄 Datos del plan para PDF:', {
                planId: plan.id,
                planNombre: plan.nombre,
                cantidadComidas: comidas.length,
                camposDisponibles: Object.keys(planData)
            });

            // Generar PDF
            const pdfService = require('../service/pdfService');
            const pdfBuffer = await pdfService.generatePlanPDF(planData);

            console.log('✅ PDF generado exitosamente, tamaño:', pdfBuffer.length, 'bytes');

            // Enviar PDF como respuesta
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="Plan_Alimentario_${plan.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`);
            res.send(pdfBuffer);

        } catch (error) {
            console.error('Error generando PDF de prueba:', error);
            res.status(500).json({
                success: false,
                message: 'Error generando PDF de prueba',
                error: error.message
            });
        }
    }
}

module.exports = EmailController;
