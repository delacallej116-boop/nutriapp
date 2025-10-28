const mysql = require('mysql2/promise');
const { getConnection } = require('../config/db');

class Laboratorio {
    constructor() {
        this.connection = null;
    }

    async getConnection() {
        if (!this.connection) {
            this.connection = await getConnection();
        }
        return this.connection;
    }

    async closeConnection() {
        if (this.connection) {
            await this.connection.end();
            this.connection = null;
        }
    }

    // Crear un nuevo estudio de laboratorio
    async createLaboratorio(laboratorioData) {
        const connection = await this.getConnection();
        
        try {
            const {
                usuario_id,
                profesional_id,
                fecha_estudio,
                laboratorio,
                medico_solicitante,
                notas
            } = laboratorioData;

            const [result] = await connection.execute(`
                INSERT INTO laboratorios (
                    usuario_id, profesional_id, fecha_estudio, 
                    laboratorio, medico_solicitante, notas
                ) VALUES (?, ?, ?, ?, ?, ?)
            `, [usuario_id, profesional_id, fecha_estudio, laboratorio, medico_solicitante, notas]);

            return result.insertId;
        } catch (error) {
            console.error('Error en createLaboratorio:', error);
            throw error;
        }
    }

    // Obtener laboratorios por usuario
    async getLaboratoriosByUsuario(usuarioId) {
        const connection = await this.getConnection();
        
        try {
            const [rows] = await connection.execute(`
                SELECT 
                    l.*,
                    u.apellido_nombre as paciente_nombre,
                    p.nombre as profesional_nombre
                FROM laboratorios l
                LEFT JOIN usuarios u ON l.usuario_id = u.id
                LEFT JOIN profesionales p ON l.profesional_id = p.id
                WHERE l.usuario_id = ?
                ORDER BY l.fecha_estudio DESC, l.creado_en DESC
            `, [usuarioId]);

            // Para cada laboratorio, obtener sus resultados
            const laboratoriosConResultados = await Promise.all(
                rows.map(async (laboratorio) => {
                    const [resultadosRows] = await connection.execute(`
                        SELECT * FROM resultados_laboratorio 
                        WHERE laboratorio_id = ?
                        ORDER BY parametro ASC
                    `, [laboratorio.id]);

                    laboratorio.resultados = resultadosRows;
                    return laboratorio;
                })
            );

            return laboratoriosConResultados;
        } catch (error) {
            console.error('Error en getLaboratoriosByUsuario:', error);
            throw error;
        }
    }

    // Obtener laboratorios por profesional
    async getLaboratoriosByProfesional(profesionalId) {
        const connection = await this.getConnection();
        
        try {
            const [rows] = await connection.execute(`
                SELECT 
                    l.*,
                    u.apellido_nombre as paciente_nombre,
                    u.numero_documento as paciente_dni
                FROM laboratorios l
                LEFT JOIN usuarios u ON l.usuario_id = u.id
                WHERE l.profesional_id = ?
                ORDER BY l.fecha_estudio DESC, l.creado_en DESC
            `, [profesionalId]);

            // Para cada laboratorio, obtener sus resultados
            const laboratoriosConResultados = await Promise.all(
                rows.map(async (laboratorio) => {
                    const [resultadosRows] = await connection.execute(`
                        SELECT * FROM resultados_laboratorio 
                        WHERE laboratorio_id = ?
                        ORDER BY parametro ASC
                    `, [laboratorio.id]);

                    laboratorio.resultados = resultadosRows;
                    return laboratorio;
                })
            );

            return laboratoriosConResultados;
        } catch (error) {
            console.error('Error en getLaboratoriosByProfesional:', error);
            throw error;
        }
    }

    // Obtener un laboratorio específico con sus resultados
    async getLaboratorioById(laboratorioId) {
        const connection = await this.getConnection();
        
        try {
            const [laboratorioRows] = await connection.execute(`
                SELECT 
                    l.*,
                    u.apellido_nombre as paciente_nombre,
                    u.numero_documento as paciente_dni,
                    p.nombre as profesional_nombre
                FROM laboratorios l
                LEFT JOIN usuarios u ON l.usuario_id = u.id
                LEFT JOIN profesionales p ON l.profesional_id = p.id
                WHERE l.id = ?
            `, [laboratorioId]);

            if (laboratorioRows.length === 0) {
                return null;
            }

            const laboratorio = laboratorioRows[0];

            // Obtener resultados del laboratorio
            const [resultadosRows] = await connection.execute(`
                SELECT * FROM resultados_laboratorio 
                WHERE laboratorio_id = ?
                ORDER BY parametro ASC
            `, [laboratorioId]);

            laboratorio.resultados = resultadosRows;

            return laboratorio;
        } catch (error) {
            console.error('Error en getLaboratorioById:', error);
            throw error;
        }
    }

    // Actualizar un laboratorio
    async updateLaboratorio(laboratorioId, laboratorioData) {
        const connection = await this.getConnection();
        
        try {
            const {
                fecha_estudio,
                laboratorio,
                medico_solicitante,
                notas
            } = laboratorioData;

            const [result] = await connection.execute(`
                UPDATE laboratorios 
                SET fecha_estudio = ?, laboratorio = ?, 
                    medico_solicitante = ?, notas = ?
                WHERE id = ?
            `, [fecha_estudio, laboratorio, medico_solicitante, notas, laboratorioId]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en updateLaboratorio:', error);
            throw error;
        }
    }

    // Eliminar un laboratorio
    async deleteLaboratorio(laboratorioId) {
        const connection = await this.getConnection();
        
        try {
            const [result] = await connection.execute(`
                DELETE FROM laboratorios WHERE id = ?
            `, [laboratorioId]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en deleteLaboratorio:', error);
            throw error;
        }
    }

    // Obtener estadísticas de laboratorios por profesional
    async getLaboratorioStats(profesionalId) {
        const connection = await this.getConnection();
        
        try {
            const [rows] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_laboratorios,
                    COUNT(DISTINCT usuario_id) as pacientes_con_laboratorios,
                    MIN(fecha_estudio) as primer_laboratorio,
                    MAX(fecha_estudio) as ultimo_laboratorio
                FROM laboratorios 
                WHERE profesional_id = ?
            `, [profesionalId]);

            return rows[0];
        } catch (error) {
            console.error('Error en getLaboratorioStats:', error);
            throw error;
        }
    }

    // Buscar laboratorios por fecha
    async getLaboratoriosByDateRange(profesionalId, fechaInicio, fechaFin) {
        const connection = await this.getConnection();
        
        try {
            const [rows] = await connection.execute(`
                SELECT 
                    l.*,
                    u.apellido_nombre as paciente_nombre,
                    u.numero_documento as paciente_dni
                FROM laboratorios l
                LEFT JOIN usuarios u ON l.usuario_id = u.id
                WHERE l.profesional_id = ? 
                AND l.fecha_estudio BETWEEN ? AND ?
                ORDER BY l.fecha_estudio DESC
            `, [profesionalId, fechaInicio, fechaFin]);

            return rows;
        } catch (error) {
            console.error('Error en getLaboratoriosByDateRange:', error);
            throw error;
        }
    }
}

module.exports = Laboratorio;
