// Mechanical copy/route cleanup for the imported static markup.
import fs from "node:fs";
const root = "apps/web/public/v4";
for (const f of fs.readdirSync(root).filter((f) => f.endsWith(".html"))) {
  let html = fs.readFileSync(`${root}/${f}`, "utf8");
  html = html
    .replaceAll('src="./embed/widget.js"', 'src="/v4/embed/widget.js"')
    .replaceAll("PUBLIC SNAPSHOT v2", "PUBLIC SNAPSHOT")
    .replaceAll("Sign in<svg", "Get started<svg")
    .replaceAll("BUILDER<br/>ON MONAD", "SHARED<br/>CURIOSITY")
    .replaceAll(
      "Only encrypted matching is used to find aligned builders.",
      "Matching uses only the sources you allow.",
    );
  if (f === "widget-preview.html")
    html = html
      .replace(
        "This page demonstrates the real, self-contained widget included in the package.",
        "A preview of the public fields you have chosen to share.",
      )
      .replace(
        "This preview loads only the included script and illustration assets. The button opens the local introduction composer; no live SignalPass service is connected.",
        "Only the information on this card is included in your embed. Your private matching preferences stay private.",
      );
  if (f === "agent.html") {
    html = html
      .replace(
        /(<nav aria-label="Your workspace"[\s\S]*?)href="\/discover"/,
        '$1href="/"',
      )
      .replace(
        /<a class="" href="\/discover">(?:(?!<\/a>)[\s\S])*?<span>Community<\/span><\/a>/,
        "",
      )
      .replace("<span>Settings</span>", "<span>Your widget</span>");
  }
  fs.writeFileSync(`${root}/${f}`, html);
}
const file = `${root}/app.js`;
let js = fs.readFileSync(file, "utf8");
js = js
  .replaceAll(
    "${selectedContact}’s introduction",
    "${contacts[selectedContact]?.name||selectedContact}’s introduction",
  )
  .replaceAll(
    "Ask ${selectedContact} for context",
    "Ask ${contacts[selectedContact]?.name||selectedContact} for context",
  )
  .replaceAll("Builder exploring ${escapeHTML", "Curious about ${escapeHTML");
fs.writeFileSync(file, js);
