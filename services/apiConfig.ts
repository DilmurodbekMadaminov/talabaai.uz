/**
 * API Configuration & Dynamic URL Resolver
 * Supports Cloudflare Pages, Cloudflare Workers, Cloud Run, VPS, Docker, and Localhost
 */

export function getAbsoluteApiUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : '/' + path;

  // 1. Check if user configured a custom backend in runtime LocalStorage
  if (typeof window !== 'undefined') {
    const customUrl = localStorage.getItem('STUDENT_AI_CUSTOM_BACKEND_URL');
    if (customUrl && customUrl.trim()) {
      const base = customUrl.trim().replace(/\/+$/, '');
      return `${base}${cleanPath}`;
    }
  }

  // 2. Check Vite build-time environment variables (Cloudflare Pages, Vercel, Netlify)
  const meta = import.meta as any;
  const envApiUrl = 
    (typeof meta !== 'undefined' && meta?.env) 
      ? (meta.env.VITE_API_URL || meta.env.VITE_BACKEND_URL || meta.env.VITE_API_BASE_URL)
      : null;

  if (envApiUrl && typeof envApiUrl === 'string' && envApiUrl.trim()) {
    const base = envApiUrl.trim().replace(/\/+$/, '');
    return `${base}${cleanPath}`;
  }

  // 3. Fallback to same-origin relative path (for full-stack Express, Cloudflare with reverse proxy)
  return cleanPath;
}

/**
 * Robust JSON fetcher with error isolation to prevent JSON parsing crashes on Cloudflare 404/500 HTML pages
 */
export async function safeFetchJson<T = any>(
  url: string, 
  options?: RequestInit, 
  fallbackValue: T = {} as T
): Promise<{ ok: boolean; status: number; data: T; error?: string }> {
  try {
    const fullUrl = getAbsoluteApiUrl(url);
    const res = await fetch(fullUrl, {
      ...options,
      headers: {
        'Accept': 'application/json',
        ...(options?.headers || {})
      }
    });

    const text = await res.text();
    let data: any = fallbackValue;
    try {
      data = text ? JSON.parse(text) : fallbackValue;
    } catch {
      data = fallbackValue;
    }

    if (!res.ok) {
      let errMsg = `HTTP ${res.status}`;
      if (data && typeof data === 'object') {
        errMsg = data.error || data.message || errMsg;
      }
      return { ok: false, status: res.status, data, error: errMsg };
    }

    return { ok: true, status: res.status, data };
  } catch (err: any) {
    console.error(`[safeFetchJson Error for ${url}]:`, err);
    return { ok: false, status: 0, data: fallbackValue, error: err.message || 'Tarmoq xatosi' };
  }
}
