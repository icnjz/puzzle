const { put } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const filename = req.query.filename || 'image.jpg';
    const safe = filename.replace(/[^a-zA-Z0-9._\u4e00-\u9fff-]/g, '_');
    const blobName = 'puzzle/' + Date.now() + '_' + safe;

    const blob = await put(blobName, req, {
      access: 'public',
    });

    res.json({ success: true, url: blob.url, filename: blobName });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// Disable body parsing so we can stream the file
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
