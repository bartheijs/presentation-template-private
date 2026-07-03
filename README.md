# Skill Engineering Workshop — presentatie

Interactieve, lokale workshop-presentatie. Geen build, geen server, geen dependencies.

## Gebruiken

Dubbelklik `index.html` (of open het via je browser). Dat is alles.

## Bediening

- **Volgende / Vorige knop** (rechts) of **pijltjestoetsen ←/→**: navigeer met animatie.
- **Linker inhoudsopgave**: klik direct naar een slide (geen animatie, springt meteen).
- **Skill Template**-knop (boven de inhoudsopgave): opent het skill.md-skelet als overlay. Tussen slide 17 en 28 wordt de bijpassende sectie gehighlight. Sluiten met de kruis-knop, klik naast het paneel, of `Esc`.
- **Timer**: Start/Pause telt af vanaf 30:00. **+5 min** verlengt de resterende tijd, in elke stand (lopend, gepauzeerd, of al op 0:00). Bij het bereiken van 0:00 verschijnt confetti.
- **Klaar!**-knop: vuurt confetti af wanneer jij dat wilt, los van de klok — handig als je eerder klaar bent dan gepland.

## Structuur

- `index.html` — layout-skelet en de icon-sprite (alle iconen als inline SVG, geen externe library).
- `slides-data.js` — alle 31 slides (`SLIDES`) plus het gedeelde `SKILL_TEMPLATE_MD`/`SKILL_TEMPLATE_SECTIONS` skelet dat zowel in de notes van slide 9/30 als in de overlay wordt gebruikt.
- `app.js` — rendering, navigatie, timer en confetti.
- `styles.css` — layout (CSS grid, 70/30-split via flex-ratio's), kleurenpalet (via CSS-variabelen in `:root`), animaties.

## Een slide bewerken of toevoegen

Open `slides-data.js` en pas het `SLIDES`-array aan. Elk object heeft `{ id, title, icon, bullets, notes }`, optioneel `templateSection` (voor de overlay-highlight bij slides 17-28). Beschikbare icoon-namen staan als `<symbol id="icon-...">` in `index.html`.

## Waarom geen modules of fetch()

De pagina wordt via `file://` geopend (dubbelklikken), en browsers blokkeren `fetch()` en `<script type="module">` in die context. Daarom zijn `slides-data.js` en `app.js` bewust **classic scripts**: ze delen top-level scope, dus `app.js` kan `SLIDES` gewoon direct gebruiken.

## Kleuren aanpassen

Alle kleuren staan als CSS custom properties bovenaan `styles.css` (`--accent`, `--accent-2`, ... `--bg`, `--surface`). Wijzig die om het palet aan te passen; de site ondersteunt ook een donker `prefers-color-scheme`-thema.

## Sneltoetsen

- `→` / `←`: volgende / vorige slide
- `Esc`: sluit de Skill Template-overlay
