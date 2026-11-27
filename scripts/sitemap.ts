const CANONICAL_ORIGIN = "https://goaliegen.com";
const EXCLUDED_PATHS = new Set([
  "/404",
  "/404.html",
  "/dev-404-page",
  "/offline-plugin-app-shell-fallback",
]);

export function generateSitemap(pages: Array<{ path: string; matchPath?: string | null }>): string {
  const locations = pages
    .filter(({ path, matchPath }) => !matchPath && !EXCLUDED_PATHS.has(path.replace(/\/$/, "")))
    .map(({ path }) => new URL(path, CANONICAL_ORIGIN).href)
    .sort();

  const entries = locations.map(
    (location) =>
      `  <url><loc>${location.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</loc></url>`
  );
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join("\n")}\n</urlset>\n`;
}
