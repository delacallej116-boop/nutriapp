const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
require('dotenv').config();

// Debug: Verificar que las variables de entorno se cargan
console.log('🔍 Variables de entorno cargadas:', {
    SMTP_HOST: process.env.SMTP_HOST || 'No definido',
    SMTP_PORT: process.env.SMTP_PORT || 'No definido',
    SMTP_USER: process.env.SMTP_USER ? 'Configurado' : 'No definido',
    SMTP_PASS: process.env.SMTP_PASS ? 'Configurado' : 'No definido'
});

// Importar configuración de base de datos
const { testConnection, handleDatabaseError } = require('./config/db');

// Las migraciones han sido ejecutadas previamente

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const profesionalRoutes = require('./routes/profesionalRoutes');
const consultaRoutes = require('./routes/consultaRouts');
const registroRoutes = require('./routes/registroRoutes');
const horarioRoutes = require('./routes/horarioRoutes');
const historiaClinicaRoutes = require('./routes/historiaClinicaRoutes');
const registrationKeyRoutes = require('./routes/registrationKeyRoutes');
const editPatientRoutes = require('./routes/editPatientRoutes');

// Importar scheduler de limpieza de imágenes
const agendaRoutes = require('./routes/agendaRoutes');
const taskScheduler = require('./service/taskScheduler');
const evolucionMedicaRoutes = require('./routes/evolucionMedicaRoutes');
const reporteRoutes = require('./routes/reporteRoutes');
const antropometriaRoutes = require('./routes/antropometriaRoutes');
const emailRoutes = require('./routes/emailRoutes');
const asistenciaRoutes = require('./routes/asistenciaRoutes');
const gestionConsultasRoutes = require('./routes/gestionConsultasRoutes');

// Importar middlewares
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de seguridad
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "'unsafe-eval'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            scriptSrcAttr: ["'unsafe-inline'"],
            scriptSrcElem: ["'self'", "'unsafe-inline'", "'unsafe-hashes'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com"],
            styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            styleSrcElem: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net", "https://cdnjs.cloudflare.com", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://cdnjs.cloudflare.com", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://cdn.jsdelivr.net"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
}));
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? ['https://tu-dominio.com'] : true,
    credentials: true
}));

// Middlewares de logging
app.use(morgan('combined'));

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Servir archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// Middleware para manejar errores de base de datos (se aplicará después de las rutas)

// Rutas API
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/profesionales', profesionalRoutes);
app.use('/api/consultas', consultaRoutes);
app.use('/api/registros', registroRoutes);
app.use('/api/horarios', horarioRoutes);
app.use('/api/historia-clinica', historiaClinicaRoutes);
app.use('/api/agenda', agendaRoutes);
app.use('/api/antropometria', antropometriaRoutes);
app.use('/api/plan-alimentacion', require('./routes/planAlimentacionRoutes'));
app.use('/api/plan-asignacion', require('./routes/planAsignacionRoutes'));
app.use('/api/laboratorios', require('./routes/laboratorioRoutes'));
app.use('/api/antecedentes', require('./routes/antecedenteRoutes'));
app.use('/api/evoluciones-medicas', evolucionMedicaRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/reservas', require('./routes/reservaRoutes'));
// app.use('/api/registro-comidas', require('./routes/registroComidasRoutes')); // Archivo no existe
app.use('/api/email', emailRoutes);
app.use('/api/asistencia', asistenciaRoutes);
app.use('/api/gestion-consultas', gestionConsultasRoutes);
app.use('/api', registrationKeyRoutes);

// Ruta de prueba de conexión
app.get('/api/test-db', async (req, res) => {
    try {
        const isConnected = await testConnection();
        res.json({
            success: true,
            message: 'Conexión a la base de datos exitosa',
            connected: isConnected,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error de conexión a la base de datos',
            error: error.message
        });
    }
});

// Ruta de salud del sistema
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Sistema de Gestión Nutricional funcionando correctamente',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development'
    });
});

// Ruta principal - servir la página de inicio
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Ruta de login
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'login', 'index.html'));
});

// Ruta de dashboard profesional
app.get('/dashboard/professional', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard', 'professional', 'index.html'));
});

// Ruta de gestión de asistencia
app.get('/asistencia', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'asistencia', 'index.html'));
});

// Ruta de gestión de consultas
app.get('/gestion-consultas', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'gestion-consultas', 'index.html'));
});

// Ruta de agenda
app.get('/agenda', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'agenda', 'index.html'));
});

// Ruta de gestión de planes alimentarios
app.get('/plan-alimentario', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'plan-alimentario', 'index.html'));
});

// Ruta de creador de planes alimentarios
app.get('/plan-creator', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'plan-creator', 'index.html'));
});

// Ruta de edición de pacientes
app.get('/edit-patient', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'edit-patient', 'index.html'));
});

// Ruta de nuevo paciente
app.get('/new-patient', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'new-patient', 'index.html'));
});

// Ruta de horarios
app.get('/horarios', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'horarios', 'index.html'));
});

// Ruta de reservar turno
app.get('/reservar-turno', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'reservar-turno', 'index.html'));
});

// Ruta de dashboard paciente
app.get('/dashboard/patient', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'dashboard', 'patient', 'index.html'));
});

// Patient history route
app.get('/patient-history', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'patient-history', 'index.html'));
});

// Patient history test route
app.get('/patient-history-test', (req, res) => {
    res.sendFile(path.join(__dirname, 'views', 'patient-history', 'test.html'));
});

// Middleware para manejar errores de base de datos
app.use(handleDatabaseError);

// Middleware de manejo de errores
app.use(errorHandler);

// Middleware para rutas no encontradas (solo para API)
app.use('/api/*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Ruta de API no encontrada',
        path: req.originalUrl
    });
});

// Función para iniciar el servidor
const startServer = async () => {
    try {
        // Probar conexión a la base de datos
        console.log('🔄 Probando conexión a la base de datos...');
        const dbConnected = await testConnection();
        
        if (!dbConnected) {
            console.error('❌ No se pudo conectar a la base de datos. Verifica la configuración.');
            process.exit(1);
        }
        
        // Proceder si la base de datos está lista
        // Las migraciones principales ya están ejecutadas
        
        // Iniciar servidor
        app.listen(PORT, () => {
            console.log('🚀 Servidor iniciado correctamente');
            console.log(`📡 Puerto: ${PORT}`);
            console.log(`🌍 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🔗 URL: http://localhost:${PORT}`);
            console.log(`📊 API Health: http://localhost:${PORT}/api/health`);
            console.log(`🗄️ Test DB: http://localhost:${PORT}/api/test-db`);
            console.log('✅ Sistema de Gestión Nutricional listo para usar');
        });
        
    } catch (error) {
        console.error('❌ Error al iniciar el servidor:', error.message);
        process.exit(1);
    }
};

// Manejo de señales de terminación
// Inicializar TaskScheduler
taskScheduler.init();

process.on('SIGTERM', () => {
    console.log('🔄 Recibida señal SIGTERM, cerrando servidor...');
    taskScheduler.stop();
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🔄 Recibida señal SIGINT, cerrando servidor...');
    taskScheduler.stop();
    process.exit(0);
});

// Manejo de errores no capturados
process.on('uncaughtException', (error) => {
    console.error('❌ Error no capturado:', error);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Promesa rechazada no manejada:', reason);
    process.exit(1);
});

// Iniciar el servidor
startServer();

module.exports = app;
