require('dotenv').config();
const express = require('express');
const fileUpload = require('express-fileupload');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { LibreOffice } = require('libreoffice-convert');
const libreoffice = require('libreoffice-convert');
libreoffice.convert = require('util').promisify(libreoffice.convert);

const app = express();

// Middleware
app.use(cors());
app.use(fileUpload());
app.use(express.static('public'));

// Uploads directory
const UPLOAD_DIR = 'uploads';
const OUTPUT_DIR = 'converted';

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

// Convert endpoint
app.post('/convert', async (req, res) => {
    try {
        if (!req.files || !req.files.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.files.file;
        
        // Validate file type
        if (!file.mimetype.includes('pdf') && !file.name.toLowerCase().endsWith('.pdf')) {
            return res.status(400).json({ error: 'Only PDF files are allowed' });
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            return res.status(400).json({ error: 'File size must be less than 10MB' });
        }

        // Generate unique filename
        const fileId = Date.now();
        const pdfPath = path.join(UPLOAD_DIR, `${fileId}.pdf`);
        const docxPath = path.join(OUTPUT_DIR, `${fileId}.docx`);

        // Save the uploaded file
        await file.mv(pdfPath);

        // Convert PDF to Word
        const pdfBuf = fs.readFileSync(pdfPath);
        let docxBuf;
        
        try {
            docxBuf = await libreoffice.convert(pdfBuf, '.docx', undefined);
        } catch (convertError) {
            console.error('Conversion error:', convertError);
            return res.status(500).json({ error: 'Conversion failed. Please try another file.' });
        }

        // Save the converted file
        fs.writeFileSync(docxPath, docxBuf);

        // Create download URL
        const downloadUrl = `/download/${fileId}`;
        
        // Schedule file cleanup (after 1 hour)
        setTimeout(() => {
            cleanupFiles(pdfPath, docxPath);
        }, 3600000);

        res.json({
            success: true,
            downloadUrl,
            fileName: file.name.replace('.pdf', '.docx')
        });

    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'An unexpected error occurred' });
    }
});

// Download endpoint
app.get('/download/:fileId', (req, res) => {
    const fileId = req.params.fileId;
    const docxPath = path.join(OUTPUT_DIR, `${fileId}.docx`);
    
    if (fs.existsSync(docxPath)) {
        res.download(docxPath, `converted_${fileId}.docx`, (err) => {
            if (err) {
                console.error('Download error:', err);
                res.status(500).send('Download failed');
            }
        });
    } else {
        res.status(404).send('File not found');
    }
});

// Cleanup function
function cleanupFiles(...files) {
    files.forEach(file => {
        if (fs.existsSync(file)) {
            try {
                fs.unlinkSync(file);
            } catch (err) {
                console.error('Error deleting file:', err);
            }
        }
    });
}

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
