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
 *
 * `title` and `bullets` should always be present (title a non-empty
 * string, bullets an array — `[]` is fine). app.js degrades a missing one
 * defensively rather than crashing, but don't rely on that — a single
 * malformed slide is still worth fixing properly.
 */

// Shared skill.md skeleton — shown inline in the slide itself for the two
// "template anchor" slides (13 & 32, see isTemplateAnchor below) AND reused
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
// per-slide highlight while walking through the framework, slides 16-27).
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
    title: 'Wat eten we vandaag?',
    icon: 'chat',
    bullets: [
      'Bijna elke dag dezelfde vraag van mijn kinderen',
    ],
    notes: `Persoonlijke opener. Herkenbaar en luchtig — zet de menselijke toon voor de rest van de talk.`,
  },
  {
    id: 4,
    title: 'Dus vroeg ik het aan AI',
    icon: 'alert',
    bullets: [
      '"Zeg Claude, wat kunnen we vanavond eten?"',
      'Antwoord: generiek; geen rekening met voorkeuren, dieet, allergieën of wie er aanschuift',
    ],
    notes: `Brug naar het eigenlijke probleem: hoe krachtig het model ook is, een open vraag levert een generiek antwoord op.`,
  },
  {
    id: 5,
    title: 'Open vraag, generiek antwoord',
    icon: 'target',
    bullets: [
      'Een open vraag aan AI levert een generiek antwoord op',
      'Zeker als het een herhalende vraag is: telkens dezelfde open vraag, telkens weer een generiek antwoord',
      'Vertel AI hoe de uitkomst eruit moet zien, en je krijgt iets bruikbaars',
      'Precies daarom bestaan skills: het doel vastleggen, niet alleen de vraag',
    ],
    notes: `Kernles die de rest van de talk motiveert — bruggetje naar de volgende slide over skill engineering.`,
  },
  {
    id: 6,
    title: 'Intro',
    icon: 'bulb',
    bullets: [
      'Skill engineering: één van de meest waardevolle AI-vaardigheden van 2026',
      'De meeste AI aanbieders ondersteunen een vorm van skills',
    ],
    notes: ``,
  },
  {
    id: 7,
    title: 'Wat je leert',
    icon: 'book',
    bullets: [
      'Wat skills zijn en wanneer je ze inzet',
      'Een manier om je eigen skills te bouwen',
    ],
    notes: ``,
  },
  {
    id: 8,
    title: 'Het probleem',
    icon: 'alert',
    bullets: [
      'AI-modellen worden steeds krachtiger',
      'Maar blijven guard rails, context en instructies nodig hebben',
    ],
    notes: ``,
  },
  {
    id: 9,
    title: 'Prompts vs. skills',
    icon: 'compare',
    bullets: [
      'Prompt = eenmalige taak',
      'Skill = terugkerende taak met context en domeinkennis'],
    notes: ``,
  },
  {
    id: 10,
    title: 'Wanneer een prompt',
    icon: 'bolt',
    bullets: [
      'Je de taak zelden doet',
      'De instructie kort is',
      'Er geen vaste workflow is'],
    notes: ``,
  },
  {
    id: 11,
    title: 'Wanneer een skill',
    icon: 'repeat',
    bullets: [
      'Je hetzelfde proces herhaalt',
      'Consistente output belangrijk is',
      'Je het proces wilt kunnen verbeteren',
    ],
    notes: ``,
  },
  {
    id: 12,
    title: 'Wat is een skill?',
    icon: 'folder',
    disco: true,
    discoMode: 'pause',
    bullets: [
      'Herbruikbare workflow voor een AI-model',
      'skill.md markdown bestand',
      'Verpakt in folder met reference files, voorbeelden van input/output, tools',
    ],
    notes: ``,
  },
  {
    id: 13,
    title: 'Zo ziet een skill.md eruit',
    icon: 'template',
    isTemplateAnchor: true,
    bullets: [],
    notes: `
    - een \`skill.md\` heeft een vaste basisvorm
    - Frontmatter (name + description) + proces omschrijving
    - De vorm van dit bestand is een framework dat je zou kunnen volgen`,
  },
  {
    id: 14,
    title: 'Voor en door AI',
    icon: 'chat',
    disco: true,
    discoMode: 'pause',
    discoTitleLines: ['MAAR', 'HOE', 'DAN!?'],
    bullets: [
      'Skills kan je zelf schrijven...',
      '...maar met AI gaat het makkelijker.',
    ],
    notes: ``,
  },
  {
    id: 15,
    title: 'Simpel beginnen',
    icon: 'seed',
    bullets: [
      'Begin met alleen een `skill.md`',
      'Voeg later referentiebestanden toe naarmate de skill volwassener wordt',
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
      'Veelgemaakte fout: één skill van 1500 regels voor een heel domein',
      'Geef een skill één duidelijk, afgebakend doel',
      'Twee/drie processen beschreven? Waarschijnlijk twee/drie skills',
    ],
    notes: ``,
  },
  {
    id: 19,
    title: 'Het framework',
    icon: 'layers',
    bullets: [
      'Geen exacte wetenschap, maar een solide startpunt',
    ],
    notes: ``,
  },
  {
    id: 20,
    title: 'Frontmatter',
    icon: 'tag',
    templateSection: 'frontmatter',
    disco: true,
    discoMode: 'pause',
    discoTitleLines: ['LEARN IT', 'SKILL IT', 'SHIP IT'],
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
      '- benodigde informatie',
      '- human-in-the-loop checkpoint'],
    notes: ``,
  },
  {
    id: 25,
    title: 'Human-in-the-loop',
    icon: 'checkpoint',
    templateSection: 'process',
    bullets: [
      'Goed ontworpen skills ondersteunen human-in-the-loop momenten',
      'Punten waar het model pauzeert voor een vraag of goedkeuring',
      'Dit komt terug als checkpoint in de process-stappen',
    ],
    notes: ``,
  },
  {
    id: 26,
    title: 'Checkpoint',
    icon: 'checkpoint',
    templateSection: 'process',
    bullets: [
      'Vraag: vaak input veld of multi select',
      'Update: wat er gebeurt en waar je in het proces zit',
      'Zo houdt de gebruiker eigenaarschap',
    ],
    notes: ``,
  },
  {
    id: 27,
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
    id: 28,
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
    id: 29,
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
    id: 30,
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
    id: 31,
    title: 'Rules: groeit continu',
    icon: 'repeat',
    templateSection: 'rules',
    bullets: [
      'Groeit: bij gebruik van de skill kan je bevindingen toevoegen',
      'Check per bevinding: losstaande rule, of hoort het ergens anders?',
      'Herhaling van terugkerende issues in andere vorm kan werken',
    ],
    notes: ``,
  },
  {
    id: 32,
    title: 'Het skeleton',
    icon: 'template',
    isTemplateAnchor: true,
    bullets: [],
    notes: ``,
  },
  {
    id: 33,
    title: 'Tips',
    icon: 'ruler',
    bullets: [
      'Houd de `skill.md` gefocust op het proces',
      'Al het andere hoort in referentiebestanden',
      'Vuistregel: `skill.md` onder de 500 regels',
    ],
    notes: ``,
  },
  {
    id: 34,
    title: 'Tijd voor de live build',
    icon: 'wrench',
    bullets: [
      '"Wat eten we vandaag" wordt vanavond een echte skill',
      'Rekening houdend met voorkeuren, dieet, allergieën en wie er mee-eet',
      'Het tegenovergestelde van het generieke AI-antwoord van net',
    ],
    notes: `Transitie naar het live-bouwmoment. Start hier de timer. Geen scriptinhoud op de slide zelf — de build gebeurt live in de tool.`,
  },
  {
    id: 35,
    title: 'Stel dat je maar drie dingen onthoudt',
    icon: 'flag',
    bullets: [
      'Geef elke skill één duidelijk, afgebakend doel — liever meerdere kleine skills dan één grote',
      'Houd de `skill.md` gefocust op alleen het proces — de rest hoort in een referentiebestand',
      'Bouw bewust human-in-the-loop checkpoints in',
    ],
    notes: ``,
  },
];
