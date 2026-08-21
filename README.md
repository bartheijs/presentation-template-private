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

## Wat je voor een presentatie aanpast

Normaal hoeven maar twee bestanden te veranderen:

- `config.js` — presentatiebrede instellingen: titel, taal, timer,
  uitlijning, flashy transition, confetti, reference-overlay en UI-teksten.
- `slides-data.js` — alle zichtbare slides en speaker notes.

Themakleuren en fonts zijn de bewuste uitzondering: die staan als CSS custom
properties bovenaan `styles.css`. `index.html`, `app.js` en de overige CSS
vormen de gedeelde engine en horen niet aangepast te worden voor gewone
contentwijzigingen.

## Werken met AI

`main` bevat alles wat een coding agent nodig heeft om op dit template voort
te bouwen:

- `content-template.md` — invulbaar contentdocument voor een nieuwe deck.
- `.claude/skills/scaffold-presentation/SKILL.md` — vervangt de demo door een
  volledige presentatie vanuit zo'n contentdocument.
- `.claude/skills/update-slides/SKILL.md` — wijzigt of voegt gericht slides
  toe zonder ongerelateerde inhoud te raken.
- `.claude/skills/test-presentation/SKILL.md` — voert de Playwright-suite uit
  en helpt fouten aan de juiste enginefunctie te koppelen.

Geef een agent bij een nieuwe presentatie minimaal onderwerp, publiek en
doel. Een ingevulde `content-template.md` maakt de overdracht voorspelbaar.
De agent moet eerst bevestigen dat hij op een onderwerpbranch vanaf `main`
werkt en mag `skill-workshop-presentation` nooit als schrijfdoel gebruiken.

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
- `discoMode: 'auto' | 'pause'` — automatisch afspelen of halverwege
  bevriezen tot een tweede navigatieactie.
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

- Volgende/Vorige of `←`/`→` navigeert door de slides.
- De inhoudsopgave springt direct naar een slide.
- Presentation brief opent de configureerbare reference-overlay; `Esc` sluit
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
