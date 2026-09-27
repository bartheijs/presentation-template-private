# Quiz-slide ("Slimste Mens") — Design

## Doel

Een quiz-slide toevoegen aan de presentatie-engine: een lijst met plekken
die de quizmaster één voor één onthult vanuit Presenter View, met een
losse uitlegweergave per item. Bouwt volledig voort op het bestaande
Presenter View-protocol (zie
`docs/superpowers/specs/2026-08-22-presenter-view-design.md`) — geen nieuw
communicatiekanaal, geen nieuwe persistentie-techniek.

Uitgangspunt (MVP-scope, bewust klein gehouden):
- Geen reveal-animatie (spin/confetti) — direct tonen/verbergen.
- Geen scoretelling.
- Geen refresh-persistentie los van wat de engine al biedt (een refresh
  van het publieksvenster reset vandaag ook al `state.currentIndex` naar
  0 zonder herstel — quizstate volgt dezelfde conventie).
- Eén of meerdere quiz-slides per presentatie worden ondersteund; elke
  quiz-slide heeft een variabele, statische lijst van 1..N items (geen
  opschuiven van lege plekken), met een **maximum van 10 items** —
  daarboven wordt het rooster onoverzichtelijk. Meer dan 10 items levert
  een `console.warn` op; alleen de eerste 10 worden gerenderd.
- Uitlegsubslides zijn **intern**: geen eigen plek in `SLIDES`, niet
  bereikbaar via Volgende/Vorige, niet in de inhoudsopgave, niet
  meegeteld in het totaal aantal slides. Alleen de quizmaster kan ze
  openen/sluiten via de cockpit.

## Datamodel (`slides-data.js`)

Een quiz-slide is een gewone `SLIDES`-entry met `layout: 'quiz'` (past in
het bestaande `LAYOUT_RENDERERS`-dispatchmechanisme, net als `'bullets'`
of `'list-image'`):

```js
{
  id: 7,
  layout: 'quiz',
  title: 'Wie is de slimste mens?',
  items: [
    {
      id: 'q1',
      label: '1',                // audience-plaatshouder vóór onthulling
      answer: 'Het antwoord',    // toont op de plek zodra onthuld
      explanation: {              // zelfde vorm als een gewone slide-body,
        layout: 'bullets',         // gerenderd via de bestaande
        title: 'Uitleg titel',     // buildSlideContentHTML(slide) —
        bullets: ['Toelichting...'], // geen apart renderpad nodig
        image: { src: '...', alt: '...' }, // optioneel
        align: 'left',             // optioneel
      },
    },
    // 1..N items
  ],
  notes: 'Sprekersnotities voor de quizmaster',
}
```

`buildSlideContentHTML` (app.js) is al bewezen tolerant voor een partieel
slide-object zonder `id`/`notes`/`disco` — vandaar dat `explanation`
rechtstreeks als input kan dienen zonder nieuwe rendercode.

## State & protocol (uitbreiding, geen nieuw kanaal)

- `app.js` krijgt een in-memory map `state.quiz`, keyed op slide-id, bv.
  `state.quiz['7'] = { revealed: { q1: true, q2: false }, explanationItemId: null }`.
  Lazy geïnitialiseerd (alles verborgen) zodra een quiz-slide voor het
  eerst bereikt wordt.
- Vier nieuwe, gewhiteliste commands in `COMMAND_HANDLERS`
  (presenter → publieksvenster), zonder `slideId`-parameter omdat een
  cockpit altijd de huidige slide bestuurt:
  - `QUIZ_REVEAL { itemId }`
  - `QUIZ_HIDE { itemId }`
  - `QUIZ_SHOW_EXPLANATION { itemId }`
  - `QUIZ_BACK_TO_LIST {}`

  Elke handler muteert `state.quiz[currentSlideId]` en roept daarna de
  bestaande `sendStateToPresenter()` aan — geen nieuw dispatchpatroon.
- De `state`-broadcast krijgt één extra veld: `quiz: null`, of bij een
  actieve quiz-slide `{ slideId, items: [{id, status}], explanationItemId }`.
- Hetzelfde veld wordt toegevoegd aan de bestaande `preview-state`-berichten
  naar Presenter Views eigen `current-preview`-iframe, zodat die live
  preview exact toont wat het publiek ziet.
- `explanationItemId` wijzigt **nooit** `state.currentIndex` — het is een
  losse toggle die de renderer gebruikt om de slide-body te wisselen
  tussen de roosterweergave en de uitlegweergave van dat item. Volgende/
  Vorige, TOC en slide-telling blijven hier volledig buiten.
- Presenter View kent de item-inhoud (label/answer/explanation) al
  lokaal via haar eigen geladen `SLIDES` (zelfde patroon als de
  notities vandaag al lokaal uit `SLIDES[currentSlide].notes` komen) —
  de state-broadcast hoeft dus alleen id's en status te bevatten, geen
  gedupliceerde inhoud over het kanaal.

## UI — publieksvenster (`index.html`/`app.js`)

Nieuwe layout-renderer `renderQuizLayout(slide)`, geregistreerd in
`LAYOUT_RENDERERS['quiz']`:
- Titel via de bestaande `buildHeadingBlock`.
- Rooster: `<ol class="quiz-roster">`, één `<li>` per item op vaste
  positie. Toont het nummer (`label`) zolang verborgen, het antwoord
  zodra onthuld — leest `state.quiz[slide.id]` rechtstreeks (net zoals
  andere renderfuncties al de globale `state` gebruiken). CSS-grid met
  `grid-auto-flow: column` en 5 rijen vult vanzelf eerst de linkerkolom
  (rij 1-5) en pas daarna de rechterkolom — bij ≤5 items dus gewoon één
  kolom, bij 6-10 items 5 links/5 rechts, zonder dat de renderer zelf
  hoeft te splitsen.
- De uitleg van een item is een **overlay** (`#quiz-explanation-overlay`),
  hetzelfde patroon als de bestaande Presentatiebrief-overlay
  (`#template-overlay`): een `.overlay-backdrop`/`.overlay-panel` die via
  `openQuizExplanation(itemId)`/`closeQuizExplanation()` getoond/verborgen
  wordt (`hidden`-attribuut, sluitknop, backdrop-klik, `Esc`), met
  `buildSlideContentHTML(item.explanation)` als inhoud. **Bewust niet**
  meer een vervanging van het rooster in `slideContentEl.innerHTML` (een
  eerdere versie deed dat wel) — het rooster blijft de hele tijd
  ongewijzigd achter de overlay bestaan, dus reveal-state kan nooit
  per ongeluk lijken te resetten wanneer de uitleg weer sluit.
- `goTo()` sluit deze overlay expliciet bij elke navigatie (zelfde regel
  als de finish-overlay hierboven) — zonder die regel zou de overlay, als
  vast gepositioneerd element los van de slide-inhoud, blijven zweven
  boven een heel andere slide na Volgende/Vorige/TOC/skip.

## UI — Presenter View cockpit (`presenter.html`/`presenter.js`/`presenter.css`)

- Wanneer `latestState.quiz` niet `null` is, vervangt een nieuwe
  `.quiz-cockpit`-container de inhoud van `.preview-card--next` (de
  "volgende slide"-iframe heeft dan toch geen zinvolle inhoud om te
  tonen tijdens een quiz).
- Eén rij per item, **altijd zichtbaar** (ook terwijl een uitleg open
  staat): label/answer (lokaal uit `SLIDES` opgehaald) + een
  statusindicator (grijs = verborgen, groen = getoond, in één oogopslag
  zichtbaar zonder naar het publieksvenster te hoeven kijken) + knoppen
  **Toon/Verberg** (toggle) en **Uitleg**.
- **Uitleg is zelf ook een toggle** (`aria-pressed`, tekst wisselt tussen
  "Uitleg" en "Sluit uitleg"): nogmaals klikken op dezelfde knop sluit de
  overlay weer. Er is bewust géén aparte "Terug naar lijst"-knop meer —
  precies één voor de hand liggende manier om terug te gaan, dezelfde
  knop waarmee je de uitleg opende.
- Knoppen roepen de bestaande `sendCommand()`-helper aan met de vier
  nieuwe commands hierboven (`QUIZ_SHOW_EXPLANATION` bij "Uitleg",
  `QUIZ_BACK_TO_LIST` bij "Sluit uitleg").

## Testen

- Playwright-tests toevoegen/uitbreiden (`tests/`) voor: reveal/verberg
  per item, uitleg openen/sluiten zonder `state.currentIndex` te wijzigen,
  cockpit die de volgende-slide-preview vervangt zolang de quiz-slide
  actief is, en dat normale slides ongewijzigd blijven.
- `npx playwright test` moet slagen; bestaande tests die vaste
  slide-aantallen/indexen aannemen mogen aangepast worden zoals
  `tests/README.md` al voorschrijft wanneer de demo bewust verandert.
