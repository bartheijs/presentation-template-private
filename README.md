# Skill Engineering Workshop — presentatie

Interactieve, lokale workshop-presentatie. Geen build, geen server, geen dependencies.

## Gebruiken

Dubbelklik `index.html` (of open het via je browser). Dat is alles.

## Bediening

- **Volgende / Vorige knop** (rechts) of **pijltjestoetsen ←/→**: navigeer met animatie. Slides met `discoMode: 'pause'` (zie `slides-data.js`) laten de overgang halverwege stoppen — volledig zichtbaar bevroren op de disco-achtergrond — tot je nogmaals dezelfde knop/toets gebruikt; tussentijds tonen teller en inhoudsopgave nog de vorige slide (bv. `"3,5 / 31"`).
- **Linker inhoudsopgave**: klik direct naar een slide (geen animatie, springt meteen).
- **Skill Template**-knop (boven de inhoudsopgave): opent het skill.md-skelet als overlay. Op elke slide met een `templateSection`-veld wordt de bijpassende sectie gehighlight. Sluiten met de kruis-knop, klik naast het paneel, of `Esc`. Zet `templateOverlay.enabled` in `config.js` op `false` om deze knop helemaal te verbergen.
- **Timer**: Start/Pause telt af vanaf 30:00. **+5 min** verlengt de resterende tijd, in elke stand (lopend, gepauzeerd, of al op 0:00). Bij het bereiken van 0:00 verschijnt confetti.
- **Klaar!**-knop: vuurt confetti af wanneer jij dat wilt, los van de klok — handig als je eerder klaar bent dan gepland.

## Structuur

- `index.html` — layout-skelet en de icon-sprite (alle iconen als inline SVG, geen externe library).
- `config.js` — presentatie-brede instellingen: titel, taal, timerduur, disco aan/uit + tekst, confetti-kleuren, UI-teksten. Zie hieronder.
- `slides-data.js` — alle slides (`SLIDES`) plus het gedeelde `SKILL_TEMPLATE_MD`/`SKILL_TEMPLATE_SECTIONS` skelet dat zowel in de notes van slide 9/30 als in de overlay wordt gebruikt.
- `app.js` — rendering, navigatie, timer en confetti.
- `styles.css` — layout (CSS grid, 70/30-split via flex-ratio's), kleurenpalet (via CSS-variabelen in `:root`), animaties.

## Een slide bewerken of toevoegen

Open `slides-data.js` en pas het `SLIDES`-array aan. Elk object heeft `{ id, title, icon, bullets, notes }`, optioneel `templateSection` (voor de overlay-highlight bij de sjabloon-slides), optioneel `disco: true/false` om de disco-achtergrond voor de overgang náár die slide af te wijken van de instelling in `config.js`, en optioneel `discoMode: 'auto'/'pause'` (alleen relevant als disco voor die slide aan staat) — `'pause'` laat de overgang halverwege stoppen, volledig zichtbaar bevroren op de disco-achtergrond, tot een tweede, bijpassende klik op Volgende/Vorige. Beschikbare icoon-namen staan als `<symbol id="icon-...">` in `index.html`.

## Een nieuwe presentatie maken (branchen vanaf deze repo)

Een nieuwe presentatie hoeft in principe alleen twee bestanden aan te passen:

- `config.js` — titel, taal, timerduur, disco-instellingen (aan/uit + tekst op de achtergrond + `mode: 'auto'/'pause'`), confetti-kleuren, `templateOverlay.enabled` (verberg de "Skill Template"-knop als je dat concept niet gebruikt), en alle knop-/overlay-teksten (`ui.*`).
- `slides-data.js` — de content zelf, inclusief per-slide `disco`-/`discoMode`-override.

`index.html`, `app.js` en `styles.css` (op het `:root`-kleurenpalet na) horen niet aangepast te hoeven worden.

In plaats van deze bestanden met de hand te bewerken, kun je ook een Markdown
content-document aanleveren (titel, bullets, speaker notes, disco ja/nee, en
de tekst voor de disco-achtergrond) en Claude Code het laten verwerken via
twee projectskills:

- `.claude/skills/scaffold-presentation` — zet een hele nieuwe presentatie op vanuit een content-document.
- `.claude/skills/update-slides` — werkt slides in een bestaande presentatie bij (toevoegen/wijzigen), zonder de rest te raken.

Zie die `SKILL.md`-bestanden voor het exacte documentformaat.

### Bekende grenzen

- Thema-kleuren, inclusief de disco-kleuren (`--disco-*`), blijven in het `:root`-blok van `styles.css` staan — dat is de bewust toegestane uitzondering; er hoeven nooit CSS-*regels* aangepast te worden, alleen de variabelen.
- Confetti-kleuren (`config.js`) en thema/disco-kleuren (`styles.css`) zijn niet aan elkaar gekoppeld — pas ze allebei apart aan voor visuele consistentie.

## Waarom geen modules of fetch()

De pagina wordt via `file://` geopend (dubbelklikken), en browsers blokkeren `fetch()` en `<script type="module">` in die context. Daarom zijn `config.js`, `slides-data.js` en `app.js` bewust **classic scripts**, in die laadvolgorde: ze delen top-level scope, dus `app.js` kan `CONFIG`/`SLIDES` gewoon direct gebruiken.

## Kleuren aanpassen

Alle kleuren staan als CSS custom properties bovenaan `styles.css` (`--accent`, `--accent-2`, ... `--bg`, `--surface`, plus `--disco-*` voor de disco-achtergrond). Wijzig die om het palet aan te passen; de site ondersteunt ook een donker `prefers-color-scheme`-thema (de disco-kleuren blijven bewust hetzelfde in light/dark). Confetti-kleuren staan los daarvan in `config.js` (`confettiColors`).

## Sneltoetsen

- `→` / `←`: volgende / vorige slide
- `Esc`: sluit de Skill Template-overlay
