(() => {
    const cursor = document.getElementById('glowCursor');
    if (!cursor) {
        return;
    }

    if (!window.matchMedia('(pointer: fine)').matches) {
        cursor.style.display = 'none';
        return;
    }

    let cx = window.innerWidth / 2;
    let cy = window.innerHeight / 2;
    let tx = cx;
    let ty = cy;

    document.addEventListener('mousemove', (event) => {
        tx = event.clientX;
        ty = event.clientY;
    }, { passive: true });

    const animate = () => {
        cx += (tx - cx) * 0.08;
        cy += (ty - cy) * 0.08;
        cursor.style.transform = `translate(${cx - 200}px, ${cy - 200}px)`;
        requestAnimationFrame(animate);
    };

    requestAnimationFrame(animate);
})();
