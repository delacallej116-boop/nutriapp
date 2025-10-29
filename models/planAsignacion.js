const { executeQuery } = require('../config/db');

class PlanAsignacion {
    constructor() {
        this.tableName = 'plan_asignaciones';
    }

    // Crear nueva asignación
    async createAsignacion(asignacionData) {
        try {
            const {
                plan_id,
                usuario_id,
                fecha_inicio,
                fecha_fin,
                activo = true,
                observaciones
            } = asignacionData;

            const query = `
                INSERT INTO ${this.tableName} 
                (plan_id, usuario_id, fecha_inicio, fecha_fin, activo, observaciones)
                VALUES (?, ?, ?, ?, ?, ?)
            `;

            const result = await executeQuery(query, [
                plan_id,
                usuario_id,
                fecha_inicio,
                fecha_fin,
                activo,
                observaciones
            ]);

            return result;
        } catch (error) {
            console.error('Error al crear asignación:', error);
            throw error;
        }
    }

    // Obtener asignaciones por usuario (solo activas)
    async getAsignacionesByUsuario(usuarioId) {
        try {
            console.log(`📊 Query: buscando asignaciones activas para usuario ${usuarioId}`);
            
            // Primero intentar con la estructura completa
            let query = `
                SELECT pa.*, 
                    pa.plan_id, 
                    p.tipo, 
                    p.objetivo, 
                    p.calorias_diarias, 
                    p.descripcion,
                    CONCAT('Plan #', pa.plan_id) as plan_nombre
                FROM ${this.tableName} pa
                LEFT JOIN planes_alimentacion p ON pa.plan_id = p.id
                WHERE pa.usuario_id = ? AND pa.activo = true
                ORDER BY pa.fecha_asignacion DESC
            `;

            let result = await executeQuery(query, [usuarioId]);
            console.log(`✅ Resultado de asignaciones: ${result?.length || 0} registros`);
            return result || [];
        } catch (error) {
            console.error('❌ Error al obtener asignaciones por usuario:', error);
            console.error('Error details:', {
                message: error.message,
                sqlState: error.sqlState,
                sqlMessage: error.sqlMessage
            });
            throw error;
        }
    }

    // Obtener todas las asignaciones por usuario (activas e inactivas)
    async getAllAsignacionesByUsuario(usuarioId) {
        try {
            const query = `
                SELECT pa.*, 
                    pa.plan_id, 
                    p.tipo, 
                    p.objetivo, 
                    p.calorias_diarias, 
                    p.descripcion,
                    CONCAT('Plan #', pa.plan_id) as plan_nombre
                FROM ${this.tableName} pa
                LEFT JOIN planes_alimentacion p ON pa.plan_id = p.id
                WHERE pa.usuario_id = ?
                ORDER BY pa.fecha_asignacion DESC
            `;

            const result = await executeQuery(query, [usuarioId]);
            return result || [];
        } catch (error) {
            console.error('Error al obtener todas las asignaciones por usuario:', error);
            throw error;
        }
    }

    // Obtener asignación activa por usuario
    async getAsignacionActivaByUsuario(usuarioId) {
        try {
            console.log(`📊 Query: buscando asignación activa para usuario ${usuarioId}`);
            const query = `
                SELECT pa.*, 
                    pa.plan_id, 
                    p.tipo, 
                    p.objetivo, 
                    p.calorias_diarias, 
                    p.descripcion,
                    CONCAT('Plan #', pa.plan_id) as plan_nombre
                FROM ${this.tableName} pa
                LEFT JOIN planes_alimentacion p ON pa.plan_id = p.id
                WHERE pa.usuario_id = ? AND pa.activo = true
                ORDER BY pa.fecha_asignacion DESC
                LIMIT 1
            `;

            const result = await executeQuery(query, [usuarioId]);
            console.log(`✅ Resultado de asignación activa: ${result ? 'encontrada' : 'no encontrada'}`);
            return result && result.length > 0 ? result[0] : null;
        } catch (error) {
            console.error('❌ Error al obtener asignación activa por usuario:', error);
            console.error('Error details:', {
                message: error.message,
                sqlState: error.sqlState,
                sqlMessage: error.sqlMessage
            });
            throw error;
        }
    }

    // Obtener asignaciones por plan
    async getAsignacionesByPlan(planId) {
        try {
            const query = `
                SELECT pa.*, u.nombre as usuario_nombre, u.apellido as usuario_apellido, u.email
                FROM ${this.tableName} pa
                JOIN usuarios u ON pa.usuario_id = u.id
                WHERE pa.plan_id = ?
                ORDER BY pa.fecha_asignacion DESC
            `;

            const result = await executeQuery(query, [planId]);
            return result;
        } catch (error) {
            console.error('Error al obtener asignaciones por plan:', error);
            throw error;
        }
    }

    // Desactivar asignación (desasignar)
    async desactivarAsignacion(asignacionId) {
        try {
            const query = `
                UPDATE ${this.tableName} 
                SET activo = false, actualizado_en = NOW()
                WHERE id = ?
            `;

            const result = await executeQuery(query, [asignacionId]);
            return result;
        } catch (error) {
            console.error('Error al desactivar asignación:', error);
            throw error;
        }
    }

    // Desactivar todas las asignaciones activas de un usuario
    async desactivarAsignacionesActivasByUsuario(usuarioId) {
        try {
            const query = `
                UPDATE ${this.tableName} 
                SET activo = false, actualizado_en = NOW()
                WHERE usuario_id = ? AND activo = true
            `;

            const result = await executeQuery(query, [usuarioId]);
            return result;
        } catch (error) {
            console.error('Error al desactivar asignaciones activas por usuario:', error);
            throw error;
        }
    }

    // Actualizar asignación
    async updateAsignacion(asignacionId, asignacionData) {
        try {
            const {
                fecha_inicio,
                fecha_fin,
                activo,
                observaciones
            } = asignacionData;

            const query = `
                UPDATE ${this.tableName} 
                SET fecha_inicio = ?, fecha_fin = ?, activo = ?, observaciones = ?, actualizado_en = NOW()
                WHERE id = ?
            `;

            const result = await executeQuery(query, [
                fecha_inicio,
                fecha_fin,
                activo,
                observaciones,
                asignacionId
            ]);

            return result;
        } catch (error) {
            console.error('Error al actualizar asignación:', error);
            throw error;
        }
    }

    // Eliminar asignación
    async deleteAsignacion(asignacionId) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
            const result = await executeQuery(query, [asignacionId]);
            return result;
        } catch (error) {
            console.error('Error al eliminar asignación:', error);
            throw error;
        }
    }

    // Obtener estadísticas de asignaciones
    async getAsignacionesStats() {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_asignaciones,
                    COUNT(CASE WHEN activo = true THEN 1 END) as asignaciones_activas,
                    COUNT(CASE WHEN activo = false THEN 1 END) as asignaciones_inactivas
                FROM ${this.tableName}
            `;

            const result = await executeQuery(query);
            return result[0];
        } catch (error) {
            console.error('Error al obtener estadísticas de asignaciones:', error);
            throw error;
        }
    }
}

module.exports = PlanAsignacion;
