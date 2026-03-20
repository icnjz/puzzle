const { list, del } = require('@vercel/blob');

module.exports = async function handler(req, res) {
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const name = req.query.name;
    if (!name) return res.status(400).json({ error: 'Missing name' });

    const { blobs } = await list({ prefix: 'puzzle/' + name });
    if (blobs.length === 0) return res.status(404).json({ error: 'Not found' });

    await del(blobs[0].url);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};
