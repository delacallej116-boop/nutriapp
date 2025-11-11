/**
 * Script de diagnóstico para problemas de login
 * Ejecutar con: node scripts/diagnostico-login.js <usuario>
 */

const { executeQuery } = require('../config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function diagnosticarLogin(usuario) {
    console.log('🔍 DIAGNÓSTICO DE LOGIN');
    console.log('='.repeat(50));
    console.log(`Usuario a verificar: ${usuario}`);
    console.log('');

    try {
        // 1. Verificar conexión a la base de datos
        console.log('1️⃣ Verificando conexión a la base de datos...');
        try {
            const testQuery = 'SELECT 1 as test';
            await executeQuery(testQuery);
            console.log('✅ Conexión a la base de datos: OK');
        } catch (error) {
            console.log('❌ Error de conexión a la base de datos:', error.message);
            return;
        }
        console.log('');

        // 2. Buscar el profesional
        console.log('2️⃣ Buscando profesional en la base de datos...');
        const query = 'SELECT * FROM profesionales WHERE usuario = ?';
        const resultados = await executeQuery(query, [usuario]);

        if (resultados.length === 0) {
            console.log('❌ No se encontró ningún profesional con ese usuario');
            console.log('');
            console.log('💡 Verificando si hay profesionales en la base de datos...');
            const todosProfesionales = await executeQuery('SELECT id, nombre, usuario, email FROM profesionales LIMIT 10');
            if (todosProfesionales.length === 0) {
                console.log('❌ No hay profesionales registrados en la base de datos');
            } else {
                console.log(`✅ Se encontraron ${todosProfesionales.length} profesional(es):`);
                todosProfesionales.forEach(p => {
                    console.log(`   - ID: ${p.id}, Usuario: "${p.usuario}", Nombre: ${p.nombre}`);
                });
            }
            return;
        }

        const profesional = resultados[0];
        console.log('✅ Profesional encontrado:');
        console.log(`   - ID: ${profesional.id}`);
        console.log(`   - Nombre: ${profesional.nombre}`);
        console.log(`   - Usuario: "${profesional.usuario}"`);
        console.log(`   - Email: ${profesional.email || 'No definido'}`);
        console.log(`   - Tiene contraseña: ${profesional.contrasena ? 'Sí' : 'No'}`);
        console.log(`   - Longitud de hash: ${profesional.contrasena ? profesional.contrasena.length : 0} caracteres`);
        console.log('');

        // 3. Verificar formato del hash
        console.log('3️⃣ Verificando formato del hash de contraseña...');
        if (!profesional.contrasena) {
            console.log('❌ El profesional no tiene contraseña almacenada');
            console.log('💡 Necesitas establecer una contraseña para este profesional');
            return;
        }

        // Verificar si es un hash de bcrypt válido
        const esHashValido = profesional.contrasena.startsWith('$2a$') || 
                            profesional.contrasena.startsWith('$2b$') || 
                            profesional.contrasena.startsWith('$2y$');
        
        if (esHashValido) {
            console.log('✅ El hash parece ser un hash de bcrypt válido');
        } else {
            console.log('⚠️ El hash no parece ser un hash de bcrypt válido');
            console.log('   Esto podría indicar que la contraseña no fue hasheada correctamente');
        }
        console.log('');

        // 4. Probar con una contraseña de prueba
        console.log('4️⃣ Para probar la contraseña, ejecuta:');
        console.log(`   node scripts/probar-contraseña.js "${usuario}" "tu-contraseña"`);
        console.log('');

        // 5. Información adicional
        console.log('5️⃣ Información adicional:');
        console.log(`   - Creado en: ${profesional.creado_en || 'No disponible'}`);
        console.log(`   - Timezone: ${profesional.timezone || 'No definido'}`);
        console.log('');

        console.log('='.repeat(50));
        console.log('✅ Diagnóstico completado');

    } catch (error) {
        console.error('❌ Error durante el diagnóstico:', error);
        console.error('Stack trace:', error.stack);
    }
}

// Obtener usuario de los argumentos de línea de comandos
const usuario = process.argv[2];

if (!usuario) {
    console.log('❌ Uso: node scripts/diagnostico-login.js <usuario>');
    console.log('');
    console.log('Ejemplo:');
    console.log('   node scripts/diagnostico-login.js admin');
    process.exit(1);
}

diagnosticarLogin(usuario)
    .then(() => {
        console.log('');
        process.exit(0);
    })
    .catch(error => {
        console.error('Error fatal:', error);
        process.exit(1);
    });

