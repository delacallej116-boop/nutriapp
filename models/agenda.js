const { executeQuery } = require('../config/db');

class Agenda {
    constructor() {
        this.tableName = 'consultas';
    }

    // Obtener todas las consultas de un profesional para una fecha específica
    async getConsultasByDate(profesionalId, fecha) {
        try {
            const query = `
                SELECT 
                    c.*,
                    COALESCE(u.apellido_nombre, c.paciente_externo_nombre) as paciente_nombre,
                    COALESCE(u.numero_documento, 'Externo') as numero_documento,
                    COALESCE(u.telefono, c.paciente_externo_telefono) as telefono,
                    COALESCE(u.email, c.paciente_externo_email) as email,
                    CASE WHEN c.usuario_id IS NOT NULL THEN 'registrado' ELSE 'externo' END as tipo_paciente
                FROM ${this.tableName} c
                LEFT JOIN usuarios u ON c.usuario_id = u.id
                WHERE c.profesional_id = ? 
                AND c.fecha = ?
                ORDER BY c.fecha ASC, c.hora ASC
            `;
            
            const result = await executeQuery(query, [profesionalId, fecha]);
            return result;
        } catch (error) {
            console.error('Error al obtener consultas por fecha:', error);
            throw error;
        }
    }

    // Obtener todas las consultas de un profesional en un rango de fechas
    async getConsultasByDateRange(profesionalId, fechaInicio, fechaFin) {
        try {
            const query = `
                SELECT 
                    c.*,
                    COALESCE(u.apellido_nombre, c.paciente_externo_nombre) as paciente_nombre,
                    COALESCE(u.numero_documento, 'Externo') as numero_documento,
                    COALESCE(u.telefono, c.paciente_externo_telefono) as telefono,
                    COALESCE(u.email, c.paciente_externo_email) as email,
                    CASE WHEN c.usuario_id IS NOT NULL THEN 'registrado' ELSE 'externo' END as tipo_paciente
                FROM ${this.tableName} c
                LEFT JOIN usuarios u ON c.usuario_id = u.id
                WHERE c.profesional_id = ? 
                AND c.fecha BETWEEN ? AND ?
                ORDER BY c.fecha ASC, c.hora ASC
            `;
            
            const result = await executeQuery(query, [profesionalId, fechaInicio, fechaFin]);
            return result;
        } catch (error) {
            console.error('Error al obtener consultas por rango de fechas:', error);
            throw error;
        }
    }

    // Obtener consultas de un paciente específico
    async getConsultasByPaciente(profesionalId, pacienteId) {
        try {
            const query = `
                SELECT 
                    c.*,
                    COALESCE(u.apellido_nombre, c.paciente_externo_nombre) as paciente_nombre,
                    COALESCE(u.numero_documento, 'Externo') as numero_documento,
                    COALESCE(u.telefono, c.paciente_externo_telefono) as telefono,
                    COALESCE(u.email, c.paciente_externo_email) as email,
                    CASE WHEN c.usuario_id IS NOT NULL THEN 'registrado' ELSE 'externo' END as tipo_paciente
                FROM ${this.tableName} c
                LEFT JOIN usuarios u ON c.usuario_id = u.id
                WHERE c.profesional_id = ? 
                AND c.usuario_id = ?
                ORDER BY c.fecha DESC, c.hora DESC
            `;
            
            const result = await executeQuery(query, [profesionalId, pacienteId]);
            return result;
        } catch (error) {
            console.error('Error al obtener consultas por paciente:', error);
            throw error;
        }
    }

    // Crear nueva consulta
    async createConsulta(consultaData) {
        try {
            const {
                profesional_id,
                usuario_id,
                paciente_externo_nombre,
                paciente_externo_telefono,
                paciente_externo_email,
                fecha,
                hora,
                objetivo,
                condiciones_medicas,
                motivo_consulta
            } = consultaData;

            // Generar código de cancelación único
            const codigoCancelacion = 'CANCEL_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

            const query = `
                INSERT INTO ${this.tableName} 
                (profesional_id, usuario_id, paciente_externo_nombre, paciente_externo_telefono, paciente_externo_email, 
                 fecha, hora, codigo_cancelacion, estado, objetivo, condiciones_medicas, notas_profesional, creado_en)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'activo', ?, ?, ?, NOW())
            `;

            const result = await executeQuery(query, [
                profesional_id,
                usuario_id || null,
                paciente_externo_nombre || null,
                paciente_externo_telefono || null,
                paciente_externo_email || null,
                fecha,
                hora,
                codigoCancelacion,
                objetivo,
                condiciones_medicas || '',
                motivo_consulta || ''
            ]);

            return { id: result.insertId, codigo_cancelacion: codigoCancelacion };
        } catch (error) {
            console.error('Error al crear consulta:', error);
            throw error;
        }
    }

    // Actualizar consulta
    async updateConsulta(consultaId, consultaData) {
        try {
            const {
                fecha,
                hora,
                objetivo,
                condiciones_medicas,
                motivo_consulta,
                estado
            } = consultaData;

            const query = `
                UPDATE ${this.tableName} 
                SET fecha = ?, hora = ?, objetivo = ?, condiciones_medicas = ?, 
                    motivo_consulta = ?, estado = ?, actualizado_en = NOW()
                WHERE id = ?
            `;

            const result = await executeQuery(query, [
                fecha,
                hora,
                objetivo,
                condiciones_medicas,
                motivo_consulta,
                estado,
                consultaId
            ]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al actualizar consulta:', error);
            throw error;
        }
    }

    // Eliminar consulta
    async deleteConsulta(consultaId) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
            const result = await executeQuery(query, [consultaId]);
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error al eliminar consulta:', error);
            throw error;
        }
    }

    // Obtener estadísticas de agenda
    async getAgendaStats(profesionalId, fechaInicio, fechaFin) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_consultas,
                    SUM(CASE WHEN estado = 'activo' THEN 1 ELSE 0 END) as activas,
                    SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as completadas,
                    SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) as canceladas,
                    SUM(CASE WHEN estado = 'ausente' THEN 1 ELSE 0 END) as ausentes
                FROM ${this.tableName}
                WHERE profesional_id = ? 
                AND fecha BETWEEN ? AND ?
            `;
            
            const result = await executeQuery(query, [profesionalId, fechaInicio, fechaFin]);
            return result[0];
        } catch (error) {
            console.error('Error al obtener estadísticas de agenda:', error);
            throw error;
        }
    }

    // Obtener horarios disponibles para una fecha específica
    async getHorariosDisponibles(profesionalId, fecha) {
        try {
            // VERIFICAR SI ES DÍA NO LABORAL
            const diaNoLaboralQuery = `
                SELECT COUNT(*) as count 
                FROM excepciones_horarios 
                WHERE profesional_id = ? AND fecha = ? AND activo = TRUE
            `;
            const diaNoLaboralResult = await executeQuery(diaNoLaboralQuery, [profesionalId, fecha]);
            const esDiaNoLaboral = diaNoLaboralResult[0].count > 0;
            
            if (esDiaNoLaboral) {
                console.log(`❌ ${fecha} es un día no laboral, no se generan turnos disponibles`);
                return [];
            }
            
            // Obtener la zona horaria del profesional
            const profesionalQuery = `
                SELECT timezone 
                FROM profesionales 
                WHERE id = ?
            `;
            const profesional = await executeQuery(profesionalQuery, [profesionalId]);
            const timezone = profesional[0]?.timezone || 'UTC';
            
            // Obtener el día de la semana de la fecha
            const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            
            // La fecha viene en formato YYYY-MM-DD, crear objeto Date
            const fechaEnTimezone = new Date(fecha + 'T12:00:00'); // Mediodía para evitar problemas de zona horaria
            const diaSemana = diasSemana[fechaEnTimezone.getDay()];
            
            console.log(`Fecha: ${fecha}, Día de la semana: ${diaSemana}`);

            // Obtener horarios configurados para ese día
            const horariosQuery = `
                SELECT 
                    hora_inicio,
                    hora_fin,
                    duracion_minutos
                FROM horarios_disponibles
                WHERE profesional_id = ? 
                AND dia_semana = ? 
                AND activo = 1
                ORDER BY hora_inicio
            `;
            
            const horarios = await executeQuery(horariosQuery, [profesionalId, diaSemana]);
            
            console.log(`Horarios configurados para ${diaSemana}:`, horarios);
            console.log(`Total horarios configurados: ${horarios.length}`);

            // Obtener consultas ya agendadas para esa fecha (en UTC)
            const consultasQuery = `
                SELECT hora
                FROM ${this.tableName}
                WHERE profesional_id = ? 
                AND fecha = ? 
                AND estado IN ('activo', 'completado')
                ORDER BY hora
            `;
            
            const consultas = await executeQuery(consultasQuery, [profesionalId, fecha]);
            
            console.log(`Horarios configurados para ${diaSemana}:`, horarios);
            console.log(`Consultas agendadas para ${fecha}:`, consultas);

            // Generar slots disponibles
            const slotsDisponibles = [];
            
            for (const horario of horarios) {
                const horaInicio = new Date(`2000-01-01T${horario.hora_inicio}`);
                const horaFin = new Date(`2000-01-01T${horario.hora_fin}`);
                const duracion = horario.duracion_minutos;
                
                let horaActual = new Date(horaInicio);
                
                while (horaActual < horaFin) {
                    const horaStr = horaActual.toTimeString().substring(0, 5);
                    
                    // Verificar si este slot está disponible
                    const estaOcupado = consultas.some(consulta => {
                        // Comparar horas en formato HH:MM
                        const horaConsulta = consulta.hora.substring(0, 5); // "08:00:00" -> "08:00"
                        return horaConsulta === horaStr;
                    });
                    
                    console.log(`Slot ${horaStr}: ${estaOcupado ? 'OCUPADO' : 'DISPONIBLE'}`);
                    
                    // Solo agregar slots que NO estén ocupados
                    if (!estaOcupado) {
                        slotsDisponibles.push({
                            hora: horaStr,
                            duracion_minutos: duracion,
                            disponible: true
                        });
                    }
                    
                    // Avanzar al siguiente slot
                    horaActual = new Date(horaActual.getTime() + duracion * 60000);
                }
            }
            
            console.log(`Slots disponibles para ${fecha}:`, slotsDisponibles);
            return slotsDisponibles;
        } catch (error) {
            console.error('Error al obtener horarios disponibles:', error);
            throw error;
        }
    }

    // Verificar disponibilidad de horario
    async verificarDisponibilidad(profesionalId, fecha, hora) {
        try {
            const query = `
                SELECT COUNT(*) as count
                FROM ${this.tableName}
                WHERE profesional_id = ? 
                AND fecha = ?
                AND hora = ?
                AND estado IN ('activo', 'completado')
            `;
            
            const result = await executeQuery(query, [profesionalId, fecha, hora]);
            return result[0].count === 0;
        } catch (error) {
            console.error('Error al verificar disponibilidad:', error);
            throw error;
        }
    }
}

module.exports = Agenda;

