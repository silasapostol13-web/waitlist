// The product name lives in one place. Change it here (and in index.html's <title>).
const NAME = 'Atrium';
// The waitlist lives in Supabase; this function saves the email and sends the welcome note.
const JOIN_URL = 'https://sktijuymegpekryxgull.supabase.co/functions/v1/join';
document.querySelectorAll('[data-name]').forEach(el => { el.textContent = NAME; });

/* ---------- orbs: the same Thinking Orbs engine the app uses, in its colors ---------- */
const INK = [[34, 199, 255], [47, 91, 255], [138, 92, 255]], PAPER = [244, 246, 251];
function ink(x, white, a) {
  const u = Math.min(1, Math.max(0, x)), k = u < .5 ? 0 : 1, f = u < .5 ? u * 2 : (u - .5) * 2, A = INK[k], B = INK[k + 1];
  const w = Math.min(1, Math.max(0, white)) * .5;
  const c = i => { const base = A[i] + (B[i] - A[i]) * f; return Math.round(base + (PAPER[i] - base) * w); };
  return `rgba(${c(0)},${c(1)},${c(2)},${a ?? 1})`;
}
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

function orb(canvas, stateFor) {
  const g = canvas.getContext('2d');
  let prev = null, cur = stateFor(), switchedAt = 0;
  const t0 = performance.now();
  function frame(now) {
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(2, devicePixelRatio || 1), W = Math.round(box.width * dpr);
    if (canvas.width !== W) { canvas.width = W; canvas.height = W; }
    const t = reduce ? 2 : (now - t0) / 1000;
    const want = stateFor();
    if (want !== cur) { prev = cur; cur = want; switchedAt = t; }
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, W, W);
    const s = W / 64; g.setTransform(s, 0, 0, s, 0, 0);
    const fade = prev ? Math.min(1, (t - switchedAt) / .45) : 1;
    if (prev && fade < 1) draw(prev, t, 1 - fade); else prev = null;
    draw(cur, t, fade);
    if (!reduce) requestAnimationFrame(frame);
  }
  function draw(state, t, alpha) {
    const { mode, speed, opts } = ThinkingOrbs.resolvePreset(state, 64);
    const { dots, lines } = ThinkingOrbs.MODE_FRAMES[mode](64, t * speed, opts);
    g.globalAlpha = alpha;
    for (const l of lines) { g.strokeStyle = ink((l.x1 + l.x2) / 128, l.white, l.a); g.lineWidth = l.w; g.beginPath(); g.moveTo(l.x1, l.y1); g.lineTo(l.x2, l.y2); g.stroke(); }
    for (const d of dots) { g.fillStyle = ink(d.x / 64, d.white, d.a); g.beginPath(); g.arc(d.x, d.y, d.r, 0, 6.2832); g.fill(); }
    g.globalAlpha = 1;
  }
  requestAnimationFrame(frame);
}

let heroState = 'breathing';
orb(document.getElementById('heroOrb'), () => heroState);

// the story orb walks through what the AI does, every few seconds
const storyStates = ['searching', 'weaving', 'composing', 'working', 'breathing'];
let storyIndex = 0;
orb(document.getElementById('storyOrb'), () => storyStates[storyIndex]);
if (!reduce) setInterval(() => { storyIndex = (storyIndex + 1) % storyStates.length; }, 3200);

/* ---------- the orbit: icons circle the orb on a tilted ring ---------- */
orb(document.getElementById('orbitOrb'), () => 'connecting');
(function orbit() {
  const box = document.getElementById('orbit'); if (!box) return;
  const icons = [...box.querySelectorAll('.ai')];
  let spread = reduce ? 1 : 0, seen = false;
  new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) seen = true; }), { threshold: .3 }).observe(box);
  const t0 = performance.now();
  function frame(now) {
    if (seen && spread < 1) spread = Math.min(1, spread + 0.012);
    const s = 1 - Math.pow(1 - spread, 3);
    const t = reduce ? 0.6 : (now - t0) / 1000, spin = t * 0.55;
    icons.forEach((el, i) => {
      const a = spin + i * 2 * Math.PI / icons.length, depth = (Math.sin(a) + 1) / 2;
      el.style.transform = `translate(${Math.cos(a) * 270 * s}%, ${Math.sin(a) * 105 * s}%) scale(${(.62 + .42 * depth) * Math.max(.01, s)})`;
      el.style.zIndex = depth > .5 ? 5 : 1;
      el.style.filter = `blur(${(1 - depth) * 1.6}px)`;
      el.style.opacity = Math.min(1, s * 1.4) * (.55 + .45 * depth);
    });
    if (!reduce) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();

/* ---------- videos only play while on screen ---------- */
const io = new IntersectionObserver(entries => {
  for (const e of entries) e.isIntersecting ? e.target.play().catch(() => {}) : e.target.pause();
}, { threshold: .25 });
document.querySelectorAll('video').forEach(v => io.observe(v));
// skip the blank launch frames at the start of a clip, including on every loop
document.querySelectorAll('video[data-start]').forEach(v => {
  const start = Number(v.dataset.start);
  v.addEventListener('timeupdate', () => { if (v.currentTime < start) v.currentTime = start; });
});

/* ---------- connector logos: a neat monogram until the real file is in place ---------- */
document.querySelectorAll('.connector img, .works img').forEach(img => {
  const swap = () => {
    const m = document.createElement('i');
    m.className = 'mono ' + (img.dataset.brand || '');
    m.textContent = img.dataset.fallback || '•';
    m.title = img.alt || '';
    img.replaceWith(m);
  };
  // it may have failed before this script ran
  if (img.complete && img.naturalWidth === 0) swap(); else img.addEventListener('error', swap, { once: true });
});

/* ---------- waitlist ---------- */
const form = document.getElementById('waitlist');
const note = document.getElementById('formnote');
const emailInput = document.getElementById('email');
let ai = '';
document.querySelectorAll('.connector').forEach(b => b.addEventListener('click', () => {
  ai = b.dataset.ai;
  document.querySelectorAll('.connector').forEach(x => x.setAttribute('aria-checked', x === b ? 'true' : 'false'));
  emailInput.focus();
}));

function say(text, kind) { note.textContent = text; note.className = 'formnote' + (kind ? ' ' + kind : ''); }

form.addEventListener('submit', async e => {
  e.preventDefault();
  const email = emailInput.value.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { say('That email doesn’t look right.', 'err'); emailInput.focus(); return; }
  const button = form.querySelector('button[type=submit]');
  button.disabled = true; heroState = 'working'; say('Adding you…');
  try {
    const res = await fetch(JOIN_URL, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, ai, company: form.company.value }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok || !body.ok) throw new Error(body.error || 'Something went wrong. Try again in a minute.');
    form.classList.add('done');
    say(body.already ? 'You’re already on the list. We’ll be in touch.' : 'You’re in. Check your inbox.', 'ok');
    heroState = 'solving';
    setTimeout(() => { heroState = 'breathing'; }, 4200);
  } catch (err) {
    say(err.message, 'err'); heroState = 'breathing'; button.disabled = false;
  }
});
