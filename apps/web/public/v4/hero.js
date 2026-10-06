/* Preserve the natural V3 reveal. Geometry is fixed; only paths and contents animate. */
(() => {
  const scene = document.getElementById("heroScene");
  if (!scene) return;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)");
  const mobile = matchMedia("(max-width:540px)");
  const beats = [
    ["context", 120, 780, 500, 520, 320, 6],
    ["opportunities", 260, 720, 620, 560, 360, 5],
    ["people", 680, 880, 1160, 620, 380, 6],
    ["ideas", 1040, 660, 1360, 520, 340, 4],
    ["introductions", 1320, 940, 1850, 620, 400, 6],
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
  let replayFrame = 0;
  if (!reduce.matches) scene.classList.add('motion-preparing');
  const reveal = (replay = false) => {
    if ((played && !replay) || reduce.matches) return;
    played = true;
    cancelAnimationFrame(replayFrame);
    if (replay) {
      scene.classList.add('motion-preparing'); scene.classList.remove('is-animated');
      replayFrame = requestAnimationFrame(() => {
        replayFrame = requestAnimationFrame(() => { scene.classList.remove('motion-preparing'); scene.classList.add('is-animated'); replayFrame = 0; });
      });
    } else { scene.classList.remove('motion-preparing'); scene.classList.add('is-animated'); }
  };
  const replay = document.createElement('button'); replay.type = 'button'; replay.className = 'sp-hero-replay btn btn-ghost btn-sm';
  replay.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 10a9 9 0 1 1 1 7M3 4v6h6"/></svg><span>Replay the connections</span>';
  replay.onclick = () => reveal(true); scene.after(replay);
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
    if (reduce.matches) { cancelAnimationFrame(replayFrame); scene.classList.remove('is-animated', 'motion-preparing'); }
  });
  window.addEventListener('pagehide', () => { cancelAnimationFrame(replayFrame); scene.classList.remove('motion-preparing'); });
  document.addEventListener("visibilitychange", () => {
    scene.getAnimations({ subtree: true }).forEach((animation) => {
      if (animation.playState === "finished") return;
      if (document.hidden) animation.pause();
      else animation.play();
    });
  });
})();
