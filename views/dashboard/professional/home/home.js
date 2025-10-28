/**
 * Funcionalidad para la Sección de Inicio del Dashboard Profesional
 */

let homeChart = null;
let updateDateTimeInterval = null;

// Inicializar la sección de inicio
async function initializeHomeSection() {
    console.log('🏠 Inicializando sección de inicio...');
    
    // Configurar event listeners
    setupHomeEventListeners();
    
    // Cargar zona horaria del profesional
    await loadProfessionalTimezone();
    
    // Cargar datos de estadísticas - DESHABILITADO
    // await loadHomeStatistics();
    
    // Actualizar fecha y hora actual
    startDateTimeUpdates();
    
    // Cargar actividad reciente
    await loadRecentActivity();
    
    // Cargar próximas citas
    await loadUpcomingAppointments();
    
    // Inicializar gráfico de consultas semanales
    await initializeWeeklyChart();
    
    console.log('✅ Sección de inicio inicializada correctamente');
}

// Variable global para almacenar la zona horaria del profesional
let professionalTimezone = 'UTC';

// Cargar zona horaria del profesional
async function loadProfessionalTimezone() {
    try {
        const userData = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        
        if (!userData || !userData.id || !token) {
            console.warn('⚠️ No hay datos de usuario o token, usando zona horaria por defecto');
            professionalTimezone = 'UTC';
            return;
        }
        
        console.log('🕐 Cargando zona horaria del profesional...');
        const professionalInfo = await fetchProfessionalInfo(userData.id, token);
        
        professionalTimezone = professionalInfo.timezone || 'UTC';
        console.log('✅ Zona horaria del profesional cargada:', professionalTimezone);
        
    } catch (error) {
        console.error('❌ Error cargando zona horaria del profesional:', error);
        professionalTimezone = 'UTC';
    }
}

// Cargar estadísticas principales - DESHABILITADO
/*
async function loadHomeStatistics() {
    try {
        console.log('📊 Cargando estadísticas del dashboard...');
        
        const userData = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        
        if (!userData || !userData.id) {
            throw new Error('No hay datos de usuario válidos');
        }
        
        // Obtener información del profesional con timezone
        const professionalInfo = await fetchProfessionalInfo(userData.id, token);
        console.log('👨‍⚕️ Información del profesional:', professionalInfo);
        
        // Guardar timezone globalmente
        professionalTimezone = professionalInfo.timezone || 'UTC';
        console.log('🕐 Timezone del profesional guardado globalmente:', professionalTimezone);
        
        // Mostrar estado de carga
        showLoadingState();
        
        // Cargar estadísticas en paralelo
        const [patientsStats, consultationsStats, todayStats] = await Promise.all([
            fetchProfessionalPatients(userData.id, token),
            fetchWeeklyConsultations(userData.id, token),
            fetchTodayConsultations(userData.id, token, professionalTimezone)
        ]);
        
        // Actualizar UI con los datos
        updateStatisticsUI({
            totalPatients: patientsStats.total || 0,
            todayConsultations: todayStats.total || 0,
            pendingTasks: calculatePendingTasks(consultationsStats)
        });
        
    } catch (error) {
        console.error('❌ Error cargando estadísticas:', error);
        showErrorState();
    }
}
*/

// Fetch de información del profesional
async function fetchProfessionalInfo(professionalId, token) {
    try {
        console.log('👨‍⚕️ Obteniendo información del profesional ID:', professionalId);
        
        const response = await fetch(`/api/profesionales/${professionalId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Respuesta de API profesional:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📊 Datos del profesional recibidos:', data);
            const professionalData = data.data || { timezone: 'UTC' };
            console.log('🕐 Timezone del profesional:', professionalData.timezone);
            return professionalData;
        } else {
            console.warn('⚠️ Error en respuesta de API profesional:', response.status);
        }
        
        return { timezone: 'UTC' };
    } catch (error) {
        console.warn('⚠️ Error obteniendo información del profesional:', error);
        return { timezone: 'UTC' };
    }
}

// Fetch de pacientes del profesional
async function fetchProfessionalPatients(professionalId, token) {
    try {
        const response = await fetch(`/api/usuarios/profesional/${professionalId}/pacientes`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return { total: Array.isArray(data.data) ? data.data.length : 0 };
        }
        
        return { total: 0 };
    } catch (error) {
        console.warn('⚠️ Error obteniendo pacientes:', error);
        return { total: 0 };
    }
}

// Fetch de consultas de la semana
async function fetchWeeklyConsultations(professionalId, token) {
    try {
        const startOfWeek = getStartOfWeek();
        const endOfWeek = getEndOfWeek();
        
        const response = await fetch(`/api/agenda/profesional/${professionalId}/consultas/rango?fechaInicio=${startOfWeek}&fechaFin=${endOfWeek}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            return { consultations: Array.isArray(data.data) ? data.data : [] };
        }
        
        return { consultations: [] };
    } catch (error) {
        console.warn('⚠️ Error obteniendo consultas semanales:', error);
        return { consultations: [] };
    }
}

// Fetch de consultas de hoy
async function fetchTodayConsultations(professionalId, token, timezone = 'UTC') {
    try {
        const today = getTodayInTimezone(timezone);
        console.log('📅 Buscando consultas para hoy (zona horaria del profesional):', today, 'Timezone:', timezone);
        
        const apiUrl = `/api/agenda/profesional/${professionalId}/consultas/fecha/${today}`;
        console.log('🔗 URL de API:', apiUrl);
        
        const response = await fetch(apiUrl, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        console.log('📡 Respuesta de API consultas:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('📊 Consultas de hoy encontradas:', data.data);
            console.log('📈 Total de consultas:', Array.isArray(data.data) ? data.data.length : 0);
            return { total: Array.isArray(data.data) ? data.data.length : 0, consultations: Array.isArray(data.data) ? data.data : [] };
        } else {
            console.warn('⚠️ Error en respuesta de API consultas:', response.status);
        }
        
        return { total: 0, consultations: [] };
    } catch (error) {
        console.warn('⚠️ Error obteniendo consultas de hoy:', error);
        return { total: 0, consultations: [] };
    }
}

// Actualizar UI con estadísticas - DESHABILITADO
/*
function updateStatisticsUI(stats) {
    console.log('🎨 Actualizando UI con estadísticas:', stats);
    
    // Total de pacientes
    const totalPatientsElement = document.getElementById('homeTotalPatients');
    if (totalPatientsElement) {
        totalPatientsElement.textContent = stats.totalPatients;
        console.log('✅ Total pacientes actualizado:', stats.totalPatients);
    } else {
        console.error('❌ Elemento homeTotalPatients no encontrado');
    }
    
    // Consultas de hoy
    const todayConsultationsElement = document.getElementById('homeTodayConsultations');
    if (todayConsultationsElement) {
        todayConsultationsElement.textContent = stats.todayConsultations;
        console.log('✅ Consultas hoy actualizado:', stats.todayConsultations);
    } else {
        console.error('❌ Elemento homeTodayConsultations no encontrado');
    }
    
    // Tareas pendientes
    const pendingTasksElement = document.getElementById('homePendingTasks');
    if (pendingTasksElement) {
        pendingTasksElement.textContent = stats.pendingTasks;
        console.log('✅ Tareas pendientes actualizado:', stats.pendingTasks);
    } else {
        console.error('❌ Elemento homePendingTasks no encontrado');
    }
    
    // Remover estado de carga
    removeLoadingState();
}
*/

// Mostrar estado de carga - DESHABILITADO
/*
function showLoadingState() {
    const elements = ['homeTotalPatients', 'homeTodayConsultations', 'homePendingTasks'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.add('loading');
            element.textContent = '--';
        }
    });
}
*/

// Remover estado de loading - DESHABILITADO
/*
function removeLoadingState() {
    const elements = ['homeTotalPatients', 'homeTodayConsultations', 'homePendingTasks'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.classList.remove('loading');
        }
    });
}
*/

// Mostrar estado de error - DESHABILITADO
/*
function showErrorState() {
    const elements = ['homeTotalPatients', 'homeTodayConsultations', 'homePendingTasks'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '-';
            element.title = 'Error al cargar datos';
        }
    });
}
*/

// Calcular tareas pendientes
function calculatePendingTasks(consultationsData) {
    if (!consultationsData.consultations) return 0;
    
    return consultationsData.consultations.filter(cons => 
        cons.estado === 'pendiente' || cons.estado === 'programada'
    ).length;
}

// Calcular progreso semanal

// Cargar actividad reciente
async function loadRecentActivity() {
    try {
        console.log('📝 Cargando actividad reciente...');
        
        const userData = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        
        if (!userData || !userData.id || !token) {
            throw new Error('No hay datos de usuario o token válidos');
        }
        
        // Obtener actividad real desde múltiples fuentes
        const activities = await fetchRealActivities(userData.id, token);
        
        // Actualizar el UI con datos reales
        updateActivityUI(activities);
        
        console.log('✅ Actividad reciente cargada:', activities.length);
        
    } catch (error) {
        console.error('❌ Error cargando actividad reciente:', error);
        showActivityError();
    }
}

// Obtener actividades reales desde múltiples APIs
async function fetchRealActivities(professionalId, token) {
    const activities = [];
    const now = new Date();
    
    try {
        // Obtener actividades de los últimos 14 días para más contexto
        const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 + 60 * 1000);
        const endDate = new Date(now).toISOString().split('T')[0];
        
        // Obtener datos en paralelo para mejor rendimiento
        const [consultasData, pacientesData] = await Promise.allSettled([
            // 1. Consultas recientes
            fetch(`/api/agenda/profesional/${professionalId}/consultas/rango?fechaInicio=${twoWeeksAgo.toISOString().split('T')[0]}&fechaFin=${endDate}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            }),
            // 2. Pacientes recientes  
            fetch(`/api/usuarios/profesional/${professionalId}/pacientes`, {
                headers: { 'Authorization': `Bearer ${token}` }
            })
            // Nota: Endpoints de antropometría, planes, laboratorio y evolución comentados 
            // hasta que estén implementados en el backend
        ]);
        
        // Procesar consultas
        if (consultasData.status === 'fulfilled' && consultasData.value.ok) {
            const consultas = await consultasData.value.json();
            const consultasList = consultas.data || [];
            
            console.log('📅 Datos de consultas recibidos:', consultasList.slice(0, 2)); // Debug: primeros 2 elementos
            
            consultasList.forEach(consulta => {
                const fechaConsulta = dayjs(`${consulta.fecha}T${consulta.hora}`);
                const timeDiff = dayjs().diff(fechaConsulta, 'days');
                
                // Solo mostrar consultas de los últimos 3 días
                if (timeDiff <= 3) {
                    // Determinar el nombre del paciente correctamente
                    let pacienteNombre = 'Paciente externo';
                    if (consulta.paciente_nombre) {
                        pacienteNombre = consulta.paciente_nombre;
                    } else if (consulta.paciente_externo_nombre) {
                        pacienteNombre = consulta.paciente_externo_nombre;
                    } else if (consulta.usuario_id) {
                        pacienteNombre = 'Paciente registrado'; // Fallback si no tiene nombre claro
                    }
                    
                    console.log('🔍 Consulta procesada:', { 
                        paciente_nombre: consulta.paciente_nombre, 
                        paciente_externo_nombre: consulta.paciente_externo_nombre,
                        usuario_id: consulta.usuario_id,
                        final: pacienteNombre 
                    });
                    
                    activities.push({
                        id: `consulta_${consulta.id}`,
                        type: 'consulta',
                        title: getConsultaTitle(consulta.estado),
                        description: `${pacienteNombre} - ${consulta.tipo_consulta || 'Consulta general'}`,
                        time: consulta.hora,
                        timestamp: fechaConsulta,
                        agoText: formatTimeAgo(fechaConsulta),
                        icon: getConsultaIcon(consulta.estado),
                        iconClass: getConsultaIconClass(consulta.estado),
                        badge: consulta.hora,
                        detail: `Estado: ${getStatusText(consulta.estado)}`
                    });
                }
            });
        }
        
        // Procesar pacientes nuevos (últimos 7 días)
        if (pacientesData.status === 'fulfilled' && pacientesData.value.ok) {
            const pacientes = await pacientesData.value.json();
            const pacientesList = pacientes.data || [];
            
            console.log('👥 Datos de pacientes recibidos:', pacientesList.slice(0, 2)); // Debug: primeros 2 elementos
            
            const weekAgo = dayjs().subtract(7, 'days');
            
            pacientesList.filter(paciente => {
                const creadoEn = dayjs(paciente.creado_en);
                return creadoEn.isAfter(weekAgo) && !activities.some(act => act.id === `paciente_${paciente.id}`);
            }).forEach(paciente => {
                const creadoEn = dayjs(paciente.creado_en);
                
                // Usar apellido_nombre que es el campo correcto en la base de datos
                let nombrePaciente = paciente.apellido_nombre || '';
                if (!nombrePaciente) {
                    // Fallback si está vacío
                    nombrePaciente = 'Nuevo paciente';
                }
                
                activities.push({
                    id: `paciente_${paciente.id}`,
                    type: 'paciente',
                    title: 'Nuevo paciente registrado',
                    description: nombrePaciente,
                    time: creadoEn.format('HH:mm'),
                    timestamp: creadoEn,
                    agoText: formatTimeAgo(creadoEn),
                    icon: 'fas fa-user-plus',
                    iconClass: 'bg-success',
                    badge: creadoEn.format('DD/MM'),
                    detail: `DNI: ${paciente.numero_documento || 'No registrado'}`
                });
            });
        }
        
        // Nota: Procesamiento de antropometría removido temporalmente hasta implementar endpoint
        
        // Ordenar por timestamp descendente (más recientes primero)
        activities.sort((a, b) => b.timestamp - a.timestamp);
        
        // Limitar a 6 actividades para mejor visualización
        return activities.slice(0, 6);
        
    } catch (error) {
        console.warn('⚠️ Error obteniendo actividades:', error);
        return [];
    }
}

// Función para formatear tiempo relativo de manera más natural
function formatTimeAgo(dateTime) {
    const now = dayjs();
    const diffHours = now.diff(dateTime, 'hours');
    const diffDays = now.diff(dateTime, 'days');
    
    if (diffHours < 1) {
        const diffMinutes = now.diff(dateTime, 'minutes');
        return diffMinutes <= 0 ? 'ahora mismo' : `hace ${diffMinutes} min`;
    } else if (diffHours < 24) {
        return `hace ${diffHours}h`;
    } else if (diffDays === 1) {
        return 'ayer';
    } else if (diffDays < 7) {
        return `hace ${diffDays} días`;
    } else {
        return dateTime.format('DD/MM');
    }
}

// Funciones helper para consultas
function getConsultaTitle(estado) {
    const titles = {
        'programada': 'Consulta programada',
        'confirmada': 'Consulta confirmada', 
        'completada': 'Consulta completada',
        'cancelada': 'Consulta cancelada',
        'pendiente': 'Consulta pendiente'
    };
    return titles[estado] || 'Consulta programada';
}

function getConsultaIcon(estado) {
    const icons = {
        'programada': 'fas fa-calendar-alt',
        'confirmada': 'fas fa-calendar-check', 
        'completada': 'fas fa-check-circle',
        'cancelada': 'fas fa-calendar-times',
        'pendiente': 'fas fa-clock'
    };
    return icons[estado] || 'fas fa-calendar-alt';
}

function getConsultaIconClass(estado) {
    const classes = {
        'programada': 'bg-primary',
        'confirmada': 'bg-success', 
        'completada': 'bg-info',
        'cancelada': 'bg-danger',
        'pendiente': 'bg-warning'
    };
    return classes[estado] || 'bg-primary';
}

// Actualizar el UI con actividades reales
function updateActivityUI(activities) {
    const container = document.querySelector('.activity-container');
    
    if (!container) return;
    
    if (activities.length === 0) {
        container.innerHTML = `
            <div class="text-center p-5">
                <div class="no-activity-state">
                    <i class="fas fa-chart-line fa-3x text-muted mb-4"></i>
                    <h5 class="text-muted mb-2">Sin actividad reciente</h5>
                    <p class="text-muted small mb-0">Las actividades aparecerán aquí cuando tengas acciones recientes</p>
                    <small class="text-muted">• Consultas realizadas<br>• Pacientes registrados<br>• Mediciones completadas</small>
                </div>
            </div>
        `;
        return;
    }
    
    container.innerHTML = activities.map(activity => {
        const typeColor = getActivityTypeColor(activity.type);
        
        return `
            <div class="activity-item enhanced-activity-item">
                <div class="activity-icon ${activity.iconClass}" title="${activity.type}">
                    <i class="${activity.icon}"></i>
                </div>
                <div class="activity-content">
                    <div class="activity-header">
                        <h6 class="mb-1 activity-title">${activity.title}</h6>
                        <div class="activity-badge activity-${activity.type}">${activity.detail || ''}</div>
                    </div>
                    <p class="text-muted small mb-1 activity-description">${activity.description}</p>
                    <div class="activity-meta">
                        <small class="text-muted activity-time-ago">${activity.agoText}</small>
                    </div>
                </div>
                <div class="activity-time">
                    <span class="badge bg-light text-dark activity-time-badge">${activity.badge}</span>
                </div>
            </div>
        `;
    }).join('');
}

// Función para obtener color por tipo de actividad
function getActivityTypeColor(type) {
    const colors = {
        'consulta': '#007bff',
        'paciente': '#28a745',
        'antropometria': '#17a2b8',
        'plan': '#ffc107'
    };
    return colors[type] || '#6c757d';
}

// Mostrar error en actividad
function showActivityError() {
    const container = document.querySelector('.activity-container');
    if (container) {
        container.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
                <p class="text-warning mb-0">Error al cargar actividad</p>
            </div>
        `;
    }
}

// Cargar próximas citas
async function loadUpcomingAppointments() {
    try {
        const userData = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        
        if (!userData || !userData.id) return;
        
        // Mostrar indicador de carga
        showAppointmentsLoading();
        
        console.log('📅 Cargando próximas citas para los próximos 7 días...');
        console.log('🕐 Zona horaria del profesional:', professionalTimezone);
        console.log('🕐 Fecha actual del sistema:', new Date().toISOString());
        console.log('🕐 Fecha actual en zona horaria del profesional:', getTodayInTimezone(professionalTimezone));
        
        // Debug detallado de zona horaria
        debugTimezoneInfo(professionalTimezone);
        
        // Obtener citas de los próximos 7 días usando la zona horaria del profesional
        const appointments = [];
        
        // Buscar citas para cada uno de los próximos 7 días usando la zona horaria del profesional
        for (let i = 0; i < 7; i++) {
            // Calcular fecha usando la zona horaria del profesional
            let dateString;
            
            if (professionalTimezone && professionalTimezone !== 'UTC') {
                try {
                    const now = new Date();
                    const targetDate = new Date(now);
                    targetDate.setDate(now.getDate() + i);
                    
                    // Obtener la fecha en la zona horaria del profesional
                    const options = { 
                        timeZone: professionalTimezone,
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                    };
                    
                    const formatter = new Intl.DateTimeFormat('en-CA', options);
                    const parts = formatter.formatToParts(targetDate);
                    
                    const year = parts.find(part => part.type === 'year').value;
                    const month = parts.find(part => part.type === 'month').value;
                    const day = parts.find(part => part.type === 'day').value;
                    
                    dateString = `${year}-${month}-${day}`;
                } catch (error) {
                    console.warn('⚠️ Error calculando fecha con timezone, usando fallback:', error);
                    const targetDate = new Date();
                    targetDate.setDate(targetDate.getDate() + i);
                    dateString = targetDate.toISOString().split('T')[0];
                }
            } else {
                // Fallback a fecha local si no hay timezone configurada
                const targetDate = new Date();
                targetDate.setDate(targetDate.getDate() + i);
                dateString = targetDate.toISOString().split('T')[0];
            }
            
            console.log(`📅 Día ${i + 1}: Buscando citas para ${dateString} (timezone: ${professionalTimezone})`);
            
            try {
                const response = await fetch(`/api/agenda/profesional/${userData.id}/consultas/fecha/${dateString}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                
                if (response.ok) {
                    const data = await response.json();
                    const dayAppointments = data.data || [];
                    
                    // Filtrar solo citas futuras para hoy, todas para otros días
                    if (i === 0) {
                        // Para hoy, solo mostrar citas futuras usando la hora actual en la zona horaria del profesional
                        const nowInTimezone = getCurrentTimeInTimezone(professionalTimezone);
                        const filteredAppointments = dayAppointments.filter(apt => {
                            const appointmentDateTime = new Date(`${dateString}T${apt.hora}`);
                            return appointmentDateTime > nowInTimezone;
                        });
                        appointments.push(...filteredAppointments);
                        console.log(`📅 Hoy: ${filteredAppointments.length} citas futuras de ${dayAppointments.length} total (hora actual: ${nowInTimezone.toISOString()})`);
                    } else {
                        // Para otros días, mostrar todas las citas
                        appointments.push(...dayAppointments);
                        console.log(`📅 Día ${i + 1}: ${dayAppointments.length} citas encontradas`);
                    }
                } else {
                    console.warn(`⚠️ Error obteniendo citas para ${dateString}:`, response.status);
                }
            } catch (error) {
                console.error(`❌ Error obteniendo citas para ${dateString}:`, error);
            }
        }
        
        // Filtrar solo citas activas (no canceladas)
        const activeAppointments = appointments.filter(apt => apt.estado !== 'cancelado');
        
        // Ordenar por fecha y hora
        activeAppointments.sort((a, b) => {
            const dateA = new Date(`${a.fecha}T${a.hora}`);
            const dateB = new Date(`${b.fecha}T${b.hora}`);
            return dateA - dateB;
        });
        
        console.log(`📅 Total de citas encontradas: ${activeAppointments.length}`);
        
        // Debug: mostrar información de las citas encontradas
        if (activeAppointments.length > 0) {
            console.log('📅 Citas encontradas:');
            activeAppointments.forEach((apt, index) => {
                console.log(`  ${index + 1}. ${apt.fecha} ${apt.hora} - ${apt.paciente_nombre || apt.paciente_exterior_nombre || 'Paciente externo'} (${apt.estado})`);
            });
        }
        
        // Mostrar solo las próximas 5 citas
        updateUpcomingAppointments(activeAppointments.slice(0, 5));
        
    } catch (error) {
        console.error('❌ Error cargando próximas citas:', error);
        showAppointmentsError();
    }
}

// Actualizar UI de próximas citas
function updateUpcomingAppointments(appointments) {
    const container = document.querySelector('.appointments-container');
    
    if (!container) return;
    
    if (appointments.length === 0) {
        container.innerHTML = `
            <div class="text-center p-4">
                <i class="fas fa-calendar-times fa-2x text-muted mb-3"></i>
                <p class="text-muted mb-1">No hay citas próximas</p>
                <small class="text-muted">Revisa tu agenda para programar nuevas citas</small>
            </div>
        `;
        
        // También actualizar el span en las estadísticas
        const nextAppointmentSpan = document.getElementById('homeNextAppointment');
        if (nextAppointmentSpan) {
            nextAppointmentSpan.textContent = 'Sin citas';
        }
        
        return;
    }
    
    container.innerHTML = appointments.map(appointment => {
        const timeFormatted = formatTime(appointment.hora);
        const periodFormatted = getTimePeriod(appointment.hora);
        const pacienteName = appointment.paciente_nombre || appointment.paciente_exterior_nombre || 'Paciente externo';
        const tipoConsulta = appointment.tipo_consulta || 'Consulta general';
        const estado = getStatusText(appointment.estado);
        const statusColor = getStatusColor(appointment.estado);
        
        // Formatear fecha de manera más legible
        const appointmentDate = formatAppointmentDate(appointment.fecha);
        
        return `
            <div class="appointment-item">
                <div class="appointment-time">
                    <div class="time-display">
                        <span class="time-hour">${timeFormatted}</span>
                        <span class="time-period">${periodFormatted}</span>
                    </div>
                    <div class="date-display">
                        <small class="text-muted">${appointmentDate}</small>
                    </div>
                </div>
                <div class="appointment-details">
                    <h6 class="mb-1">${pacienteName}</h6>
                    <p class="text-muted small mb-0">${tipoConsulta}</p>
                </div>
                <div class="appointment-status">
                    <span class="badge bg-${statusColor}">${estado}</span>
                </div>
            </div>
        `;
    }).join('');
    
    // Actualizar la próxima cita en estadísticas
    if (appointments.length > 0) {
        const nextAppointment = appointments[0];
        const nextAppointmentSpan = document.getElementById('homeNextAppointment');
        if (nextAppointmentSpan) {
            const timeFormatted = formatTime(nextAppointment.hora);
            const periodFormatted = getTimePeriod(nextAppointment.hora);
            const appointmentDate = formatAppointmentDate(nextAppointment.fecha);
            
            // Si es hoy, solo mostrar la hora, sino incluir fecha
            if (appointmentDate === 'Hoy') {
                nextAppointmentSpan.textContent = `${timeFormatted} ${periodFormatted}`;
            } else {
                nextAppointmentSpan.textContent = `${appointmentDate} ${timeFormatted} ${periodFormatted}`;
            }
        }
    }
}

// Mostrar indicador de carga para citas
function showAppointmentsLoading() {
    const container = document.querySelector('.appointments-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center p-4">
            <div class="spinner-border spinner-border-sm text-primary mb-2" role="status">
                <span class="visually-hidden">Cargando...</span>
            </div>
            <p class="text-muted small mb-0">Cargando próximas citas...</p>
        </div>
    `;
}

// Mostrar error al cargar citas
function showAppointmentsError() {
    const container = document.querySelector('.appointments-container');
    if (!container) return;
    
    container.innerHTML = `
        <div class="text-center p-4">
            <i class="fas fa-exclamation-triangle fa-2x text-warning mb-3"></i>
            <p class="text-muted mb-1">Error al cargar citas</p>
            <small class="text-muted">Intenta recargar la página</small>
        </div>
    `;
}

// Inicializar gráfico de consultas semanales
// Inicializar gráfico de consultas semanales con datos reales
async function initializeWeeklyChart() {
    try {
        const ctx = document.getElementById('weeklyConsultationsChart');
        if (!ctx) return;
        
        console.log('📊 Inicializando gráfico de consultas semanales...');
        
        // Obtener datos reales de consultas semanales
        const userData = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        
        if (!userData || !userData.id) {
            console.warn('⚠️ No hay datos de usuario para cargar gráfico');
            return;
        }
        
        // Obtener consultas de la semana usando zona horaria del profesional
        const weeklyData = await fetchWeeklyConsultations(userData.id, token);
        console.log('📈 Datos semanales obtenidos:', weeklyData);
        
        // Procesar datos para el gráfico
        const chartData = processWeeklyDataForChart(weeklyData.consultations || []);
        console.log('📊 Datos procesados para gráfico:', chartData);
        
        // Destruir gráfico existente si existe
        if (homeChart) {
            homeChart.destroy();
        }
        
        homeChart = new Chart(ctx, {
            type: 'line',
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                },
                elements: {
                    point: {
                        radius: 4,
                        hoverRadius: 6
                    }
                }
            }
        });
        
        console.log('✅ Gráfico de consultas semanales inicializado con datos reales');
        
    } catch (error) {
        console.error('❌ Error inicializando gráfico:', error);
    }
}

// Procesar datos semanales para el gráfico
function processWeeklyDataForChart(consultations) {
    try {
        console.log('🔄 Procesando datos semanales para gráfico:', consultations);
        console.log('📊 Total de consultas a procesar:', consultations.length);
        
        // Obtener fechas de inicio y fin de la semana usando zona horaria del profesional
        const startOfWeek = getStartOfWeekInTimezone(professionalTimezone);
        const endOfWeek = getEndOfWeekInTimezone(professionalTimezone);
        
        console.log('📅 Rango de semana:', startOfWeek, 'a', endOfWeek);
        console.log('🕐 Zona horaria del profesional:', professionalTimezone);
        
        // Crear array de días de la semana
        const daysOfWeek = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
        const weeklyCounts = [0, 0, 0, 0, 0, 0, 0]; // Inicializar contadores
        
        // Contar consultas por día usando zona horaria del profesional
        consultations.forEach(consultation => {
            try {
                // Usar zona horaria del profesional para interpretar la fecha
                const consultationDate = getDateInTimezone(consultation.fecha, professionalTimezone);
                const dayOfWeek = consultationDate.getUTCDay(); // 0 = Domingo, 1 = Lunes, etc.
                
                console.log(`📅 Consulta: ${consultation.fecha} -> Fecha procesada: ${consultationDate.toISOString()} -> Día: ${dayOfWeek}`);
                
                // Convertir día de la semana (0-6) a índice del array (0-6, donde 0 = Lunes)
                // JavaScript: 0=Domingo, 1=Lunes, 2=Martes, 3=Miércoles, 4=Jueves, 5=Viernes, 6=Sábado
                // Array gráfico: 0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado, 6=Domingo
                let arrayIndex;
                if (dayOfWeek === 0) { // Domingo en JavaScript
                    arrayIndex = 6; // Domingo en el array (última posición)
                } else {
                    arrayIndex = dayOfWeek - 1; // Lunes=1->0, Martes=2->1, etc.
                }
                
                console.log(`🗓️ Día de la semana: ${dayOfWeek} (${['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][dayOfWeek]}) -> Índice array: ${arrayIndex} (${['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'][arrayIndex]})`);
                
                weeklyCounts[arrayIndex]++;
                console.log(`📊 Consulta del ${consultation.fecha} (día ${dayOfWeek}) -> índice ${arrayIndex}, total: ${weeklyCounts[arrayIndex]}`);
                
            } catch (error) {
                console.warn('⚠️ Error procesando fecha de consulta:', consultation.fecha, error);
            }
        });
        
        console.log('📈 Conteos finales por día:', weeklyCounts);
        
        // Mostrar resumen detallado
        console.log('📊 RESUMEN DE DISTRIBUCIÓN SEMANAL:');
        daysOfWeek.forEach((day, index) => {
            console.log(`  ${day}: ${weeklyCounts[index]} consultas`);
        });
        
        return {
            labels: daysOfWeek,
            datasets: [{
                label: 'Consultas',
                data: weeklyCounts,
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderColor: '#007bff',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };
        
    } catch (error) {
        console.error('❌ Error procesando datos semanales:', error);
        
        // Fallback con datos vacíos
        return {
            labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
            datasets: [{
                label: 'Consultas',
                data: [0, 0, 0, 0, 0, 0, 0],
                backgroundColor: 'rgba(0, 123, 255, 0.1)',
                borderColor: '#007bff',
                borderWidth: 2,
                fill: true,
                tension: 0.4
            }]
        };
    }
}

// Interpretar fecha usando zona horaria específica
function getDateInTimezone(dateString, timezone) {
    try {
        console.log(`🔄 Procesando fecha: ${dateString} en timezone: ${timezone}`);
        
        // Crear fecha desde el string
        const date = new Date(dateString);
        
        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
            console.warn('⚠️ Fecha inválida:', dateString);
            return new Date();
        }
        
        // Extraer solo la parte de fecha (YYYY-MM-DD) para evitar problemas de zona horaria
        const dateOnly = dateString.split('T')[0]; // Obtener solo "2025-10-05"
        const [year, month, day] = dateOnly.split('-').map(Number);
        
        // Crear fecha usando UTC para evitar problemas de zona horaria del navegador
        const utcDate = new Date(Date.UTC(year, month - 1, day));
        
        console.log(`📅 Fecha original: ${dateString}`);
        console.log(`📅 Solo fecha: ${dateOnly}`);
        console.log(`📅 Componentes: año=${year}, mes=${month}, día=${day}`);
        console.log(`📅 Fecha UTC creada: ${utcDate.toISOString()}`);
        console.log(`📅 Día de la semana: ${utcDate.getUTCDay()} (${['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][utcDate.getUTCDay()]})`);
        
        return utcDate;
        
    } catch (error) {
        console.warn('⚠️ Error procesando fecha en timezone:', dateString, timezone, error);
        // Fallback: usar la fecha tal como viene
        return new Date(dateString);
    }
}

// Obtener inicio de semana usando zona horaria específica
function getStartOfWeekInTimezone(timezone) {
    try {
        if (!timezone || timezone === 'UTC') {
            return getStartOfWeek();
        }
        
        // Obtener fecha actual en la zona horaria del profesional
        const now = new Date();
        const localNow = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
        
        // Obtener lunes de esta semana
        const dayOfWeek = localNow.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // Si es domingo, restar 6 días
        const monday = new Date(localNow);
        monday.setDate(localNow.getDate() + mondayOffset);
        
        const result = monday.toISOString().split('T')[0];
        console.log(`📅 Inicio de semana en ${timezone}: ${result} (Lunes)`);
        
        return result;
    } catch (error) {
        console.warn('⚠️ Error calculando inicio de semana en timezone:', error);
        return getStartOfWeek();
    }
}

// Obtener fin de semana usando zona horaria específica
function getEndOfWeekInTimezone(timezone) {
    try {
        if (!timezone || timezone === 'UTC') {
            return getEndOfWeek();
        }
        
        const startOfWeek = getStartOfWeekInTimezone(timezone);
        const startDate = new Date(startOfWeek);
        const endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6); // Domingo
        
        const result = endDate.toISOString().split('T')[0];
        console.log(`📅 Fin de semana en ${timezone}: ${result} (Domingo)`);
        
        return result;
    } catch (error) {
        console.warn('⚠️ Error calculando fin de semana en timezone:', error);
        return getEndOfWeek();
    }
}

// Actualizar fecha y hora actual
function startDateTimeUpdates() {
    updateDateTime();
    updateDateTimeInterval = setInterval(updateDateTime, 1000); // Actualizar cada segundo
}

function updateDateTime() {
    const dateTimeElement = document.getElementById('currentDateTime');
    
    if (dateTimeElement) {
        let formattedDateTime;
        
        // Si hay zona horaria configurada y no es UTC, usarla
        if (professionalTimezone && professionalTimezone !== 'UTC') {
            try {
                const now = new Date();
                
                // Crear formato para la zona horaria del profesional
                const options = { 
                    timeZone: professionalTimezone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: false
                };
                
                const formatter = new Intl.DateTimeFormat('es-ES', options);
                const parts = formatter.formatToParts(now);
                
                const year = parts.find(part => part.type === 'year').value;
                const month = parts.find(part => part.type === 'month').value;
                const day = parts.find(part => part.type === 'day').value;
                const hour = parts.find(part => part.type === 'hour').value;
                const minute = parts.find(part => part.type === 'minute').value;
                const second = parts.find(part => part.type === 'second').value;
                
                formattedDateTime = `${day}/${month}/${year} - ${hour}:${minute}:${second}`;
            } catch (error) {
                console.warn('⚠️ Error formateando fecha con timezone, usando fecha local:', error);
                // Fallback a fecha local
                const now = dayjs();
                formattedDateTime = now.format('DD/MM/YYYY - HH:mm:ss');
            }
        } else {
            // Usar fecha local con dayjs
            const now = dayjs();
            formattedDateTime = now.format('DD/MM/YYYY - HH:mm:ss');
        }
        
        dateTimeElement.textContent = formattedDateTime;
    }
}

// Refrescar actividad reciente
function refreshRecentActivity() {
    console.log('🔄 Refrescando actividad reciente...');
    loadRecentActivity();
}

// Funciones de navegación
function showAgenda() {
    console.log('📋 Navegando a la sección de agenda...');
    
    try {
        // Verificar si la función showSection existe (definida en professional-dashboard.js)
        if (typeof showSection === 'function') {
            console.log('✅ Usando función showSection para navegar a agenda');
            showSection('agenda'); // Esto activará la sección 'agenda-section'
            
            // Verificar que la navegación fue exitosa
            setTimeout(() => {
                const agendaSection = document.getElementById('agenda-section');
                if (agendaSection && agendaSection.classList.contains('active')) {
                    console.log('✅ Navegación a agenda exitosa');
                } else {
                    console.warn('⚠️ La sección de agenda no parece estar activa');
                }
            }, 100);
            
            return;
        }
        
        // Fallback: navegación manual si showSection no está disponible
        console.log('⚠️ showSection no disponible, usando fallback...');
        
        // Buscar enlaces de agenda en el sidebar
        const agendaLinks = document.querySelectorAll('a[href="#agenda"], .nav-link[href*="agenda"]');
        
        if (agendaLinks.length > 0) {
            console.log(`✅ Encontré ${agendaLinks.length} enlace(s) de agenda`);
            agendaLinks[0].click();
            return;
        }
        
        // Buscar por ID directo
        const agendaSection = document.getElementById('agenda-section');
        if (agendaSection) {
            console.log('✅ Encontré la sección agenda-section, activandola manualmente...');
            
            // Desactivar todas las secciones
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            // Activar agenda
            agendaSection.classList.add('active');
            
            // Actualizar sidebar
            document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            const agendaNavLink = document.querySelector('a[href="#agenda"]');
            if (agendaNavLink) {
                agendaNavLink.classList.add('active');
            }
            
            console.log('✅ Sección de agenda activada manualmente');
            return;
        }
        
        console.error('❌ No se encontró la sección de agenda ni enlaces de navegación');
        
    } catch (error) {
        console.error('❌ Error durante navegación a agenda:', error);
    }
}

// Funciones de utilidad
function getStartOfWeek() {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Ajustar para que empiece en lunes
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
}

function getEndOfWeek() {
    const startOfWeek = getStartOfWeek();
    const sunday = new Date(startOfWeek);
    sunday.setDate(sunday.getDate() + 6);
    return sunday.toISOString().split('T')[0];
}

function formatTime(timeString) {
    const [hours] = timeString.split(':');
    return hours.padStart(2, '0');
}

function getTimePeriod(timeString) {
    const hour = parseInt(timeString.split(':')[0]);
    return hour >= 12 ? 'PM' : 'AM';
}

// Formatear fecha de cita de manera legible usando zona horaria del profesional
function formatAppointmentDate(dateString) {
    // La fecha viene en formato YYYY-MM-DD (en UTC desde el backend)
    const dateOnly = dateString.split('T')[0]; // Asegurar que solo tomamos la parte de fecha
    
    // Obtener fecha de hoy en la zona horaria del profesional
    const today = getTodayInTimezone(professionalTimezone);
    const tomorrow = getTomorrowInTimezone(professionalTimezone);
    
    console.log(`📅 Comparando fechas: ${dateOnly} vs ${today} (hoy en timezone) vs ${tomorrow} (mañana en timezone)`);
    
    if (dateOnly === today) {
        return 'Hoy';
    } else if (dateOnly === tomorrow) {
        return 'Mañana';
    } else {
        // Formatear fecha para otros días usando la fecha original
        const [year, month, day] = dateOnly.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        
        const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
        
        const dayName = dayNames[date.getDay()];
        const dayNumber = date.getDate();
        const monthName = monthNames[date.getMonth()];
        
        return `${dayName} ${dayNumber} ${monthName}`;
    }
}

function getStatusColor(status) {
    const colors = {
        'confirmada': 'success',
        'pendiente': 'warning',
        'programada': 'primary',
        'cancelada': 'secondary',
        'completada': 'success'
    };
    return colors[status] || 'secondary';
}

function getStatusText(status) {
    const statusText = {
        'confirmada': 'Confirmada',
        'pendiente': 'Pendiente',
        'programada': 'En espera',
        'cancelada': 'Cancelada',
        'completada': 'Completada'
    };
    return statusText[status] || status;
}

// Limpiar recursos cuando se cambie de sección
function cleanupHomeSection() {
    if (updateDateTimeInterval) {
        clearInterval(updateDateTimeInterval);
        updateDateTimeInterval = null;
    }
    
    if (homeChart) {
        homeChart.destroy();
        homeChart = null;
    }
}

// Configurar event listeners cuando el DOM esté listo
function setupHomeEventListeners() {
    // Event listener para el botón "Ver Agenda"
    const viewAgendaBtn = document.getElementById('viewAgendaBtn');
    if (viewAgendaBtn) {
        viewAgendaBtn.addEventListener('click', function(e) {
            e.preventDefault();
            showAgenda();
        });
        console.log('✅ Event listener agregado para "Ver Agenda"');
    }
}

// ==================== HELPER FUNCTIONS FOR TIMEZONE HANDLING ====================

// Debug: mostrar información detallada de zona horaria
function debugTimezoneInfo(timezone) {
    console.log('🔍 === DEBUG ZONA HORARIA ===');
    console.log('🕐 Zona horaria configurada:', timezone);
    
    const now = new Date();
    console.log('🕐 Fecha/hora actual del sistema:', now.toISOString());
    console.log('🕐 Fecha/hora actual en UTC:', now.toUTCString());
    
    if (timezone && timezone !== 'UTC') {
        try {
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
            
            const formatter = new Intl.DateTimeFormat('en-CA', options);
            const parts = formatter.formatToParts(now);
            
            const year = parts.find(part => part.type === 'year').value;
            const month = parts.find(part => part.type === 'month').value;
            const day = parts.find(part => part.type === 'day').value;
            const hour = parts.find(part => part.type === 'hour').value;
            const minute = parts.find(part => part.type === 'minute').value;
            const second = parts.find(part => part.type === 'second').value;
            
            console.log(`🕐 Fecha/hora en ${timezone}:`, `${year}-${month}-${day} ${hour}:${minute}:${second}`);
            console.log('🕐 Fecha de hoy calculada:', getTodayInTimezone(timezone));
            console.log('🕐 Fecha de mañana calculada:', getTomorrowInTimezone(timezone));
            
            // Debug específico para el problema de fechas
            console.log('🔍 === DEBUG ESPECÍFICO DE FECHAS ===');
            for (let i = 0; i < 3; i++) {
                const baseDate = new Date();
                const options2 = { 
                    timeZone: timezone,
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit'
                };
                
                const formatter2 = new Intl.DateTimeFormat('en-CA', options2);
                const parts2 = formatter2.formatToParts(baseDate);
                
                const year2 = parseInt(parts2.find(part => part.type === 'year').value);
                const month2 = parseInt(parts2.find(part => part.type === 'month').value) - 1;
                const day2 = parseInt(parts2.find(part => part.type === 'day').value);
                
                const dateInTimezone = new Date(year2, month2, day2);
                dateInTimezone.setDate(dateInTimezone.getDate() + i);
                
                const dateString = dateInTimezone.toISOString().split('T')[0];
                console.log(`📅 Día ${i + 1} calculado: ${dateString}`);
            }
            console.log('🔍 === FIN DEBUG ESPECÍFICO ===');
            
        } catch (error) {
            console.error('❌ Error en debug de zona horaria:', error);
        }
    } else {
        console.log('🕐 Usando zona horaria local');
        console.log('🕐 Fecha de hoy local:', getLocalTodayString());
        console.log('🕐 Fecha de mañana local:', getLocalTomorrowString());
    }
    
    console.log('🔍 === FIN DEBUG ===');
}

// Obtener fecha de hoy en zona horaria específica (formato YYYY-MM-DD)
function getTodayInTimezone(timezone) {
    try {
        // Si no hay timezone o es UTC, usar fecha local
        if (!timezone || timezone === 'UTC') {
            console.log('🕐 Usando zona horaria local (UTC o no especificada)');
            return getLocalTodayString();
        }
        
        console.log('🕐 Usando zona horaria del profesional:', timezone);
        
        // Crear fecha actual
        const now = new Date();
        
        // Usar Intl.DateTimeFormat para obtener la fecha en la zona horaria específica
        const options = { 
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };
        
        const formatter = new Intl.DateTimeFormat('en-CA', options);
        const parts = formatter.formatToParts(now);
        
        const year = parts.find(part => part.type === 'year').value;
        const month = parts.find(part => part.type === 'month').value;
        const day = parts.find(part => part.type === 'day').value;
        
        const result = `${year}-${month}-${day}`;
        console.log('📅 Fecha calculada en timezone:', result, 'para timezone:', timezone);
        
        return result;
    } catch (error) {
        console.warn('⚠️ Error obteniendo fecha en timezone, usando fecha local:', error);
        return getLocalTodayString();
    }
}

// Obtener fecha de mañana en zona horaria específica (formato YYYY-MM-DD)
function getTomorrowInTimezone(timezone) {
    try {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const options = { 
            timeZone: timezone,
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        };
        
        const formatter = new Intl.DateTimeFormat('en-CA', options);
        const parts = formatter.formatToParts(tomorrow);
        
        const year = parts.find(part => part.type === 'year').value;
        const month = parts.find(part => part.type === 'month').value;
        const day = parts.find(part => part.type === 'day').value;
        
        return `${year}-${month}-${day}`;
    } catch (error) {
        console.warn('⚠️ Error obteniendo fecha de mañana en timezone, usando UTC:', error);
        return getLocalTomorrowString();
    }
}

// Obtener fecha de hoy en zona horaria local (formato YYYY-MM-DD)
function getLocalTodayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Obtener fecha de mañana en zona horaria local (formato YYYY-MM-DD)
function getLocalTomorrowString() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const year = tomorrow.getFullYear();
    const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
    const day = String(tomorrow.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

// Obtener fecha actual en zona horaria local para comparaciones
function getLocalDate() {
    return new Date();
}

// Comparar fechas ignorando la hora (solo fecha en zona horaria local)
function isSameLocalDate(date1, date2) {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    
    return d1.getFullYear() === d2.getFullYear() &&
           d1.getMonth() === d2.getMonth() &&
           d1.getDate() === d2.getDate();
}

// Obtener hora actual en una zona horaria específica
function getCurrentTimeInTimezone(timezone) {
    try {
        const now = new Date();
        
        if (!timezone || timezone === 'UTC') {
            return now;
        }
        
        // Obtener hora actual en la zona horaria especificada
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
        
        const formatter = new Intl.DateTimeFormat('en-CA', options);
        const parts = formatter.formatToParts(now);
        
        const year = parseInt(parts.find(part => part.type === 'year').value);
        const month = parseInt(parts.find(part => part.type === 'month').value) - 1;
        const day = parseInt(parts.find(part => part.type === 'day').value);
        const hour = parseInt(parts.find(part => part.type === 'hour').value);
        const minute = parseInt(parts.find(part => part.type === 'minute').value);
        const second = parseInt(parts.find(part => part.type === 'second').value);
        
        // Crear fecha en UTC con los valores de la zona horaria
        return new Date(Date.UTC(year, month, day, hour, minute, second));
    } catch (error) {
        console.warn('⚠️ Error obteniendo hora actual en timezone, usando fecha local:', error);
        return new Date();
    }
}

// Verificar si una fecha es hoy en zona horaria específica
function isTodayInTimezone(dateString, timezone) {
    try {
        if (!timezone || timezone === 'UTC') {
            return isTodayLocal(dateString);
        }
        
        const today = getTodayInTimezone(timezone);
        const targetDate = dateString.split('T')[0]; // Solo la parte de fecha
        
        return today === targetDate;
    } catch (error) {
        console.warn('⚠️ Error verificando si es hoy en timezone:', error);
        return isTodayLocal(dateString);
    }
}

// Verificar si una fecha es mañana en zona horaria específica
function isTomorrowInTimezone(dateString, timezone) {
    try {
        if (!timezone || timezone === 'UTC') {
            return isTomorrowLocal(dateString);
        }
        
        const tomorrow = getTomorrowInTimezone(timezone);
        const targetDate = dateString.split('T')[0]; // Solo la parte de fecha
        
        return tomorrow === targetDate;
    } catch (error) {
        console.warn('⚠️ Error verificando si es mañana en timezone:', error);
        return isTomorrowLocal(dateString);
    }
}

// Verificar si una fecha es hoy en zona horaria local
function isTodayLocal(dateString) {
    const today = getLocalDate();
    const targetDate = new Date(dateString);
    
    return today.getFullYear() === targetDate.getFullYear() &&
           today.getMonth() === targetDate.getMonth() &&
           today.getDate() === targetDate.getDate();
}

// Verificar si una fecha es mañana en zona horaria local
function isTomorrowLocal(dateString) {
    const tomorrow = getLocalDate();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const targetDate = new Date(dateString);
    
    return tomorrow.getFullYear() === targetDate.getFullYear() &&
           tomorrow.getMonth() === targetDate.getMonth() &&
           tomorrow.getDate() === targetDate.getDate();
}

// Función global para actualizar la zona horaria (llamada desde other files)
window.updateProfessionalTimezoneGlobal = function(newTimezone) {
    professionalTimezone = newTimezone;
    console.log('✅ Zona horaria actualizada globalmente:', professionalTimezone);
    
    // Reload appointments to reflect new timezone
    loadUpcomingAppointments();
}

// Exportar funciones principales
window.initializeHomeSection = initializeHomeSection;
window.cleanupHomeSection = cleanupHomeSection;
window.refreshRecentActivity = refreshRecentActivity;
window.showAgenda = showAgenda;
window.setupHomeEventListeners = setupHomeEventListeners;
