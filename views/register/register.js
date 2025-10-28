// Register Page JavaScript

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize register page
    initRegisterPage();
});

// Initialize register page
function initRegisterPage() {
    // Add animation to register card
    const registerCard = document.querySelector('.register-card');
    registerCard.style.opacity = '0';
    registerCard.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        registerCard.style.transition = 'all 0.6s ease-out';
        registerCard.style.opacity = '1';
        registerCard.style.transform = 'translateY(0)';
    }, 100);
    
    // Add form submission handler
    const registerForm = document.getElementById('registerForm');
    registerForm.addEventListener('submit', handleRegister);
    
    // Add real-time validation
    addRealTimeValidation();
    
    // Enable register button by default
    document.getElementById('registerButton').disabled = false;
}

// Add real-time validation
function addRealTimeValidation() {
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    
    // Password strength validation
    passwordInput.addEventListener('input', function() {
        checkPasswordStrength(this.value);
    });
    
    // Password match validation
    confirmPasswordInput.addEventListener('input', function() {
        checkPasswordMatch();
    });
    
    // Username validation
    const usuarioInput = document.getElementById('usuario');
    usuarioInput.addEventListener('input', function() {
        validateUsername(this.value);
    });
    
    // Registration key validation
    const claveRegistroInput = document.getElementById('clave_registro');
    claveRegistroInput.addEventListener('blur', function() {
        validateRegistrationKey(this.value);
    });
    
    // Email validation (now optional)
    const emailInput = document.getElementById('email');
    emailInput.addEventListener('blur', function() {
        validateEmail(this.value);
    });
    
    // Phone validation
    const phoneInput = document.getElementById('telefono');
    phoneInput.addEventListener('blur', function() {
        validatePhone(this.value);
    });
}

// Check password strength
function checkPasswordStrength(password) {
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    
    let strength = 0;
    let strengthLabel = '';
    let strengthClass = '';
    
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    switch (strength) {
        case 0:
        case 1:
            strengthLabel = 'Muy débil';
            strengthClass = 'weak';
            break;
        case 2:
            strengthLabel = 'Débil';
            strengthClass = 'weak';
            break;
        case 3:
            strengthLabel = 'Regular';
            strengthClass = 'fair';
            break;
        case 4:
            strengthLabel = 'Buena';
            strengthClass = 'good';
            break;
        case 5:
            strengthLabel = 'Muy fuerte';
            strengthClass = 'strong';
            break;
    }
    
    strengthFill.className = `strength-fill ${strengthClass}`;
    strengthText.textContent = password.length > 0 ? strengthLabel : 'Ingresa una contraseña';
    strengthText.className = `strength-text ${strengthClass}`;
}

// Check password match
function checkPasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const matchText = document.getElementById('match-text');
    
    if (confirmPassword.length === 0) {
        matchText.textContent = '';
        matchText.className = 'match-text';
        return;
    }
    
    if (password === confirmPassword) {
        matchText.textContent = '✓ Las contraseñas coinciden';
        matchText.className = 'match-text match';
    } else {
        matchText.textContent = '✗ Las contraseñas no coinciden';
        matchText.className = 'match-text no-match';
    }
}

// Validate registration key
async function validateRegistrationKey(clave) {
    const claveInput = document.getElementById('clave_registro');
    
    if (!clave) {
        claveInput.classList.add('is-invalid');
        showFieldError('clave_registro', 'La clave de registro es obligatoria');
        return;
    }
    
    // Basic format validation
    const claveRegex = /^NUTRI-[A-Z0-9]+$/;
    if (!claveRegex.test(clave)) {
        claveInput.classList.add('is-invalid');
        showFieldError('clave_registro', 'Formato de clave inválido. Debe ser NUTRI-XXXX');
        return;
    }
    
    try {
        // Validate with server
        const response = await fetch('/api/validate-registration-key', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ clave: clave })
        });
        
        const result = await response.json();
        
        if (result.success && result.valid) {
            claveInput.classList.remove('is-invalid');
            claveInput.classList.add('is-valid');
            hideFieldError('clave_registro');
        } else {
            claveInput.classList.add('is-invalid');
            claveInput.classList.remove('is-valid');
            showFieldError('clave_registro', result.message || 'Clave de registro inválida o ya utilizada');
        }
    } catch (error) {
        console.error('Error validating registration key:', error);
        claveInput.classList.add('is-invalid');
        showFieldError('clave_registro', 'Error al validar la clave. Intenta nuevamente.');
    }
}

// Validate username
function validateUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    const usuarioInput = document.getElementById('usuario');
    
    if (username.length === 0) {
        usuarioInput.classList.remove('is-invalid');
        hideFieldError('usuario');
        return;
    }
    
    if (!usernameRegex.test(username)) {
        usuarioInput.classList.add('is-invalid');
        showFieldError('usuario', 'El usuario debe tener entre 3 y 20 caracteres (solo letras, números y guiones bajos)');
    } else {
        usuarioInput.classList.remove('is-invalid');
        hideFieldError('usuario');
    }
}

// Validate email (now optional)
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const emailInput = document.getElementById('email');
    
    if (email.length > 0 && !emailRegex.test(email)) {
        emailInput.classList.add('is-invalid');
        showFieldError('email', 'Por favor, ingresa un email válido');
    } else {
        emailInput.classList.remove('is-invalid');
        hideFieldError('email');
    }
}

// Validate phone
function validatePhone(phone) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    const phoneInput = document.getElementById('telefono');
    
    if (phone.length > 0 && !phoneRegex.test(phone)) {
        phoneInput.classList.add('is-invalid');
        showFieldError('telefono', 'Por favor, ingresa un número de teléfono válido');
    } else {
        phoneInput.classList.remove('is-invalid');
        hideFieldError('telefono');
    }
}

// Show field error
function showFieldError(fieldId, message) {
    let errorDiv = document.getElementById(`${fieldId}-error`);
    if (!errorDiv) {
        errorDiv = document.createElement('div');
        errorDiv.id = `${fieldId}-error`;
        errorDiv.className = 'invalid-feedback';
        document.getElementById(fieldId).parentNode.appendChild(errorDiv);
    }
    errorDiv.textContent = message;
}

// Hide field error
function hideFieldError(fieldId) {
    const errorDiv = document.getElementById(`${fieldId}-error`);
    if (errorDiv) {
        errorDiv.remove();
    }
}

// Toggle password visibility
function togglePassword(fieldId) {
    const passwordField = document.getElementById(fieldId);
    const eyeIcon = document.getElementById(`${fieldId}-eye`);
    
    if (passwordField.type === 'password') {
        passwordField.type = 'text';
        eyeIcon.classList.remove('fa-eye');
        eyeIcon.classList.add('fa-eye-slash');
    } else {
        passwordField.type = 'password';
        eyeIcon.classList.remove('fa-eye-slash');
        eyeIcon.classList.add('fa-eye');
    }
}

// Handle register form submission
async function handleRegister(event) {
    event.preventDefault();
    
    const formData = getFormData();
    
    // Validate form
    if (!validateForm(formData)) {
        return;
    }
    
    // Show loading state
    const registerButton = document.getElementById('registerButton');
    registerButton.classList.add('loading');
    registerButton.disabled = true;
    
    try {
        // Show processing message
        showAlert('Procesando tu registro...', 'info');
        
        // Make API call to register
        const response = await fetch('/api/profesionales/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        const result = await response.json();
        
        if (result.success) {
            showAlert('¡Registro exitoso! Bienvenido a la plataforma.', 'success');
            
            // Clear form
            document.getElementById('registerForm').reset();
            
            // Redirect to login after successful registration
            setTimeout(() => {
                window.location.href = '../login/index.html';
            }, 2000);
        } else {
            showAlert(result.message || 'Error en el registro. Intenta nuevamente.', 'error');
        }
        
    } catch (error) {
        console.error('Error en el registro:', error);
        showAlert('Error de conexión. Verifica tu internet e intenta nuevamente.', 'error');
    } finally {
        // Reset button state
        registerButton.classList.remove('loading');
        registerButton.disabled = false;
    }
}

// Get form data
function getFormData() {
    return {
        nombre: document.getElementById('nombre').value.trim(),
        usuario: document.getElementById('usuario').value.trim(),
        email: document.getElementById('email').value.trim(),
        telefono: document.getElementById('telefono').value.trim(),
        timezone: document.getElementById('timezone').value,
        password: document.getElementById('password').value,
        confirmPassword: document.getElementById('confirmPassword').value,
        especialidad: document.getElementById('especialidad').value,
        matricula: document.getElementById('matricula').value.trim(),
        experiencia: document.getElementById('experiencia').value,
        descripcion: document.getElementById('descripcion').value.trim(),
        clave_registro: document.getElementById('clave_registro').value.trim(),
        terminos: document.getElementById('terminos').checked,
        newsletter: document.getElementById('newsletter').checked
    };
}

// Validate form
function validateForm(formData) {
    let isValid = true;
    
    // Required fields validation
    if (!formData.nombre) {
        showFieldError('nombre', 'El nombre es obligatorio');
        document.getElementById('nombre').classList.add('is-invalid');
        isValid = false;
    } else {
        document.getElementById('nombre').classList.remove('is-invalid');
        hideFieldError('nombre');
    }
    
    if (!formData.usuario) {
        showFieldError('usuario', 'El usuario es obligatorio');
        document.getElementById('usuario').classList.add('is-invalid');
        isValid = false;
    } else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.usuario)) {
        showFieldError('usuario', 'El usuario debe tener entre 3 y 20 caracteres (solo letras, números y guiones bajos)');
        document.getElementById('usuario').classList.add('is-invalid');
        isValid = false;
    } else {
        document.getElementById('usuario').classList.remove('is-invalid');
        hideFieldError('usuario');
    }
    
    // Registration key validation
    if (!formData.clave_registro) {
        showFieldError('clave_registro', 'La clave de registro es obligatoria');
        document.getElementById('clave_registro').classList.add('is-invalid');
        isValid = false;
    } else if (!/^NUTRI-[A-Z0-9]+$/.test(formData.clave_registro)) {
        showFieldError('clave_registro', 'Formato de clave inválido. Debe ser NUTRI-XXXX');
        document.getElementById('clave_registro').classList.add('is-invalid');
        isValid = false;
    } else {
        document.getElementById('clave_registro').classList.remove('is-invalid');
        hideFieldError('clave_registro');
    }
    
    // Email validation (optional)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
        showFieldError('email', 'Por favor, ingresa un email válido');
        document.getElementById('email').classList.add('is-invalid');
        isValid = false;
    } else {
        document.getElementById('email').classList.remove('is-invalid');
        hideFieldError('email');
    }
    
    if (!formData.password) {
        showFieldError('password', 'La contraseña es obligatoria');
        document.getElementById('password').classList.add('is-invalid');
        isValid = false;
    } else if (formData.password.length < 8) {
        showFieldError('password', 'La contraseña debe tener al menos 8 caracteres');
        document.getElementById('password').classList.add('is-invalid');
        isValid = false;
    } else {
        document.getElementById('password').classList.remove('is-invalid');
        hideFieldError('password');
    }
    
    if (!formData.confirmPassword) {
        showFieldError('confirmPassword', 'Confirma tu contraseña');
        document.getElementById('confirmPassword').classList.add('is-invalid');
        isValid = false;
    } else if (formData.password !== formData.confirmPassword) {
        showFieldError('confirmPassword', 'Las contraseñas no coinciden');
        document.getElementById('confirmPassword').classList.add('is-invalid');
        isValid = false;
    } else {
        document.getElementById('confirmPassword').classList.remove('is-invalid');
        hideFieldError('confirmPassword');
    }
    
    if (!formData.terminos) {
        showAlert('Debes aceptar los términos y condiciones para continuar', 'warning');
        isValid = false;
    }
    
    return isValid;
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
        top: 20px;
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

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .is-invalid {
        border-color: #dc3545 !important;
        box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25) !important;
    }
    
    .invalid-feedback {
        display: block;
        width: 100%;
        margin-top: 0.25rem;
        font-size: 0.875rem;
        color: #dc3545;
    }
`;
document.head.appendChild(style);
