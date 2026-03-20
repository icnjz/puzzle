const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3333;
const ROOT = __dirname;
const UPLOAD_DIR = path.join(ROOT, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
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

app.use(express.static(path.join(ROOT, 'public')));

// Upload
app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  res.json({ success: true, filename: req.file.filename });
});

// List images
app.get('/api/images', (req, res) => {
  const files = fs.readdirSync(UPLOAD_DIR)
    .filter(f => /\.(png|jpe?g|gif|webp|bmp)$/i.test(f))
    .map(f => {
      const stat = fs.statSync(path.join(UPLOAD_DIR, f));
      return { name: f, url: '/api/file/' + f, size: stat.size, time: stat.mtimeMs };
    })
    .sort((a, b) => b.time - a.time);
  res.json(files);
});

// Serve uploaded files
app.get('/api/file/:name', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.name);
  if (!path.resolve(filePath).startsWith(path.resolve(UPLOAD_DIR))) return res.status(403).send('Forbidden');
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  res.sendFile(filePath);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
