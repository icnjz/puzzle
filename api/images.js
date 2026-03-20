const { list } = require('@vercel/blob');

module.exports = async function handler(req, res) {
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
};
