/* Cursor glow effect — only on devices with a fine pointer and motion enabled. */
(() => {
  const cursor = document.getElementById('glowCursor');
  const canAnimate = window.matchMedia('(pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (!cursor || !canAnimate) {
    if (cursor) cursor.hidden = true;
    return;
  }

  let cx = window.innerWidth / 2;
  let cy = window.innerHeight / 2;
  let tx = cx;
  let ty = cy;
  let frameId = 0;

  const animate = () => {
    cx += (tx - cx) * 0.08;
    cy += (ty - cy) * 0.08;
    cursor.style.transform = `translate(${cx - 200}px, ${cy - 200}px)`;
    frameId = requestAnimationFrame(animate);
  };

  document.addEventListener('pointermove', (event) => {
    tx = event.clientX;
    ty = event.clientY;
    if (!frameId) frameId = requestAnimationFrame(animate);
  }, { passive: true });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frameId) {
      cancelAnimationFrame(frameId);
      frameId = 0;
    }
  });
})();
