// Scroll-triggered fade-in animations
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
});

// Stagger children for grid layouts
const staggerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const children = entry.target.querySelectorAll('.animate-fade-in');
            children.forEach((child, i) => {
                child.style.animationDelay = `${i * 0.08}s`;
                child.classList.add('visible');
            });
            staggerObserver.unobserve(entry.target);
        }
    });
}, {
    threshold: 0.05,
    rootMargin: '0px 0px -20px 0px'
});

document.addEventListener('DOMContentLoaded', () => {
    // Observe individual elements
    document.querySelectorAll('.animate-fade-in').forEach(el => {
        // Skip elements that are children of grids (handled by stagger)
        if (!el.parentElement.classList.contains('services-grid') &&
            !el.parentElement.classList.contains('why-grid') &&
            !el.parentElement.classList.contains('approach-grid') &&
            !el.parentElement.classList.contains('faq-grid') &&
            !el.parentElement.classList.contains('industries-grid') &&
            !el.parentElement.classList.contains('testimonials-grid')) {
            observer.observe(el);
        }
    });

    // Observe grid parents for staggered animations
    document.querySelectorAll('.services-grid, .why-grid, .approach-grid, .faq-grid, .industries-grid, .testimonials-grid').forEach(grid => {
        staggerObserver.observe(grid);
    });

    // Navbar background on scroll
    const navbar = document.querySelector('.navbar');
    let lastScroll = 0;
    
    window.addEventListener('scroll', () => {
        const currentScroll = window.scrollY;
        
        if (currentScroll > 100) {
            navbar.style.boxShadow = '0 1px 12px rgba(0,0,0,0.06)';
        } else {
            navbar.style.boxShadow = 'none';
        }
        
        lastScroll = currentScroll;
    }, { passive: true });
});
