class CacheService {
    constructor() {
        this.cache = new Map();
        this.ttl = new Map(); // Time To Live
        this.defaultTTL = 5 * 60 * 1000; // 5 minutos por defecto
    }

    // Establecer un valor en caché
    set(key, value, ttl = this.defaultTTL) {
        this.cache.set(key, value);
        this.ttl.set(key, Date.now() + ttl);
    }

    // Obtener un valor del caché
    get(key) {
        if (!this.cache.has(key)) {
            return null;
        }

        // Verificar si ha expirado
        if (Date.now() > this.ttl.get(key)) {
            this.delete(key);
            return null;
        }

        return this.cache.get(key);
    }

    // Eliminar del caché
    delete(key) {
        this.cache.delete(key);
        this.ttl.delete(key);
    }

    // Limpiar caché por patrón
    clearPattern(pattern) {
        for (const key of this.cache.keys()) {
            if (key.includes(pattern)) {
                this.delete(key);
            }
        }
    }

    // Limpiar todo el caché
    clear() {
        this.cache.clear();
        this.ttl.clear();
    }

    // Obtener estadísticas del caché
    getStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            memoryUsage: process.memoryUsage()
        };
    }

    // Invalidar caché relacionado con un profesional
    invalidateProfesionalCache(profesionalId) {
        this.clearPattern(`pacientes_${profesionalId}`);
        this.clearPattern(`stats_${profesionalId}`);
    }

    // Invalidar caché relacionado con un paciente específico
    invalidatePacienteCache(pacienteId) {
        // Buscar en todas las claves que contengan este paciente
        for (const key of this.cache.keys()) {
            if (key.startsWith('pacientes_')) {
                const cachedData = this.cache.get(key);
                if (cachedData && cachedData.data && Array.isArray(cachedData.data)) {
                    const pacientes = cachedData.data;
                    if (pacientes.some(p => p.id === pacienteId)) {
                        this.delete(key);
                    }
                }
            }
        }
    }
}

// Instancia singleton
const cacheService = new CacheService();

module.exports = cacheService;
