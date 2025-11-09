// Navbar scroll effect
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            const offsetTop = target.offsetTop - 80;
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
            
            // Close mobile menu if open
            const navbarCollapse = document.querySelector('.navbar-collapse');
            if (navbarCollapse && navbarCollapse.classList.contains('show')) {
                const bsCollapse = bootstrap.Collapse.getInstance(navbarCollapse);
                if (bsCollapse) {
                    bsCollapse.hide();
                }
            }
        }
    });
});

// Add active state to navigation links based on scroll position
document.addEventListener('DOMContentLoaded', () => {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.navbar-nav .nav-link');
    
    function highlightNavigation() {
        const scrollY = window.pageYOffset;
        
        sections.forEach(section => {
            const sectionHeight = section.offsetHeight;
            const sectionTop = section.offsetTop - 100;
            const sectionId = section.getAttribute('id');
            const navLink = document.querySelector(`.navbar-nav .nav-link[href="#${sectionId}"]`);
            
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
                navLinks.forEach(link => link.classList.remove('active'));
                if (navLink) {
                    navLink.classList.add('active');
                }
            }
        });
    }
    
    window.addEventListener('scroll', highlightNavigation);
    highlightNavigation();
    
    // WhatsApp links - Replace with actual phone numbers
    const whatsappPresencial = document.getElementById('whatsappPresencial');
    const whatsappOnline = document.getElementById('whatsappOnline');
    
    // Format: https://wa.me/549XXXXXXXXXX?text=Mensaje
    // Replace XXXXXXXXXX with actual phone numbers (country code + number without + or spaces)
    if (whatsappPresencial) {
        whatsappPresencial.addEventListener('click', function(e) {
            e.preventDefault();
            // TODO: Replace with actual WhatsApp number for presencial consultations
            const phoneNumber = '549XXXXXXXXXX'; // Replace with actual number
            const message = encodeURIComponent('Hola, me interesa agendar una consulta presencial.');
            window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        });
    }
    
    if (whatsappOnline) {
        whatsappOnline.addEventListener('click', function(e) {
            e.preventDefault();
            // TODO: Replace with actual WhatsApp number for online consultations
            const phoneNumber = '549XXXXXXXXXX'; // Replace with actual number
            const message = encodeURIComponent('Hola, me interesa agendar una consulta online.');
            window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
        });
    }
    
    // Email link for plans
    const emailPlanes = document.getElementById('emailPlanes');
    if (emailPlanes) {
        emailPlanes.addEventListener('click', function(e) {
            e.preventDefault();
            // TODO: Replace with actual email address
            const email = 'contacto@vipnutricion.com'; // Replace with actual email
            const subject = encodeURIComponent('Solicitud de Plan Alimentario');
            const body = encodeURIComponent('Hola,\n\nMe interesa solicitar un plan alimentario personalizado.\n\nGracias.');
            window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
        });
    }
    
    // TikTok link
    const tiktokLink = document.getElementById('tiktokLink');
    if (tiktokLink) {
        tiktokLink.addEventListener('click', function(e) {
            e.preventDefault();
            // TODO: Replace with actual TikTok URL
            const tiktokUrl = '#'; // Replace with actual URL
            window.open(tiktokUrl, '_blank');
        });
    }
    
    // Ziesta TV link
    const ziestLink = document.getElementById('ziestaLink');
    if (ziestLink) {
        ziestLink.addEventListener('click', function(e) {
            e.preventDefault();
            // TODO: Replace with actual Ziesta TV URL
            const ziestUrl = 'https://www.ziesta.tv/...'; // Replace with actual URL
            window.open(ziestUrl, '_blank');
        });
    }
});
