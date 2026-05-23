document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const header = document.getElementById('header');
    const navLinks = document.getElementById('nav-links');
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Project Grid
    const projectsGrid = document.getElementById('projects-grid');
    
    // Case Study Modal
    const modal = document.getElementById('case-study-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const modalClose = document.getElementById('modal-close');
    const modalImg = document.getElementById('modal-img');
    const modalTitle = document.getElementById('modal-title');
    const modalRole = document.getElementById('modal-role');
    const modalTools = document.getElementById('modal-tools');
    const modalDesc = document.getElementById('modal-desc');
    const modalProblem = document.getElementById('modal-problem');
    const modalProcess = document.getElementById('modal-process');
    const modalLive = document.getElementById('modal-live');
    const modalGithub = document.getElementById('modal-github');
    
    // Contact Form
    const contactForm = document.getElementById('contact-form');
    
    // Toast Notification
    const toast = document.getElementById('toast-notification');

    // ----------------------------------------------------
    // 1. Theme Configuration (Dark / Light Mode)
    // ----------------------------------------------------
    const savedTheme = localStorage.getItem('portfolio-theme') || 'dark';
    body.setAttribute('data-theme', savedTheme);

    themeToggle.addEventListener('click', () => {
        const currentTheme = body.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        body.setAttribute('data-theme', newTheme);
        localStorage.setItem('portfolio-theme', newTheme);
        showToast(`Switched to ${newTheme} theme`, 'success');
    });

    // ----------------------------------------------------
    // 2. Scroll Logic (Sticky Header & Active Link Tracking)
    // ----------------------------------------------------
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Track active section for nav link highlight
        const sections = document.querySelectorAll('section');
        const scrollPosition = window.scrollY + 120; // offset

        sections.forEach(section => {
            if (scrollPosition >= section.offsetTop && scrollPosition < (section.offsetTop + section.offsetHeight)) {
                const id = section.getAttribute('id');
                document.querySelectorAll('.nav-links a').forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${id}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    });

    // ----------------------------------------------------
    // 3. Mobile Navigation Menu Toggle
    // ----------------------------------------------------
    mobileMenuToggle.addEventListener('click', () => {
        mobileMenuToggle.classList.toggle('active');
        navLinks.classList.toggle('active');
    });

    // Close menu when links are clicked
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            mobileMenuToggle.classList.remove('active');
            navLinks.classList.remove('active');
        });
    });

    // ----------------------------------------------------
    // 4. Fetch and Render Dynamic Projects
    // ----------------------------------------------------
    let cachedProjects = [];

    async function fetchProjects() {
        try {
            const response = await fetch('/api/projects');
            if (!response.ok) throw new Error('Failed to load projects');
            
            const projects = await response.json();
            cachedProjects = projects;
            renderProjects(projects);
        } catch (error) {
            console.error('Error fetching projects:', error);
            projectsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 32px; color: var(--accent-tertiary); margin-bottom: 12px;"></i>
                    <p>Failed to retrieve case studies. Please refresh or try again later.</p>
                </div>
            `;
        }
    }

    function renderProjects(projects) {
        if (projects.length === 0) {
            projectsGrid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; color: var(--text-secondary); padding: 40px;">
                    <p>No projects uploaded yet. Check back soon!</p>
                </div>
            `;
            return;
        }

        projectsGrid.innerHTML = '';
        projects.forEach(project => {
            const toolList = project.tools.split(',').map(t => t.trim());
            const tagsHTML = toolList.slice(0, 3).map(tag => `<span class="project-tag">${tag}</span>`).join('');
            
            const projectCard = document.createElement('div');
            projectCard.className = 'glass-card project-card fade-in';
            projectCard.dataset.id = project.id;
            
            projectCard.innerHTML = `
                <div class="project-thumb-container">
                    <img src="${project.thumbnail}" alt="${project.name}" class="project-thumb" loading="lazy">
                    <div class="project-overlay"></div>
                    <div class="project-tags">
                        ${tagsHTML}
                    </div>
                </div>
                <div class="project-info">
                    <h3>${project.name}</h3>
                    <p>${truncateString(project.description, 130)}</p>
                    <div class="project-footer">
                        <span class="project-role">${project.role}</span>
                        <span class="project-link-btn">View Case Study <i class="fa-solid fa-arrow-right-long"></i></span>
                    </div>
                </div>
            `;

            // Open case study modal on click
            projectCard.addEventListener('click', () => {
                openCaseStudy(project.id);
            });

            projectsGrid.appendChild(projectCard);
        });

        // Initialize fade-in trigger on dynamic cards
        initializeAnimations();
    }

    // Truncate desc helper
    function truncateString(str, num) {
        if (str.length <= num) return str;
        return str.slice(0, num) + '...';
    }

    // ----------------------------------------------------
    // 5. Case Study Modal Engine
    // ----------------------------------------------------
    function openCaseStudy(projectId) {
        const project = cachedProjects.find(p => p.id === projectId);
        if (!project) return;

        modalImg.src = project.thumbnail;
        modalImg.alt = project.name;
        modalTitle.textContent = project.name;
        modalRole.textContent = project.role;
        modalTools.textContent = project.tools;
        modalDesc.textContent = project.description;
        modalProblem.textContent = project.problem;

        // Parse and render design process steps
        modalProcess.innerHTML = '';
        if (project.process && project.process.trim() !== 'N/A') {
            const steps = project.process.split('\n');
            steps.forEach(step => {
                if (step.trim() === '') return;
                
                // Expects: "1. Step Name: Description" or "Step Name: Description"
                let stepNum = '✦';
                let stepTitle = 'Phase';
                let stepContent = step;

                const numMatch = step.match(/^(\d+)\.\s*(.*)/);
                if (numMatch) {
                    stepNum = numMatch[1];
                    const content = numMatch[2];
                    const titleSplit = content.split(':');
                    if (titleSplit.length > 1) {
                        stepTitle = titleSplit[0].trim();
                        stepContent = titleSplit.slice(1).join(':').trim();
                    } else {
                        stepTitle = `Phase ${stepNum}`;
                        stepContent = content;
                    }
                } else {
                    const titleSplit = step.split(':');
                    if (titleSplit.length > 1) {
                        stepTitle = titleSplit[0].trim();
                        stepContent = titleSplit.slice(1).join(':').trim();
                    }
                }

                const stepElement = document.createElement('div');
                stepElement.className = 'process-step';
                stepElement.innerHTML = `
                    <div class="step-num">${stepNum}</div>
                    <div class="step-text">
                        <h4>${stepTitle}</h4>
                        <p>${stepContent}</p>
                    </div>
                `;
                modalProcess.appendChild(stepElement);
            });
        } else {
            modalProcess.innerHTML = `<p style="color: var(--text-muted)">Details on design iterations can be discussed directly.</p>`;
        }

        // Live and Github links
        if (project.live && project.live !== '#') {
            modalLive.href = project.live;
            modalLive.style.display = 'inline-flex';
        } else {
            modalLive.style.display = 'none';
        }

        if (project.github && project.github !== '#') {
            modalGithub.href = project.github;
            modalGithub.style.display = 'inline-flex';
        } else {
            modalGithub.style.display = 'none';
        }

        // Display Modal
        modal.style.display = 'flex';
        body.style.overflow = 'hidden'; // stop scroll background
    }

    function closeModal() {
        modal.style.display = 'none';
        body.style.overflow = 'auto';
    }

    modalClose.addEventListener('click', closeModal);
    modalBackdrop.addEventListener('click', closeModal);

    // Escape Key Modal close
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // ----------------------------------------------------
    // 6. Contact Form Submission Handling
    // ----------------------------------------------------
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const nameInput = document.getElementById('name');
            const emailInput = document.getElementById('email');
            const messageInput = document.getElementById('message');

            const name = nameInput.value.trim();
            const email = emailInput.value.trim();
            const message = messageInput.value.trim();

            // Client Validation
            if (!name || !email || !message) {
                showToast('Please fill out all fields.', 'error');
                return;
            }

            if (!validateEmail(email)) {
                showToast('Please provide a valid email address.', 'error');
                return;
            }

            const submitBtn = contactForm.querySelector('button[type="submit"]');
            const originalBtnHTML = submitBtn.innerHTML;
            
            // Set loading state
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Sending...`;

            try {
                const response = await fetch('/api/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, message })
                });

                const result = await response.json();

                if (response.ok) {
                    showToast('Message sent! Ayushi will connect with you soon.', 'success');
                    contactForm.reset();
                } else {
                    throw new Error(result.error || 'Something went wrong.');
                }
            } catch (error) {
                console.error('Contact Form Error:', error);
                showToast(error.message || 'Server error. Please try emailing directly.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnHTML;
            }
        });
    }

    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // ----------------------------------------------------
    // 7. Toast Alerts Engine
    // ----------------------------------------------------
    function showToast(message, type = 'success') {
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.className = 'toast';
        }, 4000);
    }

    // ----------------------------------------------------
    // 8. Visual Entrance Animations (Intersection Observer)
    // ----------------------------------------------------
    function initializeAnimations() {
        const fadeElements = document.querySelectorAll('.fade-in');
        
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('appear');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        fadeElements.forEach(el => observer.observe(el));
    }

    // Initialize Page Content Loading
    fetchProjects();
});
