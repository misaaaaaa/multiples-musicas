const { chromium } = require('playwright');

const PLAYLISTS = [
  { url: 'https://music.youtube.com/playlist?list=PLYuJsrss8DN_1g7HNw3F4aNSVR7LoNuNY', name: '2026-02' },
  { url: 'https://music.youtube.com/playlist?list=PLYuJsrss8DN_k1YXDMFmPMJiMojiOZjAY', name: '2026-03' },
  { url: 'https://music.youtube.com/playlist?list=PLYuJsrss8DN8dI53TsCLO2kr7j0qG6cDD', name: '2026-04' },
  { url: 'https://music.youtube.com/playlist?list=PLYuJsrss8DN-zlTZhOBbahbFt0iQVdz_k', name: '2026-05' },
];

// MusicBrainz year lookup (rate-limited to 1 req/s as per API guidelines)
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchYear(artist, album) {
  try {
    const q = encodeURIComponent(`releasegroup:"${album}" AND artist:"${artist}"`);
    const url = `https://musicbrainz.org/ws/2/release-group?query=${q}&limit=1&fmt=json`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'multiples-musicas/1.0 (https://github.com/misaaaaaa/multiples-musicas)' }
    });
    if (!res.ok) return 's/a';
    const data = await res.json();
    const rg = data['release-groups']?.[0];
    if (!rg) return 's/a';
    const year = rg['first-release-date']?.slice(0, 4);
    return year || 's/a';
  } catch {
    return 's/a';
  }
}

async function scrapePlaylist(page, url) {
  await page.goto(url, { waitUntil: 'networkidle', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Scroll to load all tracks
  let previousCount = 0;
  let sameCount = 0;
  while (sameCount < 3) {
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(1500);
    const count = await page.$$eval('ytmusic-responsive-list-item-renderer', els => els.length);
    if (count === previousCount) {
      sameCount++;
    } else {
      sameCount = 0;
      previousCount = count;
    }
  }

  // Extract artist • album pairs
  const tracks = await page.$$eval('ytmusic-responsive-list-item-renderer', items => {
    return items.map(item => {
      // Artist: first flex column link text (2nd column)
      const cols = item.querySelectorAll('.secondary-flex-columns yt-formatted-string a');
      const artistEl = item.querySelector('.flex-column:not(.title-column) yt-formatted-string a');

      // Title column
      const titleEl = item.querySelector('.title-column .title yt-formatted-string');
      const title = titleEl ? titleEl.innerText.trim() : '';

      // All secondary column links
      const secCols = item.querySelectorAll('.secondary-flex-columns .flex-column');

      let artist = '';
      let album = '';

      if (secCols.length >= 1) {
        // First secondary column = artist(s)
        const artistLinks = secCols[0].querySelectorAll('a');
        if (artistLinks.length > 0) {
          artist = artistLinks[0].innerText.trim();
        } else {
          const text = secCols[0].querySelector('yt-formatted-string');
          if (text) artist = text.innerText.trim();
        }
      }
      if (secCols.length >= 2) {
        // Second secondary column = album
        const albumLink = secCols[1].querySelector('a');
        if (albumLink) {
          album = albumLink.innerText.trim();
        } else {
          const text = secCols[1].querySelector('yt-formatted-string');
          if (text) album = text.innerText.trim();
        }
      }

      return { title, artist, album };
    });
  });

  return tracks;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'es-419',
  });
  const page = await context.newPage();

  for (const playlist of PLAYLISTS) {
    console.log(`\n=== ${playlist.name} ===`);
    const tracks = await scrapePlaylist(page, playlist.url);
    console.log(`Total tracks scraped: ${tracks.length}`);

    // Deduplicate by artist+album
    const seen = new Set();
    const unique = [];
    for (const t of tracks) {
      const key = `${t.artist}|||${t.album}`;
      if (!seen.has(key) && t.artist) {
        seen.add(key);
        unique.push(t);
      }
    }

    // Sort by artist
    unique.sort((a, b) => a.artist.localeCompare(b.artist, 'es'));

    console.log(`\nUnique artist-album pairs: ${unique.length}`);
    console.log('Fetching years from MusicBrainz...');

    // Fetch years with rate limiting
    for (const t of unique) {
      t.year = await fetchYear(t.artist, t.album);
      await sleep(1100); // respect MusicBrainz 1 req/s limit
    }

    console.log('\n| Artista | Álbum | Año |');
    console.log('| --- | --- | --- |');
    for (const t of unique) {
      console.log(`| ${t.artist} | ${t.album || 'desconocido'} | ${t.year} |`);
    }
  }

  await browser.close();
})();
