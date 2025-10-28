const { executeQuery } = require('../config/db');
const Consulta = require('../models/consulta');

class AsistenciaController {
    // Obtener consultas pendientes de confirmación de asistencia
        static async getConsultasPendientes(req, res) {
            try {
                const { profesionalId } = req.params;
                const { page = 1, limit = 10 } = req.query;
                
                // Calcular offset para paginación
                const offset = (page - 1) * limit;
            
            console.log('📋 Obteniendo consultas pendientes para profesional:', profesionalId);
            
            if (!profesionalId || isNaN(profesionalId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de profesional inválido'
                });
            }

            // Obtener consultas que necesitan confirmación de asistencia (versión corregida)
            const query = `
                SELECT 
                    c.id,
                    c.fecha,
                    c.hora,
                    c.estado,
                    c.codigo_cancelacion,
                    c.motivo_consulta,
                    c.observaciones,
                    c.notas_profesional,
                    c.creado_en,
                    c.actualizado_en,
                    COALESCE(c.paciente_externo_nombre, 'Paciente') as paciente_nombre,
                    COALESCE(c.paciente_externo_email, '') as paciente_email,
                    COALESCE(c.paciente_externo_telefono, '') as paciente_telefono,
                    'externo' as tipo_paciente,
                    'Dr. Alexis Allendez' as profesional_nombre
                FROM consultas c
                WHERE c.profesional_id = ?
                AND c.fecha <= CURDATE()
                AND c.estado IN ('activo', 'ausente', 'completado')
                ORDER BY 
                    CASE c.estado 
                        WHEN 'activo' THEN 1      -- Pendientes primero (más urgente)
                        WHEN 'ausente' THEN 2     -- No asistió segundo (requiere atención)
                        WHEN 'completado' THEN 3  -- Asistió último (ya resuelto)
                        ELSE 4 
                    END,
                    c.fecha DESC, 
                    c.hora DESC
                LIMIT ? OFFSET ?
            `;

            console.log('🔍 Ejecutando consulta SQL...');
            console.log('📅 Fecha actual (CURDATE):', new Date().toISOString().split('T')[0]);
            console.log('👤 Profesional ID:', profesionalId);
            
            const consultas = await executeQuery(query, [profesionalId, parseInt(limit), parseInt(offset)]);
            console.log('✅ Consulta ejecutada exitosamente, resultados:', consultas.length);
            
            // Obtener total de consultas para paginación
            const countQuery = `
                SELECT COUNT(*) as total
                FROM consultas c
                WHERE c.profesional_id = ?
                AND c.fecha <= CURDATE()
                AND c.estado IN ('activo', 'ausente', 'completado')
            `;
            const countResult = await executeQuery(countQuery, [profesionalId]);
            const totalConsultas = countResult[0].total;
            
            // Debug: mostrar estados de las consultas
            const estadosCount = {};
            consultas.forEach(c => {
                estadosCount[c.estado] = (estadosCount[c.estado] || 0) + 1;
            });
            console.log('📊 Estados encontrados:', estadosCount);
            console.log('📄 Paginación:', { page, limit, offset, totalConsultas });
            
            // Agrupar por fecha para mejor organización
            console.log('📊 Agrupando consultas por fecha...');
            const consultasAgrupadas = AsistenciaController.agruparConsultasPorFecha(consultas);
            console.log('✅ Consultas agrupadas:', consultasAgrupadas.length, 'grupos');

            res.json({
                success: true,
                data: {
                    consultas: consultasAgrupadas,
                    total: totalConsultas,
                    pendientes: consultas.filter(c => c.estado === 'activo').length,
                    ausentes: consultas.filter(c => c.estado === 'ausente').length,
                    completadas: consultas.filter(c => c.estado === 'completado').length,
                    pagination: {
                        currentPage: parseInt(page),
                        totalPages: Math.ceil(totalConsultas / limit),
                        limit: parseInt(limit),
                        totalItems: totalConsultas,
                        hasNextPage: page < Math.ceil(totalConsultas / limit),
                        hasPrevPage: page > 1
                    }
                }
            });

        } catch (error) {
            console.error('❌ Error obteniendo consultas pendientes:', error);
            console.error('❌ Stack trace:', error.stack);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Confirmar asistencia de una consulta
    static async confirmarAsistencia(req, res) {
        try {
            const { consultaId } = req.params;
            const { estado, notas_profesional } = req.body;

            if (!consultaId || isNaN(consultaId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de consulta inválido'
                });
            }

            const validStates = ['completado', 'ausente'];
            if (!estado || !validStates.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado de consulta no válido. Debe ser "completado" o "ausente".'
                });
            }

            // Actualizar la consulta directamente
            const query = `
                UPDATE consultas
                SET estado = ?, notas_profesional = ?, actualizado_en = NOW()
                WHERE id = ?
            `;
            const result = await executeQuery(query, [estado, notas_profesional || null, consultaId]);

            if (result.affectedRows > 0) {
                console.log(`✅ Consulta ${consultaId} actualizada a estado: ${estado}`);
                res.json({
                    success: true,
                    message: `Asistencia de consulta ${consultaId} confirmada como ${estado}.`,
                    data: { id: consultaId, estado: estado, notas_profesional: notas_profesional }
                });
            } else {
                res.status(404).json({
                    success: false,
                    message: 'Consulta no encontrada o no se pudo actualizar'
                });
            }

        } catch (error) {
            console.error('Error confirmando asistencia:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Cambiar estado de una consulta (nuevo método para ver detalles)
    static async cambiarEstadoConsulta(req, res) {
        try {
            const { consultaId } = req.params;
            const { estado, notas_profesional } = req.body;

            if (!consultaId || isNaN(consultaId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de consulta inválido'
                });
            }

            const validStates = ['activo', 'completado', 'ausente'];
            if (!estado || !validStates.includes(estado)) {
                return res.status(400).json({
                    success: false,
                    message: 'Estado de consulta no válido. Debe ser "activo", "completado" o "ausente".'
                });
            }

            // Verificar que la consulta existe
            const checkQuery = `SELECT id, estado FROM consultas WHERE id = ?`;
            const checkResult = await executeQuery(checkQuery, [consultaId]);
            
            if (checkResult.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Consulta no encontrada'
                });
            }

            // Actualizar la consulta
            const updateQuery = `
                UPDATE consultas
                SET estado = ?, notas_profesional = ?, actualizado_en = NOW()
                WHERE id = ?
            `;
            const result = await executeQuery(updateQuery, [estado, notas_profesional || null, consultaId]);

            if (result.affectedRows > 0) {
                console.log(`✅ Consulta ${consultaId} actualizada a estado: ${estado}`);
                res.json({
                    success: true,
                    message: `Estado de consulta ${consultaId} actualizado a ${estado}.`,
                    data: { 
                        id: consultaId, 
                        estado: estado, 
                        notas_profesional: notas_profesional,
                        actualizado_en: new Date().toISOString()
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'No se pudo actualizar la consulta'
                });
            }

        } catch (error) {
            console.error('Error cambiando estado de consulta:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Obtener estadísticas de asistencia
    static async getEstadisticasAsistencia(req, res) {
        try {
            const { profesionalId } = req.params;
            const { fechaInicio, fechaFin } = req.query;

            if (!profesionalId || isNaN(profesionalId)) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de profesional inválido'
                });
            }

            // Construir filtro de fechas
            let fechaFilter = '';
            const params = [profesionalId];

            if (fechaInicio && fechaFin) {
                fechaFilter = 'AND c.fecha BETWEEN ? AND ?';
                params.push(fechaInicio, fechaFin);
            } else {
                // Últimos 30 días por defecto
                fechaFilter = 'AND c.fecha >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)';
            }

            const query = `
                SELECT 
                    COUNT(*) as total_consultas,
                    SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) as asistieron,
                    SUM(CASE WHEN estado = 'ausente' THEN 1 ELSE 0 END) as no_asistieron,
                    SUM(CASE WHEN estado = 'cancelado' THEN 1 ELSE 0 END) as canceladas,
                    SUM(CASE WHEN estado = 'activo' AND fecha < CURDATE() THEN 1 ELSE 0 END) as pendientes_confirmacion,
                    ROUND(
                        (SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END) / 
                         NULLIF(SUM(CASE WHEN estado IN ('completado', 'ausente') THEN 1 ELSE 0 END), 0)) * 100, 
                        2
                    ) as porcentaje_asistencia
                FROM consultas c
                WHERE c.profesional_id = ?
                ${fechaFilter}
            `;

            const stats = await executeQuery(query, params);
            const estadisticas = stats[0];

            res.json({
                success: true,
                data: {
                    total_consultas: parseInt(estadisticas.total_consultas),
                    asistieron: parseInt(estadisticas.asistieron),
                    no_asistieron: parseInt(estadisticas.no_asistieron),
                    canceladas: parseInt(estadisticas.canceladas),
                    pendientes_confirmacion: parseInt(estadisticas.pendientes_confirmacion),
                    porcentaje_asistencia: parseFloat(estadisticas.porcentaje_asistencia) || 0
                }
            });

        } catch (error) {
            console.error('Error obteniendo estadísticas de asistencia:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor'
            });
        }
    }

    // Agrupar consultas por fecha
    static agruparConsultasPorFecha(consultas) {
        const agrupadas = {};
        
        consultas.forEach(consulta => {
            const fecha = consulta.fecha;
            if (!agrupadas[fecha]) {
                agrupadas[fecha] = [];
            }
            agrupadas[fecha].push(consulta);
        });

        // Convertir a array ordenado por fecha
        return Object.keys(agrupadas)
            .sort((a, b) => new Date(b) - new Date(a))
            .map(fecha => ({
                fecha,
                consultas: agrupadas[fecha].sort((a, b) => {
                    // Primero por estado: Pendientes → No Asistió → Asistió
                    const estadoOrder = { 'activo': 1, 'ausente': 2, 'completado': 3 };
                    const estadoA = estadoOrder[a.estado] || 4;
                    const estadoB = estadoOrder[b.estado] || 4;
                    
                    if (estadoA !== estadoB) {
                        return estadoA - estadoB;
                    }
                    
                    // Luego por hora (más reciente primero)
                    return b.hora.localeCompare(a.hora);
                })
            }));
    }
}

module.exports = AsistenciaController;
