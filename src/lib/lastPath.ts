/**
 * Some static hosts answer every deep link with a redirect to /index.html. The
 * redirect drops the path, so refreshing a board would land on the home page.
 * Each tab remembers the page it is on; when a reload arrives at /index.html,
 * that page is put back before the router reads the address.
 *
 * A host that rewrites deep links to index.html (the correct setup) never
 * serves the app at /index.html, so none of this runs there.
 */
const KEY = 'tb-last-path';

/** Call once, before the router mounts. */
export function restorePathAfterRedirect(): void {
  if (window.location.pathname !== '/index.html') return;
  let target = '/';
  try {
    const [entry] = performance.getEntriesByType('navigation') as PerformanceNavigationTiming[];
    const saved = sessionStorage.getItem(KEY);
    // Only a reload means "the page I was just on". A first visit to a link
    // cannot be recovered, because the host dropped its path: it goes home.
    if (entry?.type === 'reload' && saved && saved.startsWith('/') && !saved.startsWith('//')) {
      target = saved;
    }
  } catch {
    // Storage or timing unavailable: fall back to the home page.
  }
  window.history.replaceState(window.history.state, '', target);
}

/** Record the page this tab is on. */
export function rememberPath(path: string): void {
  try {
    sessionStorage.setItem(KEY, path);
  } catch {
    // Storage unavailable: a refresh falls back to the home page.
  }
}
