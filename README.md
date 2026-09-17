# Presentation Template

Interactieve, lokale presentatie-engine met een zelf-documenterende demo.
De presentatie heeft geen build, server of runtime-dependencies nodig: open
`index.html` rechtstreeks in een browser.

## Branchmodel

Deze repository heeft drie vaste branches met elk één duidelijke rol:

- `main` — de stabiele productieversie van het template: engine, werkende
  demo, tests en AI-instructies. Begin elke nieuwe presentatie vanaf deze
  branch.
- `develop` — begint als kopie van `main`. Nieuwe enginefeatures worden hier
  ontwikkeld en getest en gaan pas na goedkeuring naar `main`.
- `skill-workshop-presentation` — de bevroren, onderwerp-specifieke Skill
  Workshop-presentatie. Deze branch is geen ontwikkelbasis en blijft
  inhoudelijk ongemoeid.

Een nieuwe presentatie starten:

```bash
git switch main
git pull --ff-only
git switch -c presentation-<onderwerp>
```

Vervang op die nieuwe branch de demo-inhoud door de echte inhoud. Merge
onderwerpcontent nooit terug naar `main` of `develop`. Een herbruikbare
engineverbetering hoort op `develop`; na review kan `develop` naar `main`
worden gepromoveerd.

## Een presentatie maken

Lever AI de inhoud aan in de vorm die je al hebt: een ruwe tekst, document,
e-mail, lijst met ideeën of bestaande slide-opzet. Geef waar mogelijk drie
dingen mee: het onderwerp, het publiek en wat de presentatie moet bereiken.
Een technisch format of kennis van deze repository is niet nodig.

AI maakt de verhaallijn en slidevolgorde, schrijft bondige slidecopy, kiest
passende layouts en overgangen, voegt speaker notes toe en controleert het
resultaat. Als je al een gewenste volgorde, bronnen of visuele wensen hebt,
kun je die gewoon in normale taal toevoegen.

## Werken met AI

De kortste opdracht kan bijvoorbeeld zijn:

> Maak een presentatie over [onderwerp] voor [publiek]. Na afloop moeten zij
> [gewenste uitkomst]. Gebruik onderstaande tekst als inhoud: …

`content-template.md` is een optioneel hulpmiddel voor wie graag met een
korte briefing begint; alle kopjes en velden daarin zijn vrij. AI mag ook
rechtstreeks met aangeleverde tekst werken.

Onder de motorkap bevat `main` alles wat een coding agent nodig heeft:

- `.claude/skills/scaffold-presentation/SKILL.md` — maakt van vrije tekst een
  volledige presentatie.
- `.claude/skills/update-slides/SKILL.md` — wijzigt of voegt gericht slides
  toe op basis van feedback in gewone taal.
- `.claude/skills/test-presentation/SKILL.md` — voert de Playwright-suite uit
  en helpt fouten aan de juiste enginefunctie te koppelen.

De agent moet eerst bevestigen dat hij op een onderwerpbranch vanaf `main`
werkt en mag `skill-workshop-presentation` nooit als schrijfdoel gebruiken.

### Technische referentie

AI verwerkt de inhoud uiteindelijk in `config.js` en `slides-data.js`.
`CONFIG.lang` bepaalt de vaste bedieningstaal van zowel Presentation View als
Presenter View (`'nl'` of `'en'`). De gedeelde engine bevat beide vertalingen;
een presentatie hoeft dus geen losse bedieningsteksten te onderhouden. Er is
bewust geen taalkeuze in de interface: deze wordt gekozen wanneer de
presentatie wordt gemaakt.
`index.html`, `app.js`, `presenter.html`, `presenter.js`, `presenter.css` en
de overige CSS vormen de gedeelde engine en horen bij gewone
inhoudswijzigingen intact te blijven.

`CONFIG.theme` kiest de visuele stijl: `'default'` (het bestaande lichte
thema, met kleuren/fonts als CSS custom properties bovenaan `styles.css`) of
`'conclusion'` (donker thema met Conclusion-huisstijlkleuren, zie
`themes/conclusion/theme.css`). Net als `CONFIG.lang` wordt dit gekozen
wanneer de presentatie wordt gemaakt, niet tijdens het presenteren.
`CONFIG.brand.businessUnit`/`tagline` vullen de bijpassende chrome
(hoeklogo/footer) van een thema dat dat gebruikt; leeg laten toont een
generieke variant. Presenter View volgt automatisch hetzelfde thema.

Een nieuw thema toevoegen: maak `themes/<naam>/theme.css` met daarin
`:root[data-theme="<naam>"] { --bg: ...; --accent: ...; }` (zie
`themes/conclusion/theme.css` als voorbeeld), en voeg in zowel `index.html`
als `presenter.html` één `<link rel="stylesheet" href="themes/<naam>/theme.css">`
toe naast de bestaande thema-links. `styles.css` zelf hoeft niet te
veranderen.

## Slidegegevens

Elk object in `SLIDES` heeft minimaal:

```js
{
  id: 1,
  layout: 'bullets',
  title: 'Titel',
  bullets: ['Eerste punt'],
  notes: 'Speaker notes',
}
```

`layout` bepaalt de opbouw van de slide en is één van:

- `'title'` — gecentreerde titel + subtitel, geen bullets.
- `'bullets'` — titel + bulletlijst. De algemene, meestgebruikte layout.
- `'list-image'` — bullets in één kolom, `image` ernaast.
- `'quote'` — een uitgelicht citaat (`quote` + optioneel `attribution`) in
  een kleurvlak, optioneel met `image` erbij.
- `'image-only'` — titel + één dominante afbeelding, geen bullets.
- `'icon-grid'` — titel + gelabeld rooster van sprite-iconen (`items`),
  vooral bedoeld als specimen-/stijlslide.
- `'template-reference'` — toont de Presentatiebrief-inhoud inline op de
  slide zelf (interne legacy-functie, was voorheen `isTemplateAnchor: true`).

Beide thema's (`default` en `conclusion`) gebruiken dezelfde layouts —
alleen de kleuren verschillen per thema.

Ondersteunde optionele velden:

- `icon` — naam van een SVG-symbol uit `index.html`; alleen gebruiken op
  links uitgelijnde slides.
- `eyebrow` — korte cursieve regel boven de titel, op elke layout te
  gebruiken (los van `subtitle` hieronder).
- `subtitle` en `meta` — aanvullende tekst voor een titelslide.
- `image: { src, alt }` of een array daarvan — gebruikt door `'list-image'`,
  `'quote'` en `'image-only'`.
- `background: { src, alt }` — optionele full-bleed achtergrondfoto achter
  de slide-inhoud, op elke layout; de engine legt er automatisch een
  donkere overlay overheen zodat titel/bullets leesbaar blijven.
- `quote` en `attribution` — gebruikt door de `'quote'`-layout.
- `items: [{ icon, label }]` — gebruikt door de `'icon-grid'`-layout.
- `align: 'center' | 'left'` — override van `CONFIG.layout.align`.
- `hideTitle: true` — verbergt de titel alleen visueel, zodat bijvoorbeeld
  een `'image-only'`-slide meer ruimte voor de afbeelding krijgt; de titel
  blijft beschikbaar in de inhoudsopgave, Presenter View en voor
  hulptechnologie.
- `disco: true | false` — flashy transition per slide aan of uit.
- `discoMode: 'auto' | 'pause'` — automatisch afspelen of bij vooruit
  navigeren halverwege bevriezen tot een tweede navigatieactie. Teruggaan
  slaat de pauze altijd over.
- `discoHoldMs` — extra volledig zichtbare tijd voor één auto-transition;
  handig wanneer een effect in een demo bewust langer leesbaar moet blijven.
- `discoTitleLines` — eigen transitiontekst voor één slide.
- `templateSection` — markeert één sectie van de Presentatiebrief-overlay
  wanneer die vanaf deze slide wordt geopend (onafhankelijk van `layout`).
- `duration` — gepland aantal seconden voor deze slide, alleen gebruikt door
  Presenter View's schema-indicator. Ontbreekt het, dan valt de indicator
  terug op een gelijke verdeling van de geconfigureerde totale tijd.

Een bullet is een string of een object met extra subtekst:

```js
{ text: 'Scanbare hoofdregel', subtext: 'Kleinere toelichting.' }
```

### Titel- en icoonconventie

Gebruik één van deze twee composities:

- Icoon naast de titel: zet de volledige slide links uitgelijnd.
- Titel gecentreerd: laat `icon` weg; de bullets blijven binnen hun kolom
  links uitgelijnd.

Combineer nooit een icoon met een gecentreerde titel.

## Bediening

- Volgende/Vorige, `←`/`→` of een presentatieklikker navigeert door de
  slides. Gangbare `PageDown`/`PageUp`-signalen worden ook ondersteund.
- De inhoudsopgave springt direct naar een slide.
- Presentatiebrief opent het configureerbare achtergrondpaneel; `Esc` sluit
  hem.
- Notities tonen/verbergen geldt voor de hele sessie.
- De timer kan starten, pauzeren en worden verlengd.
- Klaar! toont de afsluitoverlay en confetti.
- Beide zijpanelen kunnen worden ingeklapt.

### Presenter View

- Presenter View opent via de knop of `Shift+P`, en alleen vanuit de
  Presentatieweergave zelf — niet als losstaand startpunt.
- Vanuit Presenter View navigeer je door de echte presentatie, met een
  live-voorvertoning van de huidige en volgende slide, sprekersnotities en
  een schema-indicator.
- Zodra Presenter View verbonden is, verdwijnt de rechter bedieningskolom uit
  het hoofdscherm. De kolom kan vanuit Presenter View tijdelijk worden
  teruggezet en keert na sluiten terug naar de toestand van vóór de verbinding.
- Presentation View en Presenter View volgen beide `CONFIG.lang` (`'nl'` of
  `'en'`).
- Is Presenter View niet beschikbaar (bijv. het venster is gesloten), dan
  sluit `Esc` de pauze-overlay nog steeds vanuit de Presentatieweergave zelf.

## Configuratie

`CONFIG` is gegroepeerd per functie:

- `theme` — `'default'` of `'conclusion'`, zie Technische referentie hierboven.
- `brand` — `businessUnit`/`tagline`, alleen zichtbaar in thema's die er chrome
  voor tonen (momenteel `conclusion`).
- `toc` — titel van de inhoudsopgave.
- `layout` — standaarduitlijning.
- `disco` — transition aan/uit, tekst en modus. De technische naam bestaat
  nog voor backwards compatibility; zichtbaar wordt dit als een flashy
  transition gepresenteerd.
- `timer` — standaardduur en aantal extra minuten.
- `transitions` — timing in milliseconden.
- `confettiColors` — canvas-kleuren.
- `templateOverlay` — reference-overlay zichtbaar of verborgen.
- `ui` — alle zichtbare knoppen en overlayteksten.

De pagina werkt via `file://`. Daarom zijn `config.js`, `slides-data.js` en
`app.js` bewust classic scripts in die volgorde, zonder modules of `fetch()`.

## Testen

De presentatie zelf heeft geen dependencies. Alleen de optionele testsuite
gebruikt Node en Playwright:

```bash
npm install
npx playwright test
```

Zie `tests/README.md` voor scenario's en installatievoorwaarden. Pas tests
die echte demo-eigenschappen controleren mee aan wanneer de demo bewust
verandert; enginegedrag moet zo veel mogelijk onafhankelijk van specifieke
slide-indexen worden getest.
