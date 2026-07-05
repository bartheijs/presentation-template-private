---
name: test-presentation
description: Run and interpret the Playwright test suite for this skill-workshop-presentation repo. Use after any change to app.js, styles.css, config.js, or slides-data.js, or when the user asks to test/verify/check that a change didn't break the presentation.
---

# Testsuite draaien en interpreteren

Deze skill vervangt het steeds opnieuw met de hand schrijven van een
wegwerp-Playwright-scriptje om een wijziging te verifiëren. Er staat al een
ingecheckte, herbruikbare testsuite in `tests/`.

## Goal

Na een wijziging aan `app.js`/`styles.css`/`config.js`/`slides-data.js`
(engine-code, niet content-only wijzigingen aan slide-teksten) bevestigen
dat niets is gebroken, en bij een falende test snel naar de juiste plek in
de code kunnen wijzen.

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
   bestaat. Zo niet:
   ```
   npm install
   npx playwright install chromium
   ```
   Als de browser-download faalt (bv. door een netwerkbeperking in een
   sandbox), meld dat expliciet — dan kan er niet automatisch getest
   worden, en moet er een manuele/visuele controle als alternatief.
2. Draai de suite: `npx playwright test`. Gebruik `-g "<naam>"` om één
   scenario of bestand gericht te draaien tijdens het debuggen.
3. Bij een falende test: gebruik onderstaande mapping om direct naar de
   relevante engine-code te springen, in plaats van opnieuw context op te
   bouwen:
   - `tests/config-and-ui.spec.js` faalt → `config.js`-waarden of
     `applyConfigStrings()`/`templateOverlay.enabled`-logica in `app.js`.
   - `tests/disco-and-pause.spec.js` faalt → `isDiscoEnabledFor`/
     `isDiscoPauseFor`/`goTo`/`animateTransition`/`beginPausedTransition`/
     `resumePausedTransition`/`cancelPendingPause`/`resetAnimationState` in
     `app.js`, of de `.disco-bg`/`is-transitioning`-CSS in `styles.css`.
   - `tests/layout.spec.js` faalt → `resolveAlignFor`/`renderBulletItem`/
     `buildSlideContentHTML` in `app.js`, of `.slide-inner`/
     `.slide-content--align-left`/`.slide-bullet-*`/de 900px-breakpoint in
     `styles.css`.
   - `tests/notes-resize.spec.js` faalt → de `flex-grow`-transitie op
     `.slide-content` en de `stage-no-notes`-regel in `styles.css`.
   - `tests/notes-toggle.spec.js` faalt → `toggleNotesVisibility`/
     `shouldShowNotes`/`notesHiddenByUser`/`updateNotesToggleLabel` in
     `app.js`, of `#btn-toggle-notes`/`#notes-toggle-label` in `index.html`.
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
- NOOIT `npx playwright install` proberen zonder eerst te checken of er al
  een gedeelde browser-cache beschikbaar is (bv. via
  `PLAYWRIGHT_BROWSERS_PATH`) — een sandbox kan de download blokkeren; meld
  dat dan expliciet in plaats van te blijven retryen.
