import fetch from 'node-fetch';

export function normalizePage(page: string): string {
  return page.toLowerCase().replace(/_/g, ' ').trim();
}

// Returns the canonical Wikipedia title (following redirects) or null if the page doesn't exist
export async function getCanonicalTitle(title: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://es.wikipedia.org/api/rest_v1/page/html/${encodeURIComponent(title)}`,
      { method: 'HEAD' }
    );
    if (!res.ok) return null;
    const cl = res.headers.get('content-location');
    const encoded = cl?.split('/page/html/')[1]?.split('/')[0];
    return encoded ? decodeURIComponent(encoded).replace(/_/g, ' ') : title;
  } catch {
    return null;
  }
}

// Returns a valid random Wikipedia page title (non-stub, non-disambiguation).
// Optional `exclude` avoids returning the same title as the start/target page.
export async function getValidRandomPage(maxAttempts = 10, exclude?: string): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    try {
      const res = await fetch('https://es.wikipedia.org/api/rest_v1/page/random/summary');
      if (!res.ok) continue;

      const data = await res.json() as { title: string; extract?: string; type?: string };

      if (data.type === 'disambiguation') continue;
      if (!data.extract || data.extract.length < 150) continue;

      const canonical = await getCanonicalTitle(data.title);
      if (!canonical) continue;

      if (exclude && normalizePage(canonical) === normalizePage(exclude)) continue;

      console.log(`[Page] Valid page found: "${canonical}" (attempt ${i + 1})`);
      return canonical;
    } catch {
      continue;
    }
  }

  // Use different fallbacks so start and target are never both the same hardcoded page
  const fallback = (exclude && normalizePage(exclude) === normalizePage('España'))
    ? 'Francia'
    : 'España';
  console.warn(`[Page] Could not find valid page after max attempts, using fallback: "${fallback}"`);
  return fallback;
}
