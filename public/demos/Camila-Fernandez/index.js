// ===========================
// HEADER SCROLL EFFECT
// ===========================

const navbar = document.querySelector('.navbar');

function updateNavbar() {
    if (window.scrollY >= 50) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

// Verificar estado inicial
updateNavbar();

// Escuchar el scroll
window.addEventListener('scroll', updateNavbar);

// ===========================
// SCROLL SUAVE
// ===========================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        const href = this.getAttribute('href');
        if (href === '#') return;
        
        e.preventDefault();
        const target = document.querySelector(href);
        
        if (target) {
            const headerHeight = navbar.offsetHeight;
            const targetPosition = target.offsetTop - headerHeight;
            
            window.scrollTo({
                top: targetPosition,
                behavior: 'smooth'
            });
            
            // Cerrar menú móvil si está abierto
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse.classList.contains('show')) {
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bsCollapse) {
                    bsCollapse.hide();
                }
            }
        }
    });
});

// ===========================
// FORMULARIO DE CONTACTO
// ===========================

const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Aquí puedes agregar la lógica para enviar el formulario
        // Por ejemplo, usando fetch API o un servicio de email
        
        // Mensaje de confirmación temporal
        const submitButton = contactForm.querySelector('button[type="submit"]');
        const originalText = submitButton.textContent;
        
        submitButton.textContent = 'Enviando...';
        submitButton.disabled = true;
        
        // Simulación de envío (reemplazar con lógica real)
        setTimeout(() => {
            alert('¡Mensaje enviado con éxito! Te contactaremos pronto.');
            contactForm.reset();
            submitButton.textContent = originalText;
            submitButton.disabled = false;
        }, 1500);
    });
}

// ===========================
// ANIMACIONES AL SCROLL
// ===========================

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

// Aplicar animaciones a las cards
const animateElements = document.querySelectorAll('.service__card, .testimonial__card');
animateElements.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
});

// ===========================
// ACTUALIZAR AÑO EN FOOTER
// ===========================

const currentYear = new Date().getFullYear();
const footerCopyright = document.querySelector('.footer p');

if (footerCopyright) {
    footerCopyright.textContent = footerCopyright.textContent.replace('2024', currentYear);
}


