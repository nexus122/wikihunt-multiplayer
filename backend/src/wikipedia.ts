import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';

const router = Router();

router.get('/random', async (_req: Request, res: Response) => {
  for (let i = 0; i < 10; i++) {
    try {
      const response = await fetch('https://es.wikipedia.org/api/rest_v1/page/random/summary');
      if (!response.ok) continue;
      const data = await response.json() as any;
      if (data.type === 'disambiguation') continue;
      if (!data.extract || data.extract.length < 150) continue;
      res.json({ title: data.title, extract: data.extract, thumbnail: data.thumbnail });
      return;
    } catch {
      continue;
    }
  }
  res.status(500).json({ error: 'Failed to fetch a valid random page' });
});

router.get('/summary/:title', async (req: Request, res: Response) => {
  try {
    const { title } = req.params;
    const response = await fetch(
      `https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
    );
    if (!response.ok) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }
    const data = await response.json() as any;
    res.json({ title: data.title, extract: data.extract, thumbnail: data.thumbnail });
  } catch {
    res.status(500).json({ error: 'Failed to fetch page summary' });
  }
});

router.get('/search', async (req: Request, res: Response) => {
  try {
    const q = req.query.q as string;
    if (!q) { res.json([]); return; }
    const url = `https://es.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=8&format=json&namespace=0&origin=*`;
    const response = await fetch(url);
    const data = await response.json() as [string, string[], string[], string[]];
    const results = data[1].map((title: string, i: number) => ({
      title,
      extract: data[2][i] || '',
    }));
    res.json(results);
  } catch {
    res.status(500).json({ error: 'Failed to search Wikipedia' });
  }
});

router.get('/content/:title', async (req: Request, res: Response) => {
  try {
    const { title } = req.params;
    const response = await fetch(
      `https://es.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`,
      { headers: { Accept: 'text/html; charset=utf-8' } }
    );
    if (!response.ok) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }
    const html = await response.text();

    // Extract canonical title from Content-Location header (e.g. "Highland City" → "Highland City (Florida)")
    // This ensures win detection uses the same title Wikipedia uses in its own links
    const cl = response.headers.get('content-location');
    const encoded = cl?.split('/page/html/')[1]?.split('/')[0];
    const canonicalTitle = encoded
      ? decodeURIComponent(encoded).replace(/_/g, ' ')
      : decodeURIComponent(title);

    res.json({ html, title: canonicalTitle });
  } catch {
    res.status(500).json({ error: 'Failed to fetch page content' });
  }
});

export default router;
