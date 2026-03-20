const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

const UPLOAD_DIR = '/tmp/uploads';
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._\u4e00-\u9fff-]/g, '_');
    cb(null, Date.now() + '_' + safe);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files allowed'));
    }
  },
  limits: { fileSize: 20 * 1024 * 1024 }
});

// Upload
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ success: true, filename: req.file.filename });
});

// List images
app.get('/api/images', (req, res) => {
  if (!fs.existsSync(UPLOAD_DIR)) return res.json([]);
  const files = fs.readdirSync(UPLOAD_DIR)
    .filter(f => /\.(png|jpe?g|gif|webp|bmp)$/i.test(f))
    .map(f => {
      const stat = fs.statSync(path.join(UPLOAD_DIR, f));
      const displayName = f.replace(/^\d+_/, '');
      return { name: f, displayName, url: '/api/file/' + f, size: stat.size, time: stat.mtimeMs };
    })
    .sort((a, b) => b.time - a.time);
  res.json(files);
});

// Serve uploaded files
app.get('/api/file/:name', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.name);
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  // Prevent path traversal
  if (!path.resolve(filePath).startsWith(UPLOAD_DIR)) return res.status(403).send('Forbidden');
  res.sendFile(filePath);
});

// Delete image
app.delete('/api/file/:name', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.name);
  if (!path.resolve(filePath).startsWith(path.resolve(UPLOAD_DIR))) return res.status(403).json({ error: 'Forbidden' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

module.exports = app;
