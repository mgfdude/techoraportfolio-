document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer
    const yearSpan = document.getElementById('year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // Navbar scroll effect
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Mobile menu toggle
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelector('.nav-links');
    const links = document.querySelectorAll('.nav-links li a');
    const menuOverlay = document.querySelector('.menu-overlay');

    const closeMenu = () => {
        navLinks.classList.remove('active');
        if (menuOverlay) menuOverlay.classList.remove('active');
        document.documentElement.classList.remove('menu-open');
        document.body.classList.remove('menu-open');
        if (hamburger) hamburger.innerHTML = '<i class="fa-solid fa-bars"></i>';
    };

    if (hamburger) {
        hamburger.addEventListener('click', () => {
            const isActive = navLinks.classList.toggle('active');
            if (menuOverlay) menuOverlay.classList.toggle('active');
            document.documentElement.classList.toggle('menu-open');
            document.body.classList.toggle('menu-open');
            hamburger.innerHTML = isActive
                ? '<i class="fa-solid fa-xmark"></i>'
                : '<i class="fa-solid fa-bars"></i>';
        });
    }

    if (menuOverlay) {
        menuOverlay.addEventListener('click', closeMenu);
    }

    const menuCloseBtn = document.querySelector('.menu-close');
    if (menuCloseBtn) {
        menuCloseBtn.addEventListener('click', closeMenu);
    }

    // Mobile Dropdown Toggle
    const dropdownToggles = document.querySelectorAll('.dropdown-toggle');
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();

            const parent = toggle.closest('.dropdown');

            // close others
            document.querySelectorAll('.dropdown').forEach(d => {
                if (d !== parent) d.classList.remove('active');
            });

            parent.classList.toggle('active');
        });
    });

    // Close mobile menu when link is clicked
    links.forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    // Prevent background scrolling on iOS/mobile when menu is open
    document.addEventListener('touchmove', (e) => {
        if (document.body.classList.contains('menu-open')) {
            e.preventDefault();
        }
    }, { passive: false });

    // Handle initial progress bar animation using IntersectionObserver
    const progressBars = document.querySelectorAll('.progress');

    // Set initial width to 0
    progressBars.forEach(bar => {
        const targetWidth = bar.style.width;
        bar.setAttribute('data-target', targetWidth);
        bar.style.width = '0%';
    });

    const skillObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const bar = entry.target;
                const targetWidth = bar.getAttribute('data-target');
                setTimeout(() => {
                    bar.style.transition = 'width 1.5s cubic-bezier(0.1, 0.5, 0.1, 1)';
                    bar.style.width = targetWidth;
                }, 100);
                skillObserver.unobserve(bar);
            }
        });
    }, { threshold: 0.5 });

    progressBars.forEach(bar => {
        skillObserver.observe(bar);
    });

    // Handle contact form submission
    const contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const btn = contactForm.querySelector('button[type="submit"]');
            const originalText = btn.innerHTML;

            btn.innerHTML = 'Sending... <i class="fa-solid fa-spinner fa-spin"></i>';
            btn.style.opacity = '0.7';
            btn.style.pointerEvents = 'none';

            const formData = new FormData(contactForm);
            const data = new URLSearchParams(formData);

            fetch(contactForm.action, {
                method: 'POST',
                mode: 'no-cors',
                body: data
            }).then(() => {
                contactForm.reset();
                btn.innerHTML = originalText;
                btn.style.pointerEvents = 'auto';
                btn.style.opacity = '1';

                const modal = document.getElementById('successModal');
                if (modal) {
                    modal.classList.add('active');
                    document.body.classList.add('modal-open');
                    document.documentElement.classList.add('modal-open');
                }
            }).catch(error => {
                console.error('Error:', error);
                btn.innerHTML = 'Error! <i class="fa-solid fa-xmark"></i>';
                btn.style.opacity = '1';
                btn.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';

                setTimeout(() => {
                    btn.innerHTML = originalText;
                    btn.style.background = '';
                    btn.style.pointerEvents = 'auto';
                }, 3000);
            });
        });
    }

    // Modal close logic
    const modal = document.getElementById('successModal');
    const closeBtn = document.getElementById('closeModalBtn');

    if (modal && closeBtn) {
        closeBtn.addEventListener('click', () => {
            modal.classList.remove('active');
            document.body.classList.remove('modal-open');
            document.documentElement.classList.remove('modal-open');
        });

        // Close on clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                document.body.classList.remove('modal-open');
                document.documentElement.classList.remove('modal-open');
            }
        });
    }
});
