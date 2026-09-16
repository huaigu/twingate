// One-time mechanical conversion of the supplied reference HTML to native pages.
// Live files in apps/web/public/v4 are maintained directly after this import.
import fs from "node:fs";
import path from "node:path";
const src = "design-explorations/signalpass-v4/reference";
const dest = "apps/web/public/v4";
if (fs.existsSync(`${dest}/app.js`))
  throw new Error(
    "V4 is already imported and refined. Edit its live files directly; this importer must not overwrite them.",
  );
fs.mkdirSync(dest, { recursive: true });
fs.cpSync(`${src}/assets`, `${dest}/assets`, { recursive: true });
fs.copyFileSync(`${src}/favicon.svg`, `${dest}/favicon.svg`);
const routes = {
  "index.html": "/profile/import",
  "agent.html": "/agent",
  "discover.html": "/discover",
  "widget.html": "/widget/create",
  "compose.html": "/introductions/new",
  "inbox.html": "/inbox",
  "widget-preview.html": "/widget/preview",
};
const brand =
  '<a class="v4-brand" href="/" aria-label="SignalPass home"><span class="v4-mark" aria-hidden="true"><i></i><b></b></span><span>SignalPass</span></a>';
const menu = (route) =>
  '<nav class="v4-menu" id="site-navigation" aria-label="Main navigation">' +
  [
    ["/profile/import", "Your profile"],
    ["/agent", "My agent"],
    ["/discover", "Discover"],
    ["/inbox", "Introductions"],
    ["/widget/create", "Your widget"],
  ]
    .map(
      ([href, label]) =>
        `<a href="${href}"${route === href ? ' aria-current="page"' : ""}>${label}</a>`,
    )
    .join("") +
  "</nav>";
const header = (route) =>
  `<header class="site-header v4-header">${brand}<span class="v4-motto">A MORE<br>THOUGHTFUL<br>INTERNET</span>${menu(route)}<button class="v4-menu-toggle" aria-expanded="false" aria-controls="site-navigation" aria-label="Open navigation" type="button"><span></span><span></span></button></header>`;
const footer =
  '<footer class="v4-footer"><a href="/">SignalPass</a><span>More human. More possible.</span><small>Interactive demo · your changes stay on this device</small><a href="/#how-it-works">How it works ↗</a></footer>';
function clean(html, file) {
  html = html
    .replace(
      /<nav\b[^>]*class="(?:mobile-page-nav|prototype-nav)"[^>]*>[\s\S]*?<\/nav>/g,
      "",
    )
    .replace(
      /<header class="site-header[^\"]*">[\s\S]*?<\/header>/,
      header(routes[file]),
    )
    .replace(
      /<title>[\s\S]*?<\/title>/,
      `<title>${{ "index.html": "Your profile", "agent.html": "My agent", "discover.html": "Discover people", "widget.html": "Your profile widget", "compose.html": "A better first hello", "inbox.html": "Your introductions", "widget-preview.html": "Widget preview" }[file]} · SignalPass</title>`,
    )
    .replaceAll('href="styles.css"', 'href="/v4/styles.css"')
    .replaceAll('src="app.js"', 'src="/v4/app.js"')
    .replaceAll('href="favicon.svg"', 'href="/v4/favicon.svg"')
    .replaceAll('src="assets/', 'src="/v4/assets/')
    .replaceAll("url(assets/", "url(/v4/assets/")
    .replaceAll('src="embed/widget.js"', 'src="/v4/embed/widget.js"')
    .replaceAll("Builder exploring", "Curious about")
    .replaceAll("Find aligned builders", "Find your people")
    .replaceAll(
      "BUILDERS<br/>FIND BUILDERS<br/>ON MONAD",
      "A MORE<br/>THOUGHTFUL<br/>INTERNET",
    )
    .replaceAll("Optional verified context", "Optional shared context");
  for (const [from, to] of Object.entries(routes))
    html = html.replaceAll(`href="${from}"`, `href="${to}"`);
  html = html.replace(
    "</head>",
    '<link rel="stylesheet" href="/v4/v4.css"><script defer src="/v4/navigation.js"></script></head>',
  );
  if (file !== "widget-preview.html")
    html = html.replace("</body>", footer + "</body>");
  return html;
}
for (const file of Object.keys(routes))
  fs.writeFileSync(
    `${dest}/${file === "index.html" ? "profile.html" : file}`,
    clean(fs.readFileSync(`${src}/${file}`, "utf8"), file),
  );
fs.copyFileSync(`${src}/styles.css`, `${dest}/styles.css`);
let app = fs
  .readFileSync(`${src}/app.js`, "utf8")
  .replaceAll("'signalpass-prototype-v2'", "'signalpass-v4'")
  .replace(
    "const asset = path => window.SignalPassAssetMap?.[path] || path;",
    "const asset = path => '/v4/' + path;",
  )
  .replace(/  \/\/ Footer-only utilities[\s\S]*?(?=  const adjustStage)/, "");
fs.writeFileSync(`${dest}/app.js`, app);
fs.mkdirSync(`${dest}/embed`, { recursive: true });
fs.copyFileSync(`${src}/embed/widget.js`, `${dest}/embed/widget.js`);
let hero = fs.readFileSync(`${src}/landing.html`, "utf8");
const styles = [...hero.matchAll(/<style>([\s\S]*?)<\/style>/g)]
  .map((m) => m[1])
  .join("\n");
fs.writeFileSync(
  `${dest}/hero.css`,
  styles.replaceAll("url(assets/", "url(/v4/assets/"),
);
hero = hero
  .replace(/<style>[\s\S]*?<\/style>/g, "")
  .replace(/<script>[\s\S]*?<\/script>/g, "")
  .replace(/<section class="review-controls"[\s\S]*?<\/section>/, "")
  .replace(/<dialog[\s\S]*?<\/dialog>/g, "")
  .replace(/<noscript>[\s\S]*?<\/noscript>/g, "")
  .replace(
    /<title>[\s\S]*?<\/title>/,
    "<title>SignalPass — People worth knowing, with context.</title>",
  )
  .replace(
    "A standalone animated hero review.",
    "Your digital counterpart. Your next meaningful connection.",
  )
  .replaceAll('src="assets/', 'src="/v4/assets/')
  .replaceAll('href="assets/', 'href="/v4/assets/')
  .replace(
    /<nav class="nav"[\s\S]*?<\/nav>/,
    '<nav class="nav" aria-label="Main navigation"><a href="#how-it-works">How it works</a><a href="/discover">Discover people</a><a href="/inbox">Introductions</a></nav>',
  )
  .replace(
    'href="#main" aria-label="SignalPass home"',
    'href="/" aria-label="SignalPass home"',
  )
  .replace(
    /<button class="([^"]+)" data-info="(start|works)">([\s\S]*?)<\/button>/g,
    (_, cls, info, body) =>
      `<a class="${cls}" href="${info === "start" ? "/profile/import" : "#how-it-works"}">${body}</a>`,
  )
  .replace(
    "</head>",
    '<link rel="stylesheet" href="/v4/hero.css"><link rel="stylesheet" href="/v4/v4.css"><script defer src="/v4/hero.js"></script></head>',
  )
  .replace("</body>", footer + "</body>");
fs.writeFileSync(`${dest}/index.html`, hero);
console.log(
  "V4 native pages and assets imported. Original references preserved.",
);
