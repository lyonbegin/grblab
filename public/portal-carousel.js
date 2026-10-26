(() => {
  const root = document.querySelector('.main-carousel');
  if (!root) return;

  const slides = [...root.querySelectorAll('.main-carousel-slide')];
  const dots = [...root.querySelectorAll('.main-carousel-dots button')];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  const connection = navigator.connection;
  let index = 0;
  let requestedIndex = 0;
  let requestId = 0;
  let timer = null;
  let visible = true;
  let ready = false;
  let loading = false;

  async function loadSlide(target) {
    const img = slides[target].querySelector('img');
    if (img.dataset.src) {
      // A hidden slide has no src until needed; native lazy loading alone
      // still fetched all four overlapping banners on mobile.
      img.loading = 'eager';
      img.srcset = img.dataset.srcset;
      img.src = img.dataset.src;
    }
    await img.decode();
    delete img.dataset.srcset;
    delete img.dataset.src;
  }

  function stop() {
    clearTimeout(timer);
    timer = null;
  }

  function start() {
    stop();
    const slowConnection = connection &&
      (connection.saveData || ['slow-2g', '2g', '3g'].includes(connection.effectiveType));
    if (!ready || loading || !visible || document.hidden || reduceMotion.matches ||
        slowConnection || root.matches(':hover, :focus-within') ||
        document.querySelector('dialog[open]')) return;

    timer = setTimeout(async () => {
      await show(index + 1);
      start();
    }, 5000);
  }

  async function show(nextIndex) {
    const target = (nextIndex + slides.length) % slides.length;
    requestedIndex = target;
    const request = ++requestId;
    loading = true;
    stop();
    try {
      // Keep the current banner visible until the next one is fully decoded.
      await loadSlide(target);
      if (request !== requestId) return;
      index = target;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === index));
      dots.forEach((dot, i) => {
        dot.classList.toggle('is-active', i === index);
        dot.setAttribute('aria-current', String(i === index));
      });
    } catch (_) {
      // A failed download must not replace a usable banner with a blank slide.
    } finally {
      if (request === requestId) loading = false;
    }
  }

  async function navigate(target) {
    await show(target);
    start();
  }

  root.querySelector('.main-carousel-prev').addEventListener('click', () => navigate(requestedIndex - 1));
  root.querySelector('.main-carousel-next').addEventListener('click', () => navigate(requestedIndex + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => navigate(i)));
  root.addEventListener('mouseenter', stop);
  root.addEventListener('mouseleave', start);
  root.addEventListener('focusin', stop);
  root.addEventListener('focusout', () => queueMicrotask(start));
  document.addEventListener('visibilitychange', start);
  document.addEventListener('close', start, true);
  reduceMotion.addEventListener('change', start);
  connection?.addEventListener('change', start);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      start();
    }).observe(root);
  }

  loadSlide(0).then(() => {
    ready = true;
    start();
  }).catch(() => {});
})();
