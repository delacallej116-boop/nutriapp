// Smooth scroll functions
function scrollToContact() {
    document.getElementById('contact').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

function scrollToServices() {
    document.getElementById('services').scrollIntoView({ 
        behavior: 'smooth',
        block: 'start'
    });
}

// Contact functions
function openWhatsApp() {
    const phoneNumber = '5491112345678'; // Reemplazar con número real
    const message = encodeURIComponent('Hola, me interesa agendar una consulta nutricional.');
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
}

function openEmail() {
    const email = 'contacto@nutricionista.com'; // Reemplazar con email real
    const subject = encodeURIComponent('Consulta - Nutrición');
    const body = encodeURIComponent('Hola,\n\nMe gustaría agendar una consulta nutricional.\n\nGracias.');
    window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
}

// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.querySelector('.navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth scroll for nav links
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', function(e) {
        const href = this.getAttribute('href');
        if (href.startsWith('#')) {
            e.preventDefault();
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                // Close mobile menu if open
                const navbarCollapse = document.querySelector('.navbar-collapse');
                if (navbarCollapse.classList.contains('show')) {
                    const bsCollapse = new bootstrap.Collapse(navbarCollapse);
                    bsCollapse.hide();
                }
            }
        }
    });
});

// Typewriter Effect
function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.innerHTML = '';
    
    function type() {
        if (i < text.length) {
            // Handle line breaks
            if (text[i] === '\n') {
                element.innerHTML = element.innerHTML.replace('<span class="cursor">|</span>', '') + '<br><span class="cursor">|</span>';
            } else {
                element.innerHTML = element.innerHTML.replace('<span class="cursor">|</span>', '') + text.charAt(i) + '<span class="cursor">|</span>';
            }
            i++;
            setTimeout(type, speed);
        } else {
            // Remove cursor when finished (optional - you can keep it)
            // element.innerHTML = element.innerHTML.replace('<span class="cursor">|</span>', '');
        }
    }
    
    // Start with cursor
    element.innerHTML = '<span class="cursor">|</span>';
    type();
}

// Initialize typewriter effect when page loads
document.addEventListener('DOMContentLoaded', () => {
    const typewriterElement = document.getElementById('typewriter-text');
    if (typewriterElement) {
        const fullText = 'Nutrición clínica y deportiva personalizada.\nTu bienestar comienza aquí.';
        // Wait a bit for hero animation
        setTimeout(() => {
            typeWriter(typewriterElement, fullText, 50);
        }, 800);
    }
});

