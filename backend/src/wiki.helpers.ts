import fetch from 'node-fetch';

export function normalizePage(page: string): string {
  return page.toLowerCase().replace(/_/g, ' ').trim();
}

const ALLOWED_LANGS = new Set(['es', 'en']);

function wikiBase(lang: string): string {
  const safeLang = ALLOWED_LANGS.has(lang) ? lang : 'es';
  return `https://${safeLang}.wikipedia.org/api/rest_v1`;
}

// Returns the canonical Wikipedia title (following redirects) or null if the page doesn't exist
export async function getCanonicalTitle(title: string, lang = 'es'): Promise<string | null> {
  try {
    const res = await fetch(
      `${wikiBase(lang)}/page/html/${encodeURIComponent(title)}`,
      { method: 'HEAD' }
    );
    if (!res.ok) return null;
    const cl = res.headers.get('content-location');
    const encoded = cl?.split('/page/html/')[1]?.split('/')[0];
    if (encoded) return decodeURIComponent(encoded).replace(/_/g, ' ');
    // Fallback: extract canonical from final URL after redirect (Wikipedia REST API v2 format: /page/TITLE/html)
    const urlMatch = res.url.match(/\/page\/([^/?]+)\/html/);
    return urlMatch ? decodeURIComponent(urlMatch[1]).replace(/_/g, ' ') : title;
  } catch {
    return null;
  }
}

// Returns a valid random Wikipedia page title (non-stub, non-disambiguation).
// Optional `exclude` avoids returning the same title as the start/target page.
export async function getValidRandomPage(maxAttempts = 10, exclude?: string, lang = 'es'): Promise<string> {
  const fallbacks: Record<string, [string, string]> = {
    es: ['España', 'Francia'],
    en: ['United States', 'United Kingdom'],
  };
  const [defaultFallback, alternateFallback] = fallbacks[lang] ?? fallbacks.es;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch(`${wikiBase(lang)}/page/random/summary`);
      if (!res.ok) continue;

      const data = await res.json() as { title: string; extract?: string; type?: string };

      if (data.type === 'disambiguation') continue;
      if (!data.extract || data.extract.length < 150) continue;

      const canonical = await getCanonicalTitle(data.title, lang);
      if (!canonical) continue;

      if (exclude && normalizePage(canonical) === normalizePage(exclude)) continue;

      console.log(`[Page] Valid page found: "${canonical}" (attempt ${i + 1})`);
      return canonical;
    } catch {
      continue;
    }
  }

  const fallback = (exclude && normalizePage(exclude) === normalizePage(defaultFallback))
    ? alternateFallback
    : defaultFallback;
  console.warn(`[Page] Could not find valid page after max attempts, using fallback: "${fallback}"`);
  return fallback;
}
