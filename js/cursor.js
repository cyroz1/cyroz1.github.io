/* Cursor glow effect — only on devices with a fine pointer (mouse) */
(function () {
  const cursor = document.getElementById('glowCursor');
  if (!cursor) return;

  if (window.matchMedia('(pointer: fine)').matches) {
    let cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    let tx = cx, ty = cy;

    document.addEventListener('mousemove', function (e) {
      tx = e.clientX;
      ty = e.clientY;
    }, { passive: true });

    (function animate() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      cursor.style.transform = 'translate(' + (cx - 200) + 'px, ' + (cy - 200) + 'px)';
      requestAnimationFrame(animate);
    })();
  } else {
    cursor.style.display = 'none';
  }
})();
