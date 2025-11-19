// ========== PARTICLE BACKGROUND ANIMATION ==========
const canvas = document.getElementById('particles');
const ctx = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const particles = [];
const particleCount = 100;

class Particle {
    constructor() {
        this.x = Math.random() * canvas.width;
        this.y = Math.random() * canvas.height;
        this.size = Math.random() * 2 + 0.5;
        this.speedX = Math.random() * 1 - 0.5;
        this.speedY = Math.random() * 1 - 0.5;
        this.opacity = Math.random() * 0.5 + 0.2;
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
    }

    draw() {
        ctx.fillStyle = `rgba(0, 173, 239, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initParticles() {
    for (let i = 0; i < particleCount; i++) {
        particles.push(new Particle());
    }
}

function animateParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    particles.forEach(particle => {
        particle.update();
        particle.draw();
    });

    // Draw connections
    particles.forEach((a, i) => {
        particles.slice(i + 1).forEach(b => {
            const dx = a.x - b.x;
            const dy = a.y - b.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 100) {
                ctx.strokeStyle = `rgba(0, 173, 239, ${0.2 * (1 - distance / 100)})`;
                ctx.lineWidth = 0.5;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.stroke();
            }
        });
    });

    requestAnimationFrame(animateParticles);
}

initParticles();
animateParticles();

// Resize handler
window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// ========== SCROLL REVEAL ANIMATIONS ==========
const revealElements = document.querySelectorAll('.reveal-fade, .reveal-scale, .reveal-slide-left, .reveal-slide-right, .reveal-slide-up');

const revealOnScroll = () => {
    const windowHeight = window.innerHeight;
    const revealPoint = 150;

    revealElements.forEach(element => {
        const elementTop = element.getBoundingClientRect().top;

        if (elementTop < windowHeight - revealPoint) {
            element.classList.add('active');
        }
    });
};

window.addEventListener('scroll', revealOnScroll);
revealOnScroll(); // Initial check

// ========== STATS COUNTER ANIMATION ==========
const statItems = document.querySelectorAll('.stat-item');

const animateStats = () => {
    statItems.forEach(item => {
        const targetCount = parseInt(item.getAttribute('data-count'));
        const statNumber = item.querySelector('.stat-number');
        let currentCount = 0;
        const increment = targetCount / 100;
        const isPercentage = statNumber.textContent.includes('%');
        const hasPlus = statNumber.textContent.includes('+');

        if (item.getBoundingClientRect().top < window.innerHeight && !item.classList.contains('counted')) {
            item.classList.add('counted');
            item.classList.add('active');

            const counter = setInterval(() => {
                currentCount += increment;
                if (currentCount >= targetCount) {
                    currentCount = targetCount;
                    clearInterval(counter);
                }

                if (isPercentage) {
                    statNumber.textContent = Math.floor(currentCount) + '%';
                } else if (hasPlus) {
                    statNumber.textContent = Math.floor(currentCount).toLocaleString() + '+';
                } else {
                    statNumber.textContent = Math.floor(currentCount).toLocaleString();
                }
            }, 20);
        }
    });
};

window.addEventListener('scroll', animateStats);
animateStats(); // Initial check

// ========== SMOOTH SCROLLING ==========
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

// ========== NAVBAR BACKGROUND ON SCROLL ==========
const navbar = document.querySelector('.navbar');
let lastScroll = 0;

window.addEventListener('scroll', () => {
    const currentScroll = window.pageYOffset;

    if (currentScroll > 100) {
        navbar.style.background = 'rgba(45, 41, 38, 0.98)';
        navbar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.2)';
    } else {
        navbar.style.background = 'rgba(45, 41, 38, 0.95)';
        navbar.style.boxShadow = '0 2px 20px rgba(0, 0, 0, 0.1)';
    }

    lastScroll = currentScroll;
});

// ========== FORM SUBMISSION ==========
const contactForm = document.querySelector('.contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();

        // Create ripple effect
        const button = contactForm.querySelector('.submit-button');
        const ripple = button.querySelector('.button-ripple');

        // Trigger ripple animation
        ripple.style.transform = 'scale(4)';
        ripple.style.opacity = '1';

        setTimeout(() => {
            ripple.style.transform = 'scale(0)';
            ripple.style.opacity = '0';
        }, 600);

        // Show success message
        setTimeout(() => {
            alert('Thank you for your message! We will get back to you soon.');
            contactForm.reset();
        }, 700);
    });
}

// ========== PROGRAM CARDS HOVER EFFECT ==========
const programCards = document.querySelectorAll('.program-card');

programCards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const glow = card.querySelector('.card-glow');
        if (glow) {
            glow.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(0, 173, 239, 0.15) 0%, transparent 50%)`;
        }
    });
});

// ========== TESTIMONIAL CARDS SHINE EFFECT ==========
const testimonialCards = document.querySelectorAll('.testimonial-card');

testimonialCards.forEach(card => {
    card.addEventListener('mouseenter', () => {
        const shine = card.querySelector('.card-shine');
        if (shine) {
            shine.style.left = '-100%';
            setTimeout(() => {
                shine.style.transition = 'left 0.6s ease';
                shine.style.left = '200%';
            }, 10);
        }
    });

    card.addEventListener('mouseleave', () => {
        const shine = card.querySelector('.card-shine');
        if (shine) {
            shine.style.transition = 'none';
            shine.style.left = '-100%';
        }
    });
});

// ========== PARALLAX EFFECT ON HERO ==========
window.addEventListener('scroll', () => {
    const scrolled = window.pageYOffset;
    const heroContent = document.querySelector('.hero-content');
    const heroParticles = document.querySelector('.hero-particles');

    if (heroContent && scrolled < window.innerHeight) {
        heroContent.style.transform = `translateY(${scrolled * 0.5}px)`;
        heroContent.style.opacity = 1 - scrolled / 700;
    }

    if (heroParticles && scrolled < window.innerHeight) {
        heroParticles.style.transform = `translateY(${scrolled * 0.3}px)`;
    }
});

// ========== LAZY LOADING ENHANCEMENT ==========
if ('IntersectionObserver' in window) {
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.classList.add('loaded');
                observer.unobserve(img);
            }
        });
    });

    document.querySelectorAll('img[data-src]').forEach(img => {
        imageObserver.observe(img);
    });
}

// ========== CURSOR TRAIL EFFECT (OPTIONAL) ==========
const createCursorTrail = () => {
    let mouseX = 0;
    let mouseY = 0;
    let currentX = 0;
    let currentY = 0;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    const trail = document.createElement('div');
    trail.style.cssText = `
        position: fixed;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: rgba(0, 173, 239, 0.3);
        pointer-events: none;
        z-index: 9999;
        transition: transform 0.1s ease;
    `;
    document.body.appendChild(trail);

    function animate() {
        currentX += (mouseX - currentX) * 0.1;
        currentY += (mouseY - currentY) * 0.1;

        trail.style.left = currentX + 'px';
        trail.style.top = currentY + 'px';

        requestAnimationFrame(animate);
    }

    animate();
};

// Uncomment to enable cursor trail
// createCursorTrail();

// ========== HIDE SCROLL INDICATOR ON SCROLL ==========
const scrollIndicator = document.querySelector('.scroll-indicator');
let lastScrollTop = 0;

window.addEventListener('scroll', () => {
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    if (scrollTop > 100) {
        scrollIndicator.style.opacity = '0';
        scrollIndicator.style.pointerEvents = 'none';
    } else {
        scrollIndicator.style.opacity = '1';
        scrollIndicator.style.pointerEvents = 'auto';
    }

    lastScrollTop = scrollTop;
});

// ========== PAGE LOAD ANIMATION ==========
window.addEventListener('load', () => {
    document.body.style.opacity = '0';
    setTimeout(() => {
        document.body.style.transition = 'opacity 0.5s ease';
        document.body.style.opacity = '1';
    }, 100);
});

console.log('🚗 Mercedes-Benz Tech Innovation - Interactive Experience Loaded');
console.log('✨ Animations: Active');
console.log('🎨 Design: Dynamic & Beautiful');
