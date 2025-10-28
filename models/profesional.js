const { executeQuery } = require('../config/db');
const bcrypt = require('bcryptjs');

class Profesional {
    constructor(data) {
        this.id = data.id;
        this.nombre = data.nombre;
        this.usuario = data.usuario;
        this.email = data.email;
        this.telefono = data.telefono;
        this.contrasena = data.contrasena;
        this.timezone = data.timezone || 'UTC';
        this.especialidad = data.especialidad;
        this.matricula = data.matricula;
        this.experiencia = data.experiencia;
        this.descripcion = data.descripcion;
        this.clave_registro_usada = data.clave_registro_usada;
        this.creado_en = data.creado_en;
    }

    // Crear un nuevo profesional
    static async create(profesionalData) {
        try {
            // Hash de la contraseña
            const hashedPassword = await bcrypt.hash(profesionalData.contrasena, 10);
            
            const query = `
                INSERT INTO profesionales (
                    nombre, usuario, email, telefono, contrasena, timezone,
                    especialidad, matricula, experiencia, descripcion, clave_registro_usada
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                profesionalData.nombre,
                profesionalData.usuario,
                profesionalData.email,
                profesionalData.telefono,
                hashedPassword,
                profesionalData.timezone || 'UTC',
                profesionalData.especialidad,
                profesionalData.matricula,
                profesionalData.experiencia,
                profesionalData.descripcion,
                profesionalData.clave_registro_usada
            ];
            
            const result = await executeQuery(query, params);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Obtener profesional por ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM profesionales WHERE id = ?';
            const results = await executeQuery(query, [id]);
            return results.length > 0 ? new Profesional(results[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Obtener profesional por usuario
    static async findByUsuario(usuario) {
        try {
            const query = 'SELECT * FROM profesionales WHERE usuario = ?';
            const results = await executeQuery(query, [usuario]);
            return results.length > 0 ? new Profesional(results[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Obtener profesional por email
    static async findByEmail(email) {
        try {
            const query = 'SELECT * FROM profesionales WHERE email = ?';
            const results = await executeQuery(query, [email]);
            return results.length > 0 ? new Profesional(results[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Obtener todos los profesionales
    static async findAll() {
        try {
            const query = 'SELECT id, nombre, email, telefono, timezone, creado_en FROM profesionales ORDER BY nombre';
            const results = await executeQuery(query);
            return results.map(row => new Profesional(row));
        } catch (error) {
            throw error;
        }
    }

    // Actualizar profesional
    async update(updateData) {
        try {
            const fields = [];
            const values = [];
            
            if (updateData.nombre) {
                fields.push('nombre = ?');
                values.push(updateData.nombre);
            }
            
            if (updateData.email) {
                fields.push('email = ?');
                values.push(updateData.email);
            }
            
            if (updateData.telefono) {
                fields.push('telefono = ?');
                values.push(updateData.telefono);
            }
            
            if (updateData.timezone) {
                fields.push('timezone = ?');
                values.push(updateData.timezone);
            }
            
            if (updateData.contrasena) {
                const hashedPassword = await bcrypt.hash(updateData.contrasena, 10);
                fields.push('contrasena = ?');
                values.push(hashedPassword);
            }
            
            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }
            
            values.push(this.id);
            
            const query = `UPDATE profesionales SET ${fields.join(', ')} WHERE id = ?`;
            await executeQuery(query, values);
            
            // Actualizar el objeto actual
            Object.assign(this, updateData);
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Eliminar profesional
    async delete() {
        try {
            const query = 'DELETE FROM profesionales WHERE id = ?';
            await executeQuery(query, [this.id]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Verificar contraseña
    async verifyPassword(password) {
        try {
            return await bcrypt.compare(password, this.contrasena);
        } catch (error) {
            throw error;
        }
    }

    // Obtener estadísticas del profesional
    static async getStats(profesionalId) {
        try {
            const queries = {
                totalPacientes: `
                    SELECT COUNT(DISTINCT usuario_id) as total 
                    FROM consultas 
                    WHERE profesional_id = ?
                `,
                consultasHoy: `
                    SELECT COUNT(*) as total 
                    FROM consultas 
                    WHERE profesional_id = ? AND fecha = CURDATE()
                `,
                proximaConsulta: `
                    SELECT fecha, hora, u.apellido_nombre 
                    FROM consultas c
                    JOIN usuarios u ON c.usuario_id = u.id
                    WHERE c.profesional_id = ? AND c.fecha >= CURDATE() AND c.estado = 'activo'
                    ORDER BY c.fecha, c.hora
                    LIMIT 1
                `
            };
            
            const stats = {};
            
            for (const [key, query] of Object.entries(queries)) {
                const result = await executeQuery(query, [profesionalId]);
                stats[key] = result[0];
            }
            
            return stats;
        } catch (error) {
            throw error;
        }
    }

    // Convertir a objeto público (sin contraseña)
    toPublicObject() {
        const { contrasena, ...publicData } = this;
        return publicData;
    }

    // Validar clave de registro
    static async validarClaveRegistro(clave) {
        try {
            const query = `
                SELECT * FROM claves_registro 
                WHERE clave = ? AND activa = TRUE AND usada_por IS NULL
            `;
            const results = await executeQuery(query, [clave]);
            return results.length > 0 ? results[0] : null;
        } catch (error) {
            throw error;
        }
    }

    // Marcar clave como usada
    static async marcarClaveUsada(claveId, profesionalId) {
        try {
            const query = `
                UPDATE claves_registro 
                SET usada_por = ?, fecha_uso = NOW() 
                WHERE id = ?
            `;
            await executeQuery(query, [profesionalId, claveId]);
            return true;
        } catch (error) {
            throw error;
        }
    }

    // Obtener todas las claves de registro (para administración)
    static async obtenerClavesRegistro() {
        try {
            const query = `
                SELECT c.*, p.nombre as profesional_nombre 
                FROM claves_registro c
                LEFT JOIN profesionales p ON c.usada_por = p.id
                ORDER BY c.fecha_creacion DESC
            `;
            const results = await executeQuery(query);
            return results;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Profesional;
