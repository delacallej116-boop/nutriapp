/**
 * Script para insertar consultas de prueba en la base de datos
 * 
 * Este script crea 7 o más consultas con diferentes fechas y estados
 * para poder visualizarlas en la agenda.
 * 
 * Uso: node scripts/insertar-consultas-prueba.js
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nutricionista_app',
    port: process.env.DB_PORT || 3308,
    timezone: 'Z'
};

// Generar código de cancelación único
function generateCancelCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'CAN-';
    
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    code += '-';
    for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    
    return code;
}

// Obtener un profesional existente
async function getProfesional(connection) {
    const [rows] = await connection.execute('SELECT id, nombre FROM profesionales LIMIT 1');
    if (rows.length === 0) {
        throw new Error('No se encontró ningún profesional en la base de datos. Por favor, crea un profesional primero.');
    }
    return rows[0];
}

// Obtener usuarios existentes
async function getUsuarios(connection, profesionalId) {
    const [rows] = await connection.execute(
        'SELECT id, apellido_nombre FROM usuarios WHERE profesional_id = ? AND activo = 1 LIMIT 5',
        [profesionalId]
    );
    return rows;
}

// Insertar consultas de prueba
async function insertarConsultas() {
    let connection;
    
    try {
        console.log('🔄 Conectando a la base de datos...');
        connection = await mysql.createConnection(dbConfig);
        console.log('✅ Conexión establecida\n');

        // Obtener profesional
        console.log('📋 Obteniendo profesional...');
        const profesional = await getProfesional(connection);
        console.log(`✅ Profesional encontrado: ${profesional.nombre} (ID: ${profesional.id})\n`);

        // Obtener usuarios
        console.log('👥 Obteniendo pacientes...');
        const usuarios = await getUsuarios(connection, profesional.id);
        console.log(`✅ ${usuarios.length} paciente(s) encontrado(s)\n`);

        // Si no hay usuarios, usaremos pacientes externos
        const usarPacientesExternos = usuarios.length === 0;
        
        if (usarPacientesExternos) {
            console.log('⚠️  No se encontraron usuarios registrados. Se crearán consultas con pacientes externos.\n');
        }

        // Definir consultas de prueba
        const hoy = new Date();
        const consultas = [
            {
                // Hoy - mañana
                fecha: new Date(hoy.getTime() + 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                hora: '09:00:00',
                estado: 'activo',
                objetivo: 'perdida_peso',
                motivo: 'Primera consulta - Evaluación inicial',
                paciente: usuarios[0] || null,
                pacienteExterno: usarPacientesExternos ? {
                    nombre: 'María González',
                    telefono: '11-1234-5678',
                    email: 'maria.gonzalez@email.com'
                } : null
            },
            {
                // Hoy + 2 días
                fecha: new Date(hoy.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                hora: '10:30:00',
                estado: 'activo',
                objetivo: 'ganancia_masa',
                motivo: 'Control de seguimiento',
                paciente: usuarios[1] || null,
                pacienteExterno: usarPacientesExternos ? {
                    nombre: 'Juan Pérez',
                    telefono: '11-2345-6789',
                    email: 'juan.perez@email.com'
                } : null
            },
            {
                // Hoy + 3 días
                fecha: new Date(hoy.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                hora: '14:00:00',
                estado: 'activo',
                objetivo: 'salud',
                motivo: 'Consulta de rutina',
                paciente: usuarios[2] || usuarios[0] || null,
                pacienteExterno: usarPacientesExternos ? {
                    nombre: 'Ana Martínez',
                    telefono: '11-3456-7890',
                    email: 'ana.martinez@email.com'
                } : null
            },
            {
                // Hoy + 4 días
                fecha: new Date(hoy.getTime() + 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                hora: '16:00:00',
                estado: 'activo',
                objetivo: 'rendimiento',
                motivo: 'Evaluación deportiva',
                paciente: usuarios[3] || usuarios[1] || usuarios[0] || null,
                pacienteExterno: usarPacientesExternos ? {
                    nombre: 'Carlos Rodríguez',
                    telefono: '11-4567-8901',
                    email: 'carlos.rodriguez@email.com'
                } : null
            },
            {
                // Hoy + 5 días
                fecha: new Date(hoy.getTime() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                hora: '11:00:00',
                estado: 'activo',
                objetivo: 'otro',
                motivo: 'Consulta nutricional general',
                paciente: usuarios[4] || usuarios[2] || usuarios[0] || null,
                pacienteExterno: usarPacientesExternos ? {
                    nombre: 'Laura Fernández',
                    telefono: '11-5678-9012',
                    email: 'laura.fernandez@email.com'
                } : null
            },
            {
                // Hoy + 6 días
                fecha: new Date(hoy.getTime() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                hora: '15:30:00',
                estado: 'activo',
                objetivo: 'perdida_peso',
                motivo: 'Control mensual',
                paciente: usuarios[0] || null,
                pacienteExterno: usarPacientesExternos ? {
                    nombre: 'Pedro Sánchez',
                    telefono: '11-6789-0123',
                    email: 'pedro.sanchez@email.com'
                } : null
            },
            {
                // Hoy + 7 días
                fecha: new Date(hoy.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                hora: '09:30:00',
                estado: 'activo',
                objetivo: 'salud',
                motivo: 'Primera consulta - Nueva paciente',
                paciente: usuarios[1] || usuarios[0] || null,
                pacienteExterno: usarPacientesExternos ? {
                    nombre: 'Sofía López',
                    telefono: '11-7890-1234',
                    email: 'sofia.lopez@email.com'
                } : null
            },
            {
                // Hoy (si es antes de las 18:00)
                fecha: hoy.toISOString().split('T')[0],
                hora: '18:00:00',
                estado: 'activo',
                objetivo: 'perdida_peso',
                motivo: 'Consulta de última hora',
                paciente: usuarios[2] || usuarios[0] || null,
                pacienteExterno: usarPacientesExternos ? {
                    nombre: 'Diego Torres',
                    telefono: '11-8901-2345',
                    email: 'diego.torres@email.com'
                } : null
            }
        ];

        console.log('📝 Insertando consultas de prueba...\n');

        let insertadas = 0;
        let errores = 0;

        for (const consulta of consultas) {
            try {
                const codigoCancelacion = generateCancelCode();
                
                // Verificar que el código no exista
                let codigoUnico = codigoCancelacion;
                let intentos = 0;
                while (intentos < 10) {
                    const [existentes] = await connection.execute(
                        'SELECT id FROM consultas WHERE codigo_cancelacion = ?',
                        [codigoUnico]
                    );
                    if (existentes.length === 0) break;
                    codigoUnico = generateCancelCode();
                    intentos++;
                }

                if (usarPacientesExternos) {
                    // Insertar con paciente externo
                    const query = `
                        INSERT INTO consultas (
                            usuario_id, profesional_id, fecha, hora, codigo_cancelacion,
                            estado, objetivo, motivo_consulta,
                            paciente_externo_nombre, paciente_externo_telefono, paciente_externo_email
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    await connection.execute(query, [
                        null, // usuario_id es NULL para pacientes externos
                        profesional.id,
                        consulta.fecha,
                        consulta.hora,
                        codigoUnico,
                        consulta.estado,
                        consulta.objetivo,
                        consulta.motivo,
                        consulta.pacienteExterno.nombre,
                        consulta.pacienteExterno.telefono,
                        consulta.pacienteExterno.email
                    ]);
                    
                    console.log(`✅ Consulta insertada: ${consulta.pacienteExterno.nombre} - ${consulta.fecha} ${consulta.hora}`);
                } else {
                    // Insertar con usuario registrado
                    const query = `
                        INSERT INTO consultas (
                            usuario_id, profesional_id, fecha, hora, codigo_cancelacion,
                            estado, objetivo, motivo_consulta
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    `;
                    
                    await connection.execute(query, [
                        consulta.paciente.id,
                        profesional.id,
                        consulta.fecha,
                        consulta.hora,
                        codigoUnico,
                        consulta.estado,
                        consulta.objetivo,
                        consulta.motivo
                    ]);
                    
                    console.log(`✅ Consulta insertada: ${consulta.paciente.apellido_nombre} - ${consulta.fecha} ${consulta.hora}`);
                }
                
                insertadas++;
            } catch (error) {
                console.error(`❌ Error insertando consulta para ${consulta.fecha} ${consulta.hora}:`, error.message);
                errores++;
            }
        }

        console.log(`\n📊 Resumen:`);
        console.log(`   ✅ Consultas insertadas: ${insertadas}`);
        console.log(`   ❌ Errores: ${errores}`);
        console.log(`\n✨ ¡Proceso completado! Las consultas ya están disponibles en la agenda.`);

    } catch (error) {
        console.error('❌ Error en el script:', error.message);
        if (error.stack) {
            console.error('Stack trace:', error.stack);
        }
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('\n🔌 Conexión cerrada');
        }
    }
}

// Ejecutar el script
if (require.main === module) {
    insertarConsultas()
        .then(() => {
            console.log('\n✅ Script ejecutado exitosamente');
            process.exit(0);
        })
        .catch((error) => {
            console.error('\n❌ Error fatal:', error);
            process.exit(1);
        });
}

module.exports = { insertarConsultas };

