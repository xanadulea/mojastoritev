const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Set up multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const unique = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, unique + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// Create uploads folder if it doesn't exist
const fs = require('fs');
if (!fs.existsSync('uploads')) fs.mkdirSync('uploads');

// Database setup
const db = new sqlite3.Database('inquiries.db');

db.run(`
    CREATE TABLE IF NOT EXISTS inquiries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL DEFAULT 'b2c',
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        email TEXT,
        company TEXT,
        vat_id TEXT,
        quantity TEXT,
        frequency TEXT,
        description TEXT NOT NULL,
        image_path TEXT,
        status TEXT DEFAULT 'new',
        reply TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// Email config
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',    // CHANGE THIS
        pass: 'your-app-password'        // CHANGE THIS
    }
});

function sendNotification(inquiry) {
    const typeLabel = inquiry.type === 'b2b' ? '🏢 BUSINESS' : '🏠 INDIVIDUAL';
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: 'your-email@gmail.com',
        subject: `🔔 New ${typeLabel} Inquiry from ${inquiry.name}`,
        html: `
            <h2>🔔 New Inquiry</h2>
            <p><strong>Type:</strong> ${typeLabel}</p>
            <p><strong>Name:</strong> ${inquiry.name}</p>
            <p><strong>Phone:</strong> ${inquiry.phone}</p>
            <p><strong>Email:</strong> ${inquiry.email || 'Not provided'}</p>
            ${inquiry.company ? `<p><strong>Company:</strong> ${inquiry.company}</p>` : ''}
            ${inquiry.vat_id ? `<p><strong>VAT ID:</strong> ${inquiry.vat_id}</p>` : ''}
            ${inquiry.quantity ? `<p><strong>Quantity:</strong> ${inquiry.quantity}</p>` : ''}
            ${inquiry.frequency ? `<p><strong>Frequency:</strong> ${inquiry.frequency}</p>` : ''}
            <p><strong>Description:</strong></p>
            <p>${inquiry.description}</p>
            ${inquiry.image_path ? `<p><strong>Image:</strong> <a href="${process.env.BASE_URL || 'http://localhost:3000'}/uploads/${inquiry.image_path}">View Image</a></p>` : ''}
            <p><a href="${process.env.BASE_URL || 'http://localhost:3000'}/admin.html">📋 View in Dashboard</a></p>
            <hr>
            <p style="color:#888;font-size:12px;">This is an automated notification from mojaStoritev.</p>
        `
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.log('Email error:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
}

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/form', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'form.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Submit inquiry
app.post('/api/inquiries', upload.single('image'), (req, res) => {
    const { 
        type, name, phone, email, 
        company, vat_id, quantity, frequency, 
        description 
    } = req.body;
    const image_path = req.file ? req.file.filename : null;

    if (!name || !phone || !description) {
        return res.status(400).json({ error: 'Name, phone, and description are required' });
    }

    const query = `
        INSERT INTO inquiries 
        (type, name, phone, email, company, vat_id, quantity, frequency, description, image_path) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    db.run(query, [
        type || 'b2c',
        name, phone, email, 
        company, vat_id, quantity, frequency, 
        description, image_path
    ], function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }

        const newInquiry = { 
            id: this.lastID, 
            type: type || 'b2c',
            name, phone, email, 
            company, vat_id, quantity, frequency, 
            description, image_path 
        };
        
        sendNotification(newInquiry);
        res.json({ success: true, id: this.lastID });
    });
});

// Get all inquiries
app.get('/api/inquiries', (req, res) => {
    const password = req.query.password;
    if (password !== 'admin123') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const typeFilter = req.query.type;
    let query = 'SELECT * FROM inquiries';
    const params = [];
    
    if (typeFilter) {
        query += ' WHERE type = ?';
        params.push(typeFilter);
    }
    query += ' ORDER BY created_at DESC';
    
    db.all(query, params, (err, rows) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json(rows);
    });
});

// Update inquiry
app.put('/api/inquiries/:id', (req, res) => {
    const password = req.query.password;
    if (password !== 'admin123') {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { status, reply } = req.body;
    const { id } = req.params;

    let query = 'UPDATE inquiries SET status = ?';
    const params = [status];
    
    if (reply !== undefined) {
        query += ', reply = ?';
        params.push(reply);
    }
    query += ' WHERE id = ?';
    params.push(id);

    db.run(query, params, function(err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        res.json({ success: true });
    });
});

// Serve uploaded images
app.use('/uploads', express.static('uploads'));

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📋 Admin dashboard: http://localhost:${PORT}/admin`);
    console.log(`🏠 B2C: http://localhost:${PORT}`);
    console.log(`🏢 B2B: http://localhost:${PORT}/form?type=b2b`);
});
