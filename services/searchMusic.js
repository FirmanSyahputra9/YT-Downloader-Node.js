const { spawn } = require('child_process');

async function searchWithCategory(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  const query = req.query.q || 'music trending';
  const page = parseInt(req.query.page) || 1;
  const limit = 20;

  const startItem = (page - 1) * limit + 1;
  const endItem = page * limit;

  let hasResults = false;

  const PATH = 'C:\\Users\\FIRMAN\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\yt-dlp.exe';

  const args = [`ytsearch${endItem}:${query}`, '--playlist-items', `${startItem}-${endItem}`, '--flat-playlist', '--dump-json', '--no-check-certificates', '--quiet'];

  const ytdlp = spawn(PATH, args);

  ytdlp.stdout.on('data', (data) => {
    const lines = data.toString().split('\n');
    for (let line of lines) {
      if (!line.trim()) continue;
      try {
        const video = JSON.parse(line);
        hasResults = true;

        const payload = {
          type: 'append',
          video: {
            title: video.title,
            url: `https://www.youtube.com/watch?v=${video.id}`,
            thumbnail: video.thumbnail || `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`,
            views: video.view_count || 0,
            duration_string: video.duration_string || 'N/A',
          },
        };
        res.write(`data: ${JSON.stringify(payload)}\n\n`);
      } catch (e) {
      }
    }
  });

  ytdlp.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  ytdlp.on('close', (code) => {
    if (!hasResults && page === 1) {
      res.write(`data: ${JSON.stringify({ type: 'info', message: 'Lagu tidak ditemukan atau pencarian berakhir.' })}\n\n`);
    }

    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
    res.end();
  });

  req.on('close', () => ytdlp.kill());
}

module.exports = { searchWithCategory };
