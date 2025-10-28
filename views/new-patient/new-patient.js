// New Patient JavaScript

// Variables globales
let isFormDirty = false;

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initializeNewPatient();
});

// Inicializar la página de nuevo paciente
function initializeNewPatient() {
    console.log('🏥 Initializing New Patient page...');
    
    // Configurar event listeners
    setupEventListeners();
    
    // Configurar validación de formulario
    setupFormValidation();
    
    // Configurar fecha de ingreso como hoy
    setTodayAsDefaultDate();
    
    // Los pacientes ya no pueden crear cuentas de usuario - solo profesionales pueden acceder
    
    // Mostrar contenido principal
    showMainContent();
}

// Configurar event listeners
function setupEventListeners() {
    // Botón de guardar
    document.getElementById('saveBtn').addEventListener('click', savePatient);
    
    // Botón de cancelar
    document.getElementById('cancelBtn').addEventListener('click', cancelNewPatient);
    
    // Detectar cambios en el formulario
    const form = document.getElementById('newPatientForm');
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
    const form = document.getElementById('newPatientForm');
    
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
    
    // Validación de email
    const emailField = document.getElementById('email');
    emailField.addEventListener('blur', validateEmail);
    
    // Validación de documento
    const docField = document.getElementById('numero_documento');
    docField.addEventListener('blur', validateDocument);
    
    // Validación de número de historia clínica
    const hcField = document.getElementById('numero_historia_clinica');
    hcField.addEventListener('blur', validateHistoriaClinica);
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

// Validar email
function validateEmail() {
    const email = document.getElementById('email').value;
    
    if (email && !isValidEmail(email)) {
        showFieldError(document.getElementById('email'), 'Ingrese un email válido');
        return false;
    }
    
    clearFieldError(document.getElementById('email'));
    return true;
}

// Validar documento
function validateDocument() {
    const doc = document.getElementById('numero_documento').value;
    
    if (doc && !isValidDocument(doc)) {
        showFieldError(document.getElementById('numero_documento'), 'Ingrese un número de documento válido');
        return false;
    }
    
    clearFieldError(document.getElementById('numero_documento'));
    return true;
}

// Validar número de historia clínica
function validateHistoriaClinica() {
    const hc = document.getElementById('numero_historia_clinica').value;
    
    // Solo verificar que no esté vacío (acepta cualquier formato)
    if (!hc || hc.trim().length === 0) {
        showFieldError(document.getElementById('numero_historia_clinica'), 'El número de historia clínica es obligatorio');
        return false;
    }
    
    clearFieldError(document.getElementById('numero_historia_clinica'));
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

// Validar número de historia clínica
function isValidHistoriaClinica(hc) {
    // Permitir cualquier formato de historia clínica
    // Solo verificar que no esté vacío y tenga al menos un carácter
    // El formato puede variar según el país (HC001, H.C.-001, 12345, etc.)
    return hc && hc.trim().length > 0;
}

// Establecer fecha de hoy como fecha de ingreso por defecto
function setTodayAsDefaultDate() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('fecha_ingreso').value = today;
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
        const response = await fetch('/api/usuarios/paciente', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            
            // Si hay un campo específico con error, marcarlo
            if (errorData.field) {
                const field = document.getElementById(errorData.field);
                if (field) {
                    showFieldError(field, errorData.message);
                    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    setTimeout(() => field.focus(), 500);
                }
            }
            
            throw new Error(errorData.message || 'Error al crear el paciente');
        }
        
        const result = await response.json();
        
        // Mostrar éxito con opción de navegación
        showSuccessWithNavigation('Paciente creado exitosamente');
        
        // Marcar formulario como limpio
        isFormDirty = false;
        
    } catch (error) {
        console.error('Error creando paciente:', error);
        showError(error.message);
    } finally {
        // Restaurar botón
        const saveBtn = document.getElementById('saveBtn');
        saveBtn.innerHTML = '<i class="fas fa-save me-2"></i>Guardar Paciente';
        saveBtn.disabled = false;
    }
}

// Validar formulario completo
function validateForm() {
    const form = document.getElementById('newPatientForm');
    let isValid = true;
    let firstErrorField = null;
    
    // Limpiar todos los errores previos
    clearAllFieldErrors();
    
    // Campos obligatorios básicos (siempre requeridos)
    const basicRequiredFields = [
        { id: 'apellido_nombre', label: 'Apellido y Nombre' },
        { id: 'numero_documento', label: 'Número de Documento' },
        { id: 'tipo_documento', label: 'Tipo de Documento' },
        { id: 'numero_historia_clinica', label: 'Número de Historia Clínica' },
        { id: 'fecha_nacimiento', label: 'Fecha de Nacimiento' },
        { id: 'sexo', label: 'Sexo' },
        { id: 'email', label: 'Email' },
        { id: 'telefono', label: 'Teléfono' },
        { id: 'domicilio', label: 'Domicilio' },
        { id: 'localidad', label: 'Localidad' },
        { id: 'fecha_ingreso', label: 'Fecha de Ingreso' }
    ];
    
    // Validar campos básicos obligatorios
    for (const fieldInfo of basicRequiredFields) {
        const field = document.getElementById(fieldInfo.id);
        if (field) {
            const value = field.value.trim();
            if (!value) {
                showFieldError(field, `${fieldInfo.label} es obligatorio`);
                if (!firstErrorField) {
                    firstErrorField = field;
                }
                isValid = false;
            } else {
                clearFieldError(field);
            }
        }
    }
    
    // Validar formato de email
    const emailField = document.getElementById('email');
    if (emailField && emailField.value.trim()) {
        if (!isValidEmail(emailField.value.trim())) {
            showFieldError(emailField, 'Formato de email inválido (ejemplo: usuario@ejemplo.com)');
            if (!firstErrorField) {
                firstErrorField = emailField;
            }
            isValid = false;
        }
    }
    
    // Validar formato de documento
    const docField = document.getElementById('numero_documento');
    if (docField && docField.value.trim()) {
        if (!isValidDocument(docField.value.trim())) {
            showFieldError(docField, 'Formato de documento inválido (solo números, 7-8 dígitos)');
            if (!firstErrorField) {
                firstErrorField = docField;
            }
            isValid = false;
        }
    }
    
    // Validar número de historia clínica (acepta cualquier formato, solo debe estar presente)
    const hcField = document.getElementById('numero_historia_clinica');
    if (hcField && hcField.value.trim()) {
        if (!isValidHistoriaClinica(hcField.value.trim())) {
            showFieldError(hcField, 'Número de historia clínica es obligatorio');
            if (!firstErrorField) {
                firstErrorField = hcField;
            }
            isValid = false;
        }
    }
    
    // Si hay errores, mostrar mensaje amigable y enfocar el primer campo con error
    if (!isValid) {
        showValidationSummary(firstErrorField);
    }
    
    return isValid;
}

// Limpiar todos los errores de campos
function clearAllFieldErrors() {
    const errorFields = document.querySelectorAll('.is-invalid');
    errorFields.forEach(field => {
        clearFieldError(field);
    });
}

// Mostrar resumen de validación amigable
function showValidationSummary(firstErrorField) {
    // Crear modal de validación amigable
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.setAttribute('data-bs-backdrop', 'static');
    modal.setAttribute('data-bs-keyboard', 'false');
    modal.style.zIndex = '9999';
    
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title text-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>Revisar Información
                    </h5>
                </div>
                <div class="modal-body py-4">
                    <div class="alert alert-info d-flex align-items-center mb-3" role="alert">
                        <i class="fas fa-info-circle me-3"></i>
                        <div>
                            <strong>Información incompleta</strong><br>
                            Por favor, complete todos los campos obligatorios antes de guardar el paciente.
                        </div>
                    </div>
                    
                    <div class="row">
                        <div class="col-12">
                            <h6 class="text-muted mb-3">Campos que necesitan atención:</h6>
                            <div class="list-group list-group-flush">
                                ${getErrorFieldsList()}
                            </div>
                        </div>
                    </div>
                    
                    <div class="mt-4 p-3 bg-light rounded">
                        <small class="text-muted">
                            <i class="fas fa-lightbulb me-1"></i>
                            <strong>Consejo:</strong> Los campos marcados con asterisco (*) son obligatorios. 
                            Complete la información faltante y vuelva a intentar guardar.
                        </small>
                    </div>
                </div>
                <div class="modal-footer border-0 pt-0 justify-content-center">
                    <button type="button" class="btn btn-primary" id="fixFieldsBtn">
                        <i class="fas fa-edit me-2"></i>Voy a completar los campos
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Event listener para el botón
    document.getElementById('fixFieldsBtn').addEventListener('click', function() {
        bsModal.hide();
        document.body.removeChild(modal);
        
        // Scroll al primer campo con error y enfocarlo
        if (firstErrorField) {
            firstErrorField.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            setTimeout(() => {
                firstErrorField.focus();
            }, 500);
        }
    });
    
    // Remover modal si se cierra
    modal.addEventListener('hidden.bs.modal', function() {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    });
}

// Obtener lista de campos con errores
function getErrorFieldsList() {
    const errorFields = document.querySelectorAll('.is-invalid');
    let errorList = '';
    
    errorFields.forEach(field => {
        const label = getFieldLabel(field);
        const feedback = field.parentNode.querySelector('.invalid-feedback');
        const errorMessage = feedback ? feedback.textContent : 'Campo requerido';
        
        errorList += `
            <div class="list-group-item d-flex align-items-center py-2">
                <i class="fas fa-times-circle text-danger me-2"></i>
                <div class="flex-grow-1">
                    <strong>${label}</strong><br>
                    <small class="text-muted">${errorMessage}</small>
                </div>
            </div>
        `;
    });
    
    return errorList || '<div class="list-group-item text-center text-muted">No hay campos con errores</div>';
}

// Obtener etiqueta del campo
function getFieldLabel(field) {
    const label = field.parentNode.querySelector('label');
    if (label) {
        return label.textContent.replace('*', '').trim();
    }
    return field.name || field.id;
}

// Mostrar alerta de campos faltantes (función legacy - mantenida por compatibilidad)
function showMissingFieldsAlert(missingFields) {
    const message = missingFields.length === 1 
        ? `Falta completar el campo: ${missingFields[0]}`
        : `Faltan completar los siguientes campos: ${missingFields.join(', ')}`;
    
    // Crear modal de error
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.setAttribute('data-bs-backdrop', 'static');
    modal.setAttribute('data-bs-keyboard', 'false');
    modal.style.zIndex = '9999';
    
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title text-danger">
                        <i class="fas fa-exclamation-triangle me-2"></i>Campos Obligatorios
                    </h5>
                </div>
                <div class="modal-body text-center py-4">
                    <p class="mb-3">${message}</p>
                    <p class="text-muted small">Por favor, complete todos los campos obligatorios antes de guardar.</p>
                </div>
                <div class="modal-footer border-0 pt-0 justify-content-center">
                    <button type="button" class="btn btn-primary" id="okBtn">
                        <i class="fas fa-check me-2"></i>Entendido
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Event listener para el botón OK
    document.getElementById('okBtn').addEventListener('click', function() {
        bsModal.hide();
        document.body.removeChild(modal);
    });
    
    // Remover modal si se cierra con ESC o click fuera
    modal.addEventListener('hidden.bs.modal', function() {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    });
}

// Recopilar datos del formulario
function getFormData() {
    const form = document.getElementById('newPatientForm');
    const formData = new FormData(form);
    
    const data = {};
    
    // Campos de texto básicos
    const textFields = [
        'apellido_nombre', 'numero_documento', 'tipo_documento', 'numero_historia_clinica',
        'fecha_nacimiento', 'sexo', 'grupo_sanguineo', 'estado_civil',
        'email', 'telefono', 'ocupacion', 'domicilio', 'localidad', 'obra_social',
        'numero_afiliado', 'fecha_ingreso', 'observaciones'
    ];
    
    textFields.forEach(field => {
        const value = formData.get(field);
        if (value) {
            data[field] = value;
        }
    });
    
    // Campo booleano
    data.activo = document.getElementById('activo').checked;
    data.crear_cuenta = false; // Los pacientes ya no pueden crear cuentas
    
    return data;
}

// Cancelar nuevo paciente
function cancelNewPatient() {
    if (isFormDirty) {
        if (confirm('¿Está seguro de que desea cancelar? Los datos ingresados se perderán.')) {
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

// Mostrar error con modal amigable
function showError(message) {
    // Crear modal de error amigable
    const modal = document.createElement('div');
    modal.className = 'modal fade';
    modal.setAttribute('data-bs-backdrop', 'static');
    modal.setAttribute('data-bs-keyboard', 'false');
    modal.style.zIndex = '9999';
    
    modal.innerHTML = `
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header border-0 pb-0">
                    <h5 class="modal-title text-danger">
                        <i class="fas fa-exclamation-circle me-2"></i>Error al Guardar
                    </h5>
                </div>
                <div class="modal-body text-center py-4">
                    <div class="alert alert-danger d-flex align-items-center mb-3" role="alert">
                        <i class="fas fa-times-circle me-3"></i>
                        <div>
                            <strong>No se pudo crear el paciente</strong><br>
                            ${message}
                        </div>
                    </div>
                    
                    <div class="mt-3">
                        <small class="text-muted">
                            <i class="fas fa-lightbulb me-1"></i>
                            <strong>Consejos:</strong><br>
                            • Verifique que todos los campos obligatorios estén completos<br>
                            • Asegúrese de que el email tenga un formato válido<br>
                            • El número de documento debe contener solo números<br>
                            • Verifique que el número de documento no esté duplicado<br>
                            • El número de historia clínica debe ser único
                        </small>
                    </div>
                </div>
                <div class="modal-footer border-0 pt-0 justify-content-center">
                    <button type="button" class="btn btn-primary" id="okErrorBtn">
                        <i class="fas fa-check me-2"></i>Entendido, voy a corregir
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Event listener para el botón OK
    document.getElementById('okErrorBtn').addEventListener('click', function() {
        bsModal.hide();
        document.body.removeChild(modal);
        
        // Scroll al primer campo con error si existe
        const firstErrorField = document.querySelector('.is-invalid');
        if (firstErrorField) {
            firstErrorField.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'center' 
            });
            firstErrorField.focus();
        }
    });
    
    // Remover modal si se cierra
    modal.addEventListener('hidden.bs.modal', function() {
        if (document.body.contains(modal)) {
            document.body.removeChild(modal);
        }
    });
}

// Mostrar contenido principal
function showMainContent() {
    document.getElementById('loadingState').classList.add('d-none');
    document.getElementById('errorState').classList.add('d-none');
    document.getElementById('mainContent').classList.remove('d-none');
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
                    <button type="button" class="btn btn-outline-secondary me-2" id="newPatientBtn">
                        <i class="fas fa-plus me-2"></i>Nuevo Paciente
                    </button>
                    <button type="button" class="btn btn-primary" id="goBackBtn">
                        <i class="fas fa-list me-2"></i>Ver Mis Pacientes
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    const bsModal = new bootstrap.Modal(modal);
    bsModal.show();
    
    // Event listeners para los botones
    document.getElementById('newPatientBtn').addEventListener('click', function() {
        bsModal.hide();
        document.body.removeChild(modal);
        // Limpiar formulario
        document.getElementById('newPatientForm').reset();
        setTodayAsDefaultDate();
        isFormDirty = false;
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
