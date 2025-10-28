// Professional Dashboard JavaScript

// Variables globales para caché local y paginación
let pacientesCache = null;
let lastCacheUpdate = null;
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutos

// Variable global para almacenar datos de pacientes actuales
let pacientesData = [];

// Variables de paginación
let currentPage = 1;
let itemsPerPage = 10;
let totalPages = 1;
let totalItems = 0;

// Función para verificar si el caché local es válido
function isLocalCacheValid() {
    return pacientesCache && lastCacheUpdate && (Date.now() - lastCacheUpdate) < CACHE_DURATION;
}

// Función para filtrar pacientes localmente
function filterPacientesLocally(pacientes, searchTerm, status, sortBy) {
    let filtered = [...pacientes];
    
    // Aplicar filtro de búsqueda
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        filtered = filtered.filter(p => 
            p.apellido_nombre.toLowerCase().includes(term) ||
            p.numero_documento.includes(term) ||
            (p.email && p.email.toLowerCase().includes(term)) ||
            (p.telefono && p.telefono.includes(term))
        );
    }
    
    // Aplicar filtro de estado
    if (status) {
        if (status === 'activo') {
            filtered = filtered.filter(p => p.activo);
        } else if (status === 'inactivo') {
            filtered = filtered.filter(p => !p.activo);
        }
    }
    
    // Aplicar ordenamiento
    switch (sortBy) {
        case 'name':
            filtered.sort((a, b) => a.apellido_nombre.localeCompare(b.apellido_nombre));
            break;
        case 'lastConsultation':
            filtered.sort((a, b) => new Date(b.ultima_consulta || 0) - new Date(a.ultima_consulta || 0));
            break;
        case 'weight':
            filtered.sort((a, b) => (b.peso_actual || 0) - (a.peso_actual || 0));
            break;
        case 'created':
            filtered.sort((a, b) => new Date(b.creado_en) - new Date(a.creado_en));
            break;
    }
    
    return filtered;
}

// Función optimizada de búsqueda con caché local
async function searchPacientesOptimized(searchTerm, status, sortBy) {
    
    // Si tenemos caché local válido y no hay filtros complejos, usar filtrado local
    if (isLocalCacheValid() && pacientesCache && !searchTerm && !status) {
        const filtered = filterPacientesLocally(pacientesCache.data, '', '', sortBy);
        const stats = {
            total_pacientes: pacientesCache.stats.total_pacientes,
            pacientes_activos: pacientesCache.stats.pacientes_activos,
            pacientes_inactivos: pacientesCache.stats.pacientes_inactivos,
            consultas_pendientes: pacientesCache.stats.consultas_pendientes,
            con_consultas: pacientesCache.stats.con_consultas
        };
        
        // Actualizar variable global
        pacientesData = filtered;
        
        renderSearchResults(filtered, stats, '');
        return;
    }
    
    // Si hay búsqueda o filtros complejos, usar caché local si es posible
    if (isLocalCacheValid() && pacientesCache && searchTerm) {
        console.log('📦 Using local cache for search:', searchTerm);
        const filtered = filterPacientesLocally(pacientesCache.data, searchTerm, status, sortBy);
        const stats = {
            total_pacientes: filtered.length,
            pacientes_activos: filtered.filter(p => p.activo).length,
            pacientes_inactivos: filtered.filter(p => !p.activo).length,
            consultas_pendientes: pacientesCache.stats.consultas_pendientes,
            con_consultas: pacientesCache.stats.con_consultas
        };
        
        // Actualizar variable global
        pacientesData = filtered;
        
        renderSearchResults(filtered, stats, searchTerm);
        return;
    }
    
    // Si no hay caché válido, hacer consulta al servidor
    console.log('🌐 Making server request for search');
    await searchPacientes(searchTerm, status, sortBy);
}

// Función optimizada para búsqueda de pacientes
async function searchPatientsOptimized() {
    const searchTerm = document.getElementById('patientSearch')?.value?.trim() || '';
    const status = document.getElementById('statusFilter')?.value || '';
    const sortBy = document.getElementById('sortBy')?.value || 'name';
    
    console.log('🔍 Optimized search triggered:', { searchTerm, status, sortBy });
    
    await searchPacientesOptimized(searchTerm, status, sortBy);
}

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize dashboard
    initProfessionalDashboard();
});

// Initialize professional dashboard
function initProfessionalDashboard() {
    console.log('Initializing professional dashboard...');
    
    // Load professional data
    loadProfessionalData();
    
    // Initialize sidebar
    initSidebar();
    
    // Load dashboard content
    loadDashboardContent();
    
    // Initialize home section
    initializeHomeSection();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check URL parameters for initial section
    checkUrlParameters();
    
    // Test: Add click listener to pacientes link
    const pacientesLink = document.querySelector('a[href="#pacientes"]');
    if (pacientesLink) {
        console.log('Pacientes link found, adding click listener');
        pacientesLink.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Pacientes link clicked!');
            showSection('pacientes');
        });
    } else {
        console.error('Pacientes link not found!');
    }
}

// Check URL parameters for initial section
function checkUrlParameters() {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    
    if (tab) {
        console.log('URL parameter tab found:', tab);
        // Small delay to ensure DOM is fully loaded
        setTimeout(() => {
            showSection(tab);
        }, 100);
    }
}

// Load professional data
function loadProfessionalData() {
    // Get user data from localStorage (from login)
    const userData = localStorage.getItem('user');
    
    if (userData) {
        const user = JSON.parse(userData);
        document.getElementById('professionalName').textContent = user.nombre || user.usuario;
        document.getElementById('professionalNameSidebar').textContent = user.nombre || user.usuario;
    }
    
    // Simulate loading professional data
    setTimeout(() => {
        updateProfessionalStats();
    }, 1000);
}

// Update professional statistics
function updateProfessionalStats() {
    // Simulate API call to get professional data
    // In a real application, this would be an actual API call
    const professionalData = {
        totalPatients: 0,
        appointmentsToday: 0,
        nextAppointment: 'No hay turnos',
        alerts: 0
    };
    
    // Update UI elements with loading state first
    const totalPatientsElement = document.getElementById('totalPatientsCount');
    const appointmentsElement = document.getElementById('appointmentsToday');
    const nextAppointmentElement = document.getElementById('nextAppointmentTime');
    const alertsElement = document.getElementById('alertsCount');
    
    if (totalPatientsElement) totalPatientsElement.textContent = 'Cargando...';
    if (appointmentsElement) appointmentsElement.textContent = 'Cargando...';
    if (nextAppointmentElement) nextAppointmentElement.textContent = 'Cargando...';
    if (alertsElement) alertsElement.textContent = 'Cargando...';
    
    // Simulate API delay
    setTimeout(() => {
        // Update with actual data (or placeholder if no data)
        if (totalPatientsElement) totalPatientsElement.textContent = professionalData.totalPatients;
        if (appointmentsElement) appointmentsElement.textContent = professionalData.appointmentsToday;
        if (nextAppointmentElement) nextAppointmentElement.textContent = professionalData.nextAppointment;
        if (alertsElement) alertsElement.textContent = professionalData.alerts;
        
        // Update sidebar stats
        const sidebarPatientElement = document.getElementById('sidebarPatientCount');
        const sidebarAppointmentsElement = document.getElementById('sidebarAppointmentsToday');
        
        if (sidebarPatientElement) sidebarPatientElement.textContent = professionalData.totalPatients;
        if (sidebarAppointmentsElement) sidebarAppointmentsElement.textContent = professionalData.appointmentsToday;
    }, 1500);
}

// Initialize sidebar
function initSidebar() {
    const sidebarLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Remove active class from all links
            sidebarLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            this.classList.add('active');
        });
    });
}

// Show section
function showSection(sectionName) {
    console.log('showSection called with:', sectionName);
    
    // Remove active class from all nav links
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    
    // Add active class to current nav link
    const currentLink = document.querySelector(`[href="#${sectionName}"]`);
    if (currentLink) {
        currentLink.classList.add('active');
    }
    
    // Hide all sections
    const sections = document.querySelectorAll('.content-section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Show selected section
    const targetSection = document.getElementById(sectionName + '-section');
    if (targetSection) {
        targetSection.classList.add('active');
        console.log('Section activated:', sectionName + '-section');
        
        // Load section content
        loadSectionContent(sectionName);
    } else {
        console.log('Section not found:', sectionName + '-section');
    }
}

// Load section content
function loadSectionContent(sectionName) {
    console.log('loadSectionContent called with:', sectionName);
    const section = document.getElementById(sectionName + '-section');
    
    switch(sectionName) {
        case 'dashboard':
            loadDashboardContent();
            break;
        case 'pacientes':
            console.log('Loading pacientes content');
            loadPacientesContent();
            break;
        case 'agenda':
            loadAgendaContent();
            break;
        case 'horarios':
            loadHorariosContent();
            break;
        case 'planes':
            loadPlanesContent();
            break;
        case 'asistencia':
            loadAsistenciaContent();
            break;
    }
}

// Load dashboard content
function loadDashboardContent() {
    console.log('Loading professional dashboard content...');
    // Dashboard content is already loaded in HTML
}

// Load pacientes content (OPTIMIZADO CON CACHÉ LOCAL)
async function loadPacientesContent() {
    console.log('Loading pacientes content...');
    const section = document.getElementById('pacientes-section');
    
    if (!section) {
        console.error('Section pacientes-section not found');
        return;
    }
    
    console.log('Section found, loading content...');
    
    // Mostrar loading
    section.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3">Cargando pacientes...</p>
        </div>
    `;
    
    try {
        // Obtener datos del usuario logueado
        const userData = localStorage.getItem('user');
        console.log('User data from localStorage:', userData);
        
        if (!userData) {
            throw new Error('Usuario no autenticado');
        }
        
        const user = JSON.parse(userData);
        const token = localStorage.getItem('token');
        console.log('User ID:', user.id, 'Token exists:', !!token);
        
        // Obtener pacientes desde la API (forzar actualización)
        const response = await fetch(`/api/usuarios/profesional/${user.id}/pacientes?forceRefresh=true&page=${currentPage}&limit=${itemsPerPage}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('API Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('API Error:', errorText);
            throw new Error(`Error al cargar pacientes: ${response.status}`);
        }
        
        const result = await response.json();
        const pacientes = result.data;
        
        // Actualizar variables globales
        pacientesData = pacientes;
        
        // Actualizar información de paginación
        if (result.pagination) {
            currentPage = result.pagination.currentPage;
            totalPages = result.pagination.totalPages;
            totalItems = result.pagination.totalItems;
            // itemsPerPage siempre será 10 (fijo)
        } else {
            console.log('⚠️  No se recibió información de paginación de la API');
            console.log('🔧 Usando valores por defecto para paginación');
            totalItems = pacientes ? pacientes.length : 0;
            totalPages = Math.ceil(totalItems / itemsPerPage);
        }
        
        // Usar las estadísticas de la API si están disponibles, sino calcularlas
        const stats = result.stats ? {
            total_pacientes: result.stats.total_pacientes,
            pacientes_activos: result.stats.pacientes_activos,
            pacientes_inactivos: result.stats.pacientes_inactivos,
            consultas_pendientes: result.stats.consultas_pendientes,
            con_consultas: result.stats.con_consultas
        } : {
            total_pacientes: pacientes.length,
            pacientes_activos: pacientes.filter(p => p.activo).length,
            pacientes_inactivos: pacientes.filter(p => !p.activo).length,
            consultas_pendientes: 0,
            con_consultas: 0
        };
        
        console.log('📊 Stats being used:', stats);
        
        // Guardar en caché local
        pacientesCache = {
            data: pacientes,
            stats: stats,
            timestamp: Date.now()
        };
        lastCacheUpdate = Date.now();
        console.log('💾 Local cache updated');
        
        // Renderizar contenido usando la función unificada
        renderSearchResults(pacientes, stats, '', result.pagination);
    
    } catch (error) {
        console.error('Error cargando pacientes:', error);
        section.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Error al cargar pacientes</h4>
                <p>${error.message}</p>
                <hr>
                <button class="btn btn-outline-danger" id="retryBtn">
                    <i class="fas fa-redo me-2"></i>Reintentar
                </button>
            </div>
        `;
        
        // Reconfigurar event listeners después del error
        setupSearchEventListeners();
    }
}

// Test function to verify pacientes section works
function testPacientesSection() {
    console.log('Testing pacientes section...');
    showSection('pacientes');
}

// Patient management functions
function handleSearchKeypress(event) {
    if (event.key === 'Enter') {
        searchPatients();
    }
}

async function searchPatients() {
    const searchTerm = document.getElementById('patientSearch')?.value.trim() || '';
    console.log('🔍 Searching for:', searchTerm);
    console.log('🔍 Search input element:', document.getElementById('patientSearch'));
    
    // Mostrar loading
    const section = document.getElementById('pacientes-section');
    const originalContent = section.innerHTML;
    
    section.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Buscando...</span>
            </div>
            <p class="mt-3">Buscando pacientes...</p>
        </div>
    `;
    
    try {
        // Obtener datos del usuario logueado
        const userData = localStorage.getItem('user');
        if (!userData) {
            throw new Error('Usuario no autenticado');
        }
        
        const user = JSON.parse(userData);
        const token = localStorage.getItem('token');
        
        console.log('🔍 User data:', user);
        console.log('🔍 Token exists:', !!token);
        
        // Construir URL con parámetro de búsqueda
        let url = `/api/usuarios/profesional/${user.id}/pacientes`;
        if (searchTerm) {
            url += `?search=${encodeURIComponent(searchTerm)}`;
        }
        
        console.log('🔍 Making search request to:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('🔍 Response status:', response.status);
        console.log('🔍 Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('🔍 Search API Error:', errorText);
            throw new Error(`Error al buscar pacientes: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('🔍 Search Result:', result);
        const pacientes = result.data;
        
        // Actualizar variable global
        pacientesData = pacientes;
        
        // Usar las estadísticas de la API si están disponibles, sino calcularlas
        const stats = result.stats ? {
            total_pacientes: result.stats.total_pacientes,
            pacientes_activos: result.stats.pacientes_activos,
            pacientes_inactivos: result.stats.pacientes_inactivos,
            consultas_pendientes: result.stats.consultas_pendientes,
            con_consultas: result.stats.con_consultas
        } : {
            total_pacientes: pacientes.length,
            pacientes_activos: pacientes.filter(p => p.activo).length,
            pacientes_inactivos: pacientes.filter(p => !p.activo).length,
            consultas_pendientes: 0,
            con_consultas: 0
        };
        
        // Renderizar los resultados de búsqueda directamente
        renderSearchResults(pacientes, stats, searchTerm);
        
    } catch (error) {
        console.error('Error en búsqueda:', error);
        section.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Error en la búsqueda</h4>
                <p>${error.message}</p>
                <hr>
                <button class="btn btn-outline-danger" onclick="loadPacientesContent()">
                    <i class="fas fa-redo me-2"></i>Volver a la lista completa
                </button>
            </div>
        `;
    }
}

function renderSearchResults(pacientes, stats, searchTerm, pagination = null) {
    const section = document.getElementById('pacientes-section');
    
    // Usar parámetros de paginación si están disponibles, sino usar variables globales
    const paginationData = pagination || {
        currentPage: currentPage,
        totalPages: totalPages,
        totalItems: totalItems,
        itemsPerPage: itemsPerPage
    };
    
    // ACTUALIZAR VARIABLES GLOBALES SI SE RECIBE PAGINACIÓN
    if (pagination) {
        currentPage = pagination.currentPage || 1;
        totalPages = pagination.totalPages || 1;
        totalItems = pagination.totalItems || 0;
        // itemsPerPage siempre será 10 (fijo)
    }
    
    // Verificar si hay datos de paginación válidos
    const hasValidPagination = paginationData.totalItems !== undefined && paginationData.totalItems !== null;
    
    if (hasValidPagination && paginationData.totalItems > 0) {
        // Paginación válida
    } else {
        // FORZAR PAGINACIÓN CON DATOS DISPONIBLES
        paginationData.totalItems = pacientes ? pacientes.length : 0;
        paginationData.totalPages = Math.max(1, Math.ceil(paginationData.totalItems / paginationData.itemsPerPage));
    }
    
    section.innerHTML = `
        <div class="section-header">
            <div class="row align-items-center">
                <div class="col-md-6">
                    <h2 class="section-title">Mis Pacientes</h2>
                    <p class="section-subtitle">${searchTerm ? `Resultados para "${searchTerm}"` : 'Gestión completa de pacientes activos'}</p>
                </div>
                <div class="col-md-6 text-end">
                    <button class="btn btn-primary" id="newPatientBtn">
                        <i class="fas fa-plus me-2"></i>Nuevo Paciente
                    </button>
                </div>
            </div>
        </div>

        <!-- Search and Filters -->
        <div class="row mb-4">
            <div class="col-md-3">
                <div class="input-group">
                    <input type="text" class="form-control" id="patientSearch" placeholder="Buscar pacientes..." value="${searchTerm}">
                    <button class="btn btn-outline-secondary" type="button" id="searchBtn">
                        <i class="fas fa-search"></i>
                    </button>
                </div>
            </div>
            <div class="col-md-2">
                <select class="form-select" id="statusFilter">
                    <option value="">Todos los estados</option>
                    <option value="activo">Activo</option>
                    <option value="inactivo">Inactivo</option>
                    <option value="pendiente">Pendiente</option>
                </select>
            </div>
            <div class="col-md-3">
                <select class="form-select" id="sortBy">
                    <option value="name">Ordenar por nombre</option>
                    <option value="lastConsultation">Última consulta</option>
                    <option value="weight">Peso</option>
                    <option value="created">Fecha de ingreso</option>
                </select>
            </div>
            <div class="col-md-2">
                <button class="btn btn-outline-warning w-100" id="resetFiltersBtn">
                    <i class="fas fa-undo me-1"></i>Restablecer
                </button>
            </div>
        </div>

        <!-- Patients Stats -->
        <div class="row g-3 mb-4">
            <div class="col-md-3">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-users"></i>
                    </div>
                    <div class="stat-content">
                        <h3>Total Pacientes</h3>
                        <p id="totalPatientsCount">${stats.total_pacientes || 0}</p>
                        ${stats.filtrados ? `<small class="text-muted">${stats.filtrados.total_encontrados} encontrados</small>` : ''}
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-user-check"></i>
                    </div>
                    <div class="stat-content">
                        <h3>Pacientes Activos</h3>
                        <p id="activePatientsCount">${stats.pacientes_activos || 0}</p>
                        ${stats.filtrados ? `<small class="text-muted">${stats.filtrados.activos_encontrados} en resultados</small>` : ''}
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-clock"></i>
                    </div>
                    <div class="stat-content">
                        <h3>Consultas Pendientes</h3>
                        <p id="pendingConsultationsCount">${stats.consultas_pendientes || 0}</p>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="stat-card">
                    <div class="stat-icon">
                        <i class="fas fa-calendar-check"></i>
                    </div>
                    <div class="stat-content">
                        <h3>Con Consultas</h3>
                        <p id="upcomingAppointmentsCount">${stats.con_consultas || 0}</p>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- Filter Status -->
        ${stats.filtros_aplicados && (stats.filtros_aplicados.busqueda || stats.filtros_aplicados.estado) ? `
        <div class="alert alert-info mb-4">
            <div class="d-flex align-items-center">
                <i class="fas fa-filter me-2"></i>
                <div>
                    <strong>Filtros aplicados:</strong>
                    ${stats.filtros_aplicados.busqueda ? `<span class="badge bg-primary me-2">Búsqueda: "${stats.filtros_aplicados.busqueda}"</span>` : ''}
                    ${stats.filtros_aplicados.estado ? `<span class="badge bg-secondary me-2">Estado: ${stats.filtros_aplicados.estado}</span>` : ''}
                    <span class="badge bg-light text-dark">Ordenamiento: ${stats.filtros_aplicados.ordenamiento}</span>
                </div>
                <div class="ms-auto">
                    <button class="btn btn-sm btn-outline-secondary" onclick="resetFilters()">
                        <i class="fas fa-times me-1"></i>Limpiar filtros
                    </button>
                </div>
            </div>
        </div>
        ` : ''}

        <!-- Patients Table -->
        <div class="card">
            <div class="card-body">
                <div class="table-responsive">
                    <table class="table table-hover" id="patientsTable">
                        <thead>
                            <tr>
                                <th>Paciente</th>
                                <th>Contacto</th>
                                <th>Última Consulta</th>
                                <th>Peso Actual</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody id="patientsTableBody">
                            ${pacientes && pacientes.length > 0 ? pacientes.map(paciente => `
                                <tr>
                                    <td>
                                        <div class="patient-info">
                                            <div class="patient-avatar-small">
                                                <i class="fas fa-user"></i>
                                            </div>
                                            <div class="patient-details">
                                                <strong>${paciente.apellido_nombre}</strong>
                                                <small class="text-muted d-block">DNI: ${paciente.numero_documento}</small>
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="contact-info">
                                            <small class="text-muted d-block">${paciente.email}</small>
                                            <small class="text-muted">${paciente.telefono || 'No especificado'}</small>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="consultation-date">${paciente.ultima_consulta ? new Date(paciente.ultima_consulta).toLocaleDateString() : 'Sin consultas'}</span>
                                        <small class="text-muted d-block">${paciente.total_consultas || 0} consultas</small>
                                    </td>
                                    <td>
                                        <span class="weight-value">${paciente.peso_actual ? paciente.peso_actual + ' kg' : 'No registrado'}</span>
                                    </td>
                                    <td>
                                        <span class="badge ${paciente.activo ? 'bg-success' : 'bg-danger'}">${paciente.activo ? 'Activo' : 'Inactivo'}</span>
                                    </td>
                                    <td>
                                        <div class="btn-group" role="group">
                                            <button class="btn btn-sm btn-outline-primary" data-patient-id="${paciente.id}" data-action="view-history" title="Ver Historia Clínica">
                                                <i class="fas fa-file-medical"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-secondary" data-patient-id="${paciente.id}" data-action="edit" title="Editar Paciente">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-success" data-patient-id="${paciente.id}" data-action="new-consultation" title="Nueva Consulta">
                                                <i class="fas fa-plus"></i>
                                            </button>
                                        </div>
                            </td>
                        </tr>
                            `).join('') : `
                                <tr>
                                    <td colspan="6" class="text-center text-muted py-4">
                                        <i class="fas fa-search fa-2x mb-3"></i>
                                        <p>${searchTerm ? `No se encontraron pacientes para "${searchTerm}"` : 'No hay pacientes registrados'}</p>
                                        ${!searchTerm ? `
                                            <button class="btn btn-primary" id="addFirstPatientBtn">
                                                <i class="fas fa-plus me-2"></i>Agregar Primer Paciente
                                            </button>
                                        ` : `
                                            <button class="btn btn-outline-primary" id="viewAllPatientsBtn">
                                                <i class="fas fa-list me-2"></i>Ver Todos los Pacientes
                                            </button>
                                        `}
                                    </td>
                                </tr>
                            `}
                    </tbody>
                </table>
                </div>
                
                <!-- Paginación -->
                ${paginationData.totalItems > 0 ? `
                    <div class="card-footer">
                        <div class="row align-items-center">
                            <div class="col-md-6">
                                <div class="d-flex align-items-center">
                                    <span class="text-muted me-3">
                                        Mostrando ${((paginationData.currentPage - 1) * paginationData.itemsPerPage) + 1} a ${Math.min(paginationData.currentPage * paginationData.itemsPerPage, paginationData.totalItems)} de ${paginationData.totalItems} pacientes
                                    </span>
                                </div>
                            </div>
                            <div class="col-md-6">
                                <nav aria-label="Paginación de pacientes">
                                    <ul class="pagination pagination-sm justify-content-end mb-0">
                                        <!-- Botón Anterior -->
                                        <li class="page-item ${paginationData.currentPage === 1 ? 'disabled' : ''}">
                                            <button class="page-link" onclick="changePage(${paginationData.currentPage - 1})" ${paginationData.currentPage === 1 ? 'disabled' : ''}>
                                                <i class="fas fa-chevron-left"></i>
                                            </button>
                                        </li>
                                        
                                        <!-- Páginas -->
                                        ${generatePaginationButtons(paginationData)}
                                        
                                        <!-- Botón Siguiente -->
                                        <li class="page-item ${paginationData.currentPage === paginationData.totalPages ? 'disabled' : ''}">
                                            <button class="page-link" onclick="changePage(${paginationData.currentPage + 1})" ${paginationData.currentPage === paginationData.totalPages ? 'disabled' : ''}>
                                                <i class="fas fa-chevron-right"></i>
                                            </button>
                                        </li>
                                    </ul>
                                </nav>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
    
    // Agregar event listeners después de renderizar el HTML
    setupSearchEventListeners();
}

function setupSearchEventListeners() {
    // Event listener para el campo de búsqueda (Enter)
    const searchInput = document.getElementById('patientSearch');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                searchPatients();
            }
        });
    }
    
    // Event listener para el botón de búsqueda
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', searchPatientsOptimized);
    }
    
    // Event listener para el filtro de estado
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', filterPatients);
    }
    
    // Event listener para el ordenamiento
    const sortBy = document.getElementById('sortBy');
    if (sortBy) {
        sortBy.addEventListener('change', filterPatients);
    }
    
    // Event listener para restablecer filtros
    const resetFiltersBtn = document.getElementById('resetFiltersBtn');
    if (resetFiltersBtn) {
        resetFiltersBtn.addEventListener('click', resetFilters);
    }
    
    // Event listener para nuevo paciente
    const newPatientBtn = document.getElementById('newPatientBtn');
    if (newPatientBtn) {
        newPatientBtn.addEventListener('click', goToNewPatient);
    }
    
    // Event listener para agregar primer paciente
    const addFirstPatientBtn = document.getElementById('addFirstPatientBtn');
    if (addFirstPatientBtn) {
        addFirstPatientBtn.addEventListener('click', goToNewPatient);
    }
    
    // Event listener para ver todos los pacientes
    const viewAllPatientsBtn = document.getElementById('viewAllPatientsBtn');
    if (viewAllPatientsBtn) {
        viewAllPatientsBtn.addEventListener('click', loadPacientesContent);
    }
    
    // Event listener para reintentar
    const retryBtn = document.getElementById('retryBtn');
    if (retryBtn) {
        retryBtn.addEventListener('click', loadPacientesContent);
    }
    
    // Event listeners para botones de acción de pacientes
    setupPatientActionButtons();
}

// Setup event listeners for patient action buttons
function setupPatientActionButtons() {
    // Use event delegation to handle dynamically created buttons
    document.addEventListener('click', function(event) {
        const button = event.target.closest('[data-action]');
        if (!button) return;
        
        const patientId = button.getAttribute('data-patient-id');
        const action = button.getAttribute('data-action');
        
        if (!patientId) return;
        
        switch (action) {
            case 'view-history':
                console.log('🔍 Action: view-history for patient:', patientId);
                viewPatientHistory(patientId);
                break;
            case 'edit':
                console.log('🔍 Action: edit for patient:', patientId);
                editPatient(patientId);
                break;
            case 'new-consultation':
                console.log('🔍 Action: new-consultation for patient:', patientId);
                newConsultation(patientId);
                break;
            default:
                console.log('🔍 Unknown action:', action);
        }
    });
}

async function filterPatients() {
    const searchTerm = document.getElementById('patientSearch')?.value.trim() || '';
    const statusFilter = document.getElementById('statusFilter')?.value || '';
    const sortBy = document.getElementById('sortBy')?.value || 'name';
    
    console.log('🔍 Filtering patients with:', { searchTerm, statusFilter, sortBy });
    
    // Mostrar loading
    const section = document.getElementById('pacientes-section');
    section.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Aplicando filtros...</span>
            </div>
            <p class="mt-3">Aplicando filtros...</p>
        </div>
    `;
    
    try {
        // Obtener datos del usuario logueado
        const userData = localStorage.getItem('user');
        if (!userData) {
            throw new Error('Usuario no autenticado');
        }
        
        const user = JSON.parse(userData);
        const token = localStorage.getItem('token');
        
        // Construir URL con todos los parámetros
        let url = `/api/usuarios/profesional/${user.id}/pacientes?`;
        const params = [];
        
        if (searchTerm) {
            params.push(`search=${encodeURIComponent(searchTerm)}`);
        }
        if (statusFilter) {
            params.push(`status=${encodeURIComponent(statusFilter)}`);
        }
        if (sortBy) {
            params.push(`sortBy=${encodeURIComponent(sortBy)}`);
        }
        
        url += params.join('&');
        
        console.log('🔍 Making filter request to:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('🔍 Filter Response status:', response.status);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('🔍 Filter API Error:', errorText);
            throw new Error(`Error al aplicar filtros: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('🔍 Filter Result:', result);
        const pacientes = result.data;
        
        // Actualizar variable global
        pacientesData = pacientes;
        
        // Usar las estadísticas de la API si están disponibles, sino calcularlas
        const stats = result.stats ? {
            total_pacientes: result.stats.total_pacientes,
            pacientes_activos: result.stats.pacientes_activos,
            pacientes_inactivos: result.stats.pacientes_inactivos,
            consultas_pendientes: result.stats.consultas_pendientes,
            con_consultas: result.stats.con_consultas
        } : {
            total_pacientes: pacientes.length,
            pacientes_activos: pacientes.filter(p => p.activo).length,
            pacientes_inactivos: pacientes.filter(p => !p.activo).length,
            consultas_pendientes: 0,
            con_consultas: 0
        };
        
        // Renderizar los resultados filtrados
        renderSearchResults(pacientes, stats, searchTerm);
        
    } catch (error) {
        console.error('Error aplicando filtros:', error);
        section.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Error al aplicar filtros</h4>
                <p>${error.message}</p>
                <hr>
                <button class="btn btn-outline-danger" onclick="loadPacientesContent()">
                    <i class="fas fa-redo me-2"></i>Volver a la lista completa
                </button>
            </div>
        `;
    }
}

async function sortPatients() {
    const sortBy = document.getElementById('sortBy')?.value || 'name';
    console.log('🔍 Sorting patients by:', sortBy);
    
    // Aplicar filtros con el nuevo ordenamiento
    await filterPatients();
}

async function resetFilters() {
    console.log('🔄 Resetting all filters...');
    
    // Limpiar todos los campos de filtro
    const searchInput = document.getElementById('patientSearch');
    const statusFilter = document.getElementById('statusFilter');
    const sortBy = document.getElementById('sortBy');
    
    if (searchInput) searchInput.value = '';
    if (statusFilter) statusFilter.value = '';
    if (sortBy) sortBy.value = 'name';
    
    // Mostrar loading
    const section = document.getElementById('pacientes-section');
    const originalContent = section.innerHTML;
    
    section.innerHTML = `
        <div class="text-center py-5">
            <div class="spinner-border text-primary" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="mt-3">Restableciendo filtros...</p>
        </div>
    `;
    
    try {
        // Obtener datos del usuario logueado
        const userData = localStorage.getItem('user');
        if (!userData) {
            throw new Error('Usuario no autenticado');
        }
        
        const user = JSON.parse(userData);
        const token = localStorage.getItem('token');
        
        console.log('🔄 User data:', user);
        console.log('🔄 Token exists:', !!token);
        
        // Hacer petición sin ningún filtro para obtener todos los pacientes
        const url = `/api/usuarios/profesional/${user.id}/pacientes`;
        
        console.log('🔄 Making reset request to:', url);
        
        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('🔄 Response status:', response.status);
        console.log('🔄 Response ok:', response.ok);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('🔄 Reset API Error:', errorText);
            throw new Error(`Error al restablecer filtros: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('🔄 Reset Result:', result);
        const pacientes = result.data;
        
        // Actualizar variable global
        pacientesData = pacientes;
        
        // Usar las estadísticas de la API si están disponibles, sino calcularlas
        const stats = result.stats ? {
            total_pacientes: result.stats.total_pacientes,
            pacientes_activos: result.stats.pacientes_activos,
            pacientes_inactivos: result.stats.pacientes_inactivos,
            consultas_pendientes: result.stats.consultas_pendientes,
            con_consultas: result.stats.con_consultas
        } : {
            total_pacientes: pacientes.length,
            pacientes_activos: pacientes.filter(p => p.activo).length,
            pacientes_inactivos: pacientes.filter(p => !p.activo).length,
            consultas_pendientes: 0,
            con_consultas: 0
        };
        
        // Renderizar todos los pacientes sin filtros
        renderSearchResults(pacientes, stats, '');
        
    } catch (error) {
        console.error('Error al restablecer filtros:', error);
        section.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">Error al restablecer filtros</h4>
                <p>No se pudieron restablecer los filtros. Por favor, intenta nuevamente.</p>
                <hr>
                <p class="mb-0">Error: ${error.message}</p>
                <button class="btn btn-primary mt-3" id="retryBtn">Reintentar</button>
            </div>
        `;
        
        // Reconfigurar event listeners después del error
        setupSearchEventListeners();
    }
}

function viewPatientHistory(patientId) {
    console.log('Viewing patient history for ID:', patientId);
    // Redirect to clinical history page
    window.location.href = `/patient-history?patientId=${patientId}`;
}

function editPatient(patientId) {
    console.log('🔧 editPatient called with ID:', patientId);
    console.log('🔧 About to redirect to:', `/edit-patient?id=${patientId}`);
    
    // Redirigir a la página de edición
    window.location.href = `/edit-patient?id=${patientId}`;
    
    console.log('🔧 Redirect command executed');
}

function newConsultation(patientId) {
    console.log('New consultation for patient ID:', patientId);
    
    // Obtener datos del paciente
    const paciente = pacientesData.find(p => p.id == patientId);
    if (!paciente) {
        showAlert('No se encontró información del paciente', 'warning');
        return;
    }
    
    // Mostrar modal de nueva consulta
    mostrarModalNuevaConsultaParaPaciente(patientId, paciente);
}



// Load agenda content
function loadAgendaContent() {
    console.log('loadAgendaContent called');
    const section = document.getElementById('agenda-section');
    if (!section) {
        console.log('agenda-section not found');
        return;
    }

    const cardBody = section.querySelector('.card-body');
    if (!cardBody) {
        console.log('card-body not found in agenda-section');
        return;
    }
    
    console.log('Loading agenda content...');

    cardBody.innerHTML = `
        <div class="agenda-dashboard-content">
            <!-- Botón para ir a la gestión de consultas -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="d-flex justify-content-between align-items-center">
                        <h5 class="mb-0">
                            <i class="fas fa-calendar-alt me-2"></i>Vista Rápida de Agenda
                        </h5>
                        <div class="d-flex gap-2">
                            <a href="/gestion-consultas" class="btn btn-primary">
                                <i class="fas fa-cogs me-2"></i>Gestión de Consultas
                            </a>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Estadísticas rápidas -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="row" id="estadisticasContainer">
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="stats-card">
                                <div class="stats-icon text-primary">
                                    <i class="fas fa-calendar-check"></i>
                </div>
                                <div class="stats-number text-primary">-</div>
                                <div class="stats-label">Consultas Hoy</div>
                </div>
                        </div>
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="stats-card">
                                <div class="stats-icon text-warning">
                                    <i class="fas fa-clock"></i>
                                </div>
                                <div class="stats-number text-warning">-</div>
                                <div class="stats-label">Próximas</div>
                            </div>
                        </div>
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="stats-card">
                                <div class="stats-icon text-success">
                                    <i class="fas fa-check-circle"></i>
                                </div>
                                <div class="stats-number text-success">-</div>
                                <div class="stats-label">Completadas</div>
                            </div>
                        </div>
                        <div class="col-md-3 col-sm-6 mb-3">
                            <div class="stats-card">
                                <div class="stats-icon text-info">
                                    <i class="fas fa-sync"></i>
                                </div>
                                <div class="stats-number text-info">-</div>
                                <div class="stats-label">Sincronizado</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Controles del calendario -->
            <div class="row mb-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-body">
                            <div class="row align-items-center">
                                <div class="col-md-3">
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-outline-primary" id="vistaMesBtn">
                                            <i class="fas fa-calendar-alt me-2"></i>Mes
                                        </button>
                                        <button class="btn btn-outline-primary" id="vistaSemanaBtn">
                                            <i class="fas fa-calendar-week me-2"></i>Semana
                                        </button>
                                        <button class="btn btn-outline-primary" id="vistaDiaBtn">
                                            <i class="fas fa-calendar-day me-2"></i>Día
                    </button>
                </div>
            </div>
                                <div class="col-md-3">
                                    <div class="d-flex align-items-center gap-2">
                                        <button class="btn btn-outline-secondary" id="anteriorBtn">
                                            <i class="fas fa-chevron-left"></i>
                                        </button>
                                        <h5 class="mb-0" id="fechaActual">${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}</h5>
                                        <button class="btn btn-outline-secondary" id="siguienteBtn">
                                            <i class="fas fa-chevron-right"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="col-md-3">
                                    <div class="d-flex gap-2">
                                        <button class="btn btn-primary" id="nuevaConsultaBtn">
                                            <i class="fas fa-plus me-2"></i>Nueva Consulta
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Calendario -->
            <div class="row">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header d-flex justify-content-between align-items-center">
                            <h6 class="mb-0">
                                <i class="fas fa-calendar-alt me-2"></i>Calendario de Consultas
                            </h6>
                            <div class="d-flex gap-2">
                                <span class="badge bg-primary" id="totalConsultasBadge">0</span>
                            </div>
                        </div>
                        <div class="card-body">
                            <div id="calendarioContainer">
                                <div class="text-center py-4">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Cargando...</span>
                                    </div>
                                    <p class="text-muted mt-2">Cargando calendario...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;

       // Configurar event listeners para la agenda
       setupAgendaEventListeners();
       
       // Agregar modal para nueva consulta
       agregarModalNuevaConsulta();
    
    // Inicializar calendario
    actualizarFechaActual();
    renderizarCalendario();
    
    // Cargar datos de agenda
    loadAgendaData();
}

// Setup agenda event listeners
function setupAgendaEventListeners() {
    // Controles de vista del calendario
    const vistaMesBtn = document.getElementById('vistaMesBtn');
    const vistaSemanaBtn = document.getElementById('vistaSemanaBtn');
    const vistaDiaBtn = document.getElementById('vistaDiaBtn');
    
    if (vistaMesBtn) {
        vistaMesBtn.addEventListener('click', () => cambiarVistaCalendario('mes'));
    }
    if (vistaSemanaBtn) {
        vistaSemanaBtn.addEventListener('click', () => cambiarVistaCalendario('semana'));
    }
    if (vistaDiaBtn) {
        vistaDiaBtn.addEventListener('click', () => cambiarVistaCalendario('dia'));
    }

    // Navegación del calendario
    const anteriorBtn = document.getElementById('anteriorBtn');
    const siguienteBtn = document.getElementById('siguienteBtn');
    
    if (anteriorBtn) {
        anteriorBtn.addEventListener('click', () => navegarCalendario('anterior'));
    }
    if (siguienteBtn) {
        siguienteBtn.addEventListener('click', () => navegarCalendario('siguiente'));
    }

    // Botones de acción
    const nuevaConsultaBtn = document.getElementById('nuevaConsultaBtn');
    
    if (nuevaConsultaBtn) {
        nuevaConsultaBtn.addEventListener('click', (e) => {
            e.preventDefault();
            mostrarModalNuevaConsulta();
        });
    }
}

// Variables globales del calendario
let vistaActual = 'mes';
let fechaActual = new Date();

// Cambiar vista del calendario
function cambiarVistaCalendario(vista) {
    vistaActual = vista;
    
    // Actualizar botones activos
    document.querySelectorAll('[id$="Btn"]').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const btnActivo = document.getElementById(`${vista}Btn`);
    if (btnActivo) {
        btnActivo.classList.add('active');
    }
    
    // Renderizar calendario
    renderizarCalendario();
}

// Navegar en el calendario
function navegarCalendario(direccion) {
    if (vistaActual === 'mes') {
        if (direccion === 'anterior') {
            fechaActual.setMonth(fechaActual.getMonth() - 1);
        } else {
            fechaActual.setMonth(fechaActual.getMonth() + 1);
        }
    } else if (vistaActual === 'semana') {
        if (direccion === 'anterior') {
            fechaActual.setDate(fechaActual.getDate() - 7);
        } else {
            fechaActual.setDate(fechaActual.getDate() + 7);
        }
    } else if (vistaActual === 'dia') {
        if (direccion === 'anterior') {
            fechaActual.setDate(fechaActual.getDate() - 1);
        } else {
            fechaActual.setDate(fechaActual.getDate() + 1);
        }
    }
    
    actualizarFechaActual();
    renderizarCalendario();
}

// Actualizar fecha actual en la interfaz
function actualizarFechaActual() {
    const fechaActualElement = document.getElementById('fechaActual');
    if (fechaActualElement) {
        if (vistaActual === 'mes') {
            fechaActualElement.textContent = fechaActual.toLocaleDateString('es-ES', { 
                month: 'long', 
                year: 'numeric' 
            });
        } else if (vistaActual === 'semana') {
            const inicioSemana = new Date(fechaActual);
            inicioSemana.setDate(fechaActual.getDate() - fechaActual.getDay());
            const finSemana = new Date(inicioSemana);
            finSemana.setDate(inicioSemana.getDate() + 6);
            
            fechaActualElement.textContent = `${inicioSemana.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })} - ${finSemana.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}`;
        } else if (vistaActual === 'dia') {
            fechaActualElement.textContent = fechaActual.toLocaleDateString('es-ES', { 
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        }
    }
}

// Renderizar calendario
function renderizarCalendario() {
    const container = document.getElementById('calendarioContainer');
    if (!container) return;

    if (vistaActual === 'mes') {
        renderizarVistaMes();
    } else if (vistaActual === 'semana') {
        renderizarVistaSemana();
    } else if (vistaActual === 'dia') {
        renderizarVistaDia();
    }
}

// Renderizar vista de mes
function renderizarVistaMes() {
    const container = document.getElementById('calendarioContainer');
    const año = fechaActual.getFullYear();
    const mes = fechaActual.getMonth();
    
    const primerDia = new Date(año, mes, 1);
    const ultimoDia = new Date(año, mes + 1, 0);
    const diasEnMes = ultimoDia.getDate();
    const diaInicio = primerDia.getDay();
    
    const diasSemana = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    
    let html = `
        <div class="calendario-mes">
            <div class="calendario-header">
                ${diasSemana.map(dia => `<div class="calendario-dia-header">${dia}</div>`).join('')}
            </div>
            <div class="calendario-grid">
    `;
    
    // Días del mes anterior
    for (let i = 0; i < diaInicio; i++) {
        html += `<div class="calendario-dia calendario-dia-otro-mes"></div>`;
    }
    
    // Días del mes actual
    for (let dia = 1; dia <= diasEnMes; dia++) {
        const fechaDia = new Date(año, mes, dia);
        const esHoy = fechaDia.toDateString() === new Date().toDateString();
        const claseHoy = esHoy ? 'calendario-dia-hoy' : '';
        
        html += `
            <div class="calendario-dia ${claseHoy}" data-fecha="${fechaDia.toISOString().split('T')[0]}">
                <div class="calendario-dia-numero">${dia}</div>
                <div class="calendario-eventos" id="eventos-${fechaDia.toISOString().split('T')[0]}"></div>
            </div>
        `;
    }
    
    html += `
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    cargarEventosCalendario();
}

// Renderizar vista de semana
function renderizarVistaSemana() {
    const container = document.getElementById('calendarioContainer');
    const inicioSemana = new Date(fechaActual);
    inicioSemana.setDate(fechaActual.getDate() - fechaActual.getDay());
    
    const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    
    let html = `
        <div class="calendario-semana">
            <div class="calendario-semana-header">
                ${diasSemana.map((dia, index) => {
                    const fechaDia = new Date(inicioSemana);
                    fechaDia.setDate(inicioSemana.getDate() + index);
                    const esHoy = fechaDia.toDateString() === new Date().toDateString();
                    const claseHoy = esHoy ? 'calendario-dia-hoy' : '';
                    
                    return `
                        <div class="calendario-dia-semana ${claseHoy}">
                            <div class="calendario-dia-nombre">${dia}</div>
                            <div class="calendario-dia-numero">${fechaDia.getDate()}</div>
                        </div>
                    `;
                }).join('')}
            </div>
            <div class="calendario-semana-content">
                ${diasSemana.map((dia, index) => {
                    const fechaDia = new Date(inicioSemana);
                    fechaDia.setDate(inicioSemana.getDate() + index);
                    
                    return `
                        <div class="calendario-dia-contenido" data-fecha="${fechaDia.toISOString().split('T')[0]}">
                            <div class="calendario-eventos" id="eventos-${fechaDia.toISOString().split('T')[0]}"></div>
                        </div>
                    `;
                }).join('')}
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    cargarEventosCalendario();
}

// Renderizar vista de día
function renderizarVistaDia() {
    const container = document.getElementById('calendarioContainer');
    const esHoy = fechaActual.toDateString() === new Date().toDateString();
    const claseHoy = esHoy ? 'calendario-dia-hoy' : '';
    
    let html = `
        <div class="calendario-dia-vista ${claseHoy}">
            <div class="calendario-dia-info">
                <h4>${fechaActual.toLocaleDateString('es-ES', { 
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })}</h4>
            </div>
            <div class="calendario-dia-eventos" data-fecha="${fechaActual.toISOString().split('T')[0]}">
                <div class="calendario-eventos" id="eventos-${fechaActual.toISOString().split('T')[0]}"></div>
            </div>
        </div>
    `;
    
    container.innerHTML = html;
    cargarEventosCalendario();
}

// Cargar eventos del calendario
async function cargarEventosCalendario() {
    try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const payload = JSON.parse(atob(token.split('.')[1]));
        const profesionalId = payload.profesional_id || payload.id;

        // Obtener rango de fechas según la vista
        let fechaInicio, fechaFin;
        
        if (vistaActual === 'mes') {
            fechaInicio = new Date(fechaActual.getFullYear(), fechaActual.getMonth(), 1);
            fechaFin = new Date(fechaActual.getFullYear(), fechaActual.getMonth() + 1, 0);
        } else if (vistaActual === 'semana') {
            const inicioSemana = new Date(fechaActual);
            inicioSemana.setDate(fechaActual.getDate() - fechaActual.getDay());
            fechaInicio = inicioSemana;
            fechaFin = new Date(inicioSemana);
            fechaFin.setDate(inicioSemana.getDate() + 6);
        } else if (vistaActual === 'dia') {
            fechaInicio = new Date(fechaActual);
            fechaFin = new Date(fechaActual);
        }

        const response = await fetch(`/api/agenda/profesional/${profesionalId}/consultas/rango?fechaInicio=${fechaInicio.toISOString().split('T')[0]}&fechaFin=${fechaFin.toISOString().split('T')[0]}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.ok) {
            const data = await response.json();
            mostrarEventosCalendario(data.data || []);
        }
    } catch (error) {
        console.error('Error cargando eventos del calendario:', error);
    }
}

// Mostrar eventos en el calendario
function mostrarEventosCalendario(eventos) {
    eventos.forEach(evento => {
        // Usar fecha y hora por separado
        const fechaEvento = new Date(evento.fecha).toISOString().split('T')[0];
        const contenedorEventos = document.getElementById(`eventos-${fechaEvento}`);
        
        if (contenedorEventos) {
            // Formatear hora desde el campo TIME
            const hora = evento.hora.substring(0, 5); // "08:00:00" -> "08:00"
            
            const claseEstado = getEstadoBadgeClass(evento.estado);
            const textoEstado = getEstadoText(evento.estado);
            
            // Determinar tipo de paciente
            const tipoPaciente = evento.tipo_paciente || (evento.usuario_id ? 'registrado' : 'externo');
            const iconoTipo = tipoPaciente === 'externo' ? 'fas fa-user-plus' : 'fas fa-user';
            
            const eventoHtml = `
                <div class="calendario-evento" data-evento-id="${evento.id}" data-tipo="${tipoPaciente}">
                    <div class="calendario-evento-hora">
                        <i class="${iconoTipo} me-1"></i>${hora}
                    </div>
                    <div class="calendario-evento-titulo">${evento.paciente_nombre}</div>
                    <div class="calendario-evento-estado badge ${claseEstado}">${textoEstado}</div>
                </div>
            `;
            
            contenedorEventos.innerHTML += eventoHtml;
        }
    });
}

// Load agenda data from API
async function loadAgendaData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('No se encontró token de autenticación');
            return;
        }

        const payload = JSON.parse(atob(token.split('.')[1]));
        const profesionalId = payload.profesional_id || payload.id;

        if (!profesionalId) {
            console.error('No se encontró ID del profesional');
            return;
        }

        // Obtener filtros
        const fechaSelector = document.getElementById('fechaSelector');
        const pacienteSelector = document.getElementById('pacienteSelector');
        const estadoSelector = document.getElementById('estadoSelector');
        
        const fecha = fechaSelector ? fechaSelector.value : new Date().toISOString().split('T')[0];
        const pacienteId = pacienteSelector ? pacienteSelector.value : '';
        const estado = estadoSelector ? estadoSelector.value : '';
        
        // Cargar estadísticas y consultas en paralelo
        const [statsResponse, consultasResponse, pacientesResponse] = await Promise.all([
            fetch(`/api/agenda/profesional/${profesionalId}/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }),
            fetch(`/api/agenda/profesional/${profesionalId}/consultas/fecha/${fecha}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }),
            fetch(`/api/agenda/profesional/${profesionalId}/pacientes`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
        ]);

        if (!statsResponse.ok || !consultasResponse.ok || !pacientesResponse.ok) {
            throw new Error('Error al cargar datos de agenda');
        }

        const stats = await statsResponse.json();
        const consultas = await consultasResponse.json();
        const pacientes = await pacientesResponse.json();

        // Calcular estadísticas específicas para el calendario (en zona horaria del profesional)
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;
        const timezone = user?.timezone || 'UTC';
        
        // Obtener fecha actual en la zona horaria del profesional
        const hoy = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
        console.log('Debug - Timezone:', timezone);
        console.log('Debug - Fecha actual en timezone:', hoy);
        
        const consultasHoy = (consultas.data || []).filter(c => {
            // Las fechas en BD están en UTC, pero representan la fecha local del profesional
            // No necesitamos convertir, solo comparar directamente
            const fechaConsulta = c.fecha.split('T')[0]; // Obtener solo la fecha YYYY-MM-DD
            console.log('Debug - Consulta BD:', c.fecha, '-> Fecha:', fechaConsulta, 'Hoy:', hoy, 'Coincide:', fechaConsulta === hoy);
            return fechaConsulta === hoy;
        }).length;
        
        console.log('Debug - Total consultas hoy:', consultasHoy);
        
        const statsCalendario = {
            consultas_hoy: consultasHoy,
            proximas: stats.data?.activas || 0,
            completadas: stats.data?.completadas || 0,
            sincronizado: false
        };
        
        // Actualizar estadísticas
        displayAgendaStats(statsCalendario);
        
        // Actualizar badge de total de consultas
        const totalBadge = document.getElementById('totalConsultasBadge');
        if (totalBadge) {
            totalBadge.textContent = (consultas.data || []).length;
        }
        
        // Actualizar selector de pacientes
        updatePacienteSelector(pacientes.data || []);

    } catch (error) {
        console.error('Error loading agenda data:', error);
        displayAgendaError('Error al cargar los datos de agenda: ' + error.message);
    }
}

// Display agenda statistics
function displayAgendaStats(stats) {
    // Estadísticas para el calendario
    const consultasHoy = document.querySelector('#estadisticasContainer .col-md-3:nth-child(1) .stats-number');
    const proximas = document.querySelector('#estadisticasContainer .col-md-3:nth-child(2) .stats-number');
    const completadas = document.querySelector('#estadisticasContainer .col-md-3:nth-child(3) .stats-number');
    const sincronizado = document.querySelector('#estadisticasContainer .col-md-3:nth-child(4) .stats-number');

    if (consultasHoy) {
        consultasHoy.textContent = stats.consultas_hoy || 0;
    }
    if (proximas) {
        proximas.textContent = stats.programadas || 0;
    }
    if (completadas) {
        completadas.textContent = stats.realizadas || 0;
    }
    if (sincronizado) {
        // Por ahora mostrar estado de sincronización (0 = no sincronizado, 1 = sincronizado)
        sincronizado.textContent = stats.sincronizado ? 'Sí' : 'No';
    }
}

// Display consultations
function displayConsultas(consultas) {
    const container = document.getElementById('consultasContainer');
    const totalBadge = document.getElementById('totalConsultasBadge');
    
    if (!container) return;

    if (totalBadge) {
        totalBadge.textContent = consultas.length;
    }

    if (consultas.length === 0) {
        container.innerHTML = `
            <div class="text-center py-4">
                <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No hay consultas</h5>
                <p class="text-muted mb-0">No se encontraron consultas para los filtros seleccionados</p>
            </div>
        `;
        return;
    }

    container.innerHTML = consultas.map(consulta => `
        <div class="consulta-card mb-3">
            <div class="row align-items-center">
                <div class="col-md-3">
                    <div class="d-flex align-items-center">
                        <div class="me-3">
                            <i class="fas fa-user-circle fa-2x text-primary"></i>
                        </div>
                        <div>
                            <h6 class="mb-1">${consulta.paciente_nombre || 'Paciente no encontrado'}</h6>
                            <small class="text-muted">${consulta.numero_documento || ''}</small>
                        </div>
                    </div>
                </div>
                <div class="col-md-2">
                    <div class="text-center">
                        <div class="fw-bold text-primary">
                            ${formatDateWithTimezone(consulta.fecha_hora)}
                        </div>
                        <small class="text-muted">
                            ${formatTimeWithTimezone(consulta.fecha_hora)}
                        </small>
                    </div>
                </div>
                <div class="col-md-2">
                    <span class="badge bg-info">${getTipoConsultaText(consulta.tipo_consulta)}</span>
                </div>
                <div class="col-md-2">
                    <span class="badge ${getEstadoBadgeClass(consulta.estado)}">
                        ${getEstadoText(consulta.estado)}
                    </span>
                </div>
                <div class="col-md-3">
                    <div class="text-end">
                        <button class="btn btn-sm btn-outline-primary me-2" onclick="editarConsulta(${consulta.id})">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="eliminarConsulta(${consulta.id})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
            ${consulta.motivo_consulta ? `
                <div class="row mt-2">
                    <div class="col-12">
                        <small class="text-muted">
                            <strong>Motivo:</strong> ${consulta.motivo_consulta}
                        </small>
                    </div>
                </div>
            ` : ''}
        </div>
    `).join('');
}

// Update paciente selector
function updatePacienteSelector(pacientes) {
    const selector = document.getElementById('pacienteSelector');
    if (!selector) return;

    // Guardar valor actual
    const valorActual = selector.value;
    
    // Limpiar opciones existentes (excepto la primera)
    selector.innerHTML = '<option value="">Todos los pacientes</option>';
    
    // Agregar pacientes
    pacientes.forEach(paciente => {
        const option = document.createElement('option');
        option.value = paciente.id;
        option.textContent = paciente.apellido_nombre;
        selector.appendChild(option);
    });
    
    // Restaurar valor si existe
    if (valorActual) {
        selector.value = valorActual;
    }
}

// Display agenda error
function displayAgendaError(message) {
    const consultasHoy = document.querySelector('#estadisticasContainer .col-md-3:nth-child(1) .stats-number');
    const proximas = document.querySelector('#estadisticasContainer .col-md-3:nth-child(2) .stats-number');
    const completadas = document.querySelector('#estadisticasContainer .col-md-3:nth-child(3) .stats-number');
    const sincronizado = document.querySelector('#estadisticasContainer .col-md-3:nth-child(4) .stats-number');
    const calendarioContainer = document.getElementById('calendarioContainer');

    if (consultasHoy) consultasHoy.textContent = 'Error';
    if (proximas) proximas.textContent = 'Error';
    if (completadas) completadas.textContent = 'Error';
    if (sincronizado) sincronizado.textContent = 'Error';
    
    if (calendarioContainer) {
        calendarioContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <i class="fas fa-exclamation-triangle me-2"></i>
                ${message}
            </div>
        `;
    }
}

// Utility functions
function getEstadoBadgeClass(estado) {
    const clases = {
        'activo': 'bg-primary',
        'completado': 'bg-success',
        'cancelado': 'bg-danger',
        'ausente': 'bg-secondary'
    };
    return clases[estado] || 'bg-secondary';
}

function getEstadoText(estado) {
    const estados = {
        'activo': 'Activo',
        'completado': 'Completado',
        'cancelado': 'Cancelado',
        'ausente': 'Ausente'
    };
    return estados[estado] || estado;
}

function getTipoConsultaText(tipo) {
    const tipos = {
        'primera_consulta': 'Primera Consulta',
        'control': 'Control',
        'emergencia': 'Emergencia'
    };
    return tipos[tipo] || tipo;
}

// Initialize schedule handlers
function initializeScheduleHandlers() {
    // Add event listeners for schedule management
    const addScheduleButtons = document.querySelectorAll('.btn-outline-primary');
    const deleteButtons = document.querySelectorAll('.btn-outline-danger');
    
    // Handle add schedule buttons
    addScheduleButtons.forEach(button => {
        if (button.textContent.includes('Agregar')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                addNewScheduleSlot(this);
            });
        }
    });
    
    // Handle delete buttons
    deleteButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            deleteScheduleSlot(this);
        });
    });
    
    // Handle save buttons
    const saveButtons = document.querySelectorAll('.btn-primary, .btn-danger');
    saveButtons.forEach(button => {
        if (button.textContent.includes('Guardar')) {
            button.addEventListener('click', function(e) {
                e.preventDefault();
                saveScheduleData(this);
            });
        }
    });
}

// Add new schedule slot
function addNewScheduleSlot(button) {
    const dayContainer = button.closest('.schedule-day');
    const timeSlots = dayContainer.querySelector('.time-slots');
    
    // Create new time slot
    const newSlot = document.createElement('div');
    newSlot.className = 'time-slot';
    newSlot.innerHTML = `
        <div class="form-group">
            <label class="form-label">Desde:</label>
            <input type="time" class="form-control" value="09:00">
        </div>
        <div class="form-group">
            <label class="form-label">Hasta:</label>
            <input type="time" class="form-control" value="18:00">
        </div>
        <button class="btn btn-sm btn-outline-danger" title="Eliminar horario">
            <i class="fas fa-trash"></i>
        </button>
    `;
    
    // Add delete handler to new button
    const deleteBtn = newSlot.querySelector('.btn-outline-danger');
    deleteBtn.addEventListener('click', function(e) {
        e.preventDefault();
        deleteScheduleSlot(this);
    });
    
    // Insert before the add button
    timeSlots.appendChild(newSlot);
    
    showAlert('Nuevo horario agregado', 'success');
}

// Delete schedule slot
function deleteScheduleSlot(button) {
    const timeSlot = button.closest('.time-slot');
    const dayContainer = timeSlot.closest('.schedule-day');
    const timeSlots = dayContainer.querySelector('.time-slots');
    
    // Check if it's the last slot
    if (timeSlots.children.length === 1) {
        showAlert('No se puede eliminar el último horario del día', 'warning');
        return;
    }
    
    if (confirm('¿Estás seguro de que quieres eliminar este horario?')) {
        timeSlot.remove();
        showAlert('Horario eliminado', 'success');
    }
}

// Save schedule data
function saveScheduleData(button) {
    const card = button.closest('.card');
    const cardTitle = card.querySelector('.card-title').textContent;
    
    // Show loading state
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
    
    // Simulate API call
    setTimeout(() => {
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Horarios Laborales';
        showAlert(`${cardTitle} guardados exitosamente`, 'success');
    }, 2000);
}


// Load planes content
async function loadPlanesContent() {
    
    try {
        await loadPlanesStatistics();
    } catch (error) {
        console.error('❌ Error loading planes content:', error);
        
        const resumenContainer = document.getElementById('planesResumenDash');
        if (resumenContainer) {
            resumenContainer.innerHTML = `
                <div class="col-12 text-center py-3">
                    <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
                    <h5 class="text-warning">Error al cargar planes</h5>
                    <p class="text-muted">Por favor, intente recargar o vaya directamente a la sección de planes.</p>
                    <button class="btn btn-primary" onclick="window.location.href='/plan-alimentario'">
                        <i class="fas fa-utensils me-2"></i>Ir a Planes Alimentarios
                    </button>
        </div>
    `;
        }
    }
}

async function loadPlanesStatistics() {
    const token = localStorage.getItem('token');
    if (!token) {
        console.error('No authentication token found');
        return;
    }

    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const profesionalId = payload.profesional_id || payload.id;

        if (!profesionalId) {
            throw new Error('Professional ID not found');
        }

        const response = await fetch(`/api/plan-alimentacion/profesional/${profesionalId}/stats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            await displayPlanesStats(result.data);
            await loadPlanesSummary(profesionalId, token);
        } else {
            throw new Error(result.message || 'Error fetching plans statistics');
        }

    } catch (error) {
        console.error('Error loading plans statistics:', error);
        throw error;
    }
}

async function displayPlanesStats(stats) {
    document.getElementById('planesActivosDash').textContent = stats.planes_activos || 0;
    document.getElementById('objPerdidaPesoDash').textContent = stats.obj_perdida_peso || 0;
    document.getElementById('objGananciaMasaDash').textContent = stats.obj_ganancia_masa || 0;
}

async function loadPlanesSummary(profesionalId, token) {
    try {
        const response = await fetch(`/api/plan-alimentacion/profesional/${profesionalId}/planes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();
        
        if (result.success) {
            const planes = result.data || [];
            displayPlansSummary(planes);
        } else {
            throw new Error(result.message || 'Error fetching plans list');
        }

    } catch (error) {
        console.error('Error loading plans summary:', error);
        
        // Mostrar mensaje de error en el dashboard
        const container = document.getElementById('planesResumenDash');
        if (container) {
            container.innerHTML = `
                <div class="col-12 text-center py-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h5 class="text-warning">Error al cargar planes</h5>
                    <p class="text-muted mb-3">No se pudieron cargar los planes alimentarios. Intenta nuevamente.</p>
                    <button class="btn btn-primary" id="reloadPlanesBtn">
                        <i class="fas fa-refresh me-2"></i>Reintentar
                    </button>
        </div>
    `;
            
            // Event listener para botón reintentar
            const reloadBtn = document.getElementById('reloadPlanesBtn');
            if (reloadBtn) {
                reloadBtn.addEventListener('click', function() {
                    loadPlanesContent();
                });
            }
        }
    }
}

function displayPlansSummary(planes) {
    const container = document.getElementById('planesResumenDash');
    if (!container) return;

    if (!planes || planes.length === 0) {
        container.innerHTML = `
            <div class="col-12 text-center py-4">
                <i class="fas fa-utensils fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No hay planes alimentarios</h5>
                <p class="text-muted mb-3">Comienza creando tu primer plan para tus pacientes.</p>
                <button class="btn btn-success" id="crearPrimerPlanBtn">
                    <i class="fas fa-plus me-2"></i>Crear Primer Plan
                </button>
        </div>
    `;
        
        // Agregar event listener inmediatamente para el botón "Crear Primer Plan"
        setTimeout(() => {
            const crearPrimerPlanBtn = document.getElementById('crearPrimerPlanBtn');
            if (crearPrimerPlanBtn) {
                crearPrimerPlanBtn.addEventListener('click', function() {
                    window.location.href = '/plan-alimentario';
                });
            }
        }, 100);
        
        return;
    }

    const recentPlans = planes.slice(0, 3);
    container.innerHTML = recentPlans.map(plan => `
        <div class="col-md-4 mb-3">
            <div class="card">
                <div class="card-body">
                    <div class="d-flex align-items-center mb-3">
                        <i class="fas fa-utensils fa-2x text-primary me-3"></i>
                        <div>
                            <h6 class="card-title mb-1">${plan.paciente_nombre || 'Paciente'}</h6>
                            <small class="text-muted">${plan.objetivo || 'Sin objetivo'}</small>
                        </div>
                                </div>
                    <div class="row text-center mb-3">
                        <div class="col-4">
                            <small class="text-muted">Calorías</small>
                            <div class="fw-bold">${plan.calorias_diarias || 'N/A'}</div>
                                </div>
                        <div class="col-4">
                            <small class="text-muted">Estado</small>
                            <div>
                                <span class="badge ${plan.activo ? 'bg-success' : 'bg-secondary'}">
                                    ${plan.activo ? 'Activo' : 'Inactivo'}
                                </span>
                            </div>
                        </div>
                        <div class="col-4">
                            <small class="text-muted">Inicio</small>
                            <div class="small">${new Date(plan.fecha_inicio).toLocaleDateString('es-ES')}</div>
                </div>
                            </div>
                    </div>
                </div>
            </div>
    `).join('');
    
    // Agregar event listeners a los botones dinámicos
    setTimeout(() => {
        // Los botones de acción han sido eliminados de la vista resumen
        // Solo se mantiene la funcionalidad de vista tabla completa
        
        // Event listener para botón Crear Primer Plan
        const crearPrimerPlanBtn = document.getElementById('crearPrimerPlanBtn');
        if (crearPrimerPlanBtn) {
            crearPrimerPlanBtn.addEventListener('click', function() {
                window.location.href = '/plan-alimentario';
            });
        }
    }, 100);
}

function openPlanEditor(planId) {
    window.location.href = `/plan-editor?planId=${planId}`;
}

// Load mensajes content

// Setup event listeners
function setupEventListeners() {
    // Inicio button
    const inicioLink = document.getElementById('inicioLink');
    if (inicioLink) {
        inicioLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSection('dashboard');
        });
    }
    
    // Mis Pacientes button
    const pacientesLink = document.getElementById('pacientesLink');
    if (pacientesLink) {
        pacientesLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSection('pacientes');
        });
    }
    
    // Horarios button
    const horariosLink = document.getElementById('horariosLink');
    if (horariosLink) {
        horariosLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSection('horarios');
        });
    }
    
    // Agenda button
    const agendaLink = document.getElementById('agendaLink');
    if (agendaLink) {
        console.log('Agenda link found, adding click listener');
        agendaLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSection('agenda');
        });
    }
    
    
    // Planes button
    const planesLink = document.getElementById('planesLink');
    if (planesLink) {
        planesLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSection('planes');
        });
    }
    
    // Gestión de Asistencia button
    const asistenciaLink = document.getElementById('asistenciaLink');
    if (asistenciaLink) {
        asistenciaLink.addEventListener('click', function(e) {
            e.preventDefault();
            showSection('asistencia');
        });
    }
    
    // Nuevo Paciente button
    const nuevoPacienteBtn = document.getElementById('nuevoPacienteBtn');
    if (nuevoPacienteBtn) {
        nuevoPacienteBtn.addEventListener('click', function(e) {
            e.preventDefault();
            goToNewPatient();
        });
    }
    
    // Configurar Horarios button
    const configurarHorariosBtn = document.getElementById('configurarHorariosBtn');
    if (configurarHorariosBtn) {
        configurarHorariosBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/horarios';
        });
    }
    
    // Gestionar Días No Laborales button
    const gestionarDiasNoLaboralesBtn = document.getElementById('gestionarDiasNoLaboralesBtn');
    if (gestionarDiasNoLaboralesBtn) {
        gestionarDiasNoLaboralesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/horarios';
        });
    }
    
    // Sidebar Toggle button
    const sidebarToggleBtn = document.getElementById('sidebarToggleBtn');
    if (sidebarToggleBtn) {
        sidebarToggleBtn.addEventListener('click', function(e) {
            e.preventDefault();
            toggleSidebar();
        });
    }
    
    // Show Profile button
    const showProfileBtn = document.getElementById('showProfileBtn');
    if (showProfileBtn) {
        showProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showProfile();
        });
    }
    
    // Show Settings button
    const showSettingsBtn = document.getElementById('showSettingsBtn');
    if (showSettingsBtn) {
        showSettingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showSettings();
        });
    }
    
    // Gestionar Planes button
    const gestionarPlanesBtn = document.getElementById('gestionarPlanesBtn');
    if (gestionarPlanesBtn) {
        gestionarPlanesBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/plan-alimentario';
        });
    }
    
    // Nuevo Plan button
    const nuevoPlanBtn = document.getElementById('nuevoPlanBtn');
    if (nuevoPlanBtn) {
        nuevoPlanBtn.addEventListener('click', function(e) {
            e.preventDefault();
            window.location.href = '/plan-alimentario';
        });
    }
    
    // Admin functionality removed
    
    // Logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            logout();
        });
    }
    
    // Save Profile button
    const saveProfileBtn = document.getElementById('saveProfileBtn');
    if (saveProfileBtn) {
        saveProfileBtn.addEventListener('click', function(e) {
            e.preventDefault();
            saveProfessionalProfile();
        });
    }
    
    // Password form submit
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', function(e) {
            e.preventDefault();
            changePassword();
        });
    }
    
    // Mobile sidebar toggle
    const navbarToggler = document.querySelector('.navbar-toggler');
    if (navbarToggler) {
        navbarToggler.addEventListener('click', function() {
            const sidebar = document.querySelector('.sidebar');
            sidebar.classList.toggle('show');
        });
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', function(e) {
        const sidebar = document.querySelector('.sidebar');
        const navbarToggler = document.querySelector('.navbar-toggler');
        
        if (window.innerWidth <= 768 && 
            !sidebar.contains(e.target) && 
            !navbarToggler.contains(e.target)) {
            sidebar.classList.remove('show');
        }
    });
    
    // Settings Save Button
    const saveSettingsBtn = document.getElementById('saveSettingsBtn');
    if (saveSettingsBtn) {
        saveSettingsBtn.addEventListener('click', function(e) {
            e.preventDefault();
            saveSystemSettings();
        });
    }
    
    // Logout Modal buttons
    const confirmLogoutBtn = document.getElementById('confirmLogoutBtn');
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            executeLogout();
        });
    }
    
    const cancelLogoutBtn = document.getElementById('cancelLogoutBtn');
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            cancelLogout();
        });
    }
}

// Toggle sidebar function (for mobile)
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    sidebar.classList.toggle('show');
}

// Show profile modal
// Debug function to check localStorage
function debugLocalStorage() {
    const userData = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    console.log('🔍 DEPURACIÓN LOCAL STORAGE:');
    console.log('👤 user:', userData);
    console.log('🔑 token:', token);
    
    if (userData) {
        try {
            const parsed = JSON.parse(userData);
            console.log('📋 user parsed:', parsed);
        } catch (e) {
            console.error('❌ Error parsing user data:', e);
        }
    }
}

function showProfile() {
    console.log('📋 Mostrando modal de perfil...');
    
    // Debug localStorage first
    debugLocalStorage();
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('profileModal'));
    modal.show();
    
    // Load professional data
    loadProfessionalProfile();
}

// Show settings modal
function showSettings() {
    console.log('📋 Mostrando modal de configuración...');
    
    // Show the modal
    const modal = new bootstrap.Modal(document.getElementById('settingsModal'));
    modal.show();
    
    // Load current settings
    loadSystemSettings();
}

// Admin functionality removed - keeping dashboard focused on professional needs

// Load professional profile data
async function loadProfessionalProfile() {
    try {
        console.log('🔄 Iniciando carga de perfil profesional...');
        
        // Get user data from localStorage
        const userData = JSON.parse(localStorage.getItem('user'));
        console.log('📄 Datos de usuario en localStorage:', userData);
        
        // First load from localStorage (instant)
        if (userData) {
            console.log('✅ Cargando datos desde localStorage...');
            
            // Update form with cached data first
            document.getElementById('profileNombre').value = userData.nombre || '';
            document.getElementById('profileUsuario').value = userData.usuario || '';
            document.getElementById('profileEmail').value = userData.email || '';
            document.getElementById('profileTelefono').value = userData.telefono || '';
            document.getElementById('profileEspecialidad').value = userData.especialidad || '';
            document.getElementById('profileMatricula').value = userData.matricula || '';
            document.getElementById('profileExperiencia').value = userData.experiencia || '';
            document.getElementById('profileDescripcion').value = userData.descripcion || '';
            document.getElementById('profileClaveRegistro').value = userData.clave_registro_usada || 'No registrada';
            
            // Update navbar names immediately
            const displayName = userData.nombre || 'Profesional';
            document.getElementById('professionalName').textContent = displayName;
            document.getElementById('professionalNameSidebar').textContent = displayName;
        }
        
        // Then fetch fresh data from API
        if (userData && userData.id) {
            console.log('🔗 Obteniendo datos frescos desde API...');
            showAlert('Actualizando datos del perfil...', 'info');
            
            try {
                const response = await fetch(`/api/profesionales/${userData.id}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Content-Type': 'application/json'
                    }
                });
                
                if (response.ok) {
                    const apiResponse = await response.json();
                    const professionalData = apiResponse.data || apiResponse;
                    
                    console.log('📡 Datos del API:', professionalData);
                    
                    // Update form with fresh API data
                    document.getElementById('profileNombre').value = professionalData.nombre || '';
                    document.getElementById('profileUsuario').value = professionalData.usuario || '';
                    document.getElementById('profileEmail').value = professionalData.email || '';
                    document.getElementById('profileTelefono').value = professionalData.telefono || '';
                    document.getElementById('profileEspecialidad').value = professionalData.especialidad || '';
                    document.getElementById('profileMatricula').value = professionalData.matricula || '';
                    document.getElementById('profileExperiencia').value = professionalData.experiencia || '';
                    document.getElementById('profileDescripcion').value = professionalData.descripcion || '';
                    document.getElementById('profileClaveRegistro').value = professionalData.clave_registro_usada || 'No registrada';
                    
                    // Update navbar names with fresh data
                    const displayName = professionalData.nombre || 'Profesional';
                    document.getElementById('professionalName').textContent = displayName;
                    document.getElementById('professionalNameSidebar').textContent = displayName;
                    
                    // Update localStorage with fresh data
                    const updatedUserData = {
                        ...userData,
                        nombre: professionalData.nombre,
                        email: professionalData.email,
                        telefono: professionalData.telefono,
                        especialidad: professionalData.especialidad,
                        matricula: professionalData.matricula,
                        experiencia: professionalData.experiencia,
                        descripcion: professionalData.descripcion,
                        clave_registro_usada: professionalData.clave_registro_usada
                    };
                    localStorage.setItem('user', JSON.stringify(updatedUserData));
                    console.log('💾 localStorage actualizado:', updatedUserData);
                    
                    // Clear loading alert
                    setTimeout(() => {
                        const existingAlerts = document.querySelectorAll('.custom-alert');
                        existingAlerts.forEach(alert => alert.remove());
                    }, 1500);
                    
                } else {
                    console.warn('⚠️ No se pudieron obtener datos frescos del API, usando datos locales');
                    showAlert('Usando datos guardados localmente', 'warning');
                    setTimeout(() => {
                        const existingAlerts = document.querySelectorAll('.custom-alert');
                        existingAlerts.forEach(alert => alert.remove());
                    });
                }
            } catch (apiError) {
                console.warn('⚠️ Error en API:', apiError);
                showAlert('Modo offline: usando datos locales', 'warning');
                setTimeout(() => {
                    const existingAlerts = document.querySelectorAll('.custom-alert');
                    existingAlerts.forEach(alert => alert.remove());
                });
            }
        }
        
        // Load professional statistics
        if (userData && userData.id) {
            await loadProfessionalStats(userData.id);
        }
        
        console.log('✅ Perfil profesional cargado completamente');
        
    } catch (error) {
        console.error('❌ Error cargando perfil profesional:', error);
        showAlert(`Error al cargar los datos del perfil: ${error.message}`, 'error');
    }
}

// Load professional statistics
async function loadProfessionalStats(professionalId) {
    try {
        // Fetch statistics from API
        const [patientsResponse, consultationsResponse] = await Promise.all([
            fetch(`/api/usuarios?profesional_id=${professionalId}`),
            fetch(`/api/consultas?profesional_id=${professionalId}&fecha=${new Date().toISOString().split('T')[0]}`)
        ]);
        
        let patientsCount = 0;
        let consultationsCount = 0;
        
        if (patientsResponse.ok) {
            const patientsData = await patientsResponse.json();
            patientsCount = Array.isArray(patientsData) ? patientsData.length : 0;
        }
        
        if (consultationsResponse.ok) {
            const consultationsData = await consultationsResponse.json();
            consultationsCount = Array.isArray(consultationsData) ? consultationsData.length : 0;
        }
        
        // Update statistics in modal
        document.getElementById('statPatients').textContent = patientsCount;
        document.getElementById('statConsultations').textContent = consultationsCount;
        
        // Update sidebar statistics
        document.getElementById('sidebarPatientCount').textContent = patientsCount;
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        document.getElementById('statPatients').textContent = '0';
        document.getElementById('statConsultations').textContent = '0';
    }
}

// Save professional profile
async function saveProfessionalProfile() {
    try {
        console.log('💾 Iniciando guardado de perfil...');
        
        const formData = new FormData(document.getElementById('profileForm'));
        const professionalData = {
            nombre: formData.get('nombre') || '',
            email: formData.get('email') || '',
            telefono: formData.get('telefono') || '',
            especialidad: formData.get('especialidad') || '',
            matricula: formData.get('matricula') || '',
            experiencia: formData.get('experiencia') || '',
            descripcion: formData.get('descripcion') || ''
        };
        
        console.log('📋 Datos a guardar:', professionalData);
        
        const userData = JSON.parse(localStorage.getItem('user'));
        if (!userData || !userData.id) {
            console.error('❌ No hay datos de usuario válidos');
            throw new Error('No hay datos de usuario válidos');
        }
        
        const professionalId = userData.id;
        console.log('👤 ID del profesional:', professionalId);
        
        // Try to save to API first
        try {
            const response = await fetch(`/api/profesionales/${professionalId}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(professionalData)
            });
            
            if (response.ok) {
                console.log('✅ Perfil guardado exitosamente en servidor');
                showAlert('Perfil actualizado exitosamente', 'success');
            } else {
                const errorData = await response.json();
                console.warn('⚠️ Error del servidor:', errorData);
                showAlert(`Error del servidor: ${errorData.message || 'Error desconocido'}`, 'warning');
            }
        } catch (apiError) {
            console.warn('⚠️ Error conectando con servidor:', apiError);
            showAlert('Perfil guardado localmente (sin conexión al servidor)', 'warning');
        }
        
        // Always update localStorage (works offline too)
        const updatedUser = { ...userData, ...professionalData };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        console.log('💾 localStorage actualizado:', updatedUser);
        
        // Update navbar names immediately
        const displayName = professionalData.nombre || 'Profesional';
        document.getElementById('professionalName').textContent = displayName;
        document.getElementById('professionalNameSidebar').textContent = displayName;
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('profileModal'));
        if (modal) {
            modal.hide();
        }
        
    } catch (error) {
        console.error('❌ Error guardando perfil:', error);
        showAlert(`Error al guardar el perfil: ${error.message}`, 'error');
    }
}

// Change password
async function changePassword() {
    try {
        const formData = new FormData(document.getElementById('passwordForm'));
        const passwordData = {
            registrationKey: formData.get('registrationKey'),
            newPassword: formData.get('newPassword'),
            confirmPassword: formData.get('confirmPassword')
        };
        
        // Validate required fields
        if (!passwordData.registrationKey) {
            showAlert('La clave de registro es obligatoria', 'error');
            return;
        }
        
        // Validate passwords match
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            showAlert('Las contraseñas no coinciden', 'error');
            return;
        }
        
        // Validate password length
        if (passwordData.newPassword.length < 6) {
            showAlert('La nueva contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }
        
        const userData = JSON.parse(localStorage.getItem('user'));
        const professionalId = userData?.id;
        
        if (!professionalId) {
            showAlert('Error: No se encontró el ID del profesional', 'error');
            return;
        }
        
        const response = await fetch(`/api/profesionales/${professionalId}/password`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(passwordData)
        });
        
        if (response.ok) {
            showAlert('Contraseña actualizada exitosamente', 'success');
            
            // Clear password form
            document.getElementById('passwordForm').reset();
        } else {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al cambiar la contraseña');
        }
        
    } catch (error) {
        console.error('Error cambiando contraseña:', error);
        showAlert(error.message || 'Error al cambiar la contraseña', 'error');
    }
}

// Logout
// Patient Management Functions
function viewPatientHistory(patientId) {
    // Redirect to clinical history page
    window.location.href = `/patient-history?patientId=${patientId}`;
}


function newConsultation(patientId) {
    console.log('New consultation for patient ID:', patientId);
    
    // Obtener datos del paciente
    const paciente = pacientesData.find(p => p.id == patientId);
    if (!paciente) {
        showAlert('No se encontró información del paciente', 'warning');
        return;
    }
    
    // Mostrar modal de nueva consulta
    mostrarModalNuevaConsultaParaPaciente(patientId, paciente);
}

// Función de enviar mensaje a paciente - NO IMPLEMENTADA
function sendMessage(patientId) {
    showAlert(`Funcionalidad de mensajería no está implementada`, 'info');
}


function filterPatients() {
    const searchTerm = document.getElementById('patientSearch').value.toLowerCase();
    const statusFilter = document.getElementById('statusFilter').value;
    const rows = document.querySelectorAll('#patientsTableBody tr');
    
    rows.forEach(row => {
        const name = row.querySelector('.patient-details strong').textContent.toLowerCase();
        const dni = row.querySelector('.patient-details small').textContent.toLowerCase();
        const email = row.querySelector('.contact-info small').textContent.toLowerCase();
        const status = row.querySelector('.badge').textContent.toLowerCase();
        
        const matchesSearch = name.includes(searchTerm) || dni.includes(searchTerm) || email.includes(searchTerm);
        const matchesStatus = !statusFilter || status.includes(statusFilter);
        
        if (matchesSearch && matchesStatus) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

function sortPatients() {
    const sortBy = document.getElementById('sortBy').value;
    const tbody = document.getElementById('patientsTableBody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    
    rows.sort((a, b) => {
        switch(sortBy) {
            case 'name':
                const nameA = a.querySelector('.patient-details strong').textContent;
                const nameB = b.querySelector('.patient-details strong').textContent;
                return nameA.localeCompare(nameB);
            case 'lastConsultation':
                const dateA = new Date(a.querySelector('.consultation-date').textContent.split('/').reverse().join('-'));
                const dateB = new Date(b.querySelector('.consultation-date').textContent.split('/').reverse().join('-'));
                return dateB - dateA;
            case 'weight':
                const weightA = parseFloat(a.querySelector('.weight-value').textContent);
                const weightB = parseFloat(b.querySelector('.weight-value').textContent);
                return weightB - weightA;
            default:
                return 0;
        }
    });
    
    rows.forEach(row => tbody.appendChild(row));
}

// Load system settings
async function loadSystemSettings() {
    try {
        console.log('⚙️ Cargando configuraciones del sistema...');
        
        // Load timezone settings
        await loadTimezoneSettings();
        
        // Load additional settings
        loadAdditionalSettings();
        
        // Start time preview updates
        startTimePreview();
        
    } catch (error) {
        console.error('❌ Error cargando configuraciones:', error);
        showAlert('Error al cargar las configuraciones', 'error');
    }
}

// Load timezone settings
async function loadTimezoneSettings() {
    try {
        // Get current timezone from localStorage
        let savedTimezone = localStorage.getItem('systemTimezone');
        
        // Si no está en localStorage, intentar obtener de los datos del usuario
        if (!savedTimezone) {
            const userData = JSON.parse(localStorage.getItem('user'));
            if (userData && userData.timezone) {
                savedTimezone = userData.timezone;
                // Guardar en localStorage para futuras referencias
                localStorage.setItem('systemTimezone', savedTimezone);
            }
        }
        
        // Si todavía no hay timezone, usar default
        if (!savedTimezone) {
            savedTimezone = 'America/Argentina/Buenos_Aires';
        }
        
        // Display current timezone
        document.getElementById('currentTimezoneDisplay').value = formatTimezoneName(savedTimezone);
        
        // Set select dropdown value
        document.getElementById('timezoneSelect').value = savedTimezone;
        
        // Update system time display
        updateSystemTimeDisplay(savedTimezone);
        
        console.log('🕐 Configuración de zona horaria cargada:', savedTimezone);
        
    } catch (error) {
        console.error('❌ Error cargando zona horaria:', error);
    }
}

// Load additional settings
function loadAdditionalSettings() {
    try {
        // Load auto-save setting
        const autoSave = localStorage.getItem('autoSave') === 'true';
        document.getElementById('autoSaveSwitch').checked = autoSave;
        
        // Load notifications setting
        const notifications = localStorage.getItem('notifications') === 'true';
        document.getElementById('notificationsSwitch').checked = notifications;
        
        console.log('⚙️ Configuraciones adicionales cargadas');
        
    } catch (error) {
        console.error('❌ Error cargando configuraciones adicionales:', error);
    }
}

// Update system time display
function updateSystemTimeDisplay(timezone) {
    try {
        const now = dayjs().tz(timezone);
        const timeString = now.format('HH:mm:ss');
        const dateString = now.format('DD/MM/YYYY');
        
        document.getElementById('currentSystemTime').value = `${timeString} - ${dateString}`;
        
    } catch (error) {
        console.error('❌ Error actualizando hora del sistema:', error);
    }
}

// Format timezone name for display
function formatTimezoneName(timezone) {
    const timezoneNames = {
        'America/Argentina/Buenos_Aires': 'Buenos Aires (GMT-3)',
        'America/New_York': 'Nueva York (GMT-5/-4)',
        'America/Chicago': 'Chicago (GMT-6/-5)',
        'America/Denver': 'Denver (GMT-7/-6)',
        'America/Los_Angeles': 'Los Ángeles (GMT-8/-7)',
        'Europe/Madrid': 'Madrid (GMT+1/+2)',
        'Europe/London': 'Londres (GMT+0/+1)',
        'Europe/Paris': 'París (GMT+1/+2)',
        'UTC': 'UTC (GMT+0)'
    };
    
    return timezoneNames[timezone] || timezone;
}

// Start time preview updates
function startTimePreview() {
    const previewInterval = setInterval(() => {
        const selectedTimezone = document.getElementById('timezoneSelect').value;
        if (selectedTimezone) {
            updateTimePreview(selectedTimezone);
        }
    }, 1000);
    
    // Clear interval when modal is hidden
    document.getElementById('settingsModal').addEventListener('hidden.bs.modal', () => {
        clearInterval(previewInterval);
    });
}

// Update time preview
function updateTimePreview(timezone) {
    try {
        const now = dayjs().tz(timezone);
        document.getElementById('previewLocalTime').textContent = now.format('HH:mm:ss');
        document.getElementById('previewDate').textContent = now.format('DD/MM/YYYY');
        
        // Also update system time display
        updateSystemTimeDisplay(timezone);
        
    } catch (error) {
        console.error('❌ Error actualizando preview de tiempo:', error);
    }
}

// Save system settings
async function saveSystemSettings() {
    try {
        console.log('💾 Guardando configuraciones del sistema...');
        
        const selectedTimezone = document.getElementById('timezoneSelect').value;
        const autoSave = document.getElementById('autoSaveSwitch').checked;
        const notifications = document.getElementById('notificationsSwitch').checked;
        
        if (!selectedTimezone) {
            showAlert('Por favor selecciona una zona horaria', 'warning');
            return;
        }
        
        // Save to localStorage
        localStorage.setItem('systemTimezone', selectedTimezone);
        localStorage.setItem('autoSave', autoSave.toString());
        localStorage.setItem('notifications', notifications.toString());
        
        // Update professional timezone in database
        await updateProfessionalTimezone(selectedTimezone);
        
        // Close modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('settingsModal'));
        if (modal) {
            modal.hide();
        }
        
        showAlert('Configuraciones guardadas exitosamente', 'success');
        
        // Reload settings to reflect changes
        loadSystemSettings();
        
    } catch (error) {
        console.error('❌ Error guardando configuraciones:', error);
        showAlert(`Error al guardar las configuraciones: ${error.message}`, 'error');
    }
}

// Update professional timezone in database
async function updateProfessionalTimezone(timezone) {
    try {
        const userData = JSON.parse(localStorage.getItem('user'));
        
        if (!userData || !userData.id) {
            throw new Error('No hay datos de usuario válidos');
        }
        
        const response = await fetch(`/api/profesionales/${userData.id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ timezone: timezone })
        });
        
        if (response.ok) {
            // Update localStorage user data
            userData.timezone = timezone;
            localStorage.setItem('user', JSON.stringify(userData));
            
            // Actualizar también systemTimezone en localStorage
            localStorage.setItem('systemTimezone', timezone);
            
            // Si existe la variable global professionalTimezone en home.js, actualizarla
            if (typeof window.updateProfessionalTimezoneGlobal === 'function') {
                window.updateProfessionalTimezoneGlobal(timezone);
            }
            
            console.log('✅ Zona horaria actualizada en base de datos y localStorage:', timezone);
        } else {
            console.warn('⚠️ No se pudo actualizar la zona horaria en la base de datos');
        }
        
    } catch (error) {
        console.warn('⚠️ Error actualizando zona horaria en base de datos:', error);
    }
}

// Helper functions for formatting dates with timezone
function formatDateWithTimezone(dateTime) {
    try {
        const timezone = getSystemTimezone();
        const date = new Date(dateTime);
        
        const options = { 
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };
        
        const formatter = new Intl.DateTimeFormat('es-ES', options);
        return formatter.format(date);
    } catch (error) {
        // Fallback a formato local
        return new Date(dateTime).toLocaleDateString('es-ES');
    }
}

function formatTimeWithTimezone(dateTime) {
    try {
        const timezone = getSystemTimezone();
        const date = new Date(dateTime);
        
        const options = { 
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false
        };
        
        const formatter = new Intl.DateTimeFormat('es-ES', options);
        return formatter.format(date);
    } catch (error) {
        // Fallback a formato local
        return new Date(dateTime).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

// Utility functions for timezone handling
window.getSystemTimezone = function() {
    // Primero intentar obtener de localStorage
    let timezone = localStorage.getItem('systemTimezone');
    
    // Si no está en localStorage, intentar obtener de los datos del usuario
    if (!timezone) {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData && userData.timezone) {
            timezone = userData.timezone;
        }
    }
    
    return timezone || 'America/Argentina/Buenos_Aires';
}

window.formatDateTimeForSystem = function(dateTime, format = 'DD/MM/YYYY HH:mm:ss') {
    const timezone = getSystemTimezone();
    
    // Si dayjs-timezone no está disponible, usar Intl.DateTimeFormat
    if (typeof dayjs.tz === 'function') {
        return dayjs(dateTime).tz(timezone).format(format);
    } else {
        // Fallback usando Intl.DateTimeFormat
        const date = new Date(dateTime);
        const options = { 
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        const formatter = new Intl.DateTimeFormat('es-ES', options);
        return formatter.format(date);
    }
}

window.formatDateForSystem = function(dateTime, format = 'DD/MM/YYYY') {
    const timezone = getSystemTimezone();
    
    if (typeof dayjs.tz === 'function') {
        return dayjs(dateTime).tz(timezone).format(format);
    } else {
        // Fallback
        const date = new Date(dateTime);
        const options = { 
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };
        const formatter = new Intl.DateTimeFormat('es-ES', options);
        return formatter.format(date);
    }
}

window.formatTimeForSystem = function(dateTime, format = 'H:mm:ss') {
    const timezone = getSystemTimezone();
    
    if (typeof dayjs.tz === 'function') {
        return dayjs(dateTime).tz(timezone).format(format);
    } else {
        // Fallback
        const date = new Date(dateTime);
        const options = { 
            timeZone: timezone,
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        };
        const formatter = new Intl.DateTimeFormat('es-ES', options);
        return formatter.format(date);
    }
}

window.getCurrentSystemTime = function() {
    const timezone = getSystemTimezone();
    
    if (typeof dayjs.tz === 'function') {
        return dayjs().tz(timezone);
    } else {
        // Fallback
        return new Date();
    }
}

function logout() {
    // Show Bootstrap modal instead of alert
    showLogoutModal();
}

// Show logout modal
function showLogoutModal() {
    console.log('📋 Mostrando modal de logout...');
    
    // Create and show Bootstrap modal
    const modal = new bootstrap.Modal(document.getElementById('logoutConfirmModal'), {
        backdrop: 'static',
        keyboard: false
    });
    
    modal.show();
}

// Execute logout process
function executeLogout() {
    try {
        console.log('🚪 Cerrando sesión del usuario...');
        
        // Close modal first
        const modal = bootstrap.Modal.getInstance(document.getElementById('logoutConfirmModal'));
        if (modal) {
            modal.hide();
        }
        
        // Show logout loading state
        showAlert('Cerrando sesión...', 'info');
        
        // Clear all localStorage data
        localStorage.clear();
        
        // Clear any session storage too
        sessionStorage.clear();
        
        // Show success message briefly
        showAlert('Sesión cerrada exitosamente', 'success');
        
        // Wait a moment then redirect
        setTimeout(() => {
            // Remove any alerts
            document.querySelectorAll('.custom-alert, .alert').forEach(alert => alert.remove());
            
            // Redirect to login page
            window.location.href = '/views/login/index.html';
        }, 1500);
        
    } catch (error) {
        console.error('❌ Error durante el logout:', error);
        // Even if there's an error, redirect to login
        window.location.href = '/views/login/index.html';
    }
}

// Cancel logout action
function cancelLogout() {
    // Close the modal
    const modal = bootstrap.Modal.getInstance(document.getElementById('logoutConfirmModal'));
    if (modal) {
        modal.hide();
    }
    console.log('🚫 Logout cancelado por el usuario');
}

// Show alert function
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => alert.remove());

    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} custom-alert position-fixed`;
    alertDiv.style.cssText = `
        top: 100px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        border-radius: 10px;
        border: none;
        animation: slideInRight 0.3s ease-out;
    `;
    
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas fa-${getAlertIcon(type)} me-2"></i>
            <span>${message}</span>
            <button type="button" class="btn-close ms-auto" onclick="this.parentElement.parentElement.remove()"></button>
        </div>
    `;

    // Add to body
    document.body.appendChild(alertDiv);

    // Auto remove after 5 seconds
    setTimeout(() => {
        if (alertDiv.parentElement) {
            alertDiv.remove();
        }
    }, 5000);
}

// Get alert icon based on type
function getAlertIcon(type) {
    const icons = {
        'success': 'check-circle',
        'danger': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

// Ir a la vista de nuevo paciente
function goToNewPatient() {
    window.location.href = '/new-patient';
}


// Load horarios content
function loadHorariosContent() {
    const section = document.getElementById('horarios-section');
    if (!section) return;
    
    // Load horarios data and display
    loadHorariosData();
}

// Load horarios data from API
async function loadHorariosData() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No se encontró token de autenticación');
        }

        // Decode token to get profesional ID
        const payload = JSON.parse(atob(token.split('.')[1]));
        const profesionalId = payload.id;

        // Load horarios and dias no laborales in parallel
        const [horariosResponse, diasResponse, statsResponse] = await Promise.all([
            fetch(`/api/horarios/profesional/${profesionalId}/horarios`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`/api/horarios/profesional/${profesionalId}/dias-no-laborales`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            fetch(`/api/horarios/profesional/${profesionalId}/horarios/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
        ]);

        const horarios = await horariosResponse.json();
        const diasNoLaborales = await diasResponse.json();
        const stats = await statsResponse.json();

        // Display the data
        displayHorariosData(horarios.data || [], diasNoLaborales.data || [], stats.data || {});
        
        // Add event listener for config button
        setTimeout(() => {
            const configLink = document.getElementById('configHorariosLink');
            if (configLink) {
                configLink.addEventListener('click', function(e) {
                    console.log('Navegando a horarios...');
                    // El href ya está configurado, no necesitamos prevenir el comportamiento por defecto
                });
            }
        }, 100);
        
    } catch (error) {
        console.error('Error loading horarios:', error);
        displayHorariosError('Error al cargar los horarios: ' + error.message);
    }
}

// Display horarios data
function displayHorariosData(horarios, diasNoLaborales, stats) {
    const section = document.getElementById('horarios-section');
    if (!section) return;

    const cardBody = section.querySelector('.card-body');
    if (!cardBody) return;

    cardBody.innerHTML = `
        <div class="row">
            <!-- Horarios de Trabajo -->
            <div class="col-lg-7 mb-4">
                <div class="card">
                    <div class="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                        <h6 class="mb-0"><i class="fas fa-calendar-alt me-2"></i>Horarios de Trabajo</h6>
                        <span class="badge bg-light text-primary">${horarios.length} Horarios</span>
                    </div>
                    <div class="card-body">
                        ${horarios.length > 0 ? `
                            <div class="horarios-cards-container">
                                ${(() => {
                                    // Agrupar horarios por día
                                    const horariosPorDia = {};
                                    horarios.forEach(horario => {
                                        if (!horariosPorDia[horario.dia_semana]) {
                                            horariosPorDia[horario.dia_semana] = [];
                                        }
                                        horariosPorDia[horario.dia_semana].push(horario);
                                    });

                                    // Orden de días de la semana
                                    const ordenDias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
                                    
                                    return ordenDias.map(dia => {
                                        if (horariosPorDia[dia]) {
                                            return `
                                                <div class="dia-card">
                                                    <div class="dia-card-header">
                                                        <h6 class="dia-card-title">
                                                            <i class="fas fa-calendar-day me-2"></i>${dia}
                                                            <span class="badge bg-light text-primary ms-2">${horariosPorDia[dia].length}</span>
                                                        </h6>
                                                    </div>
                                                    <div class="horarios-list">
                                                        ${horariosPorDia[dia].map(horario => `
                                                            <div class="horario-card">
                                                                <div class="horario-info">
                                                                    <div class="horario-time">${horario.hora_inicio} - ${horario.hora_fin}</div>
                                                                    <div class="horario-details">
                                                                        <span class="duracion">${horario.duracion_minutos}min</span>
                                                                        <span class="badge ${horario.activo ? 'bg-success' : 'bg-secondary'}">${horario.activo ? 'Activo' : 'Inactivo'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                        `).join('')}
                                                    </div>
                                                </div>
                                            `;
                                        }
                                        return '';
                                    }).filter(Boolean).join('');
                                })()}
                            </div>
                        ` : `
                            <div class="text-center py-3">
                                <i class="fas fa-clock fa-2x text-muted mb-2"></i>
                                <p class="text-muted mb-3">No hay horarios configurados</p>
                            </div>
                        `}
                    </div>
                </div>
            </div>

            <!-- Días No Laborales y Estadísticas -->
            <div class="col-lg-5 mb-4">
                <div class="card mb-3">
                    <div class="card-header bg-warning text-dark d-flex justify-content-between align-items-center">
                        <h6 class="mb-0"><i class="fas fa-calendar-times me-2"></i>Días No Laborales</h6>
                        <span class="badge bg-dark text-warning">${diasNoLaborales.length} Días</span>
                    </div>
                    <div class="card-body">
                        ${diasNoLaborales.length > 0 ? `
                            <div class="table-responsive">
                                <table class="table table-sm table-hover">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th>Motivo</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${diasNoLaborales.slice(0, 5).map(dia => `
                                            <tr>
                                                <td>${new Date(dia.fecha).toLocaleDateString()}</td>
                                                <td>${dia.motivo || 'Sin motivo'}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                                ${diasNoLaborales.length > 5 ? `<small class="text-muted">Y ${diasNoLaborales.length - 5} más...</small>` : ''}
                            </div>
                        ` : `
                            <div class="text-center py-2">
                                <i class="fas fa-calendar-check fa-2x text-muted mb-2"></i>
                                <p class="text-muted mb-2">No hay días no laborales</p>
                            </div>
                        `}
                    </div>
                </div>

                <div class="card">
                    <div class="card-header bg-info text-white">
                        <h6 class="mb-0"><i class="fas fa-chart-bar me-2"></i>Estadísticas</h6>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-6 mb-2">
                                <div class="border-end">
                                    <h5 class="text-primary mb-1">${stats.total_horarios || 0}</h5>
                                    <small class="text-muted">Horarios Activos</small>
                                </div>
                            </div>
                            <div class="col-6 mb-2">
                                <h5 class="text-success mb-1">${stats.dias_cubiertos || 0}</h5>
                                <small class="text-muted">Días Cubiertos</small>
                            </div>
                            <div class="col-6">
                                <h5 class="text-warning mb-1">${stats.proximos_dias_no_laborales || 0}</h5>
                                <small class="text-muted">Próximos Días No Laborales</small>
                            </div>
                            <div class="col-6">
                                <h5 class="text-info mb-1">${stats.horas_semanales || 0}h</h5>
                                <small class="text-muted">Horas Semanales</small>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-3">
            <div class="col-12 text-center">
                <a href="/horarios" class="btn btn-primary" id="configHorariosLink">
                    <i class="fas fa-cog me-2"></i>Configurar Horarios
                </a>
            </div>
        </div>
    `;
}

// Display error message
function displayHorariosError(message) {
    const section = document.getElementById('horarios-section');
    if (!section) return;

    const cardBody = section.querySelector('.card-body');
    if (!cardBody) return;

    cardBody.innerHTML = `
        <div class="alert alert-danger text-center">
            <i class="fas fa-exclamation-triangle fa-2x mb-3"></i>
            <h5>Error al Cargar Horarios</h5>
            <p>${message}</p>
            <button class="btn btn-danger" onclick="loadHorariosData()">
                <i class="fas fa-refresh me-2"></i>Reintentar
            </button>
        </div>
    `;
}

// Función para agregar el modal de nueva consulta al DOM
function agregarModalNuevaConsulta() {
    // Verificar si el modal ya existe
    if (document.getElementById('modalNuevaConsulta')) {
        return;
    }

    const modalHTML = `
        <div class="modal fade" id="modalNuevaConsulta" tabindex="-1" aria-labelledby="modalNuevaConsultaLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="modalNuevaConsultaLabel">
                            <i class="fas fa-plus-circle me-2"></i>Nueva Consulta
                        </h5>
                        <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <form id="formNuevaConsulta">
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="fechaConsulta" class="form-label">Fecha de la Consulta</label>
                                        <input type="date" class="form-control" id="fechaConsulta" required>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="horaConsulta" class="form-label">Hora</label>
                                        <select class="form-control" id="horaConsulta" required>
                                            <option value="">Seleccionar hora...</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="tipoPaciente" class="form-label">Tipo de Paciente</label>
                                        <select class="form-control" id="tipoPaciente" required>
                                            <option value="">Seleccionar tipo...</option>
                                            <option value="registrado">Paciente Registrado</option>
                                            <option value="externo">Paciente Externo</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6" id="pacienteRegistradoContainer" style="display: none;">
                                    <div class="mb-3">
                                        <label for="pacienteConsulta" class="form-label">Paciente</label>
                                        <select class="form-control" id="pacienteConsulta">
                                            <option value="">Seleccionar paciente...</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="col-md-6" id="pacienteExternoContainer" style="display: none;">
                                    <div class="mb-3">
                                        <label for="pacienteExternoNombre" class="form-label">Nombre Completo</label>
                                        <input type="text" class="form-control" id="pacienteExternoNombre" placeholder="Nombre y apellido">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row" id="datosExternosContainer" style="display: none;">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="pacienteExternoTelefono" class="form-label">Teléfono</label>
                                        <input type="tel" class="form-control" id="pacienteExternoTelefono" placeholder="Número de teléfono">
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="pacienteExternoEmail" class="form-label">Email (opcional)</label>
                                        <input type="email" class="form-control" id="pacienteExternoEmail" placeholder="Correo electrónico">
                                    </div>
                                </div>
                            </div>
                            
                            <div class="row">
                                <div class="col-md-6">
                                    <div class="mb-3">
                                        <label for="objetivoConsulta" class="form-label">Objetivo de la Consulta</label>
                                        <select class="form-control" id="objetivoConsulta" required>
                                            <option value="">Seleccionar objetivo...</option>
                                            <option value="perdida_peso">Pérdida de peso</option>
                                            <option value="ganancia_masa">Ganancia de masa muscular</option>
                                            <option value="salud">Mejora de salud general</option>
                                            <option value="rendimiento">Rendimiento deportivo</option>
                                            <option value="otro">Otro</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="mb-3">
                                <label for="condicionesMedicas" class="form-label">Condiciones Médicas</label>
                                <textarea class="form-control" id="condicionesMedicas" rows="3" placeholder="Describir condiciones médicas relevantes..."></textarea>
                            </div>
                            
                            <div class="mb-3">
                                <label for="motivoConsulta" class="form-label">Motivo de la Consulta</label>
                                <textarea class="form-control" id="motivoConsulta" rows="3" placeholder="Describir el motivo específico de la consulta..."></textarea>
                            </div>
                        </form>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="guardarConsulta">
                            <i class="fas fa-save me-2"></i>Guardar Consulta
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Agregar el modal al body
    document.body.insertAdjacentHTML('beforeend', modalHTML);
}

// Función para mostrar el modal de nueva consulta
function mostrarModalNuevaConsulta() {
    const modalElement = document.getElementById('modalNuevaConsulta');
    
    if (!modalElement) {
        console.error('❌ Modal modalNuevaConsulta no encontrado en DOM');
        showAlert('Error: Modal de nueva consulta no encontrado', 'error');
        return;
    }
    
    const modal = new bootstrap.Modal(modalElement);
    
    // Limpiar formulario
    const form = document.getElementById('formNuevaConsulta');
    if (form) {
        form.reset();
    }
    
    // Ocultar contenedores de pacientes
    document.getElementById('pacienteRegistradoContainer').style.display = 'none';
    document.getElementById('pacienteExternoContainer').style.display = 'none';
    document.getElementById('datosExternosContainer').style.display = 'none';
    
    // Limpiar selectores
    document.getElementById('horaConsulta').innerHTML = '<option value="">Seleccionar hora...</option>';
    document.getElementById('pacienteConsulta').innerHTML = '<option value="">Seleccionar paciente...</option>';
    
    // No cargar pacientes automáticamente, se cargarán cuando se seleccione tipo "registrado"
    
    // Configurar fecha mínima (hoy en UTC)
    const fechaInput = document.getElementById('fechaConsulta');
    
    // Obtener fecha actual en la zona horaria del profesional
    const userData = localStorage.getItem('user');
    const user = userData ? JSON.parse(userData) : null;
    const timezone = user?.timezone || 'UTC';
    const hoy = new Date().toLocaleDateString('en-CA', { timeZone: timezone });
    
    fechaInput.min = hoy;
    fechaInput.value = hoy;
    
    // Cargar horarios disponibles para hoy
    cargarHorariosDisponibles(hoy);
    
    // Event listener para cambio de fecha
    fechaInput.addEventListener('change', function() {
        cargarHorariosDisponibles(this.value);
    });
    
    // Event listener para cambio de tipo de paciente
    document.getElementById('tipoPaciente').addEventListener('change', function() {
        const tipo = this.value;
        const pacienteRegistradoContainer = document.getElementById('pacienteRegistradoContainer');
        const pacienteExternoContainer = document.getElementById('pacienteExternoContainer');
        const datosExternosContainer = document.getElementById('datosExternosContainer');
        
        if (tipo === 'registrado') {
            pacienteRegistradoContainer.style.display = 'block';
            pacienteExternoContainer.style.display = 'none';
            datosExternosContainer.style.display = 'none';
            cargarPacientes();
        } else if (tipo === 'externo') {
            pacienteRegistradoContainer.style.display = 'none';
            pacienteExternoContainer.style.display = 'block';
            datosExternosContainer.style.display = 'block';
        } else {
            pacienteRegistradoContainer.style.display = 'none';
            pacienteExternoContainer.style.display = 'none';
            datosExternosContainer.style.display = 'none';
        }
    });
    
    // Event listener para guardar
    document.getElementById('guardarConsulta').addEventListener('click', guardarNuevaConsulta);
    
    // Event listener para limpiar formulario al cerrar modal
    document.getElementById('modalNuevaConsulta').addEventListener('hidden.bs.modal', function() {
        // Limpiar formulario
        document.getElementById('formNuevaConsulta').reset();
        
        // Ocultar contenedores de pacientes
        document.getElementById('pacienteRegistradoContainer').style.display = 'none';
        document.getElementById('pacienteExternoContainer').style.display = 'none';
        document.getElementById('datosExternosContainer').style.display = 'none';
        
        // Limpiar selectores
        document.getElementById('horaConsulta').innerHTML = '<option value="">Seleccionar hora...</option>';
        document.getElementById('pacienteConsulta').innerHTML = '<option value="">Seleccionar paciente...</option>';
        
        // Limpiar backdrop si existe
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        
        // Restaurar scroll del body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Cerrar todas las instancias de Bootstrap modal
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modalElement => {
            const modalInstance = bootstrap.Modal.getInstance(modalElement);
            if (modalInstance) {
                modalInstance.dispose();
            }
        });
    });
    
    // MOSTRAR EL MODAL
    try {
        console.log('🎭 Mostrando modal...');
        modal.show();
        console.log('✅ Modal.show() ejecutado');
    } catch (error) {
        console.error('❌ Error al mostrar modal:', error);
        showAlert('Error al mostrar el modal de nueva consulta', 'error');
    }
}

// Función para cargar horarios disponibles para una fecha
function cargarHorariosDisponibles(fecha) {
    console.log('📅 Cargando horarios para fecha:', fecha);
    
    const horaSelect = document.getElementById('horaConsulta');
    if (!horaSelect) {
        console.log('⚠️ Selector de hora no encontrado');
        return;
    }
    
    // Limpiar opciones anteriores
    horaSelect.innerHTML = '<option value="">Seleccionar hora...</option>';
    
    // Generar horarios básicos (8 AM a 8 PM cada hora)
    const horarios = [];
    for (let hora = 8; hora <= 20; hora++) {
        horarios.push({
            hora: hora,
            label: `${hora.toString().padStart(2, '0')}:00`
        });
    }
    
    // Agregar horarios al select
    horarios.forEach(horario => {
        const option = document.createElement('option');
        option.value = `${horario.label}`;
        option.textContent = horario.label;
        horaSelect.appendChild(option);
    });
    
}


// Función para guardar nueva consulta
async function guardarNuevaConsulta() {
    console.log('💾 Guardando nueva consulta...');
    
    try {
        // Obtener datos del formulario
        const form = document.getElementById('formNuevaConsulta');
        const formData = new FormData(form);
        
        const consultaData = {
            fecha: formData.get('fecha'),
            hora: formData.get('hora'),
            tipo_paciente: formData.get('tipo_paciente'),
            paciente_id: formData.get('paciente_id'),
            motivo_consulta: formData.get('motivo_consulta'),
            tipo_consulta: formData.get('tipo_consulta')
        };
        
        // Validar datos requeridos
        if (!consultaData.fecha || !consultaData.hora) {
            showAlert('Fecha y hora son requeridos', 'warning');
            return;
        }
        
        if (consultaData.tipo_paciente === 'registrado' && !consultaData.paciente_id) {
            showAlert('Debe seleccionar un paciente', 'warning');
            return;
        }
        
        console.log('📋 Datos de consulta:', consultaData);
        
        // TODO: Enviar datos a la API
        showAlert('Funcionalidad de guardado en desarrollo', 'info');
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevaConsulta'));
        if (modal) {
            modal.hide();
        }
        
    } catch (error) {
        console.error('❌ Error al guardar consulta:', error);
        showAlert('Error al guardar la consulta', 'danger');
    }
}

// Función para mostrar el modal de nueva consulta general (sin paciente específico)
function showNewConsultation() {
    // Asegurar que el modal existe
    if (!document.getElementById('modalNuevaConsulta')) {
        agregarModalNuevaConsulta();
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modalNuevaConsulta'));
    
    // Limpiar formulario
    document.getElementById('formNuevaConsulta').reset();
    
    // Configurar para selección libre (NO bloquear)
    const tipoPacienteSelect = document.getElementById('tipoPaciente');
    tipoPacienteSelect.disabled = false; // Permitir selección libre
    tipoPacienteSelect.style.backgroundColor = ''; // Color normal
    tipoPacienteSelect.value = ''; // Sin selección inicial
    
    // Asegurar que el campo de paciente también esté habilitado
    const pacienteSelect = document.getElementById('pacienteConsulta');
    if (pacienteSelect) {
        pacienteSelect.disabled = false; // Permitir selección libre
        pacienteSelect.style.backgroundColor = ''; // Color normal
    }
    
    // Ocultar todos los contenedores inicialmente
    document.getElementById('pacienteRegistradoContainer').style.display = 'none';
    document.getElementById('pacienteExternoContainer').style.display = 'none';
    document.getElementById('datosExternosContainer').style.display = 'none';
    
    // Configurar fecha mínima (hoy)
    const fechaInput = document.getElementById('fechaConsulta');
    const hoy = new Date().toLocaleDateString('en-CA');
    fechaInput.min = hoy;
    fechaInput.value = hoy;
    
    // Cargar horarios disponibles para hoy
    cargarHorariosDisponibles(hoy);
    
    // Actualizar título del modal
    document.getElementById('modalNuevaConsultaLabel').innerHTML = 
        `<i class="fas fa-plus-circle me-2"></i>Nueva Consulta`;
    
    // Mostrar modal
    console.log('🎭 Mostrando modal general...');
    modal.show();
    console.log('✅ Modal.show() ejecutado');
    
    // Event listener para cambio de fecha
    fechaInput.addEventListener('change', function() {
        cargarHorariosDisponibles(this.value);
    });
}

// Función para mostrar el modal de nueva consulta para un paciente específico
function mostrarModalNuevaConsultaParaPaciente(patientId, paciente) {
    // Asegurar que el modal existe
    if (!document.getElementById('modalNuevaConsulta')) {
        agregarModalNuevaConsulta();
    }
    
    const modal = new bootstrap.Modal(document.getElementById('modalNuevaConsulta'));
    
    // Limpiar formulario
    document.getElementById('formNuevaConsulta').reset();
    
    // Configurar para paciente registrado y BLOQUEAR la selección
    const tipoPacienteSelect = document.getElementById('tipoPaciente');
    tipoPacienteSelect.value = 'registrado';
    tipoPacienteSelect.disabled = true; // BLOQUEAR la selección
    tipoPacienteSelect.style.backgroundColor = '#f8f9fa'; // Color gris para indicar que está bloqueado
    
    document.getElementById('pacienteRegistradoContainer').style.display = 'block';
    document.getElementById('pacienteExternoContainer').style.display = 'none';
    document.getElementById('datosExternosContainer').style.display = 'none';
    
    // Cargar pacientes y seleccionar el actual, luego BLOQUEAR la selección
    cargarPacientes();
    setTimeout(() => {
        const pacienteSelect = document.getElementById('pacienteConsulta');
        pacienteSelect.value = patientId;
        pacienteSelect.disabled = true; // BLOQUEAR la selección de paciente
        pacienteSelect.style.backgroundColor = '#f8f9fa'; // Color gris para indicar que está bloqueado
    }, 100);
    
    // Configurar fecha mínima (hoy)
    const fechaInput = document.getElementById('fechaConsulta');
    const hoy = new Date().toLocaleDateString('en-CA');
    fechaInput.min = hoy;
    fechaInput.value = hoy;
    
    // Cargar horarios disponibles para hoy
    cargarHorariosDisponibles(hoy);
    
    // Actualizar título del modal
    document.getElementById('modalNuevaConsultaLabel').innerHTML = 
        `<i class="fas fa-plus-circle me-2"></i>Nueva Consulta - ${paciente.apellido_nombre}`;
    
    // Mostrar modal
    console.log('🎭 Mostrando modal...');
    modal.show();
    console.log('✅ Modal.show() ejecutado');
    
    // Event listener para cambio de fecha
    fechaInput.addEventListener('change', function() {
        cargarHorariosDisponibles(this.value);
    });
    
    // Event listener para cambio de tipo de paciente
    document.getElementById('tipoPaciente').addEventListener('change', function() {
        const tipo = this.value;
        const pacienteRegistradoContainer = document.getElementById('pacienteRegistradoContainer');
        const pacienteExternoContainer = document.getElementById('pacienteExternoContainer');
        const datosExternosContainer = document.getElementById('datosExternosContainer');
        
        if (tipo === 'registrado') {
            pacienteRegistradoContainer.style.display = 'block';
            pacienteExternoContainer.style.display = 'none';
            datosExternosContainer.style.display = 'none';
            cargarPacientes();
        } else if (tipo === 'externo') {
            pacienteRegistradoContainer.style.display = 'none';
            pacienteExternoContainer.style.display = 'block';
            datosExternosContainer.style.display = 'block';
        } else {
            pacienteRegistradoContainer.style.display = 'none';
            pacienteExternoContainer.style.display = 'none';
            datosExternosContainer.style.display = 'none';
        }
    });
    
    // Event listener para guardar
    document.getElementById('guardarConsulta').addEventListener('click', guardarNuevaConsulta);
    
    // Event listener para limpiar formulario al cerrar modal
    document.getElementById('modalNuevaConsulta').addEventListener('hidden.bs.modal', function() {
        // Limpiar formulario
        document.getElementById('formNuevaConsulta').reset();
        
        // Ocultar contenedores de pacientes
        document.getElementById('pacienteRegistradoContainer').style.display = 'none';
        document.getElementById('pacienteExternoContainer').style.display = 'none';
        document.getElementById('datosExternosContainer').style.display = 'none';
        
        // Limpiar selectores
        document.getElementById('horaConsulta').innerHTML = '<option value="">Seleccionar hora...</option>';
        document.getElementById('pacienteConsulta').innerHTML = '<option value="">Seleccionar paciente...</option>';
        
        // Limpiar backdrop si existe
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        
        // Restaurar scroll del body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    });
    
    modal.show();
}

// Función para cargar pacientes en el selector
async function cargarPacientes() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/agenda/profesional/1/pacientes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const select = document.getElementById('pacienteConsulta');
            
            // Limpiar opciones existentes
            select.innerHTML = '<option value="">Seleccionar paciente...</option>';
            
            // Agregar pacientes
            data.data.forEach(paciente => {
                const option = document.createElement('option');
                option.value = paciente.id;
                option.textContent = paciente.apellido_nombre;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error al cargar pacientes:', error);
    }
}

// Función para cargar horarios disponibles
async function cargarHorariosDisponibles(fecha) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/agenda/profesional/1/horarios-disponibles/${fecha}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            const select = document.getElementById('horaConsulta');
            
            // Limpiar opciones existentes
            select.innerHTML = '<option value="">Seleccionar hora...</option>';
            
            if (data.data && data.data.length > 0) {
                // Filtrar solo horarios disponibles (que no estén ocupados)
                const horariosDisponibles = data.data.filter(horario => {
                    // Si el horario tiene la propiedad 'disponible' o no está marcado como ocupado
                    return horario.disponible !== false;
                });
                
                if (horariosDisponibles.length > 0) {
                    // Agregar solo horarios disponibles
                    horariosDisponibles.forEach(horario => {
                        const option = document.createElement('option');
                        option.value = horario.hora;
                        option.textContent = `${horario.hora} (${horario.duracion_minutos} min)`;
                        select.appendChild(option);
                    });
                } else {
                    // No hay horarios disponibles
                    const option = document.createElement('option');
                    option.value = '';
                    option.textContent = 'No hay horarios disponibles para esta fecha';
                    option.disabled = true;
                    select.appendChild(option);
                }
            } else {
                // No hay horarios configurados
                const option = document.createElement('option');
                option.value = '';
                option.textContent = 'No hay horarios configurados para este día';
                option.disabled = true;
                select.appendChild(option);
            }
        }
    } catch (error) {
        console.error('Error al cargar horarios disponibles:', error);
    }
}

// Función para guardar nueva consulta
async function guardarNuevaConsulta() {
    try {
        const tipoPaciente = document.getElementById('tipoPaciente').value;
        const consultaData = {
            fecha: document.getElementById('fechaConsulta').value,
            hora: document.getElementById('horaConsulta').value,
            objetivo: document.getElementById('objetivoConsulta').value,
            condiciones_medicas: document.getElementById('condicionesMedicas').value,
            motivo_consulta: document.getElementById('motivoConsulta').value
        };
        
        // Validar datos según tipo de paciente
        if (tipoPaciente === 'registrado') {
            consultaData.usuario_id = document.getElementById('pacienteConsulta').value;
            if (!consultaData.usuario_id) {
                showAlert('Por favor seleccione un paciente registrado', 'warning');
                return;
            }
        } else if (tipoPaciente === 'externo') {
            consultaData.paciente_externo_nombre = document.getElementById('pacienteExternoNombre').value;
            consultaData.paciente_externo_telefono = document.getElementById('pacienteExternoTelefono').value;
            consultaData.paciente_externo_email = document.getElementById('pacienteExternoEmail').value;
            
            if (!consultaData.paciente_externo_nombre || !consultaData.paciente_externo_telefono) {
                showAlert('Por favor complete el nombre y teléfono del paciente externo', 'warning');
                return;
            }
        } else {
            showAlert('Por favor seleccione el tipo de paciente', 'warning');
            return;
        }
        
        // Validar datos requeridos comunes
        if (!consultaData.fecha || !consultaData.hora || !consultaData.objetivo) {
            showAlert('Por favor complete todos los campos requeridos', 'warning');
            return;
        }
        
        // Obtener ID del profesional
        const userData = localStorage.getItem('user');
        const user = userData ? JSON.parse(userData) : null;
        const profesionalId = user?.id || 1;
        
        // Agregar profesional_id a los datos
        consultaData.profesional_id = profesionalId;
        
        const token = localStorage.getItem('token');
        const response = await fetch('/api/agenda/profesional/1/consultas', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(consultaData)
        });
        
        if (response.ok) {
            const data = await response.json();
            showAlert('Consulta creada exitosamente', 'success');
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalNuevaConsulta'));
            if (modal) {
                modal.hide();
            }
            
            // Limpiar backdrop si existe
            setTimeout(() => {
                const backdrop = document.querySelector('.modal-backdrop');
                if (backdrop) {
                    backdrop.remove();
                }
                
                // Restaurar scroll del body
                document.body.classList.remove('modal-open');
                document.body.style.overflow = '';
                document.body.style.paddingRight = '';
            }, 300);
            
            // Recargar horarios disponibles para la fecha actual
            const fechaActual = document.getElementById('fechaConsulta').value;
            if (fechaActual) {
                cargarHorariosDisponibles(fechaActual);
            }
            
            // Recargar calendario
            renderizarCalendario();
            loadAgendaData();
        } else {
            const error = await response.json();
            showAlert(`Error al crear consulta: ${error.message}`, 'danger');
        }
    } catch (error) {
        console.error('Error al guardar consulta:', error);
        showAlert('Error al guardar la consulta', 'danger');
    }
}

// Función para mostrar información de cuenta del paciente
function showPatientAccountInfo(patientId) {
    // Buscar el paciente en la lista actual
    const patient = pacientesData.find(p => p.id === patientId);
    
    if (!patient) {
        showAlert('Paciente no encontrado', 'error');
        return;
    }
    
    const accountStatus = patient.tiene_cuenta ? 'SÍ' : 'NO';
    const statusColor = patient.tiene_cuenta ? 'success' : 'warning';
    const statusIcon = patient.tiene_cuenta ? 'check-circle' : 'exclamation-triangle';
    
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-user me-2"></i>Información de Cuenta - ${patient.apellido_nombre}
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="row">
                        <div class="col-md-6">
                            <div class="info-item mb-3">
                                <label class="form-label fw-bold">Estado de Cuenta:</label>
                                <div class="d-flex align-items-center">
                                    <span class="badge bg-${statusColor} me-2">
                                        <i class="fas fa-${statusIcon} me-1"></i>${accountStatus}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="info-item mb-3">
                                <label class="form-label fw-bold">Email:</label>
                                <p class="mb-0">${patient.email || 'No especificado'}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-12">
                            <div class="info-item mb-3">
                                <label class="form-label fw-bold">Usuario:</label>
                                <p class="mb-0">
                                    ${patient.tiene_cuenta ? `
                                        <span class="badge bg-primary fs-6">
                                            <i class="fas fa-user me-1"></i>${patient.usuario || 'No especificado'}
                                        </span>
                                    ` : `
                                        <span class="text-muted">Sin cuenta de usuario</span>
                                    `}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="row mt-3">
                        <div class="col-12">
                            <div class="info-item">
                                <label class="form-label fw-bold">Funcionalidades Disponibles:</label>
                                <div class="mt-2">
                                    ${patient.tiene_cuenta ? `
                                        <div class="d-flex flex-wrap gap-2">
                                            <span class="badge bg-success">
                                                <i class="fas fa-utensils me-1"></i>Ver Recetas
                                            </span>
                                            <span class="badge bg-success">
                                                <i class="fas fa-chart-line me-1"></i>Ver Evoluciones
                                            </span>
                                            <span class="badge bg-success">
                                                <i class="fas fa-weight me-1"></i>Ver Peso
                                            </span>
                                        </div>
                                    ` : `
                                        <div class="alert alert-warning">
                                            <i class="fas fa-info-circle me-2"></i>
                                            El paciente no tiene cuenta de usuario. Solo puede ser gestionado desde este panel profesional.
                                        </div>
                                    `}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${patient.tiene_cuenta ? `
                        <div class="row mt-3">
                            <div class="col-12">
                                <div class="alert alert-info">
                                    <h6 class="alert-heading">
                                        <i class="fas fa-key me-2"></i>Credenciales de Acceso
                                    </h6>
                                    <div class="row">
                                        <div class="col-md-6">
                                            <strong>Usuario:</strong> <code>${patient.usuario}</code>
                                        </div>
                                        <div class="col-md-6">
                                            <strong>Para ingresar:</strong> El paciente debe usar este usuario y su contraseña
                                        </div>
                                    </div>
                                    <hr>
                                    <small class="text-muted">
                                        <i class="fas fa-info-circle me-1"></i>
                                        El paciente puede acceder al sistema desde la página de login seleccionando "Paciente" como tipo de usuario.
                                    </small>
                                </div>
                            </div>
                        </div>
                    ` : ''}
                </div>
                <div class="modal-footer">
                    ${!patient.tiene_cuenta ? `
                        <button type="button" class="btn btn-primary" onclick="createAccountForPatient(${patientId})">
                            <i class="fas fa-user-plus me-2"></i>Crear Cuenta
                        </button>
                    ` : `
                        <button type="button" class="btn btn-warning" onclick="resetPatientPassword(${patientId})">
                            <i class="fas fa-key me-2"></i>Resetear Contraseña
                        </button>
                    `}
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Limpiar modal cuando se cierre
    modal.addEventListener('hidden.bs.modal', function() {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    });
}

// Función para crear cuenta para paciente existente
async function createAccountForPatient(patientId) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-user-plus me-2"></i>Crear Cuenta de Usuario
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <form id="createAccountForm">
                        <div class="mb-3">
                            <label for="newUsername" class="form-label">Nombre de Usuario *</label>
                            <input type="text" class="form-control" id="newUsername" required>
                            <div class="form-text">El paciente usará este nombre para iniciar sesión</div>
                        </div>
                        <div class="mb-3">
                            <label for="newPassword" class="form-label">Contraseña *</label>
                            <input type="password" class="form-control" id="newPassword" required minlength="6">
                            <div class="form-text">Mínimo 6 caracteres</div>
                        </div>
                        <div class="mb-3">
                            <label for="confirmPassword" class="form-label">Confirmar Contraseña *</label>
                            <input type="password" class="form-control" id="confirmPassword" required>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" onclick="submitCreateAccount(${patientId})">
                        <i class="fas fa-save me-2"></i>Crear Cuenta
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Limpiar modal cuando se cierre
    modal.addEventListener('hidden.bs.modal', function() {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    });
}

// Función para resetear contraseña de paciente
async function resetPatientPassword(patientId) {
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.innerHTML = `
        <div class="modal-dialog">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">
                        <i class="fas fa-key me-2"></i>Resetear Contraseña
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                </div>
                <div class="modal-body">
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        <strong>Importante:</strong> Esta acción cambiará la contraseña del paciente. 
                        Asegúrate de comunicarle la nueva contraseña de forma segura.
                    </div>
                    
                    <form id="resetPasswordForm">
                        <div class="mb-3">
                            <label for="newPasswordReset" class="form-label">Nueva Contraseña *</label>
                            <input type="password" class="form-control" id="newPasswordReset" required minlength="6">
                            <div class="form-text">Mínimo 6 caracteres</div>
                        </div>
                        <div class="mb-3">
                            <label for="confirmPasswordReset" class="form-label">Confirmar Nueva Contraseña *</label>
                            <input type="password" class="form-control" id="confirmPasswordReset" required>
                        </div>
                        
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="showPasswordReset">
                                <label class="form-check-label" for="showPasswordReset">
                                    Mostrar contraseñas
                                </label>
                            </div>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-warning" onclick="submitResetPassword(${patientId})">
                        <i class="fas fa-key me-2"></i>Resetear Contraseña
                    </button>
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Configurar mostrar/ocultar contraseñas
    const showPasswordCheckbox = document.getElementById('showPasswordReset');
    const newPasswordInput = document.getElementById('newPasswordReset');
    const confirmPasswordInput = document.getElementById('confirmPasswordReset');
    
    showPasswordCheckbox.addEventListener('change', function() {
        const type = this.checked ? 'text' : 'password';
        newPasswordInput.type = type;
        confirmPasswordInput.type = type;
    });
    
    // Limpiar modal cuando se cierre
    modal.addEventListener('hidden.bs.modal', function() {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    });
}

// Función para enviar el reseteo de contraseña
async function submitResetPassword(patientId) {
    const newPassword = document.getElementById('newPasswordReset').value;
    const confirmPassword = document.getElementById('confirmPasswordReset').value;
    
    // Validaciones
    if (!newPassword || !confirmPassword) {
        showAlert('Todos los campos son obligatorios', 'error');
        return;
    }
    
    if (newPassword !== confirmPassword) {
        showAlert('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showAlert('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    // Confirmación adicional
    if (!confirm('¿Está seguro de que desea resetear la contraseña del paciente? Esta acción no se puede deshacer.')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/usuarios/paciente/${patientId}/resetear-contrasena`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                nueva_contrasena: newPassword
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Contraseña reseteada exitosamente', 'success');
            
            // Mostrar información de la nueva contraseña
            const infoModal = document.createElement('div');
            infoModal.className = 'modal fade';
            infoModal.innerHTML = `
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header bg-success text-white">
                            <h5 class="modal-title">
                                <i class="fas fa-check-circle me-2"></i>Contraseña Actualizada
                            </h5>
                            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body">
                            <div class="alert alert-success">
                                <h6 class="alert-heading">¡Contraseña actualizada exitosamente!</h6>
                                <p class="mb-0">La contraseña del paciente <strong>${result.data.paciente_nombre}</strong> ha sido actualizada.</p>
                            </div>
                            
                            <div class="card">
                                <div class="card-header">
                                    <h6 class="mb-0">
                                        <i class="fas fa-info-circle me-2"></i>Información para el Paciente
                                    </h6>
                                </div>
                                <div class="card-body">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <strong>Usuario:</strong> <code>${result.data.usuario}</code>
                                        </div>
                                        <div class="col-md-6">
                                            <strong>Nueva Contraseña:</strong> <code>${newPassword}</code>
                                        </div>
                                    </div>
                                    <hr>
                                    <small class="text-muted">
                                        <i class="fas fa-exclamation-triangle me-1"></i>
                                        <strong>Importante:</strong> Comunica estas credenciales al paciente de forma segura. 
                                        Recomienda que cambie la contraseña en su primera sesión.
                                    </small>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-success" data-bs-dismiss="modal">
                                <i class="fas fa-check me-2"></i>Entendido
                            </button>
                        </div>
                    </div>
                </div>
            `;
            
            document.body.appendChild(infoModal);
            const bsInfoModal = new bootstrap.Modal(infoModal);
            bsInfoModal.show();
            
            // Cerrar modal de reseteo
            const resetModal = document.querySelector('.modal.show');
            if (resetModal) {
                const bsResetModal = bootstrap.Modal.getInstance(resetModal);
                bsResetModal.hide();
            }
            
            // Limpiar modal de información cuando se cierre
            infoModal.addEventListener('hidden.bs.modal', function() {
                if (document.body.contains(infoModal)) {
                    document.body.removeChild(infoModal);
                }
            });
            
        } else {
            showAlert(result.message || 'Error reseteando contraseña', 'error');
        }
        
    } catch (error) {
        console.error('Error reseteando contraseña:', error);
        showAlert('Error de conexión', 'error');
    }
}

// Función para limpiar usuario temporal
async function limpiarUsuarioTemporal(patientId) {
    if (!confirm('¿Está seguro de que desea limpiar el usuario temporal? El paciente seguirá funcionando normalmente pero aparecerá como "sin cuenta".')) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/usuarios/paciente/${patientId}/limpiar-temporal`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Usuario temporal limpiado exitosamente', 'success');
            // Recargar lista de pacientes
            loadPacientesContent();
        } else {
            showAlert(result.message || 'Error limpiando usuario temporal', 'error');
        }
        
    } catch (error) {
        console.error('Error limpiando usuario temporal:', error);
        showAlert('Error de conexión', 'error');
    }
}

// Función para enviar la creación de cuenta
async function submitCreateAccount(patientId) {
    const username = document.getElementById('newUsername').value.trim();
    const password = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    // Validaciones
    if (!username || !password || !confirmPassword) {
        showAlert('Todos los campos son obligatorios', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showAlert('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (password.length < 6) {
        showAlert('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/usuarios/paciente/${patientId}/crear-cuenta`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                usuario: username,
                contrasena: password
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('Cuenta creada exitosamente', 'success');
            // Cerrar modal
            const modal = document.querySelector('.modal.show');
            if (modal) {
                const bsModal = bootstrap.Modal.getInstance(modal);
                bsModal.hide();
            }
            // Recargar lista de pacientes
            loadPacientesContent();
        } else {
            showAlert(result.message || 'Error creando cuenta', 'error');
        }
        
    } catch (error) {
        console.error('Error creando cuenta:', error);
        showAlert('Error de conexión', 'error');
    }
}

// Función para mostrar alertas personalizadas
function showAlert(message, type = 'info') {
    // Crear el elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = `
        top: 20px;
        right: 20px;
        z-index: 9999;
        min-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    // Iconos para cada tipo de alerta
    const icons = {
        success: 'fas fa-check-circle',
        danger: 'fas fa-exclamation-circle', 
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    alertDiv.innerHTML = `
        <i class="${icons[type] || icons.info} me-2"></i>
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Agregar al body
    document.body.appendChild(alertDiv);
    
    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alertDiv && alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Función para cerrar sesión
async function logout() {
    try {
        // Mostrar modal de confirmación si existe
        const logoutModal = document.getElementById('logoutConfirmModal');
        if (logoutModal) {
            const modal = new bootstrap.Modal(logoutModal);
            modal.show();
            
            // Esperar confirmación del usuario
            return new Promise((resolve) => {
                const confirmBtn = document.getElementById('confirmLogoutBtn');
                const cancelBtn = document.getElementById('cancelLogoutBtn');
                
                const onConfirm = () => {
                    performLogout()
                    cleanup();
                    resolve();
                };
                
                const onCancel = () => {
                    modal.hide();
                    cleanup();
                    resolve();
                };
                
                const cleanup = () => {
                    confirmBtn?.removeEventListener('click', onConfirm);
                    cancelBtn?.removeEventListener('click', onCancel);
                };
                
                confirmBtn?.addEventListener('click', onConfirm);
                cancelBtn?.addEventListener('click', onCancel);
                
                // También cerrar modal si se hace click fuera o presiona ESC
                logoutModal.addEventListener('hidden.bs.modal', cleanup);
            });
        } else {
            // Confirmación simple si no hay modal
            if (confirm('¿Estás seguro de que quieres cerrar sesión?')) {
                performLogout();
            }
        }
    } catch (error) {
        console.error('Error durante logout:', error);
        showAlert('Error durante el logout', 'danger');
    }
}

// Función para enviar plan alimentario por email
async function enviarPlanPorEmail(planId, pacienteId) {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('No se encontró el token de autenticación', 'danger');
            return;
        }

        // Mostrar modal de confirmación
        const confirmarEnvio = confirm('¿Estás seguro de que quieres enviar este plan alimentario por email al paciente?');
        if (!confirmarEnvio) {
            return;
        }

        // Mostrar indicador de carga
        const boton = document.querySelector(`[data-plan-id="${planId}"].enviarEmailBtn`);
        if (boton) {
            boton.disabled = true;
            boton.innerHTML = '<i class="fas fa-spinner fa-spin me-1"></i>Enviando...';
        }

        const response = await fetch('/api/email/send-plan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                planId: planId,
                pacienteId: pacienteId
            })
        });

        const result = await response.json();

        if (result.success) {
            showAlert(`✅ Plan alimentario enviado exitosamente a ${result.data.pacienteEmail}`, 'success');
        } else {
            showAlert(`❌ Error enviando el plan: ${result.message}`, 'danger');
        }

    } catch (error) {
        console.error('Error enviando plan por email:', error);
        showAlert('❌ Error enviando el plan alimentario', 'danger');
    } finally {
        // Restaurar botón
        const boton = document.querySelector(`[data-plan-id="${planId}"].enviarEmailBtn`);
        if (boton) {
            boton.disabled = false;
            boton.innerHTML = '<i class="fas fa-envelope me-1"></i>Enviar Email';
        }
    }
}

// Función para mostrar alertas
function showAlert(message, type = 'info') {
    // Crear elemento de alerta
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed`;
    alertDiv.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    // Agregar al DOM
    document.body.appendChild(alertDiv);

    // Auto-remover después de 5 segundos
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
}

// Función que ejecuta el logout
async function performLogout() {
    try {
        // Limpiar token del localStorage
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        
        // Limpiar datos de sesión específicos
        delete window.pacientesData;
        delete window.currentPatient;
        
        // Mostrar mensaje de éxito
        showAlert('Sesión cerrada exitosamente', 'success');
        
        // Redirigir al login después de un breve delay
        setTimeout(() => {
            window.location.href = '/login';
        }, 1500);
        
    } catch (error) {
        console.error('Error al realizar logout:', error);
        showAlert('Error al cerrar sesión', 'danger');
    }
}

// ==================== FUNCIONES PARA VISTA DE TABLA DE PLANES ====================

// Variables globales para la tabla de planes
let todosLosPlanes = [];
let planesFiltrados = [];
let paginaActualPlanes = 1;
const elementosPorPaginaPlanes = 10;

// Función para alternar entre vista resumen y tabla
function toggleVistaPlanes(vista) {
    const vistaResumen = document.getElementById('vistaResumen');
    const vistaTabla = document.getElementById('vistaTabla');
    const btnResumen = document.getElementById('vistaResumenBtn');
    const btnTabla = document.getElementById('vistaTablaBtn');
    
    if (vista === 'tabla') {
        vistaResumen.style.display = 'none';
        vistaTabla.style.display = 'block';
        btnResumen.classList.remove('active');
        btnTabla.classList.add('active');
        
        // Cargar datos de la tabla si no están cargados
        if (todosLosPlanes.length === 0) {
            cargarTodosLosPlanes();
        } else {
            mostrarTablaPlanes();
        }
    } else {
        vistaResumen.style.display = 'block';
        vistaTabla.style.display = 'none';
        btnTabla.classList.remove('active');
        btnResumen.classList.add('active');
    }
}

// Función para cargar todos los planes
async function cargarTodosLosPlanes() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAlert('No se encontró el token de autenticación', 'danger');
            return;
        }

        // Obtener el ID del profesional del token
        const payload = JSON.parse(atob(token.split('.')[1]));
        const profesionalId = payload.profesional_id || payload.id;

        if (!profesionalId) {
            showAlert('No se pudo obtener el ID del profesional', 'danger');
            return;
        }

        const response = await fetch(`/api/plan-alimentacion/profesional/${profesionalId}/planes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.success) {
            todosLosPlanes = result.data || [];
            planesFiltrados = [...todosLosPlanes];
            mostrarTablaPlanes();
        } else {
            throw new Error(result.message || 'Error al cargar los planes');
        }

    } catch (error) {
        console.error('Error cargando todos los planes:', error);
        mostrarErrorTablaPlanes('Error al cargar los planes alimentarios');
    }
}

// Función para mostrar la tabla de planes
function mostrarTablaPlanes() {
    const tbody = document.getElementById('cuerpoTablaPlanes');
    if (!tbody) return;

    if (planesFiltrados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-utensils fa-3x text-muted mb-3"></i>
                    <h5 class="text-muted">No hay planes alimentarios</h5>
                    <p class="text-muted mb-0">No se encontraron planes que coincidan con los filtros aplicados.</p>
                </td>
            </tr>
        `;
        mostrarPaginacionPlanes();
        return;
    }

    // Calcular elementos para la página actual
    const inicio = (paginaActualPlanes - 1) * elementosPorPaginaPlanes;
    const fin = inicio + elementosPorPaginaPlanes;
    const planesPagina = planesFiltrados.slice(inicio, fin);

    tbody.innerHTML = planesPagina.map(plan => `
        <tr>
            <td>
                <div class="fw-medium">${plan.nombre || 'Sin nombre'}</div>
                <small class="text-muted">${plan.descripcion ? plan.descripcion.substring(0, 50) + '...' : 'Sin descripción'}</small>
            </td>
            <td>
                <span class="badge bg-${getTipoPlanColor(plan.tipo)}">${getTipoPlanTexto(plan.tipo)}</span>
            </td>
            <td>
                <div class="fw-medium">${plan.objetivo || 'Sin objetivo'}</div>
            </td>
            <td>
                <div class="fw-medium">${plan.calorias_diarias || 'N/A'}</div>
                <small class="text-muted">kcal/día</small>
            </td>
            <td>
                <span class="badge ${plan.activo ? 'bg-success' : 'bg-secondary'}">
                    ${plan.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="fw-medium">${formatearFecha(plan.fecha_inicio)}</div>
            </td>
            <td>
                <div class="fw-medium">${plan.fecha_fin ? formatearFecha(plan.fecha_fin) : 'Indefinido'}</div>
            </td>
        </tr>
    `).join('');

    mostrarPaginacionPlanes();
}

// Función para mostrar paginación
function mostrarPaginacionPlanes() {
    const paginacion = document.getElementById('paginacionPlanes');
    if (!paginacion) return;

    const totalPaginas = Math.ceil(planesFiltrados.length / elementosPorPaginaPlanes);
    
    if (totalPaginas <= 1) {
        paginacion.innerHTML = '';
        return;
    }

    let paginacionHTML = '';
    
    // Botón anterior
    paginacionHTML += `
        <li class="page-item ${paginaActualPlanes === 1 ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPaginaPlanes(${paginaActualPlanes - 1})">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;

    // Páginas
    const inicio = Math.max(1, paginaActualPlanes - 2);
    const fin = Math.min(totalPaginas, paginaActualPlanes + 2);

    for (let i = inicio; i <= fin; i++) {
        paginacionHTML += `
            <li class="page-item ${i === paginaActualPlanes ? 'active' : ''}">
                <a class="page-link" href="#" onclick="cambiarPaginaPlanes(${i})">${i}</a>
            </li>
        `;
    }

    // Botón siguiente
    paginacionHTML += `
        <li class="page-item ${paginaActualPlanes === totalPaginas ? 'disabled' : ''}">
            <a class="page-link" href="#" onclick="cambiarPaginaPlanes(${paginaActualPlanes + 1})">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `;

    paginacion.innerHTML = paginacionHTML;
}

// Función para cambiar página
function cambiarPaginaPlanes(nuevaPagina) {
    const totalPaginas = Math.ceil(planesFiltrados.length / elementosPorPaginaPlanes);
    
    if (nuevaPagina >= 1 && nuevaPagina <= totalPaginas) {
        paginaActualPlanes = nuevaPagina;
        mostrarTablaPlanes();
    }
}

// Función para filtrar planes
function filtrarPlanes() {
    const busqueda = document.getElementById('buscarPlanes').value.toLowerCase();
    const estado = document.getElementById('filtroEstadoPlanes').value;
    const tipo = document.getElementById('filtroTipoPlanes').value;

    planesFiltrados = todosLosPlanes.filter(plan => {
        const coincideBusqueda = !busqueda || 
            (plan.nombre && plan.nombre.toLowerCase().includes(busqueda)) ||
            (plan.objetivo && plan.objetivo.toLowerCase().includes(busqueda)) ||
            (plan.descripcion && plan.descripcion.toLowerCase().includes(busqueda));

        const coincideEstado = !estado || 
            (estado === 'activo' && plan.activo) ||
            (estado === 'inactivo' && !plan.activo);

        const coincideTipo = !tipo || plan.tipo === tipo;

        return coincideBusqueda && coincideEstado && coincideTipo;
    });

    paginaActualPlanes = 1;
    mostrarTablaPlanes();
}

// Función para limpiar filtros
function limpiarFiltrosPlanes() {
    document.getElementById('buscarPlanes').value = '';
    document.getElementById('filtroEstadoPlanes').value = '';
    document.getElementById('filtroTipoPlanes').value = '';
    
    planesFiltrados = [...todosLosPlanes];
    paginaActualPlanes = 1;
    mostrarTablaPlanes();
}

// Funciones auxiliares
function getTipoPlanColor(tipo) {
    switch (tipo) {
        case 'simple': return 'success';
        case 'intermedio': return 'warning';
        case 'avanzado': return 'danger';
        default: return 'secondary';
    }
}

function getTipoPlanTexto(tipo) {
    switch (tipo) {
        case 'simple': return 'Simple';
        case 'intermedio': return 'Intermedio';
        case 'avanzado': return 'Avanzado';
        default: return 'No definido';
    }
}

function formatearFecha(fecha) {
    if (!fecha) return 'N/A';
    return new Date(fecha).toLocaleDateString('es-ES');
}

function mostrarErrorTablaPlanes(mensaje) {
    const tbody = document.getElementById('cuerpoTablaPlanes');
    if (tbody) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="text-center py-4">
                    <i class="fas fa-exclamation-triangle fa-3x text-warning mb-3"></i>
                    <h5 class="text-warning">Error</h5>
                    <p class="text-muted mb-0">${mensaje}</p>
                </td>
            </tr>
        `;
    }
}

// Funciones para acciones de la tabla
function verDetallesPlan(planId) {
    // Implementar vista de detalles del plan
    showAlert('Función de ver detalles próximamente', 'info');
}

function editarComidasPlan(planId) {
    // Redirigir al editor de comidas
    window.location.href = `/plan-editor?id=${planId}`;
}

// ==================== EVENT LISTENERS PARA VISTA DE TABLA ====================

// Event listeners para los botones de vista
document.addEventListener('DOMContentLoaded', function() {
    // Botones de alternar vista
    const btnResumen = document.getElementById('vistaResumenBtn');
    const btnTabla = document.getElementById('vistaTablaBtn');
    
    if (btnResumen) {
        btnResumen.addEventListener('click', () => toggleVistaPlanes('resumen'));
    }
    
    if (btnTabla) {
        btnTabla.addEventListener('click', () => toggleVistaPlanes('tabla'));
    }

    // Filtros
    const buscarPlanes = document.getElementById('buscarPlanes');
    const filtroEstadoPlanes = document.getElementById('filtroEstadoPlanes');
    const filtroTipoPlanes = document.getElementById('filtroTipoPlanes');
    const limpiarFiltrosPlanes = document.getElementById('limpiarFiltrosPlanes');

    if (buscarPlanes) {
        buscarPlanes.addEventListener('input', filtrarPlanes);
    }
    
    if (filtroEstadoPlanes) {
        filtroEstadoPlanes.addEventListener('change', filtrarPlanes);
    }
    
    if (filtroTipoPlanes) {
        filtroTipoPlanes.addEventListener('change', filtrarPlanes);
    }
    
    if (limpiarFiltrosPlanes) {
        limpiarFiltrosPlanes.addEventListener('click', limpiarFiltrosPlanes);
    }
});

// Exportar funciones globalmente para acceso desde otros scripts
window.showSection = showSection;
window.logout = logout;
window.toggleVistaPlanes = toggleVistaPlanes;
window.cambiarPaginaPlanes = cambiarPaginaPlanes;
window.verDetallesPlan = verDetallesPlan;
window.editarComidasPlan = editarComidasPlan;

// ==================== GESTIÓN DE ASISTENCIA ====================

// Función simplificada para redirigir a la página de gestión de asistencia
function loadAsistenciaContent() {
    console.log('📋 Redirigiendo a gestión de asistencia...');
    window.location.href = '/asistencia';
}

// Funciones eliminadas - ahora se manejan en la página dedicada de asistencia

// Show asistencia help
// Función de ayuda simplificada
function showAsistenciaHelp() {
    alert('Para una experiencia completa de gestión de asistencia, utiliza la página dedicada que se abrirá al hacer clic en "Gestión de Asistencia".');
}

// Exportar funciones globales
window.showAsistenciaHelp = showAsistenciaHelp;

// ==================== FUNCIONES DE PAGINACIÓN ====================

// Generar botones de paginación
function generatePaginationButtons(paginationData = null) {
    // Usar parámetros de paginación si están disponibles, sino usar variables globales
    const pagination = paginationData || {
        currentPage: currentPage,
        totalPages: totalPages
    };
    
    let buttons = '';
    const maxVisiblePages = 5;
    let startPage = Math.max(1, pagination.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(pagination.totalPages, startPage + maxVisiblePages - 1);
    
    // Ajustar startPage si estamos cerca del final
    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }
    
    // Botón primera página si no está visible
    if (startPage > 1) {
        buttons += `
            <li class="page-item">
                <button class="page-link" onclick="changePage(1)">1</button>
            </li>
        `;
        if (startPage > 2) {
            buttons += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
    }
    
    // Botones de páginas visibles
    for (let i = startPage; i <= endPage; i++) {
        buttons += `
            <li class="page-item ${i === pagination.currentPage ? 'active' : ''}">
                <button class="page-link" onclick="changePage(${i})">${i}</button>
            </li>
        `;
    }
    
    // Botón última página si no está visible
    if (endPage < pagination.totalPages) {
        if (endPage < pagination.totalPages - 1) {
            buttons += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
        }
        buttons += `
            <li class="page-item">
                <button class="page-link" onclick="changePage(${pagination.totalPages})">${pagination.totalPages}</button>
            </li>
        `;
    }
    
    
    return buttons;
}

// Cambiar página
async function changePage(newPage) {
    if (newPage < 1 || newPage > totalPages || newPage === currentPage) {
        return;
    }
    
    currentPage = newPage;
    await loadPacientesContent();
}

// Exportar funciones de paginación
window.changePage = changePage;
window.generatePaginationButtons = generatePaginationButtons;

