// Agenda JavaScript Module
class AgendaModule {
    constructor() {
        this.profesionalId = null;
        this.consultas = [];
        this.pacientes = [];
        this.horariosDisponibles = [];
        this.fechaActual = new Date().toISOString().split('T')[0];
        
        this.init();
    }

    async init() {
        try {
            // Verificar autenticación
            const token = localStorage.getItem('token');
            console.log('Token encontrado:', token ? 'Sí' : 'No');
            
            if (!token) {
                console.log('No hay token, redirigiendo al login...');
                window.location.href = '/login';
                return;
            }

            // Obtener ID del profesional del token
            this.profesionalId = this.getProfesionalIdFromToken();
            console.log('ID del profesional:', this.profesionalId);
            
            if (!this.profesionalId) {
                console.error('No se pudo obtener el ID del profesional');
                alert('Error de autenticación. Redirigiendo al login...');
                window.location.href = '/login';
                return;
            }

            // Configurar event listeners
            this.setupEventListeners();
            
            // Cargar datos iniciales
            await this.loadInitialData();
            
            console.log('AgendaModule inicializado correctamente');
        } catch (error) {
            console.error('Error inicializando AgendaModule:', error);
            alert('Error al cargar la agenda. Redirigiendo al login...');
            window.location.href = '/login';
        }
    }

    getProfesionalIdFromToken() {
        try {
            const token = localStorage.getItem('token');
            if (!token) return null;
            
            const payload = JSON.parse(atob(token.split('.')[1]));
            return payload.profesional_id || payload.id;
        } catch (error) {
            console.error('Error obteniendo ID del profesional:', error);
            return null;
        }
    }

    setupEventListeners() {
        // Filtros
        document.getElementById('fechaSelector').addEventListener('change', () => this.loadConsultas());
        document.getElementById('pacienteSelector').addEventListener('change', () => this.loadConsultas());
        document.getElementById('estadoSelector').addEventListener('change', () => this.loadConsultas());
        document.getElementById('filtrarBtn').addEventListener('click', () => this.loadConsultas());
        document.getElementById('limpiarFiltrosBtn').addEventListener('click', () => this.limpiarFiltros());

        // Nueva consulta
        document.getElementById('nuevaConsultaBtn').addEventListener('click', () => this.showNuevaConsultaModal());
        document.getElementById('guardarConsultaBtn').addEventListener('click', () => this.guardarNuevaConsulta());

        // Editar consulta
        document.getElementById('actualizarConsultaBtn').addEventListener('click', () => this.actualizarConsulta());

        // Cambio de fecha en nueva consulta
        document.getElementById('nuevaConsultaFecha').addEventListener('change', () => this.loadHorariosDisponibles());
    }

    async loadInitialData() {
        try {
            // Establecer fecha actual
            document.getElementById('fechaSelector').value = this.fechaActual;
            
            // Cargar pacientes
            await this.loadPacientes();
            
            // Cargar estadísticas
            await this.loadEstadisticas();
            
            // Cargar consultas
            await this.loadConsultas();
        } catch (error) {
            console.error('Error cargando datos iniciales:', error);
        }
    }

    async loadPacientes() {
        try {
            const response = await fetch(`/api/agenda/profesional/${this.profesionalId}/pacientes`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar pacientes');
            }

            const result = await response.json();
            this.pacientes = result.data || [];
            
            this.renderPacientesSelectors();
        } catch (error) {
            console.error('Error cargando pacientes:', error);
        }
    }

    renderPacientesSelectors() {
        const selectors = [
            'pacienteSelector',
            'nuevaConsultaPaciente',
            'editarConsultaPaciente'
        ];

        selectors.forEach(selectorId => {
            const selector = document.getElementById(selectorId);
            if (selector) {
                // Mantener la primera opción (vacía o "Todos")
                const firstOption = selector.firstElementChild;
                selector.innerHTML = '';
                selector.appendChild(firstOption);

                // Agregar pacientes
                this.pacientes.forEach(paciente => {
                    const option = document.createElement('option');
                    option.value = paciente.id;
                    option.textContent = paciente.apellido_nombre;
                    selector.appendChild(option);
                });
            }
        });
    }

    async loadEstadisticas() {
        try {
            const response = await fetch(`/api/agenda/profesional/${this.profesionalId}/stats`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar estadísticas');
            }

            const result = await response.json();
            const stats = result.data || {};
            
            this.renderEstadisticas(stats);
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
        }
    }

    renderEstadisticas(stats) {
        const container = document.getElementById('estadisticasContainer');
        
        const estadisticas = [
            {
                icon: 'fas fa-calendar-check',
                number: stats.total_consultas || 0,
                label: 'Total Consultas',
                color: 'primary'
            },
            {
                icon: 'fas fa-clock',
                number: stats.programadas || 0,
                label: 'Programadas',
                color: 'warning'
            },
            {
                icon: 'fas fa-check-circle',
                number: stats.realizadas || 0,
                label: 'Realizadas',
                color: 'success'
            },
            {
                icon: 'fas fa-times-circle',
                number: (stats.canceladas || 0) + (stats.no_asistio || 0),
                label: 'Canceladas/No asistió',
                color: 'danger'
            }
        ];

        container.innerHTML = estadisticas.map(stat => `
            <div class="col-md-3 col-sm-6 mb-3">
                <div class="stats-card">
                    <div class="stats-icon text-${stat.color}">
                        <i class="${stat.icon}"></i>
                    </div>
                    <div class="stats-number text-${stat.color}">${stat.number}</div>
                    <div class="stats-label">${stat.label}</div>
                </div>
            </div>
        `).join('');
    }

    async loadConsultas() {
        try {
            const fecha = document.getElementById('fechaSelector').value;
            const pacienteId = document.getElementById('pacienteSelector').value;
            const estado = document.getElementById('estadoSelector').value;

            let url = `/api/agenda/profesional/${this.profesionalId}/consultas/fecha/${fecha}`;
            
            // Si hay filtros adicionales, usar rango de fechas
            if (pacienteId || estado) {
                url = `/api/agenda/profesional/${this.profesionalId}/consultas/rango?fechaInicio=${fecha}&fechaFin=${fecha}`;
            }

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar consultas');
            }

            const result = await response.json();
            this.consultas = result.data || [];
            
            // Aplicar filtros locales si es necesario
            if (pacienteId || estado) {
                this.consultas = this.consultas.filter(consulta => {
                    const matchPaciente = !pacienteId || consulta.usuario_id == pacienteId;
                    const matchEstado = !estado || consulta.estado === estado;
                    return matchPaciente && matchEstado;
                });
            }
            
            this.renderConsultas();
        } catch (error) {
            console.error('Error cargando consultas:', error);
        }
    }

    renderConsultas() {
        const container = document.getElementById('consultasContainer');
        const badge = document.getElementById('totalConsultasBadge');
        
        badge.textContent = this.consultas.length;

        if (this.consultas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h5>No hay consultas</h5>
                    <p>No se encontraron consultas para los filtros seleccionados</p>
                </div>
            `;
            return;
        }

        container.innerHTML = this.consultas.map(consulta => `
            <div class="consulta-card">
                <div class="consulta-header">
                    <div class="consulta-paciente">${consulta.paciente_nombre || 'Paciente no encontrado'}</div>
                    <span class="consulta-estado estado-${consulta.estado}">${this.getEstadoText(consulta.estado)}</span>
                </div>
                <div class="consulta-details">
                    <div class="consulta-detail">
                        <i class="fas fa-calendar"></i>
                        <span>${this.formatFecha(consulta.fecha_hora)}</span>
                    </div>
                    <div class="consulta-detail">
                        <i class="fas fa-clock"></i>
                        <span>${this.formatHora(consulta.fecha_hora)}</span>
                    </div>
                    <div class="consulta-detail">
                        <i class="fas fa-stethoscope"></i>
                        <span>${this.getTipoConsultaText(consulta.tipo_consulta)}</span>
                    </div>
                    <div class="consulta-detail">
                        <i class="fas fa-user"></i>
                        <span>${consulta.numero_documento || 'N/A'}</span>
                    </div>
                </div>
                ${consulta.motivo_consulta ? `
                    <div class="consulta-motivo">
                        <strong>Motivo:</strong> ${consulta.motivo_consulta}
                    </div>
                ` : ''}
                <div class="consulta-actions">
                    <button class="btn btn-outline-primary btn-sm" onclick="agendaModule.editarConsulta(${consulta.id})">
                        <i class="fas fa-edit"></i> Editar
                    </button>
                    <button class="btn btn-outline-danger btn-sm" onclick="agendaModule.eliminarConsulta(${consulta.id})">
                        <i class="fas fa-trash"></i> Eliminar
                    </button>
                </div>
            </div>
        `).join('');
    }

    async loadHorariosDisponibles() {
        try {
            const fecha = document.getElementById('nuevaConsultaFecha').value;
            if (!fecha) return;

            const response = await fetch(`/api/agenda/profesional/${this.profesionalId}/horarios-disponibles/${fecha}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                throw new Error('Error al cargar horarios disponibles');
            }

            const result = await response.json();
            this.horariosDisponibles = result.data || [];
            
            this.renderHorariosDisponibles();
        } catch (error) {
            console.error('Error cargando horarios disponibles:', error);
        }
    }

    renderHorariosDisponibles() {
        const selector = document.getElementById('nuevaConsultaHora');
        selector.innerHTML = '<option value="">Seleccionar hora</option>';

        this.horariosDisponibles.forEach(horario => {
            if (horario.estado_horario === 'disponible') {
                const option = document.createElement('option');
                option.value = horario.hora_inicio;
                option.textContent = `${horario.hora_inicio} - ${horario.hora_fin}`;
                selector.appendChild(option);
            }
        });
    }

    showNuevaConsultaModal() {
        // Establecer fecha actual
        document.getElementById('nuevaConsultaFecha').value = this.fechaActual;
        
        // Limpiar formulario
        document.getElementById('nuevaConsultaForm').reset();
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('nuevaConsultaModal'));
        modal.show();
    }

    async guardarNuevaConsulta() {
        try {
            const form = document.getElementById('nuevaConsultaForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const consultaData = {
                usuario_id: document.getElementById('nuevaConsultaPaciente').value,
                fecha_hora: `${document.getElementById('nuevaConsultaFecha').value} ${document.getElementById('nuevaConsultaHora').value}:00`,
                tipo_consulta: document.getElementById('nuevaConsultaTipo').value,
                motivo_consulta: document.getElementById('nuevaConsultaMotivo').value,
                observaciones: document.getElementById('nuevaConsultaObservaciones').value,
                estado: 'programada'
            };

            const response = await fetch(`/api/agenda/profesional/${this.profesionalId}/consultas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(consultaData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al crear consulta');
            }

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('nuevaConsultaModal'));
            modal.hide();

            // Recargar datos
            await this.loadConsultas();
            await this.loadEstadisticas();

            // Mostrar mensaje de éxito
            this.showAlert('Consulta creada exitosamente', 'success');
        } catch (error) {
            console.error('Error guardando consulta:', error);
            this.showAlert(error.message, 'danger');
        }
    }

    async editarConsulta(consultaId) {
        try {
            const consulta = this.consultas.find(c => c.id === consultaId);
            if (!consulta) {
                throw new Error('Consulta no encontrada');
            }

            // Llenar formulario
            document.getElementById('editarConsultaId').value = consulta.id;
            document.getElementById('editarConsultaPaciente').value = consulta.usuario_id;
            document.getElementById('editarConsultaTipo').value = consulta.tipo_consulta;
            document.getElementById('editarConsultaFecha').value = consulta.fecha_hora.split(' ')[0];
            document.getElementById('editarConsultaHora').value = consulta.fecha_hora.split(' ')[1].substring(0, 5);
            document.getElementById('editarConsultaEstado').value = consulta.estado;
            document.getElementById('editarConsultaMotivo').value = consulta.motivo_consulta || '';
            document.getElementById('editarConsultaObservaciones').value = consulta.observaciones || '';

            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('editarConsultaModal'));
            modal.show();
        } catch (error) {
            console.error('Error editando consulta:', error);
            this.showAlert(error.message, 'danger');
        }
    }

    async actualizarConsulta() {
        try {
            const form = document.getElementById('editarConsultaForm');
            if (!form.checkValidity()) {
                form.reportValidity();
                return;
            }

            const consultaId = document.getElementById('editarConsultaId').value;
            const consultaData = {
                fecha_hora: `${document.getElementById('editarConsultaFecha').value} ${document.getElementById('editarConsultaHora').value}:00`,
                tipo_consulta: document.getElementById('editarConsultaTipo').value,
                motivo_consulta: document.getElementById('editarConsultaMotivo').value,
                observaciones: document.getElementById('editarConsultaObservaciones').value,
                estado: document.getElementById('editarConsultaEstado').value
            };

            const response = await fetch(`/api/agenda/consultas/${consultaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                body: JSON.stringify(consultaData)
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al actualizar consulta');
            }

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editarConsultaModal'));
            modal.hide();

            // Recargar datos
            await this.loadConsultas();
            await this.loadEstadisticas();

            // Mostrar mensaje de éxito
            this.showAlert('Consulta actualizada exitosamente', 'success');
        } catch (error) {
            console.error('Error actualizando consulta:', error);
            this.showAlert(error.message, 'danger');
        }
    }

    async eliminarConsulta(consultaId) {
        try {
            if (!confirm('¿Está seguro de que desea eliminar esta consulta?')) {
                return;
            }

            const response = await fetch(`/api/agenda/consultas/${consultaId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Error al eliminar consulta');
            }

            // Recargar datos
            await this.loadConsultas();
            await this.loadEstadisticas();

            // Mostrar mensaje de éxito
            this.showAlert('Consulta eliminada exitosamente', 'success');
        } catch (error) {
            console.error('Error eliminando consulta:', error);
            this.showAlert(error.message, 'danger');
        }
    }

    limpiarFiltros() {
        document.getElementById('fechaSelector').value = this.fechaActual;
        document.getElementById('pacienteSelector').value = '';
        document.getElementById('estadoSelector').value = '';
        this.loadConsultas();
    }

    // Utilidades
    getEstadoText(estado) {
        const estados = {
            'programada': 'Programada',
            'realizada': 'Realizada',
            'cancelada': 'Cancelada',
            'no_asistio': 'No asistió'
        };
        return estados[estado] || estado;
    }

    getTipoConsultaText(tipo) {
        const tipos = {
            'primera_consulta': 'Primera Consulta',
            'control': 'Control',
            'seguimiento': 'Seguimiento',
            'emergencia': 'Emergencia'
        };
        return tipos[tipo] || tipo;
    }

    formatFecha(fechaHora) {
        const fecha = new Date(fechaHora);
        return fecha.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    formatHora(fechaHora) {
        const fecha = new Date(fechaHora);
        return fecha.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    showAlert(message, type) {
        // Crear alerta temporal
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(alertDiv);
        
        // Remover después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }
}

// Inicializar módulo cuando se carga la página
let agendaModule;
document.addEventListener('DOMContentLoaded', () => {
    agendaModule = new AgendaModule();
});

