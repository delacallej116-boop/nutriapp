-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS nutricionista_app
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE nutricionista_app;

------------------------------------------------
-- 1. Profesionales (nutricionistas)
------------------------------------------------
CREATE TABLE IF NOT EXISTS profesionales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(150),
    telefono VARCHAR(30),
    contrasena VARCHAR(255) NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC', -- configuración de zona horaria
    especialidad VARCHAR(100),
    matricula VARCHAR(50),
    experiencia VARCHAR(20),
    descripcion TEXT,
    clave_registro_usada VARCHAR(100), -- clave que usó para registrarse
    rol ENUM('profesional') DEFAULT 'profesional', -- rol del usuario (1 = profesional)
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP
);

------------------------------------------------
-- 2. Pacientes / Usuarios
------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profesional_id INT NOT NULL,
    numero_documento VARCHAR(50) UNIQUE,
    tipo_documento VARCHAR(50),
    numero_historia_clinica VARCHAR(50) UNIQUE,
    apellido_nombre VARCHAR(150) NOT NULL,
    usuario VARCHAR(50) NOT NULL UNIQUE, -- usuario único para login
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
    contrasena VARCHAR(255) NOT NULL, -- contraseña para login
    rol ENUM('paciente') DEFAULT 'paciente', -- rol del usuario (2 = paciente)
    activo BOOLEAN DEFAULT TRUE,
    observaciones TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE
);

------------------------------------------------
-- 3. Horarios disponibles
------------------------------------------------
CREATE TABLE IF NOT EXISTS horarios_disponibles (
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
);

------------------------------------------------
-- 4. Excepciones de horarios (días no trabajados, feriados, vacaciones)
------------------------------------------------
CREATE TABLE IF NOT EXISTS excepciones_horarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profesional_id INT NOT NULL,
    fecha DATE NOT NULL,
    motivo VARCHAR(255),
    activo BOOLEAN DEFAULT TRUE,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
    UNIQUE (profesional_id, fecha)
);

------------------------------------------------
-- 5. Consultas / Turnos
------------------------------------------------
CREATE TABLE IF NOT EXISTS consultas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL COMMENT 'ID del usuario registrado (NULL para pacientes externos)',
    profesional_id INT NOT NULL,
    fecha DATE NOT NULL COMMENT 'Fecha del turno/consulta',
    hora TIME NOT NULL COMMENT 'Hora del turno/consulta',
    codigo_cancelacion VARCHAR(100) NOT NULL UNIQUE,
    estado ENUM('activo', 'completado', 'cancelado', 'ausente') DEFAULT 'activo',
    objetivo ENUM('perdida_peso', 'ganancia_masa', 'salud', 'rendimiento', 'otro') NOT NULL,
    condiciones_medicas TEXT,
    notas_profesional TEXT,
    -- Campos para pacientes externos (no registrados)
    paciente_externo_nombre VARCHAR(255) NULL COMMENT 'Nombre completo del paciente externo',
    paciente_externo_telefono VARCHAR(50) NULL COMMENT 'Teléfono del paciente externo',
    paciente_externo_email VARCHAR(255) NULL COMMENT 'Email del paciente externo (opcional)',
    -- Campos adicionales para historia clínica
    fecha_consulta DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha y hora de creación del registro',
    motivo_consulta TEXT,
    evaluacion TEXT,
    plan_tratamiento TEXT,
    observaciones TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
    -- Constraint para asegurar que al menos uno de los dos esté presente
    CONSTRAINT chk_paciente_valido CHECK (
        (usuario_id IS NOT NULL AND paciente_externo_nombre IS NULL) OR 
        (usuario_id IS NULL AND paciente_externo_nombre IS NOT NULL)
    ),
    INDEX idx_fecha_hora (fecha, hora),
    INDEX idx_profesional_fecha (profesional_id, fecha),
    INDEX idx_fecha_consulta (fecha_consulta),
    INDEX idx_paciente_externo_nombre (paciente_externo_nombre)
);

------------------------------------------------
-- 6. Antecedentes médicos del paciente
------------------------------------------------
CREATE TABLE IF NOT EXISTS antecedentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    antecedentes_personales TEXT,
    antecedentes_familiares TEXT,
    alergias TEXT,
    medicamentos_habituales TEXT,
    cirugias TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

------------------------------------------------
-- 7. Evolución antropométrica
------------------------------------------------
CREATE TABLE IF NOT EXISTS antropometria (
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
    -- Campos adicionales para mediciones completas
    fecha_medicion DATETIME DEFAULT CURRENT_TIMESTAMP,
    circunferencia_cintura DECIMAL(5,2),
    circunferencia_cadera DECIMAL(5,2),
    porcentaje_grasa DECIMAL(5,2),
    masa_muscular DECIMAL(5,2),
    observaciones TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_fecha_medicion (fecha_medicion),
    INDEX idx_usuario_fecha (usuario_id, fecha)
);

------------------------------------------------
-- 8. Evoluciones / Notas de seguimiento
------------------------------------------------
CREATE TABLE IF NOT EXISTS evoluciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    profesional_id INT NOT NULL,
    fecha DATE NOT NULL,
    observacion TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE
);

------------------------------------------------
-- 9. Planes de alimentación
------------------------------------------------
CREATE TABLE IF NOT EXISTS planes_alimentacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    tipo ENUM('simple', 'intermedio') NOT NULL DEFAULT 'simple',
    usuario_id INT NULL,
    profesional_id INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE,
    descripcion TEXT,
    -- Campos adicionales para planes completos
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    objetivo VARCHAR(255),
    calorias_diarias INT,
    caracteristicas TEXT,
    observaciones TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
    INDEX idx_fecha_creacion (fecha_creacion),
    INDEX idx_activo (activo),
    INDEX idx_tipo (tipo)
);

-- -----------------------------------------------------
-- TABLA registros_comidas ELIMINADA: No se usa en el sistema
-- Funcionalidad prevista: Registro diario de comidas del paciente (no implementado)
-- -----------------------------------------------------

------------------------------------------------
-- 12. Resumen de Historia Clínica (Optimización)
------------------------------------------------
CREATE TABLE IF NOT EXISTS historia_clinica_resumen (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    profesional_id INT NOT NULL,
    -- Resumen de estadísticas
    total_consultas INT DEFAULT 0,
    ultima_consulta DATETIME NULL,
    proxima_consulta DATETIME NULL,
    total_mediciones INT DEFAULT 0,
    ultima_medicion DATETIME NULL,
    peso_actual DECIMAL(5,2) NULL,
    altura_actual DECIMAL(5,2) NULL,
    imc_actual DECIMAL(5,2) NULL,
    -- Resumen de planes
    total_planes INT DEFAULT 0,
    plan_activo_id INT NULL,
    plan_activo_fecha_inicio DATE NULL,
    -- Metadatos
    ultima_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_activo_id) REFERENCES planes_alimentacion(id) ON DELETE SET NULL,
    INDEX idx_profesional (profesional_id),
    INDEX idx_ultima_consulta (ultima_consulta),
    INDEX idx_proxima_consulta (proxima_consulta)
);

------------------------------------------------
-- 13. Plan Comidas (Editor de Planes Alimentarios)
------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_comidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    dia_semana ENUM('Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo') NOT NULL,
    tipo_comida ENUM('desayuno','media_manana','almuerzo','media_tarde','cena','colacion') NOT NULL,
    nombre_comida VARCHAR(255) NOT NULL,
    descripcion TEXT,
    hora TIME COMMENT 'Hora de la comida',
    calorias DECIMAL(8,2),
    proteinas DECIMAL(8,2),
    carbohidratos DECIMAL(8,2),
    grasas DECIMAL(8,2),
    fibra DECIMAL(8,2),
    azucares DECIMAL(8,2),
    sodio DECIMAL(8,2),
    ingredientes TEXT,
    preparacion TEXT,
    tiempo_preparacion INT COMMENT 'Minutos de preparación',
    dificultad ENUM('facil','medio','dificil') DEFAULT 'facil',
    porciones INT DEFAULT 1,
    notas TEXT,
    activo BOOLEAN DEFAULT TRUE,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (plan_id) REFERENCES planes_alimentacion(id) ON DELETE CASCADE,
    INDEX idx_plan_dia_tipo (plan_id, dia_semana, tipo_comida),
    INDEX idx_plan_activo (plan_id, activo)
);

-- -----------------------------------------------------
-- TABLAS DE BIBLIOTECA NUTRICIONAL ELIMINADAS
-- ingredientes, recetas, recipe_ingredientes: No se usan en el sistema
-- Funcionalidad prevista: Biblioteca nutricional con ingredientes y recetas (no implementado)
-- -----------------------------------------------------




------------------------------------------------
-- 17. Laboratorios
------------------------------------------------
CREATE TABLE IF NOT EXISTS laboratorios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    profesional_id INT NOT NULL,
    fecha_estudio DATE NOT NULL,
    laboratorio VARCHAR(255),
    medico_solicitante VARCHAR(255),
    notas TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (profesional_id) REFERENCES profesionales(id) ON DELETE CASCADE,
    INDEX idx_fecha_estudio (fecha_estudio),
    INDEX idx_usuario_fecha (usuario_id, fecha_estudio),
    INDEX idx_profesional_fecha (profesional_id, fecha_estudio)
);

------------------------------------------------
-- 18. Resultados de Laboratorio
------------------------------------------------
CREATE TABLE IF NOT EXISTS resultados_laboratorio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    laboratorio_id INT NOT NULL,
    parametro VARCHAR(100) NOT NULL,
    valor DECIMAL(10,3),
    unidad VARCHAR(50),
    valor_referencia_min DECIMAL(10,3),
    valor_referencia_max DECIMAL(10,3),
    estado ENUM('normal', 'alto', 'bajo', 'critico') DEFAULT 'normal',
    observaciones TEXT,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (laboratorio_id) REFERENCES laboratorios(id) ON DELETE CASCADE,
    INDEX idx_parametro (parametro),
    INDEX idx_estado (estado),
    INDEX idx_laboratorio_parametro (laboratorio_id, parametro(50))
);

------------------------------------------------
-- 19. Asignaciones de Planes de Alimentación
------------------------------------------------
CREATE TABLE IF NOT EXISTS plan_asignaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    plan_id INT NOT NULL,
    usuario_id INT NOT NULL,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NULL,
    activo BOOLEAN DEFAULT TRUE,
    observaciones TEXT NULL,
    creado_en DATETIME DEFAULT CURRENT_TIMESTAMP,
    actualizado_en DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    activo_unique INT GENERATED ALWAYS AS (CASE WHEN activo = true THEN usuario_id ELSE NULL END) STORED,
    FOREIGN KEY (plan_id) REFERENCES planes_alimentacion(id) ON DELETE CASCADE,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_usuario_activo_true (activo_unique),
    INDEX idx_plan_id (plan_id),
    INDEX idx_usuario_id (usuario_id),
    INDEX idx_fecha_asignacion (fecha_asignacion),
    INDEX idx_activo (activo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

