/**
 * Script para resetear la contraseña de un profesional
 * Ejecutar con: node scripts/resetear-contraseña.js <usuario> <nueva-contraseña>
 */

const { executeQuery } = require('../config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function resetearContraseña(usuario, nuevaContraseña) {
    console.log('🔐 RESETEANDO CONTRASEÑA');
    console.log('='.repeat(50));
    console.log(`Usuario: ${usuario}`);
    console.log(`Nueva contraseña: ${'*'.repeat(nuevaContraseña.length)}`);
    console.log('');

    try {
        // 1. Verificar que el usuario existe
        console.log('1️⃣ Verificando que el usuario existe...');
        const query = 'SELECT * FROM profesionales WHERE usuario = ?';
        const resultados = await executeQuery(query, [usuario]);

        if (resultados.length === 0) {
            console.log('❌ No se encontró ningún profesional con ese usuario');
            process.exit(1);
        }

        const profesional = resultados[0];
        console.log(`✅ Profesional encontrado: ${profesional.nombre} (ID: ${profesional.id})`);
        console.log('');

        // 2. Verificar el hash actual
        console.log('2️⃣ Verificando hash actual...');
        if (profesional.contrasena) {
            console.log(`   Longitud actual: ${profesional.contrasena.length} caracteres`);
            console.log(`   Formato: ${profesional.contrasena.substring(0, 4)}...`);
            
            const esHashValido = profesional.contrasena.startsWith('$2a$') || 
                                profesional.contrasena.startsWith('$2b$') || 
                                profesional.contrasena.startsWith('$2y$');
            
            if (!esHashValido) {
                console.log('⚠️ El hash actual NO es un hash de bcrypt válido');
                console.log('   Esto explica por qué el login falla');
            } else {
                console.log('✅ El hash actual parece ser válido');
            }
        } else {
            console.log('⚠️ El profesional no tiene contraseña configurada');
        }
        console.log('');

        // 3. Generar nuevo hash
        console.log('3️⃣ Generando nuevo hash de contraseña...');
        const nuevoHash = await bcrypt.hash(nuevaContraseña, 10);
        console.log(`✅ Hash generado: ${nuevoHash.substring(0, 20)}... (${nuevoHash.length} caracteres)`);
        console.log('');

        // 4. Actualizar en la base de datos
        console.log('4️⃣ Actualizando contraseña en la base de datos...');
        const updateQuery = 'UPDATE profesionales SET contrasena = ? WHERE usuario = ?';
        const updateResult = await executeQuery(updateQuery, [nuevoHash, usuario]);

        if (updateResult.affectedRows > 0) {
            console.log('✅ Contraseña actualizada exitosamente');
        } else {
            console.log('❌ No se pudo actualizar la contraseña');
            process.exit(1);
        }
        console.log('');

        // 5. Verificar que funciona
        console.log('5️⃣ Verificando que la nueva contraseña funciona...');
        const profesionalActualizado = await executeQuery(query, [usuario]);
        const esValida = await bcrypt.compare(nuevaContraseña, profesionalActualizado[0].contrasena);

        if (esValida) {
            console.log('✅ ¡La nueva contraseña funciona correctamente!');
        } else {
            console.log('❌ Error: La nueva contraseña no funciona (esto no debería pasar)');
            process.exit(1);
        }
        console.log('');

        console.log('='.repeat(50));
        console.log('✅ Proceso completado exitosamente');
        console.log('');
        console.log('💡 Ahora puedes hacer login con:');
        console.log(`   Usuario: ${usuario}`);
        console.log(`   Contraseña: ${nuevaContraseña}`);

    } catch (error) {
        console.error('❌ Error durante el proceso:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Obtener argumentos
const usuario = process.argv[2];
const nuevaContraseña = process.argv[3];

if (!usuario || !nuevaContraseña) {
    console.log('❌ Uso: node scripts/resetear-contraseña.js <usuario> <nueva-contraseña>');
    console.log('');
    console.log('Ejemplo:');
    console.log('   node scripts/resetear-contraseña.js AlexisAllendez83 miNuevaPassword123');
    console.log('');
    console.log('⚠️ IMPORTANTE: Este script resetea la contraseña sin verificar la anterior');
    process.exit(1);
}

if (nuevaContraseña.length < 6) {
    console.log('❌ La contraseña debe tener al menos 6 caracteres');
    process.exit(1);
}

resetearContraseña(usuario, nuevaContraseña)
    .then(() => {
        console.log('');
        process.exit(0);
    })
    .catch(error => {
        console.error('Error fatal:', error);
        process.exit(1);
    });

