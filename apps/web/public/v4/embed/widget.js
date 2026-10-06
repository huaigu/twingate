/* SignalPass / Refined v2 — isolated, native web component preview.
   Deploy this script together with ../assets/. No external requests or tracking.
   data-profile may contain JSON with name, bio, persona, tags and cta.
   All supplied text is inserted with textContent, never as executable HTML. */
(() => {
  "use strict";
  const script = document.currentScript;
  if (!script) return;
  const offline = Boolean(window.SignalPassAssetMap);
  const assetBase = offline ? "" : new URL("../assets/", script.src).href;
  const asset = (name) =>
    window.SignalPassAssetMap?.["assets/" + name] || assetBase + name;
  const targetURL = new URL("/profile/import", script.src).href;
  const base = {
    name: "Alex Chen",
    bio: "Building a more open internet with builders.",
    persona: "alex",
    tags: ["Builders", "Open Source", "Monad", "Product", "Community"],
    cta: "Meet me on SignalPass",
  };
  const initialize = async () => {
    if (window.SignalPass?.ready) await window.SignalPass.ready;
    const host = document.getElementById("signalpass-widget");
    if (!host || host.shadowRoot) return;
    let data = {};
    try {
      if (host.dataset.profile) data = JSON.parse(host.dataset.profile);
      else {
        const api = window.SignalPass;
        const storageKey = api?.live ? "signalpass-v4-draft-" + (api.me?.session.address || "guest") : "signalpass-v4";
        let stored = window.SignalPassMemoryStore?.[storageKey];
        if (!stored && location.pathname === "/widget/preview") {
          try {
            stored = localStorage.getItem(storageKey);
          } catch (_) {}
        }
        data = JSON.parse(stored || "{}").widget || {};
        if (api?.live && !data.name) data = { name: api.me?.settings?.profile.name || "Your name", bio: api.me?.settings?.profile.bio || "Add your profile to preview your card.", tags: api.me?.settings?.agent.interests || [], persona: "none" };
        if (api?.live && api.me?.profile && api.me.settings.agent.visibility !== 'private') data.handle = api.me.profile.handle;
      }
    } catch (_) {
      /* Malformed data falls back to a safe example. */
    }
    const profile = { ...base, ...data };
    const chosen = { alex: "widget", rohan: "rohan", beanie: "beanie" }[
      profile.persona
    ];
    const root = host.attachShadow({ mode: "open" });
    root.innerHTML = `<link rel="stylesheet" href="${new URL("../ui.css?v=aacd955e68f1", script.src).href}"><style>
      :host{display:block;width:100%;max-width:660px;color:#202238;font-family:Arial,sans-serif;container-type:inline-size;container-name:signalpass}
      *{box-sizing:border-box}.card{padding:24px 26px 27px;background:linear-gradient(125deg,#fffbf4ed,#f9f2e8e8),url('${asset("paper-light.webp")}') center/420px;border:1px solid #fffcf7;border-radius:18px;box-shadow:0 14px 30px #58402619,0 2px 6px #58402610}
      header{display:flex;justify-content:space-between;align-items:center;gap:10px;padding-bottom:16px;border-bottom:1px solid #e9e1d6}.brand{font:700 29px/1.2 "Times New Roman",serif;letter-spacing:-1.2px;display:flex;align-items:center;gap:9px;color:#202238}
      .mark{position:relative;width:32px;height:34px;flex:none}.mark:before,.mark:after{content:"";position:absolute;width:18px;height:26px;background:#5162f6;transform:rotate(36deg);border-radius:12px;left:3px;top:1px}.mark:after{width:16px;height:24px;left:15px;top:9px;background:#9266e1}small{font:8px/1.5 monospace;letter-spacing:1.5px;white-space:nowrap;color:#7b6988}
      .body{display:grid;grid-template-columns:214px minmax(0,1fr);align-items:center;gap:24px;margin-top:23px}.portrait{width:214px;height:244px;object-fit:cover;border-radius:50%;box-shadow:0 0 0 4px #fdf9f1}.empty{display:grid;place-items:center;background:#e9e2ed;color:#7b6a86}.empty svg{width:80px;height:80px}
      .content{min-width:0}h2{font:41px/1.12 Georgia,serif;letter-spacing:-1.6px;margin:0 0 9px;overflow-wrap:anywhere}p{font:21px/1.35 Georgia,serif;letter-spacing:-.35px;margin:0;color:#635970;overflow-wrap:anywhere}.tags{display:flex;flex-wrap:wrap;gap:7px;margin-top:16px}.tag{padding:6px 13px;border-radius:99px;font-size:11px;line-height:1.3;background:#ebe3f5;color:#5d4783;overflow-wrap:anywhere;max-width:100%}.tag:nth-child(2){background:#deeee5;color:#3e685b}.tag:nth-child(3){background:#ebe3f5}.tag:nth-child(4){background:#e2e9f8;color:#45577f}.tag:nth-child(5){background:#f8e3d1;color:#805738}
      .btn{box-sizing:border-box;display:flex;width:100%;height:48px;min-height:48px;gap:12px;margin-top:18px;padding-block:0;font:600 14px/1.3 Arial,sans-serif;text-decoration:none;text-align:center}.btn span{font-size:18px;line-height:1}.btn b{font-weight:inherit}
      @container signalpass (max-width:520px){.card{padding:20px}.brand{font-size:25px;gap:4px}small{font-size:6px;letter-spacing:1px}.body{grid-template-columns:102px minmax(0,1fr);gap:15px;align-items:start;margin-top:21px;grid-template-rows:min-content min-content 1fr auto;row-gap:0}.portrait{width:102px;height:122px;grid-column:1;grid-row:1/4}.content{display:contents}.content>:is(h2,p,.tags){grid-column:2}.content>a{grid-column:1/-1;grid-row:4;width:100%;margin-left:0}.empty svg{width:43px;height:43px}h2{font-size:29px;letter-spacing:-1px}p{font-size:17px;line-height:1.4}.tags{gap:5px;margin-top:13px}.tag{font-size:10px;padding:5px 9px}.btn{margin-top:24px}}
      @container signalpass (max-width:340px){.card{padding:18px}.body{grid-template-columns:85px minmax(0,1fr);column-gap:12px}.portrait{width:85px;height:106px}h2{font-size:26px}.brand{font-size:23px}small{font-size:5px}}
      @media(prefers-reduced-motion:reduce){*{scroll-behavior:auto}}
    </style><article class="card" data-theme="signalpass"><header><div class="brand"><i class="mark" aria-hidden="true"></i>SignalPass</div><small>PUBLIC SNAPSHOT v2</small></header><div class="body">${chosen ? `<img class="portrait" alt="Illustrated profile persona" src="${asset("avatar-" + chosen + ".webp")}">` : '<div class="portrait empty" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4"><circle cx="12" cy="7" r="4"/><path d="M3 23v-4a9 9 0 0 1 18 0v4Z"/></svg></div>'}<div class="content"><h2></h2><p></p><div class="tags"></div><a class="btn btn-primary btn-lg"><b></b><span aria-hidden="true">→</span></a></div></div></article>`;
    root.querySelector("h2").textContent = String(
      profile.name || base.name,
    ).slice(0, 45);
    root.querySelector("p").textContent = String(profile.bio || base.bio).slice(
      0,
      110,
    );
    const tags = Array.isArray(profile.tags)
      ? profile.tags.slice(0, 5)
      : base.tags;
    tags.forEach((text) => {
      const span = document.createElement("span");
      span.className = "tag";
      span.textContent = String(text).slice(0, 24);
      root.querySelector(".tags").append(span);
    });
    const link = root.querySelector("a");
    link.href = typeof profile.handle === 'string' && /^[a-z0-9_-]{3,32}$/.test(profile.handle) ? new URL('/introductions/new/' + profile.handle, script.src).href : targetURL;
    link.addEventListener("click", (event) => {
      if (window.SignalPassNavigate) {
        event.preventDefault();
        SignalPassNavigate("compose.html");
      }
    });
    link.querySelector("b").textContent = String(profile.cta || base.cta).slice(
      0,
      40,
    );
  };
  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", initialize, { once: true });
  else initialize();
})();
