const { executeQuery } = require('../config/db');

class HorarioDisponible {
    constructor(data) {
        this.id = data.id;
        this.profesional_id = data.profesional_id;
        this.dia_semana = data.dia_semana;
        this.hora_inicio = data.hora_inicio;
        this.hora_fin = data.hora_fin;
        this.duracion_minutos = data.duracion_minutos;
        this.activo = data.activo;
        this.created_at = data.created_at;
        this.updated_at = data.updated_at;
    }

    // Crear nuevo horario disponible
    static async create(horarioData) {
        try {
            const query = `
                INSERT INTO horarios_disponibles (
                    profesional_id, dia_semana, hora_inicio, hora_fin, duracion_minutos, activo
                )
                VALUES (?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                horarioData.profesional_id,
                horarioData.dia_semana,
                horarioData.hora_inicio,
                horarioData.hora_fin,
                horarioData.duracion_minutos || 30,
                horarioData.activo !== undefined ? horarioData.activo : true
            ];
            
            const result = await executeQuery(query, params);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Obtener horarios por profesional
    static async findByProfesionalId(profesionalId) {
        try {
            const query = `
                SELECT * FROM horarios_disponibles 
                WHERE profesional_id = ? 
                ORDER BY 
                    CASE dia_semana 
                        WHEN 'Lunes' THEN 1
                        WHEN 'Martes' THEN 2
                        WHEN 'Miércoles' THEN 3
                        WHEN 'Jueves' THEN 4
                        WHEN 'Viernes' THEN 5
                        WHEN 'Sábado' THEN 6
                        WHEN 'Domingo' THEN 7
                    END,
                    hora_inicio
            `;
            const results = await executeQuery(query, [profesionalId]);
            return results.map(row => new HorarioDisponible(row));
        } catch (error) {
            throw error;
        }
    }

    // Obtener horario por ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM horarios_disponibles WHERE id = ?';
            const results = await executeQuery(query, [id]);
            return results.length > 0 ? new HorarioDisponible(results[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Actualizar horario
    static async update(id, horarioData) {
        try {
            const fields = [];
            const values = [];

            // Solo actualizar campos que se proporcionen
            Object.keys(horarioData).forEach(key => {
                if (horarioData[key] !== undefined && key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(horarioData[key]);
                }
            });

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            values.push(id);
            const query = `UPDATE horarios_disponibles SET ${fields.join(', ')} WHERE id = ?`;
            
            const result = await executeQuery(query, values);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Eliminar horario
    static async delete(id) {
        try {
            const query = 'DELETE FROM horarios_disponibles WHERE id = ?';
            const result = await executeQuery(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Eliminar todos los horarios de un profesional
    static async deleteByProfesionalId(profesionalId) {
        try {
            const query = 'DELETE FROM horarios_disponibles WHERE profesional_id = ?';
            const result = await executeQuery(query, [profesionalId]);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Verificar si hay conflicto de horarios
    static async checkConflict(profesionalId, diaSemana, horaInicio, horaFin, excludeId = null) {
        try {
            let query = `
                SELECT COUNT(*) as count FROM horarios_disponibles 
                WHERE profesional_id = ? 
                AND dia_semana = ? 
                AND (
                    (hora_inicio < ? AND hora_fin > ?) OR
                    (hora_inicio < ? AND hora_fin > ?) OR
                    (hora_inicio >= ? AND hora_fin <= ?)
                )
            `;
            
            const params = [profesionalId, diaSemana, horaInicio, horaInicio, horaFin, horaFin, horaInicio, horaFin];
            
            if (excludeId) {
                query += ' AND id != ?';
                params.push(excludeId);
            }
            
            const [result] = await executeQuery(query, params);
            return result.count > 0;
        } catch (error) {
            throw error;
        }
    }

    // Obtener estadísticas de horarios
    static async getStats(profesionalId) {
        try {
            const stats = {};
            
            // Contar total de horarios
            const totalQuery = 'SELECT COUNT(*) as total FROM horarios_disponibles WHERE profesional_id = ?';
            const [totalResult] = await executeQuery(totalQuery, [profesionalId]);
            stats.total_horarios = totalResult.total;
            
            // Contar horarios activos
            const activosQuery = 'SELECT COUNT(*) as activos FROM horarios_disponibles WHERE profesional_id = ? AND activo = true';
            const [activosResult] = await executeQuery(activosQuery, [profesionalId]);
            stats.horarios_activos = activosResult.activos;
            
            // Contar días con horarios
            const diasQuery = `
                SELECT COUNT(DISTINCT dia_semana) as dias 
                FROM horarios_disponibles 
                WHERE profesional_id = ? AND activo = true
            `;
            const [diasResult] = await executeQuery(diasQuery, [profesionalId]);
            stats.dias_trabajo = diasResult.dias;
            
            // Horarios por día
            const porDiaQuery = `
                SELECT dia_semana, COUNT(*) as cantidad
                FROM horarios_disponibles 
                WHERE profesional_id = ? AND activo = true
                GROUP BY dia_semana
                ORDER BY 
                    CASE dia_semana 
                        WHEN 'Lunes' THEN 1
                        WHEN 'Martes' THEN 2
                        WHEN 'Miércoles' THEN 3
                        WHEN 'Jueves' THEN 4
                        WHEN 'Viernes' THEN 5
                        WHEN 'Sábado' THEN 6
                        WHEN 'Domingo' THEN 7
                    END
            `;
            const porDiaResults = await executeQuery(porDiaQuery, [profesionalId]);
            stats.horarios_por_dia = porDiaResults;
            
            return stats;
        } catch (error) {
            throw error;
        }
    }

    // Convertir a objeto público
    toPublicObject() {
        return {
            id: this.id,
            profesional_id: this.profesional_id,
            dia_semana: this.dia_semana,
            hora_inicio: this.hora_inicio,
            hora_fin: this.hora_fin,
            duracion_minutos: this.duracion_minutos,
            activo: this.activo,
            created_at: this.created_at,
            updated_at: this.updated_at
        };
    }
}

module.exports = HorarioDisponible;
