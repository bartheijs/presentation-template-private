/*
 * Demo content for the reusable presentation template.
 *
 * A real presentation normally changes only this file and config.js. Keep
 * index.html, app.js and styles.css generic so engine improvements can move
 * from develop to main without bringing topic-specific content with them.
 *
 * Each slide requires { id, title, bullets, notes }. Optional fields:
 * - icon: name from the SVG sprite in index.html. Use icons only on
 *   left-aligned slides; centered headings deliberately have no icon.
 * - subtitle / meta: title-slide supporting copy
 * - align: 'center' or 'left' (overrides CONFIG.layout.align)
 * - disco: enables/disables the flashy transition for this slide
 * - discoMode: 'auto' or 'pause'
 * - discoTitleLines: per-slide transition copy
 * - discoHoldMs: extra fully-visible time in auto mode after panels leave
 * - isTemplateAnchor / templateSection: show or highlight the reference
 *   overlay. These legacy internal names implement the generic overlay.
 * - bullets may be strings or { text, subtext } objects
 */

// Generic reference content shown by the "Presentation brief" overlay.
// The variable names are retained for backwards compatibility with app.js.
const SKILL_TEMPLATE_MD = `# Presentation brief

## Purpose
[What should this presentation achieve?]

## Audience
[Who is in the room, and what do they already know?]

## Takeaway
[What is the one thing the audience should remember or do?]

## Outline
1. [Opening: why this matters]
2. [Core argument or learning progression]
3. [Evidence, example or demonstration]
4. [Closing: decision, action or application]

## Delivery
[Duration, language, tone and presenter notes.]`;

const SKILL_TEMPLATE_SECTIONS = [
  {
    id: 'purpose',
    label: 'Purpose',
    icon: 'target',
    body: `## Purpose\n[What should this presentation achieve?]`,
  },
  {
    id: 'audience',
    label: 'Audience',
    icon: 'chat',
    body: `## Audience\n[Who is in the room, and what do they already know?]`,
  },
  {
    id: 'takeaway',
    label: 'Takeaway',
    icon: 'flag',
    body: `## Takeaway\n[What is the one thing the audience should remember or do?]`,
  },
  {
    id: 'outline',
    label: 'Outline',
    icon: 'steps',
    body: `## Outline\n1. [Opening: why this matters]\n2. [Core argument or learning progression]\n3. [Evidence, example or demonstration]\n4. [Closing: decision, action or application]`,
  },
  {
    id: 'delivery',
    label: 'Delivery',
    icon: 'clock',
    body: `## Delivery\n[Duration, language, tone and presenter notes.]`,
  },
];

const SLIDES = [
  {
    id: 1,
    title: 'Presentation Template',
    subtitle: 'Een werkende demo én het startpunt voor je volgende verhaal',
    bullets: [],
    meta: ['main · stabiel template', 'develop · nieuwe features'],
    notes: `Deze demo legt zichzelf uit. Doorloop hem één keer voordat je een nieuwe onderwerpbranch maakt.`,
  },
  {
    id: 2,
    title: 'Begin elke presentatie vanaf main',
    icon: 'folder',
    align: 'left',
    bullets: [
      '`main` bevat de stabiele engine, demo en AI-instructies',
      '`develop` is de kandidaatversie voor nieuwe enginefeatures',
      'Elke echte presentatie krijgt een eigen branch vanaf `main`',
    ],
    notes: `Maak onderwerpbranches nooit vanaf develop. Zo begin je altijd met de laatst goedgekeurde templateversie.`,
  },
  {
    id: 3,
    title: 'Voor een nieuw onderwerp wijzig je vooral twee bestanden',
    icon: 'wrench',
    align: 'left',
    bullets: [
      {
        text: '`config.js` bepaalt het gedrag van de hele presentatie',
        subtext: 'Titel, taal, timer, uitlijning, transitions, overlay en UI-teksten.',
      },
      {
        text: '`slides-data.js` bevat het verhaal',
        subtext: 'Titels, bullets, notities en eventuele overrides per slide.',
      },
      {
        text: '`content-template.md` is het invulformulier voor AI',
        subtext: 'Lever het ingevuld aan om de demo-inhoud gericht te vervangen.',
      },
    ],
    notes: `De enginebestanden horen bij normaal presentatiewerk niet aangepast te worden. Daarmee blijven latere engine-updates makkelijker te integreren.`,
  },
  {
    id: 4,
    title: 'Config groepeert instellingen per functie',
    icon: 'layers',
    align: 'left',
    bullets: [
      '`layout` — standaarduitlijning van de slide-inhoud',
      '`disco` — flashy transition, tekst en auto/pause-modus',
      '`timer` en `transitions` — presentatietempo en animatieduur',
      '`templateOverlay` en `ui` — reference-paneel en zichtbare labels',
    ],
    notes: `Open config.js tijdens de demo. De comments in het bestand beschrijven de ondersteunde waarden en uitzonderingen.`,
  },
  {
    id: 5,
    title: 'Center is geschikt voor één kernboodschap',
    align: 'center',
    bullets: [
      'Rustige compositie',
      'Korte, krachtige copy',
    ],
    notes: `Deze slide overschrijft de globale uitlijning expliciet met align: 'center'.`,
  },
  {
    id: 6,
    title: 'Links uitlijnen werkt beter voor uitleg',
    icon: 'book',
    align: 'left',
    bullets: [
      'Gebruik `CONFIG.layout.align` als standaard voor de hele deck',
      'Gebruik `slide.align` alleen wanneer één slide bewust afwijkt',
      'De binnenkolom blijft in beide gevallen netjes gecentreerd',
    ],
    notes: `Vergelijk de positie van deze inhoud met de vorige slide. Alleen de tekstuitlijning verandert; de vaste contentkolom blijft behouden.`,
  },
  {
    id: 7,
    title: 'Subtekst voegt nuance toe zonder extra bullets',
    icon: 'ruler',
    align: 'left',
    bullets: [
      {
        text: 'Houd de hoofdregel scanbaar',
        subtext: 'Plaats de toelichting in het subtext-veld van hetzelfde bulletobject.',
      },
      {
        text: 'Markdown blijft beschikbaar',
        subtext: 'Gebruik bijvoorbeeld **vet** of `code` waar dat betekenis toevoegt.',
      },
    ],
    notes: `In slides-data.js zie je dat deze bullets objecten zijn met text en subtext, terwijl gewone bullets alleen strings zijn.`,
  },
  {
    id: 8,
    title: 'Een overgang kan per slide uit staan',
    disco: false,
    bullets: [
      'Deze slide landt zonder flashy transition',
      'Een per-slide instelling overschrijft de globale default',
    ],
    notes: `Ook als CONFIG.disco.enabled later op true wordt gezet, blijft deze slide de transition onderdrukken door disco: false.`,
  },
  {
    id: 9,
    title: 'Auto-modus speelt de transition in één keer af',
    disco: true,
    discoMode: 'auto',
    discoHoldMs: 800,
    discoTitleLines: ['AUTO', 'MODE'],
    bullets: [
      'Eén klik is genoeg',
      'De volgende slide verschijnt automatisch na de animatie',
    ],
    notes: `Deze slide demonstreert disco: true, discoMode: 'auto', een extra discoHoldMs van 800 ms en eigen discoTitleLines.`,
  },
  {
    id: 10,
    title: 'Pause-modus maakt ruimte voor een live moment',
    disco: true,
    discoMode: 'pause',
    discoTitleLines: ['PAUSE', 'EN', 'VERVOLG'],
    bullets: [
      'De eerste klik bevriest de transition halverwege',
      'De tweede klik landt op deze slide',
    ],
    notes: `Gebruik dit voor een reveal, publieksvraag of live demonstratie. De teller toont tijdens de pauze een halve slidepositie.`,
  },
  {
    id: 11,
    title: 'De reference-overlay houdt context binnen bereik',
    isTemplateAnchor: true,
    bullets: [],
    notes: `Open de knop “Presentation brief”. Deze anchor-slide toont dezelfde bron ook direct in de slide. De interne veldnaam isTemplateAnchor is om compatibiliteitsredenen behouden.`,
  },
  {
    id: 12,
    title: 'Highlights verbinden de uitleg aan de bron',
    icon: 'target',
    templateSection: 'takeaway',
    align: 'left',
    bullets: [
      'Open de Presentation brief-overlay',
      'Deze slide highlight automatisch de sectie “Takeaway”',
      'Gebruik `templateSection` om andere secties te koppelen',
    ],
    notes: `De overlay kan elke vrije Markdown-referentie bevatten. Zet templateOverlay.enabled op false wanneer een presentatie dit mechanisme niet nodig heeft.`,
  },
  {
    id: 13,
    title: 'Notities zijn voor de presentator, niet voor het publiek',
    icon: 'book',
    align: 'left',
    bullets: [
      'De knop rechts toont of verbergt alle speaker notes',
      'De keuze blijft actief tijdens het navigeren',
      'Slides zonder notities gebruiken automatisch de extra ruimte',
    ],
    notes: `Deze tekst is bewust zichtbaar als demonstratie. Verberg de notities voordat je alleen het presentatiescherm met het publiek deelt.`,
  },
  {
    id: 14,
    title: 'De bediening ondersteunt het live tempo',
    icon: 'clock',
    align: 'left',
    bullets: [
      'Timer met start, pauze en configureerbare extra minuten',
      'Klaar-knop met confetti voor een bewuste afsluiting',
      'Inhoudsopgave en bedieningspaneel kunnen worden ingeklapt',
      'Pijltjestoetsen navigeren door de slides',
    ],
    notes: `Test de timer en de Klaar-knop. De standaardduur en alle labels komen uit config.js.`,
  },
  {
    id: 15,
    title: 'AI kan vanuit een contentdocument de demo vervangen',
    icon: 'spark',
    align: 'left',
    bullets: [
      'Vul `content-template.md` in met onderwerp, slides en notities',
      'Gebruik `scaffold-presentation` voor een volledige nieuwe deck',
      'Gebruik `update-slides` voor gerichte inhoudelijke wijzigingen',
      'Gebruik `test-presentation` om de engine en demo te verifiëren',
    ],
    notes: `De projectspecifieke skills staan in .claude/skills. De README beschrijft dezelfde workflow voor mensen en andere coding agents.`,
  },
  {
    id: 16,
    title: 'Maak nu je eigen presentatiebranch',
    bullets: [
      '`git switch main`',
      '`git switch -c presentation-<onderwerp>`',
      'Vervang de demo-inhoud en laat de engine intact',
      'Test, presenteer en merge onderwerpcontent niet terug naar `main`',
    ],
    notes: `De demo eindigt met de concrete vervolgstap. Engineverbeteringen horen via develop terug te vloeien; onderwerpcontent blijft op de eigen branch.`,
  },
];
