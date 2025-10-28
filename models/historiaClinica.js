const { executeQuery } = require('../config/db');

class HistoriaClinica {
    // Método estático para ejecutar consultas personalizadas
    static async executeQuery(query, params = []) {
        return await executeQuery(query, params);
    }

    // Crear nueva consulta
    static async createConsulta(consultaData) {
        try {
            const query = `
                INSERT INTO consultas (
                    usuario_id, profesional_id, fecha_consulta, motivo_consulta,
                    evaluacion, plan_tratamiento, observaciones
                )
                VALUES (?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                consultaData.usuario_id,
                consultaData.profesional_id,
                consultaData.fecha_consulta,
                consultaData.motivo_consulta,
                consultaData.evaluacion,
                consultaData.plan_tratamiento,
                consultaData.observaciones
            ];
            
            const result = await executeQuery(query, params);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Crear nueva medición antropométrica
    static async createMedicion(medicionData) {
        try {
            const query = `
                INSERT INTO antropometria (
                    usuario_id, fecha, peso, altura, imc,
                    cintura, cadera, pliegue_tricipital, pliegue_subescapular,
                    fecha_medicion, circunferencia_cintura, circunferencia_cadera, 
                    porcentaje_grasa, masa_muscular, observaciones
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                medicionData.usuario_id,
                medicionData.fecha || new Date().toISOString().split('T')[0],
                medicionData.peso,
                medicionData.altura,
                medicionData.imc,
                medicionData.cintura,
                medicionData.cadera,
                medicionData.pliegue_tricipital,
                medicionData.pliegue_subescapular,
                medicionData.fecha_medicion || new Date(),
                medicionData.circunferencia_cintura,
                medicionData.circunferencia_cadera,
                medicionData.porcentaje_grasa,
                medicionData.masa_muscular,
                medicionData.observaciones
            ];
            
            const result = await executeQuery(query, params);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Crear nuevo plan de alimentación
    static async createPlanAlimentacion(planData) {
        try {
            const query = `
                INSERT INTO planes_alimentacion (
                    usuario_id, profesional_id, fecha_inicio, fecha_fin, descripcion,
                    fecha_creacion, objetivo, calorias_diarias, caracteristicas, 
                    observaciones, activo
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                planData.usuario_id,
                planData.profesional_id,
                planData.fecha_inicio || new Date().toISOString().split('T')[0],
                planData.fecha_fin,
                planData.descripcion,
                planData.fecha_creacion || new Date(),
                planData.objetivo,
                planData.calorias_diarias,
                planData.caracteristicas,
                planData.observaciones,
                planData.activo !== undefined ? planData.activo : true
            ];
            
            const result = await executeQuery(query, params);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Crear nuevo documento
    static async createDocumento(documentoData) {
        try {
            const query = `
                INSERT INTO documentos (
                    usuario_id, fecha, tipo, archivo_url, descripcion,
                    nombre_archivo, tipo_documento, ruta_archivo,
                    fecha_subida, tamaño_archivo
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                documentoData.usuario_id,
                documentoData.fecha || new Date().toISOString().split('T')[0],
                documentoData.tipo,
                documentoData.archivo_url,
                documentoData.descripcion,
                documentoData.nombre_archivo,
                documentoData.tipo_documento,
                documentoData.ruta_archivo,
                documentoData.fecha_subida || new Date(),
                documentoData.tamaño_archivo
            ];
            
            const result = await executeQuery(query, params);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Obtener consultas de un paciente
    static async getConsultasByPaciente(pacienteId) {
        try {
            const query = `
                SELECT c.*, p.apellido_nombre as profesional_nombre
                FROM consultas c
                LEFT JOIN profesionales p ON c.profesional_id = p.id
                WHERE c.usuario_id = ?
                ORDER BY c.fecha_consulta DESC
            `;
            return await executeQuery(query, [pacienteId]);
        } catch (error) {
            throw error;
        }
    }

    // Obtener mediciones de un paciente
    static async getMedicionesByPaciente(pacienteId) {
        try {
            const query = `
                SELECT * FROM antropometria
                WHERE usuario_id = ?
                ORDER BY fecha_medicion DESC
            `;
            return await executeQuery(query, [pacienteId]);
        } catch (error) {
            throw error;
        }
    }

    // Obtener planes de alimentación de un paciente
    static async getPlanesByPaciente(pacienteId) {
        try {
            const query = `
                SELECT * FROM planes_alimentacion
                WHERE usuario_id = ?
                ORDER BY fecha_inicio DESC
            `;
            return await executeQuery(query, [pacienteId]);
        } catch (error) {
            throw error;
        }
    }

    // Obtener documentos de un paciente
    static async getDocumentosByPaciente(pacienteId) {
        try {
            const query = `
                SELECT * FROM documentos
                WHERE usuario_id = ?
                ORDER BY fecha DESC
            `;
            return await executeQuery(query, [pacienteId]);
        } catch (error) {
            throw error;
        }
    }
}

module.exports = HistoriaClinica;
