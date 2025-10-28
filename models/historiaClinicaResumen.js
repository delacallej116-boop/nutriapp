const { executeQuery } = require('../config/db');

class HistoriaClinicaResumen {
    // Método estático para ejecutar consultas personalizadas
    static async executeQuery(query, params = []) {
        return await executeQuery(query, params);
    }

    // Crear o actualizar resumen de historia clínica
    static async createOrUpdateResumen(usuarioId, profesionalId) {
        try {
            // Obtener estadísticas actuales
            const stats = await this.calculateStats(usuarioId);
            
            const query = `
                INSERT INTO historia_clinica_resumen (
                    usuario_id, profesional_id, total_consultas, ultima_consulta,
                    proxima_consulta, total_mediciones, ultima_medicion,
                    peso_actual, altura_actual, imc_actual, total_planes,
                    plan_activo_id, plan_activo_fecha_inicio, total_documentos,
                    ultimo_documento
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                ON DUPLICATE KEY UPDATE
                    total_consultas = VALUES(total_consultas),
                    ultima_consulta = VALUES(ultima_consulta),
                    proxima_consulta = VALUES(proxima_consulta),
                    total_mediciones = VALUES(total_mediciones),
                    ultima_medicion = VALUES(ultima_medicion),
                    peso_actual = VALUES(peso_actual),
                    altura_actual = VALUES(altura_actual),
                    imc_actual = VALUES(imc_actual),
                    total_planes = VALUES(total_planes),
                    plan_activo_id = VALUES(plan_activo_id),
                    plan_activo_fecha_inicio = VALUES(plan_activo_fecha_inicio),
                    total_documentos = VALUES(total_documentos),
                    ultimo_documento = VALUES(ultimo_documento),
                    ultima_actualizacion = CURRENT_TIMESTAMP
            `;
            
            const params = [
                usuarioId, profesionalId,
                stats.total_consultas, stats.ultima_consulta,
                stats.proxima_consulta, stats.total_mediciones, stats.ultima_medicion,
                stats.peso_actual, stats.altura_actual, stats.imc_actual,
                stats.total_planes, stats.plan_activo_id, stats.plan_activo_fecha_inicio,
                stats.total_documentos, stats.ultimo_documento
            ];
            
            const result = await executeQuery(query, params);
            return result.insertId || result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Calcular estadísticas de un paciente
    static async calculateStats(usuarioId) {
        try {
            // Consultas
            const consultasQuery = `
                SELECT 
                    COUNT(*) as total_consultas,
                    MAX(fecha) as ultima_consulta,
                    MIN(CASE WHEN fecha > CURDATE() THEN fecha END) as proxima_consulta
                FROM consultas 
                WHERE usuario_id = ?
            `;
            const [consultasStats] = await executeQuery(consultasQuery, [usuarioId]);
            
            // Mediciones
            const medicionesQuery = `
                SELECT 
                    COUNT(*) as total_mediciones,
                    MAX(fecha) as ultima_medicion,
                    peso as peso_actual,
                    altura as altura_actual,
                    imc as imc_actual
                FROM antropometria 
                WHERE usuario_id = ?
                ORDER BY fecha DESC
                LIMIT 1
            `;
            const [medicionesStats] = await executeQuery(medicionesQuery, [usuarioId]);
            
            // Planes
            const planesQuery = `
                SELECT 
                    COUNT(*) as total_planes,
                    id as plan_activo_id,
                    fecha_inicio as plan_activo_fecha_inicio
                FROM planes_alimentacion 
                WHERE usuario_id = ?
                ORDER BY fecha_inicio DESC
                LIMIT 1
            `;
            const [planesStats] = await executeQuery(planesQuery, [usuarioId]);
            
            // Documentos
            const documentosQuery = `
                SELECT 
                    COUNT(*) as total_documentos,
                    MAX(fecha) as ultimo_documento
                FROM documentos 
                WHERE usuario_id = ?
            `;
            const [documentosStats] = await executeQuery(documentosQuery, [usuarioId]);
            
            return {
                total_consultas: consultasStats.total_consultas || 0,
                ultima_consulta: consultasStats.ultima_consulta,
                proxima_consulta: consultasStats.proxima_consulta,
                total_mediciones: medicionesStats.total_mediciones || 0,
                ultima_medicion: medicionesStats.ultima_medicion,
                peso_actual: medicionesStats.peso_actual,
                altura_actual: medicionesStats.altura_actual,
                imc_actual: medicionesStats.imc_actual,
                total_planes: planesStats.total_planes || 0,
                plan_activo_id: planesStats.plan_activo_id,
                plan_activo_fecha_inicio: planesStats.plan_activo_fecha_inicio,
                total_documentos: documentosStats.total_documentos || 0,
                ultimo_documento: documentosStats.ultimo_documento
            };
        } catch (error) {
            throw error;
        }
    }

    // Obtener resumen de historia clínica
    static async getResumenByPaciente(pacienteId) {
        try {
            const query = `
                SELECT hcr.*, u.apellido_nombre, u.numero_documento
                FROM historia_clinica_resumen hcr
                JOIN usuarios u ON hcr.usuario_id = u.id
                WHERE hcr.usuario_id = ?
            `;
            const [resumen] = await executeQuery(query, [pacienteId]);
            return resumen;
        } catch (error) {
            throw error;
        }
    }

    // Obtener resúmenes de todos los pacientes de un profesional
    static async getResumenesByProfesional(profesionalId) {
        try {
            const query = `
                SELECT hcr.*, u.apellido_nombre, u.numero_documento, u.email, u.telefono
                FROM historia_clinica_resumen hcr
                JOIN usuarios u ON hcr.usuario_id = u.id
                WHERE hcr.profesional_id = ?
                ORDER BY hcr.ultima_consulta DESC
            `;
            return await executeQuery(query, [profesionalId]);
        } catch (error) {
            throw error;
        }
    }

    // Actualizar resumen después de cambios
    static async updateResumenAfterChange(usuarioId, profesionalId) {
        try {
            return await this.createOrUpdateResumen(usuarioId, profesionalId);
        } catch (error) {
            throw error;
        }
    }

    // Eliminar resumen de historia clínica
    static async deleteResumen(usuarioId) {
        try {
            const query = `DELETE FROM historia_clinica_resumen WHERE usuario_id = ?`;
            const result = await executeQuery(query, [usuarioId]);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = HistoriaClinicaResumen;
