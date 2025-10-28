document.addEventListener('DOMContentLoaded', initPlanEditor);

let planId;
let profesionalId;
let token;
let diaActual = null;
let tipoComidaActual = null;
let comidasDelPlan = {};
let resumenNutricional = null;

const diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
const tiposComida = [
    { value: 'desayuno', text: 'Desayuno', time: '08:00', icon: 'fas fa-sun' },
    { value: 'almuerzo', text: 'Almuerzo', time: '13:00', icon: 'fas fa-utensils' },
    { value: 'merienda', text: 'Merienda', time: '17:00', icon: 'fas fa-coffee' },
    { value: 'cena', text: 'Cena', time: '20:00', icon: 'fas fa-moon' },
    { value: 'colacion', text: 'Colación', time: '10:00', icon: 'fas fa-apple-alt' }
];

// Inicialización
async function initPlanEditor() {
    try {
        token = localStorage.getItem('token');
        if (!token) {
            console.error('No hay token disponible. Redirigiendo a login.');
            window.location.href = '/login';
            return;
        }

        const payload = JSON.parse(atob(token.split('.')[1]));
        profesionalId = payload.profesional_id || payload.id;

        if (!profesionalId) {
            throw new Error('ID del profesional no encontrado en el token.');
        }

        // Obtener planId de la URL
        const urlParams = new URLSearchParams(window.location.search);
        planId = urlParams.get('planId');

        if (!planId) {
            alert('ID del plan no especificado. Redirigiendo a planes alimentarios.');
            window.location.href = '/plan-alimentario';
            return;
        }

        await cargarDatosDelPlan();
        inicializarInterfaz();
        configurarEventos();

    } catch (error) {
        console.error('Error al inicializar editor de planes:', error);
        alert('Error al inicializar el editor.');
        window.location.href = '/plan-alimentario';
    }
}

// Cargar datos del plan
async function cargarDatosDelPlan() {
    try {
        const response = await fetch(`/api/plan-editor/plan/${planId}/comidas`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Error al cargar datos del plan.');
        }

        const result = await response.json();
        
        comidasDelPlan = result.data.comidas_por_dia || {};
        resumenNutricional = result.data.plan_info || {};
        
        document.getElementById('planInfo').textContent = 
            `Plan de ${resumenNutricional.paciente_nombre || 'Paciente'} - ${resumenNutricional.objetivo || 'Sin objetivo'} - ${resumenNutricional.calorias_diarias || 'N/A'} kcal/día`;

        // Cargar resumen nutricional
        await cargarResumenNutricional();

    } catch (error) {
        console.error('Error al cargar datos del plan:', error);
        alert('Error al cargar los datos del plan alimentario.');
        throw error;
    }
}

// Cargar resumen nutricional
async function cargarResumenNutricional() {
    try {
        const response = await fetch(`/api/plan-editor/plan/${planId}/resumen`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
            const result = await response.json();
            mostrarResumenNutricional(result.data || {});
        }
    } catch (error) {
        console.error('Error al cargar resumen nutricional:', error);
    }
}

// Mostrar resumen nutricional
function mostrarResumenNutricional(data) {
    const container = document.getElementById('resumenNutricionalContent');
    container.innerHTML = '';

    const valores = [
        { label: 'Calorías', value: Math.round(data.total_calorias || 0) },
        { label: 'Proteínas', value: Math.round(data.total_proteinas || 0) + 'g' },
        { label: 'Carbohidratos', value: Math.round(data.total_carbohidratos || 0) + 'g' },
        { label: 'Grasas', value: Math.round(data.total_grasas || 0) + 'g' },
        { label: 'Fibra', value: Math.round(data.total_fibra || 0) + 'g' },
        { label: 'Azúcares', value: Math.round(data.total_azucares || 0) + 'g' },
        { label: 'Sodio', value: Math.round(data.total_sodio || 0) + 'mg' }
    ];

    valores.forEach(valor => {
        container.innerHTML += `
            <div class="col-md-auto">
                <div class="resumen-item">
                    <div class="resumen-valor">${valor.value}</div>
                    <div class="resumen-etiqueta">${valor.label}</div>
                </div>
            </div>
        `;
    });
}

// Inicializar interfaz
function inicializarInterfaz() {
    cargarListaDias();
    cargarTiposComida();
}

// Cargar lista de días
function cargarListaDias() {
    const listaDias = document.getElementById('listaDias');
    listaDias.innerHTML = '';

    diasSemana.forEach(dia => {
        const comidasDelDia = comidasDelPlan[dia] || {};
        const cantidadComidas = Object.values(comidasDelDia).filter(comida => comida !== null).length;

        const item = document.createElement('div');
        item.className = 'list-group-item list-group-item-action dia-item';
        item.dataset.dia = dia;
        item.innerHTML = `
            <div class="dia-nombre">${dia}</div>
            <small class="dia-comidas-count">${cantidadComidas}/5 comidas</small>
        `;

        item.addEventListener('click', () => seleccionarDia(dia));
        listaDias.appendChild(item);
    });
}

// Cargar tipos de comida
function cargarTiposComida() {
    const tiposComidaContainer = document.getElementById('tiposComida');
    tiposComidaContainer.innerHTML = '';

    tiposComida.forEach(tipo => {
        const item = document.createElement('div');
        item.className = 'tipo-comida-item';
        item.dataset.tipo = tipo.value;
        
        const tieneComida = diaActual && comidasDelPlan[diaActual] && 
                          comidasDelPlan[diaActual][tipo.value] !== null;

        if (tieneComida) {
            item.classList.add('has-comida');
        }

        item.innerHTML = `
            <i class="${tipo.icon} me-2"></i>
            <span class="tipo-texto">${tipo.text}</span>
            <small class="ms-2">${tipo.time}</small>
        `;

        item.addEventListener('click', () => seleccionarTipoComida(tipo.value));
        tiposComidaContainer.appendChild(item);
    });
}

// Seleccionar día
function seleccionarDia(dia) {
    // Actualizar UI
    document.querySelectorAll('.dia-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-dia="${dia}"]`).classList.add('active');

    diaActual = dia;
    cargarTiposComida();
    mostrarEditorDia(dia);
}

// Seleccionar tipo de comida
function seleccionarTipoComida(tipo) {
    // Actualizar UI
    document.querySelectorAll('.tipo-comida-item').forEach(item => {
        item.classList.remove('active');
    });
    document.querySelector(`[data-tipo="${tipo}"]`).classList.add('active');

    tipoComidaActual = tipo;
}

// Mostrar editor del día
function mostrarEditorDia(dia) {
    const container = document.getElementById('editorDiaContainer');
    
    container.innerHTML = `
        <div class="editor-dia-container">
            <div class="dia-title">
                <span><i class="fas fa-calendar-day me-2"></i>${dia}</span>
                <button class="btn btn-success btn-sm" id="agregarComidaBtn">
                    <i class="fas fa-plus me-1"></i>Nueva Comida
                </button>
            </div>
            <div class="comida-slots">
                ${tiposComida.map(tipo => {
                    const comida = comidasDelPlan[dia] && comidasDelPlan[dia][tipo.value];
                    return generarSlotComida(tipo, comida);
                }).join('')}
            </div>
        </div>
    `;

    // Attach event listeners
    document.getElementById('agregarComidaBtn').addEventListener('click', mostrarModalComida);
    document.querySelectorAll('.slot-tipo').forEach(slot => {
        slot.parentElement.addEventListener('click', (e) => {
            if (slot.parentElement.querySelector('.comida-card')) {
                const tipo = slot.dataset.tipo;
                seleccionarComidaParaEditar(dia, tipo, comidasDelPlan[dia][tipo]);
            }
        });
    });
}

// Generar slot de comida
function generarSlotComida(tipo, comida = null) {
    const tieneComida = comida !== null;
    const clasesSlot = `comida-slot ${tieneComida ? 'has-comida' : ''}`;

    return `
        <div class="${clasesSlot}" data-tipo="${tipo.value}">
            <div class="slot-header">
                <span class="slot-icon ${tipo.icon} tipo-${tipo.value}"></span>
                <span class="slot-tipo tipo-${tipo.value}" data-tipo="${tipo.value}">${tipo.text}</span>
                <small class="ms-2 text-muted">${tipo.time}</small>
            </div>
            ${tieneComida ? generarComidaCard(comida) : generarSlotVacio(tipo)}
        </div>
    `;
}

// Generar tarjeta de comida
function generarComidaCard(comida) {
    return `
        <div class="comida-card">
            <div class="comida-info">
                <div>
                    <div class="comida-nombre">${comida.nombre_comida}</div>
                    <div class="comida-valores-nutricionales">
                        ${Math.round(comida.calorias || 0)} kcal | 
                        ${Math.round(comida.proteinas || 0)}g P | 
                        ${Math.round(comida.carbohidratos || 0)}g C | 
                        ${Math.round(comida.grasas || 0)}g G
                    </div>
                </div>
                <div class="comida-actions">
                    <button class="btn btn-sm btn-outline-primary editar-comida-btn">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-outline-danger eliminar-comida-btn">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
}

// Generar slot vacío
function generarSlotVacio(tipo) {
    return `
        <div class="slot-empty">
            <i class="fas fa-plus-circle fa-2x text-muted mb-2"></i>
            <div class="text-muted">Agregar ${tipo.text.toLowerCase()}</div>
        </div>
    `;
}

// Mostrar modal de comida
function mostrarModalComida(comidaParaEditar = null) {
    const modal = new bootstrap.Modal(document.getElementById('comidaModal'));
    const form = document.getElementById('comidaForm');
    
    // Resetear formulario
    form.reset();
    
    if (comidaParaEditar) {
        // Modo edición
        document.getElementById('comidaModalLabel').textContent = 'Editar Comida';
        document.getElementById('comidaId').value = comidaParaEditar.id;
        llenarFormularioComida(comidaParaEditar);
    } else {
        // Modo nueva comida
        document.getElementById('comidaModalLabel').textContent = 'Nueva Comida';
        document.getElementById('comidaId').value = '';
    }

    document.getElementById('diaSeleccionado').value = diaActual;
    
    modal.show();
    form.querySelector('#nombreComida').focus();
}

// Llenar formulario de comida
function llenarFormularioComida(comida) {
    document.getElementById('nombreComida').value = comida.nombre_comida || '';
    document.getElementById('descripcionComida').value = comida.descripcion || '';
    document.getElementById('tiempoPreparacion').value = comida.tiempo_preparacion || '';
    document.getElementById('caloriasComida').value = comida.calorias || '';
    document.getElementById('proteinasComida').value = comida.proteinas || '';
    document.getElementById('carbohidratosComida').value = comida.carbohidratos || '';
    document.getElementById('grasasComida').value = comida.grasas || '';
    document.getElementById('fibraComida').value = comida.fibra || '';
    document.getElementById('azucaresComida').value = comida.azucares || '';
    document.getElementById('sodioComida').value = comida.sodio || '';
    document.getElementById('ingredientesComida').value = comida.ingredientes || '';
    document.getElementById('preparacionComida').value = comida.preparacion || '';
    document.getElementById('porcionesComida').value = comida.porciones || '1';
    document.getElementById('dificultadComida').value = comida.dificultad || 'facil';
    document.getElementById('notasComida').value = comida.notas || '';
}

// Configurar eventos
function configurarEventos() {
    document.getElementById('guardarComidaBtn').addEventListener('click', guardarComida);
    document.getElementById('verResumenBtn').addEventListener('click', toggleResumenNutricional);
    document.getElementById('copiarPlanBtn').addEventListener('click', mostrarModalCopiarPlan);
    document.getElementById('confirmarCopiarBtn').addEventListener('click', copiarPlan);
}

// Guardar comida
async function guardarComida() {
    const formData = {
        nombre_comida: document.getElementById('nombreComida').value,
        descripcion: document.getElementById('descripcionComida').value,
        tiempo_preparacion: document.getElementById('tiempoPreparacion').value,
        calorias: document.getElementById('caloriasComida').value,
        proteinas: document.getElementById('proteinasComida').value, 
        carbohidratos: document.getElementById('carbohidratosComida').value,
        grasas: document.getElementById('grasasComida').value,
        fibra: document.getElementById('fibraComida').value,
        azucares: document.getElementById('azucaresComida').value,
        sodio: document.getElementById('sodioComida').value,
        ingredientes: document.getElementById('ingredientesComida').value,
        preparacion: document.getElementById('preparacionComida').value,
        porciones: document.getElementById('porcionesComida').value,
        dificultad: document.getElementById('dificultadComida').value,
        notas: document.getElementById('notasComida').value
    };

    const diaSeleccionado = document.getElementById('diaSeleccionado').value;
    const tipoComidaActual = document.querySelector('.tipo-comida-item.active');

    if (!diaSeleccionado || !tipoComidaActual) {
        alert('Por favor selecciona un día y tipo de comida.');
        return;
    }

    formData.dia_semana = diaSeleccionado;
    formData.tipo_comida = tipoComidaActual.dataset.tipo;

    // Validaciones básicas
    if (!formData.nombre_comida) {
        alert('Nombre de la comida es requerido.');
        return;
    }

    try {
        let response;
        const comidaId = document.getElementById('comidaId').value;

        if (comidaId) {
            // Actualizar comida existente
            response = await fetch(`/api/plan-editor/comida/${comidaId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
        } else {
            // Crear nueva comida
            response = await fetch(`/api/plan-editor/plan/${planId}/comidas`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar comida.');
        }

        // Ocultar modal
        bootstrap.Modal.getInstance(document.getElementById('comidaModal')).hide();

        // Recargar datos y actualizar interfaz
        await cargarDatosDelPlan();
        inicializarInterfaz();
        mostrarEditorDia(diaActual);

        alert('Comida guardada exitosamente.');
    } catch (error) {
        console.error('Error al guardar comida:', error);
        alert(error.message || 'Error al guardar la comida.');
    }
}

// Toggle resumen nutricional
function toggleResumenNutricional() {
    const resumenContainer = document.getElementById('resumenNutricional');
    if (resumenContainer.style.display === 'none') {
        resumenContainer.style.display = 'block';
        document.getElementById('verResumenBtn').innerHTML = '<i class="fas fa-eye-slash me-2"></i>Ocultar Resumen Nutricional';
    } else {
        resumenContainer.style.display = 'none';
        document.getElementById('verResumenBtn').innerHTML = '<i class="fas fa-chart-bar me-2"></i>Resumen Nutricional';
    }
}

// Mostrar modal copiar plan
async function mostrarModalCopiarPlan() {
    const modal = new bootstrap.Modal(document.getElementById('copiarPlanModal'));
    
    // Cargar lista de planes
    try {
        const response = await fetch(`/api/plan-alimentacion/profesional/${profesionalId}/planes`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) {
            throw new Error('Error al cargar planes.');
        }

        const result = await response.json();
        
        const select = document.getElementById('nuevoPlanSelect');
        select.innerHTML = '<option value="">Seleccionar plan...</option>';

        result.data.forEach(plan => {
            if (plan.id != planId) {
                const option = document.createElement('option');
                option.value = plan.id;
                option.textContent = plan.paciente_nombre + ' - ' + plan.descripcion;
                select.appendChild(option);
            }
        });

        modal.show();
    } catch (error) {
        console.error('Error al cargar planes:', error);
        alert('Error al cargar la lista de planes.');
    }
}

// Copiar plan
async function copiarPlan() {
    const nuevoPlanId = document.getElementById('nuevoPlanSelect').value;

    if (!nuevoPlanId) {
        alert('Por favor selecciona un plan destino.');
        return;
    }

    try {
        const response = await fetch(`/api/plan-editor/plan/${planId}/copiar/${nuevoPlanId}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al copiar plan.');
        }

        bootstrap.Modal.getInstance(document.getElementById('copiarPlanModal')).hide();
        
        const resultData = await response.json();
        alert(`Plan copiado exitosamente. Se copiaron ${resultData.message.comidas_copiadas} comidas.`);
        
    } catch (error) {
        console.error('Error al copiar plan:', error);
        alert('Error al copiar el plan.');
    }
}

// Seleccionar comida para editar
function seleccionarComidaParaEditar(dia, tipo, comida) {
    mostrarModalComida(comida);
}

// Actualizar estado de tipos de comida
function actualizarTiposComida() {
    if (diaActual) {
        const comidasDelDia = comidasDelPlan[diaActual] || {};
        
        document.querySelectorAll('.tipo-comida-item').forEach(item => {
            item.classList.remove('active');
            const tipo = item.dataset.tipo;
            
            if (comidasDelDia[tipo]) {
                item.classList.add('has-comida');
            } else {
                item.classList.remove('has-comida');
            }
        });
    }
}

// Initialize cuando se carga el documento
document.addEventListener('DOMContentLoaded', initPlanEditor);
