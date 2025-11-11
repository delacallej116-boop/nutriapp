/**
 * Script para probar una contraseña contra un usuario
 * Ejecutar con: node scripts/probar-contraseña.js <usuario> <contraseña>
 */

const { executeQuery } = require('../config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function probarContraseña(usuario, contraseña) {
    console.log('🔐 PROBANDO CONTRASEÑA');
    console.log('='.repeat(50));
    console.log(`Usuario: ${usuario}`);
    console.log(`Contraseña proporcionada: ${'*'.repeat(contraseña.length)}`);
    console.log('');

    try {
        // Buscar el profesional
        const query = 'SELECT * FROM profesionales WHERE usuario = ?';
        const resultados = await executeQuery(query, [usuario]);

        if (resultados.length === 0) {
            console.log('❌ No se encontró ningún profesional con ese usuario');
            process.exit(1);
        }

        const profesional = resultados[0];
        console.log(`✅ Profesional encontrado: ${profesional.nombre}`);
        console.log('');

        if (!profesional.contrasena) {
            console.log('❌ El profesional no tiene contraseña almacenada');
            process.exit(1);
        }

        // Comparar contraseñas
        console.log('🔐 Comparando contraseñas...');
        const esValida = await bcrypt.compare(contraseña, profesional.contrasena);

        console.log('');
        if (esValida) {
            console.log('✅ ¡CONTRASEÑA CORRECTA!');
            console.log('   La contraseña coincide con el hash almacenado');
        } else {
            console.log('❌ CONTRASEÑA INCORRECTA');
            console.log('   La contraseña NO coincide con el hash almacenado');
            console.log('');
            console.log('💡 Posibles causas:');
            console.log('   1. La contraseña ingresada es incorrecta');
            console.log('   2. La contraseña fue cambiada y no se actualizó correctamente');
            console.log('   3. El hash en la base de datos está corrupto');
        }

    } catch (error) {
        console.error('❌ Error durante la prueba:', error);
        console.error('Stack trace:', error.stack);
        process.exit(1);
    }
}

// Obtener argumentos
const usuario = process.argv[2];
const contraseña = process.argv[3];

if (!usuario || !contraseña) {
    console.log('❌ Uso: node scripts/probar-contraseña.js <usuario> <contraseña>');
    console.log('');
    console.log('Ejemplo:');
    console.log('   node scripts/probar-contraseña.js admin miPassword123');
    process.exit(1);
}

probarContraseña(usuario, contraseña)
    .then(() => {
        console.log('');
        process.exit(0);
    })
    .catch(error => {
        console.error('Error fatal:', error);
        process.exit(1);
    });

