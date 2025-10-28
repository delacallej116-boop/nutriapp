// Variables globales
let profesionalId = null;
let plansData = [];

// Initialize the page
function initPlans() {
    console.log('🚀 Inicializando página de gestión de planes...');
    
    // Check and preserve origin if coming from patient history
    checkAndPreserveOrigin();
    
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No hay token, redirigiendo a login');
        window.location.href = '/login';
        return;
    }
    
    // Obtener ID del profesional del token
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        profesionalId = payload.profesional_id || payload.id;
        console.log('👤 Professional ID:', profesionalId);
    } catch (error) {
        console.error('❌ Error decodificando token:', error);
        window.location.href = '/login';
        return;
    }
    
    // Cargar datos iniciales
    console.log('📊 Iniciando carga de datos...');
    loadPlans();
    
    // Configurar event listeners
    setupEventListeners();
}

document.addEventListener('DOMContentLoaded', initPlans);

// Check and preserve origin if coming from patient history
function checkAndPreserveOrigin() {
    const sessionOrigin = sessionStorage.getItem('planCreatorOrigin');
    const sessionPatientId = sessionStorage.getItem('currentPatientId');
    const localOrigin = localStorage.getItem('planCreatorOrigin');
    const localPatientId = localStorage.getItem('currentPatientId');
    
    // Use sessionStorage first, then localStorage as fallback
    const origin = sessionOrigin || localOrigin;
    const pacienteId = sessionPatientId || localPatientId;
    
    console.log('🔍 Plan management page - checking origin:', origin);
    console.log('🔍 Plan management page - patient ID:', pacienteId);
    
    if (origin === 'patient-history') {
        console.log('✅ Preserving origin from patient history');
        // Ensure both storages have the correct values
        sessionStorage.setItem('planCreatorOrigin', 'patient-history');
        sessionStorage.setItem('currentPatientId', pacienteId);
        localStorage.setItem('planCreatorOrigin', 'patient-history');
        localStorage.setItem('currentPatientId', pacienteId);
    } else {
        console.log('📝 Setting default origin to plan-management');
        sessionStorage.setItem('planCreatorOrigin', 'plan-management');
        localStorage.setItem('planCreatorOrigin', 'plan-management');
    }
}

// Setup event listeners
function setupEventListeners() {
    // Búsqueda por nombre (solo al hacer clic en buscar)
    const searchBtn = document.getElementById('searchBtn');
    if (searchBtn) {
        searchBtn.addEventListener('click', () => {
            renderPlans();
        });
    }
    
    // Búsqueda al presionar Enter
    const searchPlans = document.getElementById('searchPlans');
    if (searchPlans) {
        searchPlans.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                renderPlans();
            }
        });
    }
    
    // Botón limpiar búsqueda
    const clearSearchBtn = document.getElementById('clearSearchBtn');
    if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
            document.getElementById('searchPlans').value = '';
            renderPlans();
        });
    }
    
    // Filtro por tipo de plan
    const filterTipo = document.getElementById('filterTipo');
    if (filterTipo) {
        filterTipo.addEventListener('change', () => {
            renderPlans();
        });
    }
    
    // Botones de crear plan
    const crearPlanSimpleBtn = document.getElementById('crearPlanSimpleBtn');
    if (crearPlanSimpleBtn) {
        crearPlanSimpleBtn.addEventListener('click', () => {
            crearPlan('simple');
        });
    }
    
    const crearPlanIntermedioBtn = document.getElementById('crearPlanIntermedioBtn');
    if (crearPlanIntermedioBtn) {
        crearPlanIntermedioBtn.addEventListener('click', () => {
            crearPlan('intermedio');
        });
    }
}

// Load plans list
async function loadPlans() {
    try {
        const token = localStorage.getItem('token');
        console.log('🔍 Cargando planes para profesional:', profesionalId);
        
        const response = await fetch(`/api/plan-alimentacion/profesional/${profesionalId}/planes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📡 Respuesta planes:', response.status, response.statusText);
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('📋 Resultado planes:', result);
        
        plansData = result.data || [];
        
        console.log('✅ Planes cargados:', plansData.length);
        renderPlans();
    } catch (error) {
        console.error('❌ Error cargando planes:', error);
        displayPlansError();
    }
}

// Render plans list
function renderPlans() {
    console.log('🔄 Renderizando planes...');
    console.log('📊 Total de planes en memoria:', plansData.length);
    
    const filterTipo = document.getElementById('filterTipo').value;
    const searchTerm = document.getElementById('searchPlans').value.toLowerCase();
    const tableBody = document.getElementById('plansTableBody');
    const noResultsMessage = document.getElementById('noResultsMessage');
    
    if (!tableBody) {
        console.error('❌ No se encontró el tbody de la tabla');
        return;
    }
    
    // Filtrar planes
    let planesFiltrados = plansData;
    
    // Filtrar por tipo
    if (filterTipo) {
        planesFiltrados = planesFiltrados.filter(plan => plan.tipo === filterTipo);
    }
    
    // Filtrar por búsqueda
    if (searchTerm) {
        planesFiltrados = planesFiltrados.filter(plan => 
            (plan.nombre && plan.nombre.toLowerCase().includes(searchTerm)) ||
            (plan.paciente_nombre && plan.paciente_nombre.toLowerCase().includes(searchTerm)) ||
            (plan.objetivo && plan.objetivo.toLowerCase().includes(searchTerm))
        );
    }
    
    console.log('🔍 Planes filtrados:', planesFiltrados.length);
    
    // Mostrar/ocultar mensaje de no resultados
    if (planesFiltrados.length === 0) {
        tableBody.innerHTML = '';
        noResultsMessage.style.display = 'block';
        return;
    } else {
        noResultsMessage.style.display = 'none';
    }
    
    console.log('🎨 Generando HTML para tabla...');
    tableBody.innerHTML = planesFiltrados.map(plan => `
        <tr>
            <td>
                <div class="plan-name">
                    <strong>${plan.nombre || 'Plan sin nombre'}</strong>
                    ${plan.descripcion ? `<small class="text-muted d-block">${plan.descripcion.substring(0, 50)}${plan.descripcion.length > 50 ? '...' : ''}</small>` : ''}
                </div>
            </td>
            <td>
                <span class="plan-type-badge ${plan.tipo}">${getTipoText(plan.tipo)}</span>
            </td>
            <td>
                <div class="patient-info">
                    ${plan.paciente_nombre || '<span class="text-muted">Sin asignar</span>'}
                </div>
            </td>
            <td>
                <div class="date-info">
                    ${formatDate(plan.fecha_inicio)}
                    <small class="text-muted d-block">Creado: ${formatDate(plan.fecha_creacion)}</small>
                </div>
            </td>
            <td>
                <span class="plan-status-badge ${plan.activo ? 'active' : 'inactive'}">
                    ${plan.activo ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td>
                <div class="action-buttons d-flex gap-2">
                    <button class="btn btn-outline-primary btn-sm view-plan-btn" data-plan-id="${plan.id}" title="Ver detalles">
                        <i class="fas fa-eye"></i>
                    </button>
                    <button class="btn btn-outline-success btn-sm edit-plan-btn" data-plan-id="${plan.id}" title="Editar">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-${plan.activo ? 'warning' : 'success'} btn-sm toggle-plan-btn" data-plan-id="${plan.id}" data-current-status="${plan.activo}" title="${plan.activo ? 'Desactivar Plan' : 'Activar Plan'}">
                        <i class="fas fa-${plan.activo ? 'pause' : 'play'} me-1"></i>
                        ${plan.activo ? 'Desactivar' : 'Activar'}
                    </button>
                    <button class="btn btn-outline-danger btn-sm delete-plan-btn" data-plan-id="${plan.id}" title="Eliminar Plan">
                        <i class="fas fa-trash me-1"></i>
                        Eliminar
                    </button>
                    <button class="btn btn-outline-info btn-sm send-email-btn" data-plan-id="${plan.id}" data-plan-name="${plan.nombre}" title="Enviar por Email">
                        <i class="fas fa-envelope me-1"></i>
                        Email
                    </button>
                </div>
            </td>
        </tr>
    `).join('');
    
    // Agregar event listeners a los botones dinámicos
    agregarEventListenersPlanes();
    
    console.log('✅ Tabla generada y aplicada');
}

// Display plans error
function displayPlansError() {
    const tableBody = document.getElementById('plansTableBody');
    const noResultsMessage = document.getElementById('noResultsMessage');
    
    if (tableBody) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
                    <h5 class="text-warning">Error al cargar planes</h5>
                    <p class="text-muted">No se pudieron cargar los planes alimentarios. Intenta recargar la página.</p>
                    <button class="btn btn-outline-primary" onclick="location.reload()">
                        <i class="fas fa-refresh me-2"></i>Recargar página
                    </button>
                </td>
            </tr>
        `;
    }
    
    if (noResultsMessage) {
        noResultsMessage.style.display = 'none';
    }
}

// Agregar event listeners a los botones de planes
function agregarEventListenersPlanes() {
    // Botón ver detalles
    document.querySelectorAll('.view-plan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const planId = e.target.closest('.view-plan-btn').getAttribute('data-plan-id');
            viewPlan(planId);
        });
    });
    
    // Botón editar plan
    document.querySelectorAll('.edit-plan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const planId = e.target.closest('.edit-plan-btn').getAttribute('data-plan-id');
            editPlan(planId);
        });
    });
    
    // Botón toggle plan
    document.querySelectorAll('.toggle-plan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const planId = e.target.closest('.toggle-plan-btn').getAttribute('data-plan-id');
            const currentStatus = e.target.closest('.toggle-plan-btn').getAttribute('data-current-status') === 'true';
            togglePlan(planId, currentStatus);
        });
    });
    
    // Botón eliminar plan
    document.querySelectorAll('.delete-plan-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const planId = e.target.closest('.delete-plan-btn').getAttribute('data-plan-id');
            deletePlan(planId);
        });
    });
    
    // Botón enviar email
    document.querySelectorAll('.send-email-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const planId = e.target.closest('.send-email-btn').getAttribute('data-plan-id');
            const planName = e.target.closest('.send-email-btn').getAttribute('data-plan-name');
            showEmailModal(planId, planName);
        });
    });
}

// Crear nuevo plan
function crearPlan(tipo) {
    console.log('🆕 Creando plan tipo:', tipo);
    
    // Get origin and patient ID from localStorage
    const origin = localStorage.getItem('planCreatorOrigin');
    const pacienteId = localStorage.getItem('currentPatientId');
    
    // Only set origin to 'plan-management' if it's not already set from patient history
    if (!origin) {
        localStorage.setItem('planCreatorOrigin', 'plan-management');
    }
    
    // Build URL with parameters
    let url = `/plan-creator?tipo=${tipo}`;
    
    // Add patient ID if coming from patient history
    if (origin === 'patient-history' && pacienteId) {
        url += `&pacienteId=${pacienteId}`;
    }
    
    // Redirigir a la página de creación del plan
    window.location.href = url;
}

// Plan actions
async function viewPlan(planId) {
    try {
        console.log('🔍 Obteniendo detalles del plan:', planId);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/plan-alimentacion/plan/${planId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener el plan');
        }
        
        const result = await response.json();
        const plan = result.data;
        
        // Mostrar modal de detalles
        mostrarModalDetallesPlan(plan);
        
    } catch (error) {
        console.error('Error obteniendo plan:', error);
        showAlert('Error al obtener los detalles del plan', 'danger');
    }
}

async function editPlan(planId) {
    try {
        console.log('✏️ Obteniendo datos del plan para editar:', planId);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/plan-alimentacion/plan/${planId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener el plan');
        }
        
        const result = await response.json();
        const plan = result.data;
        
        // Redirigir a la página de edición
        window.location.href = `/plan-creator?tipo=${plan.tipo}&editar=${planId}`;
        
    } catch (error) {
        console.error('Error obteniendo plan para editar:', error);
        showAlert('Error al obtener los datos del plan', 'danger');
    }
}

async function togglePlan(planId, currentStatus) {
    try {
        const newStatus = !currentStatus;
        const action = newStatus ? 'activar' : 'desactivar';
        
        // Confirmar acción
        if (!confirm(`¿Estás seguro de que quieres ${action} este plan?`)) {
            return;
        }
        
        console.log(`🔄 ${action} plan:`, planId, 'Nuevo estado:', newStatus);
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/plan-alimentacion/plan/${planId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ activo: newStatus })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al actualizar el plan');
        }
        
        showAlert(`Plan ${newStatus ? 'activado' : 'desactivado'} exitosamente`, 'success');
        
        // Recargar datos
        await loadPlans();
        
    } catch (error) {
        console.error('Error toggle plan:', error);
        showAlert('Error al actualizar el plan: ' + error.message, 'danger');
    }
}

// Mostrar modal de confirmación para eliminar plan
function showDeleteModal(planId, planName) {
    // Crear modal dinámicamente si no existe
    let modal = document.getElementById('modalEliminarPlan');
    if (!modal) {
        const modalHTML = `
            <div class="modal fade" id="modalEliminarPlan" tabindex="-1">
                <div class="modal-dialog">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-exclamation-triangle me-2 text-danger"></i>Confirmar Eliminación
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="deleteModalContent">
                            <!-- Contenido dinámico -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-danger" id="confirmDeleteBtn">
                                <i class="fas fa-trash me-2"></i>Eliminar Plan
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('modalEliminarPlan');
    }
    
    // Llenar contenido del modal
    const content = document.getElementById('deleteModalContent');
    content.innerHTML = `
        <div class="alert alert-danger" role="alert">
            <h6 class="alert-heading">
                <i class="fas fa-exclamation-triangle me-2"></i>¡Atención!
            </h6>
            <p class="mb-0">Estás a punto de eliminar el plan: <strong>"${planName}"</strong></p>
        </div>
        
        <div class="mb-3">
            <h6 class="text-danger">⚠️ Esta acción es IRREVERSIBLE y eliminará:</h6>
            <ul class="list-unstyled ms-3">
                <li><i class="fas fa-check text-danger me-2"></i>El plan alimentario completo</li>
                <li><i class="fas fa-check text-danger me-2"></i>Todas las comidas asociadas</li>
                <li><i class="fas fa-check text-danger me-2"></i>El historial del plan</li>
                <li><i class="fas fa-check text-danger me-2"></i>Todas las asignaciones a pacientes</li>
            </ul>
        </div>
        
        <div class="text-center">
            <div class="alert alert-warning">
                <i class="fas fa-info-circle me-2"></i>
                <strong>Presiona el botón "Eliminar Plan" para confirmar la eliminación</strong>
            </div>
        </div>
    `;
    
    // Configurar event listeners del modal
    setupDeleteModalListeners(planId);
    
    // Mostrar modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Configurar event listeners del modal de eliminación
function setupDeleteModalListeners(planId) {
    // Esperar un momento para que el DOM se actualice
    setTimeout(() => {
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        
        console.log('🔧 Configurando listeners del modal de eliminación:', {
            confirmBtn: !!confirmBtn,
            planId: planId
        });
        
        // Variable para controlar el estado de confirmación
        let isFirstClick = true;
        
        // Botón confirmar eliminación con doble confirmación
        if (confirmBtn) {
            confirmBtn.addEventListener('click', () => {
                if (isFirstClick) {
                    // Primera vez: cambiar el texto y estilo del botón
                    isFirstClick = false;
                    confirmBtn.innerHTML = '<i class="fas fa-exclamation-triangle me-2"></i>¿Estás seguro? Presiona nuevamente';
                    confirmBtn.classList.remove('btn-danger');
                    confirmBtn.classList.add('btn-warning');
                    
                    console.log('🔄 Primera confirmación - cambiando botón');
                    
                    // Resetear después de 3 segundos si no se presiona nuevamente
                    setTimeout(() => {
                        if (!isFirstClick) {
                            isFirstClick = true;
                            confirmBtn.innerHTML = '<i class="fas fa-trash me-2"></i>Eliminar Plan';
                            confirmBtn.classList.remove('btn-warning');
                            confirmBtn.classList.add('btn-danger');
                            console.log('⏰ Reset del botón por timeout');
                        }
                    }, 3000);
                } else {
                    // Segunda vez: proceder con la eliminación
                    console.log('✅ Segunda confirmación - eliminando plan');
                    confirmDeletePlan(planId);
                }
            });
        }
    }, 100);
}

// Confirmar eliminación del plan
async function confirmDeletePlan(planId) {
    try {
        console.log('🗑️ Eliminando plan:', planId);
        
        // Mostrar loading en el botón
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        const originalText = confirmBtn.innerHTML;
        confirmBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Eliminando...';
        confirmBtn.disabled = true;
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/plan-alimentacion/plan/${planId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al eliminar el plan');
        }
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEliminarPlan'));
        modal.hide();
        
        showAlert('Plan eliminado exitosamente', 'success');
        
        // Recargar datos
        await loadPlans();
        
    } catch (error) {
        console.error('Error delete plan:', error);
        showAlert('Error al eliminar el plan: ' + error.message, 'danger');
        
        // Restaurar botón
        const confirmBtn = document.getElementById('confirmDeleteBtn');
        confirmBtn.innerHTML = originalText;
        confirmBtn.disabled = false;
    }
}


// Eliminar plan (función principal - ahora solo muestra el modal)
async function deletePlan(planId) {
    // Obtener nombre del plan para mostrar en el modal
    const plan = plansData.find(p => p.id == planId);
    const planName = plan ? plan.nombre : 'Plan';
    
    showDeleteModal(planId, planName);
}

// Mostrar modal para enviar email
async function showEmailModal(planId, planName) {
    try {
        // Obtener lista de todos los pacientes del profesional
        const todosLosPacientes = await getTodosLosPacientes();
        
        // Crear modal dinámicamente si no existe
        let modal = document.getElementById('modalEnviarEmail');
        if (!modal) {
            const modalHTML = `
                <div class="modal fade" id="modalEnviarEmail" tabindex="-1">
                    <div class="modal-dialog modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title">
                                    <i class="fas fa-envelope me-2"></i>Enviar Plan por Email
                                </h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                            </div>
                            <div class="modal-body" id="emailModalContent">
                                <!-- Contenido dinámico -->
                            </div>
                            <div class="modal-footer">
                                <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                                <button type="button" class="btn btn-primary" id="enviarEmailBtn">
                                    <i class="fas fa-paper-plane me-2"></i>Enviar Email
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.insertAdjacentHTML('beforeend', modalHTML);
            modal = document.getElementById('modalEnviarEmail');
        }
        
        // Llenar contenido del modal
        const content = document.getElementById('emailModalContent');
        content.innerHTML = `
            <div class="mb-3">
                <h6><i class="fas fa-file-alt me-2"></i>Plan: <strong>${planName}</strong></h6>
            </div>
            
            <div class="mb-4">
                <h6><i class="fas fa-users me-2"></i>Seleccionar Destinatario</h6>
                <div class="row">
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Buscar Paciente</h6>
                            </div>
                            <div class="card-body">
                                <div class="input-group mb-3">
                                    <input type="text" class="form-control" id="searchPaciente" placeholder="Buscar por nombre o email...">
                                    <button class="btn btn-outline-secondary" type="button" id="searchPacienteBtn">
                                        <i class="fas fa-search"></i>
                                    </button>
                                    <button class="btn btn-outline-secondary" type="button" id="clearSearchBtn" title="Limpiar búsqueda">
                                        <i class="fas fa-times"></i>
                                    </button>
                                </div>
                                <div class="pacientes-list" style="max-height: 200px; overflow-y: auto;">
                                    <div id="pacientesList">
                                        <!-- Lista de pacientes -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="col-md-6">
                        <div class="card">
                            <div class="card-header">
                                <h6 class="mb-0">Email Personalizado</h6>
                            </div>
                            <div class="card-body">
                                <div class="form-check mb-3">
                                    <input class="form-check-input" type="radio" name="emailOption" id="emailCustom" value="custom">
                                    <label class="form-check-label" for="emailCustom">
                                        Escribir email personalizado
                                    </label>
                                </div>
                                <input type="email" class="form-control" id="customEmail" placeholder="ejemplo@correo.com" disabled>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="mb-3">
                <label for="emailSubject" class="form-label">Asunto del Email</label>
                <input type="text" class="form-control" id="emailSubject" value="Plan Alimentario - ${planName}">
            </div>
            
            <div class="mb-3">
                <label for="emailMessage" class="form-label">Mensaje Adicional (Opcional)</label>
                <textarea class="form-control" id="emailMessage" rows="3" placeholder="Escribe un mensaje personalizado..."></textarea>
            </div>
            
            <div id="emailValidationAlert" class="alert alert-warning" style="display: none;">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <span id="emailValidationMessage"></span>
            </div>
        `;
        
        // Llenar lista de pacientes
        window.todosLosPacientes = todosLosPacientes; // Almacenar globalmente para la búsqueda
        renderPacientesList(todosLosPacientes);
        
        // Configurar event listeners del modal
        setupEmailModalListeners(planId);
        
        // Mostrar modal
        const bsModal = new bootstrap.Modal(modal);
        bsModal.show();
        
    } catch (error) {
        console.error('Error mostrando modal de email:', error);
        showAlert('Error al cargar el modal de email', 'danger');
    }
}

// Configurar event listeners del modal de email
function setupEmailModalListeners(planId) {
    // Radio buttons para seleccionar opción
    document.querySelectorAll('input[name="emailOption"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const customEmailInput = document.getElementById('customEmail');
            if (this.value === 'custom') {
                customEmailInput.disabled = false;
                customEmailInput.focus();
            } else {
                customEmailInput.disabled = true;
                customEmailInput.value = '';
            }
        });
    });
    
    // Búsqueda de pacientes
    const searchInput = document.getElementById('searchPaciente');
    const searchBtn = document.getElementById('searchPacienteBtn');
    const clearBtn = document.getElementById('clearSearchBtn');
    
    if (searchInput) {
        // Búsqueda al presionar Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                searchPacientes();
            }
        });
        
        // Búsqueda al escribir (con debounce)
        let searchTimeout;
        searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                searchPacientes();
            }, 300);
        });
    }
    
    if (searchBtn) {
        searchBtn.addEventListener('click', searchPacientes);
    }
    
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            document.getElementById('searchPaciente').value = '';
            searchPacientes();
        });
    }
    
    // Botón enviar email
    const enviarBtn = document.getElementById('enviarEmailBtn');
    if (enviarBtn) {
        enviarBtn.addEventListener('click', () => {
            enviarPlanPorEmail(planId);
        });
    }
}

// Obtener todos los pacientes del profesional
async function getTodosLosPacientes() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/plan-alimentacion/profesional/${profesionalId}/pacientes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener pacientes');
        }
        
        const result = await response.json();
        return result.data || [];
        
    } catch (error) {
        console.error('Error obteniendo pacientes:', error);
        return [];
    }
}

// Renderizar lista de pacientes
function renderPacientesList(pacientes, searchTerm = '') {
    const pacientesList = document.getElementById('pacientesList');
    if (!pacientesList) return;
    
    let pacientesFiltrados = pacientes;
    
    // Filtrar por término de búsqueda
    if (searchTerm) {
        const term = searchTerm.toLowerCase();
        pacientesFiltrados = pacientes.filter(paciente => 
            (paciente.apellido_nombre && paciente.apellido_nombre.toLowerCase().includes(term)) ||
            (paciente.email && paciente.email.toLowerCase().includes(term))
        );
    }
    
    if (pacientesFiltrados.length === 0) {
        pacientesList.innerHTML = `
            <div class="text-center text-muted py-3">
                <i class="fas fa-search fa-2x mb-2"></i>
                <p class="mb-0">${searchTerm ? 'No se encontraron pacientes' : 'No hay pacientes registrados'}</p>
            </div>
        `;
        return;
    }
    
    pacientesList.innerHTML = pacientesFiltrados.map(paciente => {
        const hasEmail = paciente.email && paciente.email.trim() !== '';
        const emailStatus = hasEmail ? 
            `<small class="text-success"><i class="fas fa-check-circle me-1"></i>Email disponible</small>` :
            `<small class="text-warning"><i class="fas fa-exclamation-triangle me-1"></i>Sin email</small>`;
        
        return `
            <div class="form-check mb-2 ${!hasEmail ? 'opacity-50' : ''}">
                <input class="form-check-input" type="radio" name="emailOption" id="paciente_${paciente.id}" 
                       value="${paciente.id}" data-email="${paciente.email || ''}" 
                       ${!hasEmail ? 'disabled' : ''}>
                <label class="form-check-label" for="paciente_${paciente.id}">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <strong>${paciente.apellido_nombre}</strong>
                            <br><small class="text-muted">${paciente.email || 'Sin email registrado'}</small>
                        </div>
                        <div class="text-end">
                            ${emailStatus}
                        </div>
                    </div>
                </label>
            </div>
        `;
    }).join('');
}

// Buscar pacientes
function searchPacientes() {
    const searchTerm = document.getElementById('searchPaciente').value;
    const todosLosPacientes = window.todosLosPacientes || [];
    renderPacientesList(todosLosPacientes, searchTerm);
}

// Obtener pacientes asignados al plan
async function getPacientesAsignados(planId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/plan-alimentacion/plan/${planId}/pacientes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al obtener pacientes asignados');
        }
        
        const result = await response.json();
        return result.data || [];
        
    } catch (error) {
        console.error('Error obteniendo pacientes asignados:', error);
        return [];
    }
}

// Enviar plan por email
async function enviarPlanPorEmail(planId) {
    try {
        const selectedOption = document.querySelector('input[name="emailOption"]:checked');
        if (!selectedOption) {
            showAlert('Por favor selecciona un destinatario', 'warning');
            return;
        }
        
        let emailDestino = '';
        let pacienteId = null;
        let pacienteNombre = '';
        
        if (selectedOption.value === 'custom') {
            emailDestino = document.getElementById('customEmail').value;
            pacienteNombre = 'Destinatario';
            if (!emailDestino) {
                showAlert('Por favor ingresa un email válido', 'warning');
                return;
            }
        } else {
            pacienteId = selectedOption.value;
            emailDestino = selectedOption.getAttribute('data-email');
            
            // Verificar si el paciente tiene email
            if (!emailDestino || emailDestino.trim() === '') {
                showEmailValidationAlert('Este paciente no tiene un email registrado. Por favor usa la opción "Email Personalizado" para enviar a otro correo.');
                return;
            }
            
            // Obtener nombre del paciente
            const todosLosPacientes = window.todosLosPacientes || [];
            const paciente = todosLosPacientes.find(p => p.id == pacienteId);
            pacienteNombre = paciente ? paciente.apellido_nombre : 'Paciente';
        }
        
        const subject = document.getElementById('emailSubject').value;
        const message = document.getElementById('emailMessage').value;
        
        // Ocultar alerta de validación si existe
        hideEmailValidationAlert();
        
        // Mostrar loading en el botón
        const enviarBtn = document.getElementById('enviarEmailBtn');
        const originalText = enviarBtn.innerHTML;
        enviarBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Enviando...';
        enviarBtn.disabled = true;
        
        const token = localStorage.getItem('token');
        const response = await fetch('/api/email/send-plan', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                planId: planId,
                pacienteId: pacienteId,
                emailDestino: emailDestino,
                subject: subject,
                message: message
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al enviar el email');
        }
        
        const result = await response.json();
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalEnviarEmail'));
        modal.hide();
        
        showAlert(`Plan enviado exitosamente a ${pacienteNombre} (${emailDestino})`, 'success');
        
    } catch (error) {
        console.error('Error enviando email:', error);
        showAlert('Error al enviar el email: ' + error.message, 'danger');
        
        // Restaurar botón
        const enviarBtn = document.getElementById('enviarEmailBtn');
        enviarBtn.innerHTML = originalText;
        enviarBtn.disabled = false;
    }
}

// Mostrar alerta de validación de email
function showEmailValidationAlert(message) {
    const alert = document.getElementById('emailValidationAlert');
    const messageSpan = document.getElementById('emailValidationMessage');
    if (alert && messageSpan) {
        messageSpan.textContent = message;
        alert.style.display = 'block';
    }
}

// Ocultar alerta de validación de email
function hideEmailValidationAlert() {
    const alert = document.getElementById('emailValidationAlert');
    if (alert) {
        alert.style.display = 'none';
    }
}

// Mostrar modal de detalles del plan
function mostrarModalDetallesPlan(plan) {
    // Crear modal dinámicamente si no existe
    let modal = document.getElementById('modalDetallesPlan');
    if (!modal) {
        const modalHTML = `
            <div class="modal fade" id="modalDetallesPlan" tabindex="-1">
                <div class="modal-dialog modal-lg">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h5 class="modal-title">
                                <i class="fas fa-eye me-2"></i>Detalles del Plan
                            </h5>
                            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div class="modal-body" id="detallesPlanContent">
                            <!-- Contenido dinámico -->
                        </div>
                        <div class="modal-footer">
                            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                            <button type="button" class="btn btn-warning edit-from-details-btn" data-plan-id="${plan.id}">
                                <i class="fas fa-edit me-2"></i>Editar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modalHTML);
        modal = document.getElementById('modalDetallesPlan');
    }
    
    // Llenar contenido
    const content = document.getElementById('detallesPlanContent');
    content.innerHTML = `
        <div class="row">
            <div class="col-md-6">
                <h6><i class="fas fa-user me-2"></i>Paciente</h6>
                <p class="text-muted">${plan.paciente_nombre || 'Plan sin asignar'}</p>
                
                <h6><i class="fas fa-tag me-2"></i>Tipo de Plan</h6>
                <p class="text-muted">${getTipoText(plan.tipo)}</p>
                
                <h6><i class="fas fa-target me-2"></i>Objetivo</h6>
                <p class="text-muted">${plan.objetivo || 'No especificado'}</p>
            </div>
            <div class="col-md-6">
                <h6><i class="fas fa-calendar me-2"></i>Fecha de Creación</h6>
                <p class="text-muted">${formatDate(plan.fecha_creacion)}</p>
                
                <h6><i class="fas fa-fire me-2"></i>Calorías Diarias</h6>
                <p class="text-muted">${plan.calorias_diarias || 'No especificado'}</p>
                
                <h6><i class="fas fa-info-circle me-2"></i>Estado</h6>
                <span class="badge ${plan.activo ? 'bg-success' : 'bg-secondary'}">
                    ${plan.activo ? 'Activo' : 'Inactivo'}
                </span>
            </div>
        </div>
        
        ${plan.descripcion ? `
            <div class="mt-3">
                <h6><i class="fas fa-align-left me-2"></i>Descripción</h6>
                <p class="text-muted">${plan.descripcion}</p>
            </div>
        ` : ''}
    `;
    
    // Agregar event listener al botón de editar
    const editBtn = modal.querySelector('.edit-from-details-btn');
    if (editBtn) {
        editBtn.addEventListener('click', () => {
            const planId = editBtn.getAttribute('data-plan-id');
            const modalDetalles = bootstrap.Modal.getInstance(modal);
            modalDetalles.hide();
            editPlan(planId);
        });
    }
    
    // Mostrar modal
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
}

// Helper functions
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES');
}

function getTipoText(tipo) {
    const tipos = {
        'simple': 'Plan Simple',
        'intermedio': 'Plan Intermedio'
    };
    return tipos[tipo] || tipo;
}

function getTipoIcon(tipo) {
    const iconos = {
        'simple': 'file-text',
        'intermedio': 'calculator'
    };
    return iconos[tipo] || 'utensils';
}

function getTipoBadgeClass(tipo) {
    const clases = {
        'simple': 'bg-primary',
        'intermedio': 'bg-warning'
    };
    return clases[tipo] || 'bg-secondary';
}

// Show alert function
function showAlert(message, type = 'info') {
    const alertId = 'alert-' + Date.now();
    const alertHtml = `
        <div id="${alertId}" class="alert alert-${type} alert-dismissible fade show position-fixed" 
             style="top: 20px; right: 20px; z-index: 9999; max-width: 400px;">
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'danger' ? 'exclamation-triangle' : type === 'warning' ? 'exclamation-triangle' : 'info-circle'} me-2"></i>
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        </div>
    `;
    
    document.body.insertAdjacentHTML('beforeend', alertHtml);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        const alert = document.getElementById(alertId);
        if (alert) {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }
    }, 5000);
}
