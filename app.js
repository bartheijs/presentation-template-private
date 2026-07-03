/*
 * Presentation logic: rendering, navigation, timer, confetti, template overlay.
 * Classic script (not a module) so this keeps working when opened via file://.
 * Depends on SLIDES / SKILL_TEMPLATE_SECTIONS from slides-data.js, loaded first.
 */

/* ---------- Small helpers ---------- */

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function inlineMarkdown(str) {
  return escapeHtml(str)
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
}

function renderNotesHTML(notesText) {
  return notesText
    .split(/```/)
    .map((chunk, i) => {
      if (i % 2 === 1) {
        return `<pre class="notes-code"><code>${escapeHtml(chunk.trim())}</code></pre>`;
      }
      return chunk
        .trim()
        .split(/\n\n+/)
        .filter(Boolean)
        .map((block) => {
          const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
          if (lines.length && lines.every((l) => /^[-*]\s/.test(l))) {
            return `<ul>${lines.map((l) => `<li>${inlineMarkdown(l.replace(/^[-*]\s/, ''))}</li>`).join('')}</ul>`;
          }
          if (lines.length && lines.every((l) => /^\d+\.\s/.test(l))) {
            return `<ol>${lines.map((l) => `<li>${inlineMarkdown(l.replace(/^\d+\.\s/, ''))}</li>`).join('')}</ol>`;
          }
          return `<p>${inlineMarkdown(block)}</p>`;
        })
        .join('');
    })
    .join('');
}

/* ---------- State ---------- */

const state = { currentIndex: 0 };

const slideStageEl = document.getElementById('slide-stage');
const slideContentEl = document.getElementById('slide-content');
const slideNotesEl = document.getElementById('slide-notes');
const slideProgressEl = document.getElementById('slide-progress');
const tocListEl = document.getElementById('toc-list');
const overlayEl = document.getElementById('template-overlay');
const overlayBodyEl = document.getElementById('overlay-body');
const finishOverlayEl = document.getElementById('finish-overlay');

/* ---------- Rendering ---------- */

function buildSlideContentHTML(slide) {
  const bulletsBlock = slide.bullets.length
    ? `<ul class="slide-bullets">
        ${slide.bullets
          .map(
            (b) => `<li><svg class="icon icon--fill"><use href="#icon-spark"></use></svg><span>${inlineMarkdown(b)}</span></li>`
          )
          .join('')}
      </ul>`
    : '';
  const templateBlock = slide.isTemplateAnchor
    ? `<pre class="slide-template-code"><code>${escapeHtml(SKILL_TEMPLATE_MD)}</code></pre>`
    : '';
  return `
    <div class="slide-heading">
      <svg class="icon"><use href="#icon-${slide.icon}"></use></svg>
      <h1>${escapeHtml(slide.title)}</h1>
    </div>
    ${bulletsBlock}
    ${templateBlock}`;
}

function renderSlide() {
  const slide = SLIDES[state.currentIndex];
  slideContentEl.className = 'slide-content' + (slide.isTemplateAnchor ? ' slide-content--compact' : '');
  slideContentEl.innerHTML = buildSlideContentHTML(slide);
  const hasNotes = Boolean(slide.notes && slide.notes.trim());
  slideNotesEl.hidden = !hasNotes;
  slideStageEl.classList.toggle('stage-no-notes', !hasNotes);
  slideNotesEl.innerHTML = hasNotes ? renderNotesHTML(slide.notes) : '';
  slideProgressEl.textContent = `${state.currentIndex + 1} / ${SLIDES.length}`;
  slideContentEl.scrollTop = 0;
  slideNotesEl.scrollTop = 0;
}

function renderTocOnce() {
  tocListEl.innerHTML = SLIDES.map(
    (s, i) => `
      <button class="toc-item" data-index="${i}" type="button">
        <span class="toc-num">${String(i + 1).padStart(2, '0')}</span>
        <span class="toc-title">${escapeHtml(s.title)}</span>
      </button>`
  ).join('');
}

function updateTocActiveState() {
  document.querySelectorAll('.toc-item').forEach((el, i) => {
    el.classList.toggle('is-active', i === state.currentIndex);
  });
  const active = document.querySelector('.toc-item.is-active');
  if (active) active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
}

/* ---------- Navigation ---------- */

function goTo(index, { animate = false, direction = null } = {}) {
  if (index < 0 || index >= SLIDES.length || index === state.currentIndex) return;
  if (animate && isAnimatingSlide) return; // ignore rapid double-triggers mid-transition
  const dir = direction || (index > state.currentIndex ? 'next' : 'prev');
  state.currentIndex = index;
  if (animate) {
    animateTransition(dir, renderSlide);
  } else {
    renderSlide();
  }
  updateTocActiveState();
}

/* Content up / notes down (out, 280ms) -> swap content while off-screen ->
 * content down / notes up (in, 420ms). The disco-bg layer behind them is
 * sequenced independently on its own explicit delays, deliberately timed
 * so it (a) appears a beat after the panels start leaving, not instantly,
 * and (b) is fully faded out well before the panels finish landing — with
 * a comfortable buffer, not a race against the panels' own transition. */
let isAnimatingSlide = false;
const ANIM_OUT_MS = 280;
const ANIM_IN_MS = 420;
const DISCO_REVEAL_DELAY_MS = 90; // background starts fading in this long after "out" begins
const DISCO_HIDE_LEAD_MS = 260; // start hiding the background this long before the panels land

function animateTransition(dir, applyFn) {
  isAnimatingSlide = true;
  slideContentEl.classList.add('content-anim-out');
  if (!slideNotesEl.hidden) slideNotesEl.classList.add('notes-anim-out');

  const revealTimer = setTimeout(() => slideStageEl.classList.add('is-transitioning'), DISCO_REVEAL_DELAY_MS);

  slideContentEl.addEventListener(
    'animationend',
    function onOut() {
      slideContentEl.removeEventListener('animationend', onOut);
      clearTimeout(revealTimer);
      // Swap in the new slide's content WHILE still hidden by the "out"
      // classes (which hold the panel off-screen via animation-fill-mode:
      // forwards). renderSlide() forces a synchronous reflow (scrollTop),
      // so if we removed the "out" classes first, that reflow could catch
      // the panel mid-snap-back to its normal (visible, in-place) resting
      // style and paint a one-frame flash before the "in" class re-hides
      // it. Doing the swap first, then flipping classes back-to-back with
      // nothing forcing a reflow in between, avoids that flash entirely.
      applyFn();
      slideContentEl.classList.remove('content-anim-out');
      slideNotesEl.classList.remove('notes-anim-out');
      slideContentEl.classList.add('content-anim-in');
      if (!slideNotesEl.hidden) slideNotesEl.classList.add('notes-anim-in');

      const hideDelay = Math.max(0, ANIM_IN_MS - DISCO_HIDE_LEAD_MS);
      setTimeout(() => slideStageEl.classList.remove('is-transitioning'), hideDelay);

      slideContentEl.addEventListener(
        'animationend',
        () => {
          slideContentEl.classList.remove('content-anim-in');
          slideNotesEl.classList.remove('notes-anim-in');
          isAnimatingSlide = false;
        },
        { once: true }
      );
    },
    { once: true }
  );
}

document.getElementById('btn-next').addEventListener('click', () =>
  goTo(state.currentIndex + 1, { animate: true, direction: 'next' })
);
document.getElementById('btn-prev').addEventListener('click', () =>
  goTo(state.currentIndex - 1, { animate: true, direction: 'prev' })
);

document.addEventListener('keydown', (e) => {
  if (!finishOverlayEl.hidden) return;
  if (e.key === 'ArrowDown') {
    e.preventDefault();
    if (overlayEl.hidden) openTemplateOverlay();
    return;
  }
  if (e.key === 'ArrowUp') {
    e.preventDefault();
    if (!overlayEl.hidden) closeTemplateOverlay();
    return;
  }
  if (!overlayEl.hidden) return;
  if (e.key === 'ArrowRight') goTo(state.currentIndex + 1, { animate: true, direction: 'next' });
  if (e.key === 'ArrowLeft') goTo(state.currentIndex - 1, { animate: true, direction: 'prev' });
});

tocListEl.addEventListener('click', (e) => {
  const item = e.target.closest('.toc-item');
  if (!item) return;
  goTo(Number(item.dataset.index), { animate: false });
});

/* ---------- Timer ---------- */

const THIRTY_MIN_MS = 30 * 60 * 1000;
const FIVE_MIN_MS = 5 * 60 * 1000;

const timer = {
  remainingMs: THIRTY_MIN_MS,
  running: false,
  endAt: null,
  intervalId: null,
  firedZero: false,
};

const timerDisplayEl = document.getElementById('timer-display');
const timerToggleBtn = document.getElementById('btn-timer-toggle');

function renderTimerDisplay() {
  const totalSec = Math.ceil(timer.remainingMs / 1000);
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  timerDisplayEl.textContent = `${m}:${s}`;
}

function timerStart() {
  if (timer.running) return;
  timer.running = true;
  timer.endAt = Date.now() + timer.remainingMs;
  timer.intervalId = setInterval(timerTick, 250);
  timerToggleBtn.textContent = 'Pause';
}

function timerPause() {
  if (!timer.running) return;
  timer.running = false;
  clearInterval(timer.intervalId);
  timer.remainingMs = Math.max(0, timer.endAt - Date.now());
  timerToggleBtn.textContent = 'Start';
}

function timerAddFive() {
  if (timer.running) {
    const remaining = Math.max(0, timer.endAt - Date.now());
    timer.endAt = Date.now() + Math.min(THIRTY_MIN_MS, remaining + FIVE_MIN_MS);
  } else {
    timer.remainingMs = Math.min(THIRTY_MIN_MS, timer.remainingMs + FIVE_MIN_MS);
  }
  timer.firedZero = false;
  renderTimerDisplay();
}

function timerTick() {
  timer.remainingMs = Math.max(0, timer.endAt - Date.now());
  renderTimerDisplay();
  if (timer.remainingMs <= 0) {
    clearInterval(timer.intervalId);
    timer.running = false;
    timerToggleBtn.textContent = 'Start';
    if (!timer.firedZero) {
      timer.firedZero = true;
      launchConfetti();
    }
  }
}

timerToggleBtn.addEventListener('click', () => (timer.running ? timerPause() : timerStart()));
document.getElementById('btn-timer-add5').addEventListener('click', timerAddFive);

renderTimerDisplay();

/* ---------- Confetti ----------
 * Dependency-free canvas particle system. Confetti falls slowly and, instead
 * of disappearing off the bottom, settles into a pile that keeps growing —
 * spawning continues in the background until the pile fills the screen.
 * Settled particles are baked onto an offscreen canvas so the "in flight"
 * array stays small no matter how long it runs.
 */

const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
const CONFETTI_COLORS = ['#FF3D6E', '#FFB703', '#06D6A0', '#3AB0FF', '#8657FF'];
const PILE_COLUMN_WIDTH = 4;
const SPAWN_INTERVAL_MS = 200;
const SPAWN_BATCH_SIZE = 10;
const CONFETTI_GRAVITY = 0.025;
const CONFETTI_MAX_VY = 2.2;

let confettiActive = false;
let confettiSpawnIntervalId = null;
let confettiRafId = null;
let fallingParticles = [];
let pileHeights = null;
let settledCanvas = null;
let settledCtx = null;

function ensureConfettiBuffers() {
  const dpr = window.devicePixelRatio || 1;
  confettiCanvas.width = window.innerWidth * dpr;
  confettiCanvas.height = window.innerHeight * dpr;
  confettiCanvas.style.width = window.innerWidth + 'px';
  confettiCanvas.style.height = window.innerHeight + 'px';
  confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  if (!settledCanvas) {
    settledCanvas = document.createElement('canvas');
    settledCtx = settledCanvas.getContext('2d');
  }
  settledCanvas.width = window.innerWidth * dpr;
  settledCanvas.height = window.innerHeight * dpr;
  settledCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

  pileHeights = new Float32Array(Math.ceil(window.innerWidth / PILE_COLUMN_WIDTH));
}
window.addEventListener('resize', () => {
  if (settledCanvas) ensureConfettiBuffers();
});

function makeConfettiParticle() {
  return {
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * 200,
    vx: (Math.random() - 0.5) * 1.2,
    vy: 0.3 + Math.random() * 0.6,
    size: 6 + Math.random() * 7,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 6,
    shape: Math.random() < 0.5 ? 'rect' : 'circle',
  };
}

function pileHeightAt(x) {
  const col = Math.min(pileHeights.length - 1, Math.max(0, Math.floor(x / PILE_COLUMN_WIDTH)));
  return pileHeights[col];
}

function raisePileAt(x, size) {
  const spanCols = Math.max(1, Math.round(size / PILE_COLUMN_WIDTH));
  const centerCol = Math.floor(x / PILE_COLUMN_WIDTH);
  const bump = size * 0.45;
  for (let c = centerCol - spanCols; c <= centerCol + spanCols; c++) {
    if (c >= 0 && c < pileHeights.length) {
      pileHeights[c] = Math.min(window.innerHeight, pileHeights[c] + bump / (spanCols * 2 + 1));
    }
  }
}

function drawParticle(ctx, p) {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate((p.rotation * Math.PI) / 180);
  ctx.fillStyle = p.color;
  if (p.shape === 'rect') {
    ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function isPileFull() {
  let minHeight = Infinity;
  for (let i = 0; i < pileHeights.length; i += 20) minHeight = Math.min(minHeight, pileHeights[i]);
  return minHeight >= window.innerHeight * 0.92;
}

function spawnConfettiBatch(count) {
  for (let i = 0; i < count; i++) fallingParticles.push(makeConfettiParticle());
}

function launchConfetti(burstCount = 60) {
  if (!settledCanvas) ensureConfettiBuffers();
  spawnConfettiBatch(burstCount);
  if (!confettiActive) {
    confettiActive = true;
    confettiSpawnIntervalId = setInterval(() => {
      if (isPileFull()) return;
      spawnConfettiBatch(SPAWN_BATCH_SIZE);
    }, SPAWN_INTERVAL_MS);
  }
  if (!confettiRafId) confettiRafId = requestAnimationFrame(confettiLoop);
}

function confettiLoop() {
  confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  confettiCtx.drawImage(settledCanvas, 0, 0, window.innerWidth, window.innerHeight);

  for (let i = fallingParticles.length - 1; i >= 0; i--) {
    const p = fallingParticles[i];
    p.vy = Math.min(CONFETTI_MAX_VY, p.vy + CONFETTI_GRAVITY);
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotationSpeed;

    if (p.x < -20) p.x = window.innerWidth + 20;
    if (p.x > window.innerWidth + 20) p.x = -20;

    const floor = window.innerHeight - pileHeightAt(p.x);
    if (p.y + p.size / 2 >= floor) {
      p.y = floor - p.size / 2;
      drawParticle(settledCtx, p);
      raisePileAt(p.x, p.size);
      fallingParticles.splice(i, 1);
    }
  }

  for (const p of fallingParticles) drawParticle(confettiCtx, p);

  confettiRafId = confettiActive ? requestAnimationFrame(confettiLoop) : null;
}

function stopConfetti() {
  confettiActive = false;
  if (confettiSpawnIntervalId) {
    clearInterval(confettiSpawnIntervalId);
    confettiSpawnIntervalId = null;
  }
  if (confettiRafId) {
    cancelAnimationFrame(confettiRafId);
    confettiRafId = null;
  }
  fallingParticles = [];
  if (pileHeights) pileHeights.fill(0);
  if (settledCtx) settledCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
}

/* ---------- Skill template overlay ---------- */

function renderTemplateOverlay(highlightId) {
  const blocks = SKILL_TEMPLATE_SECTIONS.map((s) => {
    const [headingLine, ...rest] = s.body.split('\n');
    const highlightClass = s.id === highlightId ? ' is-highlighted' : '';
    return `<span class="tpl-block tpl-block--${s.id}${highlightClass}"><span class="tpl-heading">${escapeHtml(headingLine)}</span>${
      rest.length ? '\n' + escapeHtml(rest.join('\n')) : ''
    }</span>`;
  });
  overlayBodyEl.innerHTML = `<pre class="template-code"><code>${blocks.join('\n\n')}</code></pre>`;
}

function openTemplateOverlay() {
  const slide = SLIDES[state.currentIndex];
  const slideNum = state.currentIndex + 1;
  const highlight = slideNum >= 17 && slideNum <= 28 ? slide.templateSection : null;
  renderTemplateOverlay(highlight);
  overlayEl.hidden = false;
}

function closeTemplateOverlay() {
  overlayEl.hidden = true;
}

document.getElementById('btn-template').addEventListener('click', openTemplateOverlay);
document.getElementById('btn-overlay-close').addEventListener('click', closeTemplateOverlay);
overlayEl.addEventListener('click', (e) => {
  if (e.target === overlayEl) closeTemplateOverlay();
});

/* ---------- Finish celebration overlay ---------- */

function openFinishOverlay() {
  finishOverlayEl.hidden = false;
}

function closeFinishOverlay() {
  finishOverlayEl.hidden = true;
  stopConfetti();
}

document.getElementById('btn-timer-finish').addEventListener('click', () => {
  launchConfetti();
  openFinishOverlay();
});
document.getElementById('btn-finish-close').addEventListener('click', closeFinishOverlay);
document.getElementById('btn-finish-back').addEventListener('click', closeFinishOverlay);
finishOverlayEl.addEventListener('click', (e) => {
  if (e.target === finishOverlayEl) closeFinishOverlay();
});

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!finishOverlayEl.hidden) closeFinishOverlay();
  else if (!overlayEl.hidden) closeTemplateOverlay();
});

/* ---------- Init ---------- */

renderTocOnce();
renderSlide();
updateTocActiveState();
