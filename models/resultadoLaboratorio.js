const mysql = require('mysql2/promise');
const { getConnection } = require('../config/db');

class ResultadoLaboratorio {
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

    // Crear un nuevo resultado de laboratorio
    async createResultado(resultadoData) {
        const connection = await this.getConnection();
        
        try {
            const {
                laboratorio_id,
                parametro,
                valor,
                unidad,
                valor_referencia_min,
                valor_referencia_max,
                estado,
                observaciones
            } = resultadoData;

            const [result] = await connection.execute(`
                INSERT INTO resultados_laboratorio (
                    laboratorio_id, parametro, valor, unidad,
                    valor_referencia_min, valor_referencia_max, 
                    estado, observaciones
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `, [
                laboratorio_id, parametro, valor, unidad,
                valor_referencia_min, valor_referencia_max, 
                estado, observaciones
            ]);

            return result.insertId;
        } catch (error) {
            console.error('Error en createResultado:', error);
            throw error;
        }
    }

    // Crear múltiples resultados de laboratorio
    async createMultipleResultados(resultadosArray) {
        const connection = await this.getConnection();
        
        try {
            if (!resultadosArray || resultadosArray.length === 0) {
                return [];
            }

            const insertPromises = resultadosArray.map(resultado => {
                return this.createResultado(resultado);
            });

            const insertedIds = await Promise.all(insertPromises);
            return insertedIds;
        } catch (error) {
            console.error('Error en createMultipleResultados:', error);
            throw error;
        }
    }

    // Obtener resultados por laboratorio
    async getResultadosByLaboratorio(laboratorioId) {
        const connection = await this.getConnection();
        
        try {
            const [rows] = await connection.execute(`
                SELECT * FROM resultados_laboratorio 
                WHERE laboratorio_id = ?
                ORDER BY parametro ASC
            `, [laboratorioId]);

            return rows;
        } catch (error) {
            console.error('Error en getResultadosByLaboratorio:', error);
            throw error;
        }
    }

    // Obtener un resultado específico
    async getResultadoById(resultadoId) {
        const connection = await this.getConnection();
        
        try {
            const [rows] = await connection.execute(`
                SELECT * FROM resultados_laboratorio 
                WHERE id = ?
            `, [resultadoId]);

            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en getResultadoById:', error);
            throw error;
        }
    }

    // Actualizar un resultado
    async updateResultado(resultadoId, resultadoData) {
        const connection = await this.getConnection();
        
        try {
            const {
                parametro,
                valor,
                unidad,
                valor_referencia_min,
                valor_referencia_max,
                estado,
                observaciones
            } = resultadoData;

            const [result] = await connection.execute(`
                UPDATE resultados_laboratorio 
                SET parametro = ?, valor = ?, unidad = ?,
                    valor_referencia_min = ?, valor_referencia_max = ?,
                    estado = ?, observaciones = ?
                WHERE id = ?
            `, [
                parametro, valor, unidad,
                valor_referencia_min, valor_referencia_max,
                estado, observaciones, resultadoId
            ]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en updateResultado:', error);
            throw error;
        }
    }

    // Eliminar un resultado
    async deleteResultado(resultadoId) {
        const connection = await this.getConnection();
        
        try {
            const [result] = await connection.execute(`
                DELETE FROM resultados_laboratorio WHERE id = ?
            `, [resultadoId]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en deleteResultado:', error);
            throw error;
        }
    }

    // Eliminar todos los resultados de un laboratorio
    async deleteResultadosByLaboratorio(laboratorioId) {
        const connection = await this.getConnection();
        
        try {
            const [result] = await connection.execute(`
                DELETE FROM resultados_laboratorio WHERE laboratorio_id = ?
            `, [laboratorioId]);

            return result.affectedRows;
        } catch (error) {
            console.error('Error en deleteResultadosByLaboratorio:', error);
            throw error;
        }
    }

    // Obtener evolución de un parámetro específico
    async getEvolucionParametro(usuarioId, parametro) {
        const connection = await this.getConnection();
        
        try {
            const [rows] = await connection.execute(`
                SELECT 
                    rl.*,
                    l.fecha_estudio,
                    l.laboratorio
                FROM resultados_laboratorio rl
                INNER JOIN laboratorios l ON rl.laboratorio_id = l.id
                WHERE l.usuario_id = ? AND rl.parametro = ?
                ORDER BY l.fecha_estudio ASC
            `, [usuarioId, parametro]);

            return rows;
        } catch (error) {
            console.error('Error en getEvolucionParametro:', error);
            throw error;
        }
    }

    // Obtener parámetros con valores fuera de rango
    async getParametrosFueraRango(usuarioId) {
        const connection = await this.getConnection();
        
        try {
            const [rows] = await connection.execute(`
                SELECT 
                    rl.*,
                    l.fecha_estudio,
                    l.laboratorio,
                    u.apellido_nombre as paciente_nombre
                FROM resultados_laboratorio rl
                INNER JOIN laboratorios l ON rl.laboratorio_id = l.id
                INNER JOIN usuarios u ON l.usuario_id = u.id
                WHERE l.usuario_id = ? AND rl.estado IN ('alto', 'bajo', 'critico')
                ORDER BY l.fecha_estudio DESC, rl.parametro ASC
            `, [usuarioId]);

            return rows;
        } catch (error) {
            console.error('Error en getParametrosFueraRango:', error);
            throw error;
        }
    }

    // Obtener estadísticas de resultados por profesional
    async getResultadoStats(profesionalId) {
        const connection = await this.getConnection();
        
        try {
            const [rows] = await connection.execute(`
                SELECT 
                    COUNT(*) as total_resultados,
                    COUNT(DISTINCT rl.parametro) as parametros_unicos,
                    COUNT(CASE WHEN rl.estado = 'normal' THEN 1 END) as resultados_normales,
                    COUNT(CASE WHEN rl.estado = 'alto' THEN 1 END) as resultados_altos,
                    COUNT(CASE WHEN rl.estado = 'bajo' THEN 1 END) as resultados_bajos,
                    COUNT(CASE WHEN rl.estado = 'critico' THEN 1 END) as resultados_criticos
                FROM resultados_laboratorio rl
                INNER JOIN laboratorios l ON rl.laboratorio_id = l.id
                WHERE l.profesional_id = ?
            `, [profesionalId]);

            return rows[0];
        } catch (error) {
            console.error('Error en getResultadoStats:', error);
            throw error;
        }
    }

    // Actualizar estado de un resultado específico
    async updateResultadoStatus(resultadoId, estado) {
        const connection = await this.getConnection();
        
        try {
            const [result] = await connection.execute(`
                UPDATE resultados_laboratorio 
                SET estado = ?
                WHERE id = ?
            `, [estado, resultadoId]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en updateResultadoStatus:', error);
            throw error;
        }
    }
}

module.exports = ResultadoLaboratorio;
