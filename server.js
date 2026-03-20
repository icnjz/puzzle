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
    // 保留原始文件名，前面加时间戳防重名
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
      // 去掉时间戳前缀，还原显示名
      const displayName = f.replace(/^\d+_/, '');
      return { name: f, displayName, url: '/api/file/' + f, size: stat.size, time: stat.mtimeMs };
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

// Delete image
app.delete('/api/file/:name', (req, res) => {
  const filePath = path.join(UPLOAD_DIR, req.params.name);
  if (!path.resolve(filePath).startsWith(path.resolve(UPLOAD_DIR))) return res.status(403).json({ error: 'Forbidden' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
