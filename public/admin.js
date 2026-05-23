document.addEventListener('DOMContentLoaded', () => {
    // Auth section
    const loginSection = document.getElementById('login-section');
    const loginForm = document.getElementById('login-form');
    const adminPassInput = document.getElementById('admin-pass');
    
    // Dashboard section
    const dashboardSection = document.getElementById('dashboard-section');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Tab contents and buttons
    const navButtons = document.querySelectorAll('.admin-nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Form upload preview
    const fileInput = document.getElementById('proj-thumbnail');
    const uploadLabel = document.getElementById('upload-label-preview');
    
    // Forms & lists containers
    const projectForm = document.getElementById('project-form');
    const adminProjectsContainer = document.getElementById('admin-projects-container');
    const messagesContainer = document.getElementById('messages-container');
    
    // Toast alert
    const toast = document.getElementById('toast-notification');

    let adminToken = localStorage.getItem('portfolio-admin-token') || null;

    // ----------------------------------------------------
    // 1. Authentication Check & Initialize
    // ----------------------------------------------------
    function init() {
        if (adminToken) {
            loginSection.style.display = 'none';
            dashboardSection.style.display = 'block';
            loadDashboardData();
        } else {
            loginSection.style.display = 'block';
            dashboardSection.style.display = 'none';
        }
    }

    // Login Form Submit handler
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = adminPassInput.value;

        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const result = await response.json();

            if (response.ok && result.success) {
                adminToken = result.token;
                localStorage.setItem('portfolio-admin-token', adminToken);
                showToast('Authentication successful', 'success');
                loginForm.reset();
                init();
            } else {
                throw new Error(result.message || 'Authentication failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showToast(error.message || 'Error authenticating.', 'error');
            adminPassInput.focus();
        }
    });

    // Logout Click handler
    logoutBtn.addEventListener('click', () => {
        adminToken = null;
        localStorage.removeItem('portfolio-admin-token');
        showToast('Logged out successfully', 'success');
        init();
    });

    // ----------------------------------------------------
    // 2. Tab Navigation Logic
    // ----------------------------------------------------
    navButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            navButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            tabContents.forEach(tc => {
                if (tc.id === targetTab) {
                    tc.style.display = 'block';
                } else {
                    tc.style.display = 'none';
                }
            });
        });
    });

    // ----------------------------------------------------
    // 3. File Input Selector Preview
    // ----------------------------------------------------
    if (fileInput) {
        fileInput.addEventListener('change', (e) => {
            if (fileInput.files && fileInput.files[0]) {
                const fileName = fileInput.files[0].name;
                const fileSizeMB = (fileInput.files[0].size / (1024 * 1024)).toFixed(2);
                
                uploadLabel.innerHTML = `
                    <i class="fa-solid fa-file-image" style="font-size: 32px; color: var(--accent-secondary)"></i>
                    <span style="font-weight: 600; color: var(--text-primary);">${fileName}</span>
                    <p style="font-size: 11.5px; color: var(--accent-primary);">File ready (${fileSizeMB} MB)</p>
                `;
                showToast('Thumbnail selected', 'success');
            } else {
                resetUploadLabel();
            }
        });
    }

    function resetUploadLabel() {
        uploadLabel.innerHTML = `
            <i class="fa-solid fa-cloud-arrow-up"></i>
            <span>Drag &amp; Drop or Browse Image</span>
            <p style="font-size: 11px; color: var(--text-muted);">Max size: 5MB (JPG, PNG, WEBP, GIF)</p>
        `;
    }

    // ----------------------------------------------------
    // 4. API Operations: Add Project
    // ----------------------------------------------------
    if (projectForm) {
        projectForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const submitBtn = projectForm.querySelector('button[type="submit"]');
            const originalHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Uploading Case study...`;

            // Prepare Form Data payload for multipart file upload
            const formData = new FormData(projectForm);

            try {
                const response = await fetch('/api/projects', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${adminToken}`
                        // Note: Content-Type header is omitted so the browser automatically handles multipart boundary settings!
                    },
                    body: formData
                });

                const result = await response.json();

                if (response.ok) {
                    showToast('Case study uploaded successfully!', 'success');
                    projectForm.reset();
                    resetUploadLabel();
                    
                    // Reload data registries
                    await loadProjects();
                    
                    // Route user to Manage Registry tab to view changes
                    document.querySelector('[data-tab="manage-projects-tab"]').click();
                } else {
                    throw new Error(result.error || 'Failed to upload case study.');
                }
            } catch (error) {
                console.error('Project upload error:', error);
                showToast(error.message || 'Server error uploading project.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
            }
        });
    }

    // ----------------------------------------------------
    // 5. API Operations: Fetch & Render Projects for Deletion
    // ----------------------------------------------------
    async function loadProjects() {
        try {
            const response = await fetch('/api/projects');
            if (!response.ok) throw new Error('Could not pull projects');
            
            const projects = await response.json();
            renderAdminProjects(projects);
        } catch (error) {
            console.error('Admin project loading error:', error);
            adminProjectsContainer.innerHTML = `<p style="color: var(--text-secondary)">Error loading projects.</p>`;
        }
    }

    function renderAdminProjects(projects) {
        if (projects.length === 0) {
            adminProjectsContainer.innerHTML = `<p style="color: var(--text-secondary); text-align: center; padding: 20px;">No active design items found.</p>`;
            return;
        }

        adminProjectsContainer.innerHTML = '';
        projects.forEach(project => {
            const item = document.createElement('div');
            item.className = 'admin-project-item';
            item.innerHTML = `
                <div class="admin-proj-details">
                    <img src="${project.thumbnail}" alt="${project.name}" class="admin-proj-img">
                    <div class="admin-proj-name">
                        <h4>${project.name}</h4>
                        <p>${project.role} | Tools: ${project.tools}</p>
                    </div>
                </div>
                <button class="btn-delete" data-id="${project.id}">
                    <i class="fa-solid fa-trash-can"></i> Delete
                </button>
            `;

            // Delete click listener
            item.querySelector('.btn-delete').addEventListener('click', async (e) => {
                const id = e.currentTarget.dataset.id;
                if (confirm(`Are you sure you want to delete "${project.name}"? This action cannot be undone.`)) {
                    await deleteProject(id);
                }
            });

            adminProjectsContainer.appendChild(item);
        });
    }

    async function deleteProject(id) {
        try {
            const response = await fetch(`/api/projects/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            const result = await response.json();

            if (response.ok) {
                showToast('Case study deleted successfully', 'success');
                loadProjects();
            } else {
                throw new Error(result.error || 'Failed to delete case study.');
            }
        } catch (error) {
            console.error('Delete error:', error);
            showToast(error.message || 'Error deleting project.', 'error');
        }
    }

    // ----------------------------------------------------
    // 6. API Operations: Fetch & Render Client Contact Messages
    // ----------------------------------------------------
    async function loadMessages() {
        try {
            const response = await fetch('/api/messages', {
                headers: {
                    'Authorization': `Bearer ${adminToken}`
                }
            });

            if (!response.ok) throw new Error('Unauthorized or failed connection');
            
            const messages = await response.json();
            renderMessages(messages);
        } catch (error) {
            console.error('Messages loading error:', error);
            messagesContainer.innerHTML = `<p style="color: var(--text-secondary)">Error loading messages. Check authentication.</p>`;
        }
    }

    function renderMessages(messages) {
        if (messages.length === 0) {
            messagesContainer.innerHTML = `
                <div style="text-align: center; color: var(--text-muted); padding: 40px;">
                    <i class="fa-solid fa-circle-info" style="font-size: 32px; margin-bottom: 12px;"></i>
                    <p>No client messages logged yet.</p>
                </div>
            `;
            return;
        }

        messagesContainer.innerHTML = '';
        messages.forEach(msg => {
            const card = document.createElement('div');
            card.className = 'message-item';
            card.innerHTML = `
                <div class="message-header">
                    <div class="message-sender">
                        <h4>${msg.name}</h4>
                        <p><a href="mailto:${msg.email}" style="color: var(--accent-secondary); text-decoration: none;">${msg.email}</a></p>
                    </div>
                    <span class="message-date">${msg.date}</span>
                </div>
                <div class="message-body">
                    ${msg.message.replace(/\n/g, '<br>')}
                </div>
            `;
            messagesContainer.appendChild(card);
        });
    }

    // ----------------------------------------------------
    // Helper & Init Calls
    // ----------------------------------------------------
    function loadDashboardData() {
        loadProjects();
        loadMessages();
    }

    function showToast(message, type = 'success') {
        toast.textContent = message;
        toast.className = `toast ${type} show`;
        
        setTimeout(() => {
            toast.className = 'toast';
        }, 4000);
    }

    // Run Auth Verification
    init();
});
