const { executeQuery } = require('../config/db');

class PlanAlimentacion {
    constructor() {
        this.tableName = 'planes_alimentacion';
    }

    // Crear nuevo plan alimentario
    async createPlan(planData) {
        try {
            const {
                nombre,
                tipo,
                usuario_id,
                profesional_id,
                fecha_inicio,
                fecha_fin,
                descripcion,
                objetivo,
                calorias_diarias,
                caracteristicas,
                observaciones
            } = planData;

            const query = `
                INSERT INTO ${this.tableName} 
                (nombre, tipo, usuario_id, profesional_id, fecha_inicio, fecha_fin, descripcion, 
                 objetivo, calorias_diarias, caracteristicas, observaciones, activo, creado_en)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())
            `;

            const result = await executeQuery(query, [
                nombre,
                tipo,
                usuario_id,
                profesional_id,
                fecha_inicio,
                fecha_fin,
                descripcion,
                objetivo,
                calorias_diarias,
                caracteristicas,
                observaciones
            ]);

            return { id: result.insertId };
        } catch (error) {
            console.error('Error al crear plan alimentario:', error);
            throw error;
        }
    }

    // Obtener plan por ID
    async getPlanById(planId) {
        try {
            const query = `
                SELECT pa.*, u.apellido_nombre as paciente_nombre, p.nombre as profesional_nombre
                FROM ${this.tableName} pa
                LEFT JOIN usuarios u ON pa.usuario_id = u.id
                INNER JOIN profesionales p ON pa.profesional_id = p.id
                WHERE pa.id = ?
            `;
            const result = await executeQuery(query, [planId]);
            return result[0] || null;
        } catch (error) {
            console.error('Error al obtener plan por ID:', error);
            throw error;
        }
    }

    // Obtener todos los planes de un profesional
    async getPlanesByProfesional(profesionalId) {
        try {
            const query = `
                SELECT 
                    pa.*,
                    GROUP_CONCAT(u.apellido_nombre SEPARATOR ' | ') as paciente_nombre,
                    GROUP_CONCAT(pa_asignacion.fecha_inicio SEPARATOR ', ') as fecha_asignacion_inicio,
                    GROUP_CONCAT(pa_asignacion.fecha_fin SEPARATOR ', ') as fecha_asignacion_fin,
                    COUNT(pa_asignacion.id) as total_asignaciones
                FROM ${this.tableName} pa
                LEFT JOIN plan_asignaciones pa_asignacion ON pa.id = pa_asignacion.plan_id AND pa_asignacion.activo = TRUE
                LEFT JOIN usuarios u ON pa_asignacion.usuario_id = u.id
                WHERE pa.profesional_id = ? AND pa.activo = TRUE
                GROUP BY pa.id
                ORDER BY pa.creado_en DESC
            `;
            const result = await executeQuery(query, [profesionalId]);
            return result;
        } catch (error) {
            console.error('Error al obtener planes del profesional:', error);
            throw error;
        }
    }

    // Obtener pacientes asignados a un plan específico
    async getPacientesAsignados(planId) {
        try {
            const query = `
                SELECT 
                    u.id,
                    u.apellido_nombre,
                    u.email,
                    pa_asignacion.fecha_inicio,
                    pa_asignacion.fecha_fin,
                    pa_asignacion.activo
                FROM plan_asignaciones pa_asignacion
                INNER JOIN usuarios u ON pa_asignacion.usuario_id = u.id
                WHERE pa_asignacion.plan_id = ? AND pa_asignacion.activo = TRUE
                ORDER BY u.apellido_nombre ASC
            `;
            const result = await executeQuery(query, [planId]);
            return result;
        } catch (error) {
            console.error('Error al obtener pacientes asignados al plan:', error);
            throw error;
        }
    }

    // Actualizar plan
    async updatePlan(planId, planData) {
        try {
            const {
                nombre,
                tipo,
                usuario_id,
                fecha_inicio,
                fecha_fin,
                descripcion,
                objetivo,
                calorias_diarias,
                caracteristicas,
                observaciones,
                activo
            } = planData;

            const query = `
                UPDATE ${this.tableName} 
                SET nombre = ?, tipo = ?, usuario_id = ?, fecha_inicio = ?, fecha_fin = ?, 
                    descripcion = ?, objetivo = ?, calorias_diarias = ?, caracteristicas = ?, 
                    observaciones = ?, activo = ?, actualizado_en = NOW()
                WHERE id = ?
            `;

            const result = await executeQuery(query, [
                nombre,
                tipo,
                usuario_id,
                fecha_inicio,
                fecha_fin,
                descripcion,
                objetivo,
                calorias_diarias,
                caracteristicas,
                observaciones,
                activo,
                planId
            ]);

            return result;
        } catch (error) {
            console.error('Error al actualizar plan:', error);
            throw error;
        }
    }

    // Eliminar plan
    async deletePlan(planId) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
            const result = await executeQuery(query, [planId]);
            return result;
        } catch (error) {
            console.error('Error al eliminar plan:', error);
            throw error;
        }
    }

    // Obtener estadísticas de planes
    async getPlanStats(profesionalId) {
        try {
            const query = `
                SELECT 
                    COUNT(*) as total_planes,
                    SUM(CASE WHEN activo = 1 THEN 1 ELSE 0 END) as planes_activos,
                    SUM(CASE WHEN tipo = 'simple' THEN 1 ELSE 0 END) as planes_simples,
                    SUM(CASE WHEN tipo = 'intermedio' THEN 1 ELSE 0 END) as planes_intermedios,
                    SUM(CASE WHEN tipo = 'avanzado' THEN 1 ELSE 0 END) as planes_avanzados
                FROM ${this.tableName} 
                WHERE profesional_id = ?
            `;
            const result = await executeQuery(query, [profesionalId]);
            return result[0] || {};
        } catch (error) {
            console.error('Error al obtener estadísticas de planes:', error);
            throw error;
        }
    }

    // Obtener plan activo por paciente
    async getPlanActivoByPaciente(pacienteId) {
        try {
            const query = `
                SELECT pa.*, p.nombre as profesional_nombre
                FROM ${this.tableName} pa
                INNER JOIN profesionales p ON pa.profesional_id = p.id
                WHERE pa.usuario_id = ? AND pa.activo = 1
                ORDER BY pa.fecha_inicio DESC
                LIMIT 1
            `;
            const result = await executeQuery(query, [pacienteId]);
            return result[0] || null;
        } catch (error) {
            console.error('Error al obtener plan activo del paciente:', error);
            throw error;
        }
    }

    // Obtener todos los planes de un paciente
    async getPlanesByPaciente(pacienteId) {
        try {
            const query = `
                SELECT pa.*, p.nombre as profesional_nombre
                FROM ${this.tableName} pa
                INNER JOIN profesionales p ON pa.profesional_id = p.id
                WHERE pa.usuario_id = ?
                ORDER BY pa.creado_en DESC
            `;
            const result = await executeQuery(query, [pacienteId]);
            return result;
        } catch (error) {
            console.error('Error al obtener planes del paciente:', error);
            throw error;
        }
    }
}

module.exports = PlanAlimentacion;
