/* Product navigation uses real URLs. Only local, known legacy links are mapped. */
(() => {
  const routes = {
    "index.html": "/profile/import",
    "agent.html": "/assistant",
    "assistant.html": "/assistant",
    "discover.html": "/discover",
    "widget.html": "/widget/create",
    "compose.html": "/introductions/new",
    "inbox.html": "/inbox",
    "widget-preview.html": "/widget/preview",
  };
  document.querySelectorAll('.v4-menu a[href="/agent"]').forEach((link) => {
    link.href = "/assistant";
    if (document.body.dataset.page === "agent") link.removeAttribute("aria-current");
  });
  document.addEventListener(
    "click",
    (event) => {
      const a = event.target.closest("a[href]");
      if (a && routes[a.getAttribute("href")])
        a.href = routes[a.getAttribute("href")];
    },
    true,
  );
  const toggle = document.querySelector(".v4-menu-toggle");
  const menu = document.querySelector(".v4-menu");
  toggle?.addEventListener("click", () => {
    const open = toggle.getAttribute("aria-expanded") !== "true";
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute(
      "aria-label",
      open ? "Close navigation" : "Open navigation",
    );
    menu.classList.toggle("is-open", open);
  });
  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      toggle?.getAttribute("aria-expanded") === "true"
    ) {
      toggle.click();
      toggle.focus();
    }
  });
  document.addEventListener("click", (event) => {
    if (
      !event.target.closest(".v4-header") &&
      toggle?.getAttribute("aria-expanded") === "true"
    )
      toggle.click();
  });
})();
