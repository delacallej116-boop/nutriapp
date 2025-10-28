const { executeQuery } = require('../config/db');

class Antecedente {
    constructor() {
        this.tableName = 'antecedentes';
    }

    // Obtener antecedentes por usuario
    async getByUsuario(usuarioId) {
        try {
            const rows = await executeQuery(
                `SELECT * FROM ${this.tableName} WHERE usuario_id = ?`,
                [usuarioId]
            );

            return rows.length > 0 ? rows[0] : null;
        } catch (error) {
            console.error('Error en getByUsuario:', error);
            throw error;
        }
    }

    // Crear o actualizar antecedentes
    async createOrUpdate(antecedenteData) {
        try {
            const { usuario_id, antecedentes_personales, antecedentes_familiares, alergias, medicamentos_habituales, cirugias } = antecedenteData;

            // Verificar si ya existen antecedentes para este usuario
            const existing = await this.getByUsuario(usuario_id);

            if (existing) {
                // Actualizar
                const query = `
                    UPDATE ${this.tableName} 
                    SET antecedentes_personales = ?, 
                        antecedentes_familiares = ?, 
                        alergias = ?, 
                        medicamentos_habituales = ?, 
                        cirugias = ?
                    WHERE usuario_id = ?
                `;
                
                const result = await executeQuery(query, [
                    antecedentes_personales, antecedentes_familiares, alergias, medicamentos_habituales, cirugias, usuario_id
                ]);

                return { success: true, message: 'Antecedentes actualizados correctamente', id: existing.id };
            } else {
                // Crear
                const query = `
                    INSERT INTO ${this.tableName} 
                    (usuario_id, antecedentes_personales, antecedentes_familiares, alergias, medicamentos_habituales, cirugias) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                
                const result = await executeQuery(query, [
                    usuario_id, antecedentes_personales, antecedentes_familiares, alergias, medicamentos_habituales, cirugias
                ]);

                return { success: true, message: 'Antecedentes creados correctamente', id: result.insertId };
            }
        } catch (error) {
            console.error('Error en createOrUpdate:', error);
            throw error;
        }
    }

    // Eliminar antecedentes
    async deleteByUsuario(usuarioId) {
        try {
            const result = await executeQuery(
                `DELETE FROM ${this.tableName} WHERE usuario_id = ?`,
                [usuarioId]
            );

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error en deleteByUsuario:', error);
            throw error;
        }
    }

    // Obtener estadísticas de antecedentes
    async getStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_antecedentes,
                    COUNT(CASE WHEN antecedentes_personales IS NOT NULL AND antecedentes_personales != '' THEN 1 END) as con_personales,
                    COUNT(CASE WHEN antecedentes_familiares IS NOT NULL AND antecedentes_familiares != '' THEN 1 END) as con_familiares,
                    COUNT(CASE WHEN alergias IS NOT NULL AND alergias != '' THEN 1 END) as con_alergias,
                    COUNT(CASE WHEN medicamentos_habituales IS NOT NULL AND medicamentos_habituales != '' THEN 1 END) as con_medicamentos,
                    COUNT(CASE WHEN cirugias IS NOT NULL AND cirugias != '' THEN 1 END) as con_cirugias
                FROM ${this.tableName}
            `;
            
            const rows = await executeQuery(query);
            return rows[0];
        } catch (error) {
            console.error('Error en getStats:', error);
            throw error;
        }
    }
}

module.exports = Antecedente;
