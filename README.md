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
Themakleuren en fonts staan als CSS custom properties bovenaan `styles.css`.
`index.html`, `app.js` en de overige CSS vormen de gedeelde engine en horen
bij gewone inhoudswijzigingen intact te blijven.

## Slidegegevens

Elk object in `SLIDES` heeft minimaal:

```js
{
  id: 1,
  title: 'Titel',
  bullets: ['Eerste punt'],
  notes: 'Speaker notes',
}
```

Ondersteunde optionele velden:

- `icon` — naam van een SVG-symbol uit `index.html`; alleen gebruiken op
  links uitgelijnde slides.
- `subtitle` en `meta` — aanvullende tekst voor een titelslide.
- `align: 'center' | 'left'` — override van `CONFIG.layout.align`.
- `disco: true | false` — flashy transition per slide aan of uit.
- `discoMode: 'auto' | 'pause'` — automatisch afspelen of bij vooruit
  navigeren halverwege bevriezen tot een tweede navigatieactie. Teruggaan
  slaat de pauze altijd over.
- `discoHoldMs` — extra volledig zichtbare tijd voor één auto-transition;
  handig wanneer een effect in een demo bewust langer leesbaar moet blijven.
- `discoTitleLines` — eigen transitiontekst voor één slide.
- `image: { src, alt }` of een array daarvan — afbeeldingen rechts naast de
  bullets.
- `isTemplateAnchor` en `templateSection` — legacy interne veldnamen voor de
  generieke reference-overlay.

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

## Configuratie

`CONFIG` is gegroepeerd per functie:

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
