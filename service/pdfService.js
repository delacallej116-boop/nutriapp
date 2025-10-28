const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class PDFService {
    constructor() {
        this.fontsPath = path.join(__dirname, '../fonts');
    }

    // Generar PDF del plan alimentario
    async generatePlanPDF(planData) {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    size: 'A4',
                    margins: {
                        top: 50,
                        bottom: 50,
                        left: 50,
                        right: 50
                    }
                });

                const buffers = [];
                doc.on('data', buffers.push.bind(buffers));
                doc.on('end', () => {
                    const pdfData = Buffer.concat(buffers);
                    resolve(pdfData);
                });

                // Configurar fuentes
                doc.fontSize(12);

                // Encabezado
                this.addHeader(doc, planData);

                // Información del paciente
                this.addPatientInfo(doc, planData);

                // Información del plan
                this.addPlanInfo(doc, planData);

                // Resumen nutricional
                if (planData.resumen_nutricional) {
                    this.addNutritionalSummary(doc, planData.resumen_nutricional);
                }

                // Plan semanal de comidas
                this.addWeeklyPlan(doc, planData.comidas);

                // Pie de página
                this.addFooter(doc);

                doc.end();
            } catch (error) {
                reject(error);
            }
        });
    }

    // Agregar encabezado
    addHeader(doc, planData) {
        doc.fontSize(20)
           .fillColor('#007bff')
           .text('PLAN ALIMENTARIO', { align: 'center' });
        
        doc.fontSize(14)
           .fillColor('#333')
           .text(planData.nombre || 'Plan Personalizado', { align: 'center' });
        
        doc.moveDown(2);
    }

    // Agregar información del paciente
    addPatientInfo(doc, planData) {
        doc.fontSize(12)
           .fillColor('#333')
           .text('INFORMACIÓN DEL PACIENTE', { underline: true });
        
        doc.moveDown(0.5);
        
        const patientInfo = [
            `Nombre: ${planData.paciente_nombre || 'No especificado'}`,
            `Email: ${planData.paciente_email || 'No especificado'}`,
            `Teléfono: ${planData.paciente_telefono || 'No especificado'}`,
            `Fecha de Nacimiento: ${planData.paciente_fecha_nacimiento || 'No especificada'}`
        ];

        patientInfo.forEach(info => {
            doc.text(info);
        });

        doc.moveDown(1);
    }

    // Agregar información del plan
    addPlanInfo(doc, planData) {
        doc.fontSize(12)
           .fillColor('#333')
           .text('INFORMACIÓN DEL PLAN', { underline: true });
        
        doc.moveDown(0.5);
        
        const planInfo = [
            `Tipo: ${planData.tipo || 'No especificado'}`,
            `Objetivo: ${planData.objetivo || 'No especificado'}`,
            `Calorías Diarias: ${planData.calorias_diarias || 'No especificadas'}`,
            `Fecha de Creación: ${this.formatDate(planData.creado_en)}`,
            `Fecha de Inicio: ${this.formatDate(planData.fecha_inicio) || 'No especificada'}`,
            `Fecha de Fin: ${this.formatDate(planData.fecha_fin) || 'Sin fecha límite'}`
        ];

        planInfo.forEach(info => {
            doc.text(info);
        });

        if (planData.descripcion) {
            doc.moveDown(0.5);
            doc.text(`Descripción: ${planData.descripcion}`);
        }

        if (planData.observaciones) {
            doc.moveDown(0.5);
            doc.text(`Observaciones: ${planData.observaciones}`);
        }

        doc.moveDown(1);
    }

    // Agregar resumen nutricional
    addNutritionalSummary(doc, resumen) {
        doc.fontSize(12)
           .fillColor('#333')
           .text('RESUMEN NUTRICIONAL PROMEDIO', { underline: true });
        
        doc.moveDown(0.5);
        
        const nutritionalInfo = [
            `Calorías: ${Math.round(resumen.calorias_promedio || 0)} kcal`,
            `Proteínas: ${Math.round(resumen.proteinas_promedio || 0)} g`,
            `Carbohidratos: ${Math.round(resumen.carbohidratos_promedio || 0)} g`,
            `Grasas: ${Math.round(resumen.grasas_promedio || 0)} g`,
            `Fibra: ${Math.round(resumen.fibra_promedio || 0)} g`,
            `Azúcares: ${Math.round(resumen.azucares_promedio || 0)} g`,
            `Sodio: ${Math.round(resumen.sodio_promedio || 0)} mg`
        ];

        nutritionalInfo.forEach(info => {
            doc.text(info);
        });

        doc.moveDown(1);
    }

    // Agregar plan semanal
    addWeeklyPlan(doc, comidas) {
        if (!comidas || comidas.length === 0) {
            doc.fontSize(12)
               .fillColor('#333')
               .text('PLAN SEMANAL DE COMIDAS', { underline: true });
            
            doc.moveDown(0.5);
            doc.text('No hay comidas programadas en este plan.');
            return;
        }

        doc.fontSize(12)
           .fillColor('#333')
           .text('PLAN SEMANAL DE COMIDAS', { underline: true });
        
        doc.moveDown(0.5);

        // Organizar comidas por día
        const comidasPorDia = {};
        comidas.forEach(comida => {
            if (!comidasPorDia[comida.dia_semana]) {
                comidasPorDia[comida.dia_semana] = [];
            }
            comidasPorDia[comida.dia_semana].push(comida);
        });

        const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
        const ordenComidas = ['desayuno', 'media_manana', 'almuerzo', 'media_tarde', 'cena', 'colacion'];

        ordenDias.forEach(dia => {
            if (comidasPorDia[dia]) {
                doc.fontSize(11)
                   .fillColor('#007bff')
                   .text(dia.toUpperCase(), { underline: true });
                
                doc.moveDown(0.3);

                const comidasDelDia = comidasPorDia[dia]
                    .sort((a, b) => ordenComidas.indexOf(a.tipo_comida) - ordenComidas.indexOf(b.tipo_comida));

                comidasDelDia.forEach(comida => {
                    const tipoComida = this.getComidaName(comida.tipo_comida);
                    doc.fontSize(10)
                       .fillColor('#333')
                       .text(`• ${tipoComida}${comida.hora ? ` (${comida.hora})` : ''}: ${comida.nombre_comida}`);
                    
                    if (comida.descripcion) {
                        doc.text(`  ${comida.descripcion}`, { indent: 20 });
                    }
                    
                    if (comida.ingredientes) {
                        doc.text(`  Ingredientes: ${comida.ingredientes}`, { indent: 20 });
                    }
                    
                    if (comida.calorias) {
                        doc.text(`  Calorías: ${comida.calorias}`, { indent: 20 });
                    }
                    
                    doc.moveDown(0.2);
                });

                doc.moveDown(0.5);
            }
        });
    }

    // Agregar pie de página
    addFooter(doc) {
        const pageHeight = doc.page.height;
        const pageWidth = doc.page.width;
        
        doc.fontSize(8)
           .fillColor('#666')
           .text('Generado automáticamente por el Sistema de Gestión Nutricional', 
                 pageWidth - 50, pageHeight - 30, { align: 'right' });
        
        doc.text(new Date().toLocaleDateString('es-ES'), 
                 pageWidth - 50, pageHeight - 20, { align: 'right' });
    }

    // Formatear fecha
    formatDate(dateString) {
        if (!dateString) return null;
        return new Date(dateString).toLocaleDateString('es-ES');
    }

    // Obtener nombre de comida
    getComidaName(tipoComida) {
        const names = {
            'desayuno': 'Desayuno',
            'media_manana': 'Media Mañana',
            'almuerzo': 'Almuerzo',
            'media_tarde': 'Media Tarde',
            'cena': 'Cena',
            'colacion': 'Colación'
        };
        return names[tipoComida] || tipoComida;
    }
}

module.exports = new PDFService();
