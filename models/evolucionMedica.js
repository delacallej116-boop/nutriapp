const { executeQuery } = require('../config/db');
const crypto = require('crypto');

class EvolucionMedica {
    constructor(data) {
        this.id = data.id;
        this.usuario_id = data.usuario_id;
        this.profesional_id = data.profesional_id;
        this.fecha = data.fecha;
        this.hora = data.hora;
        this.codigo_cancelacion = data.codigo_cancelacion;
        this.estado = data.estado || 'activo';
        
        // Campos específicos para evoluciones médicas
        this.motivo_consulta = data.motivo_consulta;
        this.evaluacion = data.evaluacion;
        this.plan_tratamiento = data.plan_tratamiento;
        this.observaciones = data.observaciones;
        this.condiciones_medicas = data.condiciones_medicas;
        this.notas_profesional = data.notas_profesional;
        
        // Timestamps
        this.fecha_consulta = data.fecha_consulta;
        this.creado_en = data.creado_en;
        this.actualizado_en = data.actualizado_en;
        
        // Información del paciente (joins)
        this.paciente_nombre = data.paciente_nombre;
        this.paciente_email = data.paciente_email;
        this.paciente_telefono = data.paciente_telefono;
        
        // Datos antropométricos (joins)
        this.peso = data.peso;
        this.altura = data.altura;
        this.imc = data.imc;
    }

    // Crear nueva evolución médica
    static async create(evolucionData) {
        try {
            const codigoCancelacion = crypto.randomBytes(16).toString('hex');
            
            const query = `
                INSERT INTO consultas 
                (usuario_id, profesional_id, fecha, hora, codigo_cancelacion, estado, 
                 motivo_consulta, evaluacion, plan_tratamiento, observaciones, 
                 condiciones_medicas, notas_profesional, fecha_consulta)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
            `;
            
            const values = [
                evolucionData.usuario_id,
                evolucionData.profesional_id,
                evolucionData.fecha,
                evolucionData.hora || '09:00:00',
                codigoCancelacion,
                evolucionData.estado || 'completado',
                evolucionData.motivo_consulta || '',
                evolucionData.evaluacion || '',
                evolucionData.plan_tratamiento || '',
                evolucionData.observaciones || '',
                evolucionData.condiciones_medicas || '',
                evolucionData.notas_profesional || ''
            ];
            
            const result = await executeQuery(query, values);
            return result.insertId;
        } catch (error) {
            console.error('Error al crear evolución médica:', error);
            throw error;
        }
    }

    // Obtener evoluciones por usuario (para historia clínica)
    static async getByUsuario(usuarioId) {
        try {
            const query = `
                SELECT c.*, u.apellido_nombre as paciente_nombre, u.email as paciente_email, u.telefono as paciente_telefono,
                       a.peso, a.altura, a.imc
                FROM consultas c
                LEFT JOIN usuarios u ON c.usuario_id = u.id
                LEFT JOIN antropometria a ON c.usuario_id = a.usuario_id AND DATE(c.fecha) = DATE(a.fecha)
                WHERE c.usuario_id = ? AND c.estado = 'completado'
                ORDER BY c.fecha DESC, c.hora DESC
            `;
            
            const result = await executeQuery(query, [usuarioId]);
            return result.map(row => new EvolucionMedica(row));
        } catch (error) {
            console.error('Error al obtener evoluciones por usuario:', error);
            throw error;
        }
    }

    // Obtener evolución específica por ID
    static async getById(evolucionId) {
        try {
            const query = `
                SELECT c.*, u.apellido_nombre as paciente_nombre, u.email as paciente_email, u.telefono as paciente_telefono
                FROM consultas c
                LEFT JOIN usuarios u ON c.usuario_id = u.id
                WHERE c.id = ?
            `;
            
            const [result] = await executeQuery(query, [evolucionId]);
            return result ? new EvolucionMedica(result) : null;
        } catch (error) {
            console.error('Error al obtener evolución por ID:', error);
            throw error;
        }
    }

    // Actualizar evolución médica
    static async update(evolucionId, evolucionData) {
        try {
            const query = `
                UPDATE consultas 
                SET motivo_consulta = ?, evaluacion = ?, plan_tratamiento = ?, 
                    observaciones = ?, condiciones_medicas = ?, notas_profesional = ?,
                    actualizado_en = NOW()
                WHERE id = ?
            `;
            
            const values = [
                evolucionData.motivo_consulta,
                evolucionData.evaluacion,
                evolucionData.plan_tratamiento,
                evolucionData.observaciones,
                evolucionData.condiciones_medicas,
                evolucionData.notas_profesional,
                evolucionId
            ];
            
            const result = await executeQuery(query, values);
            return result;
        } catch (error) {
            console.error('Error al actualizar evolución médica:', error);
            throw error;
        }
    }

    // Eliminar evolución (soft delete cambiando estado)
    static async delete(evolucionId) {
        try {
            const query = `
                UPDATE consultas 
                SET estado = 'cancelado', actualizado_en = NOW()
                WHERE id = ?
            `;
            
            const result = await executeQuery(query, [evolucionId]);
            return result;
        } catch (error) {
            console.error('Error al eliminar evolución médica:', error);
            throw error;
        }
    }

    // Obtener estadísticas de evoluciones para un usuario
    static async getStatsByUsuario(usuarioId) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_evoluciones,
                    MIN(fecha) as primera_consulta,
                    MAX(fecha) as ultima_consulta,
                    COUNT(CASE WHEN estado = 'completado' THEN 1 END) as evoluciones_completadas
                FROM consultas 
                WHERE usuario_id = ? AND estado = 'completado'
            `;
            
            const [result] = await executeQuery(query, [usuarioId]);
            return result;
        } catch (error) {
            console.error('Error al obtener estadísticas de evoluciones:', error);
            throw error;
        }
    }

    // Determinar tipo de evolución basado en motivo y evaluacion
    getTipo() {
        if (!this.fecha_consulta) return 'Consulta Inicial';
        
        const motivo = (this.motivo_consulta || '').toLowerCase();
        const evaluacion = (this.evaluacion || '').toLowerCase();
        
        if (motivo.includes('seguimiento') || motivo.includes('control')) {
            return 'Seguimiento';
        } else if (motivo.includes('emergencia') || motivo.includes('urgente')) {
            return 'Emergencia';
        } else if (motivo.includes('control') || motivo.includes('reapertura')) {
            return 'Control';
        } else {
            return 'Consulta Médica';
        }
    }

    // Formatear fecha para timeline
    getFormattedDate() {
        const date = new Date(this.fecha);
        return {
            day: date.getDate(),
            month: date.toLocaleDateString('es-ES', { month: 'long' }),
            year: date.getFullYear(),
            full: date.toLocaleDateString('es-ES', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })
        };
    }
}

module.exports = EvolucionMedica;
