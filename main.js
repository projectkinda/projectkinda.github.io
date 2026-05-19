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

// ── Split headline into per-letter spans ─────────────────
function splitLetters(el) {
  el.innerHTML = el.innerHTML
    .split(/<br\s*\/?>/i)
    .map(line =>
      line.trim().split(' ').map(word =>
        `<span style="display:inline-block;white-space:nowrap">${
          word.split('').map(ch =>
            `<span class="char-wrap"><span class="char-inner">${ch}</span></span>`
          ).join('')
        }</span>`
      ).join(' ')
    )
    .join('<br>');
  return el.querySelectorAll('.char-inner');
}

// ── Hero entrance (runs on load) ─────────────────────────
function initHeroAnimation() {
  const headline = document.querySelector('.hero-headline');
  const sub      = document.querySelector('.hero-sub');
  const btn      = document.querySelector('.btn-hero');
  const note     = document.querySelector('.hero-note');
  if (!headline) return;

  const chars = splitLetters(headline);
  anime.set(chars, { scaleY: 0, opacity: 0 });
  headline.style.opacity = '1';

  anime.set([sub, btn, note].filter(Boolean), { opacity: 0, translateY: 24 });

  anime.timeline({ easing: 'easeOutExpo' })
    .add({
      targets: chars,
      scaleY: [0, 1],
      opacity: [0, 1],
      duration: 860,
      delay: anime.stagger(28, { start: 80 }),
    })
    .add({
      targets: sub,
      opacity: [0, 1],
      translateY: [22, 0],
      duration: 720,
    }, '-=520')
    .add({
      targets: btn,
      opacity: [0, 1],
      translateY: [16, 0],
      duration: 600,
    }, '-=460')
    .add({
      targets: note,
      opacity: [0, 1],
      duration: 500,
    }, '-=380');
}

// ── Mobile nav hamburger ──────────────────────────────────
function initMobileNav() {
  const btn  = document.getElementById('nav-hamburger');
  const menu = document.getElementById('nav-mobile');
  if (!btn || !menu) return;

  function close() {
    btn.classList.remove('open');
    menu.classList.remove('open');
    btn.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
  }

  btn.addEventListener('click', () => {
    const open = btn.classList.toggle('open');
    menu.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-hidden', String(!open));
  });

  menu.querySelectorAll('.scroll-to').forEach(el => el.addEventListener('click', close));
}

// ── Hero cursor glow + chromatic aberration ───────────────
function initHeroCursorGlow() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const hero     = document.getElementById('hero');
  const canvas   = hero && hero.querySelector('.hero-glow-canvas');
  const headline = document.querySelector('.hero-headline');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');

  function resize() {
    canvas.width  = hero.offsetWidth;
    canvas.height = hero.offsetHeight;
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  let mx = -2000, my = -2000;
  let pmx = 0, pmy = 0;
  let smoothVel = 0;
  let chromaOffset = 0;

  hero.addEventListener('mousemove', e => {
    const r = canvas.getBoundingClientRect();
    mx = e.clientX - r.left;
    my = e.clientY - r.top;
  }, { passive: true });

  hero.addEventListener('mouseleave', () => { mx = -2000; my = -2000; }, { passive: true });

  function draw() {
    const velX = mx - pmx;
    const velY = my - pmy;
    pmx = mx; pmy = my;
    const vel = Math.sqrt(velX * velX + velY * velY);
    smoothVel = smoothVel * 0.94 + vel * 0.06;
    chromaOffset = chromaOffset * 0.92 + Math.min(smoothVel * 0.06, 2) * 0.08;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (mx > -1000) {
      const r  = 280 + smoothVel * 0.5;
      const ox = (velX / (vel + 0.01)) * smoothVel * 0.4;

      // Red glow (leads mouse direction)
      const gr = ctx.createRadialGradient(mx + ox * 0.4, my, 0, mx + ox * 0.4, my, r);
      gr.addColorStop(0, `rgba(255,50,80,${0.045 + smoothVel * 0.0008})`);
      gr.addColorStop(1, 'rgba(255,0,0,0)');
      ctx.fillStyle = gr;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Blue glow (trails mouse direction)
      const gb = ctx.createRadialGradient(mx - ox * 0.4, my, 0, mx - ox * 0.4, my, r);
      gb.addColorStop(0, `rgba(60,140,255,${0.04 + smoothVel * 0.0006})`);
      gb.addColorStop(1, 'rgba(0,60,255,0)');
      ctx.fillStyle = gb;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // White core
      const gw = ctx.createRadialGradient(mx, my, 0, mx, my, r * 0.35);
      gw.addColorStop(0, `rgba(255,255,255,${0.03 + smoothVel * 0.0005})`);
      gw.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gw;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // Chromatic aberration on headline text
    if (headline) {
      const co = chromaOffset;
      headline.style.filter = co < 0.2
        ? ''
        : `drop-shadow(${co}px 0 rgba(255,40,80,0.30)) drop-shadow(${-co}px 0 rgba(40,180,255,0.30))`;
    }

    requestAnimationFrame(draw);
  }

  draw();
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

    if (type === 'fade-screen') {
      anime({
        targets: el,
        opacity: [0, 1],
        translateY: [80, 0],
        scale: [0.92, 1],
        duration: 1200,
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
    if (type === 'fade-screen') anime.set(el, { opacity: 0, translateY: 80, scale: 0.92 });
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

// ── 3D Carousel — failure mode cards ─────────────────────
const carouselCards = [
  { code: 'ACT', label: 'Activation failure',  color: '#7EC8E3', quote: '"I know exactly what I need to do. I just can\'t make myself start."' },
  { code: 'DEC', label: 'Decision paralysis',  color: '#F0B429', quote: '"I have so many things I could do that I end up doing none of them."' },
  { code: 'PER', label: 'Perfectionism trap',  color: '#B0A0E0', quote: '"It\'s not ready yet. It needs to be right before I can send it."' },
  { code: 'MOM', label: 'Momentum dependency', color: '#7AC8B8', quote: '"I work well — but only when I\'m already in the zone. Getting there is the problem."' },
  { code: 'BUR', label: 'Burnout / depletion', color: '#E8A598', quote: '"I used to be productive. Now even small tasks feel like too much."' },
  { code: 'IDN', label: 'Identity fog',        color: '#9DB89A', quote: '"I\'m busy all the time but I don\'t feel like I\'m moving toward anything."' },
];

function initCarousel() {
  const rotor   = document.getElementById('carousel-rotor');
  const scene   = document.getElementById('carousel-scene');
  const pipsEl  = document.getElementById('carousel-pips');
  const glowEl  = document.getElementById('carousel-glow');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  if (!rotor) return;

  const N = carouselCards.length;
  let active = 0;
  let touchStartX = 0;
  let mouseStartX = 0;
  let isDragging  = false;

  // Responsive dimensions
  function getDims() {
    const w = window.innerWidth;
    if (w <= 600) return { radius: 240, perspective: 700 };
    if (w <= 900) return { radius: 300, perspective: 900 };
    return                { radius: 380, perspective: 1200 };
  }

  function hexToRgb(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ].join(',');
  }

  // Build scene perspective
  function applyDims() {
    const { perspective } = getDims();
    scene.style.perspective = perspective + 'px';
  }

  // Build cards
  carouselCards.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.dataset.index = i;
    card.innerHTML = `
      <div class="card-dot" style="background:${c.color};box-shadow:0 0 16px ${c.color}88"></div>
      <div class="card-code" style="color:${c.color}">${c.code}</div>
      <div class="card-label">${c.label}</div>
      <p class="card-quote">${c.quote}</p>
    `;
    rotor.appendChild(card);
  });

  // Build pips
  carouselCards.forEach((_, i) => {
    const pip = document.createElement('button');
    pip.className = 'carousel-pip';
    pip.setAttribute('aria-label', `Card ${i + 1}`);
    pip.setAttribute('role', 'tab');
    pip.addEventListener('click', () => goTo(i));
    pipsEl.appendChild(pip);
  });

  function positionCards() {
    const { radius } = getDims();
    rotor.querySelectorAll('.carousel-card').forEach((card, i) => {
      const angle = i * (360 / N);
      card.style.transform = `rotateY(${angle}deg) translateZ(${radius}px)`;
    });
  }

  function goTo(idx) {
    active = ((idx % N) + N) % N;
    rotor.style.transform = `rotateY(${-active * (360 / N)}deg)`;

    rotor.querySelectorAll('.carousel-card').forEach((card, i) => {
      const dist = Math.min(Math.abs(i - active), N - Math.abs(i - active));
      const c   = carouselCards[i];
      const rgb = hexToRgb(c.color);

      if (i === active) {
        card.style.opacity       = '1';
        card.style.filter        = 'brightness(1)';
        card.style.pointerEvents = 'auto';
        card.style.background    = `rgba(${rgb}, 0.07)`;
        card.style.borderColor   = `rgba(${rgb}, 0.24)`;
      } else if (dist === 1) {
        card.style.opacity       = '0.44';
        card.style.filter        = 'brightness(0.62)';
        card.style.pointerEvents = 'none';
        card.style.background    = 'rgba(255,255,255,0.03)';
        card.style.borderColor   = 'rgba(255,255,255,0.07)';
      } else {
        card.style.opacity       = '0.1';
        card.style.filter        = 'brightness(0.28)';
        card.style.pointerEvents = 'none';
        card.style.background    = 'rgba(255,255,255,0.02)';
        card.style.borderColor   = 'rgba(255,255,255,0.04)';
      }
    });

    pipsEl.querySelectorAll('.carousel-pip').forEach((pip, i) => {
      const on = i === active;
      pip.classList.toggle('is-active', on);
      pip.style.background = on ? carouselCards[i].color : '';
    });

    const rgb = hexToRgb(carouselCards[active].color);
    glowEl.style.background =
      `radial-gradient(ellipse 80% 65% at 50% 50%, rgba(${rgb},0.13), transparent 65%)`;
  }

  prevBtn.addEventListener('click', () => goTo(active - 1));
  nextBtn.addEventListener('click', () => goTo(active + 1));

  // Touch swipe
  scene.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  scene.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 36) goTo(active + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // Mouse drag
  scene.addEventListener('mousedown', e => { mouseStartX = e.clientX; isDragging = true; });
  scene.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    const dx = e.clientX - mouseStartX;
    if (Math.abs(dx) > 36) goTo(active + (dx < 0 ? 1 : -1));
  });
  scene.addEventListener('mouseleave', () => { isDragging = false; });

  // Keyboard
  document.addEventListener('keydown', e => {
    const sf = document.getElementById('features');
    if (!sf) return;
    const r = sf.getBoundingClientRect();
    if (r.top > window.innerHeight || r.bottom < 0) return;
    if (e.key === 'ArrowLeft')  goTo(active - 1);
    if (e.key === 'ArrowRight') goTo(active + 1);
  });

  applyDims();
  positionCards();
  goTo(0);
}

// ── Confession Wall ───────────────────────────────────────
const confessionRows = [
  [
    { text: "I'll start once I clean my desk.",                          icon: 'ti ti-home',           style: 'chip-bone'  },
    { text: "I work better under pressure anyway.",                      icon: 'ti ti-bolt',           style: 'chip-sage'  },
    { text: "I need a proper system before I can begin.",                icon: 'ti ti-list',           style: 'chip-warm'  },
    { text: "Tomorrow is basically today.",                              icon: 'ti ti-calendar',       style: 'chip-blush' },
    { text: "I just need to find the right app first.",                  icon: 'ti ti-apps',           style: 'chip-mint'  },
    { text: "Once this week is over I'll have more time.",               icon: 'ti ti-clock',          style: 'chip-bone'  },
    { text: "I perform well under deadlines. This is strategy.",         icon: 'ti ti-trophy',         style: 'chip-sage'  },
  ],
  [
    { text: "I need to be in the right headspace.",                      icon: 'ti ti-brain',          style: 'chip-mint'  },
    { text: "Let me just check my email first.",                         icon: 'ti ti-mail',           style: 'chip-warm'  },
    { text: "I'll batch it all together this weekend.",                  icon: 'ti ti-stack',          style: 'chip-blush' },
    { text: "I just need one good uninterrupted hour.",                  icon: 'ti ti-hourglass',      style: 'chip-bone'  },
    { text: "I've thought about it so much it practically feels done.",  icon: 'ti ti-check',          style: 'chip-mint'  },
    { text: "I work best at night. I'll do it tonight.",                 icon: 'ti ti-moon',           style: 'chip-sage'  },
  ],
  [
    { text: "I'm not procrastinating, I'm planning.",                    icon: 'ti ti-chart-bar',      style: 'chip-blush' },
    { text: "I just need to finish this one other thing first.",         icon: 'ti ti-arrow-right',    style: 'chip-warm'  },
    { text: "I've been meaning to start this for two weeks.",            icon: 'ti ti-clock',          style: 'chip-bone'  },
    { text: "I'm waiting until I actually feel like doing it.",          icon: 'ti ti-mood-smile',     style: 'chip-mint'  },
    { text: "I work better when I'm not stressed. I'm very stressed.",   icon: 'ti ti-alert-triangle', style: 'chip-blush' },
    { text: "I just need the right playlist first.",                     icon: 'ti ti-music',          style: 'chip-sage'  },
  ],
];

function buildTickerRow(chips, elementId) {
  const track = document.getElementById(elementId);
  if (!track) return;
  [...chips, ...chips].forEach(({ text, icon, style }) => {
    const el = document.createElement('div');
    el.className = `chip ${style}`;
    el.innerHTML = `<i class="${icon}" aria-hidden="true"></i><span>${text}</span>`;
    track.appendChild(el);
  });
}

// ── Hero video crossfade ──────────────────────────────────
function initHeroVideos() {
  const vids = Array.from(document.querySelectorAll('.hero-vid'));
  if (!vids.length) return;

  let current    = 0;
  let busy       = false;
  const FADE_MS  = 1800;  // must match CSS transition duration
  const CUE_SECS = 1.6;   // start crossfade this many seconds before end

  function advance() {
    if (busy) return;
    busy = true;

    const prev = current;
    current = (current + 1) % vids.length;
    const next = vids[current];

    next.currentTime = 0;
    next.play().catch(() => {});
    next.classList.add('active');

    setTimeout(() => {
      vids[prev].classList.remove('active');
      vids[prev].pause();
      busy = false;
    }, FADE_MS);
  }

  vids.forEach((vid, i) => {
    vid.addEventListener('timeupdate', () => {
      if (i !== current || !vid.duration) return;
      if (vid.currentTime >= vid.duration - CUE_SECS) advance();
    });
    vid.addEventListener('ended', () => {
      if (i === current) advance();
    });
  });

  // Kick off the first video
  vids[0].play().catch(() => {});
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

// ── How It Works — scroll-driven moments ─────────────────
function initHowSection() {
  const section = document.querySelector('.how-section');
  if (!section) return;

  const sticky       = section.querySelector('.how-sticky');
  const moments      = section.querySelectorAll('.moment');
  const screens      = section.querySelectorAll('.phone-screen');
  const dots         = section.querySelectorAll('.progress-dot');
  const progressTrack = document.getElementById('how-progress');
  const phoneFrame   = document.getElementById('how-phone-frame');

  const NUM  = 4;
  const HALF = 0.04;

  const states = [
    { bg: [14, 14, 17], text: [245, 240, 228], glow: [74, 127, 165, 0.10] },
    { bg: [14, 14, 17], text: [245, 240, 228], glow: [74, 127, 165, 0.18] },
    { bg: [14, 14, 17], text: [245, 240, 228], glow: [74, 127, 165, 0.26] },
    { bg: [14, 14, 17], text: [245, 240, 228], glow: [74, 127, 165, 0.36] },
  ];

  function lerp(a, b, t) { return a + (b - a) * t; }

  function lerpColor(c1, c2, t) {
    const r = Math.round(lerp(c1[0], c2[0], t));
    const g = Math.round(lerp(c1[1], c2[1], t));
    const b = Math.round(lerp(c1[2], c2[2], t));
    return c1.length === 4
      ? `rgba(${r},${g},${b},${+lerp(c1[3], c2[3], t).toFixed(3)})`
      : `rgb(${r},${g},${b})`;
  }

  function colorsAt(p) {
    const s = Math.max(0, Math.min(1, p)) * (states.length - 1);
    const i = Math.min(Math.floor(s), states.length - 2);
    const t = s - i;
    return {
      bg:   lerpColor(states[i].bg,   states[i + 1].bg,   t),
      text: lerpColor(states[i].text, states[i + 1].text, t),
      glow: lerpColor(states[i].glow, states[i + 1].glow, t),
    };
  }

  function momentStyle(p, idx) {
    const start = idx / NUM;
    const end   = (idx + 1) / NUM;
    let opacity = 0, ty = 30;

    if (idx === 0) {
      if (p < end - HALF)       { opacity = 1; ty = 0; }
      else if (p < end + HALF)  { const t = (p - (end - HALF)) / (2 * HALF); opacity = 1 - t; ty = -20 * t; }
      return { opacity, ty };
    }

    if (idx === NUM - 1) {
      if (p >= start + HALF)      { opacity = 1; ty = 0; }
      else if (p >= start - HALF) { const t = (p - (start - HALF)) / (2 * HALF); opacity = t; ty = 30 * (1 - t); }
      return { opacity, ty };
    }

    if      (p >= start - HALF && p < start + HALF) { const t = (p - (start - HALF)) / (2 * HALF); opacity = t;     ty = 30 * (1 - t); }
    else if (p >= start + HALF && p < end   - HALF) { opacity = 1; ty = 0; }
    else if (p >= end   - HALF && p < end   + HALF) { const t = (p - (end - HALF))   / (2 * HALF); opacity = 1 - t; ty = -20 * t; }

    return { opacity, ty };
  }

  if (phoneFrame) {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        phoneFrame.classList.add('entered');
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(section);
  }

  function update() {
    const rect      = section.getBoundingClientRect();
    const scrolled  = -rect.top;
    const range     = section.offsetHeight - window.innerHeight;
    const progress  = Math.max(0, Math.min(1, scrolled / range));

    const inView = rect.top < window.innerHeight && rect.bottom > 0;
    if (progressTrack) progressTrack.classList.toggle('visible', inView);

    const c = colorsAt(progress);
    sticky.style.background = c.bg;
    sticky.style.color      = c.text;
    if (progressTrack) progressTrack.style.color = c.text;
    if (phoneFrame) {
      phoneFrame.style.boxShadow =
        `0 0 0 1px rgba(0,0,0,0.2),0 40px 80px rgba(0,0,0,0.3),0 0 60px ${c.glow}`;
    }

    const active = Math.min(Math.floor(progress * NUM), NUM - 1);

    moments.forEach((el, i) => {
      const { opacity, ty } = momentStyle(progress, i);
      el.style.opacity   = opacity;
      el.style.transform = `translateY(${ty}px)`;
      el.classList.toggle('active', i === active);
    });
    screens.forEach((el, i) => el.classList.toggle('active', i === active));
    dots.forEach((el, i)    => el.classList.toggle('active', i === active));
  }

  update();
  window.addEventListener('scroll', update, { passive: true });
}

// ── Throttle ──────────────────────────────────────────────
function throttle(fn, ms) {
  let last = 0;
  return (...args) => { const now = Date.now(); if (now - last >= ms) { last = now; fn(...args); } };
}

// ── Init ──────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initSmoothScroll();
  initMobileNav();
  initHeroVideos();
  initHeroAnimation();
  initHeroCursorGlow();
  initScrollAnimations();
  buildTickerRow(confessionRows[0], 'ticker-row-1');
  buildTickerRow(confessionRows[1], 'ticker-row-2');
  buildTickerRow(confessionRows[2], 'ticker-row-3');
  initCarousel();
  initForm();
  initHowSection();

  updateNavState();
  window.addEventListener('scroll', throttle(updateNavState, 16), { passive: true });
});
