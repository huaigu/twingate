/* Preserve the natural V3 reveal. Geometry is fixed; only paths and contents animate. */
(() => {
  const scene = document.getElementById("heroScene");
  if (!scene) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width:540px)");
  const beats = [
    ["context", 300, 1460, 1110, 1390, 1210, 10],
    ["opportunities", 480, 920, 1070, 900, 790, 7],
    ["people", 1350, 1430, 2240, 1400, 1260, 9],
    ["ideas", 2030, 860, 2470, 840, 740, 6],
    ["introductions", 2520, 1450, 3330, 1450, 1300, 8],
  ];
  for (const [
    id,
    start,
    duration,
    nodeStart,
    nodeDuration,
    fade,
    rise,
  ] of beats) {
    const node = scene.querySelector(`[data-node="${id}"]`);
    const wire = scene.querySelector(`[data-wire="${id}"]`);
    for (const [key, value] of Object.entries({
      "--node-start": `${nodeStart}ms`,
      "--node-duration": `${nodeDuration}ms`,
      "--fade-duration": `${fade}ms`,
      "--node-rise": `${rise}px`,
    }))
      node.style.setProperty(key, value);
    wire.style.setProperty("--path-start", `${start}ms`);
    wire.style.setProperty("--path-duration", `${duration}ms`);
  }
  const paths = () => {
    scene
      .querySelector(".scene-wires")
      .setAttribute("viewBox", mobile.matches ? "0 0 900 830" : "0 0 900 790");
    scene
      .querySelectorAll(".wire-group")
      .forEach((group) =>
        group
          .querySelectorAll("path")
          .forEach((path) =>
            path.setAttribute(
              "d",
              mobile.matches ? group.dataset.mobileD : group.dataset.desktopD,
            ),
          ),
      );
  };
  paths();
  mobile.addEventListener("change", paths);
  let played = false;
  const reveal = () => {
    if (played || reduce.matches) return;
    played = true;
    scene.classList.add("is-animated");
  };
  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          reveal();
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(scene);
  } else reveal();
  reduce.addEventListener("change", () => {
    if (reduce.matches) scene.classList.remove("is-animated");
  });
  document.addEventListener("visibilitychange", () => {
    scene.getAnimations({ subtree: true }).forEach((animation) => {
      if (animation.playState === "finished") return;
      if (document.hidden) animation.pause();
      else animation.play();
    });
  });
})();
