const { executeQuery } = require('../config/db');

class DiaNoLaboral {
    constructor(data) {
        this.id = data.id;
        this.profesional_id = data.profesional_id;
        this.fecha = data.fecha;
        this.motivo = data.motivo;
        this.activo = data.activo;
        this.creado_en = data.creado_en;
    }

    // Crear nuevo día no laboral
    static async create(diaData) {
        try {
            const query = `
                INSERT INTO excepciones_horarios (
                    profesional_id, fecha, motivo, activo
                )
                VALUES (?, ?, ?, ?)
            `;
            
            const params = [
                diaData.profesional_id,
                diaData.fecha,
                diaData.motivo,
                diaData.activo !== undefined ? diaData.activo : true
            ];
            
            const result = await executeQuery(query, params);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Obtener día no laboral por ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM excepciones_horarios WHERE id = ?';
            const results = await executeQuery(query, [id]);
            return results.length > 0 ? new DiaNoLaboral(results[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Obtener días no laborales por profesional
    static async findByProfesionalId(profesionalId) {
        try {
            const query = `
                SELECT * FROM excepciones_horarios 
                WHERE profesional_id = ? 
                ORDER BY fecha DESC
            `;
            const results = await executeQuery(query, [profesionalId]);
            return results.map(row => new DiaNoLaboral(row));
        } catch (error) {
            throw error;
        }
    }

    // Obtener día no laboral por fecha y profesional
    static async findByFecha(profesionalId, fecha) {
        try {
            const query = `
                SELECT * FROM excepciones_horarios 
                WHERE profesional_id = ? AND fecha = ?
            `;
            const results = await executeQuery(query, [profesionalId, fecha]);
            return results.length > 0 ? new DiaNoLaboral(results[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Obtener días no laborales activos por profesional
    static async findActiveByProfesionalId(profesionalId) {
        try {
            const query = `
                SELECT * FROM excepciones_horarios 
                WHERE profesional_id = ? AND activo = TRUE AND fecha >= CURDATE()
                ORDER BY fecha ASC
            `;
            const results = await executeQuery(query, [profesionalId]);
            return results.map(row => new DiaNoLaboral(row));
        } catch (error) {
            throw error;
        }
    }

    // Obtener días no laborales por rango de fechas
    static async findByDateRange(profesionalId, fechaInicio, fechaFin) {
        try {
            const query = `
                SELECT * FROM excepciones_horarios 
                WHERE profesional_id = ? 
                AND fecha BETWEEN ? AND ?
                ORDER BY fecha ASC
            `;
            const results = await executeQuery(query, [profesionalId, fechaInicio, fechaFin]);
            return results.map(row => new DiaNoLaboral(row));
        } catch (error) {
            throw error;
        }
    }

    // Actualizar día no laboral
    static async update(id, diaData) {
        try {
            const fields = [];
            const values = [];

            // Solo actualizar campos que se proporcionen
            Object.keys(diaData).forEach(key => {
                if (diaData[key] !== undefined && key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(diaData[key]);
                }
            });

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            values.push(id);
            const query = `UPDATE excepciones_horarios SET ${fields.join(', ')} WHERE id = ?`;
            
            const result = await executeQuery(query, values);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Eliminar día no laboral
    static async delete(id) {
        try {
            const query = 'DELETE FROM excepciones_horarios WHERE id = ?';
            const result = await executeQuery(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Eliminar todos los días no laborales de un profesional
    static async deleteByProfesionalId(profesionalId) {
        try {
            const query = 'DELETE FROM excepciones_horarios WHERE profesional_id = ?';
            const result = await executeQuery(query, [profesionalId]);
            return result.affectedRows;
        } catch (error) {
            throw error;
        }
    }

    // Verificar si una fecha es día no laboral
    static async isDiaNoLaboral(profesionalId, fecha) {
        try {
            const query = `
                SELECT COUNT(*) as count 
                FROM excepciones_horarios 
                WHERE profesional_id = ? AND fecha = ? AND activo = TRUE
            `;
            const results = await executeQuery(query, [profesionalId, fecha]);
            return results[0].count > 0;
        } catch (error) {
            throw error;
        }
    }

    // Obtener estadísticas de días no laborales
    static async getStats(profesionalId) {
        try {
            const stats = {};
            
            // Contar total de días no laborales
            const totalQuery = 'SELECT COUNT(*) as total FROM excepciones_horarios WHERE profesional_id = ?';
            const [totalResult] = await executeQuery(totalQuery, [profesionalId]);
            stats.total_dias = totalResult.total;
            
            // Contar días activos
            const activosQuery = 'SELECT COUNT(*) as activos FROM excepciones_horarios WHERE profesional_id = ? AND activo = TRUE';
            const [activosResult] = await executeQuery(activosQuery, [profesionalId]);
            stats.dias_activos = activosResult.activos;
            
            // Contar días futuros
            const futurosQuery = 'SELECT COUNT(*) as futuros FROM excepciones_horarios WHERE profesional_id = ? AND fecha >= CURDATE() AND activo = TRUE';
            const [futurosResult] = await executeQuery(futurosQuery, [profesionalId]);
            stats.dias_futuros = futurosResult.futuros;
            
            // Contar días del mes actual
            const mesActualQuery = `
                SELECT COUNT(*) as mes_actual 
                FROM excepciones_horarios 
                WHERE profesional_id = ? 
                AND YEAR(fecha) = YEAR(CURDATE()) 
                AND MONTH(fecha) = MONTH(CURDATE())
                AND activo = TRUE
            `;
            const [mesActualResult] = await executeQuery(mesActualQuery, [profesionalId]);
            stats.dias_mes_actual = mesActualResult.mes_actual;
            
            // Próximo día no laboral
            const proximoQuery = `
                SELECT fecha, motivo 
                FROM excepciones_horarios 
                WHERE profesional_id = ? AND fecha >= CURDATE() AND activo = TRUE
                ORDER BY fecha ASC
                LIMIT 1
            `;
            const proximoResults = await executeQuery(proximoQuery, [profesionalId]);
            stats.proximo_dia_no_laboral = proximoResults.length > 0 ? proximoResults[0] : null;
            
            return stats;
        } catch (error) {
            throw error;
        }
    }

    // Obtener días no laborales por motivo
    static async findByMotivo(profesionalId, motivo) {
        try {
            const query = `
                SELECT * FROM excepciones_horarios 
                WHERE profesional_id = ? AND motivo LIKE ?
                ORDER BY fecha DESC
            `;
            const results = await executeQuery(query, [profesionalId, `%${motivo}%`]);
            return results.map(row => new DiaNoLaboral(row));
        } catch (error) {
            throw error;
        }
    }

    // Obtener resumen por mes
    static async getMonthlySummary(profesionalId, año, mes) {
        try {
            const query = `
                SELECT 
                    fecha,
                    motivo,
                    activo,
                    CASE 
                        WHEN fecha < CURDATE() THEN 'pasado'
                        WHEN fecha = CURDATE() THEN 'hoy'
                        ELSE 'futuro'
                    END as estado_temporal
                FROM excepciones_horarios 
                WHERE profesional_id = ? 
                AND YEAR(fecha) = ? 
                AND MONTH(fecha) = ?
                ORDER BY fecha ASC
            `;
            const results = await executeQuery(query, [profesionalId, año, mes]);
            return results;
        } catch (error) {
            throw error;
        }
    }

    // Convertir a objeto público
    toPublicObject() {
        return {
            id: this.id,
            profesional_id: this.profesional_id,
            fecha: this.fecha,
            motivo: this.motivo,
            activo: this.activo,
            creado_en: this.creado_en
        };
    }

    // Verificar si es día no laboral activo
    esActivo() {
        return this.activo === true || this.activo === 1;
    }

    // Verificar si es en el futuro
    esFuturo() {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        const fechaDia = new Date(this.fecha);
        return fechaDia >= hoy;
    }

    // Verificar si es hoy
    esHoy() {
        const hoy = new Date().toISOString().split('T')[0];
        return this.fecha === hoy;
    }

    // Obtener nombre del día de la semana
    getNombreDia() {
        const fecha = new Date(this.fecha);
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return dias[fecha.getDay()];
    }

    // Formatear fecha para mostrar
    getFechaFormateada() {
        const fecha = new Date(this.fecha);
        return fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
}

module.exports = DiaNoLaboral;