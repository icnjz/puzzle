const express = require('express');
const multer = require('multer');
const path = require('path');
const { put, list, del } = require('@vercel/blob');

const app = express();

const upload = multer({
  storage: multer.memoryStorage(),
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
app.post('/api/upload', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file' });
    const safe = req.file.originalname.replace(/[^a-zA-Z0-9._\u4e00-\u9fff-]/g, '_');
    const filename = Date.now() + '_' + safe;
    const blob = await put('puzzle/' + filename, req.file.buffer, {
      access: 'public',
      contentType: req.file.mimetype
    });
    res.json({ success: true, filename, url: blob.url });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// List images
app.get('/api/images', async (req, res) => {
  try {
    const { blobs } = await list({ prefix: 'puzzle/' });
    const files = blobs
      .filter(b => /\.(png|jpe?g|gif|webp|bmp)$/i.test(b.pathname))
      .map(b => {
        const name = b.pathname.replace('puzzle/', '');
        const displayName = name.replace(/^\d+_/, '');
        return {
          name,
          displayName,
          url: b.url,
          size: b.size,
          time: new Date(b.uploadedAt).getTime()
        };
      })
      .sort((a, b) => b.time - a.time);
    res.json(files);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Delete image
app.delete('/api/file/:name', async (req, res) => {
  try {
    const { blobs } = await list({ prefix: 'puzzle/' + req.params.name });
    if (blobs.length === 0) return res.status(404).json({ error: 'Not found' });
    await del(blobs[0].url);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = app;
