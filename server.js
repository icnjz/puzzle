const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3333;
const ROOT = __dirname;
const UPLOAD_DIR = path.join(ROOT, 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

app.use(express.static(path.join(ROOT, 'public')));

// Upload - stream body, filename in query
app.post('/api/upload', (req, res) => {
  try {
    const originalName = req.query.filename || 'image.jpg';
    const ext = path.extname(originalName).toLowerCase();
    if (!['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp'].includes(ext)) {
      return res.status(400).json({ error: 'Only image files allowed' });
    }
    const safe = originalName.replace(/[^a-zA-Z0-9._\u4e00-\u9fff-]/g, '_');
    const filename = Date.now() + '_' + safe;
    const filePath = path.join(UPLOAD_DIR, filename);
    const ws = fs.createWriteStream(filePath);
    req.pipe(ws);
    ws.on('finish', () => res.json({ success: true, filename }));
    ws.on('error', (e) => res.status(500).json({ error: e.message }));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List images
app.get('/api/images', (req, res) => {
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
  if (!path.resolve(filePath).startsWith(path.resolve(UPLOAD_DIR))) return res.status(403).send('Forbidden');
  if (!fs.existsSync(filePath)) return res.status(404).send('Not found');
  res.sendFile(filePath);
});

// Delete image
app.delete('/api/delete', (req, res) => {
  const name = req.query.name;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const filePath = path.join(UPLOAD_DIR, name);
  if (!path.resolve(filePath).startsWith(path.resolve(UPLOAD_DIR))) return res.status(403).json({ error: 'Forbidden' });
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  fs.unlinkSync(filePath);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
