// Premium Reservation System JavaScript
document.addEventListener('DOMContentLoaded', function() {
    // Initialize premium components
    initializePremiumComponents();
    
    // Form elements
    const reservationForm = document.getElementById('reservationForm');
    const fechaInput = document.getElementById('fecha');
    const horaInput = document.getElementById('hora'); // Hidden input
    const hourSelectionContainer = document.getElementById('hourSelectionContainer');
    const alertContainer = document.getElementById('alertContainer');
    const submitBtn = document.getElementById('submitBtn');
    
    // Set minimum date (tomorrow)
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    fechaInput.min = tomorrow.toISOString().split('T')[0];
    
    // Initialize hour selection to empty state
    resetHourSelection();
    
    // Debug: Log initial state
    console.log('🔍 Estado inicial de la selección de horarios:', {
        container: hourSelectionContainer,
        hiddenInput: horaInput.value
    });
    
    // Premium form validation
    initializePremiumValidation();
    
    // Date change handler with premium loading
    fechaInput.addEventListener('change', async function() {
        const selectedDate = fechaInput.value;
        console.log(`📅 Fecha seleccionada: ${selectedDate}`);
        
        if (selectedDate) {
            await fetchAvailableSlotsPremium(selectedDate);
        } else {
            resetHourSelection();
        }
    });
    
    // Premium form submission
    reservationForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        await submitReservationPremium();
    });
    
    // Initialize premium components
    function initializePremiumComponents() {
        // Add scroll effect to navbar
        window.addEventListener('scroll', function() {
            const navbar = document.querySelector('.premium-navbar');
            if (window.scrollY > 50) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });
        
        // Add premium animations to form sections
        const formSections = document.querySelectorAll('.form-section-premium');
        formSections.forEach((section, index) => {
            section.style.animationDelay = `${index * 0.1}s`;
        });
        
        // Add premium focus effects
        const formControls = document.querySelectorAll('.form-control-premium, .form-select-premium');
        formControls.forEach(control => {
            control.addEventListener('focus', function() {
                this.parentElement.classList.add('focused');
            });
            
            control.addEventListener('blur', function() {
                this.parentElement.classList.remove('focused');
            });
        });
    }
    
    // Premium form validation
    function initializePremiumValidation() {
        const form = document.getElementById('reservationForm');
        
        // Real-time validation
        const inputs = form.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('blur', function() {
                validateField(this);
            });
            
            input.addEventListener('input', function() {
                if (this.classList.contains('is-invalid')) {
                    validateField(this);
                }
            });
        });
    }
    
    // Validate individual field
    function validateField(field) {
        const value = field.value.trim();
        const fieldName = field.name;
        let isValid = true;
        let errorMessage = '';
        
        // Remove previous validation classes
        field.classList.remove('is-valid', 'is-invalid');
        
        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = `El campo ${getFieldLabel(fieldName)} es obligatorio`;
        }
        
        // Specific validations
        if (value && isValid) {
            switch (fieldName) {
                case 'email':
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(value)) {
                        isValid = false;
                        errorMessage = 'El formato del email no es válido';
                    }
                    break;
                    
                case 'telefono':
                    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
                    if (!phoneRegex.test(value)) {
                        isValid = false;
                        errorMessage = 'El formato del teléfono no es válido';
                    }
                    break;
                    
                case 'fecha':
                    const selectedDate = new Date(value);
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    if (selectedDate <= today) {
                        isValid = false;
                        errorMessage = 'La fecha debe ser futura';
                    }
                    break;
            }
        }
        
        // Apply validation classes
        if (isValid) {
            field.classList.add('is-valid');
        } else {
            field.classList.add('is-invalid');
            field.setCustomValidity(errorMessage);
        }
        
        return isValid;
    }
    
    // Get field label for error messages
    function getFieldLabel(fieldName) {
        const labels = {
            'nombre': 'nombre',
            'apellido': 'apellido',
            'telefono': 'teléfono',
            'email': 'email',
            'fecha': 'fecha',
            'hora': 'hora',
            'tipo_consulta': 'tipo de consulta'
        };
        return labels[fieldName] || fieldName;
    }
    
    // Validate entire form
    function validateForm() {
        const form = document.getElementById('reservationForm');
        const inputs = form.querySelectorAll('input[required], select[required]');
        let isFormValid = true;
        
        inputs.forEach(input => {
            if (!validateField(input)) {
                isFormValid = false;
            }
        });
        
        
        return isFormValid;
    }
    
    // Fetch available slots with premium loading
    async function fetchAvailableSlotsPremium(date) {
        try {
            console.log(`🔍 Cargando horarios para fecha: ${date}`);
            
            // Show loading state
            showHourLoading();
            
            // Call API to get real available slots
            const response = await fetch(`/api/reservas/disponibilidad?fecha=${date}&profesional_id=1`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log('📊 Respuesta de la API:', result);
            
            if (result.success && result.data && result.data.length > 0) {
                // Show available slots
                showAvailableSlots(result.data);
                showPremiumAlert('info', `Se encontraron ${result.data.length} horarios disponibles para ${formatDate(date)}`);
                console.log(`✅ Horarios cargados: ${result.data.join(', ')}`);
            } else {
                // Show no slots message
                showNoSlotsAvailable();
                const message = result.message || 'No hay horarios disponibles para la fecha seleccionada. Por favor, elige otra fecha.';
                showPremiumAlert('warning', message);
                console.log('⚠️ No hay horarios disponibles para esta fecha');
            }
            
        } catch (error) {
            console.error('❌ Error al obtener horarios disponibles:', error);
            showPremiumAlert('danger', 'Error al cargar horarios disponibles. Inténtalo de nuevo.');
            resetHourSelection();
        }
    }
    
    
    // Submit reservation with premium loading
    async function submitReservationPremium() {
        try {
            // Show loading state
            submitBtn.classList.add('btn-loading-premium');
            submitBtn.disabled = true;
            
            // Collect form data
            const formData = {
                nombre: document.getElementById('nombre').value.trim(),
                apellido: document.getElementById('apellido').value.trim(),
                telefono: document.getElementById('telefono').value.trim(),
                email: document.getElementById('email').value.trim(),
                fecha: fechaInput.value,
                hora: horaInput.value,
                tipo_consulta: document.getElementById('tipo_consulta').value,
                motivo_consulta: document.getElementById('motivo_consulta').value.trim(),
                observaciones: document.getElementById('observaciones').value.trim()
            };
            
            console.log('📤 Datos enviados al servidor:', formData);
            
            // Submit to API
            const response = await fetch('/api/reservas', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            });
            
            const result = await response.json();
            console.log('📥 Respuesta del servidor:', result);
            console.log('📊 result.data:', result.data);
            console.log('📊 result.data.nombre:', result.data?.nombre);
            console.log('📊 result.data.apellido:', result.data?.apellido);
            console.log('📊 result.data.tipo_consulta:', result.data?.tipo_consulta);
            
            if (result.success) {
                // Show success modal
                console.log('🎯 Llamando showSuccessModal con:', result.data);
                showSuccessModal(result.data);
                
                // Reset form
                reservationForm.reset();
                resetHourSelection();
                
                // Clear alerts
                alertContainer.innerHTML = '';
                
            } else {
                showPremiumAlert('danger', result.message);
            }
            
        } catch (error) {
            console.error('Error al enviar la reserva:', error);
            showPremiumAlert('danger', 'Error de conexión con el servidor. Inténtalo de nuevo más tarde.');
        } finally {
            // Remove loading state
            submitBtn.classList.remove('btn-loading-premium');
            submitBtn.disabled = false;
        }
    }
    
    // Show premium alert
    function showPremiumAlert(type, message) {
        const alertClass = `alert-premium alert-${type}-premium`;
        
        alertContainer.innerHTML = `
            <div class="${alertClass} alert-dismissible fade show" role="alert">
                <i class="fas fa-${getAlertIcon(type)} me-2"></i>
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = alertContainer.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
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
    
    // Show success modal
    function showSuccessModal(reservationData) {
        console.log('📊 Datos recibidos para el modal:', reservationData);
        console.log('📊 reservationData.nombre:', reservationData.nombre);
        console.log('📊 reservationData.apellido:', reservationData.apellido);
        console.log('📊 reservationData.tipo_consulta:', reservationData.tipo_consulta);
        console.log('📊 reservationData.fecha:', reservationData.fecha);
        console.log('📊 reservationData.pacienteRecurrente:', reservationData.pacienteRecurrente);
        
        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        
        // Populate reservation details
        const detailsContainer = document.getElementById('reservationDetails');
        let contenidoHTML = `
            <p><strong>Nombre:</strong> ${reservationData.nombre || 'N/A'} ${reservationData.apellido || 'N/A'}</p>
            <p><strong>Fecha:</strong> ${formatDate(reservationData.fecha)}</p>
            <p><strong>Hora:</strong> ${reservationData.hora}</p>
            <p><strong>Tipo:</strong> ${getTipoConsultaText(reservationData.tipo_consulta)}</p>
            <p><strong>Código de Cancelación:</strong> <code>${reservationData.codigo_cancelacion}</code></p>
        `;
        
            // 🆕 MOSTRAR INFORMACIÓN DE PACIENTE RECURRENTE (solo si es recurrente)
            if (reservationData.pacienteRecurrente && reservationData.pacienteRecurrente.esRecurrente) {
                const ultimaConsulta = reservationData.pacienteRecurrente.ultimaConsulta;
                const fechaUltima = ultimaConsulta ? formatDate(ultimaConsulta) : 'No disponible';
                
                contenidoHTML += `
                    <div class="alert alert-info mt-3">
                        <h6><i class="fas fa-user-check me-2"></i>Paciente Recurrente</h6>
                        <p class="mb-1"><strong>Total de consultas:</strong> ${reservationData.pacienteRecurrente.totalConsultas}</p>
                        <p class="mb-1"><strong>Última consulta:</strong> ${fechaUltima}</p>
                        <p class="mb-0"><strong>Teléfono:</strong> ${reservationData.pacienteRecurrente.valor}</p>
                        <small class="text-muted">Detectado automáticamente por teléfono</small>
                    </div>
                `;
            }
        
        console.log('📋 Contenido HTML del modal:', contenidoHTML);
        detailsContainer.innerHTML = contenidoHTML;
        
        modal.show();
    }
    
    // Format date for display
    function formatDate(dateString) {
        // La fecha viene en formato YYYY-MM-DD, crear objeto Date correctamente
        const date = new Date(dateString + 'T12:00:00'); // Mediodía para evitar problemas de zona horaria
        
        return date.toLocaleDateString('es-ES', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }
    
    // Get tipo consulta text
    function getTipoConsultaText(tipo) {
        const tipos = {
            'primera_vez': 'Primera consulta',
            'control': 'Control de seguimiento',
            'plan_alimentario': 'Nuevo plan alimentario',
            'consulta_urgente': 'Consulta de urgencia'
        };
        return tipos[tipo] || tipo;
    }
    
    // Add premium interactions
    addPremiumInteractions();
    
    function addPremiumInteractions() {
        // Add hover effects to professional card
        const professionalCard = document.querySelector('.premium-professional');
        if (professionalCard) {
            professionalCard.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-8px) scale(1.02)';
            });
            
            professionalCard.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0) scale(1)';
            });
        }
        
        // Add premium button hover effects
        const premiumButtons = document.querySelectorAll('.btn-premium');
        premiumButtons.forEach(button => {
            button.addEventListener('mouseenter', function() {
                this.style.transform = 'translateY(-2px)';
            });
            
            button.addEventListener('mouseleave', function() {
                this.style.transform = 'translateY(0)';
            });
        });
        
        // Add premium form control focus effects
        const formControls = document.querySelectorAll('.form-control-premium, .form-select-premium');
        formControls.forEach(control => {
            control.addEventListener('focus', function() {
                this.parentElement.style.transform = 'translateY(-1px)';
            });
            
            control.addEventListener('blur', function() {
                this.parentElement.style.transform = 'translateY(0)';
            });
        });
    }
    
    // Initialize premium animations
    initializePremiumAnimations();
    
    function initializePremiumAnimations() {
        // Add intersection observer for scroll animations
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);
        
        // Observe form sections
        const formSections = document.querySelectorAll('.form-section-premium');
        formSections.forEach(section => {
            section.style.opacity = '0';
            section.style.transform = 'translateY(20px)';
            section.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
            observer.observe(section);
        });
    }
    
    // ===== NEW HOUR SELECTION FUNCTIONS =====
    
    // Show loading state for hour selection
    function showHourLoading() {
        hourSelectionContainer.innerHTML = `
            <div class="hour-loading">
                <i class="fas fa-spinner"></i>
                Cargando horarios disponibles...
            </div>
        `;
    }
    
    // Show available slots as clickable buttons
    function showAvailableSlots(slots) {
        const slotsHTML = slots.map(slot => `
            <div class="hour-slot" data-hour="${slot}" onclick="selectHour('${slot}')">
                ${slot}
            </div>
        `).join('');
        
        hourSelectionContainer.innerHTML = `
            <div class="hour-selection-grid">
                ${slotsHTML}
            </div>
        `;
    }
    
    // Show no slots available message
    function showNoSlotsAvailable() {
        hourSelectionContainer.innerHTML = `
            <div class="hour-no-slots">
                <i class="fas fa-calendar-times"></i>
                <p>No hay horarios disponibles para esta fecha</p>
            </div>
        `;
        horaInput.value = '';
    }
    
    // Select hour function (global scope for onclick)
    window.selectHour = function(hour) {
        // Remove previous selection
        const previousSelected = hourSelectionContainer.querySelector('.hour-slot.selected');
        if (previousSelected) {
            previousSelected.classList.remove('selected');
        }
        
        // Add selection to clicked slot
        const selectedSlot = hourSelectionContainer.querySelector(`[data-hour="${hour}"]`);
        if (selectedSlot) {
            selectedSlot.classList.add('selected');
            horaInput.value = hour;
            console.log(`✅ Hora seleccionada: ${hour}`);
        }
    };
    
    // Reset hour selection to empty state
    function resetHourSelection() {
        console.log('🔄 Reseteando selección de horarios...');
        hourSelectionContainer.innerHTML = `
            <div class="hour-selection-placeholder">
                <i class="fas fa-calendar-alt"></i>
                <p>Selecciona primero una fecha para ver los horarios disponibles</p>
            </div>
        `;
        horaInput.value = '';
        console.log('✅ Selección de horarios reseteada');
    }
});