const nodemailer = require('nodemailer');
const PDFService = require('./pdfService');
require('dotenv').config();

class EmailService {
    constructor() {
        this.transporter = null;
        this.initializeTransporter();
    }

    // Inicializar el transporter de Nodemailer
    initializeTransporter() {
        try {
            console.log('🔧 Inicializando servicio de email...');
            console.log('📧 Configuración SMTP:', {
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true' || false,
                user: process.env.SMTP_USER ? 'Configurado' : 'No configurado',
                pass: process.env.SMTP_PASS ? 'Configurado' : 'No configurado'
            });
            
            // Log detallado para debug (sin mostrar la contraseña completa)
            console.log('🔍 Debug credenciales:', {
                userLength: process.env.SMTP_USER ? process.env.SMTP_USER.length : 0,
                passLength: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0,
                userStart: process.env.SMTP_USER ? process.env.SMTP_USER.substring(0, 3) + '...' : 'undefined',
                passStart: process.env.SMTP_PASS ? process.env.SMTP_PASS.substring(0, 3) + '...' : 'undefined'
            });

            this.transporter = nodemailer.createTransport({
                host: process.env.SMTP_HOST || 'smtp.gmail.com',
                port: process.env.SMTP_PORT || 587,
                secure: process.env.SMTP_SECURE === 'true' || false,
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS
                },
                tls: {
                    rejectUnauthorized: false
                }
            });

            console.log('✅ Email service initialized');
        } catch (error) {
            console.error('❌ Error initializing email service:', error);
        }
    }

    // Verificar conexión del servicio de email
    async verifyConnection() {
        try {
            if (!this.transporter) {
                throw new Error('Email transporter not initialized');
            }
            await this.transporter.verify();
            return true;
        } catch (error) {
            console.error('❌ Email service connection failed:', error);
            return false;
        }
    }

    // Enviar plan alimentario por email
    async sendPlanAlimentario(planData, pacienteEmail, profesionalNombre, options = {}) {
        try {
            console.log('📧 Iniciando envío de plan alimentario...');
            console.log('📋 Datos del plan:', {
                planNombre: planData.nombre,
                pacienteEmail: pacienteEmail,
                profesionalNombre: profesionalNombre,
                tieneComidas: !!planData.comidas,
                cantidadComidas: planData.comidas?.length || 0,
                options: options
            });

            if (!this.transporter) {
                throw new Error('Email service not initialized');
            }

            console.log('🔧 Generando mensaje del email...');
            const htmlContent = this.generateEmailMessage(planData, profesionalNombre, options.message);
            console.log('✅ Mensaje del email generado correctamente');

            console.log('📄 Generando PDF del plan...');
            const pdfService = require('./pdfService');
            const pdfBuffer = await pdfService.generatePlanPDF(planData);
            console.log('✅ PDF generado correctamente');

            const mailOptions = {
                from: {
                    name: 'Sistema de Nutrición',
                    address: process.env.SMTP_USER
                },
                to: pacienteEmail,
                subject: options.subject || `Plan Alimentario - ${planData.nombre}`,
                html: htmlContent,
                attachments: [
                    {
                        filename: `Plan_Alimentario_${planData.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
                        content: pdfBuffer,
                        contentType: 'application/pdf'
                    }
                ]
            };

            console.log('📤 Enviando email...');
            console.log('📧 Opciones de email:', {
                from: mailOptions.from,
                to: mailOptions.to,
                subject: mailOptions.subject,
                hasHtml: !!mailOptions.html,
                hasPdf: !!mailOptions.attachments.length,
                pdfFilename: mailOptions.attachments[0]?.filename
            });

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Plan alimentario enviado por email:', result.messageId);
            
            return {
                success: true,
                messageId: result.messageId,
                message: 'Plan alimentario enviado exitosamente'
            };

        } catch (error) {
            console.error('❌ Error enviando plan alimentario por email:', error);
            console.error('❌ Detalles del error:', {
                message: error.message,
                code: error.code,
                command: error.command,
                response: error.response
            });
            return {
                success: false,
                error: error.message,
                message: 'Error enviando el plan alimentario'
            };
        }
    }

    // Generar mensaje cordial del email con enfoque en el PDF adjunto
    generateEmailMessage(planData, profesionalNombre, mensajePersonalizado = '') {
        const fechaActual = new Date().toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Plan Alimentario</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8f9fa;
                }
                .container {
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 40px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #007bff;
                }
                .header h1 {
                    color: #007bff;
                    margin: 0;
                    font-size: 28px;
                }
                .content {
                    margin-bottom: 30px;
                }
                .greeting {
                    font-size: 18px;
                    margin-bottom: 25px;
                    color: #333;
                }
                .pdf-notice {
                    background-color: #e3f2fd;
                    border: 1px solid #2196f3;
                    border-radius: 8px;
                    padding: 25px;
                    margin: 25px 0;
                    text-align: center;
                }
                .pdf-notice h3 {
                    color: #1976d2;
                    margin-top: 0;
                    margin-bottom: 15px;
                    font-size: 20px;
                }
                .pdf-notice p {
                    margin: 10px 0;
                    font-size: 16px;
                }
                .pdf-icon {
                    font-size: 48px;
                    color: #d32f2f;
                    margin-bottom: 15px;
                }
                .instructions {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .instructions h4 {
                    color: #856404;
                    margin-top: 0;
                    margin-bottom: 15px;
                }
                .instructions ul {
                    margin: 0;
                    padding-left: 20px;
                }
                .instructions li {
                    margin-bottom: 8px;
                    color: #856404;
                }
                .personal-message {
                    background-color: #f0f8ff;
                    border-left: 4px solid #007bff;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 5px;
                }
                .personal-message p {
                    margin: 0;
                    white-space: pre-line;
                    color: #333;
                    font-size: 16px;
                }
                .closing {
                    margin-top: 25px;
                    font-size: 16px;
                    color: #333;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #dee2e6;
                    color: #666;
                    font-size: 14px;
                }
                .contact-info {
                    margin-top: 15px;
                    padding-top: 15px;
                    border-top: 1px solid #e9ecef;
                }
                .contact-info p {
                    margin: 5px 0;
                    font-size: 14px;
                }
                @media (max-width: 600px) {
                    .container {
                        padding: 25px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🍎 Plan Alimentario</h1>
                    <p>Sistema de Gestión Nutricional</p>
                </div>

                <div class="content">
                    <div class="greeting">
                        <p>¡Hola!</p>
                        <p>Espero que te encuentres muy bien. Te escribo para compartir contigo tu <strong>Plan Alimentario Personalizado</strong>.</p>
                    </div>

                    <div class="pdf-notice">
                        <div class="pdf-icon">📄</div>
                        <h3>¡Tu Plan Completo está Listo!</h3>
                        <p><strong>Se adjunta a este correo tu Plan Alimentario completo en formato PDF</strong></p>
                        <p>Este documento contiene toda la información detallada de tu plan nutricional.</p>
                    </div>

                    <div class="instructions">
                        <h4>📥 Cómo Descargar tu Plan</h4>
                        <ul>
                            <li>Busca el archivo adjunto en este correo</li>
                            <li>El archivo se llama: <strong>Plan_Alimentario_${planData.nombre.replace(/[^a-zA-Z0-9]/g, '_')}.pdf</strong></li>
                            <li>Haz clic en el archivo para descargarlo</li>
                            <li>Guárdalo en tu dispositivo para consultarlo cuando necesites</li>
                            <li>Puedes imprimirlo si lo prefieres</li>
                        </ul>
                    </div>

                    ${mensajePersonalizado ? `
                    <div class="personal-message">
                        <p>${mensajePersonalizado}</p>
                    </div>
                    ` : ''}

                    <div class="closing">
                        <p>Si tienes alguna pregunta sobre tu plan alimentario o necesitas hacer algún ajuste, no dudes en contactarme.</p>
                        <p>¡Espero que disfrutes de tu nuevo plan y que te ayude a alcanzar tus objetivos de salud!</p>
                        <p>¡Que tengas un excelente día!</p>
                    </div>
                </div>

                <div class="footer">
                    <p><strong>Profesional:</strong> ${profesionalNombre}</p>
                    <div class="contact-info">
                        <p>📧 Este correo fue enviado automáticamente por el Sistema de Gestión Nutricional</p>
                        <p>📅 Fecha de envío: ${fechaActual}</p>
                    </div>
                </div>
            </div>
        </body>
        </html>
        `;

        return html;
    }

    // Generar HTML para el plan alimentario (método anterior - mantenido por compatibilidad)
    generatePlanHTML(planData, profesionalNombre, mensajePersonalizado = '') {
        const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const tiposComida = ['desayuno', 'media_manana', 'almuerzo', 'media_tarde', 'cena', 'colacion'];
        const nombresComida = {
            'desayuno': 'Desayuno',
            'media_manana': 'Media Mañana',
            'almuerzo': 'Almuerzo',
            'media_tarde': 'Media Tarde',
            'cena': 'Cena',
            'colacion': 'Colación'
        };

        // Agrupar comidas por día
        const comidasPorDia = {};
        diasSemana.forEach(dia => {
            comidasPorDia[dia] = {};
            tiposComida.forEach(tipo => {
                comidasPorDia[dia][tipo] = planData.comidas?.filter(comida => 
                    comida.dia_semana === dia && comida.tipo_comida === tipo
                ) || [];
            });
        });

        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Plan Alimentario - ${planData.nombre}</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 800px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8f9fa;
                }
                .header {
                    background: linear-gradient(135deg, #007bff, #0056b3);
                    color: white;
                    padding: 30px;
                    border-radius: 10px;
                    text-align: center;
                    margin-bottom: 30px;
                }
                .header h1 {
                    margin: 0;
                    font-size: 28px;
                }
                .header p {
                    margin: 10px 0 0 0;
                    opacity: 0.9;
                }
                .plan-info {
                    background: white;
                    padding: 25px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }
                .plan-info h2 {
                    color: #007bff;
                    border-bottom: 2px solid #007bff;
                    padding-bottom: 10px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                    margin-top: 20px;
                }
                .info-item {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #007bff;
                }
                .info-item strong {
                    color: #007bff;
                }
                .weekly-plan {
                    background: white;
                    padding: 25px;
                    border-radius: 10px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                    margin-bottom: 30px;
                }
                .day-section {
                    margin-bottom: 30px;
                    border: 1px solid #e9ecef;
                    border-radius: 8px;
                    overflow: hidden;
                }
                .day-header {
                    background: #007bff;
                    color: white;
                    padding: 15px;
                    font-weight: bold;
                    font-size: 18px;
                }
                .meal-section {
                    padding: 20px;
                    border-bottom: 1px solid #e9ecef;
                }
                .meal-section:last-child {
                    border-bottom: none;
                }
                .meal-title {
                    color: #007bff;
                    font-weight: bold;
                    margin-bottom: 10px;
                    font-size: 16px;
                }
                .meal-item {
                    background: #f8f9fa;
                    padding: 15px;
                    border-radius: 8px;
                    margin-bottom: 10px;
                }
                .meal-item:last-child {
                    margin-bottom: 0;
                }
                .meal-name {
                    font-weight: bold;
                    color: #333;
                    margin-bottom: 5px;
                }
                .meal-description {
                    color: #666;
                    margin-bottom: 10px;
                }
                .meal-details {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 10px;
                    font-size: 14px;
                }
                .meal-detail {
                    background: white;
                    padding: 8px;
                    border-radius: 5px;
                    text-align: center;
                }
                .meal-detail strong {
                    color: #007bff;
                }
                .footer {
                    text-align: center;
                    padding: 20px;
                    background: #f8f9fa;
                    border-radius: 10px;
                    color: #666;
                }
                .footer strong {
                    color: #007bff;
                }
                @media (max-width: 600px) {
                    body {
                        padding: 10px;
                    }
                    .header h1 {
                        font-size: 24px;
                    }
                    .info-grid {
                        grid-template-columns: 1fr;
                    }
                    .meal-details {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>🍽️ Plan Alimentario</h1>
                <p>${planData.nombre}</p>
            </div>

            <div class="plan-info">
                <h2>📋 Información del Plan</h2>
                <div class="info-grid">
                    <div class="info-item">
                        <strong>Objetivo:</strong><br>
                        ${planData.objetivo || 'No especificado'}
                    </div>
                    <div class="info-item">
                        <strong>Calorías Diarias:</strong><br>
                        ${planData.calorias_diarias || 'No especificado'} kcal
                    </div>
                    <div class="info-item">
                        <strong>Tipo:</strong><br>
                        ${planData.tipo || 'No especificado'}
                    </div>
                    <div class="info-item">
                        <strong>Duración:</strong><br>
                        ${planData.fecha_inicio ? new Date(planData.fecha_inicio).toLocaleDateString('es-ES') : 'No especificado'} - 
                        ${planData.fecha_fin ? new Date(planData.fecha_fin).toLocaleDateString('es-ES') : 'Indefinido'}
                    </div>
                </div>
                ${planData.descripcion ? `
                <div style="margin-top: 20px; padding: 15px; background: #e3f2fd; border-radius: 8px;">
                    <strong>Descripción:</strong><br>
                    ${planData.descripcion}
                </div>
                ` : ''}
            </div>

            <div class="weekly-plan">
                <h2>📅 Plan Semanal de Comidas</h2>
        `;

        // Generar contenido para cada día
        diasSemana.forEach(dia => {
            html += `
                <div class="day-section">
                    <div class="day-header">${dia}</div>
            `;

            tiposComida.forEach(tipo => {
                const comidas = comidasPorDia[dia][tipo];
                if (comidas.length > 0) {
                    html += `
                        <div class="meal-section">
                            <div class="meal-title">${nombresComida[tipo]}</div>
                    `;

                    comidas.forEach(comida => {
                        html += `
                            <div class="meal-item">
                                <div class="meal-name">${comida.nombre_comida}</div>
                                ${comida.descripcion ? `<div class="meal-description">${comida.descripcion}</div>` : ''}
                                <div class="meal-details">
                                    ${comida.calorias ? `<div class="meal-detail"><strong>Calorías:</strong><br>${comida.calorias}</div>` : ''}
                                    ${comida.proteinas ? `<div class="meal-detail"><strong>Proteínas:</strong><br>${comida.proteinas}g</div>` : ''}
                                    ${comida.carbohidratos ? `<div class="meal-detail"><strong>Carbohidratos:</strong><br>${comida.carbohidratos}g</div>` : ''}
                                    ${comida.grasas ? `<div class="meal-detail"><strong>Grasas:</strong><br>${comida.grasas}g</div>` : ''}
                                </div>
                                ${comida.ingredientes ? `
                                    <div style="margin-top: 10px; font-size: 14px;">
                                        <strong>Ingredientes:</strong> ${comida.ingredientes}
                                    </div>
                                ` : ''}
                                ${comida.preparacion ? `
                                    <div style="margin-top: 10px; font-size: 14px;">
                                        <strong>Preparación:</strong> ${comida.preparacion}
                                    </div>
                                ` : ''}
                            </div>
                        `;
                    });

                    html += `
                        </div>
                    `;
                }
            });

            html += `
                </div>
            `;
        });

        html += `
            </div>

            ${mensajePersonalizado ? `
            <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 20px; margin: 20px 0;">
                <h3 style="color: #856404; margin-top: 0;">💬 Mensaje Personalizado</h3>
                <p style="color: #856404; margin-bottom: 0; white-space: pre-line;">${mensajePersonalizado}</p>
            </div>
            ` : ''}

            <div class="footer">
                <p><strong>Profesional:</strong> ${profesionalNombre}</p>
                <p>Este plan alimentario ha sido diseñado específicamente para ti. Consulta con tu nutricionista ante cualquier duda.</p>
                <p style="margin-top: 15px; font-size: 12px; color: #999;">
                    Generado automáticamente por el Sistema de Nutrición
                </p>
            </div>
        </body>
        </html>
        `;

        return html;
    }

    // Enviar email de prueba
    async sendTestEmail(toEmail) {
        try {
            if (!this.transporter) {
                throw new Error('Email service not initialized');
            }

            const mailOptions = {
                from: {
                    name: 'Sistema de Nutrición',
                    address: process.env.SMTP_USER
                },
                to: toEmail,
                subject: 'Prueba de Email - Sistema de Nutrición',
                html: `
                    <h1>✅ Email de Prueba</h1>
                    <p>El servicio de email está funcionando correctamente.</p>
                    <p><strong>Fecha:</strong> ${new Date().toLocaleString('es-ES')}</p>
                `
            };

            const result = await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                messageId: result.messageId,
                message: 'Email de prueba enviado exitosamente'
            };

        } catch (error) {
            console.error('❌ Error enviando email de prueba:', error);
            return {
                success: false,
                error: error.message,
                message: 'Error enviando email de prueba'
            };
        }
    }

    // Enviar confirmación de reserva por email
    async sendReservaConfirmacion(reservaData, profesionalNombre) {
        try {
            console.log('📧 Enviando confirmación de reserva...');

            if (!this.transporter) {
                throw new Error('Email service not initialized');
            }

            const htmlContent = this.generateReservaConfirmacionHTML(reservaData, profesionalNombre);

            const mailOptions = {
                from: {
                    name: 'Sistema de Nutrición',
                    address: process.env.SMTP_USER
                },
                to: reservaData.email,
                subject: `Confirmación de Reserva - ${reservaData.fecha}`,
                html: htmlContent
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Confirmación enviada:', result.messageId);
            
            return {
                success: true,
                messageId: result.messageId,
                message: 'Confirmación de reserva enviada exitosamente'
            };

        } catch (error) {
            console.error('❌ Error enviando confirmación:', error.message);
            return {
                success: false,
                error: error.message,
                message: 'Error enviando la confirmación de reserva'
            };
        }
    }

    // Generar HTML para confirmación de reserva
    generateReservaConfirmacionHTML(reservaData, profesionalNombre) {
        const fechaFormateada = new Date(reservaData.fecha + 'T00:00:00').toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const horaFormateada = reservaData.hora.substring(0, 5); // Formato HH:MM

        // Mapear tipo de consulta a texto legible
        const tiposConsulta = {
            'primera_vez': 'Primera consulta',
            'control': 'Control de seguimiento',
            'plan_alimentario': 'Nuevo plan alimentario',
            'consulta_urgente': 'Consulta de urgencia'
        };

        const tipoConsultaTexto = tiposConsulta[reservaData.tipo_consulta] || reservaData.tipo_consulta;

        let html = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Confirmación de Reserva</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f8f9fa;
                }
                .container {
                    background-color: #ffffff;
                    border-radius: 10px;
                    padding: 40px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                .header {
                    text-align: center;
                    margin-bottom: 30px;
                    padding-bottom: 20px;
                    border-bottom: 2px solid #28a745;
                }
                .header h1 {
                    color: #28a745;
                    margin: 0;
                    font-size: 28px;
                }
                .header p {
                    color: #666;
                    margin: 10px 0 0 0;
                    font-size: 16px;
                }
                .content {
                    margin-bottom: 30px;
                }
                .greeting {
                    font-size: 18px;
                    margin-bottom: 25px;
                    color: #333;
                }
                .reserva-info {
                    background-color: #d4edda;
                    border: 1px solid #c3e6cb;
                    border-radius: 8px;
                    padding: 25px;
                    margin: 25px 0;
                }
                .reserva-info h3 {
                    color: #155724;
                    margin-top: 0;
                    margin-bottom: 20px;
                    font-size: 20px;
                }
                .info-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 15px;
                    margin-bottom: 20px;
                }
                .info-item {
                    padding: 10px 0;
                }
                .info-item strong {
                    color: #155724;
                    display: block;
                    margin-bottom: 5px;
                }
                .info-item span {
                    color: #333;
                    font-size: 16px;
                }
                .codigo-cancelacion {
                    background-color: #fff3cd;
                    border: 1px solid #ffeaa7;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                    text-align: center;
                }
                .codigo-cancelacion h4 {
                    color: #856404;
                    margin-top: 0;
                    margin-bottom: 15px;
                }
                .codigo-value {
                    font-family: 'Courier New', monospace;
                    font-size: 18px;
                    font-weight: bold;
                    color: #856404;
                    background-color: #f8f9fa;
                    padding: 10px;
                    border-radius: 5px;
                    border: 2px dashed #856404;
                    letter-spacing: 2px;
                }
                .instructions {
                    background-color: #e3f2fd;
                    border: 1px solid #2196f3;
                    border-radius: 8px;
                    padding: 20px;
                    margin: 20px 0;
                }
                .instructions h4 {
                    color: #1976d2;
                    margin-top: 0;
                    margin-bottom: 15px;
                }
                .instructions ul {
                    margin: 0;
                    padding-left: 20px;
                }
                .instructions li {
                    margin-bottom: 8px;
                    color: #1976d2;
                }
                .contact-info {
                    background-color: #f8f9fa;
                    border-left: 4px solid #28a745;
                    padding: 20px;
                    margin: 20px 0;
                    border-radius: 5px;
                }
                .contact-info h4 {
                    color: #28a745;
                    margin-top: 0;
                    margin-bottom: 15px;
                }
                .footer {
                    text-align: center;
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #dee2e6;
                    color: #666;
                    font-size: 14px;
                }
                @media (max-width: 600px) {
                    .info-grid {
                        grid-template-columns: 1fr;
                    }
                    .container {
                        padding: 25px;
                    }
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>✅ Reserva Confirmada</h1>
                    <p>Sistema de Gestión Nutricional</p>
                </div>

                <div class="content">
                    <div class="greeting">
                        <p>¡Hola ${reservaData.nombre}!</p>
                        <p>Tu reserva ha sido confirmada exitosamente. Te esperamos en la consulta.</p>
                    </div>

                    <div class="reserva-info">
                        <h3>📅 Detalles de tu Consulta</h3>
                        <div class="info-grid">
                            <div class="info-item">
                                <strong>Fecha:</strong>
                                <span>${fechaFormateada}</span>
                            </div>
                            <div class="info-item">
                                <strong>Hora:</strong>
                                <span>${horaFormateada}</span>
                            </div>
                            <div class="info-item">
                                <strong>Tipo de Consulta:</strong>
                                <span>${tipoConsultaTexto}</span>
                            </div>
                            <div class="info-item">
                                <strong>Profesional:</strong>
                                <span>${profesionalNombre}</span>
                            </div>
                        </div>
                        ${reservaData.motivo_consulta ? `
                        <div class="info-item">
                            <strong>Motivo de Consulta:</strong>
                            <span>${reservaData.motivo_consulta}</span>
                        </div>
                        ` : ''}
                        ${reservaData.observaciones ? `
                        <div class="info-item">
                            <strong>Observaciones:</strong>
                            <span>${reservaData.observaciones}</span>
                        </div>
                        ` : ''}
                    </div>

                <div class="codigo-cancelacion">
                    <h4>🔑 Código de Cancelación</h4>
                    <p>Si necesitas cancelar tu consulta, utiliza este código:</p>
                    <div class="codigo-value">${reservaData.codigo_cancelacion}</div>
                    <p style="margin-top: 15px; font-size: 14px; color: #856404;">
                        <i class="fas fa-info-circle"></i>
                        Código simple de 6 dígitos - fácil de recordar
                    </p>
                </div>

                    <div class="instructions">
                        <h4>📋 Instrucciones Importantes</h4>
                        <ul>
                            <li>Llega 10 minutos antes de tu horario</li>
                            <li>Trae tu documento de identidad</li>
                            <li>Si tienes estudios médicos recientes, tráelos</li>
                            <li>En caso de cancelación, usa el código proporcionado</li>
                            <li>Para reprogramar, contacta directamente al profesional</li>
                        </ul>
                    </div>

                    <div class="contact-info">
                        <h4>📞 Información de Contacto</h4>
                        <p><strong>Profesional:</strong> ${profesionalNombre}</p>
                        <p><strong>Email:</strong> Este correo fue enviado automáticamente por el Sistema de Gestión Nutricional</p>
                        <p><strong>Fecha de envío:</strong> ${new Date().toLocaleDateString('es-ES')}</p>
                    </div>

                    <div class="content">
                        <p>¡Esperamos verte pronto y ayudarte a alcanzar tus objetivos de salud!</p>
                        <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
                        <p>¡Que tengas un excelente día!</p>
                    </div>
                </div>

                <div class="footer">
                    <p>Este correo fue enviado automáticamente por el Sistema de Gestión Nutricional</p>
                    <p>Por favor, no respondas a este correo</p>
                </div>
            </div>
        </body>
        </html>
        `;

        return html;
    }
    // Enviar notificación de reprogramación de consulta
    async sendReprogramacionNotificacion(data) {
        try {
            const {
                pacienteNombre,
                pacienteEmail,
                profesionalNombre,
                fechaOriginal,
                horaOriginal,
                nuevaFecha,
                nuevaHora,
                motivo
            } = data;

            if (!this.transporter) {
                throw new Error('Email service no está inicializado');
            }

            // Formatear fechas para el email
            const fechaOriginalFormateada = this.formatDateForEmail(fechaOriginal);
            const nuevaFechaFormateada = this.formatDateForEmail(nuevaFecha);
            const horaOriginalFormateada = this.formatTimeForEmail(horaOriginal);
            const nuevaHoraFormateada = this.formatTimeForEmail(nuevaHora);

            const htmlContent = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Consulta Reprogramada</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f8f9fa;
                        }
                        .container {
                            background-color: white;
                            padding: 30px;
                            border-radius: 10px;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                            padding-bottom: 20px;
                            border-bottom: 2px solid #007bff;
                        }
                        .header h1 {
                            color: #007bff;
                            margin: 0;
                            font-size: 24px;
                        }
                        .content {
                            margin-bottom: 30px;
                        }
                        .info-box {
                            background-color: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                            border-left: 4px solid #007bff;
                        }
                        .old-appointment {
                            background-color: #fff3cd;
                            border-left-color: #ffc107;
                        }
                        .new-appointment {
                            background-color: #d4edda;
                            border-left-color: #28a745;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #dee2e6;
                            color: #6c757d;
                            font-size: 14px;
                        }
                        .btn {
                            display: inline-block;
                            padding: 12px 24px;
                            background-color: #007bff;
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                            margin: 10px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>📅 Consulta Reprogramada</h1>
                        </div>
                        
                        <div class="content">
                            <p>Estimado/a <strong>${pacienteNombre}</strong>,</p>
                            
                            <p>Le informamos que su consulta con el Dr. <strong>${profesionalNombre}</strong> ha sido reprogramada.</p>
                            
                            <div class="info-box old-appointment">
                                <h3>📋 Consulta Original</h3>
                                <p><strong>Fecha:</strong> ${fechaOriginalFormateada}</p>
                                <p><strong>Hora:</strong> ${horaOriginalFormateada}</p>
                            </div>
                            
                            <div class="info-box new-appointment">
                                <h3>✅ Nueva Consulta</h3>
                                <p><strong>Fecha:</strong> ${nuevaFechaFormateada}</p>
                                <p><strong>Hora:</strong> ${nuevaHoraFormateada}</p>
                            </div>
                            
                            ${motivo ? `
                                <div class="info-box">
                                    <h3>📝 Motivo de la reprogramación</h3>
                                    <p>${motivo}</p>
                                </div>
                            ` : ''}
                            
                            <p>Por favor, tome nota de la nueva fecha y hora. Si tiene alguna consulta o necesita realizar algún cambio, no dude en contactarnos.</p>
                            
                            <p>¡Esperamos verle en su nueva cita!</p>
                        </div>
                        
                        <div class="footer">
                            <p>Este es un mensaje automático del sistema de gestión nutricional.</p>
                            <p>Por favor, no responda a este email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: `"Sistema Nutricional" <${process.env.SMTP_USER}>`,
                to: pacienteEmail,
                subject: `Consulta Reprogramada - ${profesionalNombre}`,
                html: htmlContent
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email de reprogramación enviado:', result.messageId);
            return result;

        } catch (error) {
            console.error('❌ Error enviando email de reprogramación:', error);
            throw error;
        }
    }

    // Formatear fecha para email
    formatDateForEmail(dateString) {
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch (error) {
            return dateString;
        }
    }

    // Enviar notificación de cancelación de consulta
    async sendCancelacionNotificacion(data) {
        try {
            const {
                pacienteNombre,
                pacienteEmail,
                profesionalNombre,
                fecha,
                hora,
                motivo
            } = data;

            if (!this.transporter) {
                throw new Error('Email service no está inicializado');
            }

            // Formatear fecha para el email
            const fechaFormateada = this.formatDateForEmail(fecha);
            const horaFormateada = this.formatTimeForEmail(hora);

            const htmlContent = `
                <!DOCTYPE html>
                <html lang="es">
                <head>
                    <meta charset="UTF-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    <title>Consulta Cancelada</title>
                    <style>
                        body {
                            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                            line-height: 1.6;
                            color: #333;
                            max-width: 600px;
                            margin: 0 auto;
                            padding: 20px;
                            background-color: #f8f9fa;
                        }
                        .container {
                            background-color: white;
                            padding: 30px;
                            border-radius: 10px;
                            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                        }
                        .header {
                            text-align: center;
                            margin-bottom: 30px;
                            padding-bottom: 20px;
                            border-bottom: 2px solid #dc3545;
                        }
                        .header h1 {
                            color: #dc3545;
                            margin: 0;
                            font-size: 24px;
                        }
                        .content {
                            margin-bottom: 30px;
                        }
                        .info-box {
                            background-color: #f8f9fa;
                            padding: 20px;
                            border-radius: 8px;
                            margin: 20px 0;
                            border-left: 4px solid #dc3545;
                        }
                        .cancelled-appointment {
                            background-color: #f8d7da;
                            border-left-color: #dc3545;
                        }
                        .reason-box {
                            background-color: #fff3cd;
                            border-left-color: #ffc107;
                        }
                        .footer {
                            text-align: center;
                            margin-top: 30px;
                            padding-top: 20px;
                            border-top: 1px solid #dee2e6;
                            color: #6c757d;
                            font-size: 14px;
                        }
                        .btn {
                            display: inline-block;
                            padding: 12px 24px;
                            background-color: #007bff;
                            color: white;
                            text-decoration: none;
                            border-radius: 5px;
                            margin: 10px 0;
                        }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h1>❌ Consulta Cancelada</h1>
                        </div>
                        
                        <div class="content">
                            <p>Estimado/a <strong>${pacienteNombre}</strong>,</p>
                            
                            <p>Le informamos que su consulta con el Dr. <strong>${profesionalNombre}</strong> ha sido cancelada.</p>
                            
                            <div class="info-box cancelled-appointment">
                                <h3>📋 Consulta Cancelada</h3>
                                <p><strong>Fecha:</strong> ${fechaFormateada}</p>
                                <p><strong>Hora:</strong> ${horaFormateada}</p>
                            </div>
                            
                            ${motivo ? `
                                <div class="info-box reason-box">
                                    <h3>📝 Motivo de la cancelación</h3>
                                    <p>${motivo}</p>
                                </div>
                            ` : ''}
                            
                            <p>Si necesita reprogramar su consulta o tiene alguna consulta, no dude en contactarnos.</p>
                            
                            <p>Lamentamos las molestias ocasionadas.</p>
                        </div>
                        
                        <div class="footer">
                            <p>Este es un mensaje automático del sistema de gestión nutricional.</p>
                            <p>Por favor, no responda a este email.</p>
                        </div>
                    </div>
                </body>
                </html>
            `;

            const mailOptions = {
                from: `"Sistema Nutricional" <${process.env.SMTP_USER}>`,
                to: pacienteEmail,
                subject: `Consulta Cancelada - ${profesionalNombre}`,
                html: htmlContent
            };

            const result = await this.transporter.sendMail(mailOptions);
            console.log('✅ Email de cancelación enviado:', result.messageId);
            return result;

        } catch (error) {
            console.error('❌ Error enviando email de cancelación:', error);
            throw error;
        }
    }
}

module.exports = EmailService;
