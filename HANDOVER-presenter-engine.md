# Overdracht: Presenter View / navigatie-engine wijzigingen

Dit document beschrijft alle **generieke bedieningslogica-fixes en -features**
die zijn ontwikkeld op de `skill-workshop-presentation`-branch, bedoeld om
over te zetten naar het herbruikbare template op de `development`-branch.
Het bevat **bewust geen content** (skill-teksten, slide-titels, "Skill
Template"-terminologie specifiek voor deze workshop) — alleen wijzigingen aan
`app.js`, `presenter.js`, `presenter.html`, `presenter.css`, `styles.css` en
hun tests die voor élke presentatie op basis van dit template nuttig zijn.

**Hoe te gebruiken:** open dit bestand in een sessie op de
`development`-branch en pas elke sectie apart toe (Edit/Read tegen de
huidige staat van die branch — dit is geen git-patch, want de omliggende
content verschilt). Elke sectie staat op zichzelf; ze hoeven niet in volgorde
te worden toegepast, maar §1–§4 bouwen wel logisch op elkaar voort
(pendingNextSlide-fix eerst, dan de layout-verbouwing, dan disco/finish-fixes
die daar weer op voortbouwen).

Na elke sectie: `npx playwright test` draaien (zie §9 voor welke test-files
zijn aangepast/toegevoegd).

---

## 1. Bugfix: Vorige→Volgende sloeg een slide over

**Bestand:** `presenter.js`, functie `renderState()`

**Probleem:** `pendingNextSlide` (de aanwijzer voor de "volgende slide"-preview)
werd alleen teruggezet naar `currentSlide + 1` als hij was *achterop* geraakt
(`pendingNextSlide <= newState.currentSlide`). Bij het indrukken van Vorige
gaat `currentSlide` omlaag, waardoor `pendingNextSlide` 2 slides vóór bleef
lopen in plaats van 1. De eerstvolgende Volgende-klik zag dat gat aan voor een
bewuste "sla-over"-sprong en sprong direct naar die te-verre slide.

**Fix:** reset `pendingNextSlide` onvoorwaardelijk bij elke `renderState()`-aanroep:

```js
function renderState(newState) {
  latestState = newState;
  // pendingNextSlide only ever diverges from currentSlide + 1 locally, via
  // the Sla over/Herstel buttons — neither of which triggers renderState().
  // So any real navigation arriving here (this call firing at all) means
  // whatever was staged has just been consumed or is now stale, and must
  // resync unconditionally. Resetting only when pendingNextSlide had fallen
  // behind (<= newState.currentSlide) missed the reverse case: going back
  // leaves it 2 slides ahead of the new position instead of 1, and the next
  // Volgende click then misreads that gap as a deliberate skip-jump and
  // jumps an extra slide instead of just advancing one.
  pendingNextSlide = newState.currentSlide + 1;
  // ...rest of de functie ongewijzigd
}
```

De `isFirstState`-variabele (voorheen gebruikt in de conditie) kan vervallen.

---

## 2. Presenter View: layout-verbouwing

### 2a. Vorige/Volgende tussen de previews, één toggle-knop

**Bestanden:** `presenter.html`, `presenter.css`, `presenter.js`

**Wat:** Vorige/Volgende stonden onderaan in de rechter zijbalk, samen met de
tijd/voortgangs-widgets — op een kleiner of korter browservenster vielen ze
daardoor buiten beeld (moest scrollen om ze te bereiken). Ze zijn verplaatst
naar een middenkolom, verticaal gestapeld, tussen de "Huidige slide"- en
"Volgende slide"-previews — meteen zichtbaar zonder scrollen.

Ook zijn Start/Pauze samengevoegd tot één knop (zie §3), zodat er sowieso
minder controls onderaan hoefden te staan.

**HTML** — nieuwe structuur in `preview-grid`:
```html
<section class="preview-grid" ...>
  <article class="panel preview-card preview-card--current">...</article>

  <nav class="preview-nav" aria-label="Presentatiebediening" data-i18n-aria-label="presentationControls">
    <div class="nav-controls">
      <button id="btn-presenter-prev" class="btn btn--nav" type="button"><span aria-hidden="true">&#8592;</span> <span data-i18n="previous">Vorige</span></button>
      <button id="btn-presenter-next" class="btn btn--primary btn--nav" type="button"><span data-i18n="next">Volgende</span> <span aria-hidden="true">&#8594;</span></button>
    </div>
  </nav>

  <article class="panel preview-card preview-card--next">...</article>
</section>
```
De oude `<nav class="panel nav-panel">` met dezelfde twee knoppen, die in de
zijbalk (`presenter-sidebar`) stond, is verwijderd (voorkomt dubbele
`id`'s — de knoppen bestaan nu precies één keer).

**CSS:**
```css
.preview-grid { grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr); }

.preview-nav {
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-controls {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.btn--nav { min-width: 7.5rem; }
```
(De oude `.nav-panel { display:flex; justify-content:flex-end; padding-block:0.75rem; }`
en de oude `.nav-controls { flex:0 0 auto; margin-left:auto; }`/`flex-wrap`-narrow-override
zijn vervallen.)

### 2b. Sprekersnotities even hoog als het Weergave-paneel

**Bestand:** `presenter.css`

**Probleem:** `.presenter-notes` had `min-height: 18rem`, wat de rij vaak
hoger maakte dan het Weergave-paneel ernaast nodig had — daardoor viel de
pagina soms net buiten het scherm (per ongeluk scrollen mogelijk).

**Fix:**
```css
.presenter-notes {
  flex: 1;
  min-height: 0;   /* was: 18rem */
  overflow: auto;
  /* ...rest ongewijzigd */
}
```
`flex:1` binnen de al aanwezige `align-items:stretch` van `.detail-grid`
laat de twee panelen daardoor vanzelf gelijke hoogte krijgen.

---

## 3. Eén Start/Pauze-toggle-knop (i.p.v. twee losse knoppen)

**Bestanden:** `presenter.html`, `presenter.js`

Analoog aan de bestaande patroon in `app.js` (`timerToggleBtn` met
`running ? Pauze : Start`).

**HTML:**
```html
<button id="btn-presenter-timer-toggle" class="btn btn--primary" type="button" data-i18n="start">Start</button>
<button id="btn-presenter-timer-reset" class="btn btn--quiet" type="button" data-i18n="reset">Reset</button>
```
(vervangt de losse `#btn-presenter-timer-start` + `#btn-presenter-timer-pause`)

**JS:**
```js
const timerToggleBtn = document.getElementById('btn-presenter-timer-toggle');

function updateTimerControlsUI() {
  elapsedInputEl.disabled = timerState.running;
  timerToggleBtn.textContent = timerState.running ? presenterText.pause : presenterText.start;
}

function toggleTimerRunning() {
  if (timerState.running) {
    pausePresenterTimer();
  } else {
    startPresenterTimer();
  }
}

timerToggleBtn.addEventListener('click', toggleTimerRunning);
document.getElementById('btn-presenter-timer-reset').addEventListener('click', resetPresenterTimer);
```

---

## 4. Verstreken-klok → instelbare aftel-timer

**Bestanden:** `presenter.html`, `presenter.css`, `presenter.js`

**Wat:** de "Verstreken"-klok (telde op sinds Start) is vervangen door een
zelf in te stellen countdown. Klik op de tijd (alleen mogelijk als de timer
niet loopt) en typ `MM:SS` of een kaal getal (= minuten). Start telt af;
Reset zet 'm terug naar de laatst ingestelde duur (niet naar 0 — na een
pauze wil je typisch dezelfde countdown herstarten, niet opnieuw intypen).
Verplaatst van de zijbalk naar de header, gecentreerd tussen titel en klok.

**HTML** (in `<header class="presenter-header">`, tussen `.presenter-heading`
en `.presenter-clock`):
```html
<div class="header-timer" aria-label="Presentatietijd" data-i18n-aria-label="presentationTiming">
  <div class="elapsed-block">
    <span class="meta-label" data-i18n="timerLabel">Resterende tijd</span>
    <input type="text" class="elapsed" data-elapsed inputmode="numeric" autocomplete="off"
      aria-label="Tijdsduur instellen (MM:SS of minuten), alleen als de timer niet loopt"
      data-i18n-aria-label="setTimerDuration">
  </div>
  <div class="timer-controls" aria-label="Timerbediening" data-i18n-aria-label="timerControls">
    <button id="btn-presenter-timer-toggle" class="btn btn--primary" type="button" data-i18n="start">Start</button>
    <button id="btn-presenter-timer-reset" class="btn btn--quiet" type="button" data-i18n="reset">Reset</button>
  </div>
</div>
```
De oude timer-widget (met `.progress-timer`-omkadering) in de zijbalk, en het
hele "Voortgang / Op schema"-paneel (Slides-/Tijd-voortgangsbalken,
`data-schedule-delta` etc.) zijn **verwijderd** — zie §4d.

**CSS** — header wordt een 3-koloms grid zodat het middenitem echt centreert:
```css
.presenter-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1.25rem;
}

.header-timer {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.75rem 1.1rem;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--surface) 96%, transparent);
  box-shadow: var(--shadow-soft);
}

.header-timer .elapsed { color: var(--text); font-size: 1.25rem; }
.header-timer .btn { min-height: 2.35rem; padding: 0.55rem 0.75rem; font-size: 0.8rem; }

input.elapsed {
  width: 5ch;
  border: none;
  background: transparent;
  padding: 0;
  cursor: text;
}
input.elapsed:disabled { color: inherit; opacity: 1; cursor: default; }
input.elapsed:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 3px;
  border-radius: 4px;
}
```

**JS** — volledige vervanging van het oude `accumulatedMs`/`startEpoch`
optel-model door een `durationMs`/`remainingMs`/`endAt` aftel-model
(zelfde timestamp-gebaseerde patroon als `app.js`'s eigen `timer`-object):

```js
const TIMER_STORAGE_KEY = 'presenterView.timer';
const DEFAULT_PRESENTER_TIMER_MS = CONFIG.timer.defaultMinutes * 60 * 1000;

function loadTimerState() {
  const fresh = { durationMs: DEFAULT_PRESENTER_TIMER_MS, remainingMs: DEFAULT_PRESENTER_TIMER_MS, running: false, endAt: null };
  try {
    const raw = sessionStorage.getItem(TIMER_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : null;
    if (!parsed || typeof parsed.durationMs !== 'number' || typeof parsed.remainingMs !== 'number') return fresh;
    if (!parsed.running || !parsed.endAt) return parsed;
    const remainingMs = Math.max(0, parsed.endAt - Date.now());
    return { durationMs: parsed.durationMs, remainingMs, running: remainingMs > 0, endAt: remainingMs > 0 ? parsed.endAt : null };
  } catch {
    return fresh;
  }
}

function saveTimerState(state) {
  try {
    sessionStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  } catch { /* storage disabled/quota — ignore, matches loadTimerState */ }
}

let timerState = loadTimerState();
let presenterTimerIntervalId = null;
const elapsedInputEl = document.querySelector('[data-elapsed]');

function getRemainingSeconds() { return Math.ceil(timerState.remainingMs / 1000); }

function renderTimerDisplay() {
  const totalSec = getRemainingSeconds();
  const m = String(Math.floor(totalSec / 60)).padStart(2, '0');
  const s = String(totalSec % 60).padStart(2, '0');
  elapsedInputEl.value = `${m}:${s}`;
}

function startPresenterTimer() {
  if (timerState.running || timerState.remainingMs <= 0) return;
  timerState = { ...timerState, running: true, endAt: Date.now() + timerState.remainingMs };
  saveTimerState(timerState);
  presenterTimerIntervalId = setInterval(presenterTimerTick, 250);
  updateTimerControlsUI();
}

function pausePresenterTimer() {
  if (!timerState.running) return;
  const remainingMs = Math.max(0, timerState.endAt - Date.now());
  timerState = { ...timerState, running: false, remainingMs, endAt: null };
  saveTimerState(timerState);
  clearInterval(presenterTimerIntervalId);
  presenterTimerIntervalId = null;
  updateTimerControlsUI();
  renderTimerDisplay();
}

function resetPresenterTimer() {
  if (presenterTimerIntervalId) { clearInterval(presenterTimerIntervalId); presenterTimerIntervalId = null; }
  timerState = { durationMs: timerState.durationMs, remainingMs: timerState.durationMs, running: false, endAt: null };
  saveTimerState(timerState);
  updateTimerControlsUI();
  renderTimerDisplay();
}

function presenterTimerTick() {
  timerState.remainingMs = Math.max(0, timerState.endAt - Date.now());
  renderTimerDisplay();
  if (timerState.remainingMs <= 0) {
    clearInterval(presenterTimerIntervalId);
    presenterTimerIntervalId = null;
    timerState = { ...timerState, running: false, endAt: null };
    saveTimerState(timerState);
    updateTimerControlsUI();
  }
}

function parseDurationInput(raw) {
  const trimmed = raw.trim();
  if (/^\d+:\d{1,2}$/.test(trimmed)) {
    const [m, s] = trimmed.split(':').map(Number);
    if (s > 59) return null;
    return (m * 60 + s) * 1000;
  }
  if (/^\d+$/.test(trimmed)) return Number(trimmed) * 60 * 1000;
  return null;
}

function commitDurationEdit() {
  const parsedMs = parseDurationInput(elapsedInputEl.value);
  if (parsedMs === null || parsedMs <= 0) { renderTimerDisplay(); return; }
  timerState = { durationMs: parsedMs, remainingMs: parsedMs, running: false, endAt: null };
  saveTimerState(timerState);
  renderTimerDisplay();
}

elapsedInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') { e.preventDefault(); elapsedInputEl.blur(); }
  if (e.key === 'Escape') { e.preventDefault(); renderTimerDisplay(); elapsedInputEl.blur(); }
});
elapsedInputEl.addEventListener('blur', commitDurationEdit);

updateTimerControlsUI(); // zie §3 — combineert disabled-state + knoplabel
renderTimerDisplay();

function renderClock() {
  const now = new Date();
  document.querySelector('[data-clock]').textContent =
    `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}
setInterval(renderClock, 250);
renderClock();
```

**i18n-keys** (`PRESENTER_I18N`): `elapsed`/`elapsedSuffix` vervangen door
`timerLabel` ("Resterende tijd"/"Time remaining") en `setTimerDuration`
(aria-label voor het invoerveld). `renderClockAndElapsed` is opgesplitst —
alleen `renderClock()` blijft over (elapsed-rendering zit nu in
`renderTimerDisplay()`, aangestuurd door de timerfuncties zelf, niet meer
door een aparte interval).

### 4d. Verwijderd: "Voortgang / Op schema"-paneel

Samen met de timer-verplaatsing is het hele paneel met de Slides-/Tijd-
voortgangsbalken en de schedule-delta-tekst ("voor/achter op schema")
verwijderd — nam ruimte in en overlapte functioneel met de nieuwe
countdown. Als de development-branch dit paneel WEL wil behouden, sla deze
sub-sectie over en pas alleen de rest van dit document toe.

Verwijderd uit `presenter.html`: het hele `<article class="panel progress-panel">`-blok.
Verwijderd uit `presenter.css`: `.progress-panel`, `.progress-timer` (oude
versie), `.schedule-chip`, `.progress-row`, `.progress-label`,
`.progress-track`, `.progress-fill*`, en de bijbehorende narrow-width regels.
Verwijderd uit `presenter.js`: `renderTiming()` (en de 2 aanroepen ervan) en
het `slidesProgressPct`-blok in `renderState()`. **Let op:** `scheduleDelta`/
`totalPlannedMs`/`plannedStartOfSlide`/`configuredTotalMs`/
`averageSlideDurationSeconds` zelf zijn bewust **niet** verwijderd — die
pure rekenfuncties worden nog los getest (zie §9) en zijn onschuldig om te
laten staan, ook al hebben ze geen UI-aanroeper meer.
Verwijderde i18n-keys: `progress`, `onSchedule`, `slides`, `time`,
`slideProgress`, `timeProgress`, `aheadOfSchedule`, `behindSchedule`.

---

## 5. Disco is een forward-only apparaat (geen flash bij teruggaan)

**Bestand:** `app.js`, functies `goTo()` en `animateTransition()`

**Probleem:** `discoOn` werd op twee plekken onafhankelijk berekend, geen van
beide hield rekening met de navigatierichting:
1. In `goTo()`: `const discoOn = isDiscoEnabledFor(destSlide);`
2. Opnieuw, redundant, in `animateTransition()`: `const discoOn = isDiscoEnabledFor(SLIDES[state.currentIndex]);`

Terugnavigeren naar een slide met `disco:true` (of de globale
`CONFIG.disco.enabled`) liet daardoor alsnog de disco-flash/titel zien.

**Fix:** `discoOn` in `goTo()` gaten op richting, en die ene waarde
doorgeven aan `animateTransition()` in plaats van 'm daar opnieuw te
berekenen:

```js
// in goTo(), na het bepalen van destSlide:
const discoOn = dir === 'next' && isDiscoEnabledFor(destSlide);
const pauseOn = discoOn && isDiscoPauseFor(destSlide); // dir==='next' zit al in discoOn

// ...
state.currentIndex = index;
animateTransition(dir, renderSlide, resolveDiscoHoldMsFor(destSlide), discoOn); // vierde parameter toegevoegd
```

```js
// animateTransition krijgt discoOn nu als parameter i.p.v. zelf te berekenen:
function animateTransition(dir, applyFn, holdMs = 0, discoOn = false) {
  isAnimatingSlide = true;
  slideContentEl.classList.add('content-anim-out');
  if (!slideNotesEl.hidden) slideNotesEl.classList.add('notes-anim-out');

  // GEEN "const discoOn = isDiscoEnabledFor(...)" meer hier — komt nu binnen.
  pendingRevealTimer = discoOn
    ? setTimeout(() => slideStageEl.classList.add('is-transitioning'), DISCO_REVEAL_DELAY_MS)
    : null;
  // ...rest van de functie ongewijzigd (discoOn wordt verderop nog 2x
  // gebruikt in closures — die pakken 'm gewoon als parameter i.p.v. const)
}
```

`beginPausedTransition`/`resumePausedTransition` hoeven niet aangepast te
worden — die worden alleen aangeroepen als `pauseOn` al true is, wat nu
automatisch `dir==='next'` impliceert.

---

## 6. Finish-overlay: "laatste pagina" correct behandelen als slide

**Bestand:** `app.js`

Twee samenhangende bugs, beide rond het eindscherm (`finish-overlay`, opent
via de "Klaar!"-knop of door op de laatste slide nog een keer Volgende te
klikken — verandert `state.currentIndex` bewust niet, zie `goNext()`).

### 6a. Vorige deed niks zichtbaars als het eindscherm open stond

Een remote `PREVIOUS_SLIDE`/`GO_TO_SLIDE`-commando (vanuit Presenter View)
kon `state.currentIndex` terugzetten zónder het eindscherm te sluiten — de
echte Presentation View bleef dan het eindscherm tonen terwijl Presenter
View's eigen weergave al een andere slide liet zien.

**Fix:** in `goTo()`, vlak na de guard-clauses, vóór de rest van de functie:
```js
if (!finishOverlayEl.hidden) closeFinishOverlay();
```

### 6b. Vorige vanaf het eindscherm sloeg de laatste slide over

Met alléén fix 6a loste Vorige het eindscherm op ÉN verlaagde het de index
in dezelfde actie — je landde dus 2 stappen terug (op de voorlaatste slide,
inclusief diens eigen overgangsanimatie) in plaats van 1 stap (de laatste
slide zelf, die je net "onder" het eindscherm vandaan haalt).

**Fix:** nieuwe `goPrev()`-functie (analoog aan de bestaande `goNext()`),
die het eindscherm-geval apart afhandelt vóórdat `goTo()` ooit wordt
aangeroepen:

```js
// Shared by the Prev button and PREVIOUS_SLIDE: the finish overlay is
// conceptually one more step past the last slide (see goNext() above), so
// going back from it should just reveal that last slide again — the same
// thing its own "Terug naar de presentatie" button does — not ALSO step
// past it to the slide before. goTo() is never even called in that case,
// so state.currentIndex (already sitting on the last slide) is untouched;
// a second "back" press, with the overlay now closed, behaves normally.
function goPrev() {
  if (!finishOverlayEl.hidden) {
    closeFinishOverlay();
    sendStateToPresenter();
    return;
  }
  goTo(state.currentIndex - 1, { animate: true, direction: 'prev' });
}
```

Alle drie de aanroeppunten die voorheen direct
`goTo(state.currentIndex - 1, {...})` deden, moeten naar `goPrev()`:
- lokale knop: `document.getElementById('btn-prev').addEventListener('click', goPrev);`
- toetsenbord: `if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); goPrev(); return; }`
- `COMMAND_HANDLERS.PREVIOUS_SLIDE: () => goPrev(),`

**Resultaat:** eerste Vorige vanaf het eindscherm = alleen sluiten (zelfde
als de eigen "Terug naar de presentatie"-knop); een tweede Vorige (scherm nu
dicht) gaat pas echt naar de voorlaatste slide.

---

## 7. Disco-still in Presenter View (nieuwe feature)

**Bestanden:** `app.js`, `presenter.html`, `presenter.css`, `presenter.js`

**Wat:** Presenter View toont nu een statische "still" (géén live spiegeling)
van de disco-titeltekst bovenop de "Huidige slide"-preview, zolang het
publiek een disco-overgang ziet — inclusief bevroren 'pause'-modus. Puur
informatief; de presenter hoeft zelf niks te doen, wil alleen weten dat het
publiek net een flitsend scherm ziet i.p.v. de normale slide.

**`app.js`** — nieuwe module-level state, gevuld in `goTo()`, geleegd bij elk
"echt klaar"-moment:
```js
let activeDiscoTitleLines = null; // non-null exactly while the audience sees a disco transition

// in goTo(), direct na het bepalen van discoOn:
activeDiscoTitleLines = discoOn ? (destSlide.discoTitleLines || CONFIG.disco.titleLines) : null;
if (discoOn) renderDiscoTitle(activeDiscoTitleLines);
```
Op de 3 plekken waar `isAnimatingSlide = false;` wordt gezet ZONDER dat er
een `pendingPause` actief blijft (in `animateTransition`'s laatste
`animationend`-handler, in `resumePausedTransition`'s laatste
`animationend`-handler, en in `resetAnimationState()`), erbij:
```js
activeDiscoTitleLines = null;
sendStateToPresenter(); // alleen nodig in de animationend-handlers, niet in resetAnimationState (die roept elders al sendStateToPresenter aan)
```

En in `sendStateToPresenter()`'s payload-object:
```js
discoTitleLines: activeDiscoTitleLines,
```

**`presenter.html`** — overlay bovenop de current-preview iframe:
```html
<div class="preview-viewport">
  <iframe id="current-preview" ...></iframe>
  <div class="disco-still" data-disco-still hidden>
    <div class="disco-still-title" data-disco-still-title></div>
    <span class="disco-still-label" data-i18n="discoStillLabel">Dit ziet je publiek nu — een still, niet live</span>
  </div>
</div>
```

**`presenter.css`** — zie de volledige `.disco-still`/`.disco-still-title`/
`.disco-still-label`-regels in het huidige `presenter.css` (hergebruikt de
`--disco-backdrop`/`--disco-title-*`-CSS-variabelen uit `styles.css`, die al
gelinkt is op deze pagina — geen nieuwe kleuren nodig).

**`presenter.js`**:
```js
const discoStillEl = document.querySelector('[data-disco-still]');
const discoStillTitleEl = document.querySelector('[data-disco-still-title]');

function renderDiscoStill(lines) {
  discoStillEl.hidden = !lines;
  if (!lines) return;
  discoStillTitleEl.replaceChildren(
    ...lines.map((line) => {
      const span = document.createElement('span');
      span.textContent = line;
      return span;
    })
  );
}

// in renderState(), ergens tussen de andere renderToggleState-aanroepen:
renderDiscoStill(newState.discoTitleLines);
```
i18n-key `discoStillLabel` toevoegen aan `PRESENTER_I18N` (nl/en).

---

## 8. Kleine robuustheidsfix: Skill Template-overlay/slide (los van content)

**Bestanden:** `app.js`, `styles.css`

Dit stukje is puur technisch (geen workshop-content), dus wél overzetten:

1. **Eén bron voor de gekleurde sectiekoppen.** De floating overlay
   (`renderTemplateOverlay`) en de `isTemplateAnchor`-slide zelf gebruikten
   twee verschillende renderpaden — de slide toonde een platte, ongekleurde
   kopie. Nu delen ze `buildTemplateSectionsHtml(highlightId)`:
   ```js
   function buildTemplateSectionsHtml(highlightId) {
     const blocks = SKILL_TEMPLATE_SECTIONS.map((s) => {
       const [headingLine, ...rest] = s.body.split('\n');
       const highlightClass = s.id === highlightId ? ' is-highlighted' : '';
       return `<span class="tpl-block tpl-block--${s.id}${highlightClass}"><span class="tpl-heading">${escapeHtml(headingLine)}</span>${
         rest.length ? '\n' + escapeHtml(rest.join('\n')) : ''
       }</span>`;
     });
     return blocks.join('\n\n');
   }
   function renderTemplateOverlay(highlightId) {
     overlayBodyEl.innerHTML = `<pre class="template-code"><code>${buildTemplateSectionsHtml(highlightId)}</code></pre>`;
   }
   ```
   En in `buildSlideContentHTML()`:
   ```js
   const templateBlock = slide.isTemplateAnchor
     ? `<pre class="slide-template-code"><code>${buildTemplateSectionsHtml(null)}</code></pre>`
     : '';
   ```

2. **De code-inline op de slide zelf hoefde niet meer te scrollen.** Was
   `max-height: 58vh` (een gok die op kleinere/smallere vensters altijd
   fout zat); is nu een flex-item dat de resterende ruimte in de slide
   opvult, plus een schaalbare `font-size` (`clamp(...vh...)`) zodat het op
   elk formaat past zonder scrollbalk:
   ```css
   /* styles.css */
   .slide-inner--fill { flex: 1 1 auto; min-height: 0; }   /* nieuw */

   .slide-template-code {
     /* ... */
     font-size: clamp(0.58rem, 1.3vh, 1.15rem); /* was: 0.78rem vast */
     line-height: 1.35;                          /* was: 1.5 */
     padding: 0.9rem 1.1rem;                      /* was: 1.1rem 1.3rem */
     flex: 1 1 0;                                 /* nieuw */
     min-height: 0;                               /* nieuw */
     /* max-height: 58vh; -- verwijderd */
   }
   ```
   En in `app.js`'s `buildSlideContentHTML()`, de `innerClass`-bepaling:
   ```js
   const innerClass = diagramLogoBlock
     ? ' slide-inner--wide'
     : (slide.isTemplateAnchor ? ' slide-inner--fill' : '');
   ```

---

## 9. Tests

Deze test-bestanden zijn aangepast/uitgebreid en horen bij bovenstaande
fixes — zonder ze mee te nemen mist de development-branch de
regressiedekking (maar de fixes zelf werken ook zonder de tests):

- **`tests/presenter-view.spec.js`** — nieuwe/aangepaste tests:
  - `'plain Vorige then Volgende (no skip involved) lands back on the same slide, not one ahead'` (§1)
  - `'Presenter View Vorige from the closing page just reveals the last slide; a second Vorige then steps back further'` (§6)
  - `'shows a still of the disco title while the audience sees it, hides once it settles'` +
    `'does not show for an ordinary transition with disco disabled'` +
    `'does not show when navigating back to a disco-enabled slide (forward-only device)'` (§7, §5)
  - Bestaande skip-ahead/back-to-jump-origin tests: knop-ID's aangepast
    naar `#btn-presenter-timer-toggle` waar relevant (§3).
- **`tests/presenter-view-timing.spec.js`** — het hele
  `test.describe('continuous timing updates (renderTiming)', ...)`-blok is
  verwijderd (testte de verwijderde §4d-functionaliteit). De
  `'presentation timer persistence'`-tests zijn herschreven voor het nieuwe
  aftel-model (`getRemainingSeconds()` i.p.v. `getElapsedSeconds()`, Reset
  test verwacht nu de ingestelde duur i.p.v. 0). Nieuwe test:
  `'typing a new duration while paused updates the countdown, but is ignored while running'`.
  De pure `scheduleDelta`/`totalPlannedMs`/`plannedStartOfSlide`-tests
  ('timing math'-describe-blok) blijven ongewijzigd.
- **`tests/disco-and-pause.spec.js`** — nieuwe test:
  `'disco is a forward-only device: no flash when navigating back to a disco-enabled slide'` (§5).

**Let op timing-races bij het herschrijven/uitbreiden van deze tests op de
andere branch:** snel-achter-elkaar klikken zonder op animatie-afronding te
wachten (`isAnimatingSlide` pollen, of `waitIdle(page)` uit `tests/helpers.js`)
laat commando's silent droppen (`goTo()`'s eigen
`if (animate && isAnimatingSlide) return;`-guard). Gebruik na een animerende
klik altijd `await waitIdle(page)` (main-page) of een expliciete
`expect(locator).toHaveText(...)`-assertion (die zelf polt) vóór de
volgende actie — niet een korte vaste `waitForTimeout`.

---

## Buiten scope (bewust niet overgezet)

- **`SKILL_TEMPLATE_MD`/`SKILL_TEMPLATE_SECTIONS`-inhoud** in `slides-data.js`
  (QUESTION/FEEDBACK-terminologie, het "Wat eten we vandaag"-voorbeeld) —
  workshop-specifieke content.
- **Slide-titels/volgorde** (slide 19/30/31 hernoemd/omgewisseld) — content.
- **`templateButton`/`overlayTitle` = "Skill Template"** (was
  "Presentatiebrief"/"Presentation brief") in `app.js`'s `APP_I18N` — dit IS
  een generieke UI-string (geen workshop-content), maar de nieuwe naam
  verwijst specifiek naar "skill" — voor een ander onderwerp (bv. een
  verkooppresentatie) past die tekst niet. Overweeg op de andere branch een
  neutralere naam (bv. "Referentiepaneel"/"Reference panel") te kiezen in
  plaats van deze letterlijke string over te nemen — de onderliggende
  structuurfix (§8, gedeelde `buildTemplateSectionsHtml`) wel overnemen.
- **`finishTitle`/`finishBodyHtml`** ("Demo tijd!"/"Wat eten we vandaag?") —
  content.
