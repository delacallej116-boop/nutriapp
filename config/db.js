const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la conexión a la base de datos
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'nutricionista_app',
    port: process.env.DB_PORT || 3308,
    timezone: 'Z',
    multipleStatements: false,
    connectionLimit: 10,
    queueLimit: 0
};

// Configuración sin base de datos para crear la BD
const dbConfigWithoutDB = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    port: process.env.DB_PORT || 3306,
    charset: 'utf8mb4',
    timezone: 'Z',
    multipleStatements: true
};

// Crear pool de conexiones
let pool;

// Función para inicializar la base de datos y tablas
const initializeDatabase = async () => {
    let connection;
    
    try {
        console.log('🔄 Inicializando base de datos...');
        
        // Conectar sin especificar base de datos
        connection = await mysql.createConnection(dbConfigWithoutDB);
        console.log('✅ Conexión a MySQL establecida');
        
        // Crear la base de datos si no existe
        await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
        console.log('✅ Base de datos verificada/creada');
        
        // Usar la base de datos
        await connection.query(`USE ${dbConfig.database}`);
        console.log('✅ Base de datos seleccionada');
        
        // Verificar si las tablas existen
        const [tables] = await connection.query(`SHOW TABLES`);
        const tableNames = tables.map(row => Object.values(row)[0]);
        
        console.log(`📊 Tablas encontradas: ${tableNames.length}`);
        
        // Si no hay tablas, crearlas
        if (tableNames.length === 0) {
            console.log('🔄 Creando tablas...');
            await createAllTables(connection);
            console.log('✅ Todas las tablas creadas exitosamente');
        } else {
            console.log('✅ Tablas ya existen, verificando estructura...');
            await verifyTablesStructure(connection);
        }
        
        await connection.end();
        
        // Ahora crear el pool con la base de datos
        pool = mysql.createPool(dbConfig);
        console.log('✅ Pool de conexiones creado');
        
        return true;
        
    } catch (error) {
        console.error('❌ Error inicializando base de datos:', error.message);
        if (connection) {
            await connection.end();
        }
        throw error;
    }
};

// Función para crear todas las tablas
const createAllTables = async (connection) => {
    const tables = [
        {
            name: 'profesionales',
            sql: `
                CREATE TABLE profesionales (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL,
                    usuario VARCHAR(50) NOT NULL UNIQUE,
                    email VARCHAR(150),
                    telefono VARCHAR(30),
                    contrasena VARCHAR(255) NOT NULL,
                    timezone VARCHAR(50) DEFAULT 'UTC',
                    especialidad VARCHAR(100),
                    matricula VARCHAR(50),
                    experiencia VARCHAR(20),
                    descripcion TEXT,
                    clave_registro_usada VARCHAR(100),
                    rol ENUM('profesional') DEFAULT 'profesional',
                    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `
        },
        {
            name: 'usuarios',
            sql: `
                CREATE TABLE usuarios (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    profesional_id INT NOT NULL,
                    numero_documento VARCHAR(50) UNIQUE,
                    tipo_documento VARCHAR(50),
                    numero_historia_clinica VARCHAR(50) UNIQUE,
                    apellido_nombre VARCHAR(150) NOT NULL,
                    usuario VARCHAR(50) NOT NULL UNIQUE,
                    email VARCHAR(150),
                    telefono VARCHAR(30),
                    fecha_ingreso DATE,
                    fecha_baja DATE,
                    fecha_nacimiento DATE,
                    domicilio VARCHAR(150),
                    localidad VARCHAR(100),
                    obra_social VARCHAR(100),
                    numero_afiliado VARCHAR(50),
                    sexo ENUM('Masculino','Femenino','Otro'),
                    grupo_sanguineo VARCHAR(5),
                    estado_civil VARCHAR(50),
                    ocupacion VARCHAR(100),
                    contrasena VARCHAR(255) NOT NULL,
                    rol ENUM('paciente') DEFAULT 'paciente',
                    activo BOOLEAN DEFAULT TRUE,
                    observaciones TEXT,
                    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE
                )
            `
        },
        {
            name: 'horarios_disponibles',
            sql: `
                CREATE TABLE horarios_disponibles (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    profesional_id INT NOT NULL,
                    dia_semana ENUM('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo') NOT NULL,
                    hora_inicio TIME NOT NULL,
                    hora_fin TIME NOT NULL,
                    duracion_minutos INT NOT NULL DEFAULT 30,
                    activo BOOLEAN DEFAULT TRUE,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
                    CONSTRAINT check_horas CHECK (hora_fin > hora_inicio),
                    CONSTRAINT unique_horario UNIQUE (profesional_id, dia_semana, hora_inicio, hora_fin)
                )
            `
        },
        {
            name: 'excepciones_horarios',
            sql: `
                CREATE TABLE excepciones_horarios (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    profesional_id INT NOT NULL,
                    fecha DATE NOT NULL,
                    motivo VARCHAR(255),
                    activo BOOLEAN DEFAULT TRUE,
                    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
                    UNIQUE (profesional_id, fecha)
                )
            `
        },
        {
            name: 'consultas',
            sql: `
                CREATE TABLE consultas (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    profesional_id INT NOT NULL,
                    fecha DATE NOT NULL,
                    hora TIME NOT NULL,
                    codigo_cancelacion VARCHAR(100) NOT NULL UNIQUE,
                    estado ENUM('activo', 'completado', 'cancelado', 'ausente') DEFAULT 'activo',
                    peso DECIMAL(5,2),
                    altura DECIMAL(5,2),
                    objetivo ENUM('perdida_peso', 'ganancia_masa', 'salud', 'rendimiento', 'otro') NOT NULL,
                    condiciones_medicas TEXT,
                    notas_profesional TEXT,
                    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
                    INDEX idx_fecha_hora (fecha, hora),
                    INDEX idx_profesional_fecha (profesional_id, fecha)
                )
            `
        },
        {
            name: 'antecedentes',
            sql: `
                CREATE TABLE antecedentes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    antecedentes_personales TEXT,
                    antecedentes_familiares TEXT,
                    alergias TEXT,
                    medicamentos_habituales TEXT,
                    cirugias TEXT,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
                )
            `
        },
        {
            name: 'antropometria',
            sql: `
                CREATE TABLE antropometria (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    fecha DATE NOT NULL,
                    peso DECIMAL(5,2),
                    altura DECIMAL(5,2),
                    imc DECIMAL(5,2),
                    cintura DECIMAL(5,2),
                    cadera DECIMAL(5,2),
                    pliegue_tricipital DECIMAL(5,2),
                    pliegue_subescapular DECIMAL(5,2),
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
                )
            `
        },
        {
            name: 'evoluciones',
            sql: `
                CREATE TABLE evoluciones (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    profesional_id INT NOT NULL,
                    fecha DATE NOT NULL,
                    observacion TEXT,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE
                )
            `
        },
        {
            name: 'planes_alimentacion',
            sql: `
                CREATE TABLE planes_alimentacion (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    profesional_id INT NOT NULL,
                    fecha_inicio DATE NOT NULL,
                    fecha_fin DATE,
                    descripcion TEXT,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE
                )
            `
        },
        {
            name: 'historia_clinica_resumen',
            sql: `
                CREATE TABLE historia_clinica_resumen (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL UNIQUE,
                    profesional_id INT NOT NULL,
                    total_consultas INT DEFAULT 0,
                    ultima_consulta DATETIME NULL,
                    proxima_consulta DATETIME NULL,
                    total_mediciones INT DEFAULT 0,
                    ultima_medicion DATETIME NULL,
                    peso_actual DECIMAL(5,2) NULL,
                    altura_actual DECIMAL(5,2) NULL,
                    imc_actual DECIMAL(5,2) NULL,
                    total_planes INT DEFAULT 0,
                    plan_activo_id INT NULL,
                    plan_activo_fecha_inicio DATE NULL,
                    total_documentos INT DEFAULT 0,
                    ultimo_documento DATETIME NULL,
                    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
                    FOREIGN KEY (plan_activo_id) REFERENCES planes_alimentacion(id) ON DELETE SET NULL,
                    INDEX idx_profesional (profesional_id),
                    INDEX idx_ultima_consulta (ultima_consulta),
                    INDEX idx_proxima_consulta (proxima_consulta)
                )
            `
        }
    ];
    
        for (const table of tables) {
            try {
                await connection.query(table.sql);
                console.log(`✅ Tabla ${table.name} creada`);
            } catch (error) {
                console.error(`❌ Error creando tabla ${table.name}:`, error.message);
                throw error;
            }
        }
};

// Función para crear solo las tablas faltantes
const createMissingTables = async (connection, missingTables) => {
    const allTables = [
        {
            name: 'profesionales',
            sql: `
                CREATE TABLE profesionales (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    nombre VARCHAR(100) NOT NULL,
                    usuario VARCHAR(50) NOT NULL UNIQUE,
                    email VARCHAR(150),
                    telefono VARCHAR(30),
                    contrasena VARCHAR(255) NOT NULL,
                    timezone VARCHAR(50) DEFAULT 'UTC',
                    especialidad VARCHAR(100),
                    matricula VARCHAR(50),
                    experiencia VARCHAR(20),
                    descripcion TEXT,
                    clave_registro_usada VARCHAR(100),
                    rol ENUM('profesional') DEFAULT 'profesional',
                    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `
        },
        {
            name: 'usuarios',
            sql: `
                CREATE TABLE usuarios (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    profesional_id INT NOT NULL,
                    numero_documento VARCHAR(50) UNIQUE,
                    tipo_documento VARCHAR(50),
                    numero_historia_clinica VARCHAR(50) UNIQUE,
                    apellido_nombre VARCHAR(150) NOT NULL,
                    usuario VARCHAR(50) NOT NULL UNIQUE,
                    email VARCHAR(150),
                    telefono VARCHAR(30),
                    fecha_ingreso DATE,
                    fecha_baja DATE,
                    fecha_nacimiento DATE,
                    domicilio VARCHAR(150),
                    localidad VARCHAR(100),
                    obra_social VARCHAR(100),
                    numero_afiliado VARCHAR(50),
                    sexo ENUM('Masculino','Femenino','Otro'),
                    grupo_sanguineo VARCHAR(5),
                    estado_civil VARCHAR(50),
                    ocupacion VARCHAR(100),
                    contrasena VARCHAR(255) NOT NULL,
                    rol ENUM('paciente') DEFAULT 'paciente',
                    activo BOOLEAN DEFAULT TRUE,
                    observaciones TEXT,
                    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE
                )
            `
        },
        {
            name: 'horarios_disponibles',
            sql: `
                CREATE TABLE horarios_disponibles (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    profesional_id INT NOT NULL,
                    dia_semana ENUM('Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo') NOT NULL,
                    hora_inicio TIME NOT NULL,
                    hora_fin TIME NOT NULL,
                    activo BOOLEAN DEFAULT TRUE,
                    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE
                )
            `
        },
        {
            name: 'excepciones_horarios',
            sql: `
                CREATE TABLE excepciones_horarios (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    profesional_id INT NOT NULL,
                    fecha DATE NOT NULL,
                    hora_inicio TIME,
                    hora_fin TIME,
                    motivo VARCHAR(255),
                    tipo ENUM('disponible', 'no_disponible') NOT NULL,
                    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE
                )
            `
        },
        {
            name: 'consultas',
            sql: `
                CREATE TABLE consultas (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    profesional_id INT NOT NULL,
                    usuario_id INT NOT NULL,
                    fecha_hora DATETIME NOT NULL,
                    tipo ENUM('primera_vez', 'seguimiento', 'control') NOT NULL,
                    motivo TEXT,
                    observaciones TEXT,
                    estado ENUM('programada', 'realizada', 'cancelada', 'reprogramada') DEFAULT 'programada',
                    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
                )
            `
        },
        {
            name: 'antecedentes',
            sql: `
                CREATE TABLE antecedentes (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    tipo ENUM('medico', 'quirurgico', 'familiar', 'alergico', 'medicamento') NOT NULL,
                    descripcion TEXT NOT NULL,
                    fecha DATE,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
                )
            `
        },
        {
            name: 'antropometria',
            sql: `
                CREATE TABLE antropometria (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    consulta_id INT,
                    peso DECIMAL(5,2),
                    talla DECIMAL(5,2),
                    imc DECIMAL(4,2),
                    circunferencia_cintura DECIMAL(5,2),
                    circunferencia_cadera DECIMAL(5,2),
                    porcentaje_grasa DECIMAL(4,2),
                    masa_muscular DECIMAL(5,2),
                    fecha_medicion DATE NOT NULL,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE SET NULL
                )
            `
        },
        {
            name: 'evoluciones',
            sql: `
                CREATE TABLE evoluciones (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    consulta_id INT,
                    peso_inicial DECIMAL(5,2),
                    peso_actual DECIMAL(5,2),
                    diferencia_peso DECIMAL(5,2),
                    observaciones TEXT,
                    recomendaciones TEXT,
                    proxima_cita DATE,
                    fecha_evolucion DATE NOT NULL,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    FOREIGN KEY (consulta_id) REFERENCES consultas(id) ON DELETE SET NULL
                )
            `
        },
        {
            name: 'planes_alimentacion',
            sql: `
                CREATE TABLE planes_alimentacion (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL,
                    profesional_id INT NOT NULL,
                    nombre_plan VARCHAR(100) NOT NULL,
                    descripcion TEXT,
                    calorias_diarias INT,
                    macronutrientes JSON,
                    alimentos_permitidos TEXT,
                    alimentos_restringidos TEXT,
                    observaciones TEXT,
                    fecha_inicio DATE NOT NULL,
                    fecha_fin DATE,
                    activo BOOLEAN DEFAULT TRUE,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE
                )
            `
        },
        {
            name: 'historia_clinica_resumen',
            sql: `
                CREATE TABLE historia_clinica_resumen (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    usuario_id INT NOT NULL UNIQUE,
                    profesional_id INT NOT NULL,
                    total_consultas INT DEFAULT 0,
                    ultima_consulta DATETIME NULL,
                    proxima_consulta DATETIME NULL,
                    total_mediciones INT DEFAULT 0,
                    ultima_medicion DATETIME NULL,
                    peso_actual DECIMAL(5,2) NULL,
                    altura_actual DECIMAL(5,2) NULL,
                    imc_actual DECIMAL(5,2) NULL,
                    total_planes INT DEFAULT 0,
                    plan_activo_id INT NULL,
                    plan_activo_fecha_inicio DATE NULL,
                    total_documentos INT DEFAULT 0,
                    ultimo_documento DATETIME NULL,
                    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
                    FOREIGN KEY (plan_activo_id) REFERENCES planes_alimentacion(id) ON DELETE SET NULL,
                    INDEX idx_profesional (profesional_id),
                    INDEX idx_ultima_consulta (ultima_consulta),
                    INDEX idx_proxima_consulta (proxima_consulta)
                )
            `
        }
    ];
    
    // Filtrar solo las tablas que faltan
    const tablesToCreate = allTables.filter(table => missingTables.includes(table.name));
    
    for (const table of tablesToCreate) {
        try {
            await connection.query(table.sql);
            console.log(`✅ Tabla ${table.name} creada`);
        } catch (error) {
            console.error(`❌ Error creando tabla ${table.name}:`, error.message);
            throw error;
        }
    }
};

// Función para verificar la estructura de las tablas
const verifyTablesStructure = async (connection) => {
    const requiredTables = [
        'profesionales', 'usuarios', 'horarios_disponibles', 'excepciones_horarios',
        'consultas', 'antecedentes', 'antropometria', 'evoluciones', 
        'planes_alimentacion', 'plan_comidas', 'laboratorios', 'resultados_laboratorio',
        'plan_asignaciones', 'historia_clinica_resumen'
    ];
    
    const [tables] = await connection.query(`SHOW TABLES`);
    const existingTables = tables.map(row => Object.values(row)[0]);
    
    const missingTables = requiredTables.filter(table => !existingTables.includes(table));
    
    if (missingTables.length > 0) {
        console.log(`⚠️ Faltan tablas: ${missingTables.join(', ')}`);
        console.log('🔄 Creando tablas faltantes...');
        await createMissingTables(connection, missingTables);
    } else {
        console.log('✅ Todas las tablas requeridas existen');
    }
};

// Función para probar la conexión
const testConnection = async () => {
    try {
        if (!pool) {
            await initializeDatabase();
        }
        
        const connection = await pool.getConnection();
        console.log('✅ Conexión a la base de datos establecida correctamente');
        console.log(`📊 Base de datos: ${dbConfig.database}`);
        console.log(`🌐 Host: ${dbConfig.host}:${dbConfig.port}`);
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error.message);
        return false;
    }
};

// Función para ejecutar consultas
const executeQuery = async (query, params = []) => {
    try {
        if (!pool) {
            await initializeDatabase();
        }
        const [results] = await pool.query(query, params);
        return results;
    } catch (error) {
        console.error('Error ejecutando consulta:', error.message);
        throw error;
    }
};

// Función para obtener una conexión del pool
const getConnection = async () => {
    try {
        if (!pool) {
            await initializeDatabase();
        }
        return await pool.getConnection();
    } catch (error) {
        console.error('Error obteniendo conexión:', error.message);
        throw error;
    }
};

// Función para cerrar el pool de conexiones
const closePool = async () => {
    try {
        if (pool) {
            await pool.end();
            console.log('🔒 Pool de conexiones cerrado correctamente');
        }
    } catch (error) {
        console.error('Error cerrando pool:', error.message);
        throw error;
    }
};

// Middleware para manejar errores de base de datos
const handleDatabaseError = (error, req, res, next) => {
    console.error('Database Error:', error);
    
    if (error.code === 'ER_DUP_ENTRY') {
        return res.status(400).json({
            success: false,
            message: 'El registro ya existe en la base de datos',
            error: 'DUPLICATE_ENTRY'
        });
    }
    
    if (error.code === 'ER_NO_REFERENCED_ROW_2') {
        return res.status(400).json({
            success: false,
            message: 'Referencia a registro inexistente',
            error: 'FOREIGN_KEY_CONSTRAINT'
        });
    }
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
        return res.status(500).json({
            success: false,
            message: 'Error de acceso a la base de datos',
            error: 'ACCESS_DENIED'
        });
    }
    
    // Error genérico
    res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : 'INTERNAL_SERVER_ERROR'
    });
};

module.exports = {
    pool: () => pool,
    executeQuery,
    getConnection,
    testConnection,
    closePool,
    handleDatabaseError,
    initializeDatabase
};
