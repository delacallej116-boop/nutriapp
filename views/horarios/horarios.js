// Sistema de Horarios - JavaScript
console.log('🚀 Inicializando Sistema de Horarios...');

// Variables globales
let currentProfesionalId = null;
let horarios = [];
let diasNoLaborales = [];

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 DOM cargado, inicializando...');
    initializeHorarios();
});

// Función principal de inicialización
async function initializeHorarios() {
    try {
        console.log('🔄 Inicializando sistema de horarios...');
        
        // Verificar que el botón existe antes de configurar event listeners
        const addHorarioBtn = document.getElementById('addHorarioBtn');
        console.log('🔍 Botón addHorarioBtn encontrado en inicialización:', addHorarioBtn);
        
        // Obtener ID del profesional del token
        const token = localStorage.getItem('token');
        if (!token) {
            console.error('❌ No se encontró token de autenticación');
            showError('No estás autenticado. Por favor, inicia sesión nuevamente.');
            return;
        }

        // Decodificar token para obtener ID del profesional
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            console.log('🔍 Payload del token:', payload);
            currentProfesionalId = payload.profesional_id || payload.id;
            console.log('👤 ID del profesional:', currentProfesionalId);
            
            if (!currentProfesionalId) {
                throw new Error('No se encontró ID del profesional en el token');
            }
        } catch (error) {
            console.error('❌ Error decodificando token:', error);
            showError('Error de autenticación. Por favor, inicia sesión nuevamente.');
            return;
        }

        // Configurar event listeners
        setupEventListeners();
        
        // Cargar datos iniciales
        await loadInitialData();
        
        console.log('✅ Sistema de horarios inicializado correctamente');
        
        } catch (error) {
            console.error('❌ Error inicializando sistema de horarios:', error);
            showError('Error al inicializar el sistema');
        }
}

// Configurar event listeners
function setupEventListeners() {
    console.log('🔗 Configurando event listeners...');
    
    // Botón agregar horario
    const addHorarioBtn = document.getElementById('addHorarioBtn');
    console.log('🔍 Botón addHorarioBtn encontrado en setupEventListeners:', addHorarioBtn);
    
    if (addHorarioBtn) {
        addHorarioBtn.addEventListener('click', function(e) {
            console.log('🖱️ Botón agregar horario clickeado!');
            e.preventDefault();
            showAddHorarioModal();
        });
        console.log('✅ Event listener agregado para addHorarioBtn');
    } else {
        console.error('❌ No se encontró el botón addHorarioBtn');
    }
    
    // Botón agregar día no laboral
    const addDiaNoLaboralBtn = document.getElementById('addDiaNoLaboralBtn');
    if (addDiaNoLaboralBtn) {
        addDiaNoLaboralBtn.addEventListener('click', showAddDiaNoLaboralModal);
        console.log('✅ Event listener agregado para addDiaNoLaboralBtn');
    }
    
    // Botón guardar horario
    const guardarHorarioBtn = document.getElementById('guardarHorarioBtn');
    if (guardarHorarioBtn) {
        guardarHorarioBtn.addEventListener('click', guardarHorario);
        console.log('✅ Event listener agregado para guardarHorarioBtn');
    }
    
    // Botón actualizar horario
    const actualizarHorarioBtn = document.getElementById('actualizarHorarioBtn');
    if (actualizarHorarioBtn) {
        actualizarHorarioBtn.addEventListener('click', actualizarHorario);
        console.log('✅ Event listener agregado para actualizarHorarioBtn');
    }
    
    // Botón actualizar día no laboral
    const actualizarDiaNoLaboralBtn = document.getElementById('actualizarDiaNoLaboralBtn');
    if (actualizarDiaNoLaboralBtn) {
        actualizarDiaNoLaboralBtn.addEventListener('click', actualizarDiaNoLaboral);
        console.log('✅ Event listener agregado para actualizarDiaNoLaboralBtn');
    }
    
    // Botón guardar día no laboral
    const guardarDiaNoLaboralBtn = document.getElementById('guardarDiaNoLaboralBtn');
    if (guardarDiaNoLaboralBtn) {
        guardarDiaNoLaboralBtn.addEventListener('click', guardarDiaNoLaboral);
        console.log('✅ Event listener agregado para guardarDiaNoLaboralBtn');
    }

    // Botón eliminar seleccionados
    const eliminarSeleccionadosBtn = document.getElementById('eliminarSeleccionadosBtn');
    if (eliminarSeleccionadosBtn) {
        eliminarSeleccionadosBtn.addEventListener('click', mostrarModalEliminarSeleccionados);
    }

    // Botón confirmar eliminación múltiple
    const confirmarEliminarMultipleBtn = document.getElementById('confirmarEliminarMultipleBtn');
    if (confirmarEliminarMultipleBtn) {
        confirmarEliminarMultipleBtn.addEventListener('click', eliminarDiasSeleccionados);
    }
    
    // Event listeners para vista previa en tiempo real
    setupModalEventListeners();
    
    // Event listeners para modal de edición
    setupEditarModalEventListeners();
    
    // Event listeners para tipo de selección de días no laborales
    const tipoSeleccionRadios = document.querySelectorAll('input[name="tipoSeleccion"]');
    tipoSeleccionRadios.forEach(radio => {
        radio.addEventListener('change', updateTipoSeleccion);
    });
    
    // Event delegation para botones dinámicos
    setupEventDelegation();
    
    console.log('✅ Todos los event listeners configurados');
}

// Configurar event listeners del modal
function setupModalEventListeners() {
    const diaSemana = document.getElementById('diaSemana');
    const horaInicio = document.getElementById('horaInicio');
    const horaFin = document.getElementById('horaFin');
    const duracionTurno = document.getElementById('duracionTurno');
    const descansoEntreTurnos = document.getElementById('descansoEntreTurnos');
    
    // Event listeners para actualizar vista previa
    [diaSemana, horaInicio, horaFin, duracionTurno, descansoEntreTurnos].forEach(element => {
        if (element) {
            element.addEventListener('change', updateVistaPrevia);
        }
    });
}

// Configurar event listeners del modal de edición
function setupEditarModalEventListeners() {
    const editarDiaSemana = document.getElementById('editarDiaSemana');
    const editarHoraInicio = document.getElementById('editarHoraInicio');
    const editarHoraFin = document.getElementById('editarHoraFin');
    const editarDuracionTurno = document.getElementById('editarDuracionTurno');
    const editarDescansoEntreTurnos = document.getElementById('editarDescansoEntreTurnos');
    
    // Event listeners para actualizar vista previa en modal de edición
    [editarDiaSemana, editarHoraInicio, editarHoraFin, editarDuracionTurno, editarDescansoEntreTurnos].forEach(element => {
        if (element) {
            element.addEventListener('change', updateEditarVistaPrevia);
        }
    });
    
    // Event listener específico para actualizar el badge del día cuando cambie
    if (editarDiaSemana) {
        editarDiaSemana.addEventListener('change', function() {
            const diaActualElement = document.getElementById('editarDiaActual');
            if (diaActualElement && this.value) {
                // Mapear de minúscula (valor del select) a mayúscula (para mostrar en badge)
                const diaDisplayMapping = {
                    'lunes': 'Lunes',
                    'martes': 'Martes',
                    'miercoles': 'Miércoles', 
                    'jueves': 'Jueves',
                    'viernes': 'Viernes',
                    'sabado': 'Sábado',
                    'domingo': 'Domingo'
                };
                
                const diaDisplay = diaDisplayMapping[this.value] || this.value;
                diaActualElement.textContent = diaDisplay;
            }
        });
    }
}

// Cargar datos iniciales
async function loadInitialData() {
    try {
        console.log('📊 Cargando datos iniciales...');
        
        // Cargar horarios y días no laborales en paralelo
        await Promise.all([
            loadHorarios(),
            loadDiasNoLaborales()
        ]);
        
        // Actualizar estadísticas
        updateStatsDisplay();
        
        console.log('✅ Datos iniciales cargados');
        
    } catch (error) {
        console.error('❌ Error cargando datos iniciales:', error);
        showError('Error al cargar los datos: ' + error.message);
    }
}

// Cargar horarios
async function loadHorarios() {
    try {
        console.log('⏰ Cargando horarios...');
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/horarios/profesional/${currentProfesionalId}/horarios`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        horarios = data.data || [];
        
        console.log('✅ Horarios cargados:', horarios.length);
        
        // Renderizar horarios
        renderHorarios();
        
        } catch (error) {
            console.error('❌ Error cargando horarios:', error);
            showError('Error al cargar los horarios');
        }
}

// Renderizar horarios
function renderHorarios() {
    const container = document.getElementById('horariosContainer');
    if (!container) return;
    
    if (horarios.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-clock fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No hay horarios configurados</h5>
                <p class="text-muted">Agrega tus horarios de trabajo para que los pacientes puedan reservar turnos</p>
            </div>
        `;
        return;
    }
    
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
    
    let html = '<div class="horarios-cards-container">';
    
    ordenDias.forEach(dia => {
        if (horariosPorDia[dia]) {
            html += `
                <div class="dia-card">
                    <div class="dia-card-header">
                        <h6 class="dia-card-title">
                            <i class="fas fa-calendar-day me-2"></i>${dia}
                            <span class="badge bg-primary ms-2">${horariosPorDia[dia].length}</span>
                        </h6>
                    </div>
                    <div class="horarios-list">
            `;
            
            horariosPorDia[dia].forEach(horario => {
                html += `
                    <div class="horario-card">
                        <div class="horario-info">
                            <div class="horario-time">${horario.hora_inicio} - ${horario.hora_fin}</div>
                            <div class="horario-details">
                                <span class="duracion">${horario.duracion_minutos}min</span>
                                <span class="badge ${horario.activo ? 'bg-success' : 'bg-secondary'}">${horario.activo ? 'Activo' : 'Inactivo'}</span>
                            </div>
                        </div>
                        <div class="horario-actions">
                            <button class="btn btn-sm btn-outline-primary" data-action="edit-horario" data-id="${horario.id}" title="Editar">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="btn btn-sm btn-outline-danger" data-action="delete-horario" data-id="${horario.id}" title="Eliminar">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            });
            
            html += `
                    </div>
                </div>
            `;
        }
    });
    
    html += '</div>';
    
    container.innerHTML = html;
}

// Cargar días no laborales
async function loadDiasNoLaborales() {
    try {
        console.log('📅 Cargando días no laborales...');
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/horarios/profesional/${currentProfesionalId}/dias-no-laborales`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        diasNoLaborales = data.data || [];
        
        console.log('✅ Días no laborales cargados:', diasNoLaborales.length);
        
        // Renderizar días no laborales
        renderDiasNoLaborales();
        
        } catch (error) {
            console.error('❌ Error cargando días no laborales:', error);
            showError('Error al cargar los días no laborales');
        }
}

// Renderizar días no laborales
function renderDiasNoLaborales() {
    const container = document.getElementById('diasNoLaboralesContainer');
    if (!container) return;
    
    if (diasNoLaborales.length === 0) {
        container.innerHTML = `
            <div class="text-center py-5">
                <i class="fas fa-calendar-times fa-3x text-muted mb-3"></i>
                <h5 class="text-muted">No hay días no laborales</h5>
                <p class="text-muted">Marca días de vacaciones, feriados o días que no trabajas</p>
            </div>
        `;
        return;
    }
    
    let html = '<div class="row g-3">';
    diasNoLaborales.forEach(dia => {
        html += `
            <div class="col-lg-4 col-md-6">
                <div class="dia-no-laboral-item">
                    <div class="form-check position-absolute top-0 end-0 m-3">
                        <input class="form-check-input dia-checkbox" type="checkbox" value="${dia.id}" id="dia-${dia.id}" onchange="toggleEliminarButton()">
                        <label class="form-check-label" for="dia-${dia.id}"></label>
                    </div>
                    <div class="dia-fecha">
                        <i class="fas fa-calendar-times me-2"></i>
                        ${formatFecha(dia.fecha)}
                    </div>
                    <div class="dia-motivo">
                        <i class="fas fa-comment me-2"></i>
                        ${dia.motivo || 'Sin motivo especificado'}
                    </div>
                    <div class="dia-actions">
                        <button class="btn btn-sm btn-outline-warning" data-action="edit-dia-no-laboral" data-id="${dia.id}">
                            <i class="fas fa-edit me-1"></i>Editar
                        </button>
                        <button class="btn btn-sm btn-outline-danger" data-action="delete-dia-no-laboral" data-id="${dia.id}">
                            <i class="fas fa-trash me-1"></i>Eliminar
                        </button>
                    </div>
                </div>
            </div>
        `;
    });
    html += '</div>';
    
    container.innerHTML = html;
}

// Actualizar estadísticas
function updateStatsDisplay() {
    const horariosConfigurados = horarios.length;
    const diasTrabajo = new Set(horarios.map(h => h.dia_semana)).size;
    const diasNoLaboralesCount = diasNoLaborales.length;
    
    document.getElementById('horariosConfigurados').textContent = horariosConfigurados;
    document.getElementById('diasTrabajo').textContent = diasTrabajo;
    document.getElementById('diasNoLaborales').textContent = diasNoLaboralesCount;
}

// Mostrar modal agregar horario
function showAddHorarioModal() {
    console.log('⏰ Mostrando modal agregar horario');
    
    // Verificar que el modal existe
    const modalElement = document.getElementById('agregarHorarioModal');
    console.log('🔍 Modal agregarHorarioModal encontrado:', modalElement);
    
    if (!modalElement) {
        console.error('❌ No se encontró el modal agregarHorarioModal');
        showError('Error: Modal no encontrado');
        return;
    }
    
    // Limpiar formulario
    const form = document.getElementById('agregarHorarioForm');
    if (form) {
        form.reset();
        document.getElementById('horarioActivo').checked = true;
    }
    
    // Limpiar vista previa
    updateVistaPrevia();
    
    // Mostrar modal
    const modal = new bootstrap.Modal(modalElement);
    modal.show();
    
    console.log('✅ Modal mostrado exitosamente');
}

// Actualizar vista previa de slots
function updateVistaPrevia() {
    const container = document.getElementById('vistaPreviaSlots');
    if (!container) return;
    
    const diaSemana = document.getElementById('diaSemana').value;
    const horaInicio = document.getElementById('horaInicio').value;
    const horaFin = document.getElementById('horaFin').value;
    const duracionTurno = document.getElementById('duracionTurno').value;
    const descansoEntreTurnos = document.getElementById('descansoEntreTurnos').value;
    
    // Verificar si todos los campos necesarios están completos
    if (!diaSemana || !horaInicio || !horaFin || !duracionTurno) {
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-info-circle me-2"></i>
                Selecciona el día y horario para ver los turnos disponibles
            </div>
        `;
        return;
    }
    
    // Validar que la hora de fin sea mayor que la de inicio
    if (horaInicio >= horaFin) {
        container.innerHTML = `
            <div class="text-center text-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                La hora de fin debe ser mayor que la hora de inicio
            </div>
        `;
        return;
    }
    
    // Generar slots
    const slots = generarSlots(horaInicio, horaFin, parseInt(duracionTurno), parseInt(descansoEntreTurnos));
    
    if (slots.length === 0) {
        container.innerHTML = `
            <div class="text-center text-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                No se pueden generar turnos con la configuración actual
            </div>
        `;
        return;
    }
    
    // Mostrar slots
    let html = `
        <div class="mb-2">
            <strong>Turnos disponibles para ${diaSemana}:</strong>
        </div>
        <div class="row g-2">
    `;
    
    slots.forEach((slot, index) => {
        html += `
            <div class="col-md-4 col-sm-6">
                <div class="slot-item bg-white border rounded p-2 text-center">
                    <small class="text-muted">Turno ${index + 1}</small><br>
                    <strong>${slot.inicio} - ${slot.fin}</strong>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="mt-2">
            <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                Total: ${slots.length} turnos disponibles
            </small>
        </div>
    `;
    
    container.innerHTML = html;
}

// Generar slots de turnos
function generarSlots(horaInicio, horaFin, duracionTurno, descansoEntreTurnos) {
    const slots = [];
    
    // Convertir horas a minutos para facilitar cálculos
    const inicioMinutos = timeToMinutes(horaInicio);
    const finMinutos = timeToMinutes(horaFin);
    const duracionTotal = duracionTurno + descansoEntreTurnos;
    
    // Verificar que hay tiempo suficiente para al menos un turno
    if (finMinutos - inicioMinutos < duracionTurno) {
        return slots;
    }
    
    let tiempoActual = inicioMinutos;
    
    while (tiempoActual + duracionTurno <= finMinutos) {
        const inicioSlot = minutesToTime(tiempoActual);
        const finSlot = minutesToTime(tiempoActual + duracionTurno);
        
        slots.push({
            inicio: inicioSlot,
            fin: finSlot
        });
        
        tiempoActual += duracionTotal;
    }
    
    return slots;
}

// Convertir tiempo a minutos
function timeToMinutes(time) {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
}

// Convertir minutos a tiempo
function minutesToTime(minutes) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

// Guardar horario
async function guardarHorario() {
    try {
        console.log('💾 Guardando horario...');
        
        // Obtener datos del formulario
        const diaSemana = document.getElementById('diaSemana').value;
        const horaInicio = document.getElementById('horaInicio').value;
        const horaFin = document.getElementById('horaFin').value;
        const duracionTurno = document.getElementById('duracionTurno').value;
        const descansoEntreTurnos = document.getElementById('descansoEntreTurnos').value;
        const horarioActivo = document.getElementById('horarioActivo').checked;
        
        // Validaciones
        if (!diaSemana || !horaInicio || !horaFin || !duracionTurno) {
            showError('Por favor completa todos los campos obligatorios');
            return;
        }
        
        if (horaInicio >= horaFin) {
            showError('La hora de fin debe ser mayor que la hora de inicio');
            return;
        }
        
        // Verificar si ya existe un horario para este día
        const horarioExistente = horarios.find(h => h.dia_semana === diaSemana);
        if (horarioExistente) {
            showError(`Ya existe un horario configurado para ${diaSemana}. Por favor, elige otro día o modifica el horario existente.`);
            return;
        }
        
        // Verificar superposición de horarios (validación básica del lado del cliente)
        const horariosMismoDia = horarios.filter(h => h.dia_semana === diaSemana);
        for (const horario of horariosMismoDia) {
            if (horaInicio < horario.hora_fin && horaFin > horario.hora_inicio) {
                const horariosExistentes = horariosMismoDia.map(h => `${h.hora_inicio} - ${h.hora_fin}`).join(', ');
                showError(`El horario que intentas crear se superpone con horarios existentes para ${diaSemana}: ${horariosExistentes}. Por favor, elige un horario diferente.`);
                return;
            }
        }
        
        // Preparar datos para enviar
        const horarioData = {
            dia_semana: diaSemana,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            duracion_minutos: parseInt(duracionTurno),
            descanso_minutos: parseInt(descansoEntreTurnos),
            activo: horarioActivo
        };
        
        console.log('📋 Datos del horario:', horarioData);
        
        // Enviar al servidor
        const token = localStorage.getItem('token');
        const response = await fetch('/api/horarios/horario', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(horarioData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.log('📋 Error del servidor:', errorData);
            
            // Manejar errores específicos con mensajes más claros
            if (response.status === 400) {
                if (errorData.message && errorData.message.includes('superpone')) {
                    throw new Error('Ya existe un horario configurado que se superpone con el horario que intentas crear. Por favor, elige un horario diferente o modifica el horario existente.');
                } else if (errorData.message && errorData.message.includes('Ya existe')) {
                    throw new Error('Ya existe un horario configurado para este día de la semana. Por favor, elige otro día o modifica el horario existente.');
                } else {
                    throw new Error(errorData.message || 'Los datos ingresados no son válidos. Por favor, revisa la información.');
                }
            } else if (response.status === 401) {
                throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            } else if (response.status === 403) {
                throw new Error('No tienes permisos para realizar esta acción.');
            } else {
                throw new Error(errorData.message || `Error del servidor (${response.status}): ${response.statusText}`);
            }
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Horario guardado exitosamente:', data.data);
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('agregarHorarioModal'));
            modal.hide();
            
            // Recargar horarios
            await loadHorarios();
            
            // Actualizar estadísticas
            updateStatsDisplay();
            
            // Mostrar mensaje de éxito
            showSuccess(`Horario para ${diaSemana} creado exitosamente`);
            
        } else {
            throw new Error(data.message || 'Error al guardar horario');
        }
        
        } catch (error) {
            console.error('❌ Error guardando horario:', error);
            
            // Mostrar solo el mensaje del error, sin detalles técnicos
            const errorMessage = error.message || 'Error al guardar horario';
            showError(errorMessage);
        }
}

// Funciones de utilidad
function formatFecha(fecha) {
    // Parsear la fecha manualmente para evitar problemas de timezone
    // La fecha viene en formato YYYY-MM-DD
    const partes = fecha.split('-');
    const year = parseInt(partes[0]);
    const month = parseInt(partes[1]) - 1; // Los meses en JS van de 0-11
    const day = parseInt(partes[2]);
    
    const fechaObj = new Date(year, month, day);
    
    return fechaObj.toLocaleDateString('es-ES', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Funciones de modales
function showAddDiaNoLaboralModal() {
    console.log('📅 Mostrando modal agregar día no laboral');
    
    // Limpiar formulario
    document.getElementById('agregarDiaNoLaboralForm').reset();
    document.getElementById('agregarDiaNoLaboralAlert').classList.add('d-none');
    
    // Mostrar contenedores según tipo seleccionado
    updateTipoSeleccion();
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('agregarDiaNoLaboralModal'));
    modal.show();
}

// Actualizar tipo de selección
function updateTipoSeleccion() {
    const tipoSeleccion = document.querySelector('input[name="tipoSeleccion"]:checked').value;
    const diaUnicoContainer = document.getElementById('diaUnicoContainer');
    const rangoFechasContainer = document.getElementById('rangoFechasContainer');
    
    if (tipoSeleccion === 'unico') {
        diaUnicoContainer.style.display = 'block';
        rangoFechasContainer.style.display = 'none';
        document.getElementById('fechaNoLaboral').required = true;
        document.getElementById('fechaInicio').required = false;
        document.getElementById('fechaFin').required = false;
    } else {
        diaUnicoContainer.style.display = 'none';
        rangoFechasContainer.style.display = 'block';
        document.getElementById('fechaNoLaboral').required = false;
        document.getElementById('fechaInicio').required = true;
        document.getElementById('fechaFin').required = true;
    }
}

// Funciones de acciones
function editHorario(id) {
    console.log('✏️ Editando horario:', id);
    
    // Buscar el horario en la lista actual
    const horario = horarios.find(h => h.id === id);
    if (!horario) {
        showError('Horario no encontrado');
        return;
    }
    
    // Mostrar modal de edición
    showEditarHorarioModal(horario);
}

function deleteHorario(id) {
    console.log('🗑️ Eliminando horario:', id);
    
    // Buscar el horario en la lista actual
    const horario = horarios.find(h => h.id === id);
    if (!horario) {
        showError('Horario no encontrado');
        return;
    }
    
    // Confirmar eliminación
    const confirmMessage = `¿Estás seguro de que quieres eliminar el horario de ${horario.dia_semana} (${horario.hora_inicio} - ${horario.hora_fin})?\n\nEsta acción no se puede deshacer.`;
    
    if (confirm(confirmMessage)) {
        eliminarHorario(id);
    }
}

function editDiaNoLaboral(id) {
    console.log('✏️ Editando día no laboral:', id);
    showInfo('Función de editar día no laboral próximamente disponible');
}

// Toggle del botón eliminar seleccionados
function toggleEliminarButton() {
    const checkboxes = document.querySelectorAll('.dia-checkbox:checked');
    const eliminarBtn = document.getElementById('eliminarSeleccionadosBtn');
    
    if (checkboxes.length > 0) {
        eliminarBtn.style.display = 'inline-block';
        eliminarBtn.innerHTML = `<i class="fas fa-trash me-2"></i>Eliminar ${checkboxes.length} Seleccionados`;
    } else {
        eliminarBtn.style.display = 'none';
    }
}

// Mostrar modal de confirmación para eliminación múltiple
function mostrarModalEliminarSeleccionados() {
    const checkboxes = document.querySelectorAll('.dia-checkbox:checked');
    const idsSeleccionados = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (idsSeleccionados.length === 0) {
        showInfo('Selecciona al menos un día no laboral para eliminar');
        return;
    }
    
    // Obtener fechas de los días seleccionados
    const diasSeleccionados = diasNoLaborales.filter(dia => idsSeleccionados.includes(dia.id));
    
    // Actualizar modal
    document.getElementById('cantidadDiasEliminar').textContent = diasSeleccionados.length;
    
    // Mostrar lista de fechas
    const listaContainer = document.getElementById('listaDiasEliminar');
    listaContainer.innerHTML = '<ul class="list-group mt-3">';
    diasSeleccionados.forEach(dia => {
        // Parsear la fecha manualmente para evitar problemas de timezone
        const partes = dia.fecha.split('-');
        const year = parseInt(partes[0]);
        const month = parseInt(partes[1]) - 1;
        const day = parseInt(partes[2]);
        const fechaObj = new Date(year, month, day);
        
        const fechaFormateada = fechaObj.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        listaContainer.innerHTML += `
            <li class="list-group-item">
                <i class="fas fa-calendar-times me-2 text-danger"></i>
                <strong>${fechaFormateada}</strong>
                <span class="text-muted ms-2">- ${dia.motivo}</span>
            </li>
        `;
    });
    listaContainer.innerHTML += '</ul>';
    
    // Mostrar modal
    const modal = new bootstrap.Modal(document.getElementById('confirmarEliminarMultipleModal'));
    modal.show();
}

// Eliminar días seleccionados
async function eliminarDiasSeleccionados() {
    const checkboxes = document.querySelectorAll('.dia-checkbox:checked');
    const idsParaEliminar = Array.from(checkboxes).map(cb => parseInt(cb.value));
    
    if (idsParaEliminar.length === 0) {
        return;
    }
    
    try {
        const token = localStorage.getItem('token');
        let eliminados = 0;
        let errores = [];
        
        // Eliminar cada día
        for (const id of idsParaEliminar) {
            try {
                const response = await fetch(`/api/horarios/dia-no-laboral/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                
                if (response.ok) {
                    eliminados++;
                } else {
                    errores.push(`Día ${id}: Error`);
                }
            } catch (error) {
                errores.push(`Día ${id}: ${error.message}`);
            }
        }
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('confirmarEliminarMultipleModal'));
        modal.hide();
        
        // Desmarcar todos los checkboxes
        document.querySelectorAll('.dia-checkbox').forEach(cb => cb.checked = false);
        
        // Ocultar botón de eliminar
        document.getElementById('eliminarSeleccionadosBtn').style.display = 'none';
        
        // Recargar días no laborales
        await loadDiasNoLaborales();
        updateStatsDisplay();
        
        // Mostrar resultado
        if (errores.length === 0) {
            showSuccess(`${eliminados} día(s) no laboral(es) eliminado(s) exitosamente`);
        } else {
            showSuccess(`${eliminados} día(s) eliminado(s). Algunos errores: ${errores.join(', ')}`);
        }
        
    } catch (error) {
        console.error('Error eliminando días no laborales:', error);
        showError('Error al eliminar días no laborales');
    }
}

function deleteDiaNoLaboral(id) {
    console.log('🗑️ Eliminando día no laboral:', id);
    showInfo('Función de eliminar día no laboral próximamente disponible');
}

// Funciones de notificación
function showSuccess(message) {
    showAlert(message, 'success');
}

function showError(message) {
    showAlert(message, 'danger');
}

function showInfo(message) {
    showAlert(message, 'info');
}

function showAlert(message, type) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        <div class="d-flex align-items-center">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'danger' ? 'fa-exclamation-triangle' : 'fa-info-circle'} me-2"></i>
            <div class="flex-grow-1">${message}</div>
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Cerrar"></button>
        </div>
    `;
    
    // Insertar al inicio del container
    const container = document.querySelector('.container');
    if (container) {
        container.insertBefore(alertDiv, container.firstChild);
        
        // Auto-dismiss después de 7 segundos para errores, 5 para otros
        const dismissTime = type === 'danger' ? 7000 : 5000;
        setTimeout(() => {
            if (alertDiv.parentNode) {
                alertDiv.remove();
            }
        }, dismissTime);
    }
}

// Mostrar modal editar horario
function showEditarHorarioModal(horario) {
    console.log('📅 Mostrando modal editar horario:', horario);
    
    // Verificar que el modal existe
    const modalElement = document.getElementById('editarHorarioModal');
    console.log('🔍 Modal editarHorarioModal encontrado:', modalElement);
    
    if (!modalElement) {
        console.error('❌ No se encontró el modal editarHorarioModal');
        showError('Error: Modal de edición no encontrado');
        return;
    }
    
    // Llenar formulario con datos existentes
    try {
        document.getElementById('editarHorarioId').value = horario.id;
        
        // Establecer el día de la semana
        const diaSemanaSelect = document.getElementById('editarDiaSemana');
        if (diaSemanaSelect) {
            // Mapear días de la base de datos (con mayúscula) a valores del select (minúscula)
            const diaMapping = {
                'Lunes': 'lunes',
                'Martes': 'martes', 
                'Miércoles': 'miercoles',
                'Jueves': 'jueves',
                'Viernes': 'viernes',
                'Sábado': 'sabado',
                'Domingo': 'domingo'
            };
            
            const diaValue = diaMapping[horario.dia_semana] || horario.dia_semana.toLowerCase();
            diaSemanaSelect.value = diaValue;
        }
        
        document.getElementById('editarHoraInicio').value = horario.hora_inicio;
        document.getElementById('editarHoraFin').value = horario.hora_fin;
        document.getElementById('editarDuracionTurno').value = horario.duracion_minutos || 30;
        document.getElementById('editarDescansoEntreTurnos').value = horario.descanso_minutos || 0;
        document.getElementById('editarHorarioActivo').checked = horario.activo !== false;
        
        // Mostrar el día actual en el badge del título
        const diaActualElement = document.getElementById('editarDiaActual');
        if (diaActualElement) {
            diaActualElement.textContent = horario.dia_semana;
        }
        
        // Actualizar vista previa
        updateEditarVistaPrevia();
        
        // Mostrar modal
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        console.log('✅ Modal de editar horario mostrado exitosamente');
        
    } catch (error) {
        console.error('❌ Error llenando el formulario:', error);
        showError('Error al cargar los datos del horario');
    }
}

// Actualizar vista previa en modal de edición
function updateEditarVistaPrevia() {
    const container = document.getElementById('editarVistaPreviaSlots');
    if (!container) return;
    
    const diaSemana = document.getElementById('editarDiaSemana').value;
    const horaInicio = document.getElementById('editarHoraInicio').value;
    const horaFin = document.getElementById('editarHoraFin').value;
    const duracionTurno = document.getElementById('editarDuracionTurno').value;
    const descansoEntreTurnos = document.getElementById('editarDescansoEntreTurnos').value;
    
    // Verificar si todos los campos necesarios están completos
    if (!diaSemana || !horaInicio || !horaFin || !duracionTurno) {
        container.innerHTML = `
            <div class="text-center text-muted">
                <i class="fas fa-info-circle me-2"></i>
                Selecciona el día y horario para ver los turnos disponibles
            </div>
        `;
        return;
    }
    
    // Validar que la hora de fin sea mayor que la de inicio
    if (horaInicio >= horaFin) {
        container.innerHTML = `
            <div class="text-center text-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                La hora de fin debe ser mayor que la hora de inicio
            </div>
        `;
        return;
    }
    
    // Generar slots
    const slots = generarSlots(horaInicio, horaFin, parseInt(duracionTurno), parseInt(descansoEntreTurnos));
    
    if (slots.length === 0) {
        container.innerHTML = `
            <div class="text-center text-warning">
                <i class="fas fa-exclamation-triangle me-2"></i>
                No se pueden generar turnos con la configuración actual
            </div>
        `;
        return;
    }
    
    // Mostrar slots
    let html = `
        <div class="mb-2">
            <strong>Turnos disponibles para ${diaSemana}:</strong>
        </div>
        <div class="row g-2">
    `;
    
    slots.forEach((slot, index) => {
        html += `
            <div class="col-md-4 col-sm-6">
                <div class="slot-item bg-white border rounded p-2 text-center">
                    <small class="text-muted">Turno ${index + 1}</small><br>
                    <strong>${slot.inicio} - ${slot.fin}</strong>
                </div>
            </div>
        `;
    });
    
    html += `
        </div>
        <div class="mt-2">
            <small class="text-muted">
                <i class="fas fa-info-circle me-1"></i>
                Total: ${slots.length} turnos disponibles
            </small>
        </div>
    `;
    
    container.innerHTML = html;
}

// Actualizar horario
async function actualizarHorario() {
    try {
        console.log('💾 Actualizando horario...');
        
        // Obtener datos del formulario
        const id = document.getElementById('editarHorarioId').value;
        const diaSemana = document.getElementById('editarDiaSemana').value;
        const horaInicio = document.getElementById('editarHoraInicio').value;
        const horaFin = document.getElementById('editarHoraFin').value;
        const duracionTurno = document.getElementById('editarDuracionTurno').value;
        const descansoEntreTurnos = document.getElementById('editarDescansoEntreTurnos').value;
        const horarioActivo = document.getElementById('editarHorarioActivo').checked;
        
        // Validaciones
        if (!id) {
            showError('Error: ID del horario no encontrado');
            return;
        }
        
        if (!diaSemana || !horaInicio || !horaFin || !duracionTurno) {
            showError('Por favor completa todos los campos obligatorios');
            return;
        }
        
        if (horaInicio >= horaFin) {
            showError('La hora de fin debe ser mayor que la hora de inicio');
            return;
        }
        
        // Verificar si ya existe otro horario para este día (excluyendo el actual)
        const horarioExistente = horarios.find(h => h.dia_semana === diaSemana && h.id != id);
        if (horarioExistente) {
            showError(`Ya existe un horario configurado para ${diaSemana}. Por favor, elige otro día o modifica el horario existente.`);
            return;
        }
        
        // Verificar superposiciones con otros horarios (excluyendo el actual)
        const horariosMismoDia = horarios.filter(h => h.dia_semana === diaSemana && h.id != id);
        for (const horario of horariosMismoDia) {
            if (horaInicio < horario.hora_fin && horaFin > horario.hora_inicio) {
                const horariosExistentes = horariosMismoDia.map(h => `${h.hora_inicio} - ${h.hora_fin}`).join(', ');
                showError(`El horario que intentas actualizar se superpone con horarios existentes para ${diaSemana}: ${horariosExistentes}. Por favor, elige un horario diferente.`);
                return;
            }
        }
        
        // Preparar datos para enviar
        const horarioData = {
            dia_semana: diaSemana,
            hora_inicio: horaInicio,
            hora_fin: horaFin,
            duracion_minutos: parseInt(duracionTurno),
            descanso_minutos: parseInt(descansoEntreTurnos),
            activo: horarioActivo
        };
        
        console.log('📋 Datos del horario a actualizar:', horarioData);
        
        // Enviar al servidor
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/horarios/horario/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(horarioData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.log('📋 Error del servidor:', errorData);
            
            // Manejar errores específicos con mensajes más claros
            if (response.status === 400) {
                if (errorData.message && errorData.message.includes('superpone')) {
                    throw new Error('Ya existe un horario configurado que se superpone con el horario que intentas actualizar. Por favor, elige un horario diferente o modifica el horario existente.');
                } else if (errorData.message && errorData.message.includes('Ya existe')) {
                    throw new Error('Ya existe un horario configurado para este día de la semana. Por favor, elige otro día.');
                } else if (errorData.message && errorData.message.includes('posterior')) {
                    throw new Error('La hora de fin debe ser posterior a la hora de inicio.');
                } else {
                    throw new Error(errorData.message || 'Los datos ingresados no son válidos. Por favor, revisa la información.');
                }
            } else if (response.status === 401) {
                throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
            } else if (response.status === 403) {
                throw new Error('No tienes permisos para realizar esta acción.');
            } else if (response.status === 404) {
                throw new Error('Horario no encontrado.');
            } else {
                throw new Error(errorData.message || `Error del servidor (${response.status}): ${response.statusText}`);
            }
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Horario actualizado exitosamente:', data.data);
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editarHorarioModal'));
            modal.hide();
            
            // Recargar horarios
            await loadHorarios();
            
            // Actualizar estadísticas
            updateStatsDisplay();
            
            // Mostrar mensaje de éxito
            showSuccess(`Horario para ${diaSemana} actualizado exitosamente`);
            
        } else {
            throw new Error(data.message || 'Error al actualizar horario');
        }
        
        } catch (error) {
            console.error('❌ Error actualizando horario:', error);
            
            // Mostrar solo el mensaje del error, sin detalles técnicos
            const errorMessage = error.message || 'Error al actualizar horario';
            showError(errorMessage);
        }
}

// Eliminar horario del servidor
async function eliminarHorario(id) {
    try {
        console.log('💾 Eliminando horario del servidor...');
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/horarios/horario/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.log('📋 Error del servidor:', errorData);
            
            if (response.status === 401) {
                throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente');
            } else if (response.status === 403) {
                throw new Error('No tienes permisos para realizar esta acción');
            } else if (response.status === 404) {
                throw new Error('Horario no encontrado');
            } else {
                throw new Error(errorData.message || `Error del servidor (${response.status})`);
            }
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Horario eliminado exitosamente');
            
            // Recargar horarios
            await loadHorarios();
            
            // Actualizar estadísticas
            updateStatsDisplay();
            
            // Mostrar mensaje de éxito
            showSuccess('Horario eliminado exitosamente');
            
        } else {
            throw new Error(data.message || 'Error al eliminar horario');
        }
        
        } catch (error) {
            console.error('❌ Error eliminando horario:', error);
            
            // Mostrar solo el mensaje del error, sin detalles técnicos
            const errorMessage = error.message || 'Error al eliminar horario';
            showError(errorMessage);
        }
}

// Configurar event delegation para botones dinámicos
function setupEventDelegation() {
    // Event delegation para botones de horarios
    document.addEventListener('click', function(e) {
        // Verificar si el click fue en un botón de editar horario
        if (e.target.matches('[data-action="edit-horario"]') || e.target.closest('[data-action="edit-horario"]')) {
            const button = e.target.matches('[data-action="edit-horario"]') ? e.target : e.target.closest('[data-action="edit-horario"]');
            const id = parseInt(button.getAttribute('data-id'));
            console.log('🖱️ Botón editar horario clickeado:', id);
            editHorario(id);
        }
        
        // Verificar si el click fue en un botón de eliminar horario
        if (e.target.matches('[data-action="delete-horario"]') || e.target.closest('[data-action="delete-horario"]')) {
            const button = e.target.matches('[data-action="delete-horario"]') ? e.target : e.target.closest('[data-action="delete-horario"]');
            const id = parseInt(button.getAttribute('data-id'));
            console.log('🖱️ Botón eliminar horario clickeado:', id);
            deleteHorario(id);
        }
        
        // Verificar si el click fue en un botón de editar día no laboral
        if (e.target.matches('[data-action="edit-dia-no-laboral"]') || e.target.closest('[data-action="edit-dia-no-laboral"]')) {
            const button = e.target.matches('[data-action="edit-dia-no-laboral"]') ? e.target : e.target.closest('[data-action="edit-dia-no-laboral"]');
            const id = parseInt(button.getAttribute('data-id'));
            console.log('🖱️ Botón editar día no laboral clickeado:', id);
            editDiaNoLaboral(id);
        }
        
        // Verificar si el click fue en un botón de eliminar día no laboral
        if (e.target.matches('[data-action="delete-dia-no-laboral"]') || e.target.closest('[data-action="delete-dia-no-laboral"]')) {
            const button = e.target.matches('[data-action="delete-dia-no-laboral"]') ? e.target : e.target.closest('[data-action="delete-dia-no-laboral"]');
            const id = parseInt(button.getAttribute('data-id'));
            console.log('🖱️ Botón eliminar día no laboral clickeado:', id);
            deleteDiaNoLaboral(id);
        }
    });
    
    console.log('✅ Event delegation configurado para botones dinámicos');
}

// Funciones para días no laborales
function showModalAlert(modalId, alertId, textId, message) {
    const alertElement = document.getElementById(alertId);
    const textElement = document.getElementById(textId);
    
    if (alertElement && textElement) {
        textElement.textContent = message;
        alertElement.classList.remove('d-none');
        
        // Scroll al inicio del modal para mostrar la alerta
        const modalElement = document.getElementById(modalId);
        if (modalElement) {
            modalElement.scrollTop = 0;
        }
    }
}

function hideModalAlert(alertId) {
    const alertElement = document.getElementById(alertId);
    if (alertElement) {
        alertElement.classList.add('d-none');
    }
}

function showAddDiaNoLaboralModal() {
    console.log('📅 Mostrando modal agregar día no laboral');
    
    // Verificar que el modal existe
    const modalElement = document.getElementById('agregarDiaNoLaboralModal');
    console.log('🔍 Modal agregarDiaNoLaboralModal encontrado:', modalElement);
    
    if (!modalElement) {
        console.error('❌ No se encontró el modal agregarDiaNoLaboralModal');
        showError('Error: Modal de agregar día no laboral no encontrado');
        return;
    }
    
    try {
        // Ocultar alerta previa
        hideModalAlert('agregarDiaNoLaboralAlert');
        
        // Limpiar formulario
        document.getElementById('agregarDiaNoLaboralForm').reset();
        document.getElementById('diaNoLaboralActivo').checked = true;
        document.getElementById('vacaciones').checked = true;
        
        // Establecer fecha mínima como hoy
        const hoy = new Date();
        const fechaMinima = hoy.toISOString().split('T')[0];
        document.getElementById('fechaNoLaboral').min = fechaMinima;
        
        console.log('✅ Formulario limpiado y fecha mínima establecida');
        
        // Mostrar modal
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        console.log('✅ Modal de agregar día no laboral mostrado exitosamente');
        
    } catch (error) {
        console.error('❌ Error mostrando el modal:', error);
        showError('Error al mostrar el modal de agregar día no laboral');
    }
}

async function guardarDiaNoLaboral() {
    try {
        console.log('💾 Guardando día no laboral...');
        
        // Obtener tipo de selección
        const tipoSeleccion = document.querySelector('input[name="tipoSeleccion"]:checked').value;
        const motivo = document.getElementById('motivoNoLaboral').value.trim();
        const activo = document.getElementById('diaNoLaboralActivo')?.checked !== false;
        
        // Ocultar alerta previa
        hideModalAlert('agregarDiaNoLaboralAlert');
        
        // Validaciones
        if (!motivo) {
            showModalAlert('agregarDiaNoLaboralModal', 'agregarDiaNoLaboralAlert', 'agregarDiaNoLaboralAlertText', 'Por favor ingresa un motivo');
            return;
        }
        
        let fechasParaAgregar = [];
        
        if (tipoSeleccion === 'unico') {
            // Día único
            const fecha = document.getElementById('fechaNoLaboral').value;
            if (!fecha) {
                showModalAlert('agregarDiaNoLaboralModal', 'agregarDiaNoLaboralAlert', 'agregarDiaNoLaboralAlertText', 'Por favor selecciona una fecha');
                return;
            }
            fechasParaAgregar.push(fecha);
        } else {
            // Rango de fechas
            const fechaInicio = document.getElementById('fechaInicio').value;
            const fechaFin = document.getElementById('fechaFin').value;
            
            if (!fechaInicio || !fechaFin) {
                showModalAlert('agregarDiaNoLaboralModal', 'agregarDiaNoLaboralAlert', 'agregarDiaNoLaboralAlertText', 'Por favor completa las fechas de inicio y fin');
                return;
            }
            
            if (fechaInicio > fechaFin) {
                showModalAlert('agregarDiaNoLaboralModal', 'agregarDiaNoLaboralAlert', 'agregarDiaNoLaboralAlertText', 'La fecha de inicio debe ser anterior a la fecha de fin');
                return;
            }
            
            // Generar rango de fechas
            // Parsear fechas manualmente para evitar problemas de timezone
            const partesInicio = fechaInicio.split('-');
            const partesFin = fechaFin.split('-');
            
            const inicio = new Date(
                parseInt(partesInicio[0]),
                parseInt(partesInicio[1]) - 1,
                parseInt(partesInicio[2])
            );
            
            const fin = new Date(
                parseInt(partesFin[0]),
                parseInt(partesFin[1]) - 1,
                parseInt(partesFin[2])
            );
            
            // Iterar día por día
            const currentDate = new Date(inicio);
            while (currentDate <= fin) {
                const fechaStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                fechasParaAgregar.push(fechaStr);
                currentDate.setDate(currentDate.getDate() + 1);
            }
        }
        
        console.log(`📅 Fechas a agregar: ${fechasParaAgregar.length}`);
        
        // Verificar duplicados
        const fechasExistentes = diasNoLaborales.map(d => d.fecha);
        const fechasDuplicadas = fechasParaAgregar.filter(f => fechasExistentes.includes(f));
        
        if (fechasDuplicadas.length > 0) {
            showModalAlert('agregarDiaNoLaboralModal', 'agregarDiaNoLaboralAlert', 'agregarDiaNoLaboralAlertText', `Ya existen días no laborales configurados para algunas de estas fechas`);
            return;
        }
        
        // Preparar datos para enviar (una entrada por fecha)
        const diasData = fechasParaAgregar.map(fecha => ({
            fecha: fecha,
            motivo: motivo,
            activo: activo
        }));
        
        console.log('📋 Enviando días no laborales:', diasData.length);
        
        // Enviar al servidor (uno por uno o en batch según el endpoint)
        const token = localStorage.getItem('token');
        
        // Para cada fecha, crear el día no laboral
        let diasCreados = 0;
        let errores = [];
        
        for (const diaData of diasData) {
            try {
                const response = await fetch('/api/horarios/dia-no-laboral', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(diaData)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    errores.push(`${diaData.fecha}: ${errorData.message || 'Error'}`);
                } else {
                    diasCreados++;
                }
            } catch (error) {
                errores.push(`${diaData.fecha}: ${error.message}`);
            }
        }
        
        // Verificar resultados
        if (errores.length > 0) {
            console.error('❌ Errores al crear días:', errores);
            showModalAlert('agregarDiaNoLaboralModal', 'agregarDiaNoLaboralAlert', 'agregarDiaNoLaboralAlertText', `Se crearon ${diasCreados} días. Errores: ${errores.join(', ')}`);
            if (diasCreados > 0) {
                // Recargar días no laborales
                await loadDiasNoLaborales();
                updateStatsDisplay();
            }
            return;
        }
        
        // Todos los días se crearon exitosamente
        console.log(`✅ Se crearon ${diasCreados} días no laborales exitosamente`);
        
        // Cerrar modal
        const modal = bootstrap.Modal.getInstance(document.getElementById('agregarDiaNoLaboralModal'));
        modal.hide();
        
        // Limpiar formulario
        document.getElementById('agregarDiaNoLaboralForm').reset();
        document.getElementById('diaUnico').checked = true;
        updateTipoSeleccion();
        
        // Recargar días no laborales
        await loadDiasNoLaborales();
        
        // Actualizar estadísticas
        updateStatsDisplay();
        
        // Mostrar mensaje de éxito
        const mensaje = diasCreados === 1 
            ? `Día no laboral creado exitosamente` 
            : `${diasCreados} días no laborales creados exitosamente`;
        showSuccess(mensaje);
        
        } catch (error) {
            console.error('❌ Error guardando día no laboral:', error);
            
            // Mostrar solo el mensaje del error, sin detalles técnicos
            const errorMessage = error.message || 'Error al guardar día no laboral';
            showModalAlert('agregarDiaNoLaboralModal', 'agregarDiaNoLaboralAlert', 'agregarDiaNoLaboralAlertText', errorMessage);
        }
}

function editDiaNoLaboral(id) {
    console.log('✏️ Editando día no laboral:', id);
    
    // Buscar el día en la lista actual
    const dia = diasNoLaborales.find(d => d.id === id);
    if (!dia) {
        showError('Día no laboral no encontrado');
        return;
    }
    
    // Mostrar modal de edición
    showEditarDiaNoLaboralModal(dia);
}

function deleteDiaNoLaboral(id) {
    console.log('🗑️ Eliminando día no laboral:', id);
    
    // Buscar el día en la lista actual
    const dia = diasNoLaborales.find(d => d.id === id);
    if (!dia) {
        showError('Día no laboral no encontrado');
        return;
    }
    
    // Confirmar eliminación
    const fechaFormateada = new Date(dia.fecha).toLocaleDateString('es-ES');
    const confirmMessage = `¿Estás seguro de que quieres eliminar el día no laboral del ${fechaFormateada}?\n\nMotivo: ${dia.motivo}\n\nEsta acción no se puede deshacer.`;
    
    if (confirm(confirmMessage)) {
        eliminarDiaNoLaboral(id);
    }
}

function showEditarDiaNoLaboralModal(dia) {
    console.log('📅 Mostrando modal editar día no laboral:', dia);
    
    // Verificar que el modal existe
    const modalElement = document.getElementById('editarDiaNoLaboralModal');
    console.log('🔍 Modal editarDiaNoLaboralModal encontrado:', modalElement);
    
    if (!modalElement) {
        console.error('❌ No se encontró el modal editarDiaNoLaboralModal');
        showError('Error: Modal de edición no encontrado');
        return;
    }
    
    // Llenar formulario con datos existentes
    try {
        // Ocultar alerta previa
        hideModalAlert('editarDiaNoLaboralAlert');
        
        document.getElementById('editarDiaNoLaboralId').value = dia.id;
        document.getElementById('editarFechaNoLaboral').value = dia.fecha;
        document.getElementById('editarMotivoNoLaboral').value = dia.motivo || '';
        document.getElementById('editarDiaNoLaboralActivo').checked = dia.activo !== false;
        
        // Determinar tipo de día basado en el motivo
        const motivo = dia.motivo.toLowerCase();
        if (motivo.includes('vacacion')) {
            document.getElementById('editarVacaciones').checked = true;
        } else if (motivo.includes('feriado') || motivo.includes('feriado')) {
            document.getElementById('editarFeriado').checked = true;
        } else {
            document.getElementById('editarOtro').checked = true;
        }
        
        console.log('✅ Formulario llenado con datos del día no laboral');
        
        // Mostrar modal
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
        
        console.log('✅ Modal de editar día no laboral mostrado exitosamente');
        
    } catch (error) {
        console.error('❌ Error llenando el formulario:', error);
        showError('Error al cargar los datos del día no laboral');
    }
}

async function actualizarDiaNoLaboral() {
    try {
        console.log('💾 Actualizando día no laboral...');
        
        // Obtener datos del formulario
        const id = document.getElementById('editarDiaNoLaboralId').value;
        const fecha = document.getElementById('editarFechaNoLaboral').value;
        const motivo = document.getElementById('editarMotivoNoLaboral').value.trim();
        const activo = document.getElementById('editarDiaNoLaboralActivo').checked;
        
        // Obtener tipo de día seleccionado
        const tipoDiaElement = document.querySelector('input[name="editarTipoDia"]:checked');
        const tipoDia = tipoDiaElement ? tipoDiaElement.value : 'otro';
        
        // Ocultar alerta previa
        hideModalAlert('editarDiaNoLaboralAlert');
        
        // Validaciones
        if (!id) {
            showModalAlert('editarDiaNoLaboralModal', 'editarDiaNoLaboralAlert', 'editarDiaNoLaboralAlertText', 'Error: ID del día no laboral no encontrado');
            return;
        }
        
        if (!fecha || !motivo) {
            showModalAlert('editarDiaNoLaboralModal', 'editarDiaNoLaboralAlert', 'editarDiaNoLaboralAlertText', 'Por favor completa todos los campos obligatorios');
            return;
        }
        
        // Verificar si ya existe otro día no laboral para esta fecha (excluyendo el actual)
        const diaExistente = diasNoLaborales.find(d => d.fecha === fecha && d.id != id);
        if (diaExistente) {
            const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES');
            showModalAlert('editarDiaNoLaboralModal', 'editarDiaNoLaboralAlert', 'editarDiaNoLaboralAlertText', `Ya existe un día no laboral configurado para el ${fechaFormateada}. Por favor, elige otra fecha.`);
            return;
        }
        
        // Preparar datos para enviar
        const diaData = {
            fecha: fecha,
            motivo: motivo,
            activo: activo
        };
        
        console.log('📋 Datos del día no laboral a actualizar:', diaData);
        
        // Enviar al servidor
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/horarios/dia-no-laboral/${id}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(diaData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.log('📋 Error del servidor:', errorData);
            
            // Manejar errores específicos con mensajes más claros
            if (response.status === 400) {
                if (errorData.message && errorData.message.includes('Ya existe')) {
                    showModalAlert('editarDiaNoLaboralModal', 'editarDiaNoLaboralAlert', 'editarDiaNoLaboralAlertText', 'Ya existe un día no laboral configurado para esta fecha. Por favor, elige otra fecha.');
                    return;
                } else {
                    showModalAlert('editarDiaNoLaboralModal', 'editarDiaNoLaboralAlert', 'editarDiaNoLaboralAlertText', errorData.message || 'Los datos ingresados no son válidos. Por favor, revisa la información.');
                    return;
                }
            } else if (response.status === 401) {
                showModalAlert('editarDiaNoLaboralModal', 'editarDiaNoLaboralAlert', 'editarDiaNoLaboralAlertText', 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.');
                return;
            } else if (response.status === 403) {
                showModalAlert('editarDiaNoLaboralModal', 'editarDiaNoLaboralAlert', 'editarDiaNoLaboralAlertText', 'No tienes permisos para realizar esta acción.');
                return;
            } else if (response.status === 404) {
                showModalAlert('editarDiaNoLaboralModal', 'editarDiaNoLaboralAlert', 'editarDiaNoLaboralAlertText', 'Día no laboral no encontrado.');
                return;
            } else {
                showModalAlert('editarDiaNoLaboralModal', 'editarDiaNoLaboralAlert', 'editarDiaNoLaboralAlertText', errorData.message || `Error del servidor (${response.status}): ${response.statusText}`);
                return;
            }
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Día no laboral actualizado exitosamente:', data.data);
            
            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editarDiaNoLaboralModal'));
            modal.hide();
            
            // Recargar días no laborales
            await loadDiasNoLaborales();
            
            // Actualizar estadísticas
            updateStatsDisplay();
            
            // Mostrar mensaje de éxito
            const fechaFormateada = new Date(fecha).toLocaleDateString('es-ES');
            showSuccess(`Día no laboral del ${fechaFormateada} actualizado exitosamente`);
            
        } else {
            throw new Error(data.message || 'Error al actualizar día no laboral');
        }
        
        } catch (error) {
            console.error('❌ Error actualizando día no laboral:', error);
            
            // Mostrar solo el mensaje del error, sin detalles técnicos
            const errorMessage = error.message || 'Error al actualizar día no laboral';
            showModalAlert('editarDiaNoLaboralModal', 'editarDiaNoLaboralAlert', 'editarDiaNoLaboralAlertText', errorMessage);
        }
}

async function eliminarDiaNoLaboral(id) {
    try {
        console.log('💾 Eliminando día no laboral del servidor...');
        
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/horarios/dia-no-laboral/${id}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.log('📋 Error del servidor:', errorData);
            
            if (response.status === 401) {
                throw new Error('Tu sesión ha expirado. Por favor, inicia sesión nuevamente');
            } else if (response.status === 403) {
                throw new Error('No tienes permisos para realizar esta acción');
            } else if (response.status === 404) {
                throw new Error('Día no laboral no encontrado');
            } else {
                throw new Error(errorData.message || `Error del servidor (${response.status})`);
            }
        }
        
        const data = await response.json();
        
        if (data.success) {
            console.log('✅ Día no laboral eliminado exitosamente');
            
            // Recargar días no laborales
            await loadDiasNoLaborales();
            
            // Actualizar estadísticas
            updateStatsDisplay();
            
            // Mostrar mensaje de éxito
            showSuccess('Día no laboral eliminado exitosamente');
            
        } else {
            throw new Error(data.message || 'Error al eliminar día no laboral');
        }
        
        } catch (error) {
            console.error('❌ Error eliminando día no laboral:', error);
            
            // Mostrar solo el mensaje del error, sin detalles técnicos
            const errorMessage = error.message || 'Error al eliminar día no laboral';
            showError(errorMessage);
        }
}

console.log('✅ Sistema de Horarios JavaScript cargado');
