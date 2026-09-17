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

Er zijn drie afzonderlijke vertrouwensrelaties, elk met hun eigen
referentie-variabele — niet één generieke `peerRef` die voor alles wordt
hergebruikt:

- **Presentation View ↔ Presenter View** — `app.js` (top-level, niet
  `?embed=preview`) houdt `presenterRef` bij; `presenter.js` houdt
  `presentationRef` bij. Dit is de enige relatie die een handshake/reconnect
  nodig heeft (zie bootstrap-regel hieronder).
- **Presenter View → current-preview-iframe** — `presenter.js` houdt
  `currentPreviewRef = currentPreviewIframeEl.contentWindow` bij.
- **Presenter View → next-preview-iframe** — `presenter.js` houdt
  `nextPreviewRef = nextPreviewIframeEl.contentWindow` bij.

De twee preview-referenties hebben geen handshake nodig: `presenter.js`
maakt de iframes zelf aan, dus `contentWindow` is synchroon beschikbaar
zodra het element bestaat. Aan de andere kant, in `app.js` met
`?embed=preview`, is de vertrouwde afzender altijd deterministisch
`window.parent` — ook geen handshake, geen reconnect-logica nodig; een
reload van de preview-iframe zelf herstelt dit vanzelf opnieuw.

Alleen de Presentation View ↔ Presenter View-relatie is problematisch bij
reload, en heeft daarom een expliciete bootstrap-regel nodig:

```
Als presenterRef (resp. presentationRef) al bekend is:
  accepteer uitsluitend event.source === die referentie.
Als de referentie nog onbekend is (net herladen):
  accepteer eenmalig een schema-geldig REQUEST_STATE-bericht,
  ongeacht afzender, en stel de referentie daarna vast op
  event.source van dat bericht. Elk volgend bericht wordt weer
  tegen die vastgezette referentie gevalideerd.
```

Zonder deze regel zou een herladen Presentation View haar eigen
`REQUEST_STATE`-handshake weigeren: `presenterRef` is na reload leeg, dus
`event.source !== presenterRef` zou altijd waar zijn, en het bericht dat
juist bedoeld is om de referentie opnieuw te leren zou worden afgewezen
vóórdat dat kan gebeuren. Dit bootstrap-gat is bewust en klein: het venster
is alleen open tussen "Presentation View herladen" en "de eerstvolgende
`REQUEST_STATE` van de al-geopende, echte Presenter View" — en dit is een
lokale `file://`-toepassing voor één gebruiker, geen publiek endpoint.

Referentie-geldigheid: voor elke uitgaande `postMessage` wordt eerst
gecontroleerd of de referentie bestaat en `!ref.closed` is. Is de
referentie ongeldig, dan wordt niet verstuurd en (in de Presenter View)
de "niet verbonden"-status getoond.

Presenter.html stuurt `REQUEST_STATE`:
- eenmalig bij `load` (`presentationRef` initieel op `window.opener`);
- opnieuw bij elke `focus`/`visibilitychange` van het venster (dekt "main
  is herladen, presenter had allang open" — de browsing context van
  Presentation View blijft bestaan over een reload heen, dus
  `window.opener` in Presenter View blijft geldig; het is de kant van
  Presentation View die haar `presenterRef` via de bootstrap-regel hierboven
  opnieuw moet leren).

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
   de afzender niet de vastgestelde referentie is voor die relatie (§2:
   `presenterRef`/`presentationRef` na bootstrap, of `window.parent` voor
   een preview-iframe). Dit is exact de eigenschap die hier nodig is (dit
   specifieke, gekoppelde venster-paar vertrouwen — niet "elke pagina op
   mijn origin").
2. **Schema-validatie** — daarna wordt gecontroleerd dat `event.data.type`
   `"command"`, `"state"` of `"preview-state"` is (§4), en (voor commands)
   dat `event.data.command` in de vaste whitelist staat. Onbekende of
   ongeldige payloads worden genegeerd, nooit uitgevoerd.
3. `postMessage(..., '*')` wordt gebruikt als `targetOrigin`, met een
   code-comment die uitlegt waarom: onder `file://` is verder inperken
   betekenisloos, en de sender-identity-check is de eigenlijke grens.

Dit geldt voor alle drie de relaties uit §2, elk met hun eigen
referentie-check — niet als één gedeelde generieke controle.

**Platformverificatie (acceptatie-eis, geen aanname):** `file://`-gedrag is
niet gegarandeerd identiek tussen browsers. Vóór afronding expliciet
verifiëren op macOS in Chrome, Edge en Safari, en waar mogelijk ook op
Windows/Edge — niet enkel theoretisch afleiden dat het zou moeten werken.

**Scenario's die dit ontwerp expliciet moet afdekken** (handmatig te
verifiëren vóór afronding, en waar praktisch als Playwright-scenario):

1. Presenter View normaal geopend vanuit Presentation View → werkt direct.
2. Presenter View herladen → herstelt via `window.opener` + `REQUEST_STATE`.
3. Presenter View gesloten → Presentation View detecteert
   `presenterRef.closed` en stopt met versturen, geen fouten in de console.
4. Presenter View daarna opnieuw geopend (nieuwe knop-klik of
   shortcut-druk) → nieuwe `presenterRef`/`presentationRef` in beide
   vensters, verse `REQUEST_STATE`-handshake.
5. Presentation View herladen (Presenter View blijft open) → Presenter
   View's volgende `REQUEST_STATE` (focus/visibilitychange) laat
   Presentation View haar `presenterRef` herleren via de bootstrap-regel
   in §2 (`event.source` van dat bericht).
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

// Presenter View -> preview-iframe (current-preview / next-preview)
// Absolute snapshot only — never TOGGLE_*. A toggle is relative to
// state the preview can't be certain of (e.g. if the preview already
// happens to show contextOverlayVisible: true, a TOGGLE would turn it
// OFF instead of confirming it on), so previews are driven exclusively
// by full snapshots instead.
{
  type: "preview-state",
  currentSlide: 8,             // current + 1, or current + 2 while skip is armed
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
veroorzaakt — wordt de volledige state naar `presenterRef` gestuurd. Dit
voorkomt dat de twee vensters uit sync raken: de Presenter View bepaalt
nooit zelf dat `currentSlide` is veranderd, ze wacht op deze state-update.

Voor de twee preview-iframes stuurt `presenter.js` bij elke relevante
wijziging een `preview-state`-snapshot naar `currentPreviewRef` resp.
`nextPreviewRef`. `GO_TO_SLIDE` blijft het navigatie-command (dat verandert
niet), maar overlay/aside/pauze-zichtbaarheid in de previews wordt nooit
via `TOGGLE_*` naar een iframe gestuurd — alleen via deze absolute
snapshot, zodat de preview een pure afgeleide blijft in plaats van een
eigen (potentieel uit sync rakende) toggle-state te onderhouden.

## 5. "Vorige" — bestaande logica blijft ongewijzigd; presenter-skip-terugkeer is lokaal aan presenter.js

Geen gedeelde `history`-array in `app.js`. De bestaande Vorige-knop en het
`PREVIOUS_SLIDE`-command blijven **exact** de huidige logica
(`currentIndex - 1`) — dit is een expliciete correctie op een eerdere
versie van dit ontwerp, die een gedeelde `history`-array voorstelde. Die
zou het gedrag van de bestaande Vorige-knop ook in niet-skip-gevallen
hebben veranderd (bijv. na een TOC-sprong 2 → 8 zou Vorige dan 8 → 2 doen
in plaats van het huidige 8 → 7), wat rechtstreeks botst met het
uitgangspunt dat de bestaande presentatie functioneel ongewijzigd blijft.

In plaats daarvan onthoudt **`presenter.js`, uitsluitend lokaal**, de index
waar een presenter-skip-sprong (`GO_TO_SLIDE`) vandaan kwam
(`lastJumpOriginIndex`). Zolang die sprong nog niet is opgevolgd door een
andere navigatie, stuurt Presenter View's eigen Vorige-knop
`GO_TO_SLIDE(lastJumpOriginIndex)` in plaats van `PREVIOUS_SLIDE`; in elk
ander geval stuurt hij gewoon `PREVIOUS_SLIDE`. Geen nieuw wire-command,
geen wijziging aan `app.js`'s bestaande navigatie — dit is puur
boekhouding binnen `presenter.js` over commands die het zelf al verstuurt.
Voorbeeld: `8 → skip 9 → 10` gevolgd door Presenter Vorige → `8`, zonder
dat de knop/`PREVIOUS_SLIDE` elders van betekenis verandert.

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

**Recovery zonder Presenter View:** de pauze-overlay bedekt het volledige
scherm, dus als de Presenter View sluit of crasht terwijl hij actief is,
moet de presentator hem ook zonder dat venster weer weg kunnen krijgen.
`app.js`'s bestaande Escape-handler (die nu al de finish- en
template-overlay sluit) krijgt er een derde, laagste-prioriteit tak bij:
als geen van de andere twee overlays open is én `pauseOverlayVisible` is
waar, sluit Escape de pauze-overlay. Geen nieuwe zichtbare UI, alleen een
bestaande toets die een extra geval afhandelt.

## 7. Preview-techniek: hergebruikte iframes (geen DOM-clone, geen losse renderer)

`app.js` werkt met singleton-DOM (`getElementById`) en één globale `state`
— de renderfuncties zijn niet parametriseerbaar zonder de engine te
herstructureren, wat buiten scope is. In plaats daarvan bevat
`presenter.html` twee `<iframe src="index.html?embed=preview">`
(actuele-weergave, volgende-slide), verkleind met CSS `transform: scale()`.

`?embed=preview` laat `app.js` haar eigen keyboard/click-navigatie
listeners, én de knop/shortcut om zelf een Presenter View te openen (§1),
**niet** registreren (previews mogen niet zelfstandig navigeren of een
eigen Presenter View spawnen), maar de command-listener blijft actief.
Presenter.js stuurt `GO_TO_SLIDE` voor navigatie plus een absolute
`preview-state`-snapshot voor overlay/aside/pauze-zichtbaarheid (§4 — nooit
`TOGGLE_*`, om de eerder genoemde desync te vermijden) naar elke iframe: de
actuele-weergave-iframe krijgt exact de echte state gespiegeld (inclusief
template-overlay en pauze-overlay, want het is letterlijk dezelfde
rendering). De volgende-slide-iframe toont normaal `currentSlide + 1` en,
zolang de skipactie geactiveerd is, het skipdoel `currentSlide + 2`. Geen
dubbele render-/businesslogica: de previews zijn passieve afnemers van
hetzelfde protocol dat toch al nodig is voor de echte afstandsbediening.

## 8. Eén slide overslaan met bevestiging

De skipstatus leeft uitsluitend in `presenter.js` en verandert de echte
presentatie pas na bevestiging. De eerste klik op "Sla over" activeert de
knop voor vier seconden en laat in de volgende-slide-preview het skipdoel
`currentSlide + 2` zien. Een tweede klik binnen die tijd stuurt
`GO_TO_SLIDE(currentSlide + 2)` en springt rechtstreeks naar dat doel. Zo
wordt de tussenliggende slide nooit kort zichtbaar voor het publiek.

De activatie vervalt na vier seconden of zodra de presentator via een
andere bediening navigeert. Direct na een bevestigde skipsprong brengt één
klik op "Vorige" de presentatie terug naar de slide waar de sprong begon;
daarna werkt "Vorige" weer als gewone navigatie. Aan het einde van de deck
wordt het skipdoel begrensd op de laatste slide.

## 9. Speaker notes & timing-metadata

`slides-data.js` krijgt één nieuw optioneel veld per slide: `duration`
(seconden, presenter-only, geen effect op de Presentation View). Notes
blijven ongewijzigd (`slide.notes`); `presenter.js` leest `SLIDES` gewoon
rechtstreeks (zelfde classic-script-`file://`-patroon als vandaag). Totale
geplande tijd = som van `duration`-velden, met een fallback (gelijke
verdeling van een configureerbare totaalduur) voor slides zonder eigen
waarde.

Precieze definitie van de schema-indicatie (correctie op een eerdere,
ambigue formulering — "verstreken tijd tot en met de huidige slide" telt
ten onrechte de nog lopende duur van de huidige slide al mee):

```
plannedStartOfCurrentSlide = som van duration van alle slides VÓÓR currentSlide
scheduleDelta = elapsedTime - plannedStartOfCurrentSlide
```

Negatief → voor op schema (bijv. `-1:35` → "1:35 voor op schema"),
positief → achter op schema (bijv. `+2:10` → "2:10 achter op schema").
Herberekend tegen de daadwerkelijke huidige slide na elke sprong, met de
geplande duur van daadwerkelijk overgeslagen slides meegeteld in
`plannedStartOfCurrentSlide`.

## 10. Presenter.html — structuur

Nieuwe bestanden: `presenter.html`, `presenter.js`, optioneel
`presenter.css` (mag bestaande tokens uit `styles.css` hergebruiken/
`@import`en). Eigen state, uitsluitend presenter-side: de geactiveerde
skipknop met vervaltimer, `lastJumpOriginIndex` (§5), timer start/pauze/reset (los van de *weergave*
van verstreken tijd, die timestamp-based is, niet een opgetelde teller),
lokale klok (`setInterval` + `Date.now()`), en de "niet verbonden"-status
(§3, scenario 6).

**Timer-persistentie over een refresh van de Presenter View heen:** de
timer-state (`timerStartEpoch`, `accumulatedMs`, `running`) leeft alleen in
`presenter.js` (zoals gespecificeerd — bediening staat uitsluitend in de
Presenter View, geen wire-commands, geen wijziging aan `app.js`), maar
wordt bij elke wijziging naar `sessionStorage` geschreven en bij `load`
teruggelezen. Dit voorkomt dat een refresh van de Presenter View de
verstreken tijd terugzet naar `00:00`, zonder dat de timer-state gedeeld
hoeft te worden met de Presentation View. `sessionStorage` is impliciet
gebonden aan dat ene browservenster/tabblad: een refresh behoudt hem, een
echte close+reopen (§3, scenario 3+4) start terecht weer op `00:00`.

Layout volgt de structuur die al eerder is voorgelegd: klok + verstreken
tijd boven, actuele-weergave/volgende-slide-previews met skip-control
naast elkaar, speaker notes daaronder, beide voortgangsbalken (slides +
tijd) met voor/achter-op-schema-indicatie, en onderin de bediening voor
context-overlay, beide asides, pauze-overlay en Vorige/Volgende.

## Bestandswijzigingen — overzicht

| Bestand | Wijziging |
|---|---|
| `app.js` | + knop-clickhandler en keyboard shortcut om Presenter View te openen (§1, uitgeschakeld onder `?embed=preview`), + command-listener/state-broadcaster met bootstrap-regel (§2–4), + pauze-overlay show/hide-functies (§6), + Escape sluit pauze-overlay als laagste-prioriteit-tak (§6). Geen gedeelde `history`-array — bestaande Vorige/`PREVIOUS_SLIDE`-logica blijft ongewijzigd (§5). Verder ongewijzigd. |
| `index.html` | + "Open Presenter View"-knop in de rechter controls-column (§1), + verborgen pauze-overlay markup (§6). Verder ongewijzigd. |
| `styles.css` | + pauze-overlay stijl. Verder ongewijzigd. |
| `slides-data.js` | + optioneel `duration`-veld per slide. Verder ongewijzigd. |
| `config.js` | + optioneel `ui.pauseOverlayText`, + optionele timing-fallback-instelling. |
| `presenter.html` / `presenter.js` / `presenter.css` (nieuw) | Volledige Presenter View, incl. `lastJumpOriginIndex`-boekhouding (§5) en `sessionStorage`-persistentie voor de timer (§10). |

## Out of scope (nu bewust niet gebouwd)

`BLACKOUT_SCREEN`, `START_TIMER`/`PAUSE_TIMER`/`RESET_TIMER` als
protocol-commands, en elke vorm van BroadcastChannel/localStorage-fallback
— het command-mechanisme is zo ontworpen (vaste whitelist, één centrale
handler) dat dit later toegevoegd kan worden zonder de architectuur te
wijzigen, maar wordt nu niet gebouwd omdat er geen concrete behoefte aan
is.
