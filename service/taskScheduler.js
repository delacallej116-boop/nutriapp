const cron = require('node-cron');
const { executeQuery } = require('../config/db');

class TaskScheduler {
    constructor() {
        this.tasks = new Map();
        this.isRunning = false;
    }

    // Inicializar el scheduler
    init() {
        if (this.isRunning) {
            console.log('⚠️ TaskScheduler ya está ejecutándose');
            return;
        }

        console.log('🚀 Iniciando TaskScheduler...');
        this.isRunning = true;

        // Tarea diaria a las 23:50 para procesar consultas pasadas
        this.scheduleDailyConsultationUpdate();
        
        console.log('✅ TaskScheduler iniciado correctamente');
    }

    // Programar actualización diaria de consultas
    scheduleDailyConsultationUpdate() {
        const taskId = 'daily-consultation-update';
        
        // Ejecutar todos los días a las 23:50
        const task = cron.schedule('50 23 * * *', async () => {
            console.log('🕐 Ejecutando tarea diaria de actualización de consultas...');
            await this.processPastConsultations();
        }, {
            scheduled: false,
            timezone: 'America/Argentina/Buenos_Aires'
        });

        this.tasks.set(taskId, task);
        task.start();
        
        console.log('📅 Tarea programada: Actualización diaria de consultas a las 23:50');
    }

    // Procesar consultas pasadas
    async processPastConsultations() {
        try {
            console.log('🔍 Buscando consultas pasadas para procesar...');
            
            // Obtener consultas activas que ya pasaron de fecha
            const query = `
                SELECT 
                    c.id,
                    c.fecha,
                    c.hora,
                    c.profesional_id,
                    c.usuario_id,
                    c.paciente_externo_nombre,
                    c.paciente_externo_telefono,
                    c.paciente_externo_email,
                    COALESCE(u.apellido_nombre, c.paciente_externo_nombre) as paciente_nombre,
                    p.nombre as profesional_nombre
                FROM consultas c
                LEFT JOIN usuarios u ON c.usuario_id = u.id
                LEFT JOIN profesionales p ON c.profesional_id = p.id
                WHERE c.estado = 'activo' 
                AND c.fecha < CURDATE()
                ORDER BY c.fecha DESC, c.hora DESC
            `;

            const consultasPasadas = await executeQuery(query);
            
            if (consultasPasadas.length === 0) {
                console.log('✅ No hay consultas pasadas para procesar');
                return;
            }

            console.log(`📊 Encontradas ${consultasPasadas.length} consultas pasadas`);

            // Procesar cada consulta
            let procesadas = 0;
            let marcadasAusentes = 0;

            for (const consulta of consultasPasadas) {
                try {
                    // Marcar como ausente por defecto (el profesional puede cambiar esto después)
                    await this.marcarConsultaComoAusente(consulta.id);
                    marcadasAusentes++;
                    procesadas++;
                    
                    console.log(`📝 Consulta ${consulta.id} marcada como ausente: ${consulta.paciente_nombre} - ${consulta.fecha}`);
                } catch (error) {
                    console.error(`❌ Error procesando consulta ${consulta.id}:`, error.message);
                }
            }

            console.log(`✅ Procesamiento completado: ${procesadas} consultas procesadas, ${marcadasAusentes} marcadas como ausentes`);

        } catch (error) {
            console.error('❌ Error en procesamiento diario de consultas:', error);
        }
    }

    // Marcar consulta como ausente
    async marcarConsultaComoAusente(consultaId) {
        const query = `
            UPDATE consultas 
            SET estado = 'ausente', 
                actualizado_en = NOW(),
                notas_profesional = CONCAT(IFNULL(notas_profesional, ''), '\n[Marcado automáticamente como ausente - ', NOW(), ']')
            WHERE id = ?
        `;
        
        await executeQuery(query, [consultaId]);
    }

    // Obtener estadísticas de tareas
    getStats() {
        return {
            isRunning: this.isRunning,
            tasksCount: this.tasks.size,
            tasks: Array.from(this.tasks.keys())
        };
    }

    // Detener todas las tareas
    stop() {
        console.log('🛑 Deteniendo TaskScheduler...');
        
        this.tasks.forEach((task, taskId) => {
            task.stop();
            console.log(`⏹️ Tarea detenida: ${taskId}`);
        });
        
        this.tasks.clear();
        this.isRunning = false;
        
        console.log('✅ TaskScheduler detenido');
    }

    // Ejecutar tarea manualmente (para testing)
    async runTaskManually(taskId) {
        if (taskId === 'daily-consultation-update') {
            console.log('🧪 Ejecutando tarea manualmente...');
            await this.processPastConsultations();
        } else {
            throw new Error(`Tarea no encontrada: ${taskId}`);
        }
    }
}

module.exports = new TaskScheduler();
