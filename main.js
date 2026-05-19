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

// ── Custom cursor (global, pointer-fine only) ─────────────
function initCustomCursor() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const ring = document.getElementById('cursor-ring');
  const dot  = document.getElementById('cursor-dot');
  if (!ring || !dot) return;

  const RING_HALF = 18, DOT_HALF = 2.5;
  let mx = 0, my = 0;
  let rx = 0, ry = 0;
  let visible = false;

  document.addEventListener('mousemove', e => {
    mx = e.clientX;
    my = e.clientY;
    if (!visible) {
      visible = true;
      rx = mx; ry = my;
      ring.classList.add('is-visible');
      dot.classList.add('is-visible');
    }
  });

  document.addEventListener('mouseleave', () => {
    ring.classList.remove('is-visible');
    dot.classList.remove('is-visible');
    visible = false;
  });

  document.addEventListener('mousedown', () => ring.classList.add('is-click'));
  document.addEventListener('mouseup',   () => ring.classList.remove('is-click'));

  // Expand ring over interactive elements
  document.querySelectorAll('a, button, [role="button"]').forEach(el => {
    el.addEventListener('mouseenter', () => ring.classList.add('is-hover'));
    el.addEventListener('mouseleave', () => ring.classList.remove('is-hover'));
  });

  (function tick() {
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    dot.style.transform  = `translate3d(${mx  - DOT_HALF}px,${my  - DOT_HALF}px,0)`;
    ring.style.transform = `translate3d(${rx - RING_HALF}px,${ry - RING_HALF}px,0)`;
    requestAnimationFrame(tick);
  })();
}

// ── Hero canvas glow — spring-physics orb ─────────────────
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

  // Target cursor position inside hero
  let tx = -1, ty = -1;
  let entered = false;
  // Spring glow position (lerps toward target)
  let gx, gy;

  hero.addEventListener('mousemove', e => {
    const r = hero.getBoundingClientRect();
    tx = e.clientX - r.left;
    ty = e.clientY - r.top;
    entered = true;
    if (gx === undefined) { gx = tx; gy = ty; }
  }, { passive: true });

  hero.addEventListener('mouseleave', () => { entered = false; }, { passive: true });

  let pmx = 0, pmy = 0, vel = 0, smoothVel = 0, chromaOffset = 0;

  (function draw() {
    // Init glow position to hero center on first frame
    if (gx === undefined) { gx = canvas.width * 0.5; gy = canvas.height * 0.42; }

    const targetX = entered ? tx : canvas.width  * 0.5;
    const targetY = entered ? ty : canvas.height * 0.42;
    const speed   = entered ? 0.09 : 0.025;
    gx += (targetX - gx) * speed;
    gy += (targetY - gy) * speed;

    const velX = gx - pmx;
    const velY = gy - pmy;
    pmx = gx; pmy = gy;
    vel       = Math.sqrt(velX * velX + velY * velY);
    smoothVel = smoothVel * 0.92 + vel * 0.08;
    chromaOffset = chromaOffset * 0.90 + Math.min(smoothVel * 0.10, 4) * 0.10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const W = canvas.width, H = canvas.height;

    // 1 — ambient base haze (always present, large + soft)
    const R0 = Math.min(W, H) * 0.6;
    const g0 = ctx.createRadialGradient(gx, gy, 0, gx, gy, R0);
    g0.addColorStop(0,   'rgba(160,200,255,0.055)');
    g0.addColorStop(0.5, 'rgba(100,140,255,0.022)');
    g0.addColorStop(1,   'rgba(0,0,0,0)');
    ctx.fillStyle = g0;
    ctx.fillRect(0, 0, W, H);

    // 2 — warm core orb (follows cursor tightly)
    const R1 = 220 + smoothVel * 1.2;
    const g1 = ctx.createRadialGradient(gx, gy, 0, gx, gy, R1);
    g1.addColorStop(0,   `rgba(255,245,200,${0.10 + smoothVel * 0.0012})`);
    g1.addColorStop(0.3, `rgba(255,200,100,${0.045 + smoothVel * 0.0006})`);
    g1.addColorStop(1,   'rgba(255,160,40,0)');
    ctx.fillStyle = g1;
    ctx.fillRect(0, 0, W, H);

    // 3 — cool blue halo (leads the direction of movement)
    const ox = velX * 2.8;
    const oy = velY * 2.8;
    const R2 = 320 + smoothVel * 0.9;
    const g2 = ctx.createRadialGradient(gx + ox, gy + oy, 0, gx + ox, gy + oy, R2);
    g2.addColorStop(0,   `rgba(80,140,255,${0.06 + smoothVel * 0.0008})`);
    g2.addColorStop(0.5, `rgba(60,100,255,0.025)`);
    g2.addColorStop(1,   'rgba(40,60,255,0)');
    ctx.fillStyle = g2;
    ctx.fillRect(0, 0, W, H);

    // 4 — amber trail (lags behind, opposite direction)
    const R3 = 260 + smoothVel * 0.7;
    const g3 = ctx.createRadialGradient(gx - ox * 0.5, gy - oy * 0.5, 0, gx - ox * 0.5, gy - oy * 0.5, R3);
    g3.addColorStop(0,   `rgba(255,130,60,${0.05 + smoothVel * 0.0006})`);
    g3.addColorStop(1,   'rgba(255,80,0,0)');
    ctx.fillStyle = g3;
    ctx.fillRect(0, 0, W, H);

    // Chromatic aberration on headline (fast movement only)
    if (headline) {
      headline.style.filter = chromaOffset < 0.25
        ? ''
        : `drop-shadow(${chromaOffset}px 0 rgba(255,40,80,0.28)) drop-shadow(${-chromaOffset}px 0 rgba(40,180,255,0.28))`;
    }

    requestAnimationFrame(draw);
  })();
}

// ── Hero parallax — content vs video depth ─────────────────
function initHeroParallax() {
  if (!window.matchMedia('(pointer: fine)').matches) return;
  const hero     = document.getElementById('hero');
  const inner    = hero && hero.querySelector('.hero-inner');
  const videoBg  = hero && hero.querySelector('.hero-video-bg');
  if (!hero || !inner) return;

  let itx = 0, ity = 0;   // inner target
  let icx = 0, icy = 0;   // inner current
  let vtx = 0, vty = 0;   // video target
  let vcx = 0, vcy = 0;   // video current

  hero.addEventListener('mousemove', e => {
    const r  = hero.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width  - 0.5;   // −0.5 → 0.5
    const py = (e.clientY - r.top)  / r.height - 0.5;
    itx =  px * 16;   vty =  py * 12;   // inner follows cursor
    ity =  py * 10;   vtx =  px * 14;
    vtx = -px * 22;   // video moves opposite (depth illusion)
    vty = -py * 16;
  }, { passive: true });

  hero.addEventListener('mouseleave', () => {
    itx = ity = vtx = vty = 0;
  }, { passive: true });

  (function tick() {
    icx += (itx - icx) * 0.08;
    icy += (ity - icy) * 0.08;
    vcx += (vtx - vcx) * 0.05;
    vcy += (vty - vcy) * 0.05;

    inner.style.transform = `translate3d(${icx}px,${icy}px,0)`;
    if (videoBg) videoBg.style.transform = `translate3d(${vcx}px,${vcy}px,0) scale(1.06)`;

    requestAnimationFrame(tick);
  })();
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
  const stage   = scene && scene.parentElement;
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

  function getCardWidth() {
    const w = window.innerWidth;
    if (w <= 600) return 280;
    if (w <= 900) return 340;
    return 460;
  }

  function hexToRgb(hex) {
    return [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ].join(',');
  }

  // Circular signed offset: how far card i is from active (-N/2 … N/2)
  function getOffset(i) {
    let off = i - active;
    while (off >  N / 2) off -= N;
    while (off < -N / 2) off += N;
    return off;
  }

  // Build cards
  carouselCards.forEach((c, i) => {
    const card = document.createElement('div');
    card.className = 'carousel-card';
    card.dataset.index = i;
    card.innerHTML = `
      <div class="card-dot" style="background:${c.color};box-shadow:0 0 16px ${c.color}66"></div>
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

  function goTo(idx) {
    active = ((idx % N) + N) % N;
    const cw = getCardWidth();

    rotor.querySelectorAll('.carousel-card').forEach((card, i) => {
      const off = getOffset(i);
      const abs = Math.abs(off);
      const sign = off < 0 ? -1 : off > 0 ? 1 : 0;

      let tx, ry, tz, rz, scale, opacity, zIndex, bg, border, shadow;

      if (abs === 0) {
        tx = 0;                   ry =  0;   tz =   0; rz = 1.9; scale = 1;    opacity = 1;    zIndex = 10;
        bg     = '#0e0f11';
        border = 'rgba(255,255,255,0.13)';
        shadow = '0 28px 72px rgba(0,0,0,0.80)';
      } else if (abs === 1) {
        tx = sign * cw * 1.08;   ry = sign * 50; tz = -50; rz = 0; scale = 0.88; opacity = 0.75; zIndex = 6;
        bg     = '#0b0b0e';
        border = 'rgba(255,255,255,0.07)';
        shadow = '0 18px 50px rgba(0,0,0,0.65)';
      } else if (abs === 2) {
        tx = sign * cw * 1.95;   ry = sign * 65; tz = -120; rz = 0; scale = 0.7; opacity = 0.28; zIndex = 3;
        bg     = '#090912';
        border = 'rgba(255,255,255,0.04)';
        shadow = '0 14px 36px rgba(0,0,0,0.55)';
      } else {
        tx = sign * cw * 2.6;    ry = sign * 75; tz = -200; rz = 0; scale = 0.5; opacity = 0;    zIndex = 0;
        bg     = '#080810';
        border = 'rgba(255,255,255,0.02)';
        shadow = 'none';
      }

      card.style.transform     = `translateX(${tx}px) rotateY(${ry}deg) translateZ(${tz}px) scale(${scale}) rotateZ(${rz}deg)`;
      card.style.opacity       = String(opacity);
      card.style.zIndex        = String(zIndex);
      card.style.background    = bg;
      card.style.borderColor   = border;
      card.style.boxShadow     = shadow;
      card.style.pointerEvents = abs === 0 ? 'auto' : 'none';
    });

    pipsEl.querySelectorAll('.carousel-pip').forEach((pip, i) => {
      const on = i === active;
      pip.classList.toggle('is-active', on);
      pip.style.background = on ? carouselCards[i].color : '';
    });

    const rgb = hexToRgb(carouselCards[active].color);
    glowEl.style.background =
      `radial-gradient(ellipse 72% 60% at 50% 50%, rgba(${rgb},0.16), transparent 62%)`;
  }

  prevBtn.addEventListener('click', () => goTo(active - 1));
  nextBtn.addEventListener('click', () => goTo(active + 1));

  // Touch — listen on the full stage so side cards are swipeable
  const dragTarget = stage || scene;
  dragTarget.addEventListener('touchstart', e => {
    touchStartX = e.touches[0].clientX;
  }, { passive: true });
  dragTarget.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dx) > 36) goTo(active + (dx < 0 ? 1 : -1));
  }, { passive: true });

  // Mouse drag
  dragTarget.addEventListener('mousedown', e => { mouseStartX = e.clientX; isDragging = true; });
  dragTarget.addEventListener('mouseup', e => {
    if (!isDragging) return;
    isDragging = false;
    const dx = e.clientX - mouseStartX;
    if (Math.abs(dx) > 36) goTo(active + (dx < 0 ? 1 : -1));
  });
  dragTarget.addEventListener('mouseleave', () => { isDragging = false; });

  // Keyboard
  document.addEventListener('keydown', e => {
    const sf = document.getElementById('features');
    if (!sf) return;
    const r = sf.getBoundingClientRect();
    if (r.top > window.innerHeight || r.bottom < 0) return;
    if (e.key === 'ArrowLeft')  goTo(active - 1);
    if (e.key === 'ArrowRight') goTo(active + 1);
  });

  // Reposition on resize
  window.addEventListener('resize', () => goTo(active));

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

// ── Waitlist — Supabase + Resend ─────────────────────────
class DuplicateError extends Error {
  constructor() { super('duplicate'); this.name = 'DuplicateError'; }
}

async function insertWaitlistEntry(name, email) {
  const res = await fetch('https://uxgxlpvtkwopiytjvomi.supabase.co/rest/v1/waitlist', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'apikey':        window.__KINDA_SUPABASE_KEY__,
      'Authorization': `Bearer ${window.__KINDA_SUPABASE_KEY__}`,
      'Prefer':        'return=minimal',
    },
    body: JSON.stringify({ name, email, joined_at: new Date().toISOString() }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (err.code === '23505') throw new DuplicateError();
    throw new Error(`Supabase error ${res.status}`);
  }
}

async function sendConfirmationEmail(name, email) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${window.__KINDA_RESEND_KEY__}`,
    },
    body: JSON.stringify({
      from:    'Kinda <hello@kinda-app.com>',
      to:      [email],
      subject: "You're on the Kinda waitlist",
      html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
body{margin:0;padding:0;background:#0D2535;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif}
.wrap{max-width:520px;margin:0 auto;padding:48px 32px}
.logo{font-size:22px;font-weight:700;color:#ffffff;letter-spacing:-0.02em;margin-bottom:40px}
.pill{display:inline-block;background:rgba(126,200,227,0.12);color:#7EC8E3;font-size:12px;letter-spacing:0.08em;padding:6px 14px;border-radius:20px;margin-bottom:24px}
.headline{font-size:28px;font-weight:600;color:#ffffff;line-height:1.2;margin:0 0 16px}
.body{font-size:15px;color:rgba(255,255,255,0.62);line-height:1.7;margin:0 0 32px}
.divider{border:none;border-top:1px solid rgba(255,255,255,0.08);margin:32px 0}
.footer{font-size:12px;color:rgba(255,255,255,0.25);line-height:1.6}
</style>
</head>
<body>
<div class="wrap">
  <div class="logo">Kinda</div>
  <p class="pill">Founding member</p>
  <h1 class="headline">Hey ${name}, you're in.</h1>
  <p class="body">You're on the Kinda waitlist. We're building something that actually works with how your mind works — not against it.<br><br>We'll reach out personally when your spot is ready. No noise, no newsletters. Just a message when it's time.</p>
  <hr class="divider"/>
  <p class="footer">Kinda · kinda-app.com<br>You're receiving this because you joined the waitlist at kinda-app.com.</p>
</div>
</body>
</html>`,
    }),
  });
  if (!res.ok) console.warn('Resend failed:', await res.text().catch(() => ''));
}

function initForm() {
  const form       = document.getElementById('waitlist-form');
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
      await insertWaitlistEntry(nameVal, emailVal);
      await sendConfirmationEmail(nameVal, emailVal);
      formWrap.style.display = 'none';
      confirm.classList.add('visible');
    } catch (err) {
      if (err instanceof DuplicateError) {
        showError(emailError, emailInput, "You're already on the list — we'll be in touch.");
      } else {
        showError(emailError, emailInput, 'Something went wrong. Please try again.');
        console.error('Waitlist error:', err);
      }
    } finally {
      submitBtn.classList.remove('loading');
      submitBtn.disabled = false;
    }
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
  initCustomCursor();
  initHeroCursorGlow();
  initHeroParallax();
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
