/* ============================================================
   KINDA — Main JS  ·  anime.js v3 powered
   ============================================================ */

// ── Nav scroll state ───────────────────────────────────────
function updateNavState() {
  const nav  = document.getElementById('nav');
  const hero = document.getElementById('hero');
  if (!nav) return;
  const threshold = hero ? hero.offsetHeight * 0.6 : window.innerHeight * 0.6;
  nav.classList.toggle('scrolled', window.scrollY > threshold);
}

// ── Smooth scroll ─────────────────────────────────────────
function initSmoothScroll() {
  document.querySelectorAll('.scroll-to').forEach(el => {
    el.addEventListener('click', e => {
      const id = el.dataset.target || el.getAttribute('href')?.replace('#', '');
      const target = id && document.getElementById(id);
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
    });
  });
}

// ── Split headline text into per-word spans ───────────────
function splitWords(el) {
  el.innerHTML = el.innerHTML
    .split(/<br\s*\/?>/i)
    .map(line =>
      line.trim().split(/\s+/).filter(Boolean)
        .map(w => `<span class="word-clip"><span class="word-inner">${w}</span></span>`)
        .join(' ')
    )
    .join('<br>');
  return el.querySelectorAll('.word-inner');
}

// ── Hero entrance (runs on load) ─────────────────────────
function initHeroAnimation() {
  const headline = document.querySelector('.hero-headline');
  const sub      = document.querySelector('.hero-sub');
  const btn      = document.querySelector('.btn-hero');
  const note     = document.querySelector('.hero-note');
  if (!headline) return;

  // 1. Split headline into words; set each word hidden below clip
  const words = splitWords(headline);
  anime.set(words, { translateY: '108%' });
  headline.style.opacity = '1'; // container visible; words hidden via transform

  // 2. Hide the rest
  anime.set([sub, btn, note].filter(Boolean), { opacity: 0, translateY: 24 });

  // 3. Timeline
  anime.timeline({ easing: 'easeOutExpo' })
    .add({
      targets: words,
      translateY: ['108%', '0%'],
      duration: 950,
      delay: anime.stagger(48, { start: 100 }),
    })
    .add({
      targets: sub,
      opacity: [0, 1],
      translateY: [22, 0],
      duration: 720,
    }, '-=580')
    .add({
      targets: btn,
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 600,
    }, '-=520')
    .add({
      targets: note,
      opacity: [0, 1],
      duration: 500,
    }, '-=420');
}

// ── Scroll-triggered animations ───────────────────────────
function initScrollAnimations() {
  const seen = new WeakSet();

  const run = (el) => {
    if (seen.has(el)) return;
    seen.add(el);

    const type  = el.dataset.anime;
    const delay = parseInt(el.dataset.animeDelay || '0', 10);

    if (type === 'fade-up') {
      anime({
        targets: el,
        opacity: [0, 1],
        translateY: [44, 0],
        duration: 820,
        delay,
        easing: 'easeOutExpo',
      });
    }

    if (type === 'fade-device') {
      anime({
        targets: el,
        opacity: [0, 1],
        translateY: [60, 0],
        scale: [0.94, 1],
        duration: 1050,
        delay,
        easing: 'easeOutExpo',
      });
    }
  };

  // Set initial hidden states before observing
  document.querySelectorAll('[data-anime]').forEach(el => {
    const type = el.dataset.anime;
    if (type === 'fade-up')     anime.set(el, { opacity: 0, translateY: 44 });
    if (type === 'fade-device') anime.set(el, { opacity: 0, translateY: 60, scale: 0.94 });
  });

  const observer = new IntersectionObserver(
    entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          run(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
  );

  document.querySelectorAll('[data-anime]').forEach(el => observer.observe(el));
}

// ── Feature cards carousel ────────────────────────────────
function initCardsCarousel() {
  const track    = document.getElementById('cards-track');
  const viewport = track?.parentElement;
  const prevBtn  = document.getElementById('cards-prev');
  const nextBtn  = document.getElementById('cards-next');
  if (!track || !viewport || !prevBtn || !nextBtn) return;

  const stepWidth = () => {
    const card = track.querySelector('.feat-card');
    return card ? card.offsetWidth + 16 : 536;
  };

  nextBtn.addEventListener('click', () => { advance(); resetTimer(); });
  prevBtn.addEventListener('click', () => { retreat(); resetTimer(); });

  // Auto-loop
  const INTERVAL = 3200;
  let timer = null;

  const advance = () => {
    const maxScroll = viewport.scrollWidth - viewport.clientWidth;
    if (viewport.scrollLeft >= maxScroll - 8) {
      // reached end — snap back to start
      viewport.scrollTo({ left: 0, behavior: 'smooth' });
    } else {
      viewport.scrollBy({ left: stepWidth(), behavior: 'smooth' });
    }
  };

  const retreat = () => viewport.scrollBy({ left: -stepWidth(), behavior: 'smooth' });

  const startTimer = () => { timer = setInterval(advance, INTERVAL); };
  const stopTimer  = () => { clearInterval(timer); timer = null; };
  const resetTimer = () => { stopTimer(); startTimer(); };

  startTimer();

  // Pause on hover / touch
  viewport.addEventListener('mouseenter',  stopTimer);
  viewport.addEventListener('mouseleave',  startTimer);
  viewport.addEventListener('touchstart',  stopTimer,  { passive: true });
  viewport.addEventListener('touchend',    resetTimer, { passive: true });

  // Drag to scroll
  let active = false, startX = 0, startLeft = 0;
  viewport.addEventListener('mousedown',  e => { active = true; stopTimer(); startX = e.pageX - viewport.offsetLeft; startLeft = viewport.scrollLeft; viewport.style.cursor = 'grabbing'; });
  viewport.addEventListener('mouseleave', () => { active = false; viewport.style.cursor = 'grab'; });
  viewport.addEventListener('mouseup',    () => { active = false; viewport.style.cursor = 'grab'; resetTimer(); });
  viewport.addEventListener('mousemove',  e => {
    if (!active) return;
    e.preventDefault();
    viewport.scrollLeft = startLeft - (e.pageX - viewport.offsetLeft - startX) * 1.2;
  });
}

// ── Waitlist form ─────────────────────────────────────────
function initForm() {
  const form      = document.getElementById('waitlist-form');
  if (!form) return;

  const nameInput  = document.getElementById('name');
  const emailInput = document.getElementById('email');
  const nameError  = document.getElementById('name-error');
  const emailError = document.getElementById('email-error');
  const submitBtn  = document.getElementById('submit-btn');
  const formWrap   = document.getElementById('form-wrap');
  const confirm    = document.getElementById('confirm');

  const showError  = (err, inp, msg) => { err.textContent = msg; err.classList.add('visible'); inp.classList.add('error'); };
  const clearError = (err, inp)      => { err.textContent = '';  err.classList.remove('visible'); inp.classList.remove('error'); };

  nameInput.addEventListener('input',  () => clearError(nameError,  nameInput));
  emailInput.addEventListener('input', () => clearError(emailError, emailInput));

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const nameVal  = nameInput.value.trim();
    const emailVal = emailInput.value.trim();
    let valid = true;

    clearError(nameError,  nameInput);
    clearError(emailError, emailInput);

    if (!nameVal)  { showError(nameError,  nameInput,  'Your first name is required.'); valid = false; }
    if (!emailVal) { showError(emailError, emailInput, 'Your email address is required.'); valid = false; }
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) { showError(emailError, emailInput, 'Please enter a valid email address.'); valid = false; }

    if (!valid) return;

    submitBtn.classList.add('loading');
    submitBtn.disabled = true;

    try {
      const body = new FormData(form);
      await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body).toString() });
    } catch (_) {}

    formWrap.style.display = 'none';
    confirm.classList.add('visible');
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
  });
}

// ── Throttle ──────────────────────────────────────────────
function throttle(fn, ms) {
  let last = 0;
  return (...args) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...args); } };
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initHeroAnimation();
  initScrollAnimations();
  initCardsCarousel();
  initForm();

  updateNavState();
  window.addEventListener('scroll', throttle(updateNavState, 16), { passive: true });
});
