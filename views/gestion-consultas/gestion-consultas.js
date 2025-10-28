// Gestión de Consultas - JavaScript
class GestionConsultasManager {
    constructor() {
        this.consultasData = [];
        this.currentPage = 1;
        this.itemsPerPage = 10;
        this.totalPages = 1;
        this.totalItems = 0;
        this.timezone = 'UTC'; // Se actualizará desde la BD
        this.filtros = {
            fecha: '',
            estado: '',
            paciente: ''
        };
        
        this.init();
    }

    async init() {
        console.log('Inicializando Gestión de Consultas...');
        
        // Verificar autenticación
        if (!this.checkAuth()) {
            window.location.href = '/login';
            return;
        }

        // Configurar event listeners
        this.setupEventListeners();
        
        // Cargar información del usuario y timezone
        this.loadUserInfo();
        await this.loadTimezone();
        
        // Cargar datos iniciales
        await this.loadConsultas();
        
        console.log('Gestión de Consultas inicializada correctamente');
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (!token || !userData) {
            return false;
        }

        try {
            const user = JSON.parse(userData);
            if (user.rol !== 'profesional') {
                return false;
            }
            return true;
        } catch (error) {
            console.error('Error parsing user data:', error);
            return false;
        }
    }

    // Obtener datos del profesional incluyendo zona horaria
    async getProfesionalData() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                console.warn('❌ No se encontró token de autenticación');
                return null;
            }
            
            const response = await fetch('/api/auth/me', {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                console.warn('❌ No se pudieron obtener datos del profesional:', response.status);
                return null;
            }
            
            const result = await response.json();
            return result.success ? result.data.user : null;
            
        } catch (error) {
            console.error('Error obteniendo datos del profesional:', error);
            return null;
        }
    }

    loadUserInfo() {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (user && user.nombre) {
                const userInfoElement = document.getElementById('userInfo');
                if (userInfoElement) {
                    userInfoElement.textContent = `Dr. ${user.nombre}`;
                }
            }
        } catch (error) {
            console.error('Error cargando información del usuario:', error);
        }
    }

    async loadTimezone() {
        try {
            const profesional = await this.getProfesionalData();
            if (profesional && profesional.timezone) {
                this.timezone = profesional.timezone;
                console.log('✅ Zona horaria cargada:', this.timezone);
            } else {
                // Intentar obtener del localStorage
                const userData = JSON.parse(localStorage.getItem('user'));
                if (userData && userData.timezone) {
                    this.timezone = userData.timezone;
                    console.log('✅ Zona horaria cargada desde localStorage:', this.timezone);
                } else {
                    console.warn('⚠️ No se encontró zona horaria, usando UTC');
                }
            }
        } catch (error) {
            console.error('Error cargando zona horaria:', error);
            // Mantener timezone por defecto
        }
    }

    setupEventListeners() {
        // Filtros
        document.getElementById('filtro-fecha').addEventListener('change', (e) => {
            this.filtros.fecha = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filtro-estado').addEventListener('change', (e) => {
            this.filtros.estado = e.target.value;
            this.applyFilters();
        });

        document.getElementById('filtro-paciente').addEventListener('input', (e) => {
            this.filtros.paciente = e.target.value;
            this.applyFilters();
        });

        // Modal de reprogramación
        document.getElementById('confirmar-reprogramacion').addEventListener('click', () => {
            this.confirmarReprogramacion();
        });

        // Modal de cancelación
        document.getElementById('confirmar-cancelacion').addEventListener('click', () => {
            this.confirmarCancelacion();
        });

        // Event listener para cargar horarios cuando cambia la fecha
        document.getElementById('nueva-fecha').addEventListener('change', async (e) => {
            const fecha = e.target.value;
            if (fecha) {
                await this.cargarHorariosParaFecha(fecha);
            }
        });

        // Logout
        window.logout = () => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
        };
    }

    async loadConsultas() {
        try {
            this.showLoading(true);
            
            // Obtener datos del profesional para usar su zona horaria
            const profesional = await this.getProfesionalData();
            if (profesional) {
                this.timezone = profesional.timezone || 'America/Argentina/Buenos_Aires';
            }
            
            const user = JSON.parse(localStorage.getItem('user'));
            const token = localStorage.getItem('token');
            
            const params = new URLSearchParams({
                page: this.currentPage,
                limit: this.itemsPerPage,
                ...this.filtros
            });

            const response = await fetch(`/api/gestion-consultas/profesional/${user.id}/consultas?${params}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            this.consultasData = result.data || [];
            this.totalItems = result.pagination?.totalItems || 0;
            this.totalPages = result.pagination?.totalPages || 1;

            this.renderConsultas();
            this.renderPagination();

        } catch (error) {
            console.error('Error cargando consultas:', error);
            this.showAlert('Error al cargar las consultas', 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    renderConsultas() {
        const tbody = document.getElementById('consultas-tbody');
        
        if (this.consultasData.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center py-4">
                        <div class="empty-state">
                            <i class="fas fa-calendar-times"></i>
                            <h5>No hay consultas disponibles</h5>
                            <p>No se encontraron consultas con los filtros aplicados</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }


        tbody.innerHTML = this.consultasData.map(consulta => `
            <tr>
                <td>
                    <div class="d-flex align-items-center">
                        <div class="avatar-sm bg-primary text-white rounded-circle d-flex align-items-center justify-content-center me-2">
                            <i class="fas fa-user"></i>
                        </div>
                        <div>
                            <div class="fw-medium">${consulta.paciente_nombre}</div>
                            <small class="text-muted">${consulta.paciente_documento}</small>
                        </div>
                    </div>
                </td>
                <td>
                    <div class="fw-medium">${this.formatDate(consulta.fecha)}</div>
                    <small class="text-muted">${this.getDayName(consulta.fecha)}</small>
                </td>
                <td>
                    <span class="badge bg-light text-dark">${consulta.hora}</span>
                </td>
                <td>
                    <span class="status-badge status-${consulta.estado}">
                        ${this.getEstadoText(consulta.estado)}
                    </span>
                </td>
                <td>
                    <div class="btn-group" role="group">
                        <button class="btn btn-reprogramar btn-action" onclick="gestionConsultas.openReprogramarModal(${consulta.id})">
                            <i class="fas fa-calendar-plus me-1"></i>Reprogramar
                        </button>
                        <button class="btn btn-cancelar btn-action" onclick="gestionConsultas.openCancelarModal(${consulta.id})">
                            <i class="fas fa-times me-1"></i>Cancelar
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    renderPagination() {
        const container = document.getElementById('pagination-container');
        
        if (this.totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Botón anterior
        paginationHTML += `
            <li class="page-item ${this.currentPage === 1 ? 'disabled' : ''}">
                <button class="page-link" onclick="gestionConsultas.changePage(${this.currentPage - 1})" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
            </li>
        `;

        // Números de página
        const startPage = Math.max(1, this.currentPage - 2);
        const endPage = Math.min(this.totalPages, this.currentPage + 2);

        if (startPage > 1) {
            paginationHTML += `<li class="page-item"><button class="page-link" onclick="gestionConsultas.changePage(1)">1</button></li>`;
            if (startPage > 2) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <li class="page-item ${i === this.currentPage ? 'active' : ''}">
                    <button class="page-link" onclick="gestionConsultas.changePage(${i})">${i}</button>
                </li>
            `;
        }

        if (endPage < this.totalPages) {
            if (endPage < this.totalPages - 1) {
                paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            paginationHTML += `<li class="page-item"><button class="page-link" onclick="gestionConsultas.changePage(${this.totalPages})">${this.totalPages}</button></li>`;
        }

        // Botón siguiente
        paginationHTML += `
            <li class="page-item ${this.currentPage === this.totalPages ? 'disabled' : ''}">
                <button class="page-link" onclick="gestionConsultas.changePage(${this.currentPage + 1})" ${this.currentPage === this.totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </li>
        `;

        container.innerHTML = paginationHTML;
    }

    async changePage(newPage) {
        if (newPage < 1 || newPage > this.totalPages || newPage === this.currentPage) {
            return;
        }
        
        this.currentPage = newPage;
        await this.loadConsultas();
    }

    applyFilters() {
        this.currentPage = 1;
        this.loadConsultas();
    }


    async confirmarReprogramacion() {
        try {
            const consultaId = document.getElementById('consulta-id').value;
            const nuevaFecha = document.getElementById('nueva-fecha').value;
            const nuevaHora = document.getElementById('nueva-hora').value;
            const motivo = document.getElementById('motivo-reprogramacion').value;

            if (!nuevaFecha || !nuevaHora) {
                this.showAlert('Por favor, complete todos los campos obligatorios', 'warning');
                return;
            }

            this.showLoading(true);

            const user = JSON.parse(localStorage.getItem('user'));
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/gestion-consultas/consulta/${consultaId}/reprogramar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nueva_fecha: nuevaFecha,
                    nueva_hora: nuevaHora,
                    motivo: motivo
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}`);
            }

            const result = await response.json();
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('reprogramarModal'));
            modal.hide();

            // Mostrar mensaje de éxito
            this.showAlert('Consulta reprogramada exitosamente', 'success');

            // Recargar datos
            await this.loadConsultas();

        } catch (error) {
            console.error('Error reprogramando consulta:', error);
            this.showAlert(`Error al reprogramar la consulta: ${error.message}`, 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    // Abrir modal de cancelación
    openCancelarModal(consultaId) {
        const consulta = this.consultasData.find(c => c.id === consultaId);
        if (!consulta) return;

        // Llenar datos del modal
        document.getElementById('cancelar-consulta-id').value = consultaId;
        document.getElementById('cancelar-paciente-nombre').value = consulta.paciente_nombre;
        document.getElementById('cancelar-fecha').value = this.formatDate(consulta.fecha);
        document.getElementById('cancelar-hora').value = consulta.hora;
        
        // Limpiar motivo
        document.getElementById('motivo-cancelacion').value = '';
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('cancelarModal'));
        modal.show();
    }

    // Confirmar cancelación
    async confirmarCancelacion() {
        try {
            const consultaId = document.getElementById('cancelar-consulta-id').value;
            const motivo = document.getElementById('motivo-cancelacion').value;

            if (!motivo.trim()) {
                this.showAlert('Por favor, ingrese el motivo de la cancelación', 'warning');
                return;
            }

            this.showLoading(true);

            const user = JSON.parse(localStorage.getItem('user'));
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/gestion-consultas/consulta/${consultaId}/cancelar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    motivo: motivo
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || `Error ${response.status}`);
            }

            const result = await response.json();
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('cancelarModal'));
            modal.hide();

            // Mostrar mensaje de éxito
            this.showAlert('Consulta cancelada exitosamente. Se ha enviado una notificación por email al paciente.', 'success');

            // Recargar datos
            await this.loadConsultas();

        } catch (error) {
            console.error('Error cancelando consulta:', error);
            this.showAlert(`Error al cancelar la consulta: ${error.message}`, 'danger');
        } finally {
            this.showLoading(false);
        }
    }

    // Abrir modal de reprogramación
    openReprogramarModal(consultaId) {
        const consulta = this.consultasData.find(c => c.id === consultaId);
        if (!consulta) return;

        // Llenar datos del modal
        document.getElementById('consulta-id').value = consultaId;
        document.getElementById('paciente-nombre').value = consulta.paciente_nombre;
        document.getElementById('fecha-actual').value = this.formatDate(consulta.fecha);
        
        // Establecer fecha mínima como hoy
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('nueva-fecha').value = today;
        document.getElementById('nueva-fecha').min = today;
        
        // Limpiar campos
        document.getElementById('nueva-hora').innerHTML = '<option value="">Seleccione una hora</option>';
        document.getElementById('motivo-reprogramacion').value = '';

        // Cargar horarios para la fecha de hoy
        this.cargarHorariosParaFecha(today);
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('reprogramarModal'));
        modal.show();
    }

    // Confirmar reprogramación
    async confirmarReprogramacion() {
        try {
            const consultaId = document.getElementById('consulta-id').value;
            const nuevaFecha = document.getElementById('nueva-fecha').value;
            const nuevaHora = document.getElementById('nueva-hora').value;
            const motivo = document.getElementById('motivo-reprogramacion').value;

            if (!nuevaFecha || !nuevaHora) {
                this.showAlert('Por favor seleccione una fecha y hora válidas', 'warning');
                return;
            }

            const user = JSON.parse(localStorage.getItem('user'));
            const token = localStorage.getItem('token');

            const response = await fetch(`/api/gestion-consultas/consulta/${consultaId}/reprogramar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    nueva_fecha: nuevaFecha,
                    nueva_hora: nuevaHora,
                    motivo: motivo
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showAlert('Consulta reprogramada exitosamente', 'success');
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('reprogramarModal'));
                modal.hide();
                // Recargar consultas
                await this.loadConsultas();
            } else {
                this.showAlert(result.message || 'Error al reprogramar la consulta', 'danger');
            }

        } catch (error) {
            console.error('Error confirmando reprogramación:', error);
            this.showAlert('Error interno del servidor', 'danger');
        }
    }

    // Cargar horarios disponibles para una fecha específica
    async cargarHorariosParaFecha(fecha) {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            const token = localStorage.getItem('token');
            
            const response = await fetch(`/api/gestion-consultas/profesional/${user.id}/horarios-disponibles?fecha=${fecha}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            const horariosDisponibles = result.data.horariosDisponibles || [];
            
            // Actualizar el select de horas
            const horaSelect = document.getElementById('nueva-hora');
            horaSelect.innerHTML = '<option value="">Seleccione una hora</option>';
            
            if (horariosDisponibles.length === 0) {
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No hay horarios disponibles';
                option.disabled = true;
                horaSelect.appendChild(option);
                this.showAlert('No hay horarios disponibles para esta fecha', 'warning');
                return;
            }
            
            horariosDisponibles.forEach(horario => {
                if (horario && horario.hora) {
                    const option = document.createElement('option');
                    option.value = horario.hora;
                    option.textContent = horario.hora.substring(0, 5); // Mostrar solo HH:MM
                    horaSelect.appendChild(option);
                }
            });
            
            // Mostrar mensaje de éxito
            this.showAlert(`${horariosDisponibles.length} horarios disponibles cargados`, 'success');

        } catch (error) {
            console.error('Error cargando horarios:', error);
            this.showAlert('Error al cargar horarios disponibles', 'warning');
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        if (show) {
            spinner.classList.remove('d-none');
        } else {
            spinner.classList.add('d-none');
        }
    }

    showAlert(message, type = 'info') {
        // Crear alerta temporal
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
        alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;

        document.body.appendChild(alertDiv);

        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.parentNode.removeChild(alertDiv);
            }
        }, 5000);
    }

    formatDate(dateString) {
        if (!dateString) return 'Sin fecha';
        
        try {
            // Si la fecha viene como string en formato YYYY-MM-DD, usarla directamente
            if (typeof dateString === 'string' && dateString.match(/^\d{4}-\d{2}-\d{2}$/)) {
                const [year, month, day] = dateString.split('-');
                return `${day}/${month}/${year}`;
            }
            
            // Si viene como objeto Date o string con timezone, procesarlo
            const date = new Date(dateString);
            if (isNaN(date.getTime())) {
                return 'Fecha inválida';
            }
            
            // Para fechas que vienen con timezone UTC, extraer solo la fecha
            if (dateString.includes('T00:00:00.000Z')) {
                const dateOnly = dateString.split('T')[0];
                const [year, month, day] = dateOnly.split('-');
                return `${day}/${month}/${year}`;
            }
            
            // Formatear usando la zona horaria del profesional
            const formattedDate = date.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                timeZone: this.timezone
            });
            
            return formattedDate;
        } catch (error) {
            console.warn('Error formateando fecha:', error);
            return 'Fecha inválida';
        }
    }

    getDayName(dateString) {
        try {
            // Para fechas que vienen con timezone UTC, extraer solo la fecha
            if (dateString && dateString.includes('T00:00:00.000Z')) {
                const dateOnly = dateString.split('T')[0];
                const date = new Date(dateOnly + 'T12:00:00'); // Usar mediodía para evitar problemas de timezone
                const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
                return days[date.getDay()];
            }
            
            const date = new Date(dateString);
            const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
            return days[date.getDay()];
        } catch (error) {
            console.warn('Error obteniendo día de la semana:', error);
            return 'N/A';
        }
    }

    getEstadoText(estado) {
        const estados = {
            'activo': 'Activa',
            'completado': 'Completada',
            'ausente': 'Ausente',
            'cancelado': 'Cancelada'
        };
        return estados[estado] || estado;
    }
}

// Funciones globales para los botones del header
function goBackToDashboard() {
    window.location.href = '/dashboard/professional';
}

function logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.gestionConsultas = new GestionConsultasManager();
});
