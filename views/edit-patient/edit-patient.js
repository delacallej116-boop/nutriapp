// Edit Patient JavaScript

// Variables globales
let patientId = null;
let patientData = null;
let isFormDirty = false;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeEditPatient();
});

// Inicializar la página de edición
function initializeEditPatient() {
    // Obtener ID del paciente desde la URL
    const urlParams = new URLSearchParams(window.location.search);
    patientId = urlParams.get('id');
    
    if (!patientId) {
        showError('ID de paciente no proporcionado');
        return;
    }
    
    // Cargar datos del paciente
    loadPatientData();
    
    // Configurar event listeners
    setupEventListeners();
    
    // Configurar validación de formulario
    setupFormValidation();
}

// Cargar datos del paciente
async function loadPatientData() {
    try {
        showLoading();
        
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No hay token de autenticación');
        }
        
        const response = await fetch(`/api/usuarios/paciente/${patientId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al cargar el paciente');
        }
        
        const result = await response.json();
        patientData = result.data;
        
        // Debug: mostrar datos recibidos
        console.log('Datos del paciente recibidos:', patientData);
        console.log('Fecha de nacimiento:', patientData.fecha_nacimiento);
        console.log('Estado civil:', patientData.estado_civil);
        
        // Llenar el formulario
        populateForm(patientData);
        
        // Mostrar contenido principal
        showMainContent();
        
    } catch (error) {
        console.error('Error cargando paciente:', error);
        showError(error.message);
    }
}

// Llenar el formulario con los datos del paciente
function populateForm(data) {
    // Información personal
    document.getElementById('apellido_nombre').value = data.apellido_nombre || '';
    document.getElementById('numero_documento').value = data.numero_documento || '';
    document.getElementById('tipo_documento').value = data.tipo_documento || '';
    document.getElementById('numero_historia_clinica').value = data.numero_historia_clinica || '';
    
    // Formatear fecha de nacimiento para input type="date"
    if (data.fecha_nacimiento) {
        const fechaNacimiento = formatDateForInput(data.fecha_nacimiento);
        document.getElementById('fecha_nacimiento').value = fechaNacimiento;
    } else {
        document.getElementById('fecha_nacimiento').value = '';
    }
    
    document.getElementById('sexo').value = data.sexo || '';
    document.getElementById('grupo_sanguineo').value = data.grupo_sanguineo || '';
    document.getElementById('estado_civil').value = data.estado_civil || '';
    
    // Información de contacto
    document.getElementById('email').value = data.email || '';
    document.getElementById('telefono').value = data.telefono || '';
    document.getElementById('ocupacion').value = data.ocupacion || '';
    document.getElementById('domicilio').value = data.domicilio || '';
    document.getElementById('localidad').value = data.localidad || '';
    
    // Información médica
    document.getElementById('obra_social').value = data.obra_social || '';
    document.getElementById('numero_afiliado').value = data.numero_afiliado || '';
    
    // Formatear fechas para input type="date"
    if (data.fecha_ingreso) {
        const fechaIngreso = formatDateForInput(data.fecha_ingreso);
        document.getElementById('fecha_ingreso').value = fechaIngreso;
    } else {
        document.getElementById('fecha_ingreso').value = '';
    }
    
    if (data.fecha_baja) {
        const fechaBaja = formatDateForInput(data.fecha_baja);
        document.getElementById('fecha_baja').value = fechaBaja;
    } else {
        document.getElementById('fecha_baja').value = '';
    }
    
    document.getElementById('activo').checked = data.activo !== false;
    
    // Observaciones
    document.getElementById('observaciones').value = data.observaciones || '';
    
    // Marcar formulario como limpio
    isFormDirty = false;
}

// Configurar event listeners
function setupEventListeners() {
    // Botón de guardar
    document.getElementById('saveBtn').addEventListener('click', savePatient);
    
    // Botón de cancelar
    document.getElementById('cancelBtn').addEventListener('click', cancelEdit);
    
    // Detectar cambios en el formulario
    const form = document.getElementById('editPatientForm');
    const inputs = form.querySelectorAll('input, select, textarea');
    
    inputs.forEach(input => {
        input.addEventListener('input', markFormDirty);
        input.addEventListener('change', markFormDirty);
    });
    
    // Prevenir salida accidental si hay cambios sin guardar
    window.addEventListener('beforeunload', function(e) {
        if (isFormDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });
}

// Marcar formulario como modificado
function markFormDirty() {
    isFormDirty = true;
}

// Configurar validación de formulario
function setupFormValidation() {
    const form = document.getElementById('editPatientForm');
    
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        savePatient();
    });
    
    // Validación en tiempo real
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', validateField);
        field.addEventListener('input', clearFieldError);
    });
}

// Validar campo individual
function validateField(e) {
    const field = e.target;
    const value = field.value.trim();
    
    if (field.hasAttribute('required') && !value) {
        showFieldError(field, 'Este campo es obligatorio');
        return false;
    }
    
    if (field.type === 'email' && value && !isValidEmail(value)) {
        showFieldError(field, 'Ingrese un email válido');
        return false;
    }
    
    if (field.id === 'numero_documento' && value && !isValidDocument(value)) {
        showFieldError(field, 'Ingrese un número de documento válido');
        return false;
    }
    
    clearFieldError(field);
    return true;
}

// Mostrar error en campo
function showFieldError(field, message) {
    if (!field) return;
    
    field.classList.add('is-invalid');
    
    let feedback = field.parentNode?.querySelector('.invalid-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.className = 'invalid-feedback';
        field.parentNode?.appendChild(feedback);
    }
    
    feedback.textContent = message;
}

// Limpiar error de campo
function clearFieldError(field) {
    if (!field) return;
    
    field.classList.remove('is-invalid');
    const feedback = field.parentNode?.querySelector('.invalid-feedback');
    if (feedback) {
        feedback.remove();
    }
}

// Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validar documento
function isValidDocument(doc) {
    const docRegex = /^[0-9]{7,8}$/;
    return docRegex.test(doc);
}

// Formatear fecha para input type="date"
function formatDateForInput(dateString) {
    if (!dateString) return '';
    
    try {
        // Si ya está en formato YYYY-MM-DD, devolverlo tal como está
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        
        // Si está en formato DD/MM/YYYY o DD-MM-YYYY, convertir
        if (/^\d{2}[\/\-]\d{2}[\/\-]\d{4}$/.test(dateString)) {
            const parts = dateString.split(/[\/\-]/);
            const day = parts[0];
            const month = parts[1];
            const year = parts[2];
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        
        // Si es un objeto Date o timestamp, convertir
        const date = new Date(dateString);
        if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
        }
        
        return '';
    } catch (error) {
        console.warn('Error formateando fecha:', dateString, error);
        return '';
    }
}

// Guardar paciente
async function savePatient() {
    try {
        // Validar formulario
        if (!validateForm()) {
            return;
        }
        
        // Mostrar loading en botón
        const saveBtn = document.getElementById('saveBtn');
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Guardando...';
        saveBtn.disabled = true;
        
        // Recopilar datos del formulario
        const formData = getFormData();
        
        // Enviar datos al servidor
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/usuarios/paciente/${patientId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Error al guardar el paciente');
        }
        
        const result = await response.json();
        
        // Mostrar éxito con opción de volver
        showSuccessWithNavigation('Paciente actualizado exitosamente');
        
        // Marcar formulario como limpio
        isFormDirty = false;
        
        // Actualizar datos locales
        patientData = { ...patientData, ...formData };
        
    } catch (error) {
        console.error('Error guardando paciente:', error);
        showError(error.message);
    } finally {
        // Restaurar botón
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Cambios';
        saveBtn.disabled = false;
    }
}

// Validar formulario completo
function validateForm() {
    const form = document.getElementById('editPatientForm');
    const requiredFields = form.querySelectorAll('[required]');
    let isValid = true;
    
    requiredFields.forEach(field => {
        if (!validateField({ target: field })) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Recopilar datos del formulario
function getFormData() {
    const form = document.getElementById('editPatientForm');
    const formData = new FormData(form);
    
    const data = {};
    
    // Campos de texto
    const textFields = [
        'apellido_nombre', 'numero_documento', 'tipo_documento', 'numero_historia_clinica',
        'fecha_nacimiento', 'sexo', 'grupo_sanguineo', 'estado_civil',
        'email', 'telefono', 'ocupacion', 'domicilio', 'localidad', 'obra_social',
        'numero_afiliado', 'fecha_ingreso', 'fecha_baja', 'observaciones'
    ];
    
    textFields.forEach(field => {
        const value = formData.get(field);
        if (value) {
            data[field] = value;
        }
    });
    
    // Campo booleano
    data.activo = document.getElementById('activo').checked;
    
    return data;
}

// Cancelar edición
function cancelEdit() {
    if (isFormDirty) {
        if (confirm('¿Está seguro de que desea cancelar? Los cambios no guardados se perderán.')) {
            goToPatientsList();
        }
    } else {
        goToPatientsList();
    }
}

// Ir a la lista de pacientes
function goToPatientsList() {
    window.location.href = '/dashboard/professional/?tab=pacientes';
}

// Mostrar loading
function showLoading() {
    document.getElementById('loadingState').classList.remove('d-none');
    document.getElementById('errorState').classList.add('d-none');
    document.getElementById('mainContent').classList.add('d-none');
}

// Mostrar error
function showError(message) {
    document.getElementById('loadingState').classList.add('d-none');
    document.getElementById('errorState').classList.remove('d-none');
    document.getElementById('mainContent').classList.add('d-none');
    document.getElementById('errorMessage').textContent = message;
}

// Mostrar contenido principal
function showMainContent() {
    document.getElementById('loadingState').classList.add('d-none');
    document.getElementById('errorState').classList.add('d-none');
    document.getElementById('mainContent').classList.remove('d-none');
}

// Mostrar éxito
function showSuccess(message) {
    // Crear toast de éxito
    const toast = document.createElement('div');
    toast.className = 'toast align-items-center text-white bg-success border-0 position-fixed';
    toast.style.top = '20px';
    toast.style.right = '20px';
    toast.style.zIndex = '9999';
    
    toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">
                <i class="fas fa-check-circle me-2"></i>${message}
            </div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    const bsToast = new bootstrap.Toast(toast);
    bsToast.show();
    
    // Remover toast después de que se oculte
    toast.addEventListener('hidden.bs.toast', function() {
        document.body.removeChild(toast);
    });
}

// Mostrar éxito con opción de navegación
function showSuccessWithNavigation(message) {
    // Crear modal de éxito
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.setAttribute('data-bs-backdrop', 'static');
    modal.setAttribute('data-bs-keyboard', 'false');
    modal.style.zIndex = '9999';
    
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title text-success">
                        <i class="fas fa-check-circle me-2"></i>¡Éxito!
                    </h5>
                </div>
                <div class="modal-body text-center py-4">
                    <p class="mb-3">${message}</p>
                    <p class="text-muted small">¿Qué desea hacer ahora?</p>
                </div>
                <div class="modal-footer border-0 pt-0 justify-content-center">
                    <button type="button" class="btn btn-outline-secondary me-2" id="stayBtn">
                        <i class="fas fa-edit me-2"></i>Seguir Editando
                    </button>
                    <button type="button" class="btn btn-primary" id="goBackBtn">
                        <i class="fas fa-list me-2"></i>Volver a Mis Pacientes
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Event listeners para los botones
    document.getElementById('stayBtn').addEventListener('click', function() {
        bsModal.hide();
        document.body.removeChild(modal);
    });
    
    document.getElementById('goBackBtn').addEventListener('click', function() {
        bsModal.hide();
        document.body.removeChild(modal);
        goToPatientsList();
    });
    
    // Remover modal si se cierra con ESC o click fuera
    modal.addEventListener('hidden.bs.modal', function() {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    });
}
