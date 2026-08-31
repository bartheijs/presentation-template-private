---
name: test-presentation
description: Run and interpret the Playwright test suite for this reusable presentation template. Use after changes to app.js, styles.css, config.js, slides-data.js, presenter.html, presenter.js or presenter.css, or when asked to verify presentation behavior.
---

# Testsuite draaien en interpreteren

Deze skill vervangt het steeds opnieuw met de hand schrijven van een
wegwerp-Playwright-scriptje om een wijziging te verifiëren. Er staat al een
ingecheckte, herbruikbare testsuite in `tests/`.

## Goal

Na een wijziging aan `app.js`/`styles.css`/`config.js`/`slides-data.js`/
`presenter.html`/`presenter.js`/`presenter.css` (engine-code, niet
content-only wijzigingen aan slide-teksten) bevestigen dat niets is
gebroken, en bij een falende test snel naar de juiste plek in de code
kunnen wijzen.

## Inputs & context

- `tests/README.md` — installatie-instructies (opt-in, zie hieronder).
- `playwright.config.js` — wijst naar `index.html` via `file://`, geen
  webserver nodig.
- De testsuite is een **opt-in dev-dependency** (`@playwright/test`, gepind
  op een exacte versie in `package.json`). De presentatie zelf
  (`index.html` openen) heeft hier niets mee te maken en blijft
  dependency-vrij.

## Tools

Bash (om `npm`/`npx playwright` te draaien). Geen MCP of sub-agents nodig.

## Process

1. Eerste keer in een omgeving: controleer of `node_modules/@playwright`
   bestaat en of de juiste browser-revisie al gecached staat (zie Rules —
   revisie-mismatch telt ook als "ontbreekt"). Zo niet, **vraag eerst
   toestemming aan de gebruiker** voordat je iets installeert of download:
   ```
   npm install
   npx playwright install chromium
   ```
   Leg daarbij uit wat het gevolg is als de gebruiker dit weigert: dan kan
   de suite niet automatisch draaien, en valt de verificatie terug op een
   manuele/visuele controle (app in de browser openen en de wijziging met
   de hand doorklikken) in plaats van de Playwright-tests.
   Als de download zelf faalt (bv. door een netwerkbeperking in een
   sandbox) nadat toestemming is gegeven, meld dat expliciet — dan kan er
   ook niet automatisch getest worden, met hetzelfde gevolg als hierboven.
2. Draai de suite: `npx playwright test`. Gebruik `-g "<naam>"` om één
   scenario of bestand gericht te draaien tijdens het debuggen.
3. Bij een falende test: gebruik onderstaande mapping om direct naar de
   relevante engine-code te springen, in plaats van opnieuw context op te
   bouwen:
   - `tests/config-and-ui.spec.js` faalt → `config.js`-waarden of
     `applyConfigStrings()`/`templateOverlay.enabled`-logica in `app.js`; voor
     de theme-tests specifiek → de inline `data-theme`-script in
     `index.html`/`presenter.html`, of `:root[data-theme="conclusion"]` in
     `themes/conclusion/theme.css`, of `.brand-chrome*` in `styles.css`.
   - `tests/disco-and-pause.spec.js` faalt → `isDiscoEnabledFor`/
     `isDiscoPauseFor`/`goTo`/`animateTransition`/`beginPausedTransition`/
     `resumePausedTransition`/`cancelPendingPause`/`resetAnimationState` in
     `app.js`, of de `.disco-bg`/`is-transitioning`-CSS in `styles.css`.
   - `tests/layout.spec.js` faalt → `resolveAlignFor`/`renderBulletItem`/
     `buildSlideContentHTML`/`LAYOUT_RENDERERS`/de per-layout render-functies
     (`renderTitleLayout`, `renderBulletsLayout`, `renderListImageLayout`,
     `renderQuoteLayout`, `renderImageOnlyLayout`,
     `renderTemplateReferenceLayout`) in `app.js`, of `.slide-inner`/
     `.slide-content--align-left`/`.slide-bullet-*`/`.slide-quote-*`/
     `.slide-image-stack--solo`/de 900px-breakpoint in `styles.css`.
   - `tests/notes-resize.spec.js` faalt → de `flex-grow`-transitie op
     `.slide-content` en de `stage-no-notes`-regel in `styles.css`.
   - `tests/notes-toggle.spec.js` faalt → `toggleNotesVisibility`/
     `shouldShowNotes`/`notesHiddenByUser`/`updateNotesToggleLabel` in
     `app.js`, of `#btn-toggle-notes`/`#notes-toggle-label` in `index.html`.
   - `tests/presenter-view-scenarios.spec.js` faalt → de
     reconnect-bootstrap-regel in `app.js`'s `window.addEventListener('message', ...)`
     (bekende `presenterRef` vereist een matchende `event.source`, een nog
     onbekende accepteert precies één `REQUEST_STATE`), of
     `presentationRef`/`requestState` in `presenter.js`. Iedere test komt
     direct overeen met één scenario in §3 van
     `docs/superpowers/specs/2026-08-22-presenter-view-design.md`.
   - `tests/presenter-view-timing.spec.js` faalt → `plannedStartOfSlide`/
     `scheduleDelta`/`totalPlannedMs`/`configuredTotalMs`/
     `averageSlideDurationSeconds`, of de timer-persistentie
     (`loadTimerState`/`saveTimerState`/`getElapsedSeconds`) in `presenter.js`.
   - `tests/presenter-view.spec.js` faalt → het lanceermechanisme
     (`openPresenterView`/`#btn-presenter-view`/`Shift+P` in `app.js`), het
     command-protocol (`COMMAND_HANDLERS`/`sendStateToPresenter` in
     `app.js`, `sendCommand`/`renderState` in `presenter.js`), de
     pauze-overlay (`showPauseOverlay`/`hidePauseOverlay`/
     `isPauseOverlayVisible` in `app.js`), skip-ahead
     (`pendingNextSlide`/`lastJumpOriginIndex` in `presenter.js`), of de
     preview-iframes (`?embed=preview`/`isEmbedPreview` in `app.js`,
     `syncPreview`/`resyncPreviewOnLoad` in `presenter.js`).
   - `tests/regression.spec.js` faalt → iets breekt breder dan één
     specifiek onderdeel; lees de console-errors in de testoutput, die
     citeren de daadwerkelijke JS-fout.
4. Los de oorzaak op (niet de test aanpassen om hem te laten slagen, tenzij
   de test zelf een fout blijkt te bevatten — bv. een verkeerde
   referentiewaarde, zoals eerder gebeurde met de 900px-breakpoint-test die
   de verkeerde box vergeleek). → CHECKPOINT: als onduidelijk is of de app
   of de test fout zit, leg dat voor aan de gebruiker voordat je iets
   aanpast.
5. Draai de suite opnieuw tot alles slaagt.
6. Voeg bij een nieuwe feature een nieuwe test toe in het meest passende
   bestaande spec-bestand (of een nieuw bestand als het een heel nieuw
   onderdeel van de engine betreft), zodat de suite meegroeit.

## Output

- Testresultaat (geslaagd/gefaald, met welke specs).
- Bij falen: een concrete diagnose + fix, niet alleen de foutmelding
  doorplakken.

## Rules

- ALTIJD deze suite draaien na een wijziging aan `app.js`/`styles.css`/
  `config.js`/`slides-data.js` vóór je de taak als afgerond beschouwt.
- ALTIJD de daadwerkelijke oorzaak oplossen bij een falende test, niet de
  assertion verzwakken om hem groen te krijgen — tenzij de test zelf
  aantoonbaar de verkeerde aanname maakt.
- ALTIJD content-waarden uit `config.js` (titel, disco-tekst, ui-labels,
  timer-defaults, ...) in tests lezen via `page.evaluate(() => CONFIG...)`
  in plaats van de huidige waarde te hardcoden als string — deze presentatie
  wordt actief aangepast, en een test die "CONFIG.x is exact 'Y'" checkt in
  plaats van "wat er ook in CONFIG.x staat komt in de DOM terecht" breekt
  bij elke content-tweak zonder dat er iets kapot is. Test wél tegen een
  hardcoded/expliciet geforceerde waarde wanneer het gedrag zelf het
  onderwerp is (bijv. "als disco AAN staat, flitst het") — zet dan expliciet
  `CONFIG.disco.enabled = true`/`slide.disco = true` in de test-setup zelf,
  in plaats van te vertrouwen op wat dit deck's `config.js` daar toevallig
  voor default heeft staan (zie disco-and-pause.spec.js voor het patroon).
- NOOIT `npx playwright install` proberen zonder eerst te checken of er al
  een gedeelde browser-cache beschikbaar is (bv. via
  `PLAYWRIGHT_BROWSERS_PATH`) — een sandbox kan de download blokkeren; meld
  dat dan expliciet in plaats van te blijven retryen.
- NOOIT `npm install` of `npx playwright install` uitvoeren zonder eerst
  expliciet toestemming te vragen aan de gebruiker, ook als dit de
  standaard/voor-de-hand-liggende volgende stap lijkt. Dit geldt ook
  wanneer een gecachete browser-revisie niet overeenkomt met wat de
  gepinde `@playwright/test`-versie verwacht (revisie-mismatch), want dat
  triggert dezelfde download. Gevolg bij weigering: de Playwright-suite
  kan niet draaien; val terug op een manuele/visuele controle in de
  browser als verificatie.
