document.addEventListener('DOMContentLoaded', () => {
    // Set current year in footer and menu
    const yearSpans = document.querySelectorAll('#year');
    yearSpans.forEach(span => {
        span.textContent = new Date().getFullYear();
    });

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

    // Mobile Dropdown Toggle (mobile only — desktop uses CSS hover)
    document.querySelectorAll('.dropdown-toggle').forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            if (window.innerWidth > 768) return; // let CSS hover handle desktop
            e.preventDefault();

            const parent = toggle.closest('.dropdown');

            // close other open dropdowns
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

const steps = document.querySelectorAll(".step");

const stepEl = document.getElementById("active-step");
const titleEl = document.getElementById("active-title");
const iconEl = document.getElementById("active-icon");
const descEl = document.getElementById("active-desc");

if (stepEl && titleEl && iconEl && descEl && steps.length > 0) {
    // Initialize the first step as active visually
    if (!document.querySelector(".step.active")) {
        steps[0].classList.add("active");
    }

    steps.forEach((step) => {
        step.addEventListener("mouseenter", () => {
            const num = step.querySelector('.step-num') ? step.querySelector('.step-num').innerText : "1";
            const title = step.querySelector('h4') ? step.querySelector('h4').innerText : "";
            const desc = step.querySelector('p') ? step.querySelector('p').innerText : "";
            const icon = step.getAttribute('data-icon') || 'fa-solid fa-check';

            stepEl.innerText = num;
            titleEl.innerText = title;
            descEl.innerText = desc;

            iconEl.className = "";
            iconEl.classList.add(...icon.split(" "));

            steps.forEach(s => s.classList.remove("active"));
            step.classList.add("active");
        });
    });
}

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
// ===== LOGO SLIDER SYSTEM =====

const logos = [
    "/images/product/logo/kunjavas-logo.jpg",
    "/images/product/logo/fathoos-logo.jpg"
];

let currentIndex = 0;
let modal;
let modalImg;
let startX = 0;

document.addEventListener("DOMContentLoaded", () => {

    modal = document.getElementById("logoModal");
    modalImg = document.getElementById("logoModalImg");

    const wrapper = document.querySelector('.logos-wrapper');
    const cards = document.querySelectorAll('.logo-item');
    const dotContainer = document.querySelector('.logo-dots');

    let dots = [];

    // ===== CREATE DOTS DYNAMICALLY =====
    if (dotContainer && cards.length) {
        dotContainer.innerHTML = "";

        cards.forEach((_, index) => {
            const dot = document.createElement('span');
            dot.classList.add('dot');

            if (index === 0) dot.classList.add('active');

            // 🔥 click to jump
            dot.addEventListener('click', () => {
                wrapper.scrollTo({
                    left: cards[index].offsetLeft,
                    behavior: "smooth"
                });
            });

            dotContainer.appendChild(dot);
        });

        dots = document.querySelectorAll('.logo-dots .dot');
    }

    // ===== MODAL SWIPE =====
    if (modal) {
    modal.addEventListener("touchstart", (e) => {
        startX = e.touches[0].clientX;
    });

    modal.addEventListener("touchend", (e) => {
        let endX = e.changedTouches[0].clientX;
        let diff = startX - endX;

        if (diff > 50) showNext();
        else if (diff < -50) showPrev();
    });

    modal.addEventListener("click", (e) => {
        if (e.target === modal) closeLogo();
    
    });
 }

    document.addEventListener("keydown", (e) => {
        if (!modal.classList.contains("active")) return;

        if (e.key === "ArrowRight") showNext();
        if (e.key === "ArrowLeft") showPrev();
        if (e.key === "Escape") closeLogo();
    });

    // ===== TAP vs SWIPE =====
    if (cards.length) {
    cards.forEach((card, index) => {

        let startX = 0;
        let startY = 0;
        let isSwipe = false;

        card.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipe = false;
        });

        card.addEventListener('touchmove', (e) => {
            const dx = Math.abs(e.touches[0].clientX - startX);
            const dy = Math.abs(e.touches[0].clientY - startY);

            if (dx > 10 || dy > 10) {
                isSwipe = true;
            }
        });

        card.addEventListener('touchend', () => {
            if (!isSwipe) openLogo(index);
        });

        card.addEventListener('click', () => {
            if (window.innerWidth > 768) openLogo(index);
        });
    }); 
}

    // ===== MOBILE SNAP =====
    if (wrapper && window.innerWidth <= 768) {

        let isScrolling;

        wrapper.addEventListener('scroll', () => {
            clearTimeout(isScrolling);

            isScrolling = setTimeout(() => {

                let closest = 0;
                let minDiff = Infinity;

                cards.forEach((card, index) => {
                    const diff = Math.abs(wrapper.scrollLeft - card.offsetLeft);

                    if (diff < minDiff) {
                        minDiff = diff;
                        closest = index;
                    }
                });

                wrapper.scrollTo({
                    left: cards[closest].offsetLeft,
                    behavior: "smooth"
                });

                // ===== UPDATE DOTS =====
                dots.forEach(dot => dot.classList.remove('active'));
                if (dots[closest]) dots[closest].classList.add('active');

            }, 80);
        });
    }

    if (wrapper && window.innerWidth <= 768) {

        let autoPlayInterval;
        let idleTimer;

        function startAutoPlay() {
            stopAutoPlay(); // avoid duplicates

            autoPlayInterval = setInterval(() => {

                let nextIndex = (getCurrentIndex() + 1) % cards.length;

                wrapper.scrollTo({
                    left: cards[nextIndex].offsetLeft,
                    behavior: "smooth"
                });

                updateDots(nextIndex);

            }, 2500); // speed of auto swipe
        }

        function stopAutoPlay() {
            clearInterval(autoPlayInterval);
        }

        function resetIdleTimer() {
            clearTimeout(idleTimer);
            stopAutoPlay();

            idleTimer = setTimeout(() => {
                startAutoPlay();
            }, 2000); // 🔥 2 sec inactivity
        }

        function getCurrentIndex() {
            let closest = 0;
            let minDiff = Infinity;

            cards.forEach((card, index) => {
                const diff = Math.abs(wrapper.scrollLeft - card.offsetLeft);

                if (diff < minDiff) {
                    minDiff = diff;
                    closest = index;
                }
            });

            return closest;
        }

        function updateDots(index) {
            dots.forEach(dot => dot.classList.remove('active'));
            if (dots[index]) dots[index].classList.add('active');
        }

        // ===== USER INTERACTION DETECTION =====
        wrapper.addEventListener('touchstart', resetIdleTimer);
        wrapper.addEventListener('scroll', resetIdleTimer);

        // ===== INITIAL START =====
        resetIdleTimer();
    }

});

// ===== OPEN / CLOSE =====

function openLogo(index) {
    currentIndex = index;
    modalImg.src = logos[currentIndex];
    modal.classList.add("active");
    document.body.style.overflow = "hidden";
}

function closeLogo() {
    modal.classList.remove("active");
    document.body.style.overflow = "";
}

// ===== NAVIGATION =====

function showNext() {
    currentIndex = (currentIndex + 1) % logos.length;
    updateImage();
}

function showPrev() {
    currentIndex = (currentIndex - 1 + logos.length) % logos.length;
    updateImage();
}

function updateImage() {
    modalImg.style.opacity = 0;

    setTimeout(() => {
        modalImg.src = logos[currentIndex];
        modalImg.style.opacity = 1;
    }, 150);
}

// ===== COOKIE CONSENT SYSTEM =====

function setCookieConsent(value) {
  localStorage.setItem("cookieConsent", value);
  document.getElementById("cookieBanner").style.display = "none";
}

function acceptCookies() {
  setCookieConsent("accepted");
}

function rejectCookies() {
  setCookieConsent("rejected");
}

function checkCookieConsent() {
  const consent = localStorage.getItem("cookieConsent");

  if (!consent) {
    document.getElementById("cookieBanner").style.display = "block";
  }
}

window.addEventListener("load", checkCookieConsent);