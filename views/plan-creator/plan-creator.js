// Variables globales
let profesionalId = null;
let planTipo = null;
let planId = null;
let isEditing = false;
let currentDay = 'Lunes';
let currentMealType = null;
let planData = {};
let pacientesData = [];
let savedMeals = {}; // Almacenar comidas guardadas por día y tipo

// Initialize the page
async function initPlanCreator() {
    console.log('🚀 Inicializando creador de planes...');
    
    // Verificar autenticación
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('❌ No hay token, redirigiendo a login');
        window.location.href = '/login';
        return;
    }
    
    // Obtener parámetros de la URL
    const urlParams = new URLSearchParams(window.location.search);
    planTipo = urlParams.get('tipo');
    planId = urlParams.get('editar');
    isEditing = !!planId;
    
    // Obtener ID del profesional del token
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        profesionalId = payload.profesional_id || payload.id;
        console.log('👤 Professional ID:', profesionalId);
        console.log('📋 Plan Tipo:', planTipo);
        console.log('✏️ Editando:', isEditing, planId);
    } catch (error) {
        console.error('❌ Error decodificando token:', error);
        window.location.href = '/login';
        return;
    }
    
    // Validar tipo de plan
    if (!planTipo || !['simple', 'intermedio'].includes(planTipo)) {
        console.error('❌ Tipo de plan inválido:', planTipo);
        showAlert('Tipo de plan inválido', 'danger');
        setTimeout(() => {
            window.location.href = '/plan-alimentario';
        }, 2000);
        return;
    }
    
    // Configurar página
    setupPage();
    
    // Setup back button based on origin
    setupBackButton();
    
    // Cargar datos iniciales
    await loadInitialData();
    
    // Configurar event listeners
    setupEventListeners();
}

document.addEventListener('DOMContentLoaded', initPlanCreator);


// Setup back button based on origin
function setupBackButton() {
    const backBtn = document.getElementById('backBtn');
    if (!backBtn) {
        return;
    }
    
    // Get origin from both storages
    const sessionOrigin = sessionStorage.getItem('planCreatorOrigin');
    const sessionPatientId = sessionStorage.getItem('currentPatientId');
    const localOrigin = localStorage.getItem('planCreatorOrigin');
    const localPatientId = localStorage.getItem('currentPatientId');

    // Use sessionStorage first, then localStorage as fallback
    const origin = sessionOrigin || localOrigin;
    const pacienteId = sessionPatientId || localPatientId;
    
    // Set up click handler
    backBtn.addEventListener('click', function(e) {
        e.preventDefault();
        
        // Re-check both storages at click time
        const currentSessionOrigin = sessionStorage.getItem('planCreatorOrigin');
        const currentSessionPatientId = sessionStorage.getItem('currentPatientId');
        const currentLocalOrigin = localStorage.getItem('planCreatorOrigin');
        const currentLocalPatientId = localStorage.getItem('currentPatientId');

        const currentOrigin = currentSessionOrigin || currentLocalOrigin;
        const currentPatientId = currentSessionPatientId || currentLocalPatientId;
        
        if (currentOrigin === 'patient-history') {
            // Return to patient history nutrition section
            if (currentPatientId) {
                // Clear both storages after setting the redirect
                sessionStorage.removeItem('planCreatorOrigin');
                sessionStorage.removeItem('currentPatientId');
                localStorage.removeItem('planCreatorOrigin');
                localStorage.removeItem('currentPatientId');
                
                // Use a more direct URL without hash fragment
                const redirectUrl = `/patient-history?patientId=${currentPatientId}`;
                window.location.href = redirectUrl;
            } else {
                // Fallback to dashboard
                sessionStorage.removeItem('planCreatorOrigin');
                sessionStorage.removeItem('currentPatientId');
                localStorage.removeItem('planCreatorOrigin');
                localStorage.removeItem('currentPatientId');
                window.location.href = '/dashboard/professional';
            }
        } else {
            // Default: return to plan management
            sessionStorage.removeItem('planCreatorOrigin');
            sessionStorage.removeItem('currentPatientId');
            localStorage.removeItem('planCreatorOrigin');
            localStorage.removeItem('currentPatientId');
            window.location.href = '/plan-alimentario';
        }
    });
    
    // Update button title based on origin
    if (origin === 'patient-history') {
        backBtn.title = 'Volver a Historia Clínica';
    } else {
        backBtn.title = 'Volver a Gestión de Planes';
    }
}

// Setup page based on plan type
function setupPage() {
    const pageTitle = document.getElementById('pageTitle');
    const pageSubtitle = document.getElementById('pageSubtitle');
    
    const tipoText = {
        'simple': 'Plan Simple',
        'intermedio': 'Plan Intermedio'
    };
    
    const tipoDesc = {
        'simple': 'Configuración básica con campos de texto libre',
        'intermedio': 'Incluye información nutricional básica'
    };
    
    pageTitle.textContent = `${isEditing ? 'Editar' : 'Crear'} ${tipoText[planTipo]}`;
    pageSubtitle.textContent = tipoDesc[planTipo];
    
    // Agregar indicador de tipo
    const tipoIndicator = document.createElement('span');
    tipoIndicator.className = `plan-type-indicator plan-type-${planTipo}`;
    tipoIndicator.textContent = tipoText[planTipo];
    pageTitle.appendChild(tipoIndicator);
    
    // Cargar contenido específico del tipo de plan
    loadPlanTypeContent();
}

// Load plan type specific content
function loadPlanTypeContent() {
    const planContent = document.getElementById('planContent');
    
    switch (planTipo) {
        case 'simple':
            loadPlanSimpleContent();
            break;
        case 'intermedio':
            loadPlanIntermedioContent();
            break;
    }
}

// Load Plan Simple content
function loadPlanSimpleContent() {
    const planContent = document.getElementById('planContent');
    
    planContent.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="card-title mb-0">
                    <i class="fas fa-calendar-week me-2"></i>Configuración de Comidas por Día
                </h5>
            </div>
            <div class="card-body">
                <!-- Day Selector -->
                <div class="day-selector">
                    <button class="day-btn active" data-day="Lunes">Lunes</button>
                    <button class="day-btn" data-day="Martes">Martes</button>
                    <button class="day-btn" data-day="Miércoles">Miércoles</button>
                    <button class="day-btn" data-day="Jueves">Jueves</button>
                    <button class="day-btn" data-day="Viernes">Viernes</button>
                    <button class="day-btn" data-day="Sábado">Sábado</button>
                    <button class="day-btn" data-day="Domingo">Domingo</button>
                </div>
                
                <!-- Meal Types -->
                <div class="meal-types">
                    <div class="meal-type-card" data-meal="desayuno">
                        <div class="meal-type-icon">
                            <i class="fas fa-sun"></i>
                        </div>
                        <h6 class="meal-type-title">Desayuno</h6>
                    </div>
                    <div class="meal-type-card" data-meal="media_manana">
                        <div class="meal-type-icon">
                            <i class="fas fa-apple-alt"></i>
                        </div>
                        <h6 class="meal-type-title">Media Mañana</h6>
                    </div>
                    <div class="meal-type-card" data-meal="almuerzo">
                        <div class="meal-type-icon">
                            <i class="fas fa-utensils"></i>
                        </div>
                        <h6 class="meal-type-title">Almuerzo</h6>
                    </div>
                    <div class="meal-type-card" data-meal="media_tarde">
                        <div class="meal-type-icon">
                            <i class="fas fa-coffee"></i>
                        </div>
                        <h6 class="meal-type-title">Media Tarde</h6>
                    </div>
                    <div class="meal-type-card" data-meal="cena">
                        <div class="meal-type-icon">
                            <i class="fas fa-moon"></i>
                        </div>
                        <h6 class="meal-type-title">Cena</h6>
                    </div>
                    <div class="meal-type-card" data-meal="colacion">
                        <div class="meal-type-icon">
                            <i class="fas fa-cookie-bite"></i>
                        </div>
                        <h6 class="meal-type-title">Colación</h6>
                    </div>
                </div>
                
                <!-- Meal Form Container -->
                <div id="mealFormContainer">
                    <div class="text-center text-muted py-5">
                        <i class="fas fa-utensils fa-3x mb-3"></i>
                        <p>Selecciona un tipo de comida para configurar</p>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Load Plan Intermedio content
function loadPlanIntermedioContent() {
    const planContent = document.getElementById('planContent');
    
    planContent.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h5 class="card-title mb-0">
                    <i class="fas fa-calculator me-2"></i>Plan Intermedio - Información Nutricional
                </h5>
            </div>
            <div class="card-body">
                <div class="alert alert-info">
                    <i class="fas fa-info-circle me-2"></i>
                    El Plan Intermedio incluye información nutricional detallada con macronutrientes, ingredientes específicos y tiempo de preparación.
                </div>
                
                <!-- Day Selector -->
                <div class="mb-4">
                    <h6 class="mb-3">Seleccionar Día de la Semana</h6>
                    <div class="btn-group" role="group" aria-label="Días de la semana">
                        <button type="button" class="btn btn-outline-primary day-btn" data-day="Lunes">Lunes</button>
                        <button type="button" class="btn btn-outline-primary day-btn" data-day="Martes">Martes</button>
                        <button type="button" class="btn btn-outline-primary day-btn" data-day="Miércoles">Miércoles</button>
                        <button type="button" class="btn btn-outline-primary day-btn" data-day="Jueves">Jueves</button>
                        <button type="button" class="btn btn-outline-primary day-btn" data-day="Viernes">Viernes</button>
                        <button type="button" class="btn btn-outline-primary day-btn" data-day="Sábado">Sábado</button>
                        <button type="button" class="btn btn-outline-primary day-btn" data-day="Domingo">Domingo</button>
                    </div>
                </div>

                <!-- Meal Type Selector -->
                <div class="mb-4">
                    <h6 class="mb-3">Tipo de Comida</h6>
                    <div class="row">
                        <div class="col-md-2 col-sm-4 col-6 mb-2">
                            <div class="meal-type-card" data-meal-type="desayuno">
                                <i class="fas fa-sun"></i>
                                <span>Desayuno</span>
                                <div class="meal-indicator"></div>
                            </div>
                        </div>
                        <div class="col-md-2 col-sm-4 col-6 mb-2">
                            <div class="meal-type-card" data-meal-type="media_manana">
                                <i class="fas fa-coffee"></i>
                                <span>Media Mañana</span>
                                <div class="meal-indicator"></div>
                            </div>
                        </div>
                        <div class="col-md-2 col-sm-4 col-6 mb-2">
                            <div class="meal-type-card" data-meal-type="almuerzo">
                                <i class="fas fa-utensils"></i>
                                <span>Almuerzo</span>
                                <div class="meal-indicator"></div>
                            </div>
                        </div>
                        <div class="col-md-2 col-sm-4 col-6 mb-2">
                            <div class="meal-type-card" data-meal-type="media_tarde">
                                <i class="fas fa-apple-alt"></i>
                                <span>Media Tarde</span>
                                <div class="meal-indicator"></div>
                            </div>
                        </div>
                        <div class="col-md-2 col-sm-4 col-6 mb-2">
                            <div class="meal-type-card" data-meal-type="cena">
                                <i class="fas fa-moon"></i>
                                <span>Cena</span>
                                <div class="meal-indicator"></div>
                            </div>
                        </div>
                        <div class="col-md-2 col-sm-4 col-6 mb-2">
                            <div class="meal-type-card" data-meal-type="colacion">
                                <i class="fas fa-cookie-bite"></i>
                                <span>Colación</span>
                                <div class="meal-indicator"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Meal Form Container -->
                <div id="mealFormContainer" class="mt-4" style="display: none;">
                    <!-- Meal form will be dynamically inserted here -->
                </div>

                <!-- Action Buttons -->
                <div class="d-flex justify-content-between mt-4">
                    <button type="button" class="btn btn-secondary" id="previewPlanBtn">
                        <i class="fas fa-eye me-2"></i>Vista Previa
                    </button>
                    <button type="button" class="btn btn-success" id="savePlanBtn">
                        <i class="fas fa-save me-2"></i>Guardar Plan
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Load initial data
async function loadInitialData() {
    try {
        console.log('📊 Cargando datos iniciales...');
        
        // Cargar pacientes
        await loadPacientes();
        
        // Si estamos editando, cargar datos del plan
        if (isEditing) {
            await loadPlanData();
        }
        
        // Establecer fecha de inicio por defecto
        if (!isEditing) {
            const today = new Date();
            const fechaInicio = document.getElementById('planFechaInicio');
            if (fechaInicio) {
                fechaInicio.value = today.toISOString().split('T')[0];
            }
        }
        
        console.log('✅ Datos iniciales cargados');
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        showAlert('Error al cargar los datos iniciales', 'danger');
    }
}

// Load pacientes
async function loadPacientes() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/plan-alimentacion/profesional/${profesionalId}/pacientes`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar pacientes');
        }
        
        const result = await response.json();
        pacientesData = result.data || [];
        
        // Llenar select de pacientes
        const selectPaciente = document.getElementById('planPaciente');
        if (selectPaciente) {
            selectPaciente.innerHTML = '<option value="">Sin asignar paciente</option>';
            pacientesData.forEach(paciente => {
                const option = document.createElement('option');
                option.value = paciente.id;
                option.textContent = paciente.apellido_nombre;
                selectPaciente.appendChild(option);
            });
        }
        
        console.log('✅ Pacientes cargados:', pacientesData.length);
    } catch (error) {
        console.error('❌ Error cargando pacientes:', error);
    }
}

// Load plan data for editing
async function loadPlanData() {
    try {
        const token = localStorage.getItem('token');
        
        // Cargar datos del plan
        const planResponse = await fetch(`/api/plan-alimentacion/plan/${planId}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!planResponse.ok) {
            throw new Error('Error al cargar datos del plan');
        }
        
        const planResult = await planResponse.json();
        planData = planResult.data;
        
        // Cargar comidas del plan
        const comidasResponse = await fetch(`/api/plan-alimentacion/plan/${planId}/comidas`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (comidasResponse.ok) {
            const comidasResult = await comidasResponse.json();
            const comidas = comidasResult.data || [];
            
            console.log('🍽️ Comidas cargadas desde BD:', comidas);
            
            // Organizar comidas por día y tipo
            comidas.forEach(comida => {
                if (!savedMeals[comida.dia_semana]) {
                    savedMeals[comida.dia_semana] = {};
                }
                savedMeals[comida.dia_semana][comida.tipo_comida] = comida;
            });
            
            console.log('📊 savedMeals organizado:', savedMeals);
            
            // Actualizar indicadores visuales para todas las comidas cargadas
            updateAllMealIndicators();
        }
        
        // Llenar formulario
        fillPlanForm(planData);
        
        console.log('✅ Datos del plan cargados');
        console.log('📊 Plan data:', planData);
        console.log('🍽️ Saved meals final:', savedMeals);
    } catch (error) {
        console.error('❌ Error cargando datos del plan:', error);
        showAlert('Error al cargar los datos del plan', 'danger');
    }
}

// Fill plan form with data
function fillPlanForm(data) {
    console.log('📝 Llenando formulario con datos:', data);
    
    // Información básica
    document.getElementById('planNombre').value = data.nombre || '';
    document.getElementById('planPaciente').value = data.usuario_id || '';
    
    // Objetivo nutricional - verificar si existe en las opciones
    const objetivoSelect = document.getElementById('planObjetivo');
    if (objetivoSelect) {
        // Verificar si el objetivo está en las opciones predefinidas
        const predefinedOptions = ['perdida_peso', 'ganancia_masa', 'mantenimiento', 'deportivo', 'diabetes', 'hipertension'];
        
        if (predefinedOptions.includes(data.objetivo)) {
            objetivoSelect.value = data.objetivo;
        } else if (data.objetivo) {
            // Si no está en las opciones predefinidas, usar "otro"
            objetivoSelect.value = 'otro';
            document.getElementById('objetivoPersonalizadoContainer').style.display = 'block';
            document.getElementById('objetivoPersonalizado').value = data.objetivo;
        } else {
            objetivoSelect.value = '';
        }
        
        console.log('🎯 Objetivo cargado:', data.objetivo, '-> Select value:', objetivoSelect.value);
    }
    
    document.getElementById('planFechaInicio').value = data.fecha_inicio ? data.fecha_inicio.split('T')[0] : '';
    document.getElementById('planFechaFin').value = data.fecha_fin ? data.fecha_fin.split('T')[0] : '';
    document.getElementById('planCalorias').value = data.calorias_diarias || '';
    document.getElementById('planDescripcion').value = data.descripcion || '';
    
    console.log('✅ Formulario llenado correctamente');
}

// Setup event listeners
function setupEventListeners() {
    // Day selector
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('day-btn')) {
            selectDay(e.target.getAttribute('data-day'));
        }
    });
    
    // Meal type selector
    document.addEventListener('click', (e) => {
        if (e.target.closest('.meal-type-card')) {
            const mealType = e.target.closest('.meal-type-card').getAttribute('data-meal-type');
            if (mealType) {
                selectMealType(mealType);
            }
        }
    });
    
    // Objective change
    const planObjetivo = document.getElementById('planObjetivo');
    if (planObjetivo) {
        planObjetivo.addEventListener('change', handleObjetivoChange);
    }
    
    // Save button (botón superior)
    const saveBtnTop = document.getElementById('saveBtn');
    if (saveBtnTop) {
        saveBtnTop.addEventListener('click', savePlan);
    }
    
    // Save button (botón inferior)
    const saveBtn = document.getElementById('savePlanBtn');
    if (saveBtn) {
        saveBtn.addEventListener('click', savePlan);
    }
    
    // Preview button
    const previewBtn = document.getElementById('previewPlanBtn');
    if (previewBtn) {
        previewBtn.addEventListener('click', previewPlan);
    }
}

// Select day
function selectDay(day) {
    currentDay = day;
    
    // Update active day button
    document.querySelectorAll('.day-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`[data-day="${day}"]`).classList.add('active');
    
    // Update meal indicators for the selected day
    updateAllMealIndicators();
    
    // Update meal form if a meal type is selected
    if (currentMealType) {
        showMealForm(currentDay, currentMealType);
    }
    
    console.log('📅 Día seleccionado:', day);
}

// Select meal type
function selectMealType(mealType) {
    currentMealType = mealType;
    
    // Update active meal type card
    document.querySelectorAll('.meal-type-card').forEach(card => {
        card.classList.remove('active');
    });
    
    const selectedCard = document.querySelector(`[data-meal-type="${mealType}"]`);
    if (selectedCard) {
        selectedCard.classList.add('active');
    }
    
    // Show meal form
    showMealForm(currentDay, mealType);
    
    console.log('🍽️ Tipo de comida seleccionado:', mealType);
}

// Show meal form
function showMealForm(day, mealType) {
    console.log('🔍 showMealForm llamado con:', { day, mealType, planTipo });
    
    const container = document.getElementById('mealFormContainer');
    console.log('🔍 Container encontrado:', !!container);
    
    if (!container) {
        console.error('❌ No se encontró el contenedor mealFormContainer');
        return;
    }
    
    const mealNames = {
        'desayuno': 'Desayuno',
        'media_manana': 'Media Mañana',
        'almuerzo': 'Almuerzo',
        'media_tarde': 'Media Tarde',
        'cena': 'Cena',
        'colacion': 'Colación'
    };
    
    // Cargar datos existentes si los hay
    const existingMeal = getSavedMeal(day, mealType);
    console.log('🔍 Comida existente:', existingMeal);
    
    container.innerHTML = `
        <div class="meal-form">
            <div class="meal-form-header">
                <h6 class="meal-form-title">
                    <i class="fas fa-utensils me-2"></i>${mealNames[mealType]} - ${day}
                    ${existingMeal ? '<span class="badge bg-success ms-2">Guardado</span>' : ''}
                </h6>
                <button class="meal-form-close" id="closeMealFormBtn">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            
            <div class="row">
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Nombre de la Comida *</label>
                        <input type="text" class="form-control" id="mealName" placeholder="Ej: Avena con frutas" value="${existingMeal?.nombre_comida || ''}">
                    </div>
                    <div class="mb-3">
                        <label class="form-label">Descripción</label>
                        <textarea class="form-control" id="mealDescription" rows="3" placeholder="Descripción de la comida...">${existingMeal?.descripcion || ''}</textarea>
                    </div>
                </div>
                <div class="col-md-6">
                    <div class="mb-3">
                        <label class="form-label">Hora</label>
                        <div class="time-input-group">
                            <input type="time" class="form-control time-input" id="mealTime" value="${existingMeal?.hora || ''}">
                        </div>
                    </div>
                </div>
            </div>
            
            ${planTipo !== 'simple' ? `
                <div class="advanced-fields show">
                    <h6 class="mb-3">
                        <i class="fas fa-chart-pie me-2"></i>Información Nutricional
                    </h6>
                    <div class="row">
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label">Calorías</label>
                                <input type="number" class="form-control" id="mealCalories" placeholder="0" value="${existingMeal?.calorias || ''}">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label">Proteínas (g)</label>
                                <input type="number" class="form-control" id="mealProteins" placeholder="0" value="${existingMeal?.proteinas || ''}">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label">Carbohidratos (g)</label>
                                <input type="number" class="form-control" id="mealCarbs" placeholder="0" value="${existingMeal?.carbohidratos || ''}">
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="mb-3">
                                <label class="form-label">Grasas (g)</label>
                                <input type="number" class="form-control" id="mealFats" placeholder="0" value="${existingMeal?.grasas || ''}">
                            </div>
                        </div>
                    </div>
                    <div class="row">
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Fibra (g)</label>
                                <input type="number" class="form-control" id="mealFiber" placeholder="0" value="${existingMeal?.fibra || ''}">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Azúcares (g)</label>
                                <input type="number" class="form-control" id="mealSugars" placeholder="0" value="${existingMeal?.azucares || ''}">
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="mb-3">
                                <label class="form-label">Sodio (mg)</label>
                                <input type="number" class="form-control" id="mealSodium" placeholder="0" value="${existingMeal?.sodio || ''}">
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            ${planTipo === 'intermedio' ? `
                <div class="advanced-fields show">
                    <h6 class="mb-3">
                        <i class="fas fa-utensils me-2"></i>Información de Preparación
                    </h6>
                    <div class="row">
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Ingredientes</label>
                                <textarea class="form-control" id="mealIngredients" rows="3" placeholder="Lista de ingredientes...">${existingMeal?.ingredientes || ''}</textarea>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Preparación</label>
                                <textarea class="form-control" id="mealPreparation" rows="4" placeholder="Instrucciones de preparación...">${existingMeal?.preparacion || ''}</textarea>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="mb-3">
                                <label class="form-label">Tiempo de Preparación (min)</label>
                                <input type="number" class="form-control" id="mealPrepTime" placeholder="0" value="${existingMeal?.tiempo_preparacion || ''}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Dificultad</label>
                                <select class="form-select" id="mealDifficulty">
                                    <option value="facil" ${existingMeal?.dificultad === 'facil' ? 'selected' : ''}>Fácil</option>
                                    <option value="medio" ${existingMeal?.dificultad === 'medio' ? 'selected' : ''}>Medio</option>
                                    <option value="dificil" ${existingMeal?.dificultad === 'dificil' ? 'selected' : ''}>Difícil</option>
                                </select>
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Porciones</label>
                                <input type="number" class="form-control" id="mealPortions" placeholder="1" value="${existingMeal?.porciones || '1'}">
                            </div>
                            <div class="mb-3">
                                <label class="form-label">Notas</label>
                                <textarea class="form-control" id="mealNotes" rows="2" placeholder="Notas adicionales...">${existingMeal?.notas || ''}</textarea>
                            </div>
                        </div>
                    </div>
                </div>
            ` : ''}
            
            <div class="d-flex justify-content-between align-items-center">
                <div>
                    ${existingMeal ? `
                        <button class="btn btn-danger btn-sm" id="deleteMealBtn" data-day="${day}" data-meal-type="${mealType}">
                            <i class="fas fa-trash me-1"></i>Eliminar
                        </button>
                    ` : ''}
                </div>
                <div class="d-flex gap-2">
                    <button class="btn btn-secondary" id="cancelMealFormBtn">Cancelar</button>
                    <button class="btn btn-success" id="saveMealBtn" data-day="${day}" data-meal-type="${mealType}">
                        <i class="fas fa-save me-2"></i>${existingMeal ? 'Actualizar' : 'Guardar'} Comida
                    </button>
                </div>
            </div>
        </div>
    `;
    
    // Agregar event listeners a los botones del formulario
    setTimeout(() => {
        // Botón cerrar formulario
        const closeBtn = document.getElementById('closeMealFormBtn');
        if (closeBtn) {
            closeBtn.addEventListener('click', closeMealForm);
        }
        
        // Botón cancelar
        const cancelBtn = document.getElementById('cancelMealFormBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeMealForm);
        }
        
        // Botón guardar
        const saveBtn = document.getElementById('saveMealBtn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const day = saveBtn.getAttribute('data-day');
                const mealType = saveBtn.getAttribute('data-meal-type');
                saveMeal(day, mealType);
            });
        }
        
        // Botón eliminar
        const deleteBtn = document.getElementById('deleteMealBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                const day = deleteBtn.getAttribute('data-day');
                const mealType = deleteBtn.getAttribute('data-meal-type');
                deleteMeal(day, mealType);
            });
        }
    }, 100);
    
    // Mostrar el contenedor del formulario
    container.style.display = 'block';
    console.log('✅ Formulario de comida mostrado');
}

// Close meal form
function closeMealForm() {
    const container = document.getElementById('mealFormContainer');
    container.innerHTML = `
        <div class="text-center text-muted py-5">
            <i class="fas fa-utensils fa-3x mb-3"></i>
            <p>Selecciona un tipo de comida para configurar</p>
        </div>
    `;
    
    // Ocultar el contenedor
    container.style.display = 'none';
    
    // Remove active states
    document.querySelectorAll('.meal-type-card').forEach(card => {
        card.classList.remove('active');
    });
    
    currentMealType = null;
    console.log('✅ Formulario de comida cerrado');
}

// Get saved meal
function getSavedMeal(day, mealType) {
    if (!savedMeals[day]) return null;
    return savedMeals[day][mealType] || null;
}

// Save meal
function saveMeal(day, mealType) {
    try {
        console.log('💾 Guardando comida:', day, mealType);
        
        // Validar campos requeridos
        const nombre = document.getElementById('mealName').value.trim();
        if (!nombre) {
            showAlert('El nombre de la comida es requerido', 'danger');
            return;
        }
        
        // Helper function to safely get value or null
        const getValueOrNull = (elementId) => {
            const element = document.getElementById(elementId);
            if (!element) return null;
            const value = element.value.trim();
            return value === '' ? null : value;
        };
        
        // Helper function to safely get number or null
        const getNumberOrNull = (elementId) => {
            const element = document.getElementById(elementId);
            if (!element) return null;
            const value = element.value.trim();
            return value === '' ? null : parseFloat(value);
        };
        
        // Recopilar datos del formulario
        const mealData = {
            dia_semana: day,
            tipo_comida: mealType,
            nombre_comida: nombre,
            descripcion: getValueOrNull('mealDescription') || '',
            hora: getValueOrNull('mealTime')
        };
        
        // Agregar campos específicos según el tipo de plan
        if (planTipo !== 'simple') {
            mealData.calorias = getNumberOrNull('mealCalories');
            mealData.proteinas = getNumberOrNull('mealProteins');
            mealData.carbohidratos = getNumberOrNull('mealCarbs');
            mealData.grasas = getNumberOrNull('mealFats');
            mealData.fibra = getNumberOrNull('mealFiber');
            mealData.azucares = getNumberOrNull('mealSugars');
            mealData.sodio = getNumberOrNull('mealSodium');
        }
        
        if (planTipo === 'intermedio') {
            mealData.ingredientes = getValueOrNull('mealIngredients') || '';
            mealData.preparacion = getValueOrNull('mealPreparation') || '';
            mealData.tiempo_preparacion = getNumberOrNull('mealPrepTime');
            mealData.dificultad = getValueOrNull('mealDifficulty') || 'facil';
            mealData.porciones = getNumberOrNull('mealPortions') || 1;
            mealData.notas = getValueOrNull('mealNotes') || '';
        }
        
        // Guardar en memoria
        if (!savedMeals[day]) {
            savedMeals[day] = {};
        }
        savedMeals[day][mealType] = mealData;
        
        // Actualizar indicador visual
        updateMealTypeIndicator(day, mealType, true);
        
        showAlert('Comida guardada exitosamente', 'success');
        closeMealForm();
        
        console.log('✅ Comida guardada:', mealData);
        
    } catch (error) {
        console.error('❌ Error guardando comida:', error);
        showAlert('Error al guardar la comida', 'danger');
    }
}

// Delete meal
function deleteMeal(day, mealType) {
    if (confirm('¿Estás seguro de que quieres eliminar esta comida?')) {
        if (savedMeals[day] && savedMeals[day][mealType]) {
            delete savedMeals[day][mealType];
            
            // Actualizar indicador visual
            updateMealTypeIndicator(day, mealType, false);
            
            showAlert('Comida eliminada exitosamente', 'success');
            closeMealForm();
            
            console.log('🗑️ Comida eliminada:', day, mealType);
        }
    }
}

// Update meal type indicator
function updateMealTypeIndicator(day, mealType, hasMeal) {
    const mealCard = document.querySelector(`[data-meal-type="${mealType}"]`);
    if (mealCard) {
        if (hasMeal) {
            mealCard.classList.add('has-meal');
            const indicator = mealCard.querySelector('.meal-indicator');
            if (indicator) {
                indicator.innerHTML = '<i class="fas fa-check-circle text-success"></i>';
            }
        } else {
            mealCard.classList.remove('has-meal');
            const indicator = mealCard.querySelector('.meal-indicator');
            if (indicator) {
                indicator.innerHTML = '';
            }
        }
    }
}

// Update all meal indicators for the current day
function updateAllMealIndicators() {
    console.log('🔄 Actualizando indicadores para día:', currentDay);
    
    const mealTypes = ['desayuno', 'media_manana', 'almuerzo', 'media_tarde', 'cena', 'colacion'];
    
    mealTypes.forEach(mealType => {
        const hasMeal = savedMeals[currentDay] && savedMeals[currentDay][mealType];
        updateMealTypeIndicator(currentDay, mealType, hasMeal);
    });
    
    console.log('✅ Indicadores actualizados');
}

// Handle objective change
function handleObjetivoChange() {
    const objetivo = document.getElementById('planObjetivo').value;
    const container = document.getElementById('objetivoPersonalizadoContainer');
    
    if (objetivo === 'otro') {
        container.style.display = 'block';
    } else {
        container.style.display = 'none';
    }
}

// Save plan
async function savePlan() {
    try {
        console.log('💾 Guardando plan...');
        console.log('🔍 isEditing:', isEditing);
        console.log('🔍 planId:', planId);
        console.log('🔍 profesionalId:', profesionalId);
        
        // Validar formulario
        if (!validatePlanForm()) {
            console.log('❌ Validación falló');
            return;
        }
        
        // Recopilar datos del formulario
        const planData = collectPlanData();
        console.log('📊 Plan data recopilado:', planData);
        
        // Mostrar loading en ambos botones
        const saveBtnTop = document.getElementById('saveBtn');
        const saveBtn = document.getElementById('savePlanBtn');
        
        if (saveBtnTop) {
            saveBtnTop.classList.add('loading');
            saveBtnTop.disabled = true;
        }
        if (saveBtn) {
            saveBtn.classList.add('loading');
            saveBtn.disabled = true;
        }
        
        const token = localStorage.getItem('token');
        const url = isEditing 
            ? `/api/plan-alimentacion/plan/${planId}`
            : `/api/plan-alimentacion/profesional/${profesionalId}/crear-plan`;
        
        const method = isEditing ? 'PUT' : 'POST';
        
        console.log('🌐 Enviando request a:', url);
        console.log('🌐 Método:', method);
        console.log('🌐 Token:', token ? 'Presente' : 'Ausente');
        
        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(planData)
        });
        
        console.log('📡 Response status:', response.status);
        console.log('📡 Response ok:', response.ok);
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error('❌ Error response:', errorData);
            throw new Error(errorData.message || 'Error al guardar el plan');
        }
        
        const result = await response.json();
        console.log('✅ Result:', result);
        
        showAlert(
            isEditing ? 'Plan actualizado exitosamente' : 'Plan creado exitosamente', 
            'success'
        );
        
        // Redirigir a gestión de planes
        setTimeout(() => {
            window.location.href = '/plan-alimentario';
        }, 2000);
        
    } catch (error) {
        console.error('❌ Error guardando plan:', error);
        showAlert('Error al guardar el plan: ' + error.message, 'danger');
    } finally {
        // Restaurar estado de ambos botones
        const saveBtnTop = document.getElementById('saveBtn');
        const saveBtn = document.getElementById('savePlanBtn');
        
        if (saveBtnTop) {
            saveBtnTop.classList.remove('loading');
            saveBtnTop.disabled = false;
        }
        if (saveBtn) {
            saveBtn.classList.remove('loading');
            saveBtn.disabled = false;
        }
    }
}

// Validate plan form
function validatePlanForm() {
    const nombre = document.getElementById('planNombre').value.trim();
    const objetivo = document.getElementById('planObjetivo').value;
    const fechaInicio = document.getElementById('planFechaInicio').value;
    
    if (!nombre) {
        showAlert('El nombre del plan es requerido', 'danger');
        return false;
    }
    
    if (!objetivo) {
        showAlert('El objetivo nutricional es requerido', 'danger');
        return false;
    }
    
    if (objetivo === 'otro') {
        const objetivoPersonalizado = document.getElementById('objetivoPersonalizado').value.trim();
        if (!objetivoPersonalizado) {
            showAlert('Debe especificar el objetivo personalizado', 'danger');
            return false;
        }
    }
    
    if (!fechaInicio) {
        showAlert('La fecha de inicio es requerida', 'danger');
        return false;
    }
    
    return true;
}

// Collect plan data
function collectPlanData() {
    const objetivo = document.getElementById('planObjetivo').value;
    
    // Helper function to safely get value or null
    const getValueOrNull = (elementId) => {
        const element = document.getElementById(elementId);
        if (!element) return null;
        const value = element.value.trim();
        return value === '' ? null : value;
    };
    
    // Helper function to safely get number or null
    const getNumberOrNull = (elementId) => {
        const element = document.getElementById(elementId);
        if (!element) return null;
        const value = element.value.trim();
        return value === '' ? null : parseInt(value);
    };
    
    return {
        nombre: getValueOrNull('planNombre') || '',
        tipo: planTipo,
        usuario_id: getValueOrNull('planPaciente'),
        fecha_inicio: getValueOrNull('planFechaInicio') || '',
        fecha_fin: getValueOrNull('planFechaFin'),
        descripcion: getValueOrNull('planDescripcion') || '',
        objetivo: objetivo === 'otro' ? getValueOrNull('objetivoPersonalizado') || '' : objetivo,
        calorias_diarias: getNumberOrNull('planCalorias'),
        caracteristicas: JSON.stringify({ tipo: planTipo }),
        observaciones: '',
        activo: true,
        comidas: savedMeals // Incluir comidas guardadas
    };
}

// Preview plan
function previewPlan() {
    console.log('👁️ Vista previa del plan');
    showAlert('Función de vista previa en desarrollo', 'info');
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
