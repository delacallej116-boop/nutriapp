const { executeQuery } = require('../config/db');

class Antropometria {
    constructor() {
        this.table = 'antropometria';
    }

    async create(antropometriaData) {
        try {
            const {
                usuario_id,
                fecha,
                peso,
                altura,
                imc,
                pliegue_tricipital,
                pliegue_subescapular,
                circunferencia_cintura,
                circunferencia_cadera,
                porcentaje_grasa,
                masa_muscular,
                observaciones
            } = antropometriaData;

            // Verificar qué columnas existen en la tabla
            const columnasQuery = `
                SELECT COLUMN_NAME 
                FROM information_schema.COLUMNS 
                WHERE TABLE_SCHEMA = DATABASE() 
                  AND TABLE_NAME = ?
            `;
            const columnasExistentes = await executeQuery(columnasQuery, [this.table]);
            const nombresColumnas = columnasExistentes.map(row => row.COLUMN_NAME);

            // Campos base siempre presentes
            const camposBase = ['usuario_id', 'fecha'];
            const valoresBase = [usuario_id, fecha];
            
            // Campos opcionales con sus valores
            const camposOpcionales = {
                'peso': peso,
                'altura': altura,
                'imc': imc,
                'pliegue_tricipital': pliegue_tricipital,
                'pliegue_subescapular': pliegue_subescapular,
                'circunferencia_cintura': circunferencia_cintura,
                'circunferencia_cadera': circunferencia_cadera,
                'porcentaje_grasa': porcentaje_grasa,
                'masa_muscular': masa_muscular,
                'observaciones': observaciones
            };

            // Construir query dinámicamente solo con columnas que existen
            const camposParaInsertar = [...camposBase];
            const valoresParaInsertar = [...valoresBase];

            Object.keys(camposOpcionales).forEach(campo => {
                if (nombresColumnas.includes(campo)) {
                    camposParaInsertar.push(campo);
                    // Permitir valores null/undefined para campos opcionales
                    const valor = camposOpcionales[campo];
                    valoresParaInsertar.push(valor !== undefined && valor !== null && valor !== '' ? valor : null);
                }
            });

            const placeholders = camposParaInsertar.map(() => '?').join(', ');
            const query = `
                INSERT INTO ${this.table} (
                    ${camposParaInsertar.join(', ')}
                ) VALUES (${placeholders})
            `;

            console.log('📊 Antropometria - Columnas detectadas:', nombresColumnas);
            console.log('📊 Antropometria - Campos a insertar:', camposParaInsertar);
            console.log('📊 Antropometria - Query generado:', query);

            const result = await executeQuery(query, valoresParaInsertar);

            return result.insertId;
        } catch (error) {
            console.error('Error creating anthropometry record:', error);
            throw error;
        }
    }

    async getByUsuario(usuarioId, options = {}) {
        try {
            // Validar que usuarioId sea un número válido
            if (!usuarioId || isNaN(usuarioId)) {
                throw new Error('usuarioId debe ser un número válido');
            }
            
            const { limit = 20, offset = 0 } = options;
            
            // Asegurar que limit y offset sean números enteros
            const limitInt = parseInt(limit, 10);
            const offsetInt = parseInt(offset, 10);
            
            // Validar que los números sean válidos
            if (isNaN(limitInt) || isNaN(offsetInt)) {
                throw new Error('limit y offset deben ser números válidos');
            }
            
            console.log('🔍 Debug Antropometria - Parámetros:', {
                usuarioId: usuarioId,
                limitInt: limitInt,
                offsetInt: offsetInt,
                usuarioIdType: typeof usuarioId
            });
            
            const rows = await executeQuery(
                `SELECT * FROM ${this.table} 
                WHERE usuario_id = ? 
                ORDER BY fecha DESC, creado_en DESC
                LIMIT ? OFFSET ?`,
                [parseInt(usuarioId, 10), limitInt, offsetInt]
            );
            return rows;
        } catch (error) {
            console.error('Error fetching anthropometry by user:', error);
            throw error;
        }
    }

    async getUltimaMedicion(usuarioId) {
        try {
            const rows = await executeQuery(
                `SELECT * FROM ${this.table} 
                WHERE usuario_id = ? 
                ORDER BY fecha DESC, creado_en DESC
                LIMIT 1`,
                [usuarioId]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching last anthropometry measurement:', error);
            throw error;
        }
    }

    async getById(id) {
        try {
            const rows = await executeQuery(
                `SELECT * FROM ${this.table} WHERE id = ?`,
                [id]
            );
            return rows[0] || null;
        } catch (error) {
            console.error('Error fetching anthropometry by ID:', error);
            throw error;
        }
    }

    async update(id, antropometriaData) {
        try {
            const {
                fecha,
                peso,
                altura,
                imc,
                pliegue_tricipital,
                pliegue_subescapular,
                circunferencia_cintura,
                circunferencia_cadera,
                porcentaje_grasa,
                masa_muscular,
                observaciones
            } = antropometriaData;

            const query = `
                UPDATE ${this.table} SET 
                    fecha = ?, peso = ?, altura = ?, imc = ?,
                    pliegue_tricipital = ?, pliegue_subescapular = ?, circunferencia_cintura = ?,
                    circunferencia_cadera = ?, porcentaje_grasa = ?, masa_muscular = ?, observaciones = ?
                WHERE id = ?
            `;

            const result = await executeQuery(query, [
                fecha, peso, altura, imc,
                pliegue_tricipital, pliegue_subescapular, circunferencia_cintura,
                circunferencia_cadera, porcentaje_grasa, masa_muscular, observaciones, id
            ]);

            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error updating anthropometry:', error);
            throw error;
        }
    }

    async delete(id) {
        try {
            const result = await executeQuery(
                `DELETE FROM ${this.table} WHERE id = ?`,
                [id]
            );
            return result.affectedRows > 0;
        } catch (error) {
            console.error('Error deleting anthropometry:', error);
            throw error;
        }
    }

    async getStats(usuarioId) {
        try {
            const query = `
                SELECT 
                    COUNT(id) AS total_mediciones,
                    MIN(fecha) AS primera_medicion,
                    MAX(fecha) AS ultima_medicion,
                    AVG(peso) AS peso_promedio,
                    AVG(altura) AS altura_promedio,
                    AVG(imc) AS imc_promedio,
                    AVG(porcentaje_grasa) AS grasa_promedio,
                    AVG(masa_muscular) AS masa_muscular_promedio
                FROM ${this.table} 
                WHERE usuario_id = ?
            `;
            
            const rows = await executeQuery(query, [usuarioId]);
            return rows[0];
        } catch (error) {
            console.error('Error fetching anthropometry stats:', error);
            throw error;
        }
    }

    async getEvolution(usuarioId, limit = 10) {
        try {
            const query = `
                SELECT 
                    fecha,
                    peso,
                    altura,
                    imc,
                    porcentaje_grasa,
                    masa_muscular,
                    circunferencia_cintura,
                    circunferencia_cadera
                FROM ${this.table} 
                WHERE usuario_id = ? 
                ORDER BY fecha DESC 
                LIMIT ?
            `;
            
            const rows = await executeQuery(query, [usuarioId, limit]);
            return rows;
        } catch (error) {
            console.error('Error fetching anthropometry evolution:', error);
            throw error;
        }
    }
}

module.exports = Antropometria;
