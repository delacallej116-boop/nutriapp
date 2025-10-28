const Reporte = require('../models/reporte');

class ReporteController {
    // Obtener estadísticas rápidas de reportes
    static async getQuickStats(req, res) {
        try {
            console.log('📈 Obteniendo estadísticas rápidas...');
            
            const { profesional_id } = req.query || req.params || {};
            
            if (!profesional_id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de profesional requerido'
                });
            }

            const stats = await Reporte.getStats(profesional_id);
            
            res.json({
                success: true,
                data: stats
            });
            
        } catch (error) {
            console.error('Error en getQuickStats:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener reportes recientes
    static async getRecentReports(req, res) {
        try {
            console.log('🔍 Obteniendo reportes recientes...');
            
            const { profesional_id } = req.query || req.params || {};
            const { limite = 5 } = req.query;
            
            if (!profesional_id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de profesional requerido'
                });
            }

            const reportes = await Reporte.getRecentReports(profesional_id, parseInt(limite));
            
            res.json({
                success: true,
                data: reportes.map(reporte => reporte.toPublicObject())
            });
            
        } catch (error) {
            console.error('Error en getRecentReports:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Generar nuevo reporte
    static async generateReport(req, res) {
        try {
            console.log('📊 Generando nuevo reporte...');
            
            const { 
                profesional_id, 
                usuario_id, 
                tipo, 
                fecha_desde, 
                fecha_hasta 
            } = req.body;
            
            // Validaciones básicas
            if (!profesional_id || !tipo || !fecha_desde || !fecha_hasta) {
                return res.status(400).json({
                    success: false,
                    message: 'Faltan parámetros requeridos'
                });
            }

            // Crear nuevo reporte
            const reporte = new Reporte({
                profesional_id,
                usuario_id: usuario_id || null,
                tipo,
                fecha_desde,
                fecha_hasta,
                archivo_url: null // Se generará después
            });

            await reporte.save();
            
            res.json({
                success: true,
                message: 'Reporte generado exitosamente',
                data: reporte.toPublicObject()
            });
            
        } catch (error) {
            console.error('Error en generateReport:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Eliminar reporte
    static async deleteReport(req, res) {
        try {
            console.log('🗑️ Eliminando reporte...');
            
            const { id } = req.params;
            
            if (!id) {
                return res.status(400).json({
                    success: false,
                    message: 'ID de reporte requerido'
                });
            }

            const reporte = new Reporte({ id });
            await reporte.delete();
            
            res.json({
                success: true,
                message: 'Reporte eliminado exitosamente'
            });
            
        } catch (error) {
            console.error('Error en deleteReport:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }

    // Obtener lista de pacientes para filtros
    static async getPatientsFilter(req, res) {
        try {
            console.log('👥 Obteniendo lista de pacientes para filtros...');
            
            const { professional_id } = req.query;
            
            if (!professional_id) {
                return res.json({
                    success: true,
                    data: []
                });
            }

            const query = `
                SELECT id, apellido_nombre, numero_historia_clinica 
                FROM usuarios 
                WHERE profesional_id = ? AND activo = 1
                ORDER BY apellido_nombre ASC
            `;
            
            const { executeQuery } = require('../config/db');
            const pacientes = await executeQuery(query, [professional_id]);
            
            res.json({
                success: true,
                data: pacientes
            });
            
        } catch (error  ) {
            console.error('Error en getPatientsFilter:', error);
            res.status(500).json({
                success: false,
                message: 'Error interno del servidor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
}

module.exports = ReporteController;
