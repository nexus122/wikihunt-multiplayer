import { Router, Request, Response } from 'express';
import fetch from 'node-fetch';
import { getValidRandomPage } from './wiki.helpers';

const router = Router();

// Simple in-memory cache for page HTML (avoids re-fetching the same article multiple times in a session)
const contentCache = new Map<string, { html: string; title: string; ts: number }>();
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_ENTRIES = 50;

function cacheKey(lang: string, title: string): string {
  return `${lang}:${title}`;
}

function getCached(lang: string, title: string): { html: string; title: string } | null {
  const entry = contentCache.get(cacheKey(lang, title));
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { contentCache.delete(cacheKey(lang, title)); return null; }
  return { html: entry.html, title: entry.title };
}

function setCached(lang: string, key: string, html: string, title: string): void {
  if (contentCache.size >= MAX_CACHE_ENTRIES) {
    const oldest = contentCache.keys().next().value;
    if (oldest) contentCache.delete(oldest);
  }
  contentCache.set(cacheKey(lang, key), { html, title, ts: Date.now() });
}

function wikiBase(lang: string): string {
  return `https://${lang}.wikipedia.org/api/rest_v1`;
}

// Shared fetch-and-cache logic. Throws on AbortError so callers can return 504.
async function fetchAndCachePage(title: string, lang: string): Promise<{ html: string; title: string } | null> {
  const cached = getCached(lang, title);
  if (cached) return cached;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20_000);

  try {
    const response = await fetch(
      `${wikiBase(lang)}/page/html/${encodeURIComponent(title)}`,
      { headers: { Accept: 'text/html; charset=utf-8' }, signal: controller.signal as any }
    );
    clearTimeout(timer);

    if (!response.ok) return null;

    const html = await response.text();
    const cl = response.headers.get('content-location');
    const encoded = cl?.split('/page/html/')[1]?.split('/')[0];
    const canonicalTitle = encoded
      ? decodeURIComponent(encoded).replace(/_/g, ' ')
      : decodeURIComponent(title);

    setCached(lang, title, html, canonicalTitle);
    if (canonicalTitle !== decodeURIComponent(title)) {
      setCached(lang, canonicalTitle, html, canonicalTitle);
    }

    return { html, title: canonicalTitle };
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

// Pre-fetches a page into cache in the background. Silently ignores failures.
export async function preWarmCache(title: string, lang = 'es'): Promise<void> {
  try {
    await fetchAndCachePage(title, lang);
    console.log(`[Cache] Pre-warmed: "${title}" [${lang}]`);
  } catch {
    // pre-warm failures are non-critical
  }
}

router.get('/random', async (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || 'es';
  try {
    const title = await getValidRandomPage(10, undefined, lang);
    const summary = await fetch(`${wikiBase(lang)}/page/summary/${encodeURIComponent(title)}`);
    if (!summary.ok) { res.status(500).json({ error: 'Failed to fetch summary' }); return; }
    const data = await summary.json() as any;
    res.json({ title, extract: data.extract, thumbnail: data.thumbnail });
  } catch {
    res.status(500).json({ error: 'Failed to fetch a valid random page' });
  }
});

router.get('/summary/:title', async (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || 'es';
  try {
    const { title } = req.params;
    const response = await fetch(
      `${wikiBase(lang)}/page/summary/${encodeURIComponent(title)}`
    );
    if (!response.ok) { res.status(404).json({ error: 'Page not found' }); return; }
    const data = await response.json() as any;
    res.json({ title: data.title, extract: data.extract, thumbnail: data.thumbnail });
  } catch {
    res.status(500).json({ error: 'Failed to fetch page summary' });
  }
});

router.get('/search', async (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || 'es';
  try {
    const q = req.query.q as string;
    if (!q) { res.json([]); return; }
    const url = `https://${lang}.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=8&format=json&namespace=0&origin=*`;
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
  const lang = (req.query.lang as string) || 'es';
  const { title } = req.params;
  try {
    const result = await fetchAndCachePage(title, lang);
    if (!result) { res.status(404).json({ error: 'Page not found' }); return; }
    res.json(result);
  } catch (err: any) {
    if (err.name === 'AbortError') {
      res.status(504).json({ error: 'Wikipedia request timed out' });
    } else {
      res.status(500).json({ error: 'Failed to fetch page content' });
    }
  }
});

export default router;
