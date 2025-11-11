// Forgot Password Page JavaScript

// Variables globales para recuperación de contraseña
let resetData = {
    usuarioOEmail: '',
    codigoRegistro: '',
    step: 1
};

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    initForgotPasswordPage();
});

// Initialize forgot password page
function initForgotPasswordPage() {
    // Add animation to card
    const card = document.querySelector('.forgot-password-card');
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        card.style.transition = 'all 0.6s ease-out';
        card.style.opacity = '1';
        card.style.transform = 'translateY(0)';
    }, 100);

    // Agregar listeners para Enter
    document.getElementById('resetCodigoRegistro')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && resetData.step === 1) {
            e.preventDefault();
            handlePasswordReset();
        }
    });

    document.getElementById('resetConfirmarContraseña')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && resetData.step === 2) {
            e.preventDefault();
            confirmPasswordReset();
        }
    });
}

// Manejar solicitud de recuperación (Paso 1)
async function handlePasswordReset() {
    const usuarioOEmail = document.getElementById('resetUsuarioOEmail').value.trim();
    const codigoRegistro = document.getElementById('resetCodigoRegistro').value.trim();

    // Validaciones
    if (!usuarioOEmail || !codigoRegistro) {
        showAlert('Por favor, completa todos los campos', 'warning');
        return;
    }

    // Validar formato del código
    const codigoRegex = /^NUTRI-[A-Z0-9]+$/;
    if (!codigoRegex.test(codigoRegistro)) {
        showAlert('El código de registro debe tener el formato NUTRI-XXXX', 'warning');
        return;
    }

    // Mostrar loading
    const button = document.getElementById('resetNextButton');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.classList.add('loading');
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Validando...';

    try {
        const response = await fetch('/api/auth/password-reset/request', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuarioOEmail: usuarioOEmail,
                codigoRegistro: codigoRegistro
            })
        });

        const result = await response.json();

        if (result.success) {
            // Guardar datos para el siguiente paso
            resetData.usuarioOEmail = usuarioOEmail;
            resetData.codigoRegistro = codigoRegistro;
            
            // Mostrar paso 2
            document.getElementById('resetStep1').style.display = 'none';
            document.getElementById('resetStep2').style.display = 'block';
            document.getElementById('resetUsuarioNombre').textContent = 
                `Validación exitosa. Usuario: ${result.data.usuario}`;
            
            resetData.step = 2;
            showAlert('Validación exitosa. Ahora ingresa tu nueva contraseña.', 'success');
        } else {
            showAlert(result.message || 'Error al validar los datos', 'error');
        }
    } catch (error) {
        console.error('Error en recuperación de contraseña:', error);
        showAlert('Error de conexión. Verifica tu internet e intenta nuevamente.', 'error');
    } finally {
        button.disabled = false;
        button.classList.remove('loading');
        button.innerHTML = originalText;
    }
}

// Confirmar cambio de contraseña (Paso 2)
async function confirmPasswordReset() {
    const nuevaContraseña = document.getElementById('resetNuevaContraseña').value;
    const confirmarContraseña = document.getElementById('resetConfirmarContraseña').value;

    // Validaciones
    if (!nuevaContraseña || !confirmarContraseña) {
        showAlert('Por favor, completa todos los campos', 'warning');
        return;
    }

    if (nuevaContraseña.length < 6) {
        showAlert('La contraseña debe tener al menos 6 caracteres', 'warning');
        return;
    }

    if (nuevaContraseña !== confirmarContraseña) {
        showAlert('Las contraseñas no coinciden', 'warning');
        return;
    }

    // Mostrar loading
    const button = document.getElementById('resetConfirmButton');
    const originalText = button.innerHTML;
    button.disabled = true;
    button.classList.add('loading');
    button.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>Actualizando...';

    try {
        const response = await fetch('/api/auth/password-reset/reset', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuarioOEmail: resetData.usuarioOEmail,
                codigoRegistro: resetData.codigoRegistro,
                nuevaContraseña: nuevaContraseña
            })
        });

        const result = await response.json();

        if (result.success) {
            showAlert('¡Contraseña actualizada exitosamente! Redirigiendo al login...', 'success');
            
            // Redirigir al login después de 2 segundos
            setTimeout(() => {
                window.location.href = '/login';
            }, 2000);
        } else {
            showAlert(result.message || 'Error al actualizar la contraseña', 'error');
        }
    } catch (error) {
        console.error('Error al resetear contraseña:', error);
        showAlert('Error de conexión. Verifica tu internet e intenta nuevamente.', 'error');
    } finally {
        button.disabled = false;
        button.classList.remove('loading');
        button.innerHTML = originalText;
    }
}

// Show alert function
function showAlert(message, type = 'info') {
    // Remove existing alerts
    const existingAlerts = document.querySelectorAll('.custom-alert');
    existingAlerts.forEach(alert => alert.remove());

    // Mapear 'error' a 'danger' para Bootstrap
    const bootstrapType = type === 'error' ? 'danger' : type;
    
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${bootstrapType} custom-alert position-fixed`;
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
        'error': 'exclamation-triangle',
        'warning': 'exclamation-circle',
        'info': 'info-circle'
    };
    return icons[type] || 'info-circle';
}

