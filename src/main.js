document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM Loaded. Starting initialization...");

    /* =========================================
       0. PRELOADER & SAFETY FALLBACK
       ========================================= */
    const preloader = document.querySelector('.preloader');
    
    function hidePreloader() {
        if (!preloader || preloader.style.display === 'none') return;
        
        console.log("Hiding preloader...");
        preloader.style.opacity = '0';
        document.body.classList.add('loaded'); // Разрешаем скролл
        
        setTimeout(() => {
            preloader.style.display = 'none';
            // Запускаем GSAP только когда прелоадер исчез
            initScrollAnimations();
        }, 500);
    }

    // 1. Нормальная загрузка (когда все картинки загрузились)
    window.addEventListener('load', () => {
        console.log("Window loaded completely.");
        hidePreloader();
    });

    // 2. АВАРИЙНЫЙ ТАЙМЕР (Если картинка или скрипт зависли)
    // Через 3 секунды принудительно открываем сайт
    setTimeout(() => {
        console.warn("Force hiding preloader due to timeout.");
        hidePreloader();
    }, 3000);

    /* =========================================
       1. Mobile Menu
       ========================================= */
    try {
        const burger = document.querySelector('.burger');
        const nav = document.querySelector('.header__nav');
        const navLinks = document.querySelectorAll('.nav__link');

        function toggleMenu() {
            if (!burger) return;
            burger.classList.toggle('active');
            nav.classList.toggle('active');
            document.body.classList.toggle('no-scroll');
        }

        if (burger) burger.addEventListener('click', toggleMenu);

        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (nav.classList.contains('active')) toggleMenu();
            });
        });
    } catch (e) {
        console.error("Menu Error:", e);
    }

    /* =========================================
       2. Smooth Scroll (Lenis)
       ========================================= */
    try {
        const lenis = new Lenis({
            duration: 1.2,
            easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
            smooth: true,
        });

        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    } catch (e) {
        console.warn("Lenis init failed (minor issue):", e);
        // Fallback to native scroll if Lenis fails
        document.documentElement.style.scrollBehavior = "smooth";
    }

    /* =========================================
       3. Three.js Hero Animation (Protected)
       ========================================= */
    try {
        const canvasContainer = document.getElementById('canvas-container');
        if (canvasContainer && typeof THREE !== 'undefined') {
            const scene = new THREE.Scene();
            scene.fog = new THREE.FogExp2(0x0b0c10, 0.002);

            const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
            camera.position.z = 5;

            const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.setPixelRatio(window.devicePixelRatio);
            canvasContainer.appendChild(renderer.domElement);

            // Objects
            const geometry = new THREE.IcosahedronGeometry(2, 2);
            const material = new THREE.MeshBasicMaterial({ color: 0x66fcf1, wireframe: true, transparent: true, opacity: 0.3 });
            const sphere = new THREE.Mesh(geometry, material);
            scene.add(sphere);

            const coreGeometry = new THREE.IcosahedronGeometry(1, 0);
            const coreMaterial = new THREE.MeshBasicMaterial({ color: 0xb026ff, wireframe: true, transparent: true, opacity: 0.5 });
            const core = new THREE.Mesh(coreGeometry, coreMaterial);
            scene.add(core);

            // Particles
            const particlesGeometry = new THREE.BufferGeometry();
            const particlesCount = 700;
            const posArray = new Float32Array(particlesCount * 3);
            for(let i = 0; i < particlesCount * 3; i++) posArray[i] = (Math.random() - 0.5) * 15;
            particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
            const particlesMaterial = new THREE.PointsMaterial({ size: 0.03, color: 0xffffff, transparent: true, opacity: 0.8 });
            const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
            scene.add(particlesMesh);

            // Mouse Interaction
            let mouseX = 0, mouseY = 0;
            document.addEventListener('mousemove', (e) => {
                mouseX = e.clientX / window.innerWidth - 0.5;
                mouseY = e.clientY / window.innerHeight - 0.5;
            });

            // Loop
            const clock = new THREE.Clock();
            function animate() {
                requestAnimationFrame(animate);
                const t = clock.getElapsedTime();
                sphere.rotation.y += 0.002 + mouseX * 0.05;
                sphere.rotation.x += 0.001 + mouseY * 0.05;
                core.rotation.y -= 0.005;
                particlesMesh.rotation.y = t * 0.05;
                
                camera.position.x += (mouseX * 0.5 - camera.position.x) * 0.05;
                camera.position.y += (-mouseY * 0.5 - camera.position.y) * 0.05;
                camera.lookAt(scene.position);
                
                renderer.render(scene, camera);
            }
            animate();

            window.addEventListener('resize', () => {
                camera.aspect = window.innerWidth / window.innerHeight;
                camera.updateProjectionMatrix();
                renderer.setSize(window.innerWidth, window.innerHeight);
            });
            console.log("Three.js initialized successfully.");
        } else {
            console.warn("Three.js not found or container missing.");
        }
    } catch (e) {
        console.error("Three.js Crashed:", e);
        // If 3D fails, just hide the container so text is visible
        const cc = document.getElementById('canvas-container');
        if(cc) cc.style.display = 'none';
    }

    /* =========================================
       4. GSAP Scroll Animations
       ========================================= */
    function initScrollAnimations() {
        if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
            console.error("GSAP or ScrollTrigger not loaded!");
            return;
        }

        try {
            // General Fade Up
            const sections = document.querySelectorAll('.section__title, .section__desc');
            sections.forEach(sec => {
                gsap.fromTo(sec, 
                    { y: 50, opacity: 0 },
                    {
                        scrollTrigger: {
                            trigger: sec,
                            start: "top 85%",
                            toggleActions: "play none none reverse"
                        },
                        y: 0,
                        opacity: 1,
                        duration: 1,
                        ease: "power3.out"
                    }
                );
            });

            // Feature Cards (Stagger)
            const cards = document.querySelectorAll(".feature-card");
            if (cards.length > 0) {
                gsap.fromTo(cards, 
                    { y: 50, opacity: 0 },
                    {
                        scrollTrigger: { trigger: "#advantages", start: "top 75%" },
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        stagger: 0.2
                    }
                );
            }

            // Blog Cards
            const blogCards = document.querySelectorAll(".blog-card");
            if (blogCards.length > 0) {
                gsap.fromTo(blogCards,
                    { y: 50, opacity: 0 },
                    {
                        scrollTrigger: { trigger: "#blog", start: "top 75%" },
                        y: 0,
                        opacity: 1,
                        duration: 0.8,
                        stagger: 0.2
                    }
                );
            }
            
            console.log("GSAP animations initialized.");
        } catch (e) {
            console.error("GSAP Animation Error:", e);
        }
    }

    /* =========================================
       5. Contact Form
       ========================================= */
    const form = document.getElementById('leadForm');
    if (form) {
        const num1 = Math.floor(Math.random() * 5) + 1;
        const num2 = Math.floor(Math.random() * 5) + 1;
        const sum = num1 + num2;
        const captchaLabel = document.getElementById('captchaLabel');
        const captchaInput = document.getElementById('captchaInput');
        
        if(captchaLabel) captchaLabel.textContent = `Сколько будет ${num1} + ${num2}?`;

        const phoneInput = document.getElementById('phone');
        if(phoneInput) {
            phoneInput.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9+]/g, '');
            });
        }

        form.addEventListener('submit', function(e) {
            e.preventDefault();
            const statusDiv = document.getElementById('formStatus');
            const privacyCheckbox = document.getElementById('privacy');
            const checkboxLabel = document.querySelector('label[for="privacy"]');
            
            // Clean styles
            statusDiv.textContent = "";
            if(captchaInput) captchaInput.classList.remove('input-error');
            if(checkboxLabel) checkboxLabel.classList.remove('checkbox-error');

            let isValid = true;

            // Check Checkbox
            if (!privacyCheckbox.checked) {
                statusDiv.textContent = "Ошибка: Подтвердите согласие!";
                statusDiv.style.color = "#ff4d4d";
                if(checkboxLabel) checkboxLabel.classList.add('checkbox-error');
                isValid = false;
            }

            // Check Captcha
            if (captchaInput && parseInt(captchaInput.value) !== sum) {
                statusDiv.textContent = "Ошибка: Неверный ответ!";
                statusDiv.style.color = "#ff4d4d";
                captchaInput.classList.add('input-error');
                isValid = false;
            }

            if (!isValid) return;

            const submitBtn = form.querySelector('button');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = "Отправка...";
            submitBtn.disabled = true;

            setTimeout(() => {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
                form.reset();
                if(captchaInput) captchaInput.value = '';
                privacyCheckbox.checked = false;
                statusDiv.textContent = "Заявка успешно отправлена!";
                statusDiv.style.color = "#66fcf1";
            }, 1500);
        });
    }

    /* =========================================
       6. Cookie Popup
       ========================================= */
    const cookiePopup = document.getElementById('cookiePopup');
    const acceptBtn = document.getElementById('acceptCookies');

    if (cookiePopup && !localStorage.getItem('cookiesAccepted')) {
        setTimeout(() => {
            cookiePopup.style.display = 'block';
            if(typeof gsap !== 'undefined') {
                gsap.fromTo(cookiePopup, { y: 50, opacity: 0 }, { y: 0, opacity: 1 });
            }
        }, 3000);
    }

    if (acceptBtn) {
        acceptBtn.addEventListener('click', () => {
            localStorage.setItem('cookiesAccepted', 'true');
            if(typeof gsap !== 'undefined') {
                gsap.to(cookiePopup, { y: 50, opacity: 0, onComplete: () => cookiePopup.style.display = 'none' });
            } else {
                cookiePopup.style.display = 'none';
            }
        });
    }

    if (typeof lucide !== 'undefined') lucide.createIcons();
});