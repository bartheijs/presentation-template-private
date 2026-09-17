# Backlog

Toekomstig werk dat bewust nog niet is uitgevoerd. Zie per item de reden.

---

## Branch-strategie: engine-template vs. persoonlijke presentaties

**Status:** uitgevoerd. De branch `skill-workshop-presentation` bewaart de
oorspronkelijke productiepresentatie op commit `794f8fe`; `main` bevat de
generieke demo/template en `develop` wordt vanaf die versie aangemaakt.

> De onderstaande context en migratiestappen zijn een historisch
> ontwerpverslag. De actuele workflow staat in `README.md`; gebruik die als
> bron voor nieuw werk.

### Context

`main` bevat op dit moment nog de originele, kale versie van de repo: de
persoonlijke "Skill Engineering Workshop"-content, zonder alle
engine-verbeteringen van deze sessie (config.js, disco/pauze-modus,
uitlijning/kolommen, fonts, notities-toggle, skills, testsuite). Al dat werk
staat alleen op `claude/project-overview-dpv3l1` (en de remote-tegenhanger),
nooit gemerged naar `main`.

De gebruiker wil de repo opsplitsen in drie rollen:
- **`main`** — het herbruikbare sjabloon: de volledige engine + een
  zelf-documenterende voorbeeld-presentatie die elke instelmogelijkheid
  uitlegt én live laat zien. Dit is het startpunt voor elke nieuwe
  presentatie.
- **`develop`** — waar nieuwe engine-features gebouwd worden, los van
  specifieke presentatie-content.
- **`presentation-<naam>`** — één branch per echte presentatie, vanaf
  `main` getakt, met eigen content. Vrije naam na de prefix. De huidige
  content van de gebruiker wordt `skill-workshop-presentation`.

### Doelstructuur

```
main                        engine (index.html/app.js/styles.css/config.js/
                             skills/tests) + zelf-documenterende voorbeeld-
                             presentatie ("hoe werkt dit sjabloon")

develop                      zelfde engine + voorbeeld-content, hier komen
                             nieuwe features eerst binnen vóór ze naar main
                             gepromoveerd worden

skill-workshop-presentation  huidige echte content (de workshop van de
                             gebruiker) + de nieuwste engine op het moment
                             van aftakken

presentation-<naam>          toekomstige presentaties, elk vanaf main
                             getakt, vrije naam na de prefix
```

### Migratiestappen (uit te voeren in een latere sessie, ná de presentatie)

1. **`skill-workshop-presentation` aanmaken** vanaf de huidige stand van
   `claude/project-overview-dpv3l1` (engine + echte content) — dit wordt
   direct de branch om vanaf te presenteren, heeft geen verdere wijziging
   nodig.
2. **`claude/project-overview-dpv3l1` mergen naar `main`** — brengt de
   volledige engine naar `main` (de content is op dit punt nog steeds de
   persoonlijke workshop-inhoud).
3. **`main`'s content vervangen** door een nieuwe voorbeeld-/tutorial-deck
   (zie checklist hieronder). Claude stelt hiervoor een eerste concept voor
   bij uitvoering; de gebruiker kan het daarna bijschaven. `config.js` op
   `main` krijgt bijpassende generieke defaults (titel, disco-tekst, etc.).
4. **`develop` aanmaken** vanaf het bijgewerkte `main` (engine +
   voorbeeld-content) — toekomstige features worden hier ontwikkeld.
5. **Workflow documenteren** (README.md-sectie of nieuw `CONTRIBUTING.md`):
   - Nieuwe presentatie starten: tak `presentation-<naam>` af van `main`,
     gebruik de `scaffold-presentation`-skill (of `content-template.md`) om
     de voorbeeld-content te vervangen.
   - Nieuwe engine-feature bouwen: werk op (een branch vanaf) `develop`,
     merge terug naar `develop`; promoot `develop` periodiek naar `main`
     (en werk de voorbeeld-deck bij zodat 'ie de nieuwe feature ook toont).
     Bestaande `presentation-*`-branches kunnen daarna zelf `main` mergen om
     engine-updates te ontvangen zonder hun eigen content te raken.
6. **GitHub-instellingen** (handmatig, niet iets wat Claude zonder overleg
   aanpast): overwegen of `main` de default/protected branch blijft, en of
   `develop` ook bescherming nodig heeft. Aparte beslissing voor de
   gebruiker, buiten scope van dit plan.

### Checklist: wat de voorbeeld-deck op `main` moet laten zien

Geen volledige content nu al uitschrijven — bij uitvoering stelt Claude een
eerste opzet voor (één of enkele slides per punt), gebruiker schaaft bij:

- Welkomst-/introslide: dit is een sjabloon, hoe het te gebruiken.
- Korte uitleg van `config.js`'s opbouw (namespaces).
- Disco: een slide met disco uit, één met auto-modus, één die live de
  pauze-modus (`discoMode: 'pause'`) demonstreert.
- Uitlijning: een center-slide en een links-uitgelijnde slide,
  met uitleg van `CONFIG.layout.align` + per-slide `align`.
- Bullet-subtekst: een live voorbeeld van een `{ text, subtext }`-bullet.
- 8/12-koloms-breedte: beschrijvend (niet per-slide instelbaar).
- Fonts: uitleg van `--font-heading`/`--font-bullet`/`--font-body` (CSS,
  niet config.js).
- Notities-toggle: vermelding van de presenter-knop.
- Timer, confetti, "Klaar!"-knop: kort behandelen.
- Skill Template-overlay: als generiek concept uitleggen (of
  `templateOverlay.enabled: false` tonen voor wie het niet gebruikt).
- Verwijzing naar `content-template.md` + de skills
  (`scaffold-presentation`/`update-slides`/`test-presentation`) als
  aanbevolen manier om een nieuwe `presentation-*`-branch te vullen.

### Kritieke bestanden (bij uitvoering)

- `slides-data.js`/`config.js` op `main` — nieuwe voorbeeld-content.
- `README.md` (of nieuw `CONTRIBUTING.md`) — branch-workflow.
- Git-branches zelf (`skill-workshop-presentation`, `develop`) — geen
  bestandswijzigingen, wel merge-/aftak-operaties.

### Bekend aandachtspunt voor de testsuite — en waarom dit juist goed uitkomt

`tests/README.md` documenteert al dat sommige tests (specifiek de
`isTemplateAnchor`-test in `layout.spec.js`, en de slide-index-aannames in
`disco-and-pause.spec.js`/`notes-toggle.spec.js`/`notes-resize.spec.js`)
aannames doen over welke slide-indexen bepaalde eigenschappen hebben. Zodra
`main`'s content verandert, moeten deze tests gecontroleerd/aangepast
worden aan de nieuwe voorbeeld-deck.

Gebruiker bevestigt: dit is precies waarom `main` én `develop` allebei de
volledige "alle-opties"-voorbeeld-deck horen te hebben (niet een uitgeklede
variant) — omdat die deck bewust élke feature laat zien, is 'ie ook meteen
het beste testmateriaal. D.w.z. bij stap 3/4 hierboven niet een minimale
demo bouwen, maar juist een deck dat elke configureerbare optie bevat, zodat
de testsuite straks tegen die rijke content kan draaien in plaats van tegen
de persoonlijke workshop-content van de gebruiker. `presentation-*`-branches
(met echte, mogelijk kortere content) blijven dan de enige plek waar de
testsuite bewust wat minder dekking heeft — precies zoals nu al voor
`skill-workshop-presentation` het geval zou zijn.

### Verificatie (bij uitvoering)

1. `skill-workshop-presentation`: `index.html` openen, bevestigen dat dit
   exact de huidige, volledig werkende presentatie is (engine + echte
   content) — workshop-klaar zonder verdere wijziging.
2. `main`: `index.html` openen, de voorbeeld-deck doorlopen, bevestigen dat
   elke gedemonstreerde feature (disco-pauze, links uitlijnen, subtekst,
   notities-toggle) daadwerkelijk werkt zoals beschreven.
3. `npx playwright test` draaien op zowel `main` als `develop` na het
   aanpassen van de content-afhankelijke tests.
4. Steekproef: vanaf `main` een nieuwe `presentation-test`-branch
   aanmaken en met de `scaffold-presentation`-skill (of handmatig) vullen,
   om te bevestigen dat de workflow voor een nieuwe presentatie soepel
   werkt.

---

## Generieke naamgeving: disco → flashyTransition, Skill Template → Reference overlay, timer-duidelijkheid

**Status:** gepland, nog niet uitgevoerd. Uit te voeren ná de live-presentatie
van de gebruiker, in een nieuwe sessie — net als de branch-strategie
hierboven, om niets te riskeren vlak vóór het optreden. Deze rename raakt
namelijk niet alleen interne engine-code, maar ook echte content op de
huidige presentatie-branch (bijv. `isTemplateAnchor`/`templateSection` op de
daadwerkelijke slides 9 en 30, en elke `disco`-CSS-class die de live demo
gebruikt).

### Context

Bij het doornemen van de configuratiemogelijkheden gaf de gebruiker feedback
op drie punten:

1. **"disco"** — de flitsende achtergrond-overgang heet overal letterlijk
   "disco" (config-sleutel, functienamen, CSS-classes/variabelen,
   testbestand). Het gevoel/effect moet blijven, maar de naam is niet
   generiek genoeg voor een herbruikbaar sjabloon. Gekozen nieuwe naam:
   **`flashyTransition`**.
2. **"Skill Template"-overlay** — het knop+overlay-mechanisme (highlightbare
   markdown-paneel) is generiek bruikbaar, maar de naamgeving in code
   (`SKILL_TEMPLATE_MD`, `isTemplateAnchor`, standaardtekst "skill.md
   template") is workshop-specifiek. Gekozen nieuwe naam: **"Reference
   overlay"**. De inhoud van het paneel (de daadwerkelijke markdown-tekst)
   blijft bewust vrije, presentatie-specifieke content — alleen het
   mechanisme/de identifiers worden generiek.
3. **Timer** — `CONFIG.timer.defaultMinutes`/`addMinutes` zijn al
   configureerbaar, en de bevestigde gewenste regel is dat de "+N min"-knop
   nooit boven de ingestelde `defaultMinutes` mag uitkomen (dat gedrag is al
   correct/ongewijzigd). Het probleem is puur naamgeving:
   `THIRTY_MIN_MS`/`FIVE_MIN_MS` in `app.js` suggereren hardcoded waarden,
   terwijl ze al afgeleid worden van `CONFIG.timer.*` — waarschijnlijk de
   bron van de "is dit hardcoded?"-vraag.

### Mapping: `disco` → `flashyTransition`

| Huidig | Nieuw |
|---|---|
| `CONFIG.disco.enabled`/`.titleLines`/`.mode` | `CONFIG.flashyTransition.enabled`/`.titleLines`/`.mode` |
| `slide.disco` (per-slide bool) | `slide.flashyTransition` |
| `slide.discoMode` | `slide.flashyTransitionMode` |
| `isDiscoEnabledFor()`/`isDiscoPauseFor()` (app.js) | `isFlashyTransitionEnabledFor()`/`isFlashyTransitionPauseFor()` |
| `discoOn` (lokale var), `DISCO_REVEAL_DELAY_MS`, `DISCO_HIDE_LEAD_MS` | `flashyOn`, `FLASHY_REVEAL_DELAY_MS`, `FLASHY_HIDE_LEAD_MS` |
| `.disco-bg`/`.disco-rays`/`.disco-title`/`.disco-sparkle(-1..12)` (CSS) | `.flashy-bg`/`.flashy-rays`/`.flashy-title`/`.flashy-sparkle(-1..12)` |
| `--disco-backdrop`/`--disco-ray-1..5`/`--disco-title-*`/`--disco-sparkle-color` | `--flashy-backdrop`/`--flashy-ray-1..5`/`--flashy-title-*`/`--flashy-sparkle-color` |
| `@keyframes discoSpin`/`discoTwinkle` | `@keyframes flashySpin`/`flashyTwinkle` |
| `#disco-title` (HTML id) | `#flashy-title` |
| `tests/disco-and-pause.spec.js` (bestandsnaam + describe/test-namen) | `tests/flashy-transition-and-pause.spec.js` |

Ook bijwerken: `tests/config-and-ui.spec.js` (`#disco-title`-locator,
`delete CONFIG.disco`), `tests/README.md`, `README.md`, `content-template.md`
(Dutch frontmatter-labels `disco standaard`/`disco tekst`/`disco modus` →
`flash standaard`/`flash tekst`/`flash modus`), en de drie skill-docs
(`scaffold-presentation`, `update-slides`, `test-presentation`) — inclusief
hun `description`-frontmatter en mapping-tabellen.

### Mapping: "Skill Template"-overlay → "Reference overlay"

| Huidig | Nieuw |
|---|---|
| `CONFIG.templateOverlay.enabled` | `CONFIG.referenceOverlay.enabled` |
| `CONFIG.ui.templateButton` (sleutel; waarde/tekst blijft ongemoeid) | `CONFIG.ui.referenceButton` |
| `CONFIG.ui.overlayTitle` | ongewijzigd (sleutel al generiek; waarde blijft content) |
| `SKILL_TEMPLATE_MD`/`SKILL_TEMPLATE_SECTIONS` (globals, slides-data.js) | `REFERENCE_MD`/`REFERENCE_SECTIONS` — **alleen de variabelenamen**, de markdown-inhoud zelf blijft ongewijzigde presentatie-content |
| `slide.isTemplateAnchor`/`slide.templateSection` | `slide.isReferenceAnchor`/`slide.referenceSection` |
| `openTemplateOverlay()`/`closeTemplateOverlay()`/`renderTemplateOverlay()` | `openReferenceOverlay()`/`closeReferenceOverlay()`/`renderReferenceOverlay()` |
| `.tpl-block`/`.tpl-block--<id>`/`.tpl-heading`/`.tpl-block.is-highlighted` | `.ref-block`/`.ref-block--<id>`/`.ref-heading`/`.ref-block.is-highlighted` |
| `.template-code`/`.slide-template-code` | `.reference-code`/`.slide-reference-code` |
| `#template-overlay`/`#btn-template`/`.btn-template`/`#btn-template-label` | `#reference-overlay`/`#btn-reference`/`.btn-reference`/`#btn-reference-label` |

**Uitzondering (bewust ongemoeid laten):** `#icon-template` (SVG-symbol-id in
de iconenset) — dat is een icoonvorm-naam, niet de featurenaam.
**Uitzondering:** dit hoofdstuk hierboven ("Branch-strategie: engine-template
vs. persoonlijke presentaties") en `content-template.md` gebruiken "template"
in de zin van een repo-/document-sjabloon — een ander concept, niet
aanraken.

Ook bijwerken: `tests/layout.spec.js` (`isTemplateAnchor`-describe/test,
`.slide-template-code`-locator), `tests/config-and-ui.spec.js`,
`tests/regression.spec.js`, `tests/README.md`, `README.md`, en de drie
skill-docs.

**Extra actie in `scaffold-presentation/SKILL.md`:** een expliciete
checkpoint/vraag toevoegen die bij het opzetten van een nieuwe presentatie
vraagt of de "Reference overlay" gebruikt gaat worden, en zo ja, welke
content erin moet (blijft vrije tekst — dit voegt alleen het gesprek erover
toe, geen generieke content-structuur).

### Timer: alleen naamgeving verduidelijken (geen gedragswijziging)

- `THIRTY_MIN_MS` → `TIMER_DEFAULT_MS`, `FIVE_MIN_MS` → `TIMER_ADD_MS`
  (app.js), plus een korte comment die expliciet maakt dat beide van
  `CONFIG.timer.*` zijn afgeleid (niet hardcoded), en dat de "+N min"-knop
  bewust nooit boven de geconfigureerde `defaultMinutes` uitkomt (bevestigd
  gewenst gedrag, geen aparte `maxMinutes`-sleutel nodig).

### Kritieke bestanden (bij uitvoering)

- `app.js`, `config.js`, `styles.css`, `index.html`, `slides-data.js`
- `tests/disco-and-pause.spec.js` (hernoemen), `tests/config-and-ui.spec.js`,
  `tests/layout.spec.js`, `tests/regression.spec.js`, `tests/README.md`
- `README.md`, `content-template.md`
- `.claude/skills/scaffold-presentation/SKILL.md`,
  `.claude/skills/update-slides/SKILL.md`,
  `.claude/skills/test-presentation/SKILL.md`

### Verificatie (bij uitvoering)

1. `grep -ri disco` en `grep -ri "isTemplateAnchor\|SKILL_TEMPLATE\|templateOverlay"`
   over de hele repo draaien — alleen de bewust uitgezonderde treffers
   (icon-template, dit hoofdstuk's "engine-template", content-template.md)
   mogen overblijven.
2. `npx playwright test` — volledige suite groen na de hernoemingen in de
   testbestanden zelf.
3. Visuele controle: `index.html` openen, bevestigen dat de flashy-transition
   achtergrond en de reference-overlay (openen, sluiten, highlight per
   slide) nog exact hetzelfde werken/ogen als voorheen — dit is een pure
   rename, geen gedrags- of visuele wijziging.

---

## Pauzeknop in Presenter View: keuze tussen statisch scherm en aftel-timer

**Status:** gepland, nog niet uitgevoerd. Idee vanuit gebruikersfeedback.

### Context

De pauze-knop in Presenter View (`#btn-toggle-pause-overlay` in
`presenter.html`, `TOGGLE_PAUSE_OVERLAY`-commando, `showPauseOverlay()`/
`hidePauseOverlay()`/`isPauseOverlayVisible()` in `app.js`) doet nu altijd
hetzelfde: het toont direct het statische pauzescherm (`#pause-overlay` met
vaste tekst uit `CONFIG.ui.pauseOverlayText`), tot de presentator 'm zelf
weer uitzet.

Gewenst: op het moment van klikken een keuze aanbieden tussen twee opties.

- **Statisch pauzescherm** — huidig gedrag, ongewijzigd: vaste tekst, de
  presentator bepaalt zelf wanneer het weer verdwijnt.
- **Aftel-timer** — de presentator geeft een tijdsduur op; het publiek ziet
  een aftellende klok in plaats van (of naast) de statische pauzetekst.

### Openstaande ontwerpvragen (bij uitvoering te beslissen)

- Waar/hoe wordt de keuze gepresenteerd? Bijvoorbeeld: de pauze-knop opent
  een klein keuzemenu/popover met de twee opties, in plaats van meteen te
  togglen zoals nu.
- Wat gebeurt er zodra de aftel-timer op 0 komt: sluit het pauzescherm dan
  automatisch (presentatie hervat vanzelf), of blijft het scherm staan tot
  de presentator het handmatig sluit (net als nu)?
- Is de duur per keer vrij in te vullen, of een vaste/geconfigureerde
  standaardwaarde (vergelijkbaar met `CONFIG.timer.defaultMinutes`) die je
  kan overschrijven?
- Moet deze aftel-timer een eigen, aparte state zijn, los van de bestaande
  timer-widget in `app.js`'s rechterkolom en van Presenter View's eigen
  sessietijd, om verwarring te voorkomen?

### Kritieke bestanden (bij uitvoering)

- `presenter.html`/`presenter.js` — de pauze-knop en het keuzemoment.
- `app.js` — `showPauseOverlay()`/`hidePauseOverlay()`/
  `isPauseOverlayVisible()`, `#pause-overlay`/`#pause-overlay-text` in
  `index.html`, en het command-protocol (`TOGGLE_PAUSE_OVERLAY`/
  `SHOW_PAUSE_OVERLAY`/`HIDE_PAUSE_OVERLAY`) dat mogelijk een extra payload
  (de gekozen duur) moet kunnen meesturen.
- `styles.css` — opmaak voor de aftellende klok binnen `.pause-overlay`.
- `config.js` — eventuele standaardwaarde voor de aftel-duur.

---

## Taalvlaggetje: taal live wisselen in plaats van vastzetten bij het maken

**Status:** bewust niet uitgevoerd. Idee vanuit gebruikersfeedback, na
onderzoek geparkeerd omdat de eigenlijke consequentie (tweetalige content)
groter is dan de knop zelf.

### Context

Gevraagd: een vlaggetje in Presenter View waarmee je de taal van de
interface live kan omzetten, in plaats van dat die vastligt bij het maken
van de presentatie. Technisch is de knop zelf niet het probleem — zowel
`app.js` (`APP_I18N`) als `presenter.js` (`PRESENTER_I18N`) hebben al
complete `nl`/`en`-woordenboeken; `CONFIG.lang` wordt nu alleen éénmalig bij
het laden gelezen (`app.js` rond regel 121, vergelijkbaar in
`presenter.js`) om de UI-teksten te kiezen en daarna nooit meer aangeraakt.

De gebruiker gaf zelf aan dat een taalvlaggetje eigenlijk ook zou betekenen
dat de *inhoud* (`slides-data.js`: titels, bullets, quotes, notes) tweetalig
moet worden — en dat is een heel andere, veel grotere klus dan het
omwisselen van vaste UI-labels. Vandaar: niet oppakken totdat er behoefte is
aan een echt tweetalige presentatie-inhoud.

Ook relevant: `README.md` stelt nu expliciet dat taal een bewuste,
eenmalige keuze is bij het maken van de presentatie, niet een
runtime-instelling in de interface. Dit item draait die keuze om en moet
dus ook de README bijwerken zodra het wordt opgepakt.

### Openstaande ontwerpvragen (bij uitvoering te beslissen)

- Wisselt het vlaggetje alleen Presenter View's eigen bediening, of ook het
  publieksscherm (Presentatieweergave)? Het laatste vraagt een nieuw
  postMessage-commando zodat Presenter View het hoofdscherm kan vertellen
  om ook te wisselen, plus dezelfde re-render-logica daar.
- Hoe wordt slide-content (`slides-data.js`) tweetalig? Twee losse
  `SLIDES`-arrays, of per veld een `{ nl, en }`-object? Dit bepaalt hoe
  groot de aanpassing aan `app.js`'s render-functies wordt.
- Blijft `CONFIG.lang` de opstarttaal (eerste keer laden), met het
  vlaggetje alleen als sessie-override, of verdwijnt `CONFIG.lang` als
  concept?

### Kritieke bestanden (bij uitvoering)

- `app.js` — `APP_I18N`, de eenmalige taalkeuze rond regel 121,
  `document.documentElement.lang`.
- `presenter.js` — `PRESENTER_I18N`, dezelfde eenmalige-keuze-aanpak.
- `slides-data.js` — enige content-structuur die tweetalig moet worden.
- `README.md` — de huidige "taal ligt vast bij het maken"-regel.
