const { executeQuery } = require('../config/db');
const crypto = require('crypto');

class Consulta {
    constructor(data) {
        this.id = data.id;
        this.usuario_id = data.usuario_id;
        this.profesional_id = data.profesional_id;
        this.fecha = data.fecha;
        this.hora = data.hora;
        this.codigo_cancelacion = data.codigo_cancelacion;
        this.estado = data.estado || 'activo';
        this.peso = data.peso;
        this.altura = data.altura;
        this.objetivo = data.objetivo;
        this.condiciones_medicas = data.condiciones_medicas;
        this.notas_profesional = data.notas_profesional;
        this.motivo_consulta = data.motivo_consulta;
        this.evaluacion = data.evaluacion;
        this.plan_tratamiento = data.plan_tratamiento;
        this.observaciones = data.observaciones;
        this.fecha_consulta = data.fecha_consulta;
        this.creado_en = data.creado_en;
        this.actualizado_en = data.actualizado_en;
        
        // Campos para pacientes externos
        this.paciente_externo_nombre = data.paciente_externo_nombre;
        this.paciente_externo_telefono = data.paciente_externo_telefono;
        this.paciente_externo_email = data.paciente_externo_email;
        
        // Campos adicionales para mostrar en la interfaz
        this.paciente_nombre = data.paciente_nombre;
        this.paciente_email = data.paciente_email;
        this.paciente_telefono = data.paciente_telefono;
    }

    // Generar código de cancelación único
    static generateCancelCode() {
        // Generar código más corto e intuitivo: CAN-XXXX-YYYY
        // XXXX: 4 caracteres alfanuméricos
        // YYYY: 4 caracteres alfanuméricos
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'CAN-';
        
        // Generar primera parte (4 caracteres)
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        code += '-';
        
        // Generar segunda parte (4 caracteres)
        for (let i = 0; i < 4; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        
        return code;
    }

    // Alias para mantener compatibilidad
    static generateCancellationCode() {
        return Consulta.generateCancelCode();
    }

    // Crear una nueva consulta
    static async create(consultaData) {
        try {
            const codigoCancelacion = Consulta.generateCancelCode();
            
            const query = `
                INSERT INTO consultas (
                    usuario_id, profesional_id, fecha, hora, codigo_cancelacion,
                    estado, peso, altura, objetivo, condiciones_medicas, notas_profesional
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                consultaData.usuario_id,
                consultaData.profesional_id,
                consultaData.fecha,
                consultaData.hora,
                codigoCancelacion,
                consultaData.estado || 'activo',
                consultaData.peso,
                consultaData.altura,
                consultaData.objetivo,
                consultaData.condiciones_medicas,
                consultaData.notas_profesional
            ];
            
            const result = await executeQuery(query, params);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Obtener consulta por ID
    static async findById(id) {
        try {
            const query = `
                SELECT c.*, u.apellido_nombre as paciente_nombre, p.nombre as profesional_nombre
                FROM consultas c
                JOIN usuarios u ON c.usuario_id = u.id
                JOIN profesionales p ON c.profesional_id = p.id
                WHERE c.id = ?
            `;
            const results = await executeQuery(query, [id]);
            return results.length > 0 ? new Consulta(results[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Obtener consultas por profesional con filtros avanzados
    static async findByProfesional(filtros) {
        try {
            let query = `
                SELECT c.*, 
                       COALESCE(u.apellido_nombre, c.paciente_externo_nombre) as paciente_nombre,
                       COALESCE(u.email, c.paciente_externo_email) as paciente_email,
                       COALESCE(u.telefono, c.paciente_externo_telefono) as paciente_telefono,
                       CASE 
                           WHEN c.usuario_id IS NOT NULL THEN 'registrado'
                           ELSE 'externo'
                       END as tipo_paciente
                FROM consultas c
                LEFT JOIN usuarios u ON c.usuario_id = u.id
                WHERE c.profesional_id = ?
            `;
            const params = [filtros.profesional_id];
            
            // Filtro por estado
            if (filtros.estado) {
                query += ' AND c.estado = ?';
                params.push(filtros.estado);
            }
            
            // Filtro por fecha específica
            if (filtros.fecha) {
                query += ' AND c.fecha = ?';
                params.push(filtros.fecha);
            }
            
            // Filtro por período
            if (filtros.periodo === 'semana') {
                query += ' AND c.fecha BETWEEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND DATE_ADD(CURDATE(), INTERVAL (6 - WEEKDAY(CURDATE())) DAY)';
            } else if (filtros.periodo === 'mes') {
                query += ' AND YEAR(c.fecha) = YEAR(CURDATE()) AND MONTH(c.fecha) = MONTH(CURDATE())';
            }
            
            // Filtro por paciente (búsqueda por nombre - funciona para ambos tipos)
            if (filtros.paciente) {
                query += ' AND (u.apellido_nombre LIKE ? OR c.paciente_externo_nombre LIKE ?)';
                params.push(`%${filtros.paciente}%`);
                params.push(`%${filtros.paciente}%`);
            }
            
            query += ' ORDER BY c.fecha DESC, c.hora DESC';
            
            const results = await executeQuery(query, params);
            return results.map(row => new Consulta(row));
        } catch (error) {
            throw error;
        }
    }

    // Obtener consultas por profesional (método original para compatibilidad)
    static async findByProfesionalSimple(profesionalId, fecha = null) {
        try {
            let query = `
                SELECT c.*, u.apellido_nombre as paciente_nombre, u.telefono as paciente_telefono
                FROM consultas c
                JOIN usuarios u ON c.usuario_id = u.id
                WHERE c.profesional_id = ?
            `;
            const params = [profesionalId];
            
            if (fecha) {
                query += ' AND c.fecha = ?';
                params.push(fecha);
            }
            
            query += ' ORDER BY c.fecha, c.hora';
            
            const results = await executeQuery(query, params);
            return results.map(row => new Consulta(row));
        } catch (error) {
            throw error;
        }
    }

    // Obtener consultas por usuario
    static async findByUsuario(usuarioId) {
        try {
            const query = `
                SELECT c.*, p.nombre as profesional_nombre
                FROM consultas c
                JOIN profesionales p ON c.profesional_id = p.id
                WHERE c.usuario_id = ?
                ORDER BY c.fecha DESC, c.hora DESC
            `;
            const results = await executeQuery(query, [usuarioId]);
            return results.map(row => new Consulta(row));
        } catch (error) {
            throw error;
        }
    }

    // Obtener consultas del día
    static async getTodayConsultas(profesionalId = null) {
        try {
            let query = `
                SELECT c.*, u.apellido_nombre as paciente_nombre, p.nombre as profesional_nombre
                FROM consultas c
                JOIN usuarios u ON c.usuario_id = u.id
                JOIN profesionales p ON c.profesional_id = p.id
                WHERE c.fecha = CURDATE()
            `;
            const params = [];
            
            if (profesionalId) {
                query += ' AND c.profesional_id = ?';
                params.push(profesionalId);
            }
            
            query += ' ORDER BY c.hora';
            
            const results = await executeQuery(query, params);
            return results.map(row => new Consulta(row));
        } catch (error) {
            throw error;
        }
    }

    // Obtener próxima consulta
    static async getNextConsulta(profesionalId = null) {
        try {
            let query = `
                SELECT c.*, u.apellido_nombre as paciente_nombre, p.nombre as profesional_nombre
                FROM consultas c
                JOIN usuarios u ON c.usuario_id = u.id
                JOIN profesionales p ON c.profesional_id = p.id
                WHERE c.fecha >= CURDATE() AND c.estado = 'activo'
            `;
            const params = [];
            
            if (profesionalId) {
                query += ' AND c.profesional_id = ?';
                params.push(profesionalId);
            }
            
            query += ' ORDER BY c.fecha, c.hora LIMIT 1';
            
            const results = await executeQuery(query, params);
            return results.length > 0 ? new Consulta(results[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Verificar disponibilidad de horario
    static async checkAvailability(profesionalId, fecha, hora) {
        try {
            const query = `
                SELECT COUNT(*) as count
                FROM consultas
                WHERE profesional_id = ? AND fecha = ? AND hora = ? AND estado = 'activo'
            `;
            const results = await executeQuery(query, [profesionalId, fecha, hora]);
            return results[0].count === 0;
        } catch (error) {
            throw error;
        }
    }

    // Actualizar consulta (método de instancia)
    async update(updateData) {
        try {
            const fields = [];
            const values = [];
            
            const allowedFields = [
                'fecha', 'hora', 'estado', 'peso', 'altura', 'objetivo',
                'condiciones_medicas', 'notas_profesional'
            ];
            
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    fields.push(`${field} = ?`);
                    values.push(updateData[field]);
                }
            }
            
            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }
            
            values.push(this.id);
            
            const query = `UPDATE consultas SET ${fields.join(', ')}, actualizado_en = NOW() WHERE id = ?`;
            await executeQuery(query, values);
            
            // Actualizar el objeto actual
            Object.assign(this, updateData);
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Método estático para actualizar consulta por ID
    static async update(id, updateData) {
        try {
            const fields = [];
            const values = [];
            
            const allowedFields = [
                'fecha', 'hora', 'estado', 'peso', 'altura', 'objetivo',
                'condiciones_medicas', 'notas_profesional', 'motivo_consulta',
                'evaluacion', 'plan_tratamiento', 'observaciones'
            ];
            
            for (const field of allowedFields) {
                if (updateData[field] !== undefined) {
                    fields.push(`${field} = ?`);
                    values.push(updateData[field]);
                }
            }
            
            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }
            
            values.push(id);
            
            const query = `UPDATE consultas SET ${fields.join(', ')}, actualizado_en = NOW() WHERE id = ?`;
            const result = await executeQuery(query, values);
            
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Cancelar consulta
    async cancelar(motivo = null) {
        try {
            const query = 'UPDATE consultas SET estado = ?, notas_profesional = ?, actualizado_en = NOW() WHERE id = ?';
            await executeQuery(query, ['cancelado', motivo, this.id]);
            this.estado = 'cancelado';
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Marcar como completada
    async completar(notas = null) {
        try {
            const query = 'UPDATE consultas SET estado = ?, notas_profesional = ?, actualizado_en = NOW() WHERE id = ?';
            await executeQuery(query, ['completado', notas, this.id]);
            this.estado = 'completado';
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Marcar como ausente
    async marcarAusente() {
        try {
            const query = 'UPDATE consultas SET estado = ?, actualizado_en = NOW() WHERE id = ?';
            await executeQuery(query, ['ausente', this.id]);
            this.estado = 'ausente';
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Eliminar consulta
    async delete() {
        try {
            const query = 'DELETE FROM consultas WHERE id = ?';
            await executeQuery(query, [this.id]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Cancelar por código
    static async cancelarPorCodigo(codigoCancelacion) {
        try {
            const query = 'UPDATE consultas SET estado = ?, actualizado_en = NOW() WHERE codigo_cancelacion = ? AND estado = "activo"';
            const result = await executeQuery(query, ['cancelado', codigoCancelacion]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Obtener estadísticas de consultas por profesional
    static async getStatsByProfesional(profesionalId) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_consultas,
                    COUNT(CASE WHEN estado = 'activo' THEN 1 END) as consultas_activas,
                    COUNT(CASE WHEN estado = 'completado' THEN 1 END) as consultas_completadas,
                    COUNT(CASE WHEN estado = 'cancelado' THEN 1 END) as consultas_canceladas,
                    COUNT(CASE WHEN estado = 'ausente' THEN 1 END) as consultas_ausentes,
                    COUNT(CASE WHEN fecha = CURDATE() THEN 1 END) as turnos_hoy,
                    COUNT(CASE WHEN fecha BETWEEN DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY) AND DATE_ADD(CURDATE(), INTERVAL (6 - WEEKDAY(CURDATE())) DAY) THEN 1 END) as turnos_semana,
                    COUNT(CASE WHEN YEAR(fecha) = YEAR(CURDATE()) AND MONTH(fecha) = MONTH(CURDATE()) THEN 1 END) as turnos_mes
                FROM consultas 
                WHERE profesional_id = ?
            `;
            
            const results = await executeQuery(query, [profesionalId]);
            return results[0];
        } catch (error) {
            throw error;
        }
    }

    // Calcular IMC
    calcularIMC() {
        if (!this.peso || !this.altura) return null;
        const alturaEnMetros = this.altura / 100;
        return (this.peso / (alturaEnMetros * alturaEnMetros)).toFixed(2);
    }

    // Verificar si es hoy
    esHoy() {
        const hoy = new Date().toISOString().split('T')[0];
        return this.fecha === hoy;
    }

    // Verificar si es próxima (dentro de 7 días)
    esProxima() {
        const hoy = new Date();
        const fechaConsulta = new Date(this.fecha);
        const diferenciaDias = Math.ceil((fechaConsulta - hoy) / (1000 * 60 * 60 * 24));
        return diferenciaDias >= 0 && diferenciaDias <= 7;
    }

    // Obtener consultas de un paciente específico
    static async getByPaciente(pacienteId) {
        try {
            const query = `
                SELECT c.*, 
                       u.apellido_nombre as paciente_nombre,
                       p.nombre as profesional_nombre
                FROM consultas c
                LEFT JOIN usuarios u ON c.usuario_id = u.id
                JOIN profesionales p ON c.profesional_id = p.id
                WHERE c.usuario_id = ?
                ORDER BY c.fecha DESC, c.hora DESC
            `;
            
            const results = await executeQuery(query, [pacienteId]);
            return results.map(row => new Consulta(row));
        } catch (error) {
            console.error('Error ejecutando consulta:', error);
            throw error;
        }
    }
}

module.exports = Consulta;
