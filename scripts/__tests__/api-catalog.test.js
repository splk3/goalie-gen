const fs = require("node:fs");
const path = require("node:path");

const staticDirectory = path.resolve(__dirname, "../../static");

describe("API catalog", () => {
  it("links the published search endpoint to its OpenAPI description and documentation", () => {
    const catalog = JSON.parse(
      fs.readFileSync(path.join(staticDirectory, ".well-known/api-catalog"), "utf8")
    );
    const catalogEntry = catalog.linkset.find(
      ({ anchor }) => anchor === "https://goaliegen.com/.well-known/api-catalog"
    );
    expect(catalogEntry).toBeDefined();
    expect(catalogEntry.item).toEqual(
      expect.arrayContaining([{ href: "https://goaliegen.com/.well-known/search" }])
    );
    const search = catalog.linkset.find(
      ({ anchor }) => anchor === "https://goaliegen.com/.well-known/search"
    );
    expect(search).toBeDefined();
    const descriptionUrl = new URL(search["service-desc"][0].href);
    const description = JSON.parse(
      fs.readFileSync(path.join(staticDirectory, descriptionUrl.pathname), "utf8")
    );
    const endpoint = new URL(search.anchor);

    expect(endpoint.origin).toBe("https://goaliegen.com");
    expect(description.servers.some(({ url }) => url === endpoint.origin)).toBe(true);
    expect(description.paths[endpoint.pathname].get.parameters).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: "q", in: "query", required: true })])
    );
    expect(search["service-doc"][0].href).toMatch(/^https:\/\//);
  });

  it("sets the catalog media type and link relation for Cloudflare", () => {
    const headers = fs.readFileSync(path.join(staticDirectory, "_headers"), "utf8");

    expect(headers).toMatch(
      /\/\.well-known\/api-catalog\n {2}Content-Type: application\/linkset\+json;/
    );
    expect(headers).toContain('Link: </.well-known/api-catalog>; rel="api-catalog"');
  });
});
