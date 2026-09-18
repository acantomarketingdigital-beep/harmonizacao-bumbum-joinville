(() => {
  const slides = [...document.querySelectorAll('.result-slide')];
  const track = document.getElementById('resultTrack');
  const viewport = document.querySelector('.result-viewport');
  const dots = [...document.querySelectorAll('.result-dot')];
  const lightbox = document.getElementById('lightbox');
  const image = document.getElementById('lbImg');
  const count = document.getElementById('lbCount');
  let index = 0;

  function go(next) {
    index = (next + slides.length) % slides.length;
    track.style.transform = `translateX(-${index * 100}%)`;
    const source = slides[index].querySelector('img');
    viewport.style.aspectRatio = `${source.getAttribute('width')} / ${source.getAttribute('height')}`;
    slides.forEach((slide, n) => { slide.inert = n !== index; });
    dots.forEach((dot, n) => {
      dot.classList.toggle('active', n === index);
      dot.setAttribute('aria-current', String(n === index));
    });
    if (lightbox.open) {
      image.src = source.getAttribute('src');
      image.alt = source.alt;
      count.textContent = `${index + 1} de ${slides.length}`;
    }
  }

  function close() { lightbox.close(); }
  lightbox.addEventListener('close', () => {
    lightbox.classList.remove('open');
    document.body.classList.remove('lb-open');
    slides[index].focus({ preventScroll: true });
  });
  slides.forEach((slide, n) => slide.addEventListener('click', () => {
    lightbox.showModal();
    lightbox.classList.add('open');
    document.body.classList.add('lb-open');
    go(n);
    document.getElementById('lbClose').focus();
  }));
  dots.forEach((dot, n) => dot.addEventListener('click', () => go(n)));
  document.getElementById('resultPrev').onclick = () => go(index - 1);
  document.getElementById('resultNext').onclick = () => go(index + 1);
  document.getElementById('lbPrev').onclick = () => go(index - 1);
  document.getElementById('lbNext').onclick = () => go(index + 1);
  document.getElementById('lbClose').onclick = close;
  lightbox.addEventListener('click', event => {
    if (event.target === lightbox) close();
  });
  lightbox.addEventListener('keydown', event => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      go(index + (event.key === 'ArrowRight' ? 1 : -1));
    }
  });

  function enableSwipe(element) {
    let start = null;
    let suppressClickUntil = 0;
    element.addEventListener('touchstart', event => {
      start = event.touches.length === 1
        ? { x: event.touches[0].clientX, y: event.touches[0].clientY }
        : null;
    }, { passive: true });
    element.addEventListener('touchcancel', () => { start = null; }, { passive: true });
    element.addEventListener('touchend', event => {
      if (!start) return;
      const dx = event.changedTouches[0].clientX - start.x;
      const dy = event.changedTouches[0].clientY - start.y;
      start = null;
      if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy) * 1.2) {
        suppressClickUntil = Date.now() + 400;
        go(index + (dx < 0 ? 1 : -1));
      }
    }, { passive: true });
    element.addEventListener('click', event => {
      if (Date.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, true);
  }
  enableSwipe(viewport);
  enableSwipe(lightbox);
  go(0);
})();
