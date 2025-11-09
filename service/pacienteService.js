const cacheService = require('./cacheService');
const Usuario = require('../models/usuario');

class PacienteService {
    constructor() {
        this.cachePrefix = 'pacientes';
        this.statsPrefix = 'stats';
    }

    // Obtener pacientes con caché inteligente
    async getPacientesByProfesional(profesionalId, options = {}) {
        const { search, status, sortBy, forceRefresh = false, page = 1, limit = 10 } = options;
        
        // Normalizar el status: trim y convertir a string
        const normalizedStatus = status ? String(status).trim() : '';
        
        console.log('🔍 PacienteService - Filtros recibidos:', { search, status, normalizedStatus, sortBy, page, limit });
        console.log('🔍 PacienteService - Status original:', status, 'Type:', typeof status);
        console.log('🔍 PacienteService - Status normalizado:', normalizedStatus, 'Type:', typeof normalizedStatus);
        
        // Crear clave de caché única
        const cacheKey = `${this.cachePrefix}_${profesionalId}_${search || 'all'}_${normalizedStatus || 'all'}_${sortBy || 'name'}`;
        
        // Intentar obtener del caché primero (si no es refresh forzado)
        if (!forceRefresh) {
            const cached = cacheService.get(cacheKey);
            if (cached) {
                console.log('💾 Resultado obtenido del caché para:', cacheKey);
                return cached;
            }
        }


        // Construir consulta optimizada
        let query = `
            SELECT u.*, 
                   COUNT(CASE WHEN c.estado = 'completado' THEN c.id END) as total_consultas,
                   MAX(CASE WHEN c.estado = 'completado' THEN c.fecha END) as ultima_consulta,
                   (SELECT peso FROM antropometria 
                    WHERE usuario_id = u.id 
                    ORDER BY fecha DESC LIMIT 1) as peso_actual,
                   CASE 
                       WHEN u.usuario IS NOT NULL AND u.usuario != '' AND u.contrasena IS NOT NULL AND u.contrasena != '' 
                       AND u.usuario NOT LIKE 'temp_%' AND u.contrasena NOT LIKE 'temp_password_%'
                       THEN 1 ELSE 0 
                   END as tiene_cuenta
            FROM usuarios u
            LEFT JOIN consultas c ON u.id = c.usuario_id
            WHERE u.profesional_id = ?
        `;
        
        const params = [profesionalId];
        
        // Aplicar filtros solo si son necesarios
        if (search) {
            query += ` AND (
                u.apellido_nombre LIKE ? OR 
                u.numero_documento LIKE ? OR 
                u.email LIKE ? OR 
                u.telefono LIKE ?
            )`;
            const searchPattern = `%${search}%`;
            params.push(searchPattern, searchPattern, searchPattern, searchPattern);
        }
        
        // Filtrar por estado: por defecto solo activos, a menos que se especifique explícitamente
        // Usar normalizedStatus en lugar de status
        if (normalizedStatus === 'activo') {
            query += ` AND u.activo = 1`;
            console.log('✅ Filtro aplicado: solo pacientes activos');
        } else if (normalizedStatus === 'inactivo') {
            query += ` AND u.activo = 0`;
            console.log('✅ Filtro aplicado: solo pacientes inactivos');
        } else if (normalizedStatus === '' || normalizedStatus === null || normalizedStatus === undefined) {
            // Si status está vacío, no filtrar por estado (mostrar todos)
            // No agregar ningún filtro
            console.log('✅ Sin filtro de estado: mostrando todos los pacientes');
        } else {
            // Por defecto (si no se especifica o es otro valor), solo mostrar pacientes activos
            query += ` AND u.activo = 1`;
            console.log('✅ Filtro por defecto aplicado: solo pacientes activos (status recibido:', normalizedStatus, ')');
        }
        
        query += ` GROUP BY u.id`;
        
        // Aplicar ordenamiento
        switch (sortBy) {
            case 'name':
                query += ` ORDER BY u.apellido_nombre ASC`;
                break;
            case 'lastConsultation':
                query += ` ORDER BY ultima_consulta DESC`;
                break;
            case 'weight':
                query += ` ORDER BY peso_actual DESC`;
                break;
            case 'created':
                query += ` ORDER BY u.creado_en DESC`;
                break;
            default:
                query += ` ORDER BY u.apellido_nombre ASC`;
        }
        
        // Obtener total de registros para paginación (consulta simplificada)
        // Usar normalizedStatus en lugar de status
        const countQuery = `
            SELECT COUNT(*) as total
            FROM usuarios u
            WHERE u.profesional_id = ?
            ${search ? `AND (
                u.apellido_nombre LIKE ? OR 
                u.numero_documento LIKE ? OR 
                u.email LIKE ? OR 
                u.telefono LIKE ?
            )` : ''}
            ${normalizedStatus === 'activo' ? 'AND u.activo = 1' : normalizedStatus === 'inactivo' ? 'AND u.activo = 0' : normalizedStatus === '' || normalizedStatus === null || normalizedStatus === undefined ? '' : 'AND u.activo = 1'}
        `;
        
        const countResult = await Usuario.executeQuery(countQuery, params);
        const totalItems = countResult[0] ? countResult[0].total : 0;
        
        // Calcular paginación
        const offset = (page - 1) * limit;
        const totalPages = Math.ceil(totalItems / limit);
        
        // Agregar LIMIT y OFFSET a la consulta principal
        query += ` LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
        
        // Ejecutar consulta paginada
        const pacientes = await Usuario.executeQuery(query, params);
        
        // Obtener estadísticas completas (siempre los totales reales)
        const stats = await this.getPacientesStats(profesionalId);
        
        // Agregar estadísticas específicas de filtros aplicados
        const filteredStats = {
            ...stats,
            // Estadísticas de los resultados filtrados
            filtrados: {
                total_encontrados: totalItems,
                activos_encontrados: pacientes.filter(p => p.activo).length,
                inactivos_encontrados: pacientes.filter(p => !p.activo).length,
                con_cuenta_encontrados: pacientes.filter(p => p.tiene_cuenta === 1).length,
                sin_cuenta_encontrados: pacientes.filter(p => p.tiene_cuenta === 0).length
            },
            // Información sobre filtros aplicados
            filtros_aplicados: {
                busqueda: search || null,
                estado: status || null,
                ordenamiento: sortBy || 'name'
            }
        };
        
        // Preparar respuesta
        const result = {
            success: true,
            message: 'Pacientes obtenidos exitosamente',
            data: pacientes.map(p => ({
                id: p.id,
                apellido_nombre: p.apellido_nombre,
                numero_documento: p.numero_documento,
                email: p.email,
                telefono: p.telefono,
                activo: p.activo,
                ultima_consulta: p.ultima_consulta,
                total_consultas: p.total_consultas,
                peso_actual: p.peso_actual,
                creado_en: p.creado_en,
                tiene_cuenta: p.tiene_cuenta === 1,
                usuario: p.usuario
            })),
            stats: filteredStats,
            pagination: {
                currentPage: parseInt(page),
                totalPages: totalPages,
                totalItems: totalItems,
                itemsPerPage: parseInt(limit),
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            },
            count: pacientes.length,
            cached: false,
            cacheKey: cacheKey
        };
        
        // Guardar en caché (solo si no hay filtros de búsqueda específicos)
        if (!search && !status) {
            cacheService.set(cacheKey, result, 5 * 60 * 1000); // 5 minutos
        }
        
        return result;
    }

    // Obtener estadísticas con caché
    async getPacientesStats(profesionalId) {
        const cacheKey = `${this.statsPrefix}_${profesionalId}`;
        
        const cached = cacheService.get(cacheKey);
        if (cached) {
            return cached;
        }


        // Obtener estadísticas de pacientes
        const pacientesQuery = `
            SELECT 
                COUNT(*) as total_pacientes,
                COUNT(CASE WHEN activo = 1 THEN 1 END) as pacientes_activos,
                COUNT(CASE WHEN activo = 0 THEN 1 END) as pacientes_inactivos,
                COUNT(CASE WHEN usuario IS NOT NULL AND usuario != '' AND contrasena IS NOT NULL AND contrasena != '' AND usuario NOT LIKE 'temp_%' AND contrasena NOT LIKE 'temp_password_%' THEN 1 END) as pacientes_con_cuenta,
                COUNT(CASE WHEN usuario IS NULL OR usuario = '' OR contrasena IS NULL OR contrasena = '' OR usuario LIKE 'temp_%' OR contrasena LIKE 'temp_password_%' THEN 1 END) as pacientes_sin_cuenta
            FROM usuarios 
            WHERE profesional_id = ?
        `;
        
        const [pacientesStats] = await Usuario.executeQuery(pacientesQuery, [profesionalId]);
        
        // Obtener estadísticas de consultas
        const consultasQuery = `
            SELECT 
                COUNT(*) as total_consultas,
                COUNT(CASE WHEN fecha >= CURDATE() AND estado = 'activo' THEN 1 END) as consultas_pendientes,
                COUNT(CASE WHEN fecha >= CURDATE() - INTERVAL 30 DAY THEN 1 END) as consultas_ultimo_mes
            FROM consultas 
            WHERE profesional_id = ?
        `;
        
        const [consultasStats] = await Usuario.executeQuery(consultasQuery, [profesionalId]);
        
        const stats = {
            total_pacientes: pacientesStats.total_pacientes || 0,
            pacientes_activos: pacientesStats.pacientes_activos || 0,
            pacientes_inactivos: pacientesStats.pacientes_inactivos || 0,
            pacientes_con_cuenta: pacientesStats.pacientes_con_cuenta || 0,
            pacientes_sin_cuenta: pacientesStats.pacientes_sin_cuenta || 0,
            consultas_pendientes: consultasStats.consultas_pendientes || 0,
            con_consultas: consultasStats.consultas_ultimo_mes || 0
        };
        
        // Guardar en caché por 10 minutos
        cacheService.set(cacheKey, stats, 10 * 60 * 1000);
        
        return stats;
    }

    // Invalidar caché cuando se modifica un paciente
    invalidatePacienteCache(pacienteId, profesionalId) {
        cacheService.invalidatePacienteCache(pacienteId);
        cacheService.invalidateProfesionalCache(profesionalId);
    }

    // Invalidar caché cuando se modifica un profesional
    invalidateProfesionalCache(profesionalId) {
        cacheService.invalidateProfesionalCache(profesionalId);
    }

    // Obtener estadísticas del caché
    getCacheStats() {
        return cacheService.getStats();
    }

    // Limpiar todo el caché
    clearCache() {
        cacheService.clear();
    }
}

module.exports = new PacienteService();
