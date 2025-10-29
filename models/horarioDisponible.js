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

            // Total de horarios y activos
            const totalQuery = `
                SELECT 
                    COUNT(*) AS total,
                    SUM(CASE WHEN activo = TRUE THEN 1 ELSE 0 END) AS activos
                FROM horarios_disponibles
                WHERE profesional_id = ?
            `;
            const [totalRow] = await executeQuery(totalQuery, [profesionalId]);
            stats.total_horarios = totalRow.total || 0;
            stats.horarios_activos = totalRow.activos || 0;

            // Días cubiertos (distintos con al menos un horario activo)
            const diasCubiertosQuery = `
                SELECT COUNT(DISTINCT dia_semana) AS dias
                FROM horarios_disponibles
                WHERE profesional_id = ? AND activo = TRUE
            `;
            const [diasCubiertosRow] = await executeQuery(diasCubiertosQuery, [profesionalId]);
            stats.dias_cubiertos = diasCubiertosRow.dias || 0;

            // Próximos días no laborales futuros activos
            const proxNoLaboralesQuery = `
                SELECT COUNT(*) AS futuros
                FROM excepciones_horarios
                WHERE profesional_id = ? AND activo = TRUE AND fecha >= CURDATE()
            `;
            const [proxNoLabRow] = await executeQuery(proxNoLaboralesQuery, [profesionalId]);
            stats.proximos_dias_no_laborales = proxNoLabRow.futuros || 0;

            // Horas semanales: suma de diferencias hora_fin - hora_inicio para horarios activos
            const horasSemanalesQuery = `
                SELECT 
                    COALESCE(
                        SUM(TIMESTAMPDIFF(MINUTE, 
                            STR_TO_DATE(hora_inicio, '%H:%i:%s'), 
                            STR_TO_DATE(hora_fin, '%H:%i:%s')
                        )), 0
                    ) AS minutos
                FROM horarios_disponibles
                WHERE profesional_id = ? AND activo = TRUE
            `;
            const [horasRow] = await executeQuery(horasSemanalesQuery, [profesionalId]);
            const minutos = horasRow.minutos || 0;
            stats.horas_semanales = Math.round(minutos / 60);

            // Horarios por día (para posibles gráficos futuros)
            const porDiaQuery = `
                SELECT dia_semana, COUNT(*) AS cantidad
                FROM horarios_disponibles
                WHERE profesional_id = ? AND activo = TRUE
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
            stats.horarios_por_dia = await executeQuery(porDiaQuery, [profesionalId]);

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
