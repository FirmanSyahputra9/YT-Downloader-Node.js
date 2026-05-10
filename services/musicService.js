const { spawn } = require('child_process');

function searchPopular(req, res) {
  res.setHeader('Content-Type', 'text/event-stream');

  res.setHeader('Cache-Control', 'no-cache');

  res.setHeader('Connection', 'keep-alive');

  const minViews = parseInt(req.query.minViews) || 0;

  const PATH = 'C:\\Users\\FIRMAN\\AppData\\Local\\Programs\\Python\\Python312\\Scripts\\yt-dlp.exe';

  const blacklist = ['album', 'full album', 'kompilasi', 'compilation', 'nonstop', 'playlist', 'mix', 'jukebox', 'best of'];

  const args = ['ytsearch200:official music video trending', '--flat-playlist', '--dump-json', '--no-playlist', '--no-cache-dir'];

  const ytdlp = spawn(PATH, args);

  let count = 0;

  const target = 20;

  ytdlp.stdout.on('data', (data) => {
    if (count >= target) return;

    const lines = data.toString().split('\n');

    for (let line of lines) {
      if (!line.trim() || count >= target) continue;

      try {
        const video = JSON.parse(line);

        const titleLower = video.title.toLowerCase();

        const duration = video.duration || 0;

        const views = video.view_count || 0;

        if (duration < 180 || duration > 390) continue;

        const isBlacklisted = blacklist.some((word) => titleLower.includes(word));

        if (isBlacklisted) continue;


        if (views < minViews) continue;

        count++;

        const payload = {
          type: 'append',
          video: {
            title: video.title,
            url: `https://www.youtube.com/watch?v=${video.id}`,
            thumbnail: video.thumbnail || (video.thumbnails ? video.thumbnails[0].url : ''),
            views: views,
            duration_string: video.duration_string || 'N/A',
          },
        };

        res.write(`data: ${JSON.stringify(payload)}\n\n`);

        if (count >= target) {
          ytdlp.kill();
          break;
        }
      } catch (e) {}
    }
  });

  ytdlp.on('close', () => {
    res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);

    res.end();
  });

  req.on('close', () => {
    ytdlp.kill();
  });
}

module.exports = { searchPopular };
