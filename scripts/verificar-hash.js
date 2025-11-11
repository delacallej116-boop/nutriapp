/**
 * Script para verificar el hash de contraseña de un usuario
 * Ejecutar con: node scripts/verificar-hash.js <usuario>
 */

const { executeQuery } = require('../config/db');
require('dotenv').config();

async function verificarHash(usuario) {
    console.log('🔍 VERIFICANDO HASH DE CONTRASEÑA');
    console.log('='.repeat(50));
    console.log(`Usuario: ${usuario}`);
    console.log('');

    try {
        const query = 'SELECT id, nombre, usuario, contrasena, LENGTH(contrasena) as longitud FROM profesionales WHERE usuario = ?';
        const resultados = await executeQuery(query, [usuario]);

        if (resultados.length === 0) {
            console.log('❌ No se encontró ningún profesional con ese usuario');
            process.exit(1);
        }

        const profesional = resultados[0];
        console.log(`✅ Profesional: ${profesional.nombre} (ID: ${profesional.id})`);
        console.log('');

        if (!profesional.contrasena) {
            console.log('❌ El profesional NO tiene contraseña almacenada');
            console.log('   Necesitas establecer una contraseña usando:');
            console.log(`   node scripts/resetear-contraseña.js ${usuario} nueva-contraseña`);
            process.exit(1);
        }

        console.log('📊 Información del Hash:');
        console.log(`   Longitud: ${profesional.longitud} caracteres`);
        console.log(`   Primeros 30 caracteres: ${profesional.contrasena.substring(0, 30)}...`);
        console.log('');

        // Verificar formato
        const esHashValido = profesional.contrasena.startsWith('$2a$') || 
                            profesional.contrasena.startsWith('$2b$') || 
                            profesional.contrasena.startsWith('$2y$');

        console.log('🔍 Análisis del Hash:');
        if (esHashValido) {
            console.log('✅ Formato: Hash de bcrypt válido');
            
            // Extraer información del hash
            const partes = profesional.contrasena.split('$');
            if (partes.length >= 3) {
                console.log(`   Versión: ${partes[1]}`);
                console.log(`   Cost: ${partes[2].substring(0, 2)}`);
            }
        } else {
            console.log('❌ Formato: NO es un hash de bcrypt válido');
            console.log('   Un hash de bcrypt válido debe:');
            console.log('   - Tener 60 caracteres');
            console.log('   - Empezar con $2a$, $2b$ o $2y$');
            console.log('');
            console.log('⚠️ ESTE ES EL PROBLEMA: El hash no es válido');
            console.log('   Por eso el login falla aunque la contraseña sea correcta');
        }

        if (profesional.longitud !== 60) {
            console.log('');
            console.log('⚠️ ADVERTENCIA: La longitud del hash no es 60 caracteres');
            console.log(`   Longitud esperada: 60`);
            console.log(`   Longitud actual: ${profesional.longitud}`);
            console.log('   Esto indica que el hash está corrupto o no es de bcrypt');
        }

        console.log('');
        console.log('💡 Solución:');
        if (!esHashValido || profesional.longitud !== 60) {
            console.log('   Ejecuta este comando para resetear la contraseña:');
            console.log(`   node scripts/resetear-contraseña.js ${usuario} tu-nueva-contraseña`);
        } else {
            console.log('   El hash parece estar bien formado.');
            console.log('   Si el login sigue fallando, verifica que estés ingresando la contraseña correcta.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

const usuario = process.argv[2];

if (!usuario) {
    console.log('❌ Uso: node scripts/verificar-hash.js <usuario>');
    console.log('');
    console.log('Ejemplo:');
    console.log('   node scripts/verificar-hash.js AlexisAllendez83');
    process.exit(1);
}

verificarHash(usuario)
    .then(() => {
        console.log('');
        process.exit(0);
    })
    .catch(error => {
        console.error('Error fatal:', error);
        process.exit(1);
    });

