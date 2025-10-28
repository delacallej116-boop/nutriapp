// Gestión de Asistencia - JavaScript Modularizado
class AsistenciaManager {
    constructor() {
        this.profesionalId = null;
        this.token = null;
        this.consultasData = [];
        this.filteredConsultas = [];
        this.currentFilters = {
            search: '',
            estado: '',
            fecha: ''
        };
        this.pagination = {
            currentPage: 1,
            totalPages: 1,
            limit: 10,
            totalItems: 0
        };
        this.viewMode = 'list'; // 'list' o 'grid'
        
        this.init();
    }

    async init() {
        console.log('🚀 Inicializando AsistenciaManager...');
        
        // Verificar autenticación
        if (!this.checkAuth()) {
            this.redirectToLogin();
            return;
        }

        // Cargar datos del usuario
        this.loadUserInfo();
        
        // Cargar consultas (que también actualizará las estadísticas)
        await this.loadConsultasPendientes();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        console.log('✅ AsistenciaManager inicializado correctamente');
    }

    checkAuth() {
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('❌ No hay token de autenticación');
            return false;
        }

        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            this.profesionalId = payload.profesionalId || payload.id;
            this.token = token;
            
            console.log('✅ Usuario autenticado:', payload.email);
            return true;
        } catch (error) {
            console.error('❌ Error decodificando token:', error);
            localStorage.removeItem('token');
            return false;
        }
    }

    redirectToLogin() {
        window.location.href = '/login';
    }

    loadUserInfo() {
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            const userInfoElement = document.getElementById('userInfo');
            if (userInfoElement) {
                userInfoElement.textContent = `Dr. ${payload.nombre || 'Profesional'}`;
            }
        } catch (error) {
            console.error('❌ Error cargando información del usuario:', error);
        }
    }

    async loadEstadisticas() {
        try {
            console.log('📊 Cargando estadísticas...');
            
            const response = await fetch(`/api/asistencia/profesional/${this.profesionalId}/estadisticas`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.updateEstadisticas(result.data);
                console.log('✅ Estadísticas cargadas:', result.data);
            } else {
                throw new Error(result.message || 'Error cargando estadísticas');
            }

        } catch (error) {
            console.error('❌ Error cargando estadísticas:', error);
            this.showError('Error cargando estadísticas: ' + error.message);
        }
    }

    updateEstadisticasFromConsultas(data) {
        console.log('🔄 Actualizando estadísticas con datos:', data);
        
        // Actualizar elementos de estadísticas con datos del backend
        const elements = {
            totalConsultas: data.total || 0,
            asistieron: data.completadas || 0,
            noAsistieron: data.ausentes || 0,
            pendientes: data.pendientes || 0
        };

        console.log('📊 Elementos a actualizar:', elements);

        Object.keys(elements).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = elements[key];
                console.log(`✅ Actualizado ${key}: ${elements[key]}`);
            } else {
                console.warn(`⚠️ Elemento no encontrado: ${key}`);
            }
        });

        // Calcular porcentajes
        const total = elements.totalConsultas;
        if (total > 0) {
            const asistieronPercentage = Math.round((elements.asistieron / total) * 100);
            const noAsistieronPercentage = Math.round((elements.noAsistieron / total) * 100);

            const asistieronPercentageElement = document.getElementById('asistieronPercentage');
            const noAsistieronPercentageElement = document.getElementById('noAsistieronPercentage');

            if (asistieronPercentageElement) {
                asistieronPercentageElement.textContent = `${asistieronPercentage}%`;
            }
            if (noAsistieronPercentageElement) {
                noAsistieronPercentageElement.textContent = `${noAsistieronPercentage}%`;
            }
        }

        // Actualizar contador total
        const totalConsultasCountElement = document.getElementById('totalConsultasCount');
        if (totalConsultasCountElement) {
            totalConsultasCountElement.textContent = `${total} consultas`;
        }
    }

    updateEstadisticas(stats) {
        // Actualizar elementos de estadísticas
        const elements = {
            totalConsultas: stats.total_consultas || 0,
            asistieron: stats.asistieron || 0,
            noAsistieron: stats.no_asistieron || 0,
            pendientes: stats.pendientes_confirmacion || 0
        };

        Object.keys(elements).forEach(key => {
            const element = document.getElementById(key);
            if (element) {
                element.textContent = elements[key];
            }
        });

        // Calcular porcentajes
        const total = elements.totalConsultas;
        if (total > 0) {
            const asistieronPercentage = Math.round((elements.asistieron / total) * 100);
            const noAsistieronPercentage = Math.round((elements.noAsistieron / total) * 100);

            const asistieronPercentageElement = document.getElementById('asistieronPercentage');
            const noAsistieronPercentageElement = document.getElementById('noAsistieronPercentage');

            if (asistieronPercentageElement) {
                asistieronPercentageElement.textContent = `${asistieronPercentage}%`;
            }
            if (noAsistieronPercentageElement) {
                noAsistieronPercentageElement.textContent = `${noAsistieronPercentage}%`;
            }
        }

        // Actualizar contador de consultas
        const totalConsultasCountElement = document.getElementById('totalConsultasCount');
        if (totalConsultasCountElement) {
            totalConsultasCountElement.textContent = `${total} consultas`;
        }
    }

    async loadConsultasPendientes(page = 1) {
        try {
            console.log('📋 Cargando consultas pendientes, página:', page);
            
            const container = document.getElementById('consultasContainer');
            if (container) {
                container.innerHTML = `
                    <div class="loading-state">
                        <div class="spinner-border text-primary" role="status">
                            <span class="visually-hidden">Cargando...</span>
                        </div>
                        <p class="mt-3 text-muted">Cargando consultas...</p>
                    </div>
                `;
            }

            const response = await fetch(`/api/asistencia/profesional/${this.profesionalId}/pendientes?page=${page}&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                // Aplanar las consultas agrupadas en un array simple
                this.consultasData = [];
                result.data.consultas.forEach(grupo => {
                    grupo.consultas.forEach(consulta => {
                        this.consultasData.push(consulta);
                    });
                });
                
                // Ordenar las consultas por estado, fecha y hora (igual que en el backend)
                this.consultasData.sort((a, b) => {
                    // Primero por estado: Pendientes → No Asistió → Asistió
                    const estadoOrder = { 'activo': 1, 'ausente': 2, 'completado': 3 };
                    const estadoA = estadoOrder[a.estado] || 4;
                    const estadoB = estadoOrder[b.estado] || 4;
                    
                    if (estadoA !== estadoB) {
                        return estadoA - estadoB;
                    }
                    
                    // Luego por fecha (más reciente primero)
                    const fechaA = new Date(a.fecha);
                    const fechaB = new Date(b.fecha);
                    if (fechaA.getTime() !== fechaB.getTime()) {
                        return fechaB - fechaA;
                    }
                    
                    // Finalmente por hora (más reciente primero)
                    return b.hora.localeCompare(a.hora);
                });
                
                this.filteredConsultas = [...this.consultasData];
                
                // Actualizar información de paginación
                this.pagination = result.data.pagination;
                console.log('📄 Paginación actualizada:', this.pagination);
                
                // Debug: mostrar datos recibidos
                console.log('📊 Datos recibidos del backend:', result.data);
                console.log('📋 Consultas cargadas:', this.consultasData.length);
                console.log('📄 Paginación:', this.pagination);
                console.log('📈 Estadísticas:', {
                    total: result.data.total,
                    completadas: result.data.completadas,
                    ausentes: result.data.ausentes,
                    pendientes: result.data.pendientes
                });
                
                // Actualizar estadísticas con los datos del backend
                this.updateEstadisticasFromConsultas(result.data);
                
                this.renderConsultas();
                this.updateLastUpdateTime();
                
                console.log('✅ Consultas cargadas:', this.consultasData.length);
            } else {
                throw new Error(result.message || 'Error cargando consultas');
            }

        } catch (error) {
            console.error('❌ Error cargando consultas:', error);
            this.showError('Error cargando consultas: ' + error.message);
        }
    }

    renderConsultas() {
        const container = document.getElementById('consultasContainer');
        if (!container) return;

        if (this.filteredConsultas.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-check"></i>
                    <h5>No hay consultas</h5>
                    <p>No se encontraron consultas con los filtros aplicados.</p>
                </div>
            `;
            return;
        }

        // Crear tabla compacta
        let html = `
            <div class="table-responsive">
                <table class="table table-hover table-striped">
                    <thead class="table-dark">
                        <tr>
                            <th><i class="fas fa-sort-numeric-up me-1"></i> #</th>
                            <th><i class="fas fa-calendar me-1"></i> Fecha</th>
                            <th><i class="fas fa-clock me-1"></i> Hora</th>
                            <th><i class="fas fa-user me-1"></i> Paciente</th>
                            <th><i class="fas fa-envelope me-1"></i> Email</th>
                            <th><i class="fas fa-phone me-1"></i> Teléfono</th>
                            <th><i class="fas fa-stethoscope me-1"></i> Motivo</th>
                            <th><i class="fas fa-info-circle me-1"></i> Estado</th>
                            <th><i class="fas fa-cogs me-1"></i> Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        this.filteredConsultas.forEach((consulta, index) => {
            html += this.renderConsultaRow(consulta, index + 1);
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        container.innerHTML = html;
        this.updateFilteredCount();
        this.renderPagination();
    }

    renderPagination() {
        console.log('🔄 Renderizando paginación, this.pagination:', this.pagination);
        
        const container = document.getElementById('paginationContainer');
        if (!container) {
            console.log('❌ Contenedor de paginación no encontrado');
            return;
        }

        // Verificar que this.pagination existe y tiene las propiedades necesarias
        if (!this.pagination || !this.pagination.currentPage) {
            console.log('❌ Paginación no disponible o incompleta');
            container.innerHTML = '';
            return;
        }

        const { currentPage, totalPages, totalItems } = this.pagination;
        
        // Verificar que todas las propiedades necesarias existen
        if (!currentPage || !totalPages || totalItems === undefined) {
            container.innerHTML = '';
            return;
        }
        
        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let html = `
            <nav aria-label="Paginación de consultas">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="pagination-info">
                        <small class="text-muted">
                            Mostrando ${((currentPage - 1) * 10) + 1} - ${Math.min(currentPage * 10, totalItems)} de ${totalItems} consultas
                        </small>
                    </div>
                    <ul class="pagination pagination-sm mb-0">
        `;

        // Botón anterior
        if (currentPage > 1) {
            html += `
                <li class="page-item">
                    <button class="page-link" onclick="asistenciaManager.loadConsultasPendientes(${currentPage - 1})">
                        <i class="fas fa-chevron-left"></i>
                    </button>
                </li>
            `;
        } else {
            html += `
                <li class="page-item disabled">
                    <span class="page-link">
                        <i class="fas fa-chevron-left"></i>
                    </span>
                </li>
            `;
        }

        // Números de página
        const startPage = Math.max(1, currentPage - 2);
        const endPage = Math.min(totalPages, currentPage + 2);

        if (startPage > 1) {
            html += `
                <li class="page-item">
                    <button class="page-link" onclick="asistenciaManager.loadConsultasPendientes(1)">1</button>
                </li>
            `;
            if (startPage > 2) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            if (i === currentPage) {
                html += `
                    <li class="page-item active">
                        <span class="page-link">${i}</span>
                    </li>
                `;
            } else {
                html += `
                    <li class="page-item">
                        <button class="page-link" onclick="asistenciaManager.loadConsultasPendientes(${i})">${i}</button>
                    </li>
                `;
            }
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
            }
            html += `
                <li class="page-item">
                    <button class="page-link" onclick="asistenciaManager.loadConsultasPendientes(${totalPages})">${totalPages}</button>
                </li>
            `;
        }

        // Botón siguiente
        if (currentPage < totalPages) {
            html += `
                <li class="page-item">
                    <button class="page-link" onclick="asistenciaManager.loadConsultasPendientes(${currentPage + 1})">
                        <i class="fas fa-chevron-right"></i>
                    </button>
                </li>
            `;
        } else {
            html += `
                <li class="page-item disabled">
                    <span class="page-link">
                        <i class="fas fa-chevron-right"></i>
                    </span>
                </li>
            `;
        }

        html += `
                    </ul>
                </div>
            </nav>
        `;

        container.innerHTML = html;
    }

    renderConsultaRow(consulta, numero) {
        const estadoClass = this.getEstadoBadgeClass(consulta.estado);
        const estadoText = this.getEstadoText(consulta.estado);
        const estadoIcon = this.getEstadoIcon(consulta.estado);
        
        // Formatear fecha para mostrar solo día/mes
        const fechaFormateada = this.formatDateShort(consulta.fecha);
        
        // Truncar texto largo
        const motivoTruncado = this.truncateText(consulta.motivo_consulta || 'Sin motivo', 30);
        const emailTruncado = this.truncateText(consulta.paciente_email || 'Sin email', 25);
        const telefonoTruncado = consulta.paciente_telefono || 'Sin teléfono';

        // Determinar clase de fila según estado
        let rowClass = '';
        if (consulta.estado === 'activo') {
            rowClass = 'table-warning'; // Amarillo para pendientes (prioridad 1)
        } else if (consulta.estado === 'completado') {
            rowClass = 'table-success'; // Verde para asistió (prioridad 2)
        } else if (consulta.estado === 'ausente') {
            rowClass = 'table-danger'; // Rojo para no asistió (prioridad 3)
        }

        return `
            <tr class="consulta-row ${rowClass}" data-consulta-id="${consulta.id}">
                <td>
                    <span class="badge bg-primary">${numero}</span>
                </td>
                <td>
                    <span class="fw-bold text-primary">${fechaFormateada}</span>
                </td>
                <td>
                    <span class="text-muted">${consulta.hora}</span>
                </td>
                <td>
                    <span class="fw-semibold">${consulta.paciente_nombre}</span>
                </td>
                <td>
                    <span class="text-muted small" title="${consulta.paciente_email || 'Sin email'}">
                        ${emailTruncado}
                    </span>
                </td>
                <td>
                    <span class="text-muted small">${telefonoTruncado}</span>
                </td>
                <td>
                    <span class="text-muted small" title="${consulta.motivo_consulta || 'Sin motivo'}">
                        ${motivoTruncado}
                    </span>
                </td>
                <td>
                    <span class="badge ${estadoClass}">
                        <i class="${estadoIcon} me-1"></i>
                        ${estadoText}
                    </span>
                </td>
                <td>
                    <div class="btn-group btn-group-sm" role="group">
                        ${consulta.estado === 'activo' ? `
                            <button class="btn btn-success btn-sm" 
                                    onclick="asistenciaManager.confirmarAsistenciaModal(${consulta.id}, '${consulta.paciente_nombre}', '${consulta.fecha}', '${consulta.hora}', '${consulta.motivo_consulta || ''}', '${consulta.paciente_email || ''}', '${consulta.paciente_telefono || ''}')"
                                    title="Confirmar asistencia">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : `
                            <span class="text-muted small">
                                <i class="fas fa-check-circle me-1"></i>
                                Confirmado
                            </span>
                        `}
                        <button class="btn btn-outline-info btn-sm" 
                                onclick="asistenciaManager.verDetalles(${consulta.id})"
                                title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${consulta.codigo_cancelacion ? `
                            <button class="btn btn-outline-secondary btn-sm" 
                                    onclick="asistenciaManager.mostrarCodigoCancelacion('${consulta.codigo_cancelacion}')"
                                    title="Ver código de cancelación">
                                <i class="fas fa-key"></i>
                            </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `;
    }

    getEstadoBadgeClass(estado) {
        const classes = {
            'activo': 'bg-warning text-dark',
            'ausente': 'bg-danger',
            'completado': 'bg-success'
        };
        return classes[estado] || 'bg-secondary';
    }

    getEstadoText(estado) {
        const texts = {
            'activo': 'Pendiente',
            'ausente': 'No asistió',
            'completado': 'Asistió'
        };
        return texts[estado] || estado;
    }

    getEstadoIcon(estado) {
        const icons = {
            'activo': 'fas fa-clock',
            'ausente': 'fas fa-times',
            'completado': 'fas fa-check'
        };
        return icons[estado] || 'fas fa-question';
    }

    formatDateShort(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit'
        });
    }

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    updateFilteredCount() {
        const countElement = document.getElementById('filteredCount');
        if (countElement) {
            const total = this.filteredConsultas ? this.filteredConsultas.length : 0;
            countElement.textContent = `${total} consultas`;
        }
    }

    updateLastUpdateTime() {
        const lastUpdateElement = document.getElementById('lastUpdate');
        if (lastUpdateElement) {
            const now = new Date();
            lastUpdateElement.textContent = `Última actualización: ${now.toLocaleTimeString('es-ES')}`;
        }
    }

    setupEventListeners() {
        // Botón de actualizar
        const refreshBtn = document.querySelector('button[onclick="loadConsultasPendientes()"]');
        if (refreshBtn) {
            refreshBtn.onclick = () => this.loadConsultasPendientes();
        }

        // Filtros
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.currentFilters.search = e.target.value;
                this.applyFilters();
            });
        }

        const estadoFilter = document.getElementById('estadoFilter');
        if (estadoFilter) {
            estadoFilter.addEventListener('change', (e) => {
                this.currentFilters.estado = e.target.value;
                this.applyFilters();
            });
        }

        const fechaFilter = document.getElementById('fechaFilter');
        if (fechaFilter) {
            fechaFilter.addEventListener('change', (e) => {
                this.currentFilters.fecha = e.target.value;
                this.applyFilters();
            });
        }

        // Botón aplicar filtros
        const applyBtn = document.querySelector('button[onclick="applyFilters()"]');
        if (applyBtn) {
            applyBtn.onclick = () => this.applyFilters();
        }

        // Botón limpiar búsqueda
        const clearBtn = document.querySelector('button[onclick="clearSearch()"]');
        if (clearBtn) {
            clearBtn.onclick = () => this.clearSearch();
        }
    }

    applyFilters() {
        console.log('🔍 Aplicando filtros:', this.currentFilters);
        
        this.filteredConsultas = this.consultasData.filter(consulta => {
            // Filtro de búsqueda
            if (this.currentFilters.search) {
                const searchTerm = this.currentFilters.search.toLowerCase();
                if (!consulta.paciente_nombre.toLowerCase().includes(searchTerm) &&
                    !consulta.paciente_email.toLowerCase().includes(searchTerm)) {
                    return false;
                }
            }

            // Filtro de estado
            if (this.currentFilters.estado && consulta.estado !== this.currentFilters.estado) {
                return false;
            }

            // Filtro de fecha
            if (this.currentFilters.fecha) {
                const consultaDate = new Date(consulta.fecha);
                const today = new Date();
                
                switch (this.currentFilters.fecha) {
                    case 'hoy':
                        if (consultaDate.toDateString() !== today.toDateString()) {
                            return false;
                        }
                        break;
                    case 'ayer':
                        const yesterday = new Date(today);
                        yesterday.setDate(yesterday.getDate() - 1);
                        if (consultaDate.toDateString() !== yesterday.toDateString()) {
                            return false;
                        }
                        break;
                    case 'semana':
                        const weekAgo = new Date(today);
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        if (consultaDate < weekAgo) {
                            return false;
                        }
                        break;
                    case 'mes':
                        const monthAgo = new Date(today);
                        monthAgo.setMonth(monthAgo.getMonth() - 1);
                        if (consultaDate < monthAgo) {
                            return false;
                        }
                        break;
                }
            }

            return true;
        });

        this.renderConsultas();
    }

    clearSearch() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.value = '';
        }
        this.currentFilters.search = '';
        this.applyFilters();
    }

    confirmarAsistenciaModal(consultaId, pacienteNombre, fecha, hora, motivo, email, telefono) {
        console.log('📝 Abriendo modal de confirmación para consulta:', consultaId);
        
        // Llenar datos del modal
        document.getElementById('modalPacienteNombre').textContent = pacienteNombre;
        document.getElementById('modalPacienteEmail').textContent = email || 'Sin email';
        document.getElementById('modalPacienteTelefono').textContent = telefono || 'Sin teléfono';
        document.getElementById('modalFecha').textContent = this.formatDate(fecha);
        document.getElementById('modalHora').textContent = hora;
        document.getElementById('modalMotivo').textContent = motivo || 'Sin motivo especificado';
        
        // Limpiar notas
        document.getElementById('notasProfesional').value = '';
        
        // Guardar ID de consulta para usar en confirmación
        this.currentConsultaId = consultaId;
        
        // Mostrar modal
        const modal = new bootstrap.Modal(document.getElementById('confirmarAsistenciaModal'));
        modal.show();
    }

    async confirmarAsistencia(estado) {
        if (!this.currentConsultaId) {
            this.showError('No hay consulta seleccionada');
            return;
        }

        try {
            console.log(`✅ Confirmando asistencia: ${estado} para consulta ${this.currentConsultaId}`);
            
            const notas = document.getElementById('notasProfesional').value;
            
            const response = await fetch(`/api/asistencia/consulta/${this.currentConsultaId}/confirmar`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    estado: estado,
                    notas_profesional: notas
                })
            });

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess(`Asistencia confirmada como: ${this.getEstadoText(estado)}`);
                
                // Cerrar modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('confirmarAsistenciaModal'));
                modal.hide();
                
                // Actualizar inmediatamente la fila específica en la tabla
                this.updateConsultaRowInTable(this.currentConsultaId, estado);
                
                // Recargar datos completos (que también actualizará las estadísticas)
                await this.loadConsultasPendientes();
                
            } else {
                throw new Error(result.message || 'Error confirmando asistencia');
            }

        } catch (error) {
            console.error('❌ Error confirmando asistencia:', error);
            this.showError('Error confirmando asistencia: ' + error.message);
        }
    }

    verDetalles(consultaId) {
        console.log('👁️ Ver detalles de consulta:', consultaId);
        
        // Buscar la consulta en los datos locales
        const consulta = this.consultasData.find(c => c.id === consultaId);
        if (!consulta) {
            this.showError('No se encontró la consulta');
            return;
        }
        
        // Llenar el modal con los datos de la consulta
        this.populateDetallesModal(consulta);
        
        // Mostrar el modal
        const modal = new bootstrap.Modal(document.getElementById('verDetallesModal'));
        modal.show();
    }

    populateDetallesModal(consulta) {
        // Información del paciente
        document.getElementById('detallesPacienteNombre').textContent = consulta.paciente_nombre || 'No disponible';
        document.getElementById('detallesPacienteEmail').textContent = consulta.paciente_email || 'No disponible';
        document.getElementById('detallesPacienteTelefono').textContent = consulta.paciente_telefono || 'No disponible';
        document.getElementById('detallesPacienteDocumento').textContent = consulta.paciente_documento || 'No disponible';
        
        // Detalles de la consulta
        document.getElementById('detallesFecha').textContent = this.formatDateLong(consulta.fecha);
        document.getElementById('detallesHora').textContent = consulta.hora;
        document.getElementById('detallesMotivo').textContent = consulta.motivo_consulta || 'Sin motivo especificado';
        
        // Estado actual
        const estadoClass = this.getEstadoBadgeClass(consulta.estado);
        const estadoText = this.getEstadoText(consulta.estado);
        const estadoIcon = this.getEstadoIcon(consulta.estado);
        
        document.getElementById('detallesEstado').innerHTML = `
            <span class="badge ${estadoClass}">
                <i class="${estadoIcon} me-1"></i>
                ${estadoText}
            </span>
        `;
        
        // Estado actual para el selector
        document.getElementById('detallesEstadoActual').innerHTML = `
            <span class="badge ${estadoClass}">
                <i class="${estadoIcon} me-1"></i>
                ${estadoText}
            </span>
        `;
        
        // Notas profesionales
        const notasActuales = consulta.notas_profesional || '';
        const notasElement = document.getElementById('detallesNotasActuales');
        if (notasActuales.trim()) {
            notasElement.innerHTML = `<div class="text-dark">${notasActuales}</div>`;
        } else {
            notasElement.innerHTML = '<em class="text-muted">Sin notas registradas</em>';
        }
        
        // Limpiar el textarea de notas nuevas
        document.getElementById('detallesNotasNuevas').value = '';
        
        // Limpiar el selector de estado
        document.getElementById('detallesNuevoEstado').value = '';
        
        // Guardar el ID de la consulta para uso posterior
        this.currentConsultaId = consulta.id;
    }

    // Función para cambiar el estado de la consulta
    async cambiarEstadoConsulta() {
        if (!this.currentConsultaId) {
            this.showError('No hay consulta seleccionada');
            return;
        }

        const nuevoEstado = document.getElementById('detallesNuevoEstado').value;
        const nuevasNotas = document.getElementById('detallesNotasNuevas').value.trim();

        if (!nuevoEstado) {
            this.showError('Por favor selecciona un nuevo estado');
            return;
        }

        try {
            console.log(`🔄 Cambiando estado de consulta ${this.currentConsultaId} a: ${nuevoEstado}`);
            
            const response = await fetch(`/api/asistencia/consulta/${this.currentConsultaId}/cambiar-estado`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${this.token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    estado: nuevoEstado,
                    notas_profesional: nuevasNotas
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Error cambiando estado');
            }

            const result = await response.json();
            
            if (result.success) {
                this.showSuccess('Estado actualizado correctamente');
                
                // Actualizar la fila en la tabla
                this.updateConsultaRowInTable(this.currentConsultaId, nuevoEstado);
                
                // Actualizar las estadísticas
                await this.loadEstadisticas();
                
                // Cerrar el modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('verDetallesModal'));
                modal.hide();
                
                // Limpiar el formulario
                document.getElementById('detallesNuevoEstado').value = '';
                document.getElementById('detallesNotasNuevas').value = '';
            } else {
                throw new Error(result.message || 'Error actualizando estado');
            }
        } catch (error) {
            console.error('❌ Error cambiando estado:', error);
            this.showError('Error cambiando estado: ' + error.message);
        }
    }

    // Formatear fecha larga para mostrar en detalles
    formatDateLong(dateString) {
        try {
            const date = new Date(dateString);
            const options = { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            };
            return date.toLocaleDateString('es-ES', options);
        } catch (error) {
            console.warn('⚠️ Error formateando fecha:', error);
            return dateString;
        }
    }

    // Actualizar inmediatamente una fila específica en la tabla
    updateConsultaRowInTable(consultaId, nuevoEstado) {
        console.log(`🔄 Actualizando fila de consulta ${consultaId} a estado: ${nuevoEstado}`);
        
        // Buscar la fila en la tabla
        const row = document.querySelector(`tr[data-consulta-id="${consultaId}"]`);
        if (!row) {
            console.warn(`⚠️ No se encontró la fila para consulta ${consultaId}`);
            return;
        }
        
        // Actualizar el estado en los datos locales
        const consulta = this.consultasData.find(c => c.id === consultaId);
        if (consulta) {
            consulta.estado = nuevoEstado;
        }
        
        // Actualizar la fila en la tabla
        const estadoCell = row.querySelector('td:nth-child(8)'); // Columna de estado
        const accionesCell = row.querySelector('td:nth-child(9)'); // Columna de acciones
        
        if (estadoCell) {
            const estadoClass = this.getEstadoBadgeClass(nuevoEstado);
            const estadoText = this.getEstadoText(nuevoEstado);
            const estadoIcon = this.getEstadoIcon(nuevoEstado);
            
            estadoCell.innerHTML = `
                <span class="badge ${estadoClass}">
                    <i class="${estadoIcon} me-1"></i>
                    ${estadoText}
                </span>
            `;
        }
        
        if (accionesCell) {
            if (nuevoEstado === 'activo') {
                accionesCell.innerHTML = `
                    <div class="btn-group btn-group-sm" role="group">
                        <button class="btn btn-success btn-sm" 
                                onclick="asistenciaManager.confirmarAsistenciaModal(${consultaId}, '${consulta?.paciente_nombre || 'Paciente'}', '${consulta?.fecha || ''}', '${consulta?.hora || ''}', '${consulta?.motivo_consulta || ''}', '${consulta?.paciente_email || ''}', '${consulta?.paciente_telefono || ''}')"
                                title="Confirmar asistencia">
                            <i class="fas fa-check"></i>
                        </button>
                        <button class="btn btn-outline-info btn-sm" 
                                onclick="asistenciaManager.verDetalles(${consultaId})"
                                title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${consulta?.codigo_cancelacion ? `
                            <button class="btn btn-outline-secondary btn-sm" 
                                    onclick="asistenciaManager.mostrarCodigoCancelacion('${consulta.codigo_cancelacion}')"
                                    title="Ver código de cancelación">
                                <i class="fas fa-key"></i>
                            </button>
                        ` : ''}
                    </div>
                `;
            } else {
                accionesCell.innerHTML = `
                    <div class="btn-group btn-group-sm" role="group">
                        <span class="text-muted small">
                            <i class="fas fa-check-circle me-1"></i>
                            Confirmado
                        </span>
                        <button class="btn btn-outline-info btn-sm" 
                                onclick="asistenciaManager.verDetalles(${consultaId})"
                                title="Ver detalles">
                            <i class="fas fa-eye"></i>
                        </button>
                        ${consulta?.codigo_cancelacion ? `
                            <button class="btn btn-outline-secondary btn-sm" 
                                    onclick="asistenciaManager.mostrarCodigoCancelacion('${consulta.codigo_cancelacion}')"
                                    title="Ver código de cancelación">
                                <i class="fas fa-key"></i>
                            </button>
                        ` : ''}
                    </div>
                `;
            }
        }
        
        // Actualizar la clase de la fila según el estado
        row.className = `consulta-row ${this.getRowClass(nuevoEstado)}`;
        
        console.log(`✅ Fila actualizada para consulta ${consultaId}`);
    }
    
    // Obtener clase CSS para la fila según el estado
    getRowClass(estado) {
        if (estado === 'activo') {
            return 'table-warning'; // Amarillo para pendientes
        } else if (estado === 'completado') {
            return 'table-success'; // Verde para asistió
        } else if (estado === 'ausente') {
            return 'table-danger'; // Rojo para no asistió
        }
        return '';
    }

    mostrarCodigoCancelacion(codigo) {
        this.showInfo(`Código de cancelación: ${codigo}`);
    }

    showSuccess(message) {
        this.showAlert(message, 'success');
    }

    showError(message) {
        this.showAlert(message, 'danger');
    }

    showInfo(message) {
        this.showAlert(message, 'info');
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
}

// Funciones globales para compatibilidad con HTML
let asistenciaManager;

function goBackToDashboard() {
    window.location.href = '/dashboard/professional';
}

function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}

function loadConsultasPendientes() {
    if (asistenciaManager) {
        asistenciaManager.loadConsultasPendientes();
    }
}

function applyFilters() {
    if (asistenciaManager) {
        asistenciaManager.applyFilters();
    }
}

function clearSearch() {
    if (asistenciaManager) {
        asistenciaManager.clearSearch();
    }
}

function confirmarAsistencia(estado) {
    if (asistenciaManager) {
        asistenciaManager.confirmarAsistencia(estado);
    }
}

// Funciones de ayuda eliminadas

function toggleViewMode() {
    // Implementar cambio de vista si es necesario
    asistenciaManager.showInfo('Cambio de vista próximamente disponible');
}

// Función global para cambiar estado de consulta (llamada desde HTML)
function cambiarEstadoConsulta() {
    if (asistenciaManager) {
        asistenciaManager.cambiarEstadoConsulta();
    } else {
        console.error('AsistenciaManager no está inicializado');
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación de gestión de asistencia...');
    asistenciaManager = new AsistenciaManager();
});