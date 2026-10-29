const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");

const SCRIPT_TAG_PATTERN = /<script\b([^>]*)>([\s\S]*?)<\/script(?:[\t\n\f\r /][^>]*)?>/gi;
const EXECUTABLE_SCRIPT_TYPES = new Set([
  "application/ecmascript",
  "application/javascript",
  "text/ecmascript",
  "text/javascript",
]);

function getInlineScriptHashes(html) {
  const hashes = new Set();
  let match;

  while ((match = SCRIPT_TAG_PATTERN.exec(html)) !== null) {
    const [, attributes, content] = match;
    if (/(?:^|\s)src\s*=/i.test(attributes) || !content.trim()) continue;

    const typeMatch = attributes.match(/\btype\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const type = typeMatch && (typeMatch[1] || typeMatch[2] || typeMatch[3]).toLowerCase();
    if (type && type !== "module" && !EXECUTABLE_SCRIPT_TYPES.has(type)) continue;

    const digest = crypto.createHash("sha256").update(content, "utf8").digest("base64");
    hashes.add(`'sha256-${digest}'`);
  }

  return [...hashes].sort();
}

function getHtmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return getHtmlFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".html") ? [entryPath] : [];
  });
}

function normalizeGatsbyPagePathScripts(html) {
  return html.replace(SCRIPT_TAG_PATTERN, (tag, attributes, content) => {
    if (
      !/\bid\s*=\s*(?:"gatsby-script-loader"|'gatsby-script-loader'|gatsby-script-loader(?=[\s>]))/i.test(
        attributes
      )
    ) {
      return tag;
    }
    if (
      content.includes('window.pagePath=document.currentScript.getAttribute("data-page-path");')
    ) {
      return tag;
    }

    const pagePathMatch = content.match(/window\.pagePath\s*=\s*("(?:\\.|[^"\\])*")\s*;/);
    if (!pagePathMatch) {
      throw new Error("Could not read the page path from Gatsby's script loader.");
    }

    const pagePath = JSON.parse(pagePathMatch[1]);
    const escapedPagePath = pagePath
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;");
    return `<script${attributes} data-page-path="${escapedPagePath}">/*<![CDATA[*/window.pagePath=document.currentScript.getAttribute("data-page-path");/*]]>*/</script>`;
  });
}

function updateCspHashes(publicDirectory) {
  const headersPath = path.join(publicDirectory, "_headers");
  if (!fs.existsSync(headersPath)) {
    throw new Error(`Cloudflare headers file not found: ${headersPath}`);
  }

  const hashes = new Set();
  for (const htmlPath of getHtmlFiles(publicDirectory)) {
    const html = normalizeGatsbyPagePathScripts(fs.readFileSync(htmlPath, "utf8"));
    fs.writeFileSync(htmlPath, html);
    for (const hash of getInlineScriptHashes(html)) {
      hashes.add(hash);
    }
  }
  if (hashes.size === 0) {
    throw new Error("No inline scripts found in the Gatsby output; cannot generate CSP hashes.");
  }

  const headers = fs.readFileSync(headersPath, "utf8");
  const updatedHeaders = headers.replace(
    /^(\s*Content-Security-Policy:\s*)(.*)$/m,
    (_line, prefix, policy) => {
      const directives = policy.split(";").map((directive) => directive.trim());
      const scriptSrcIndex = directives.findIndex((directive) =>
        directive.startsWith("script-src ")
      );
      if (scriptSrcIndex === -1) {
        throw new Error("Content-Security-Policy is missing a script-src directive.");
      }

      const scriptSrcParts = directives[scriptSrcIndex].split(/\s+/);
      directives[scriptSrcIndex] = [
        ...scriptSrcParts.filter((part) => !part.startsWith("'sha256-")),
        ...[...hashes].sort(),
      ].join(" ");
      const updatedPolicy = `${directives.join("; ")};`;
      if (updatedPolicy.length > 2000) {
        throw new Error(
          "Content-Security-Policy exceeds Cloudflare Pages' 2,000-character header limit."
        );
      }
      return `${prefix}${updatedPolicy}`;
    }
  );
  if (updatedHeaders === headers) {
    throw new Error("Content-Security-Policy header not found in Cloudflare headers file.");
  }

  fs.writeFileSync(headersPath, updatedHeaders);
  return hashes.size;
}

module.exports = { getInlineScriptHashes, normalizeGatsbyPagePathScripts, updateCspHashes };
