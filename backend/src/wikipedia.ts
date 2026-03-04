import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { getCanonicalTitle, getValidRandomPage } from './wiki.helpers';

const router = Router();

// Simple in-memory cache for page HTML (avoids re-fetching the same article multiple times in a session)
const contentCache = new Map<string, { html: string; title: string; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 50;

function getCached(title: string): { html: string; title: string } | null {
  const entry = contentCache.get(title);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { contentCache.delete(title); return null; }
  return { html: entry.html, title: entry.title };
}

function setCached(key: string, html: string, title: string): void {
  if (contentCache.size >= MAX_CACHE_ENTRIES) {
    // Evict oldest entry
    const oldest = contentCache.keys().next().value;
    if (oldest) contentCache.delete(oldest);
  }
  contentCache.set(key, { html, title, ts: Date.now() });
}

router.get('/random', async (_req: Request, res: Response) => {
  try {
    const title = await getValidRandomPage();
    const summary = await fetch(`https://es.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!summary.ok) { res.status(500).json({ error: 'Failed to fetch summary' }); return; }
    const data = await summary.json() as any;
    res.json({ title, extract: data.extract, thumbnail: data.thumbnail });
  } catch {
    res.status(500).json({ error: 'Failed to fetch a valid random page' });
  }
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
  const { title } = req.params;

  // Return cached version if still fresh
  const cached = getCached(title);
  if (cached) {
    res.json(cached);
    return;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15_000);

  try {
    const response = await fetch(
      `https://es.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`,
      { headers: { Accept: 'text/html; charset=utf-8' }, signal: controller.signal as any }
    );
    clearTimeout(timer);

    if (!response.ok) {
      res.status(404).json({ error: 'Page not found' });
      return;
    }

    const html = await response.text();

    // Extract canonical title from Content-Location header (e.g. "Highland City" → "Highland City (Florida)")
    const cl = response.headers.get('content-location');
    const encoded = cl?.split('/page/html/')[1]?.split('/')[0];
    const canonicalTitle = encoded
      ? decodeURIComponent(encoded).replace(/_/g, ' ')
      : decodeURIComponent(title);

    setCached(title, html, canonicalTitle);
    // Also cache under canonical title so future requests hit the cache
    if (canonicalTitle !== decodeURIComponent(title)) {
      setCached(canonicalTitle, html, canonicalTitle);
    }

    res.json({ html, title: canonicalTitle });
  } catch (err: any) {
    clearTimeout(timer);
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'Wikipedia request timed out' });
    } else {
      res.status(500).json({ error: 'Failed to fetch page content' });
    }
  }
});

export default router;
