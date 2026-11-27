import { generateSitemap } from "../sitemap";

describe("sitemap generation", () => {
  it("includes public pages and drills as production URLs, excluding fallback pages", () => {
    const xml = generateSitemap([
      { path: "/" },
      { path: "/goalie-drills/" },
      { path: "/drills/example/" },
      { path: "/404/" },
      { path: "/404.html" },
      { path: "/dev-404-page/" },
      { path: "/offline-plugin-app-shell-fallback/" },
      { path: "/private/", matchPath: "/private/*" },
      { path: "/name&test/" },
    ]);
    const document = new DOMParser().parseFromString(xml, "application/xml");

    expect(document.querySelector("parsererror")).toBeNull();
    expect(document.documentElement.namespaceURI).toBe(
      "http://www.sitemaps.org/schemas/sitemap/0.9"
    );
    expect(
      Array.from(document.getElementsByTagName("loc"), (element) => element.textContent)
    ).toEqual([
      "https://goaliegen.com/",
      "https://goaliegen.com/drills/example/",
      "https://goaliegen.com/goalie-drills/",
      "https://goaliegen.com/name&test/",
    ]);
  });

  it("reflects pages being added and removed", () => {
    const before = generateSitemap([{ path: "/old/" }]);
    const after = generateSitemap([{ path: "/new/" }]);

    expect(before).toContain("https://goaliegen.com/old/");
    expect(after).toContain("https://goaliegen.com/new/");
    expect(after).not.toContain("https://goaliegen.com/old/");
  });
});
