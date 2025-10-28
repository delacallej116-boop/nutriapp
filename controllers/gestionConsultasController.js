const Consulta = require('../models/consulta');
const Usuario = require('../models/usuario');
const Agenda = require('../models/agenda');
const EmailService = require('../service/emailService');
const { executeQuery } = require('../config/db');

class GestionConsultasController {
    // Obtener consultas del profesional con filtros
    async getConsultasByProfesional(req, res) {
        try {
            const { profesionalId } = req.params;
            const { page = 1, limit = 10, fecha, estado, paciente } = req.query;

            // Verificar que el profesional existe y obtener su zona horaria
            const profesional = await Usuario.findById(profesionalId);
            if (!profesional) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesional no encontrado'
                });
            }

            // Obtener zona horaria del profesional (por defecto Argentina)
            const timezone = profesional.timezone || 'America/Argentina/Buenos_Aires';

            // Construir consulta con filtros - Solo consultas futuras
            // Usar NOW() en lugar de CURDATE() para considerar zona horaria
            let query = `
                SELECT 
                    c.id,
                    c.fecha,
                    c.hora,
                    c.estado,
                    c.notas_profesional,
                    c.creado_en,
                    u.apellido_nombre as paciente_nombre,
                    u.numero_documento as paciente_documento,
                    u.email as paciente_email,
                    u.telefono as paciente_telefono
                FROM consultas c
                INNER JOIN usuarios u ON c.usuario_id = u.id
                WHERE c.profesional_id = ?
                AND c.fecha >= DATE(NOW())
                AND c.estado IN ('activo', 'completado')
            `;

            const params = [profesionalId];

            // Aplicar filtros
            if (fecha) {
                query += ` AND DATE(c.fecha) = ?`;
                params.push(fecha);
            }

            if (estado) {
                query += ` AND c.estado = ?`;
                params.push(estado);
            }

            if (paciente) {
                query += ` AND (
                    u.apellido_nombre LIKE ? OR 
                    u.numero_documento LIKE ? OR 
                    u.email LIKE ?
                )`;
                const searchPattern = `%${paciente}%`;
                params.push(searchPattern, searchPattern, searchPattern);
            }

            // Ordenar por fecha y hora - Próximas primero
            query += ` ORDER BY c.fecha ASC, c.hora ASC`;

            // Obtener total de registros para paginación - Solo consultas futuras
            const countQuery = `
                SELECT COUNT(*) as total
                FROM consultas c
                INNER JOIN usuarios u ON c.usuario_id = u.id
                WHERE c.profesional_id = ?
                AND c.fecha >= DATE(NOW())
                AND c.estado IN ('activo', 'completado')
                ${fecha ? 'AND DATE(c.fecha) = ?' : ''}
                ${estado ? 'AND c.estado = ?' : ''}
                ${paciente ? 'AND (u.apellido_nombre LIKE ? OR u.numero_documento LIKE ? OR u.email LIKE ?)' : ''}
            `;

            const countParams = [profesionalId];
            if (fecha) countParams.push(fecha);
            if (estado) countParams.push(estado);
            if (paciente) {
                const searchPattern = `%${paciente}%`;
                countParams.push(searchPattern, searchPattern, searchPattern);
            }

            const [countResult] = await executeQuery(countQuery, countParams);
            const totalItems = countResult.total || 0;

            // Calcular paginación
            const offset = (page - 1) * limit;
            const totalPages = Math.ceil(totalItems / limit);

            // Agregar LIMIT y OFFSET
            query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;

            // Ejecutar consulta paginada
            const consultas = await executeQuery(query, params);

            res.json({
                success: true,
                data: consultas,
                pagination: {
                    currentPage: parseInt(page),
                    totalPages: totalPages,
                    totalItems: totalItems,
                    itemsPerPage: parseInt(limit),
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                },
                timezone: timezone
            });

        } catch (error) {
            console.error('Error obteniendo consultas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Reprogramar una consulta
    async reprogramarConsulta(req, res) {
        try {
            const { consultaId } = req.params;
            const { nueva_fecha, nueva_hora, motivo } = req.body;

            // Validar datos requeridos
            if (!nueva_fecha || !nueva_hora) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva fecha y hora son requeridas'
                });
            }

            // Verificar que la consulta existe y obtener datos completos
            const consulta = await Consulta.findById(consultaId);
            if (!consulta) {
                return res.status(404).json({
                    success: false,
                    message: 'Consulta no encontrada'
                });
            }

            // Verificar que la nueva fecha no sea en el pasado
            const nuevaFechaCompleta = new Date(`${nueva_fecha}T${nueva_hora}`);
            const ahora = new Date();
            
            if (nuevaFechaCompleta <= ahora) {
                return res.status(400).json({
                    success: false,
                    message: 'La nueva fecha y hora deben ser en el futuro'
                });
            }

            // Verificar disponibilidad del profesional en la nueva fecha/hora
            const profesionalId = consulta.profesional_id;
            const agenda = new Agenda();
            const disponible = await agenda.verificarDisponibilidad(profesionalId, nueva_fecha, nueva_hora);
            
            if (!disponible) {
                return res.status(400).json({
                    success: false,
                    message: 'El profesional no está disponible en esa fecha y hora'
                });
            }

            // Obtener datos del paciente y profesional para el email
            const paciente = await Usuario.findById(consulta.usuario_id);
            const profesional = await Usuario.findById(profesionalId);

            if (!paciente || !profesional) {
                return res.status(404).json({
                    success: false,
                    message: 'No se pudieron obtener los datos del paciente o profesional'
                });
            }

            // Guardar datos originales para el email
            const fechaOriginal = consulta.fecha;
            const horaOriginal = consulta.hora;

            // Actualizar la consulta
            const datosActualizacion = {
                fecha: nueva_fecha,
                hora: nueva_hora,
                notas_profesional: motivo || 'Consulta reprogramada'
            };

            await Consulta.update(consultaId, datosActualizacion);

            // Enviar email de notificación al paciente
            try {
                const emailService = new EmailService();
                await emailService.sendReprogramacionNotificacion({
                    pacienteNombre: paciente.apellido_nombre,
                    pacienteEmail: paciente.email,
                    profesionalNombre: profesional.nombre,
                    fechaOriginal: fechaOriginal,
                    horaOriginal: horaOriginal,
                    nuevaFecha: nueva_fecha,
                    nuevaHora: nueva_hora,
                    motivo: motivo || 'Sin motivo especificado'
                });
            } catch (emailError) {
                console.warn('Error enviando email de reprogramación:', emailError);
                // No fallar la operación si el email falla
            }

            res.json({
                success: true,
                message: 'Consulta reprogramada exitosamente',
                data: {
                    consultaId: consultaId,
                    nuevaFecha: nueva_fecha,
                    nuevaHora: nueva_hora,
                    motivo: motivo
                }
            });

        } catch (error) {
            console.error('Error reprogramando consulta:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Cancelar una consulta
    async cancelarConsulta(req, res) {
        try {
            const { consultaId } = req.params;
            const { motivo } = req.body;

            // Verificar que la consulta existe
            const consulta = await Consulta.findById(consultaId);
            if (!consulta) {
                return res.status(404).json({
                    success: false,
                    message: 'Consulta no encontrada'
                });
            }

            // Verificar que la consulta no esté ya cancelada o completada
            if (consulta.estado === 'cancelado') {
                return res.status(400).json({
                    success: false,
                    message: 'La consulta ya está cancelada'
                });
            }

            if (consulta.estado === 'completado') {
                return res.status(400).json({
                    success: false,
                    message: 'No se puede cancelar una consulta ya completada'
                });
            }

            // Obtener datos del paciente y profesional para el email
            const paciente = await Usuario.findById(consulta.usuario_id);
            const profesional = await Usuario.findById(consulta.profesional_id);

            if (!paciente || !profesional) {
                return res.status(404).json({
                    success: false,
                    message: 'No se pudieron obtener los datos del paciente o profesional'
                });
            }

            // Cancelar la consulta
            await Consulta.update(consultaId, {
                estado: 'cancelado',
                notas_profesional: motivo || 'Consulta cancelada'
            });

            // Enviar email de notificación al paciente
            try {
                const emailService = new EmailService();
                await emailService.sendCancelacionNotificacion({
                    pacienteNombre: paciente.apellido_nombre,
                    pacienteEmail: paciente.email,
                    profesionalNombre: profesional.nombre,
                    fecha: consulta.fecha,
                    hora: consulta.hora,
                    motivo: motivo || 'Sin motivo especificado'
                });
            } catch (emailError) {
                console.warn('Error enviando email de cancelación:', emailError);
                // No fallar la operación si el email falla
            }

            res.json({
                success: true,
                message: 'Consulta cancelada exitosamente y notificación enviada por email'
            });

        } catch (error) {
            console.error('Error cancelando consulta:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Obtener estadísticas de consultas del profesional
    async getEstadisticasConsultas(req, res) {
        try {
            const { profesionalId } = req.params;

            const estadisticas = await Consulta.getStatsByProfesional(profesionalId);

            res.json({
                success: true,
                data: estadisticas
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

    // Obtener horarios disponibles del profesional para una fecha específica
    async getHorariosDisponibles(req, res) {
        try {
            const { profesionalId } = req.params;
            const { fecha } = req.query;

            if (!fecha) {
                return res.status(400).json({
                    success: false,
                    message: 'La fecha es requerida'
                });
            }

            // Obtener la zona horaria del profesional
            const profesional = await executeQuery(`
                SELECT timezone FROM profesionales WHERE id = ?
            `, [profesionalId]);

            if (profesional.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Profesional no encontrado'
                });
            }

            const timezone = profesional[0].timezone || 'America/Argentina/Buenos_Aires';

            // Convertir la fecha a la zona horaria del profesional para obtener el día correcto
            const fechaEnTimezone = new Date(fecha + 'T12:00:00'); // Usar mediodía para evitar problemas de zona horaria
            const diaSemanaNumero = fechaEnTimezone.getDay() + 1; // MySQL DAYOFWEEK: 1=Domingo, 2=Lunes, etc.
            const nombreDia = getNombreDia(diaSemanaNumero);

            console.log(`📅 Fecha: ${fecha}, Día de la semana: ${diaSemanaNumero} (${nombreDia})`);

            // VERIFICAR SI ES DÍA NO LABORAL
            const diaNoLaboralResult = await executeQuery(`
                SELECT COUNT(*) as count 
                FROM excepciones_horarios 
                WHERE profesional_id = ? AND fecha = ? AND activo = TRUE
            `, [profesionalId, fecha]);
            
            const esDiaNoLaboral = diaNoLaboralResult[0].count > 0;
            
            if (esDiaNoLaboral) {
                console.log(`❌ ${fecha} es un día no laboral, no se generan turnos disponibles`);
                return res.json({
                    success: true,
                    data: {
                        horariosDisponibles: [],
                        horasOcupadas: [],
                        fecha: fecha,
                        diaSemana: diaSemanaNumero,
                        nombreDia: nombreDia,
                        timezone: timezone,
                        esDiaNoLaboral: true
                    }
                });
            }

            // Obtener horarios configurados del profesional para ese día de la semana
            // Los horarios están almacenados con nombres de días, no números
            const horariosConfigurados = await executeQuery(`
                SELECT DISTINCT h.hora_inicio, h.hora_fin, h.duracion_minutos
                FROM horarios_disponibles h
                WHERE h.profesional_id = ? 
                AND h.dia_semana = ?
                AND h.activo = 1
                ORDER BY h.hora_inicio
            `, [profesionalId, nombreDia]);

            console.log(`📅 Horarios configurados para ${nombreDia}:`, horariosConfigurados);

            // Obtener consultas ya agendadas para esa fecha
            const consultasAgendadas = await executeQuery(`
                SELECT hora
                FROM consultas
                WHERE profesional_id = ? 
                AND DATE(fecha) = ?
                AND estado IN ('activo', 'completado')
                ORDER BY hora
            `, [profesionalId, fecha]);

            console.log(`📋 Consultas agendadas para ${fecha}:`, consultasAgendadas);

            const horasOcupadas = consultasAgendadas.map(c => c.hora);

            // Generar slots de tiempo disponibles
            const slotsDisponibles = [];
            
            horariosConfigurados.forEach(horario => {
                const horaInicio = horario.hora_inicio;
                const horaFin = horario.hora_fin;
                const duracion = horario.duracion_minutos || 60;
                
                // Generar slots cada X minutos
                const slots = generarSlots(horaInicio, horaFin, duracion);
                
                slots.forEach(slot => {
                    if (!horasOcupadas.includes(slot.hora)) {
                        slotsDisponibles.push({
                            hora: slot.hora,
                            duracion_minutos: duracion,
                            disponible: true
                        });
                    }
                });
            });

            res.json({
                success: true,
                data: {
                    horariosDisponibles: slotsDisponibles,
                    horasOcupadas: horasOcupadas,
                    fecha: fecha,
                    diaSemana: diaSemanaNumero,
                    nombreDia: nombreDia,
                    timezone: timezone
                }
            });

        } catch (error) {
            console.error('Error obteniendo horarios disponibles:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: error.message
            });
        }
    }

}

// Función auxiliar para obtener nombre del día de la semana
function getNombreDia(diaSemana) {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[diaSemana - 1] || 'Desconocido';
}

// Funciones auxiliares para generar slots de tiempo
function generarSlots(horaInicio, horaFin, duracionMinutos) {
    const slots = [];
    const inicio = parseTime(horaInicio);
    const fin = parseTime(horaFin);
    
    let horaActual = inicio;
    
    while (horaActual < fin) {
        slots.push({
            hora: formatTime(horaActual),
            duracion_minutos: duracionMinutos,
            disponible: true
        });
        
        horaActual += duracionMinutos;
    }
    
    return slots;
}

// Convertir string de tiempo a minutos desde medianoche
function parseTime(timeString) {
    const [hours, minutes] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
}

// Convertir minutos desde medianoche a string de tiempo
function formatTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:00`;
}

module.exports = new GestionConsultasController();
