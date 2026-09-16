/* SignalPass V4 • Native controls and a persistent, local demonstration flow.
   No external identity, model, messaging or payment service is impersonated. */
(() => {
  "use strict";
  const $ = (q, root = document) => root.querySelector(q);
  const $$ = (q, root = document) => [...root.querySelectorAll(q)];
  const page = document.body.dataset.page;
  const asset = (path) => "/v4/" + path;
  const hydrateImages = (root) =>
    $$('img[src^="assets/"]', root).forEach((img) => {
      img.src = asset(img.getAttribute("src"));
    });
  const storageKey = "signalpass-v4";
  const memoryStore = (window.SignalPassMemoryStore ||= {});
  const store = {
    getItem(key) {
      try {
        const value = localStorage.getItem(key);
        if (value !== null) return value;
      } catch (_) {}
      return memoryStore[key] || null;
    },
    setItem(key, value) {
      memoryStore[key] = value;
      try {
        localStorage.setItem(key, value);
      } catch (_) {}
    },
    removeItem(key) {
      delete memoryStore[key];
      try {
        localStorage.removeItem(key);
      } catch (_) {}
    },
  };
  const defaults = {
    profile: {
      name: "Alex Chen",
      bio: "Builds products at the intersection of people, internet, and creative tech.",
      interests:
        "Onchain social, creator tools, open source, and human–AI collaboration.",
      offer:
        "Product design, frontend development, community building, and feedback on early ideas.",
      meet: "Founders, designers, and curious people exploring social, identity, and the future of the internet.",
    },
    sources: ["github"],
    agent: {
      visibility: "private",
      matching: true,
      sources: ["github", "x"],
      interests: [
        "Open source",
        "Developer tools",
        "Onchain UX",
        "AI x crypto",
        "Community building",
        "Design systems",
        "Public goods",
        "Monadic culture",
      ],
    },
    widget: {
      name: "Alex Chen",
      bio: "Building a more open internet with builders.",
      persona: "alex",
      tags: ["Builders", "Open Source", "Monad", "Product", "Community"],
      cta: "Meet me on SignalPass",
    },
    inbox: {},
    sourceLinks: {},
    introductions: [],
    sharedContext: true,
    profileApproved: false,
  };
  let saved = {};
  try {
    saved = JSON.parse(store.getItem(storageKey) || "{}");
  } catch (_) {
    /* Private/file mode can disallow storage. */
  }
  if (!saved || typeof saved !== "object" || Array.isArray(saved)) saved = {};
  const initial = JSON.parse(JSON.stringify(defaults));
  const state = {
    ...initial,
    ...saved,
    profile: { ...initial.profile, ...saved.profile },
    agent: { ...initial.agent, ...saved.agent },
    widget: { ...initial.widget, ...saved.widget },
    inbox: saved.inbox || {},
  };
  for (const key of ["name", "bio", "interests", "offer", "meet"])
    if (typeof state.profile[key] !== "string")
      state.profile[key] = initial.profile[key];
  for (const key of ["sources", "introductions"])
    if (!Array.isArray(state[key])) state[key] = initial[key];
  for (const key of ["sources", "interests"])
    if (!Array.isArray(state.agent[key])) state.agent[key] = initial.agent[key];
  state.agent.interests = state.agent.interests
    .filter((x) => typeof x === "string")
    .slice(0, 12);
  for (const key of ["name", "bio", "cta", "persona"])
    if (typeof state.widget[key] !== "string")
      state.widget[key] = initial.widget[key];
  if (!Array.isArray(state.widget.tags))
    state.widget.tags = initial.widget.tags;
  state.widget.tags = state.widget.tags
    .filter((x) => typeof x === "string")
    .slice(0, 5);
  if (!state.sourceLinks || typeof state.sourceLinks !== "object")
    state.sourceLinks = {};
  const save = () => {
    try {
      store.setItem(storageKey, JSON.stringify(state));
    } catch (_) {
      /* The UI still works without persistent storage. */
    }
  };
  const escapeHTML = (value) =>
    String(value).replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
  const iconPaths = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    close: '<path d="m6 6 12 12M6 18 18 6"/>',
    arrow: '<path d="M4 12h15M13 5l7 7-7 7"/>',
  };
  const icon = (name) =>
    `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${iconPaths[name] || iconPaths.arrow}</svg>`;
  const scaleScene = () => {
    const width = document.documentElement.clientWidth;
    document.documentElement.style.setProperty(
      "--scale",
      width <= 1180 ? "1" : String(Math.min(width, 1800) / 1648),
    );
  };
  scaleScene();
  window.addEventListener("resize", scaleScene, { passive: true });
  window.addEventListener("pageshow", scaleScene);
  let toastTimer;
  const toast = (text) => {
    const el = $("#toast");
    el.textContent = text;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 4200);
  };
  const dialog = $("#app-dialog");
  let previousFocus;
  const openDialog = (title, content, onReady) => {
    if (dialog.open) dialog.close();
    previousFocus = document.activeElement;
    $("#dialog-content").innerHTML =
      `<h2 id="dialog-title">${escapeHTML(title)}</h2>${content}`;
    hydrateImages($("#dialog-content"));
    dialog.showModal();
    onReady?.($("#dialog-content"));
    requestAnimationFrame(() => {
      const el = $("[autofocus]", dialog);
      if (el) el.focus();
    });
  };
  const closeDialog = () => dialog.close();
  dialog.addEventListener("close", () => {
    if (previousFocus?.isConnected) previousFocus.focus();
  });
  dialog.addEventListener("click", (e) => {
    if (e.target !== dialog) return;
    const r = dialog.getBoundingClientRect();
    if (
      e.clientX < r.left ||
      e.clientX > r.right ||
      e.clientY < r.top ||
      e.clientY > r.bottom
    )
      closeDialog();
  });
  const notice = (text) => `<p class="dialog-notice">${text}</p>`;
  const buttons = (label, id = "dialog-confirm", other = "Cancel") =>
    `<div class="dialog-actions"><button type="button" class="button outline" data-close-dialog>${other}</button><button type="button" class="button primary" id="${id}">${label}</button></div>`;
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-close-dialog]")) closeDialog();
  });
  const addTextDialog = (title, label, placeholder, callback) =>
    openDialog(
      title,
      `<form id="add-text-form"><label class="dialog-field" for="add-text">${label}</label><input class="dialog-input" id="add-text" maxlength="38" required placeholder="${escapeHTML(placeholder)}" autofocus><div class="dialog-actions"><button type="button" class="button outline" data-close-dialog>Cancel</button><button type="submit" class="button primary">Add interest</button></div></form>`,
      (root) =>
        $("#add-text-form", root).addEventListener("submit", (e) => {
          e.preventDefault();
          const text = $("#add-text", root).value.trim();
          if (!text) return;
          if (callback(text) !== false) closeDialog();
        }),
    );

  // 01 — All draft fields are live text, not part of an image.
  const updateProfile = () => {
    $$("[data-profile]").forEach((el) => {
      const v = state.profile[el.dataset.profile];
      if (v) el.textContent = v;
    });
  };
  const editProfile = (field) => {
    const fields =
      field === "profile"
        ? [
            ["name", "Name"],
            ["bio", "Profile introduction"],
          ]
        : [
            [
              field,
              {
                interests: "Current interests",
                offer: "Can offer",
                meet: "Wants to meet",
              }[field] || field,
            ],
          ];
    openDialog(
      "Edit your draft",
      `<form id="edit-profile-form">${fields.map(([key, label]) => `<label class="dialog-field" for="edit-${key}">${label}</label>${key === "name" ? `<input class="dialog-input" id="edit-${key}" name="${key}" maxlength="45" required value="${escapeHTML(state.profile[key] || "")}" autofocus>` : `<textarea class="dialog-input" id="edit-${key}" name="${key}" maxlength="240" required>${escapeHTML(state.profile[key] || "")}</textarea>`}`).join("")}${notice("You control what to share. Changes are saved in this browser only.")}<div class="dialog-actions"><button type="button" class="button outline" data-close-dialog>Cancel</button><button type="submit" class="button primary">Save changes</button></div></form>`,
      (root) => {
        $("#edit-profile-form", root).addEventListener("submit", (e) => {
          e.preventDefault();
          if (fields.some(([key]) => !$(`[name="${key}"]`, root).value.trim()))
            return toast("Please add a little context before saving.");
          fields.forEach(
            ([key]) =>
              (state.profile[key] = $(`[name="${key}"]`, root).value.trim()),
          );
          state.profileApproved = false;
          save();
          updateProfile();
          closeDialog();
          toast("Your draft is saved. Review it when you’re ready.");
        });
      },
    );
  };
  if (page === "sources") {
    if (saved.profile) updateProfile();
    const setSourceButton = (el) => {
      const selected = state.sources.includes(el.dataset.source);
      el.classList.toggle("selected", selected);
      el.setAttribute("aria-pressed", String(selected));
      $(".source-check", el).innerHTML = icon(selected ? "check" : "plus");
      const chip = $(`[data-source-chip="${el.dataset.source}"]`);
      if (chip) {
        chip.classList.toggle("is-selected", selected);
        chip.title = selected
          ? "Selected for this local draft"
          : "Not selected";
      }
    };
    $$("[data-source]").forEach((el) => {
      setSourceButton(el);
      el.addEventListener("click", () => {
        const source = el.dataset.source;
        if (source === "agent") {
          openDialog(
            "Bring your own agent",
            `<p class="dialog-copy">Ask your agent to prepare your profile, then paste its JSON draft here. You’ll review every field.</p><form id="agent-import-form"><label class="dialog-field" for="agent-json">Profile JSON</label><textarea class="dialog-input" id="agent-json" rows="7" required maxlength="12000" placeholder='{"name":"Alex","bio":"A little about me","interests":"...","offer":"...","meet":"..."}'></textarea><p class="dialog-copy" id="import-error" role="alert"></p><div class="dialog-actions"><button type="button" class="button outline" data-close-dialog>Cancel</button><button class="button primary" type="submit">Import draft</button></div></form>`,
            (root) =>
              $("#agent-import-form", root).addEventListener(
                "submit",
                (event) => {
                  event.preventDefault();
                  try {
                    const draft = JSON.parse($("#agent-json", root).value);
                    if (
                      !draft ||
                      Array.isArray(draft) ||
                      typeof draft !== "object" ||
                      !["name", "bio", "interests", "offer", "meet"].some(
                        (k) => typeof draft[k] === "string" && draft[k].trim(),
                      )
                    )
                      throw Error(
                        "Include at least one profile field: name, bio, interests, offer or meet.",
                      );
                    for (const k of [
                      "name",
                      "bio",
                      "interests",
                      "offer",
                      "meet",
                    ])
                      if (typeof draft[k] === "string" && draft[k].trim())
                        state.profile[k] = draft[k]
                          .trim()
                          .slice(0, k === "name" ? 45 : 240);
                    if (!state.sources.includes(source))
                      state.sources.push(source);
                    state.profileApproved = false;
                    save();
                    updateProfile();
                    setSourceButton(el);
                    closeDialog();
                    toast("Agent draft imported. Nothing is published yet.");
                  } catch (error) {
                    $("#import-error", root).textContent =
                      error instanceof SyntaxError
                        ? "This isn’t valid JSON yet. Check quotation marks and commas."
                        : error.message;
                  }
                },
              ),
          );
          return;
        }
        openDialog(
          `Add ${source === "github" ? "GitHub" : source === "x" ? "Twitter / X" : "your website"}`,
          `<p class="dialog-copy">Save a public source for your profile. This demo stores the link; it does not fetch or verify the account.</p><form id="source-form"><label class="dialog-field" for="source-url">Public URL</label><input type="url" class="dialog-input" id="source-url" required autofocus maxlength="500" value="${escapeHTML(state.sourceLinks[source] || "")}" placeholder="${source === "github" ? "https://github.com/yourname" : source === "x" ? "https://x.com/yourname" : "https://your-site.com"}"><p id="source-error" class="dialog-copy" role="alert"></p><div class="dialog-actions"><button class="button outline" id="remove-source" type="button">Remove source</button><button class="button primary" type="submit">Save source</button></div></form>`,
          (root) => {
            $("#source-form", root).addEventListener("submit", (event) => {
              event.preventDefault();
              const url = new URL($("#source-url", root).value);
              const allowed =
                source === "github"
                  ? ["github.com", "www.github.com"]
                  : source === "x"
                    ? ["x.com", "www.x.com", "twitter.com", "www.twitter.com"]
                    : null;
              if (
                !["https:", "http:"].includes(url.protocol) ||
                url.username ||
                url.password ||
                (allowed && !allowed.includes(url.hostname))
              ) {
                $("#source-error", root).textContent =
                  "Use a public HTTP or HTTPS URL on the selected service.";
                return;
              }
              state.sourceLinks[source] = url.href;
              if (!state.sources.includes(source)) state.sources.push(source);
              save();
              setSourceButton(el);
              closeDialog();
              toast("Source saved. You can edit your profile draft.");
            });
            $("#remove-source", root).addEventListener("click", () => {
              state.sources = state.sources.filter((s) => s !== source);
              delete state.sourceLinks[source];
              save();
              setSourceButton(el);
              closeDialog();
            });
          },
        );
      });
    });
    $$("[data-edit]").forEach((el) =>
      el.addEventListener("click", () => editProfile(el.dataset.edit)),
    );
  }

  // 02 — Privacy and matching are local preference controls, not cryptography.
  const interestTag = (text) =>
    `<span class="interest-tag">${escapeHTML(text)}<button type="button" data-remove-interest aria-label="Remove ${escapeHTML(text)}">${icon("close")}</button></span>`;
  const updateMiniProfile = () => {
    const mini = $(".mini-profile");
    if (!mini) return;
    $("h3", mini).textContent = state.profile.name;
    $("p", mini).textContent =
      "Curious about " +
      state.agent.interests.slice(0, 3).join(", ").toLowerCase() +
      ".";
    const tags = $(":scope > div > div", mini);
    if (tags)
      tags.innerHTML = state.agent.interests
        .slice(0, 3)
        .map((t) => `<span class="chip">${escapeHTML(t)}</span>`)
        .join("");
  };
  const renderInterests = () => {
    updateMiniProfile();
    const list = $("[data-interest-list]");
    if (!list) return;
    list.innerHTML =
      state.agent.interests.map(interestTag).join("") +
      `<button class="add-tag" data-add-interest type="button">${icon("plus")}Add interest</button>`;
  };
  if (page === "agent") {
    renderInterests();
    $$("[name=visibility]").forEach((el) => {
      el.checked = el.value === state.agent.visibility;
      el.closest(".visibility-card").classList.toggle("selected", el.checked);
      el.addEventListener("change", () => {
        state.agent.visibility = el.value;
        save();
        $$(".visibility-card").forEach((card) =>
          card.classList.toggle("selected", $("input", card).checked),
        );
        $(".public-profile-preview .section-heading p").textContent =
          el.value === "private"
            ? "This preview is hidden from the public. Private matching can stay on."
            : el.value === "limited"
              ? "Visible only to people you match with or choose."
              : "This snapshot will be visible in the SignalPass community.";
      });
    });

    $(".public-profile-preview .section-heading p").textContent =
      state.agent.visibility === "private"
        ? "Only you can see this preview while your profile is private."
        : state.agent.visibility === "limited"
          ? "Visible only to people you match with or choose."
          : "This snapshot is visible in the example community.";
    const toggle = $("#matching-toggle");
    toggle.checked = state.agent.matching;
    const setToggle = () => {
      $("[data-toggle-label]").textContent = toggle.checked ? "On" : "Off";
      $(".matching-settings").classList.toggle(
        "matching-paused",
        !toggle.checked,
      );
    };
    setToggle();
    toggle.addEventListener("change", () => {
      state.agent.matching = toggle.checked;
      save();
      setToggle();
      toast(
        toggle.checked
          ? "Matching is on. You decide who to meet."
          : "Matching paused. Your profile settings are unchanged.",
      );
    });
    $$("[name=data-source]").forEach((el) => {
      el.checked = state.agent.sources.includes(el.value);
      el.addEventListener("change", () => {
        state.agent.sources = $$("[name=data-source]:checked").map(
          (i) => i.value,
        );
        save();
      });
    });
    document.addEventListener("click", (e) => {
      const remove = e.target.closest("[data-remove-interest]");
      if (remove) {
        const tag = remove.closest(".interest-tag");
        const label = tag.firstChild.textContent.trim();
        state.agent.interests = state.agent.interests.filter(
          (s) => s !== label,
        );
        save();
        renderInterests();
      }
      if (e.target.closest("[data-add-interest]")) {
        if (state.agent.interests.length >= 12)
          return toast("Keep up to 12 interests so the profile stays focused.");
        addTextDialog(
          "Add a curiosity",
          "What are you interested in?",
          "e.g. Creative coding",
          (value) => {
            if (
              state.agent.interests.some(
                (s) => s.toLowerCase() === value.toLowerCase(),
              )
            ) {
              toast("That interest is already in your profile.");
              return false;
            }
            state.agent.interests.push(value);
            save();
            renderInterests();
          },
        );
      }
    });
  }

  // 03 — A small deterministic example directory. No model or API is called.
  const directory = [
    {
      name: "Maya",
      avatar: "maya",
      role: "Product designer & community builder",
      tags: ["Design", "Communities", "Open Source"],
      description:
        "Interested in building more human social tools, with a complementary product and community perspective.",
    },
    {
      name: "Rohan",
      avatar: "rohan",
      role: "Protocol engineer & educator",
      tags: ["Infrastructure", "Education", "Monad"],
      description:
        "Curious about open internet infrastructure, technical learning, and collaborating across product and protocol design.",
    },
    {
      name: "Leo",
      avatar: "leo",
      role: "Creator & researcher",
      tags: ["Content", "Research", "Onchain Culture"],
      description:
        "Exploring creator economies, onchain culture, and the intersection of research and storytelling.",
    },
  ];
  const showPerson = (name) => {
    const p = directory.find((p) => p.name === name);
    if (!p) return;
    openDialog(
      `Meet ${p.name}`,
      `<img class="avatar dialog-avatar" src="assets/avatar-${p.avatar}.webp" alt="${p.name} illustrated avatar"><p class="dialog-copy">${p.role}</p><div class="dialog-tags">${p.tags.map((t) => `<span class="chip">${t}</span>`).join("")}</div><p class="dialog-copy">${p.description}</p>${notice("An example suggestion, not a ranking. No one has been contacted.")}<div class="dialog-actions"><button class="button outline" type="button" data-close-dialog>Keep exploring</button><a class="button primary" href="/introductions/new/${p.name.toLowerCase()}">Draft an introduction ${icon("arrow")}</a></div>`,
    );
  };
  if (page === "discover") {
    if (!state.agent.matching) {
      $(".discovery-private h3").textContent = "Private matching is paused";
      $(".discovery-private p").textContent =
        "You can still browse example profiles";
    }
    let goal = state.discoveryGoal || "";
    $("#curiosity").value = state.discoveryQuery || "";
    $$("[data-discovery-goal]").forEach((el) =>
      el.setAttribute(
        "aria-pressed",
        String(el.dataset.discoveryGoal === goal),
      ),
    );
    $$("[data-discovery-goal]").forEach((el) =>
      el.addEventListener("click", () => {
        goal = el.dataset.discoveryGoal;
        $$("[data-discovery-goal]").forEach((b) =>
          b.setAttribute("aria-pressed", String(b === el)),
        );
      }),
    );
    $$("[data-person]").forEach((card) => {
      card.addEventListener("click", () => showPerson(card.dataset.person));
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          showPerson(card.dataset.person);
        }
      });
    });
    $("#discovery-form").addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!state.agent.matching)
        return openDialog(
          "Matching is paused",
          '<p class="dialog-copy">You can browse people now, or turn on matching to try suggestions. Your profile can stay private.</p><div class="dialog-actions"><button class="button outline" data-close-dialog>Keep browsing</button><a class="button primary" href="/agent">Matching settings</a></div>',
        );
      const submit = $("#discovery-form [type=submit]");
      submit.disabled = true;
      const label = submit.innerHTML;
      submit.textContent = "Finding shared interests…";
      $(".people-grid").setAttribute("aria-busy", "true");
      await new Promise((resolve) => setTimeout(resolve, 350));
      const query = $("#curiosity").value.trim().toLowerCase();
      state.discoveryQuery = $("#curiosity").value.trim();
      state.discoveryGoal = goal;
      save();
      const synonyms = query
        .replace(/zk|blockchain/g, "infrastructure")
        .replace(/partner|collaborat/g, "design")
        .replace(/creators/g, "creator");
      const words = synonyms.split(/\s+/).filter((w) => w.length > 2);
      const scores = directory
        .map((p) => {
          const text =
            `${p.name} ${p.role} ${p.tags.join(" ")} ${p.description}`.toLowerCase();
          let score = words.reduce((s, w) => s + Number(text.includes(w)), 0);
          if (goal === "learn" && p.name === "Rohan") score += 2;
          if (goal === "collaborate" && p.name === "Maya") score++;
          return { name: p.name, score };
        })
        .sort((a, b) => b.score - a.score);
      const noMatch = Boolean(query) && scores.every((p) => p.score === 0);
      scores.forEach((p, i) => {
        const card = $(`[data-person="${p.name}"]`);
        card.style.order = String(i);
        card.hidden = noMatch;
      });
      $(".v4-empty")?.remove();
      if (noMatch)
        $(".people-grid").insertAdjacentHTML(
          "beforeend",
          '<div class="v4-empty"><h3>No close matches yet</h3><p>Try design, community, research or learning — or clear the search to explore everyone.</p><button type="button" class="button outline" id="clear-search">Explore everyone</button></div>',
        );
      $("#clear-search")?.addEventListener("click", () => {
        $("#curiosity").value = "";
        $("#discovery-form").requestSubmit();
      });
      $(".search-result-note").textContent = noMatch
        ? "No match in the sample community."
        : query || goal
          ? `Suggestions based on shared interests${goal ? ` · ${goal}` : ""}. Sample community; no one has been contacted.`
          : "A few people to be curious about. Choose a goal or explore at your own pace.";
      submit.disabled = false;
      submit.innerHTML = label;
      $(".people-grid").setAttribute("aria-busy", "false");
    });
    const requested = decodeURIComponent(
      location.pathname.split("/")[2] ||
        new URLSearchParams(location.search).get("person") ||
        "",
    );
    const person = directory.find(
      (p) => p.name.toLowerCase() === requested.toLowerCase(),
    );
    if (person) showPerson(person.name);
  }

  // 04 — Live widget editor + copyable, locally runnable embed.
  const tagColors = ["blue", "lavender", "purple", "blue", "peach"];
  const widgetAvatar = (p) =>
    p === "alex" ? "widget" : p === "none" ? null : p;
  const renderWidget = () => {
    const w = state.widget;
    $("[data-live-name]").textContent = w.name || "Your name";
    $("[data-live-bio]").textContent = w.bio || "A little about you.";
    $("[data-live-cta]").textContent = w.cta;
    $("[data-live-tags]").innerHTML = w.tags
      .map(
        (t, i) =>
          `<span class="chip ${i === 0 ? "lavender" : i === 1 ? "mint" : tagColors[i % 5]}">${escapeHTML(t)}</span>`,
      )
      .join("");
    $("[data-widget-tags]").innerHTML =
      w.tags
        .map(
          (t, i) =>
            `<span class="widget-tag ${tagColors[i % 5]}">${escapeHTML(t)}<button type="button" data-remove-widget-tag aria-label="Remove ${escapeHTML(t)}">${icon("close")}</button></span>`,
        )
        .join("") +
      `<button class="add-tag" type="button" data-add-widget-tag>${icon("plus")}Add interest</button>`;
    $$("[data-persona]").forEach((el) => {
      const selected = el.dataset.persona === w.persona;
      el.classList.toggle("selected", selected);
      el.setAttribute("aria-pressed", String(selected));
    });
    const img = $(".widget-profile-image .avatar");
    const avatar = widgetAvatar(w.persona);
    img.hidden = !avatar;
    $(".empty-persona").hidden = Boolean(avatar);
    if (avatar) img.src = asset(`assets/avatar-${avatar}.webp`);
    $("[data-live-name]").style.fontSize =
      w.name.length > 24 ? (innerWidth <= 1180 ? "25px" : "36px") : "";
    const attrs = `data-profile='${JSON.stringify(w).replace(/&/g, "&amp;").replace(/'/g, "&#39;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}'`;
    $("#embed-code").textContent =
      `<div id="signalpass-widget" ${attrs}></div>\n<script src="${location.origin}/v4/embed/widget.js" defer><\/script>`;
    save();
  };
  if (page === "widget") {
    if (!saved.widgetEdited && state.profileApproved) {
      state.widget.name = state.profile.name;
      state.widget.bio = state.profile.bio.slice(0, 110);
      state.widget.tags = state.agent.interests.slice(0, 5);
    }
    $("#widget-name").value = state.widget.name;
    $("#widget-bio").value = state.widget.bio;
    $("#widget-cta").value = state.widget.cta;
    renderWidget();
    $("#widget-form").addEventListener("submit", (e) => e.preventDefault());
    $("#widget-name").addEventListener("input", (e) => {
      state.widget.name = e.target.value;
      state.widgetEdited = true;
      renderWidget();
    });
    $("#widget-bio").addEventListener("input", (e) => {
      state.widget.bio = e.target.value;
      state.widgetEdited = true;
      renderWidget();
    });
    $("#widget-cta").addEventListener("change", (e) => {
      state.widget.cta = e.target.value;
      state.widgetEdited = true;
      renderWidget();
    });
    $$("[data-persona]").forEach((el) =>
      el.addEventListener("click", () => {
        state.widget.persona = el.dataset.persona;
        state.widgetEdited = true;
        renderWidget();
      }),
    );
    document.addEventListener("click", (e) => {
      const remove = e.target.closest("[data-remove-widget-tag]");
      if (remove) {
        const label = remove
          .closest(".widget-tag")
          .firstChild.textContent.trim();
        state.widget.tags = state.widget.tags.filter((t) => t !== label);
        state.widgetEdited = true;
        renderWidget();
      }
      if (e.target.closest("[data-add-widget-tag]")) {
        if (state.widget.tags.length >= 5)
          return toast(
            "Use up to five public interests. Remove one first to add another.",
          );
        addTextDialog(
          "Add a public interest",
          "Interest shown on your widget",
          "e.g. Creative coding",
          (text) => {
            if (
              state.widget.tags.some(
                (t) => t.toLowerCase() === text.toLowerCase(),
              )
            ) {
              toast("That interest is already on your widget.");
              return false;
            }
            if (text.length > 24) {
              toast("Use 24 characters or fewer for a widget tag.");
              return false;
            }
            state.widget.tags.push(text);
            state.widgetEdited = true;
            renderWidget();
          },
        );
      }
    });
  }
  const copyEmbed = async () => {
    const text = $("#embed-code")?.textContent;
    if (!text) return;
    try {
      if (navigator.clipboard && window.isSecureContext)
        await navigator.clipboard.writeText(text);
      else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.cssText = "position:fixed;left:-9999px;top:0";
        document.body.append(ta);
        ta.select();
        const ok = document.execCommand("copy");
        ta.remove();
        if (!ok) throw new Error("clipboard unavailable");
      }
      toast(
        "Widget embed copied. It contains only the fields in this preview.",
      );
    } catch (_) {
      openDialog(
        "Copy your embed",
        `<p class="dialog-copy">Automatic clipboard access is unavailable. Select and copy this code.</p><textarea class="dialog-input" readonly id="manual-copy">${escapeHTML(text)}</textarea>${notice("The script is local to this package. Upload the embed and assets folders alongside your site.")}`,
        (root) => {
          $("#manual-copy", root).focus();
          $("#manual-copy", root).select();
        },
      );
    }
  };

  // 05 — Keep recipient identity, the editable draft and the receipt connected.
  const requestedPerson = decodeURIComponent(
    location.pathname.split("/")[3] ||
      new URLSearchParams(location.search).get("person") ||
      "",
  );
  const candidate =
    directory.find(
      (p) => p.name.toLowerCase() === requestedPerson.toLowerCase(),
    ) ||
    directory.find((p) => p.name === saved.draft?.person) ||
    directory[1];
  const persistDraft = () => {
    const previous =
      state.draft?.person === candidate.name && state.draft.status !== "sent"
        ? state.draft
        : {};
    state.draft = {
      ...previous,
      id: previous.id || crypto.randomUUID(),
      person: candidate.name,
      avatar: candidate.avatar,
      fields: $$(".intro-field textarea").map((el) => el.value),
      goal: $("[name=intro-goal]:checked")?.value || "chat",
      status: "draft",
    };
    save();
  };
  if (page === "compose") {
    $("#intro-form").addEventListener("submit", (e) => e.preventDefault());
    const setStep = (n) =>
      $$(".compose-steps li").forEach((el, i) =>
        el.classList.toggle("active", i === n - 1),
      );
    setStep(2);
    $$("[name=intro-goal]").forEach((el) =>
      el.addEventListener("change", () => {
        $$(".compose-goal").forEach((goal) =>
          goal.classList.toggle("selected", $("input", goal).checked),
        );
        setStep(2);
      }),
    );
    $$(".intro-field textarea").forEach((el) =>
      el.addEventListener("input", () => {
        setStep(2);
        persistDraft();
      }),
    );
    $$("[name=intro-goal]").forEach((el) =>
      el.addEventListener("change", persistDraft),
    );
    $(".intro-portrait.them h3").textContent = candidate.name;
    $(".intro-portrait.them .avatar").src = asset(
      `assets/avatar-${candidate.avatar}.webp`,
    );
    $(".intro-portrait.them p").textContent = candidate.role;
    $(".intro-portrait.you p").textContent = state.profile.name;
    $(".shared-curiosity p").textContent = candidate.tags
      .slice(0, 2)
      .join(" & ");
    const setOffer = (element, label) => {
      const graphic = element.querySelector("svg");
      element.replaceChildren();
      if (graphic) element.append(graphic);
      element.append(document.createTextNode(label));
    };
    $$(".intro-offers>div:last-child li").forEach((el, i) => {
      setOffer(el, candidate.tags[i] || candidate.role);
    });
    $$(".intro-offers>div:first-child li").forEach((el, i) => {
      setOffer(
        el,
        state.profile.offer.split(",").map((s) => s.trim())[i] ||
          state.agent.interests[i] ||
          "A new perspective",
      );
    });
    if (
      saved.draft?.person === candidate.name &&
      Array.isArray(saved.draft.fields)
    ) {
      $$(".intro-field textarea").forEach((el, i) => {
        el.value = saved.draft.fields[i] || el.value;
      });
      if (saved.draft.goal) {
        const radio = $(`[name=intro-goal][value="${saved.draft.goal}"]`);
        if (radio) {
          radio.checked = true;
          $$(".compose-goal").forEach((g) =>
            g.classList.toggle("selected", $("input", g).checked),
          );
        }
      }
    } else {
      const fields = [
        `Hi ${candidate.name}, your interest in ${candidate.tags[0].toLowerCase()} caught my attention.`,
        `I’d love to exchange ideas about ${candidate.tags[1].toLowerCase()} and hear what you’re exploring.`,
        state.profile.offer,
        `Would you be open to a short conversation? No agenda — just a shared curiosity.`,
      ];
      $$(".intro-field textarea").forEach((el, i) => (el.value = fields[i]));
    }
    const showContext = () => {
      $(".verified-context-inner>p").textContent = state.sharedContext
        ? "Include your approved profile and the public interests shown on this card."
        : "Only your introduction message will be shared.";
      $("[data-action=toggle-context]").textContent = state.sharedContext
        ? "Review context"
        : "Add context";
    };
    showContext();
    persistDraft();
  }
  const reviewIntroduction = () => {
    const fields = $$(".intro-field textarea").map((el) => el.value.trim());
    if (fields.some((t) => !t))
      return toast("Complete all four introduction fields before reviewing.");
    const goal = $("[name=intro-goal]:checked").value;
    const oldId = state.draft?.id;
    state.draft = {
      fields,
      goal,
      person: candidate.name,
      avatar: candidate.avatar,
      status: "draft",
      id: oldId,
    };
    save();
    $$(".compose-steps li").forEach((el, i) =>
      el.classList.toggle("active", i === 2),
    );
    openDialog(
      `Introduce yourself to ${candidate.name}`,
      `<p class="dialog-copy">Your goal: <strong>${escapeHTML(goal)}</strong>. Review what the other person will see.</p><div class="draft-message">${escapeHTML(fields.join("\n\n"))}</div><p class="dialog-copy">Shared context: ${state.sharedContext ? "your approved profile and selected interests" : "introduction message only"}.</p>${notice("Demo delivery: creates a record on this device and lets you try the recipient’s response. No external message or payment.")} ${buttons("Confirm introduction")}`,
      (root) =>
        $("#dialog-confirm", root).addEventListener("click", () => {
          $("#dialog-confirm", root).disabled = true;
          const id = oldId || crypto.randomUUID();
          const existing = state.introductions.find((item) => item.id === id);
          const record = existing || {
            id,
            recipient: candidate.name,
            recipientAvatar: candidate.avatar,
            sender: state.profile.name,
            senderBio: state.sharedContext ? state.profile.bio : "",
            fields,
            goal,
            status: "pending",
            createdAt: new Date().toISOString(),
            sharedContext: state.sharedContext,
            interests: state.sharedContext ? [...state.agent.interests] : [],
          };
          if (!existing) state.introductions.push(record);
          state.draft = { ...state.draft, id, status: "sent" };
          save();
          location.href = `/introductions/${id}/receipt`;
        }),
    );
  };

  // 06 — Recipient inbox, filtering, selection and local status changes.
  const contacts = {
    Alex: {
      avatar: "rohan",
      role: "Product builder",
      topic: "Curious about distributed teams",
      curiosity:
        "You’re both exploring how smaller, more open teams can build meaningful products.",
      practice:
        "Alex brings product experience; you bring a community lens. Different angles, shared goals.",
    },
    Sam: {
      avatar: "sam",
      role: "Researcher",
      topic: "Exploring onchain coordination",
      curiosity:
        "You’re both curious about how online communities coordinate and make decisions.",
      practice:
        "Sam brings a research perspective; you bring practical community experience.",
    },
    Jordan: {
      avatar: "jordan",
      role: "Developer",
      topic: "Interested in creator tools",
      curiosity:
        "You’re both exploring better tools for independent creators and collaborative teams.",
      practice:
        "Jordan brings development experience; you bring product and community insights.",
    },
    Taylor: {
      avatar: "taylor",
      role: "Designer",
      topic: "Shared event interest",
      curiosity:
        "You share an interest in thoughtful events and design-led online communities.",
      practice:
        "Taylor brings a visual design perspective; you bring community experience.",
    },
    Priya: {
      avatar: "priya",
      role: "Community builder",
      topic: "Exploring governance models",
      curiosity:
        "You’re both exploring participatory communities and open governance.",
      practice:
        "Priya brings governance experience; you bring a complementary product lens.",
    },
  };
  let selectedContact = "Alex";
  const selectContact = (name) => {
    const c = contacts[name];
    if (!c) return;
    selectedContact = name;
    $$("[data-contact]").forEach((el) => {
      const selected = el.dataset.contact === name;
      el.classList.toggle("selected", selected);
      el.setAttribute("aria-pressed", String(selected));
    });
    $("[data-contact-name]").textContent = c.name || name;
    $("[data-contact-role]").textContent = c.role;
    $("[data-contact-topic]").textContent = c.topic;
    $("[data-contact-curiosity]").textContent = c.curiosity;
    $("[data-contact-practice]").textContent = c.practice;
    $(".connection-person.sender .avatar").src = asset(
      `assets/avatar-${c.avatar}.webp`,
    );
    $(".inbox-note-alex").style.visibility =
      name === "Alex" ? "visible" : "hidden";
    const status = state.inbox[name]?.status;
    const statusEl = $(".inbox-action-status");
    statusEl.hidden = !status;
    if (status) statusEl.textContent = `${status} · saved on this device`;
    $("[data-action=accept-introduction]").textContent =
      status === "Accepted" ? "Accepted ✓" : "Accept introduction";
    const terminal = ["Accepted", "Declined"].includes(status);
    $$(
      "[data-action=accept-introduction],[data-action=decline-introduction],[data-action=ask-context]",
    ).forEach((button) => (button.disabled = terminal));
    const recipient = $(".connection-person.recipient");
    $("h2", recipient).textContent = c.record?.recipient || state.profile.name;
    $(".avatar", recipient).src = asset(
      `assets/avatar-${c.record?.recipientAvatar || "alex"}.webp`,
    );
    $("p", recipient).textContent = c.record
      ? "Recipient preview"
      : "You decide";
    $("p:last-child", recipient).textContent = c.record
      ? "Try the other side of your introduction"
      : state.agent.interests.slice(0, 2).join(" · ");
    $(".v4-result-message")?.remove();
    if (c.record) {
      const message = document.createElement("div");
      message.className = "v4-result-message";
      const title = document.createElement("strong");
      title.textContent = "The introduction you approved";
      const copy = document.createElement("p");
      copy.textContent = c.record.fields.join("\n\n");
      const link = document.createElement("a");
      link.className = "v4-continue";
      link.href = `/introductions/${c.record.id}/receipt`;
      link.textContent = "View receipt →";
      message.append(title, copy);
      if (c.record.reply) {
        const reply = document.createElement("p");
        reply.textContent = `Additional context: ${c.record.reply}`;
        message.append(reply);
      }
      message.append(link);
      $(".connection-privacy").before(message);
    }
    if (state.inbox[name]?.question) {
      const q = document.createElement("p");
      q.className = "dialog-copy";
      q.textContent = `Requested context: ${state.inbox[name].question}`;
      statusEl.append(q);
    }
  };
  if (page === "inbox") {
    const items = state.introductions.filter(
      (r) =>
        r &&
        typeof r.id === "string" &&
        /^[a-zA-Z0-9-]+$/.test(r.id) &&
        Array.isArray(r.fields),
    );
    items.forEach((record) => {
      const key = "sent-" + record.id;
      contacts[key] = {
        name: record.sender,
        avatar: "alex",
        role: "Your introduction",
        topic: `To ${record.recipient} · ${record.goal}`,
        curiosity: record.sharedContext
          ? record.interests.join(", ")
          : "Only the approved introduction message is shared.",
        practice: record.fields[2],
        record,
      };
      if (record.status !== "pending")
        state.inbox[key] = {
          ...state.inbox[key],
          status: {
            accepted: "Accepted",
            declined: "Declined",
            context_requested: "Context requested",
          }[record.status],
        };
      else delete state.inbox[key];
      const row = document.createElement("button");
      row.type = "button";
      row.className = "inbox-row";
      row.dataset.contact = key;
      row.dataset.group =
        record.status === "context_requested" ? "waiting" : "needs";
      row.setAttribute("aria-pressed", "false");
      row.setAttribute("aria-controls", "introduction-detail");
      row.innerHTML = `<img class="avatar" src="${asset("assets/avatar-alex.webp")}" alt=""><span class="inbox-person-info"><strong>${escapeHTML(record.sender)}</strong><span>To ${escapeHTML(record.recipient)} · ${escapeHTML(record.goal)}</span></span><time>Just now</time>${icon("arrow")}`;
      $(".inbox-rows").prepend(row);
    });
    const all = $("[data-inbox-tab=needs] span");
    if (all) all.textContent = String($$("[data-contact]").length);
    const waiting = $("[data-inbox-tab=waiting] span");
    if (waiting)
      waiting.textContent = String($$(".inbox-row[data-group=waiting]").length);
    $$("[data-contact]").forEach((el) =>
      el.addEventListener("click", () => selectContact(el.dataset.contact)),
    );
    $$("[data-inbox-tab]").forEach((el) =>
      el.addEventListener("click", () => {
        const tab = el.dataset.inboxTab;
        $$("[data-inbox-tab]").forEach((b) => {
          b.classList.toggle("active", b === el);
          b.setAttribute("aria-selected", String(b === el));
        });
        $$(".inbox-rows>[data-group]").forEach((row) => {
          row.hidden = tab !== "needs" && row.dataset.group !== tab;
        });
        const first = $(".inbox-row:not([hidden])");
        $(".inbox-empty").hidden = Boolean(first);
        if (first) selectContact(first.dataset.contact);
      }),
    );

    const tabs = $$("[data-inbox-tab]");
    tabs.forEach((tab, i) =>
      tab.addEventListener("keydown", (event) => {
        let next;
        if (event.key === "ArrowRight") next = (i + 1) % tabs.length;
        else if (event.key === "ArrowLeft")
          next = (i - 1 + tabs.length) % tabs.length;
        else if (event.key === "Home") next = 0;
        else if (event.key === "End") next = tabs.length - 1;
        else return;
        event.preventDefault();
        tabs[next].focus();
        tabs[next].click();
      }),
    );
    const routeId =
      location.pathname.split("/")[2] ||
      new URLSearchParams(location.search).get("intro");
    selectContact(contacts["sent-" + routeId] ? "sent-" + routeId : "Alex");
  }
  const saveInboxStatus = (status, extra = {}) => {
    if (["Accepted", "Declined"].includes(state.inbox[selectedContact]?.status))
      return;
    state.inbox[selectedContact] = {
      ...state.inbox[selectedContact],
      status,
      ...extra,
    };
    const record = contacts[selectedContact]?.record;
    if (record) {
      record.status = {
        Accepted: "accepted",
        Declined: "declined",
        "Context requested": "context_requested",
      }[status];
      record.question = extra.question || "";
      record.decidedAt = new Date().toISOString();
    }
    const row = $(`[data-contact="${selectedContact}"]`);
    if (row)
      row.dataset.group = status === "Context requested" ? "waiting" : "needs";
    const waiting = $("[data-inbox-tab=waiting] span");
    if (waiting)
      waiting.textContent = String($$(".inbox-row[data-group=waiting]").length);
    save();
    selectContact(selectedContact);
  };

  document.addEventListener("click", (e) => {
    const action = e.target.closest("[data-action]")?.dataset.action;
    if (!action) {
      const fee = e.target.closest("[data-fee]");
      if (fee)
        openDialog(
          fee.dataset.fee === "bond"
            ? "Refundable attention bond"
            : "Evaluation fee",
          `<p class="dialog-copy">This label is part of the supplied concept design. The prototype has no payment integration, fee schedule, wallet connection, or refund mechanism.</p>${notice("No money can be charged or transferred by this local prototype.")}<div class="dialog-actions"><button type="button" class="button primary" data-close-dialog>Understood</button></div>`,
        );
      return;
    }
    if (action === "start-manually") return editProfile("profile");
    if (action === "review-draft")
      return openDialog(
        "Review your profile draft",
        `<img class="avatar dialog-avatar" src="assets/avatar-alex.webp" alt="Illustrated profile avatar"><h3 style="font-size:26px">${escapeHTML(state.profile.name)}</h3><p class="dialog-copy">${escapeHTML(state.profile.bio)}</p><ul class="context-list"><li><strong>Current interests</strong><br>${escapeHTML(state.profile.interests)}</li><li><strong>Can offer</strong><br>${escapeHTML(state.profile.offer)}</li><li><strong>Wants to meet</strong><br>${escapeHTML(state.profile.meet)}</li></ul>${notice("You choose the visibility next. Approving this draft does not make it public.")}<div class="dialog-actions"><button class="button outline" type="button" data-close-dialog>Keep editing</button><button class="button primary" data-action="approve-profile">Approve draft ${icon("arrow")}</button></div>`,
      );
    if (action === "approve-profile") {
      state.profileApproved = true;
      state.agent.interests = state.profile.interests
        .split(/[,，]/)
        .map((s) => s.trim().replace(/\.$/, ""))
        .filter(Boolean)
        .slice(0, 12);
      save();
      location.href = "/agent";
      return;
    }
    if (action === "save-agent") {
      save();
      return openDialog(
        "Your agent is ready",
        '<p class="dialog-copy">Your preferences are saved. Follow a curiosity, or create a little card for your corner of the internet.</p><div class="dialog-actions"><a class="button outline" href="/widget/create">Create my widget</a><a class="button primary" href="/discover">Discover people →</a></div>',
      );
    }
    if (action === "preview-profile")
      return openDialog(
        "Your profile preview",
        `<img class="avatar dialog-avatar" src="assets/avatar-alex.webp" alt="Illustrated avatar"><h3 style="font-size:25px">${escapeHTML(state.profile.name)}</h3><p class="dialog-copy">Curious about ${escapeHTML(state.agent.interests.slice(0, 3).join(", ").toLowerCase())}.</p><div class="dialog-tags">${state.agent.interests
          .slice(0, 12)
          .map((t) => `<span class="chip">${escapeHTML(t)}</span>`)
          .join(
            "",
          )}</div>${notice(`Current visibility: <strong>${escapeHTML(state.agent.visibility)}</strong>. ${state.agent.visibility === "private" ? "The public profile is hidden; this is a private preview for you." : "This example shows the fields you have chosen to share."}`)}<div class="dialog-actions"><button class="button primary" type="button" data-close-dialog>Back to settings</button></div>`,
      );
    if (action === "browse-people")
      return openDialog(
        "People worth knowing",
        `<p class="dialog-copy">Three example profiles from the supplied designs.</p>${directory.map((p) => `<button class="directory-entry" type="button" data-directory-person="${p.name}" style="width:100%;text-align:left"><img class="avatar" src="assets/avatar-${p.avatar}.webp" alt=""><span><strong>${p.name}</strong><p>${p.role}</p></span>${icon("arrow")}</button>`).join("")}`,
        (root) =>
          $$("[data-directory-person]", root).forEach((el) =>
            el.addEventListener("click", () =>
              showPerson(el.dataset.directoryPerson),
            ),
          ),
      );
    if (action === "copy-embed") return void copyEmbed();
    if (action === "approve-introduction") return reviewIntroduction();
    if (action === "toggle-context")
      return openDialog(
        "Choose what to share",
        `<p class="dialog-copy">${escapeHTML(state.profile.bio)}</p><p class="dialog-copy">Interests: ${escapeHTML(state.agent.interests.join(", "))}</p>${notice("Your links are user-provided, not verified. Private agent memory is never included.")}<div class="dialog-actions"><button class="button outline" type="button" id="hide-context">Message only</button><button class="button primary" type="button" id="share-context">Include this context</button></div>`,
        (root) => {
          const set = (value) => {
            state.sharedContext = value;
            save();
            $(".verified-context-inner>p").textContent = value
              ? "Your profile and selected interests will be included."
              : "Only your introduction message will be shared.";
            $("[data-action=toggle-context]").textContent = value
              ? "Review context"
              : "Add context";
            closeDialog();
          };
          $("#hide-context", root).addEventListener("click", () => set(false));
          $("#share-context", root).addEventListener("click", () => set(true));
        },
      );
    if (action === "accept-introduction")
      return openDialog(
        `Accept ${contacts[selectedContact]?.name || selectedContact}’s introduction?`,
        `<p class="dialog-copy">A good conversation starts with mutual curiosity. You decide whether to take the next step.</p>${notice("Demo only: accepting records a local status. It does not contact the other person.")} ${buttons("Accept in this demo")}`,
        (root) =>
          $("#dialog-confirm", root).addEventListener("click", () => {
            saveInboxStatus("Accepted");
            closeDialog();
            toast("Introduction accepted locally. No one has been contacted.");
          }),
      );
    if (action === "ask-context")
      return openDialog(
        `Ask ${contacts[selectedContact]?.name || selectedContact} for context`,
        `<form id="context-request-form"><label class="dialog-field" for="context-question">What would help you decide?</label><textarea class="dialog-input" id="context-question" maxlength="500" required autofocus placeholder="Could you share more about what you’d like to explore together?"></textarea>${notice("This saves a local draft only. It will not send a message.")}<div class="dialog-actions"><button class="button outline" type="button" data-close-dialog>Cancel</button><button class="button primary" type="submit">Save context request</button></div></form>`,
        (root) =>
          $("#context-request-form", root).addEventListener(
            "submit",
            (event) => {
              event.preventDefault();
              const question = $("#context-question", root).value.trim();
              if (!question) return;
              saveInboxStatus("Context requested", { question });
              closeDialog();
              toast("Context request saved locally, not sent.");
            },
          ),
      );
    if (action === "decline-introduction")
      return openDialog(
        `Decline ${contacts[selectedContact]?.name || selectedContact}’s introduction?`,
        `<p class="dialog-copy">You do not need to meet everyone. The choice is always yours.</p>${notice("This changes the example’s local status only. The sender will not be notified.")} ${buttons("Decline in this demo")}`,
        (root) =>
          $("#dialog-confirm", root).addEventListener("click", () => {
            saveInboxStatus("Declined");
            closeDialog();
            toast("Introduction declined in this local demo.");
          }),
      );
  });

  const adjustStage = () => {
    const scene = $(".scene");
    if (!scene) return;
    if (document.documentElement.clientWidth <= 1180) {
      document.documentElement.style.setProperty("--scene-height", "928px");
      return;
    }
    const scale =
      parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue("--scale"),
      ) || 1;
    const origin = scene.getBoundingClientRect().top;
    const panels = $$(
      ".source-workspace, .agent-workspace, .discovery-workspace, .widget-workspace, .compose-workspace, .inbox-workspace",
    );
    const bottom = Math.max(
      895,
      ...panels.map(
        (el) => (el.getBoundingClientRect().bottom - origin) / scale,
      ),
    );
    document.documentElement.style.setProperty(
      "--scene-height",
      Math.max(928, Math.ceil(bottom + 29)) + "px",
    );
  };
  let stageFrame;
  const requestLayout = () => {
    cancelAnimationFrame(stageFrame);
    stageFrame = requestAnimationFrame(adjustStage);
  };
  window.addEventListener("resize", requestLayout, { passive: true });
  window.addEventListener("load", requestLayout);
  const stageObserver = new ResizeObserver(requestLayout);
  $$(
    ".source-workspace, .agent-workspace, .discovery-workspace, .widget-workspace, .compose-workspace, .inbox-workspace",
  ).forEach((el) => stageObserver.observe(el));
  requestLayout();
  if (page === "sources" && location.pathname === "/profile/review")
    $("[data-action=review-draft]").click();
  if (page === "compose" && location.pathname.endsWith("/confirm")) {
    const requestedId = location.pathname.split("/")[2];
    if (state.introductions.some((item) => item.id === requestedId))
      location.replace(
        `/introductions/${encodeURIComponent(requestedId)}/receipt`,
      );
    else if (state.draft?.id === requestedId) reviewIntroduction();
    else
      openDialog(
        "Draft not found",
        '<p class="dialog-copy">This draft is not saved on this device. Pick someone to start a new introduction.</p><div class="dialog-actions"><a class="button primary" href="/discover">Discover people →</a></div>',
      );
  }
  window.SignalPassDemo = Object.freeze({ version: "4.0.0", page });
})();
