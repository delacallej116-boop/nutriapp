const { executeQuery } = require('../config/db');

class PlanComidas {
    constructor() {
        this.tableName = 'plan_comidas';
    }

    // Crear nueva comida
    async createComida(comidaData) {
        try {
            const {
                plan_id,
                dia_semana,
                tipo_comida,
                nombre_comida,
                descripcion,
                hora,
                calorias,
                proteinas,
                carbohidratos,
                grasas,
                fibra,
                azucares,
                sodio,
                ingredientes,
                preparacion,
                tiempo_preparacion,
                dificultad,
                porciones,
                notas
            } = comidaData;

            const query = `
                INSERT INTO ${this.tableName} 
                (plan_id, dia_semana, tipo_comida, nombre_comida, descripcion, hora,
                 calorias, proteinas, carbohidratos, grasas, fibra, azucares, sodio,
                 ingredientes, preparacion, tiempo_preparacion, dificultad, porciones, notas,
                 activo, creado_en)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, TRUE, NOW())
            `;

            const result = await executeQuery(query, [
                plan_id,
                dia_semana,
                tipo_comida,
                nombre_comida,
                descripcion,
                hora,
                calorias,
                proteinas,
                carbohidratos,
                grasas,
                fibra,
                azucares,
                sodio,
                ingredientes,
                preparacion,
                tiempo_preparacion,
                dificultad,
                porciones,
                notas
            ]);

            return { id: result.insertId };
        } catch (error) {
            console.error('Error al crear comida:', error);
            throw error;
        }
    }

    // Obtener comidas por plan
    async getComidasByPlan(planId) {
        try {
            const query = `
                SELECT * FROM ${this.tableName} 
                WHERE plan_id = ? AND activo = 1
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
                    CASE tipo_comida
                        WHEN 'desayuno' THEN 1
                        WHEN 'media_manana' THEN 2
                        WHEN 'almuerzo' THEN 3
                        WHEN 'media_tarde' THEN 4
                        WHEN 'cena' THEN 5
                        WHEN 'colacion' THEN 6
                    END
            `;
            const result = await executeQuery(query, [planId]);
            return result;
        } catch (error) {
            console.error('Error al obtener comidas por plan:', error);
            throw error;
        }
    }

    // Actualizar comida
    async updateComida(comidaId, comidaData) {
        try {
            const {
                dia_semana,
                tipo_comida,
                nombre_comida,
                descripcion,
                hora,
                calorias,
                proteinas,
                carbohidratos,
                grasas,
                fibra,
                azucares,
                sodio,
                ingredientes,
                preparacion,
                tiempo_preparacion,
                dificultad,
                porciones,
                notas
            } = comidaData;

            const query = `
                UPDATE ${this.tableName} 
                SET dia_semana = ?, tipo_comida = ?, nombre_comida = ?, descripcion = ?, hora = ?,
                    calorias = ?, proteinas = ?, carbohidratos = ?, grasas = ?, fibra = ?, 
                    azucares = ?, sodio = ?, ingredientes = ?, preparacion = ?, 
                    tiempo_preparacion = ?, dificultad = ?, porciones = ?, notas = ?,
                    actualizado_en = NOW()
                WHERE id = ?
            `;

            const result = await executeQuery(query, [
                dia_semana,
                tipo_comida,
                nombre_comida,
                descripcion,
                hora,
                calorias,
                proteinas,
                carbohidratos,
                grasas,
                fibra,
                azucares,
                sodio,
                ingredientes,
                preparacion,
                tiempo_preparacion,
                dificultad,
                porciones,
                notas,
                comidaId
            ]);

            return result;
        } catch (error) {
            console.error('Error al actualizar comida:', error);
            throw error;
        }
    }

    // Eliminar comida
    async deleteComida(comidaId) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE id = ?`;
            const result = await executeQuery(query, [comidaId]);
            return result;
        } catch (error) {
            console.error('Error al eliminar comida:', error);
            throw error;
        }
    }

    // Eliminar todas las comidas de un plan
    async deleteComidasByPlan(planId) {
        try {
            const query = `DELETE FROM ${this.tableName} WHERE plan_id = ?`;
            const result = await executeQuery(query, [planId]);
            return result;
        } catch (error) {
            console.error('Error al eliminar comidas del plan:', error);
            throw error;
        }
    }

    // Obtener resumen nutricional del plan
    async getNutritionalSummary(planId) {
        try {
            const query = `
                SELECT 
                    AVG(calorias) as calorias_promedio,
                    AVG(proteinas) as proteinas_promedio,
                    AVG(carbohidratos) as carbohidratos_promedio,
                    AVG(grasas) as grasas_promedio,
                    AVG(fibra) as fibra_promedio,
                    AVG(azucares) as azucares_promedio,
                    AVG(sodio) as sodio_promedio,
                    COUNT(*) as total_comidas
                FROM ${this.tableName} 
                WHERE plan_id = ? AND activo = 1
            `;
            const result = await executeQuery(query, [planId]);
            return result[0] || {};
        } catch (error) {
            console.error('Error al obtener resumen nutricional:', error);
            throw error;
        }
    }
}

module.exports = PlanComidas;

