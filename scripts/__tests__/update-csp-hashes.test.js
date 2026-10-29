const crypto = require("node:crypto");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const {
  getInlineScriptHashes,
  normalizeGatsbyPagePathScripts,
  updateCspHashes,
} = require("../update-csp-hashes");

describe("CSP hash generation", () => {
  it("hashes executable inline scripts but not external or data scripts", () => {
    const inlineScript = "window.app = true;";
    const expectedHash = `'sha256-${crypto.createHash("sha256").update(inlineScript).digest("base64")}'`;
    const html = `
      <script src="/app.js"></script>
      <script type="application/json">{"key":"value"}</script>
      <script>${inlineScript}</script>
      <script type="module">import "/module.js";</script>
    `;

    expect(getInlineScriptHashes(html)).toEqual([
      expectedHash,
      `'sha256-${crypto.createHash("sha256").update('import "/module.js";').digest("base64")}'`,
    ]);
  });

  it("recognizes inline scripts with whitespace or attributes on the closing tag", () => {
    const inlineScript = "window.endTag = true;";
    const html = `<script>${inlineScript}</script \n data-note="ignored">`;

    expect(getInlineScriptHashes(html)).toEqual([
      `'sha256-${crypto.createHash("sha256").update(inlineScript).digest("base64")}'`,
    ]);
  });

  it("uses one shared Gatsby page-path script while preserving each page path", () => {
    const html =
      '<script id="gatsby-script-loader">/*<![CDATA[*/window.pagePath="/drills/test/";/*]]>*/</script>';
    const normalized = normalizeGatsbyPagePathScripts(html);

    expect(normalized).toContain('data-page-path="/drills/test/"');
    expect(normalized).toContain(
      'window.pagePath=document.currentScript.getAttribute("data-page-path");'
    );
    expect(getInlineScriptHashes(normalized)).toHaveLength(1);
    expect(normalizeGatsbyPagePathScripts(normalized)).toBe(normalized);
  });

  it("adds hashes for all built pages to the generated headers file", () => {
    const publicDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "csp-headers-"));
    const nestedDirectory = path.join(publicDirectory, "nested");
    fs.mkdirSync(nestedDirectory);
    const firstHash = `'sha256-${crypto.createHash("sha256").update("window.one = 1;").digest("base64")}'`;
    const secondHash = `'sha256-${crypto.createHash("sha256").update("window.two = 2;").digest("base64")}'`;
    fs.writeFileSync(
      path.join(publicDirectory, "_headers"),
      `/*\n  Content-Security-Policy: default-src 'self'; script-src 'self' ${firstHash} https://www.googletagmanager.com;\n`
    );
    fs.writeFileSync(path.join(publicDirectory, "index.html"), "<script>window.one = 1;</script>");
    fs.writeFileSync(path.join(nestedDirectory, "index.html"), "<script>window.two = 2;</script>");

    try {
      expect(updateCspHashes(publicDirectory)).toBe(2);
      const headers = fs.readFileSync(path.join(publicDirectory, "_headers"), "utf8");
      expect(headers).toContain(firstHash);
      expect(headers).toContain(secondHash);
      expect(headers.match(/script-src/g)).toHaveLength(1);
      expect(headers).not.toContain("window.one = 1;");
    } finally {
      fs.rmSync(publicDirectory, { recursive: true, force: true });
    }
  });

  it("fails when generated hashes exceed Cloudflare Pages' header limit", () => {
    const publicDirectory = fs.mkdtempSync(path.join(os.tmpdir(), "csp-headers-limit-"));
    fs.writeFileSync(
      path.join(publicDirectory, "_headers"),
      `/*\n  Content-Security-Policy: default-src 'self'; script-src 'self' ${"https://example.com ".repeat(110)};\n`
    );
    fs.writeFileSync(path.join(publicDirectory, "index.html"), "<script>window.one = 1;</script>");

    try {
      expect(() => updateCspHashes(publicDirectory)).toThrow(/2,000-character header limit/);
    } finally {
      fs.rmSync(publicDirectory, { recursive: true, force: true });
    }
  });
});
