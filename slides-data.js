/*
 * Slide content for the Skill Engineering Workshop.
 * Plain data only — no DOM/logic here. Loaded as a classic <script> (not a
 * module) so the page keeps working when opened directly via file://.
 *
 * Edit a slide: find its object below and change title / bullets / notes.
 * Add a slide: copy an object, bump `id`, insert it at the right position.
 * Optional `disco: true/false` on a slide overrides CONFIG.disco.enabled
 * just for the transition that lands on that slide. Optional
 * `discoMode: 'auto'/'pause'` overrides CONFIG.disco.mode the same way —
 * 'pause' freezes the disco fully visible until a second matching click.
 * Optional `discoTitleLines: ['LINE', ...]` overrides CONFIG.disco.titleLines
 * just for that slide's transition — one <span> per entry on the disco
 * background, same as the global default. Only meaningful together with
 * `disco: true` (or the global default being on).
 * Optional `align: 'center'/'left'` overrides CONFIG.layout.align for that
 * slide's content block (heading + bullets). A bullet in `bullets` is
 * either a plain string, or `{ text, subtext }` for a smaller, muted line
 * shown below the main bullet text.
 * `icon` is optional — omit it on a title slide to show just the title
 * text, with no icon glyph next to it. Combined with a `subtitle`, this
 * marks the slide as the deck's title slide, which also gives the title
 * text a gradient-accent treatment. Optional `subtitle` renders a
 * tagline line under the title — a per-slide field, not part of
 * `bullets`. Optional `meta: [line, ...]` renders a small byline (e.g.
 * speaker / event / date) pinned to the bottom-left corner of the slide,
 * independent of the centered heading/bullets column.
 * Optional `image: { src, alt }` renders a 200x200 image to the right of
 * the bullet list (see .slide-row-with-image in styles.css) — meant for a
 * one-off mark like a company logo rather than a general content image.
 * The title stays full-width above it. Pass an array of `{ src, alt }`
 * instead to stack several images in that same column (e.g. a photo above
 * a logo).
 * Optional `diagram: { src, alt, logo }` renders a wide diagram/screenshot
 * full-width below the bullet list, sized to stay readable (not
 * cover-cropped like `image`) — use this instead of `image` for a
 * flowchart, screenshot, or anything else meant to be read rather than a
 * logo-style mark. Optional `logo: { src, alt }` on it renders a fixed
 * 200x200 mark (e.g. a company logo) to the diagram's left, in the same
 * row.
 *
 * `title` and `bullets` should always be present (title a non-empty
 * string, bullets an array — `[]` is fine). app.js degrades a missing one
 * defensively rather than crashing, but don't rely on that — a single
 * malformed slide is still worth fixing properly.
 */

// Shared skill.md skeleton — shown inline in the slide itself for the
// "template anchor" slide (31, see isTemplateAnchor below) AND reused
// by the floating "Skill Template" overlay, so it only has to be maintained
// once.
const SKILL_TEMPLATE_MD = `---
name: [naam]
description: [beschrijving — dit bepaalt of de skill wordt getriggerd]
---

## Goal
[Lopende tekst — één of twee zinnen die het doel van de skill beschrijven.]

## Inputs & context
[Welke knowledge files, documenten of assets nodig zijn.]

## Tools
[Welke MCP, sub-agents of code execution de skill gebruikt.]

## Process
1. [Stap 1: actie + benodigde informatie]
2. [Stap 2: actie] → [CHECKPOINT: wat moet de gebruiker hier controleren of aanleveren?]
3. [Stap 3: update naar gebruiker over de status]
4. [Stap 4: actie] → [CHECKPOINT: ...]
5. Controleer of alle stappen zijn doorlopen zoals bedoeld en of alle benodigde informatie voorhanden is. Ontbreekt er iets, stel dan eerst vragen voordat je het resultaat oplevert.

## Output
[Hoe een goed resultaat eruitziet — verwijs naar een example output file indien beschikbaar.]

## Rules
- ALTIJD [...]
- NOOIT [...]`;

// Same skeleton, split into sections for the overlay (and for the
// per-slide highlight while walking through the framework, slides 20-29).
const SKILL_TEMPLATE_SECTIONS = [
  {
    id: 'frontmatter',
    label: 'Frontmatter',
    icon: 'tag',
    body: `---\nname: [naam]\ndescription: [beschrijving — dit bepaalt of de skill wordt getriggerd]\n---`,
  },
  {
    id: 'goal',
    label: 'Goal',
    icon: 'target',
    body: `## Goal\n[Lopende tekst — één of twee zinnen die het doel van de skill beschrijven.]`,
  },
  {
    id: 'inputs',
    label: 'Inputs & context',
    icon: 'inbox',
    body: `## Inputs & context\n[Welke knowledge files, documenten of assets nodig zijn.]`,
  },
  {
    id: 'tools',
    label: 'Tools',
    icon: 'wrench',
    body: `## Tools\n[Welke MCP, sub-agents of code execution de skill gebruikt.]`,
  },
  {
    id: 'process',
    label: 'Process',
    icon: 'steps',
    body: `## Process\n1. [Stap 1: actie + benodigde informatie]\n2. [Stap 2: actie] → [CHECKPOINT: wat moet de gebruiker hier controleren of aanleveren?]\n3. [Stap 3: update naar gebruiker over de status]\n4. [Stap 4: actie] → [CHECKPOINT: ...]\n5. Controleer of alle stappen zijn doorlopen zoals bedoeld en of alle benodigde informatie voorhanden is. Ontbreekt er iets, stel dan eerst vragen voordat je het resultaat oplevert.`,
  },
  {
    id: 'output',
    label: 'Output',
    icon: 'output',
    body: `## Output\n[Hoe een goed resultaat eruitziet — verwijs naar een example output file indien beschikbaar.]`,
  },
  {
    id: 'rules',
    label: 'Rules',
    icon: 'rules',
    body: `## Rules\n- ALTIJD [...]\n- NOOIT [...]`,
  },
];

const SLIDES = [
  {
    id: 1,
    title: 'Elke terugkerende taak verdient een skill!',
    subtitle: 'Wat "skillen" we vandaag?',
    bullets: [],
    meta: ['Bart Heijs', 'AI On Stage', '1 september 2026'],
    notes: '',
  },
  {
    id: 2,
    title: 'Even voorstellen',
    icon: 'tag',
    image: [
      { src: 'assets/bart-muzikant.png', alt: 'Bart als muzikant' },
      { src: 'assets/mendix-logo.jpeg', alt: 'Mendix logo' },
    ],
    bullets: [
      'Bart Heijs',
      'Vrouw en 2 tiener dochters',
      'Muzikant',
      'Conclusion Low Code Company',
      'Mendix developer en Consultant',
    ],
    notes: ``,
  },
  {
    id: 3,
    title: 'Skills helpen mij bij',
    icon: 'layers',
    bullets: [
      {
        text: 'Taken om het modelleren heen',
        subtext: "Userstories refinen, technische implementatie opties verkennen, demo's voorbereiden, testen schrijven, presentaties maken",
      },
      {
        text: 'AI leren de abstractielaag van low-code te begrijpen',
        subtext: 'Low-code werkt met een eigen abstractielaag om code in een schematisch weergave te kunnen lezen en schrijven',
      },
    ],
    notes: ``,
  },
  {
    id: 4,
    title: 'Mendix',
    icon: 'steps',
    diagram: {
      src: 'assets/MF_Voorbeeld.jpeg',
      alt: 'Voorbeeld microflow',
      logo: { src: 'assets/mendix-logo.jpeg', alt: 'Mendix logo' },
    },
    bullets: [
      {
        text: 'Logica zit in microflows',
        subtext: 'Schematische weergave als een stroom diagram',
      },
    ],
    notes: ``,
  },
  {
    id: 5,
    title: 'Wat eten we vandaag?',
    icon: 'chat',
    bullets: [
      'Bijna elke dag dezelfde vraag van mijn kinderen',
    ],
    notes: ``,
  },
  {
    id: 6,
    title: 'Dus vroeg ik het aan AI',
    icon: 'alert',
    bullets: [
      {
        text: '"Zeg Claude, wat kunnen we vanavond eten?"',
        subtext: 'Antwoord: generiek; geen rekening met voorkeuren, dieet, allergieën of wie er aanschuift',
      },
      'Hoe krachtig het model ook is: zonder guard rails, context en instructies blijft het antwoord generiek',
      'Skills leggen dat doel één keer vast — daarna hoef je het niet steeds opnieuw uit te leggen'
    ],
    notes: ``,
  },
  {
    id: 7,
    title: 'Skill engineering',
    icon: 'bulb',
    bullets: [
      'Een waardevolle AI-vaardigheid',
      'De meeste AI aanbieders ondersteunen een vorm van skills',
    ],
    notes: ``,
  },
  {
    id: 8,
    title: 'Wat je leert',
    icon: 'book',
    bullets: [
      'Wat skills zijn en wanneer je ze inzet',
      'Je eigen skills bouwen',
    ],
    notes: ``,
  },
  {
    id: 9,
    title: 'Wat is een skill?',
    icon: 'folder',
    bullets: [
      'Herbruikbare workflow voor een AI-model',
    ],
    notes: ``,
  },
  {
    id: 10,
    title: 'Prompts vs. skills',
    icon: 'compare',
    bullets: [
      'Prompt = eenmalige taak',
      'Skill = terugkerende taak met context en domeinkennis'],
    notes: ``,
  },
  {
    id: 11,
    title: 'Wanneer een prompt',
    icon: 'bolt',
    bullets: [
      'Je de taak zelden doet',
      'De instructie kort is',
      'Er geen vaste workflow is'],
    notes: ``,
  },
  {
    id: 12,
    title: 'Wanneer een skill',
    icon: 'repeat',
    bullets: [
      'Je hetzelfde proces herhaalt',
      'Consistente output belangrijk is',
      'Je het proces wilt kunnen verbeteren',
      'Deel je de skill, dan groeit de impact mee',
    ],
    notes: ``,
  },
  {
    id: 13,
    title: 'Zo ziet een skill eruit',
    icon: 'template',
    disco: true,
    discoMode: 'pause',
    bullets: [
      'SKILL.md markdown bestand, dus tekst',
      'Verpakt in een folder',
    ],
    diagram: { src: 'assets/skill_folder_structuur.jpg', alt: 'Voorbeeld van een skill-folderstructuur' },
    notes: ``,
  },
  {
    id: 14,
    title: 'Voor en door AI',
    icon: 'chat',
    bullets: [
      'Skills kan je zelf schrijven...',
      '...maar met AI gaat het makkelijker.',
      'Claude Desktop heeft daar een skill voor ;-)',
      'Claude skill-creator skill maakt dit voor je aan en zet het op de juiste plek.',
    ],
    notes: ``,
  },
  {
    id: 15,
    title: 'Hoe kom je tot een skill?',
    icon: 'checklist',
    bullets: [
      'De skill-creator skill gebruiken (straks in demo)',
      'Na een succesvolle chat Claude vragen er een skill voor te maken m.b.v. de skill-creator skill',
      'Handmatig maken m.b.v. bijvoorbeeld Visual Studio Code',
      'TIP: Skills van derden downloaden',
    ],
    notes: ``,
  },
  {
    id: 16,
    title: 'Bezint eer ge begint',
    icon: 'pause',
    bullets: [
      'De stap die meestal wordt overgeslagen',
      'Maar met grote impact'],
    notes: ``,
  },
  {
    id: 17,
    title: 'Vragen om over na te denken',
    icon: 'question',
    bullets: [
      'Hoe zou deze skill jouw werk beter maken?',
      'Welk proces wil je dat het volgt?',
      'Waar voegt menselijk oordeel waarde toe?',
      'Hoe ziet de gewenste output eruit?',
      'Wat kan er misgaan?',
      'Hoe test je of de skill goed werkt?',
    ],
    notes: ``,
  },
  {
    id: 18,
    title: 'Eén duidelijk doel',
    icon: 'target',
    bullets: [
      'Veelgemaakte fout: één grote skill voor een heel domein',
      'Geef een skill één duidelijk, afgebakend doel',
      'Twee/drie processen beschreven? Waarschijnlijk twee/drie skills',
    ],
    notes: ``,
  },
  {
    id: 19,
    title: 'Het framework',
    icon: 'layers',
    disco: true,
    discoMode: 'pause',
    discoTitleLines: ['MAAR', 'HOE', 'DAN!?'],
    bullets: [
      'Geen exacte wetenschap, maar een solide startpunt',
      'Ook prettig leesbaar voor mensen, niet alleen voor het model',
    ],
    notes: ``,
  },
  {
    id: 20,
    title: 'Frontmatter',
    icon: 'tag',
    templateSection: 'frontmatter',
    bullets: [
      'Name - de naam van de skill',
      'Description - wanneer de skill getriggerd wordt',
      'YAML Frontmatter',
    ],
    notes: `YAML (Yet Another Markup Language) wordt gebruikt om metadata vast te leggen in Markdown documenten. Wordt door Markdown viewers niet getoond of netjes in tabelvorm.`,
  },
  {
    id: 21,
    title: 'Goal',
    icon: 'target',
    templateSection: 'goal',
    bullets: [
      'Doel van de skill, kort gehouden',
      'Diepgang volgt in de processtappen'],
    notes: ``,
  },
  {
    id: 22,
    title: 'Inputs & context',
    icon: 'inbox',
    templateSection: 'inputs',
    bullets: [
      'Welke informatie heeft het model nodig om de skill uit te kunnen voeren?',
      'Knowledge files, achtergrond informatie, assets',
      'LET OP: Wat het model al weet hoef je niet te vertellen',
    ],
    notes: ``,
  },
  {
    id: 23,
    title: 'Tools',
    icon: 'wrench',
    templateSection: 'tools',
    bullets: [
      'MCP',
      'sub-agents',
      'code execution',
    ],
    notes: ``,
  },
  {
    id: 24,
    title: 'Process: de basis',
    icon: 'steps',
    templateSection: 'process',
    bullets: [
      'Proces stap voor stap uitleggen',
      '- actie',
      '- Benodigde informatie bij die actie',
      '- Eventueel human-in-the-loop checkpoint'],
    notes: ``,
  },
  {
    id: 25,
    title: 'Human-in-the-loop',
    icon: 'checkpoint',
    templateSection: 'process',
    bullets: [
      'Skills ondersteunen vaak human-in-the-loop momenten',
      'Punten waar het model pauzeert voor een vraag, goedkeuring of feedback over voortgang',
      'Dit komt terug als checkpoint in de process-stappen',
      'Zo houdt de gebruiker eigenaarschap',
    ],
    notes: ``,
  },
  {
    id: 26,
    title: 'Laatste proces stap: controle',
    icon: 'check',
    templateSection: 'process',
    bullets: [
      'Check of elke stap is doorlopen zoals bedoeld',
      'Check of alle benodigde informatie voorhanden is',
      'Ontbreekt er iets → meer vragen stellen',
    ],
    notes: ``,
  },
  {
    id: 27,
    title: 'Output',
    icon: 'output',
    templateSection: 'output',
    bullets: [
      'Echte voorbeelden toevoegen als example output file',
      'Tekst/creatief: meerdere variaties aanbieden',
      'Code/data: nadruk op validatie (testen/uitvoeren)',
    ],
    notes: ``,
  },
  {
    id: 28,
    title: 'Rules',
    icon: 'rules',
    templateSection: 'rules',
    bullets: [
      'Voorspel wat er mis kan gaan, schrijf het op als regel',
      'Leg ook vast wat je juist wél wilt zien',
      'Schrijf als opdracht: NIET, NOOIT, ALTIJD',
    ],
    notes: ``,
  },
  {
    id: 29,
    title: 'Rules: verbod + alternatief',
    icon: 'swap',
    templateSection: 'rules',
    bullets: [
      'Koppel een verbod aan het gewenste alternatief',
      'Voorbeeld: "NOOIT klantnamen noemen" + "ALTIJD sector noemen"',
      'Modellen volgen positieve instructies beter op',
    ],
    notes: ``,
  },
  {
    id: 30,
    title: 'Skill groeit continu',
    icon: 'repeat',
    bullets: [
      'Elke keer dat je de skill gebruikt, is een kans om het te verbeteren',
    ],
    notes: ``,
  },
  {
    id: 31,
    title: 'Het skeleton',
    icon: 'template',
    isTemplateAnchor: true,
    bullets: [],
    notes: ``,
  },
  {
    id: 33,
    title: 'Tijd voor de live build',
    icon: 'wrench',
    disco: true,
    discoMode: 'pause',
    discoTitleLines: ['LEARN IT', 'SKILL IT', 'SHIP IT'],
    bullets: [
      '"Wat eten we vandaag" wordt vanavond een echte skill',
      'Rekening houdend met bijvoorbeeld dieet wensen, allergieën en wie er mee-eet',
      'Het tegenovergestelde van het generieke AI-antwoord van net',
    ],
    notes: ``,
  },
  {
    id: 34,
    title: 'Stel dat je maar drie dingen onthoudt',
    icon: 'flag',
    bullets: [
      'Geef elke skill één duidelijk, afgebakend doel — liever meerdere kleine skills dan één grote',
      'Houd de `SKILL.md` gefocust op alleen het proces — de rest hoort in een referentiebestand',
      'Bouw bewust human-in-the-loop checkpoints in',
    ],
    notes: ``,
  },
];
