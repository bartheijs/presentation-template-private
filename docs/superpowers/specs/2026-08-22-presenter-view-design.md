# Presenter View — Design

## Doel

Een losstaande Presenter View toevoegen aan de bestaande presentatie-engine
(`index.html` / `app.js` / `config.js` / `slides-data.js` / `styles.css`),
zonder de bestaande presentatie zelf visueel of functioneel te veranderen.
De Presentation View (het bestaande venster) blijft in alle gevallen de
source of truth voor wat het publiek daadwerkelijk ziet.

## Niet-onderhandelbare uitgangspunten

- De bestaande presentatie blijft visueel en functioneel ongewijzigd, met
  één bewuste, expliciet goedgekeurde uitzondering: één knop om de
  Presenter View te openen (§1). Geen klok, progress bars,
  notities-paneel of andere presenter-UI in `index.html` daarbuiten.
- De Presenter View is een apart browservenster, altijd geopend vanuit de
  Presentation View (nooit los, onafhankelijk geopend als primaire flow).
- Geen lokale webserver, geen build-stap. Werkt rechtstreeks via `file://`,
  exact zoals de presentatie vandaag al wordt gebruikt.
- Minimale, additieve wijzigingen aan de bestaande engine-bestanden. Geen
  duplicatie van bestaande navigatie-, overlay- of aside-logica.

## Architectuuroverzicht

```
Presentation View (index.html/app.js)  <--postMessage-->  Presenter View (presenter.html/presenter.js)
        source of truth voor state                         stuurt commands, toont state + presenter-only UI
```

De Presentation View voert elk ontvangen command uit met haar **bestaande**
functies en stuurt daarna de volledige actuele state terug. De Presenter
View bepaalt nooit zelf dat een actie is geslaagd — ze wacht op de
teruggestuurde state.

---

## 1. Launch-mechanisme

Twee gelijkwaardige manieren om `window.open('presenter.html',
'presenterView')` vanuit de Presentation View aan te roepen:

- Een **knop** in de rechter controls-column (`next-column`), naast de
  bestaande Presentatiebrief-/notities-/timer-knoppen: zelfde
  `.btn-floating`/`.btn-compact-collapsible`-stijl, dus icon-only zodra die
  kolom wordt ingeklapt, net als de andere knoppen daar. Dit is een
  bewuste, expliciet goedgekeurde uitzondering op het "geen extra
  controls"-uitgangspunt uit de eerste briefing.
- Een verborgen keyboard shortcut — voorstel **`Shift+P`** — die dezelfde
  `window.open()`-aanroep doet, voor wie liever geen muis gebruikt.

Beide routes werken op elk moment tijdens de presentatie (slide 1, slide 8,
ongeacht), wat het scenario "Presenter View wordt later geopend" dekt.
Zonder op de knop of shortcut te drukken blijft de rest van `index.html`
ongewijzigd — dit voegt precies één nieuw, klein element toe, verder
raakt niets aan bestaande layout of interactie.

Presenter.html wordt **niet** ondersteund als rechtstreeks, onafhankelijk
geopende primaire flow. Wordt het toch rechtstreeks geopend (geen
`window.opener`), dan toont het een expliciete "niet verbonden"-status (zie
§3, scenario 6) in plaats van een kapotte of stille lege UI.

## 2. Window-referenties & reconnect

Beide vensters houden een `peerRef`-variabele bij:

- Initieel gezet vanuit `window.open()`'s return value (Presentation View)
  resp. `window.opener` (Presenter View).
- **Bij elk ontvangen bericht bijgewerkt naar `event.source`.** Dit maakt de
  koppeling zelfherstellend: als een venster herlaadt, verliest het zijn
  in-memory referentie, maar herwint die zodra de andere kant een bericht
  stuurt (zie hieronder, `REQUEST_STATE`).
- Voor elke uitgaande `postMessage` wordt eerst gecontroleerd of
  `peerRef && !peerRef.closed`. Is de referentie ongeldig, dan wordt niet
  verstuurd en (in de Presenter View) de "niet verbonden"-status getoond.

Presenter.html stuurt `REQUEST_STATE`:
- eenmalig bij `load`;
- opnieuw bij elke `focus`/`visibilitychange` van het venster (dekt "main
  is herladen, presenter had allang open" — de browsing context van
  Presentation View blijft bestaan over een reload heen, dus
  `window.opener` in Presenter View blijft geldig; het is de kant van
  Presentation View die haar losse `peerRef` opnieuw moet leren, wat gebeurt
  zodra dit bericht binnenkomt).

## 3. Beveiliging: sender-identity + schema-validatie (geen origin-string-check)

`file://` geeft geen betekenisvolle, controleerbare origin-string:
`location.origin` is daar de opaque letterlijke waarde `"null"`, en twee
onafhankelijk geladen `file://`-documenten krijgen elk hun eigen opaque
origin die niet betrouwbaar gelijk is aan een andere pagina's `"null"` (ze
worden op identiteit vergeleken, niet op string). Origin-string-validatie
zou hier dus of ten onrechte legitieme berichten afwijzen, of een no-op
zijn die niets beveiligt.

In plaats daarvan:

1. **Sender-identity check** — elke message handler weigert het bericht als
   `event.source !== peerRef`. Dit is exact de eigenschap die hier nodig is
   (dit specifieke, gekoppelde venster-paar vertrouwen — niet "elke pagina
   op mijn origin").
2. **Schema-validatie** — daarna wordt gecontroleerd dat `event.data.type`
   `"command"` of `"state"` is, en (voor commands) dat
   `event.data.command` in de vaste whitelist staat (§4). Onbekende of
   ongeldige payloads worden genegeerd, nooit uitgevoerd.
3. `postMessage(..., '*')` wordt gebruikt als `targetOrigin`, met een
   code-comment die uitlegt waarom: onder `file://` is verder inperken
   betekenisloos, en de sender-identity-check is de eigenlijke grens.

Dit geldt symmetrisch voor beide vensters en voor alle preview-iframes
(§7), die dezelfde command-listener hergebruiken.

**Scenario's die dit ontwerp expliciet moet afdekken** (handmatig te
verifiëren vóór afronding, en waar praktisch als Playwright-scenario):

1. Presenter View normaal geopend vanuit Presentation View → werkt direct.
2. Presenter View herladen → herstelt via `window.opener` + `REQUEST_STATE`.
3. Presenter View gesloten → Presentation View detecteert `peerRef.closed`
   en stopt met versturen, geen fouten in de console.
4. Presenter View daarna opnieuw geopend (nieuwe shortcut-druk) → nieuwe
   `peerRef` in beide vensters, verse `REQUEST_STATE`-handshake.
5. Presentation View herladen (Presenter View blijft open) → Presenter
   View's volgende `REQUEST_STATE` (focus/visibilitychange) laat
   Presentation View haar `peerRef` herleren via `event.source`.
6. Presenter View rechtstreeks geopend, geen `window.opener` → duidelijke
   "Niet verbonden — open deze pagina via de Presentatieweergave"-status,
   geen crash, geen stille lege UI.

## 4. Command/state-protocol

```js
// Presenter View -> Presentation View
{ type: "command", command: "NEXT_SLIDE" }
{ type: "command", command: "PREVIOUS_SLIDE" }
{ type: "command", command: "GO_TO_SLIDE", slide: 10 }
{ type: "command", command: "TOGGLE_CONTEXT_OVERLAY" }   // + SHOW_/HIDE_ varianten
{ type: "command", command: "TOGGLE_LEFT_ASIDE" }        // + SHOW_/HIDE_ varianten
{ type: "command", command: "TOGGLE_RIGHT_ASIDE" }       // + SHOW_/HIDE_ varianten
{ type: "command", command: "TOGGLE_PAUSE_OVERLAY" }     // + SHOW_/HIDE_ varianten
{ type: "command", command: "REQUEST_STATE" }

// Presentation View -> Presenter View
{
  type: "state",
  currentSlide: 8,
  totalSlides: 20,
  contextOverlayVisible: true,
  leftAsideVisible: false,
  rightAsideVisible: true,
  pauseOverlayVisible: false,
}
```

Eén centrale handler in `app.js` ontvangt commands en roept de
**bestaande** functies aan (`goNext`, `goTo`, `openTemplateOverlay` /
`closeTemplateOverlay`, `toggleTocCollapse`, `toggleNextCollapse`, en
nieuwe `showPauseOverlay`/`hidePauseOverlay`). Na elke state-wijzigende
actie — ongeacht of die door een echte klik of een command werd
veroorzaakt — wordt de volledige state naar `peerRef` gestuurd. Dit
voorkomt dat de twee vensters uit sync raken: de Presenter View bepaalt
nooit zelf dat `currentSlide` is veranderd, ze wacht op deze state-update.

## 5. Geschiedenis voor "Vorige"

Nieuwe kleine `history`-array in `app.js`. Bij elke daadwerkelijk
doorgevoerde navigatie (in `goTo()`/`resumePausedTransition()`, op het
punt waar `state.currentIndex` wordt gewijzigd) wordt de **oude** index op
de array gepusht. `PREVIOUS_SLIDE` (command én bestaande Vorige-knop) pop't
hiervan als de array niet leeg is, anders valt terug op `currentIndex - 1`.
Tijdelijke skip-selecties (§7, `pendingNextSlide`) raken deze array nooit —
alleen de daadwerkelijke sprong (bijv. 8 → 10) wordt gepusht, niet de
overgeslagen tussenliggende indexen.

## 6. Pauze-overlay

Nieuwe markup in `index.html` (verborgen by default) + stijl in
`styles.css`: `position: fixed; inset: 0; z-index: 2500` (boven de
bestaande hoogste laag, `#confetti-canvas` op 2000 — de finish-overlay zelf
zit op 1500), met rustige styling uit de bestaande tokens en
optionele tekst via `CONFIG.ui.pauseOverlayText`. Dekt het hele viewport
af — asides en de template-overlay blijven ongewijzigd in hun eigen state,
niets wordt automatisch gesloten. `pauseOverlayVisible` is een nieuwe
boolean in de echte presentation state, losstaand van `currentSlide` en
van de timer (die blijft gewoon doorlopen, exact zoals gespecificeerd).

## 7. Preview-techniek: hergebruikte iframes (geen DOM-clone, geen losse renderer)

`app.js` werkt met singleton-DOM (`getElementById`) en één globale `state`
— de renderfuncties zijn niet parametriseerbaar zonder de engine te
herstructureren, wat buiten scope is. In plaats daarvan bevat
`presenter.html` twee `<iframe src="index.html?embed=preview">`
(actuele-weergave, volgende-slide), verkleind met CSS `transform: scale()`.

`?embed=preview` laat `app.js` haar eigen keyboard/click-navigatie
listeners **niet** registreren (previews mogen niet zelfstandig
navigeren), maar de command-listener blijft actief. Presenter.js stuurt
dezelfde `GO_TO_SLIDE`/`TOGGLE_*`-commands naar elke iframe als naar het
echte venster: de actuele-weergave-iframe krijgt exact de echte state
gespiegeld (inclusief template-overlay en pauze-overlay, want het is
letterlijk dezelfde rendering), de volgende-slide-iframe wordt naar
`pendingNextSlide` gestuurd. Geen dubbele render-/businesslogica: de
previews zijn passieve afnemers van hetzelfde protocol dat toch al nodig is
voor de echte afstandsbediening.

## 8. Skip-ahead (`pendingNextSlide`)

Leeft uitsluitend in `presenter.js`, raakt het echte venster nooit direct
aan. "Skip" verhoogt `pendingNextSlide`, "Herstel" zet hem terug naar
`currentSlide + 1`. Op "Volgende" stuurt Presenter View
`GO_TO_SLIDE(pendingNextSlide)`; na de bevestigde state-update reset
Presenter View `pendingNextSlide` naar `currentSlide + 1`. Overgeslagen
slides worden nooit kort zichtbaar in de Presentation View — er wordt
rechtstreeks genavigeerd, niet stap voor stap.

## 9. Speaker notes & timing-metadata

`slides-data.js` krijgt één nieuw optioneel veld per slide: `duration`
(seconden, presenter-only, geen effect op de Presentation View). Notes
blijven ongewijzigd (`slide.notes`); `presenter.js` leest `SLIDES` gewoon
rechtstreeks (zelfde classic-script-`file://`-patroon als vandaag). Totale
geplande tijd = som van `duration`-velden, met een fallback (gelijke
verdeling van een configureerbare totaalduur) voor slides zonder eigen
waarde. Voor/achter-op-schema = `verstreken tijd - geplande tijd tot en met
de huidige slide`, herberekend tegen de daadwerkelijke huidige slide na elke
sprong, met geplande tijd van daadwerkelijk overgeslagen slides meegeteld.

## 10. Presenter.html — structuur

Nieuwe bestanden: `presenter.html`, `presenter.js`, optioneel
`presenter.css` (mag bestaande tokens uit `styles.css` hergebruiken/
`@import`en). Eigen state, uitsluitend presenter-side: `pendingNextSlide`,
timer start/pauze/reset (los van de *weergave* van verstreken tijd, die
timestamp-based is, niet een opgetelde teller), lokale klok
(`setInterval` + `Date.now()`), en de "niet verbonden"-status (§3,
scenario 6).

Layout volgt de structuur die al eerder is voorgelegd: klok + verstreken
tijd boven, actuele-weergave/volgende-slide-previews met skip-control
naast elkaar, speaker notes daaronder, beide voortgangsbalken (slides +
tijd) met voor/achter-op-schema-indicatie, en onderin de bediening voor
context-overlay, beide asides, pauze-overlay en Vorige/Volgende.

## Bestandswijzigingen — overzicht

| Bestand | Wijziging |
|---|---|
| `app.js` | + knop-clickhandler en keyboard shortcut om Presenter View te openen (§1), + command-listener/state-broadcaster (§3–4), + `history`-array (§5), + pauze-overlay show/hide-functies (§6), + `?embed=preview`-navigatie-suppressie (§7). Verder ongewijzigd. |
| `index.html` | + "Open Presenter View"-knop in de rechter controls-column (§1), + verborgen pauze-overlay markup (§6). Verder ongewijzigd. |
| `styles.css` | + pauze-overlay stijl. Verder ongewijzigd. |
| `slides-data.js` | + optioneel `duration`-veld per slide. Verder ongewijzigd. |
| `config.js` | + optioneel `ui.pauseOverlayText`, + optionele timing-fallback-instelling. |
| `presenter.html` / `presenter.js` / `presenter.css` (nieuw) | Volledige Presenter View. |

## Out of scope (nu bewust niet gebouwd)

`BLACKOUT_SCREEN`, `START_TIMER`/`PAUSE_TIMER`/`RESET_TIMER` als
protocol-commands, en elke vorm van BroadcastChannel/localStorage-fallback
— het command-mechanisme is zo ontworpen (vaste whitelist, één centrale
handler) dat dit later toegevoegd kan worden zonder de architectuur te
wijzigen, maar wordt nu niet gebouwd omdat er geen concrete behoefte aan
is.
