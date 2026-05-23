const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Admin password (changeable)
const ADMIN_PASSWORD = 'admin'; 

// Database Paths
const DATA_DIR = path.join(__dirname, 'data');
const PROJECTS_FILE = path.join(DATA_DIR, 'projects.json');
const MESSAGES_FILE = path.join(DATA_DIR, 'messages.json');
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads');

// Ensure database and upload directories exist
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(path.join(__dirname, 'public'), { recursive: true });
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Seed Initial Projects if database is empty
const seedProjects = [
    {
        id: '1',
        name: 'Zenith - Mindfulness & Mental Well-being App',
        description: 'A calming and immersive mobile application designed to help modern professionals manage stress, establish mindful habits, and prevent burnouts through tailored cognitive exercises.',
        tools: 'Figma, Adobe Illustrator, Protopie, CSS Grid',
        role: 'Lead UI/UX Designer & Researcher',
        problem: 'Modern fast-paced routines cause high cognitive overload. Existing mindfulness apps are often visually overwhelming, complex, or feel like chores rather than relaxing experiences.',
        process: '1. Empathize: Conducted user interviews with 15 corporate professionals.\n2. Define: Created user personas identifying key stress triggers and screen fatigue.\n3. Ideate: Sketched layouts centered around soft, calming dark mode and glassmorphism elements.\n4. Design: Crafted a modern soft-UI aesthetic utilizing deep indigo hues and soothing rounded components.\n5. Test: Iterated interactive transitions based on user feedback to minimize cognitive friction.',
        thumbnail: '/uploads/zenith.jpg',
        github: 'https://github.com',
        live: 'https://dribbble.com'
    },
    {
        id: '2',
        name: 'Nova - Smart Home Dashboard & OS',
        description: 'An elegant, fluid dashboard interface that integrates home automation controls with intelligent predictive analytics for lighting, climate, security, and media systems.',
        tools: 'Figma, Spline 3D, After Effects, SVG Animations',
        role: 'UI Designer & Motion Lead',
        problem: 'Multi-device home dashboards are typically cluttered, lack consistent micro-interactions, and are difficult for non-technical family members to configure and control.',
        process: '1. Research: Analyzed existing IoT dashboards and gathered spatial ergonomics data.\n2. Wireframing: Created low-fidelity user flows showing quick-access widget actions.\n3. 3D Asset Design: Integrated interactive 3D home representations using Spline.\n4. Prototyping: Built micro-animations for button active states, climate sliders, and toggle switches.\n5. Usability Testing: Verified high success rates for standard dashboard tasks across age groups.',
        thumbnail: '/uploads/nova.svg',
        github: 'https://github.com',
        live: 'https://dribbble.com'
    }
];

if (!fs.existsSync(PROJECTS_FILE)) {
    fs.writeFileSync(PROJECTS_FILE, JSON.stringify(seedProjects, null, 4));
}
if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 4));
}

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Configure Multer Storage for File Uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|webp|gif/;
        const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = filetypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('Only images are allowed (JPEG, JPG, PNG, WEBP, GIF)'));
    }
});

// Helper Functions to read/write JSON files
const readData = (filePath) => {
    try {
        const data = fs.readFileSync(filePath, 'utf8');
        return JSON.parse(data);
    } catch (err) {
        return [];
    }
};

const writeData = (filePath, data) => {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 4));
};

// API ROUTES

// Admin Authentication Route
app.post('/api/login', (req, res) => {
    const { password } = req.body;
    if (password === ADMIN_PASSWORD) {
        return res.json({ success: true, token: 'portfolio_admin_token_2026' });
    }
    return res.status(401).json({ success: false, message: 'Invalid admin password' });
});

// Admin Authorization Middleware (Simple Token-based)
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader === 'Bearer portfolio_admin_token_2026') {
        next();
    } else {
        res.status(401).json({ error: 'Unauthorized access' });
    }
};

// Get All Projects
app.get('/api/projects', (req, res) => {
    const projects = readData(PROJECTS_FILE);
    res.json(projects);
});

// Add New Project (Auth Required)
app.post('/api/projects', requireAuth, upload.single('thumbnail'), (req, res) => {
    try {
        const projects = readData(PROJECTS_FILE);
        
        const { name, description, tools, role, problem, process, github, live } = req.body;
        
        if (!name || !description) {
            return res.status(400).json({ error: 'Project name and description are required.' });
        }

        let thumbnailPath = '/uploads/default-project.jpg';
        if (req.file) {
            thumbnailPath = `/uploads/${req.file.filename}`;
        }

        const newProject = {
            id: Date.now().toString(),
            name,
            description,
            tools: tools || 'Figma, Adobe XD',
            role: role || 'UI/UX Designer',
            problem: problem || 'N/A',
            process: process || 'N/A',
            thumbnail: thumbnailPath,
            github: github || '#',
            live: live || '#'
        };

        projects.unshift(newProject); // Add to the beginning of list
        writeData(PROJECTS_FILE, projects);

        res.status(201).json({ success: true, project: newProject });
    } catch (error) {
        console.error('Error adding project:', error);
        res.status(500).json({ error: 'Server error while saving project.' });
    }
});

// Delete Project (Auth Required)
app.delete('/api/projects/:id', requireAuth, (req, res) => {
    const { id } = req.params;
    let projects = readData(PROJECTS_FILE);
    const projectIndex = projects.findIndex(p => p.id === id);

    if (projectIndex === -1) {
        return res.status(404).json({ error: 'Project not found' });
    }

    const projectToDelete = projects[projectIndex];
    
    // Delete file if not default/seeded
    if (projectToDelete.thumbnail && 
        projectToDelete.thumbnail.startsWith('/uploads/') && 
        !['/uploads/zenith.jpg', '/uploads/nova.jpg', '/uploads/default-project.jpg'].includes(projectToDelete.thumbnail)) {
        
        const filePath = path.join(__dirname, 'public', projectToDelete.thumbnail);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
    }

    projects.splice(projectIndex, 1);
    writeData(PROJECTS_FILE, projects);

    res.json({ success: true, message: 'Project deleted successfully' });
});

// Submit Contact Message (Public)
app.post('/api/contact', (req, res) => {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
        return res.status(400).json({ error: 'All fields are required.' });
    }

    const messages = readData(MESSAGES_FILE);
    const newMessage = {
        id: Date.now().toString(),
        name,
        email,
        message,
        date: new Date().toLocaleString()
    };

    messages.unshift(newMessage);
    writeData(MESSAGES_FILE, messages);

    res.status(201).json({ success: true, message: 'Message sent successfully!' });
});

// Get Contact Messages (Auth Required)
app.get('/api/messages', requireAuth, (req, res) => {
    const messages = readData(MESSAGES_FILE);
    res.json(messages);
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});
