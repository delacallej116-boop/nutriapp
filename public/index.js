// Datos de las demos
// IMPORTANTE: 
// 1. Cada sitio está en su carpeta dentro de 'demos/'
// 2. Puedes agregar screenshots en 'images/demos/' (ej: images/demos/ale-rosas.jpg)
// 3. Si agregas imágenes, cambia 'image: null' por la ruta de la imagen

const demos = [
    {
        name: "María González",
        image: null, // Ejemplo: 'images/demos/maria-gonzalez.jpg'
        gradient: "linear-gradient(135deg, #7dd3c0 0%, #5fb8a5 100%)",
        tags: ["Diseño natural 🌿", "Colores cálidos 🍑"],
        url: "demos/Maria-Gonzalez/index.html"
    },
    {
        name: "Laura Martínez",
        image: null, // Ejemplo: 'images/demos/laura-martinez.jpg'
        gradient: "linear-gradient(135deg, #f5a3b7 0%, #e88ba3 100%)",
        tags: ["Estilo moderno 🩺", "Minimalista ✨"],
        url: "demos/Laura-Martinez/index.html"
    },
    {
        name: "Ana Rodríguez",
        image: null, // Ejemplo: 'images/demos/ana-rodriguez.jpg'
        gradient: "linear-gradient(135deg, #ffd89b 0%, #ffc870 100%)",
        tags: ["Diseño natural 🌿", "Colores cálidos 🍑"],
        url: "demos/Ana-Rodriguez/index.html"
    },
    {
        name: "Camila Fernández",
        image: null, // Ejemplo: 'images/demos/camila-fernandez.jpg'
        gradient: "linear-gradient(135deg, #7dd3c0 0%, #5fb8a5 100%)",
        tags: ["Estilo moderno 🩺", "Profesional 💼"],
        url: "demos/Camila-Fernandez/index.html"
    },
    {
        name: "Valentina Torres",
        image: null, // Ejemplo: 'images/demos/valentina-torres.jpg'
        gradient: "linear-gradient(135deg, #f5a3b7 0%, #e88ba3 100%)",
        tags: ["Minimalista ✨", "Colores cálidos 🍑"],
        url: "demos/Valentina-Torres/index.html"
    },
    {
        name: "Isabella Romero",
        image: null, // Ejemplo: 'images/demos/isabella-romero.jpg'
        gradient: "linear-gradient(135deg, #ffd89b 0%, #ffc870 100%)",
        tags: ["Diseño natural 🌿", "Estilo moderno 🩺"],
        url: "demos/Isabella-Romero/index.html"
    }
];

// Función para renderizar las demos
function renderDemos() {
    const demosGrid = document.getElementById('demosGrid');
    
    demos.forEach(demo => {
        const demoCard = document.createElement('div');
        demoCard.className = 'demo-card';
        
        // Si hay imagen, usar img tag, sino usar gradiente con texto
        const imageContent = demo.image 
            ? `<img src="${demo.image}" alt="${demo.name}" class="demo-image">`
            : `<div class="demo-image" style="background: ${demo.gradient};">
                <span style="font-size: 1.5rem; font-weight: 600;">${demo.name}</span>
               </div>`;
        
        // Codificar la URL correctamente para manejar caracteres especiales como la ñ
        // Codificamos cada parte de la ruta (excepto las barras que separan)
        const encodedUrl = demo.url.split('/').map(part => 
            encodeURIComponent(part)
        ).join('/');
        
        demoCard.innerHTML = `
            ${imageContent}
            <div class="demo-content">
                <h3 class="demo-name">${demo.name}</h3>
                <div class="demo-tags">
                    ${demo.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
                <a href="${encodedUrl}" class="btn-demo" target="_blank" rel="noopener noreferrer"><i class="bi bi-link-45deg me-2"></i>Ver sitio</a>
            </div>
        `;
        
        demosGrid.appendChild(demoCard);
    });
}

// Función para configurar los botones de WhatsApp
function setupWhatsAppButton() {
    // ⚠️ IMPORTANTE: Reemplaza con tu número de WhatsApp
    // Formato: código país + número sin + ni espacios
    // Ejemplos:
    // - Argentina: 5491123456789
    // - México: 5215512345678
    // - Colombia: 573001234567
    const phoneNumber = 'TU_NUMERO_AQUI'; // 🔴 CAMBIAR ESTO
    
    // Mensaje predefinido
    const message = encodeURIComponent('Hola 👋 vi tu portafolio y quiero mi web personalizada.');
    
    // URL de WhatsApp
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    
    // Configurar todos los botones de WhatsApp
    const whatsappBtn = document.getElementById('whatsappBtn');
    const whatsappBtnHero = document.getElementById('whatsappBtnHero');
    const whatsappBtnContact = document.getElementById('whatsappBtnContact');
    
    if (whatsappBtn) {
        whatsappBtn.href = whatsappUrl;
        whatsappBtn.target = '_blank';
        whatsappBtn.rel = 'noopener noreferrer';
    }
    
    if (whatsappBtnHero) {
        whatsappBtnHero.href = whatsappUrl;
        whatsappBtnHero.target = '_blank';
        whatsappBtnHero.rel = 'noopener noreferrer';
    }
    
    if (whatsappBtnContact) {
        whatsappBtnContact.href = whatsappUrl;
        whatsappBtnContact.target = '_blank';
        whatsappBtnContact.rel = 'noopener noreferrer';
    }
}

// Función para animar elementos al hacer scroll
function animateOnScroll() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                // Delay escalonado para efecto cascada
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0) scale(1)';
                    entry.target.classList.add('animated');
                }, index * 100);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // Observar todas las cards y secciones
    const elementsToAnimate = document.querySelectorAll(
        '.demo-card, .step-card, .tool-feature-card, .include-card, .faq-item, .contact-card, .screen-item, .section-title, .section-subtitle, .try-feature-item, .try-card-preview'
    );
    
    elementsToAnimate.forEach((el, index) => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px) scale(0.95)';
        el.style.transition = 'opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1), transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        observer.observe(el);
    });
    
    // Animación especial para secciones
    const sections = document.querySelectorAll('section');
    sections.forEach(section => {
        const sectionObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('section-visible');
                }
            });
        }, { threshold: 0.2 });
        sectionObserver.observe(section);
    });
}

// Función para manejar la carga de la imagen de perfil
function setupProfileImage() {
    const profileImage = document.getElementById('profileImage');
    const imagePlaceholder = document.getElementById('imagePlaceholder');
    
    if (profileImage && imagePlaceholder) {
        // Intentar cargar la imagen
        const img = new Image();
        img.onload = function() {
            // Si la imagen carga correctamente
            profileImage.src = img.src;
            profileImage.classList.add('loaded');
            imagePlaceholder.classList.add('hidden');
        };
        
        img.onerror = function() {
            // Si la imagen no existe, mostrar placeholder
            profileImage.classList.remove('loaded');
            imagePlaceholder.classList.remove('hidden');
        };
        
        // Intentar cargar la imagen desde la ruta especificada
        img.src = profileImage.getAttribute('src') || 'images/foto-perfil.jpg';
    }
}

// Función para manejar la carga de imágenes de pantallas
function setupScreenImages() {
    const screenImages = [
        { id: 'screenDashboard', placeholderId: 'screenDashboardPlaceholder', src: 'images/screens/dashboard.jpg' },
        { id: 'screenPacientes', placeholderId: 'screenPacientesPlaceholder', src: 'images/screens/pacientes.jpg' },
        { id: 'screenHistoria', placeholderId: 'screenHistoriaPlaceholder', src: 'images/screens/historia.jpg' },
        { id: 'screenAgenda', placeholderId: 'screenAgendaPlaceholder', src: 'images/screens/agenda.jpg' },
        { id: 'screenPlanes', placeholderId: 'screenPlanesPlaceholder', src: 'images/screens/planes.jpg' },
        { id: 'screenAsistencia', placeholderId: 'screenAsistenciaPlaceholder', src: 'images/screens/asistencia.jpg' }
    ];
    
    screenImages.forEach(({ id, placeholderId, src }) => {
        const image = document.getElementById(id);
        const placeholder = document.getElementById(placeholderId);
        
        if (image && placeholder) {
            // Obtener src de data-src si existe, sino usar el src del array
            const imageSrc = image.getAttribute('data-src') || src;
            
            const img = new Image();
            img.onload = function() {
                image.src = img.src;
                image.classList.add('loaded');
                placeholder.classList.add('hidden');
            };
            
            img.onerror = function() {
                // Silenciar el error - simplemente mostrar el placeholder
                image.classList.remove('loaded');
                placeholder.classList.remove('hidden');
                // No establecer src para evitar 404 en la consola
                if (image.src) {
                    image.removeAttribute('src');
                }
            };
            
            // Solo intentar cargar si la imagen tiene data-src o src válido
            if (imageSrc) {
                img.src = imageSrc;
            } else {
                // Si no hay src, mostrar placeholder directamente
                placeholder.classList.remove('hidden');
            }
        }
    });
}

// Función para manejar el navbar
function setupNavbar() {
    const navbar = document.getElementById('mainNavbar');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Efecto al hacer scroll
    function handleScroll() {
        if (window.scrollY > 100) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }
    
    // Ejecutar al cargar para verificar posición inicial
    handleScroll();
    
    // Escuchar scroll
    window.addEventListener('scroll', handleScroll);
    
    // Activar link según la sección visible
    const sections = document.querySelectorAll('section[id]');
    
    window.addEventListener('scroll', () => {
        let current = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            if (window.scrollY >= (sectionTop - 200)) {
                current = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${current}`) {
                link.classList.add('active');
            }
        });
    });
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    renderDemos();
    setupWhatsAppButton();
    setupProfileImage();
    setupScreenImages();
    setupNavbar();
    animateOnScroll();
    
    // Smooth scroll para los enlaces internos
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });
});

// Función para actualizar el contador de lugares disponibles (opcional)
function updateAvailabilityCounter() {
    // Puedes conectar esto con un backend o simplemente dejarlo estático
    // Por ahora, lo dejamos como está en el HTML
}
