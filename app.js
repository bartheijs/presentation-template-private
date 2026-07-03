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

/* ---------- Rendering ---------- */

function buildSlideContentHTML(slide) {
  return `
    <div class="slide-heading">
      <svg class="icon"><use href="#icon-${slide.icon}"></use></svg>
      <h1>${escapeHtml(slide.title)}</h1>
    </div>
    <ul class="slide-bullets">
      ${slide.bullets
        .map(
          (b) => `<li><svg class="icon icon--fill"><use href="#icon-spark"></use></svg><span>${inlineMarkdown(b)}</span></li>`
        )
        .join('')}
    </ul>`;
}

function renderSlide() {
  const slide = SLIDES[state.currentIndex];
  slideContentEl.innerHTML = buildSlideContentHTML(slide);
  slideNotesEl.innerHTML = renderNotesHTML(slide.notes);
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
  const dir = direction || (index > state.currentIndex ? 'next' : 'prev');
  state.currentIndex = index;
  if (animate) {
    animateTransition(dir, renderSlide);
  } else {
    renderSlide();
  }
  updateTocActiveState();
}

function animateTransition(dir, applyFn) {
  const outClass = dir === 'next' ? 'anim-out-left' : 'anim-out-right';
  const inClass = dir === 'next' ? 'anim-in-right' : 'anim-in-left';
  slideStageEl.classList.add(outClass);
  slideStageEl.addEventListener(
    'animationend',
    function onOut() {
      slideStageEl.removeEventListener('animationend', onOut);
      slideStageEl.classList.remove(outClass);
      applyFn();
      slideStageEl.classList.add(inClass);
      slideStageEl.addEventListener('animationend', () => slideStageEl.classList.remove(inClass), { once: true });
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
    timer.endAt += FIVE_MIN_MS;
  } else {
    timer.remainingMs += FIVE_MIN_MS;
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
document.getElementById('btn-timer-finish').addEventListener('click', () => launchConfetti());

renderTimerDisplay();

/* ---------- Confetti (dependency-free canvas particle system) ---------- */

const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas.getContext('2d');
const CONFETTI_COLORS = ['#FF3D6E', '#FFB703', '#06D6A0', '#3AB0FF', '#8657FF'];
const CONFETTI_DURATION_MS = 4000;
let confettiParticles = [];
let confettiRafId = null;
let confettiStartedAt = null;

function resizeConfettiCanvas() {
  const dpr = window.devicePixelRatio || 1;
  confettiCanvas.width = window.innerWidth * dpr;
  confettiCanvas.height = window.innerHeight * dpr;
  confettiCanvas.style.width = window.innerWidth + 'px';
  confettiCanvas.style.height = window.innerHeight + 'px';
  confettiCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
window.addEventListener('resize', resizeConfettiCanvas);

function makeConfettiParticle() {
  return {
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * window.innerHeight * 0.3,
    vx: (Math.random() - 0.5) * 4,
    vy: 2 + Math.random() * 3,
    size: 6 + Math.random() * 6,
    color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 10,
    shape: Math.random() < 0.5 ? 'rect' : 'circle',
  };
}

function launchConfetti(count = 180) {
  resizeConfettiCanvas();
  confettiParticles = Array.from({ length: count }, makeConfettiParticle);
  confettiStartedAt = performance.now();
  if (!confettiRafId) confettiRafId = requestAnimationFrame(confettiLoop);
}

function confettiLoop(now) {
  const elapsed = now - confettiStartedAt;
  confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
  for (const p of confettiParticles) {
    p.vy += 0.12;
    p.x += p.vx;
    p.y += p.vy;
    p.rotation += p.rotationSpeed;
    confettiCtx.save();
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rotation * Math.PI) / 180);
    confettiCtx.fillStyle = p.color;
    if (p.shape === 'rect') {
      confettiCtx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
    } else {
      confettiCtx.beginPath();
      confettiCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
      confettiCtx.fill();
    }
    confettiCtx.restore();
  }
  confettiParticles = confettiParticles.filter((p) => p.y < window.innerHeight + 40);
  if (elapsed < CONFETTI_DURATION_MS && confettiParticles.length) {
    confettiRafId = requestAnimationFrame(confettiLoop);
  } else {
    confettiCtx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    confettiRafId = null;
  }
}

/* ---------- Skill template overlay ---------- */

function renderTemplateOverlay(highlightId) {
  overlayBodyEl.innerHTML = SKILL_TEMPLATE_SECTIONS.map(
    (s) => `
      <div class="template-section ${s.id === highlightId ? 'is-highlighted' : ''}" data-section="${s.id}">
        <h3><svg class="icon"><use href="#icon-${s.icon}"></use></svg>${escapeHtml(s.label)}</h3>
        <pre><code>${escapeHtml(s.body)}</code></pre>
      </div>`
  ).join('');
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
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !overlayEl.hidden) closeTemplateOverlay();
});

/* ---------- Init ---------- */

renderTocOnce();
renderSlide();
updateTocActiveState();
