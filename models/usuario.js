const { executeQuery } = require('../config/db');
const bcrypt = require('bcryptjs');

class Usuario {
    // Método estático para ejecutar consultas personalizadas
    static async executeQuery(query, params = []) {
        return await executeQuery(query, params);
    }
    constructor(data) {
        this.id = data.id;
        this.profesional_id = data.profesional_id;
        this.numero_documento = data.numero_documento;
        this.tipo_documento = data.tipo_documento;
        this.numero_historia_clinica = data.numero_historia_clinica;
        this.apellido_nombre = data.apellido_nombre;
        this.usuario = data.usuario;
        this.email = data.email;
        this.telefono = data.telefono;
        this.fecha_ingreso = data.fecha_ingreso;
        this.fecha_baja = data.fecha_baja;
        this.fecha_nacimiento = data.fecha_nacimiento;
        this.domicilio = data.domicilio;
        this.localidad = data.localidad;
        this.obra_social = data.obra_social;
        this.numero_afiliado = data.numero_afiliado;
        this.sexo = data.sexo;
        this.grupo_sanguineo = data.grupo_sanguineo;
        this.estado_civil = data.estado_civil;
        this.ocupacion = data.ocupacion;
        this.contrasena = data.contrasena;
        this.rol = data.rol || 'paciente';
        this.activo = data.activo;
        this.observaciones = data.observaciones;
        this.creado_en = data.creado_en;
    }

    // Crear nuevo usuario
    static async create(usuarioData) {
        try {
            // Solo hashear contraseña si se proporciona
            let hashedPassword = null;
            if (usuarioData.contrasena) {
                hashedPassword = await bcrypt.hash(usuarioData.contrasena, 10);
            }
            
            // Función helper para convertir undefined a null
            const toNull = (value) => value === undefined ? null : value;
            
            const query = `
                INSERT INTO usuarios (
                    profesional_id, numero_documento, tipo_documento, numero_historia_clinica,
                    apellido_nombre, usuario, email, telefono, fecha_ingreso, fecha_baja,
                    fecha_nacimiento, domicilio, localidad, obra_social, numero_afiliado,
                    sexo, grupo_sanguineo, estado_civil, ocupacion, contrasena, rol, activo, observaciones
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;
            
            const params = [
                toNull(usuarioData.profesional_id),
                toNull(usuarioData.numero_documento),
                toNull(usuarioData.tipo_documento),
                toNull(usuarioData.numero_historia_clinica),
                toNull(usuarioData.apellido_nombre),
                toNull(usuarioData.usuario),
                toNull(usuarioData.email),
                toNull(usuarioData.telefono),
                toNull(usuarioData.fecha_ingreso),
                toNull(usuarioData.fecha_baja),
                toNull(usuarioData.fecha_nacimiento),
                toNull(usuarioData.domicilio),
                toNull(usuarioData.localidad),
                toNull(usuarioData.obra_social),
                toNull(usuarioData.numero_afiliado),
                toNull(usuarioData.sexo),
                toNull(usuarioData.grupo_sanguineo),
                toNull(usuarioData.estado_civil),
                toNull(usuarioData.ocupacion),
                hashedPassword,
                usuarioData.rol || 'paciente',
                usuarioData.activo !== undefined ? usuarioData.activo : true,
                toNull(usuarioData.observaciones)
            ];
            
            const result = await executeQuery(query, params);
            return result.insertId;
        } catch (error) {
            throw error;
        }
    }

    // Buscar usuario por nombre de usuario
    static async findByUsuario(usuario) {
        try {
            const query = 'SELECT * FROM usuarios WHERE usuario = ?';
            const results = await executeQuery(query, [usuario]);
            return results.length > 0 ? new Usuario(results[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Buscar usuario por email
    static async findByEmail(email) {
        try {
            const query = 'SELECT * FROM usuarios WHERE email = ?';
            const results = await executeQuery(query, [email]);
            return results.length > 0 ? new Usuario(results[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Obtener usuario por ID
    static async findById(id) {
        try {
            const query = 'SELECT * FROM usuarios WHERE id = ?';
            const results = await executeQuery(query, [id]);
            return results.length > 0 ? new Usuario(results[0]) : null;
        } catch (error) {
            throw error;
        }
    }

    // Obtener todos los usuarios de un profesional
    static async findByProfesionalId(profesionalId) {
        try {
            const query = 'SELECT * FROM usuarios WHERE profesional_id = ? ORDER BY creado_en DESC';
            const results = await executeQuery(query, [profesionalId]);
            return results.map(row => new Usuario(row));
        } catch (error) {
            throw error;
        }
    }

    // Obtener todos los usuarios
    static async findAll() {
        try {
            const query = 'SELECT * FROM usuarios ORDER BY creado_en DESC';
            const results = await executeQuery(query);
            return results.map(row => new Usuario(row));
        } catch (error) {
            throw error;
        }
    }

    // Actualizar usuario
    static async update(id, usuarioData) {
        try {
            const fields = [];
            const values = [];

            // Solo actualizar campos que se proporcionen
            Object.keys(usuarioData).forEach(key => {
                if (usuarioData[key] !== undefined && key !== 'id') {
                    fields.push(`${key} = ?`);
                    values.push(usuarioData[key]);
                }
            });

            if (fields.length === 0) {
                throw new Error('No hay campos para actualizar');
            }

            values.push(id);
            const query = `UPDATE usuarios SET ${fields.join(', ')} WHERE id = ?`;
            
            const result = await executeQuery(query, values);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Eliminar usuario (soft delete)
    static async delete(id) {
        try {
            const query = 'UPDATE usuarios SET activo = FALSE WHERE id = ?';
            const result = await executeQuery(query, [id]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }

    // Verificar contraseña
    async verifyPassword(password) {
        return await bcrypt.compare(password, this.contrasena);
    }

    // Convertir a objeto público (sin contraseña)
    toPublicObject() {
        const { contrasena, ...publicData } = this;
        return publicData;
    }

    // Obtener estadísticas del usuario
    static async getStats(usuarioId) {
        try {
            const stats = {};
            
            // Contar consultas
            const consultasQuery = 'SELECT COUNT(*) as total FROM consultas WHERE usuario_id = ?';
            const [consultasResult] = await executeQuery(consultasQuery, [usuarioId]);
            stats.totalConsultas = consultasResult.total;
            
            // Contar planes de alimentación
            const planesQuery = 'SELECT COUNT(*) as total FROM planes_alimentacion WHERE usuario_id = ?';
            const [planesResult] = await executeQuery(planesQuery, [usuarioId]);
            stats.totalPlanes = planesResult.total;
            
            // Contar documentos
            const docsQuery = 'SELECT COUNT(*) as total FROM documentos WHERE usuario_id = ?';
            const [docsResult] = await executeQuery(docsQuery, [usuarioId]);
            stats.totalDocumentos = docsResult.total;
            
            return stats;
        } catch (error) {
            throw error;
        }
    }

    // Verificar si un usuario ya existe
    static async checkUserExists(username) {
        try {
            const query = 'SELECT COUNT(*) as count FROM usuarios WHERE usuario = ?';
            const [result] = await executeQuery(query, [username]);
            return result.count > 0;
        } catch (error) {
            throw error;
        }
    }

    // Verificar si un paciente tiene cuenta de usuario válida
    static async hasValidAccount(usuarioId) {
        try {
            const query = 'SELECT usuario, contrasena FROM usuarios WHERE id = ?';
            const [result] = await executeQuery(query, [usuarioId]);
            
            if (!result) return false;
            
            // Un paciente tiene cuenta válida si tiene usuario y contraseña
            // (no son null/undefined y no están vacíos) Y no son temporales
            const hasValidUser = result.usuario && result.usuario.trim() !== '' && !result.usuario.startsWith('temp_');
            const hasValidPassword = result.contrasena && result.contrasena.trim() !== '' && !result.contrasena.startsWith('temp_password_');
            
            return hasValidUser && hasValidPassword;
        } catch (error) {
            throw error;
        }
    }

    // Crear cuenta de usuario para un paciente existente
    static async createAccountForPatient(usuarioId, usuarioData) {
        try {
            const hashedPassword = await bcrypt.hash(usuarioData.contrasena, 10);
            
            const query = `
                UPDATE usuarios 
                SET usuario = ?, contrasena = ?
                WHERE id = ?
            `;
            
            const result = await executeQuery(query, [usuarioData.usuario, hashedPassword, usuarioId]);
            return result.affectedRows > 0;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = Usuario;