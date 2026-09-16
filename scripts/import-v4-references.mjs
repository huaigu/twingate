// Mechanical import only: parse JSON literals, never execute the supplied HTML.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const base = path.resolve("design-explorations/signalpass-v4/reference");
fs.mkdirSync(base, { recursive: true });
const readObject = (source, name) => {
  const marker = `${name}=`;
  const start = source.indexOf(marker) + marker.length;
  if (start < marker.length) throw new Error(`Missing ${name}`);
  let depth = 0,
    quoted = false,
    escape = false;
  for (let i = start; i < source.length; i++) {
    const c = source[i];
    if (quoted) {
      if (escape) escape = false;
      else if (c === "\\") escape = true;
      else if (c === '"') quoted = false;
    } else if (c === '"') quoted = true;
    else if (c === "{") depth++;
    else if (c === "}" && --depth === 0)
      return JSON.parse(source.slice(start, i + 1));
  }
  throw new Error(`Unterminated ${name}`);
};
const source = fs.readFileSync(
  "/Users/bojack/Documents/SignalPass-refined-v2 (1).html",
  "utf8",
);
const pages = readObject(source, "const pages");
const resources = readObject(source, "const resources");
const assets = readObject(source, "window.SignalPassAssets");
for (const [name, content] of Object.entries({ ...pages, ...resources })) {
  const dest = path.join(base, name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, content);
}
for (const [name, uri] of Object.entries(assets)) {
  const [, , encoded] = uri.match(/^data:([^;]+);base64,(.*)$/s);
  const dest = path.join(base, name);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, Buffer.from(encoded, "base64"));
}
let hero = fs.readFileSync(
  "/Users/bojack/Documents/SignalPass-hero-natural-v3.html",
  "utf8",
);
const manifest = [];
hero = hero.replace(
  /data:([\w/+.-]+);base64,([A-Za-z0-9+/=]+)/g,
  (uri, mime, b64) => {
    const bytes = Buffer.from(b64, "base64");
    const hash = crypto
      .createHash("sha256")
      .update(bytes)
      .digest("hex")
      .slice(0, 12);
    const ext = mime.includes("svg") ? "svg" : mime.split("/")[1];
    const file = `assets/hero-${hash}.${ext}`;
    fs.writeFileSync(path.join(base, file), bytes);
    if (!manifest.some((x) => x.file === file))
      manifest.push({ file, mime, bytes: bytes.length });
    return file;
  },
);
fs.writeFileSync(path.join(base, "landing.html"), hero);
fs.writeFileSync(
  path.join(base, "import-manifest.json"),
  JSON.stringify(
    { pages: Object.keys(pages), assets: Object.keys(assets), hero: manifest },
    null,
    2,
  ) + "\n",
);
console.log(
  `Imported ${Object.keys(pages).length} inner pages, ${Object.keys(assets).length} assets, and the hero with ${manifest.length} assets.`,
);
