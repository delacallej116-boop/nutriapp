const { executeQuery } = require('../config/db');

class Reporte {
    constructor(data) {
        this.id = data.id;
        this.profesional_id = data.profesional_id;
        this.usuario_id = data.usuario_id;
        this.tipo = data.tipo; // 'general', 'paciente_individual', 'laboratorio', etc.
        this.fecha_desde = data.fecha_desde;
        this.fecha_hasta = data.fecha_hasta;
        this.generado_en = data.generado_en;
        this.archivo_url = data.archivo_url;
        this.created_at = data.created_at;
    }

    // Crear nuevo reporte
    async save() {
        try {
            const query = `
                INSERT INTO reportes_generados 
                (profesional_id, usuario_id, tipo, fecha_desde, fecha_hasta, generado_en, archivo_url)
                VALUES (?, ?, ?, ?, ?, NOW(), ?)
            `;
            
            const params = [
                this.profesional_id,
                this.usuario_id || null,
                this.tipo,
                this.fecha_desde,
                this.fecha_hasta,
                this.archivo_url
            ];
            
            const [result] = await executeQuery(query, params);
            this.id = result.insertId;
            return this;
        } catch (error) {
            throw error;
        }
    }

    // Obtener reportes recientes de un profesional
    static async getRecentReports(profesionalId, limit = 5) {
        try {
            console.log(`🔍 Ejecutando consulta reportes recientes con profesionalId: ${profesionalId}, limite: ${limit}`);
            
            const query = `
                SELECT 
                    id,
                    tipo,
                    fecha_desde,
                    fecha_hasta,
                    generado_en,
                    archivo_url
                FROM reportes_generados
                WHERE profesional_id = ?
                ORDER BY generado_en DESC
                LIMIT ?
            `;
            
            const [results] = await executeQuery(query, [profesionalId, limit]);
            return results.map(row => new Reporte(row));
        } catch (error) {
            console.error('Error obteniendo reportes recientes:', error);
            throw error;
        }
    }

    // Obtener estadísticas de reportes
    static async getStats(profesionalId) {
        try {
            console.log(`📈 Obteniendo estadísticas para profesionalId: ${profesionalId}`);
            
            const queries = {
                totalReportes: `
                    SELECT COUNT(*) as total 
                    FROM reportes_generados 
                    WHERE profesional_id = ?
                `,
                reportesUltimoMes: `
                    SELECT COUNT(*) as total 
                    FROM reportes_generados 
                    WHERE profesional_id = ? 
                    AND generado_en >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                `,
                ultimoReporte: `
                    SELECT tipo, generado_en, archivo_url
                    FROM reportes_generados 
                    WHERE profesional_id = ? 
                    ORDER BY generado_en DESC 
                    LIMIT 1
                `
            };
            
            const stats = {};
            
            for (const [key, query] of Object.entries(queries)) {
                const [results] = await executeQuery(query, [profesionalId]);
                if (key === 'ultimoReporte') {
                    stats[key] = results.length > 0 ? results[0] : null;
                } else {
                    stats[key] = results[0];
                }
            }
            
            return stats;
        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            throw error;
        }
    }

    // Eliminar reporte
    async delete() {
        try {
            const query = 'DELETE FROM reportes_generados WHERE id = ?';
            await executeQuery(query, [this.id]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Convertir a objeto público
    toPublicObject() {
        return {
            id: this.id,
            tipo: this.tipo,
            fecha_desde: this.fecha_desde,
            fecha_hasta: this.fecha_hasta,
            generado_en: this.generado_en,
            archivo_url: this.archivo_url
        };
    }
}

module.exports = Reporte;
