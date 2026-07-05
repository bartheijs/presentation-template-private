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
 */

// Shared skill.md skeleton — shown inline in the slide itself for the two
// "template anchor" slides (9 & 30, see isTemplateAnchor below) AND reused
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
// per-slide highlight while walking through the framework, slides 17-28).
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
    title: 'Skill Workshop',
    icon: 'spark',
    bullets: [],
    notes: '',
  },
  {
    id: 2,
    title: 'Intro',
    icon: 'bulb',
    bullets: [
      'Skill engineering: één van de meest waardevolle AI-vaardigheden van 2026',
      'De discipline van ontwerpen, verbeteren en onderhouden van workflows',
    ],
    notes: `- Skill engineering: één van de meest waardevolle AI-vaardigheden om nu op te bouwen
- Skills maken het mogelijk om terugkerende workflows te automatiseren met AI
- Deze workshop noemt die discipline **skill engineering**`,
  },
  {
    id: 3,
    title: 'Wat je leert',
    icon: 'book',
    bullets: [
      'Waarom skill engineering leren',
      'Wat skills zijn en wanneer je ze inzet',
      'Een framework om je eigen skills te bouwen',
      'Geldt voor Claude, ChatGPT en Gemini',
    ],
    notes: `- Waarom skill engineering leren
- Wat skills zijn en wanneer je ze inzet
- Een framework om je eigen skills te bouwen — geen exacte wetenschap, wel een werkend startpunt
- Claude, ChatGPT en Gemini ondersteunen allemaal een vorm van herbruikbare AI-workflows`,
  },
  {
    id: 4,
    title: 'Het probleem',
    icon: 'alert',
    bullets: [
      'AI-modellen worden steeds krachtiger',
      'Maar blijven guard rails, context en instructies nodig hebben',
    ],
    notes: `- Algemene AI-modellen worden enorm krachtig
- Maar blijven altijd specifieke guard rails, context en stap-voor-stap instructies nodig hebben
- Vooral rondom de unieke manier waarop wij dingen doen`,
  },
  {
    id: 5,
    title: 'Prompts vs. skills',
    icon: 'compare',
    bullets: ['Prompt = eenmalige taak', 'Skill = terugkerende taak'],
    notes: `- **Prompts lossen een eenmalige taak op. Skills lossen terugkerende taken op.**
- Een prompt is bedoeld voor één specifieke uitvoering
- Een skill verpakt je proces, context en domeinkennis in iets herbruikbaars en verbeterbaars
- Skills maken expertise overdraagbaar: één keer vastleggen, daarna blijven hergebruiken`,
  },
  {
    id: 6,
    title: 'Wanneer een prompt',
    icon: 'bolt',
    bullets: ['Je de taak zelden doet', 'De instructie kort is', 'Er geen vaste workflow is'],
    notes: `- Je doet de taak zelden
- De instructie is kort
- Er is geen vaste workflow`,
  },
  {
    id: 7,
    title: 'Wanneer een skill',
    icon: 'repeat',
    bullets: [
      'Je hetzelfde proces herhaalt',
      'Kwaliteit belangrijk is',
      'Meerdere mensen hetzelfde doen',
      'Je het proces wilt kunnen verbeteren',
    ],
    notes: `- Je herhaalt hetzelfde proces
- Kwaliteit is belangrijk
- Meerdere mensen doen hetzelfde
- Je wilt het proces kunnen verbeteren`,
  },
  {
    id: 8,
    title: 'Wat is een skill?',
    icon: 'folder',
    bullets: [
      'Herbruikbare workflow voor een AI-model',
      'Verpakt als folder: instructiebestand + reference files + scripts',
      'De folder is de container, niet de skill zelf',
    ],
    notes: `- Een skill is een herbruikbare workflow voor een algemeen AI-model
- Verpakt als een folder: instructiebestand, referentiebestanden, scripts, andere bronnen
- De folder is de container, niet de skill zelf
- Het centrale bestand is \`skill.md\` — de stap-voor-stap instructies voor een specifiek proces`,
  },
  {
    id: 9,
    title: 'Zo ziet een skill.md eruit',
    icon: 'template',
    isTemplateAnchor: true,
    bullets: [],
    notes: `- Concreet: een \`skill.md\` heeft een vaste basisvorm
- Frontmatter (name + description) + secties voor Goal, Process, Output, Rules
- We komen hier later op terug, na het framework
- Onthoud deze vorm — we lopen zo dit hele bestand sectie voor sectie door`,
  },
  {
    id: 10,
    title: 'Maken door te prompten',
    icon: 'chat',
    bullets: [
      'Skills maak en verbeter je door te prompten',
      'Iedereen kan zo zijn taken en workflows automatiseren',
    ],
    notes: `- Je maakt en verbetert skills door te prompten
- Dat betekent dat iedereen zijn taken en workflows kan automatiseren met AI`,
  },
  {
    id: 11,
    title: 'Simpel beginnen',
    icon: 'seed',
    bullets: [
      'Begin met alleen een `skill.md`',
      'Voeg later referentiebestanden toe naarmate de skill volwassener wordt',
    ],
    notes: `- Een skill kan ook richtlijnen bevatten over knowledge files, tools, sub-agents of code execution
- Die aanvullende bestanden maken een skill krachtiger
- Begin eenvoudig: alleen een \`skill.md\` met een procesinstructie
- Voeg later referentiebestanden toe voor meer houvast`,
  },
  {
    id: 12,
    title: 'Voordat je begint',
    icon: 'pause',
    bullets: ['De stap die meestal wordt overgeslagen', 'Maar met grote impact'],
    notes: `- De eerste stap wordt door de meeste mensen overgeslagen
- Toch heeft hij grote impact
- Denk na vóór je gaat prompten — bijvoorbeeld over:`,
  },
  {
    id: 13,
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
    notes: `- Hoe zou deze skill jouw werk beter maken?
- Welk proces wil je dat het volgt?
- Waar voegt menselijk oordeel waarde toe?
- Hoe ziet de gewenste output eruit?
- Wat kan er misgaan?
- Hoe test je of de skill goed werkt?

Nadenken over dit soort vragen houdt elk onderdeel van het framework in dezelfde richting gericht.`,
  },
  {
    id: 14,
    title: 'Testprompts vastleggen',
    icon: 'checklist',
    bullets: [
      'Bedenk representatieve testprompts + verwachte output',
      'Bewaar ze in de skill-folder',
      'Zo check je vanaf versie 1 of iets een verbetering is',
    ],
    notes: `- Bedenk alvast representatieve testprompts + de output die je verwacht
- Bewaar ze in de skill-folder
- Zo check je vanaf versie 1 of een wijziging een verbetering is`,
  },
  {
    id: 15,
    title: 'Eén duidelijk doel',
    icon: 'target',
    bullets: [
      'Veelgemaakte fout: één skill van 1500 regels voor een heel domein',
      'Geef een skill één duidelijk, afgebakend doel',
      'Twee/drie processen beschreven? Waarschijnlijk twee/drie skills',
    ],
    notes: `- Veelgemaakte fout: één skill van 1500 regels voor een heel domein
- Geef een skill één duidelijk, afgebakend doel
- Beschrijf je toch twee of drie processen? Dan zijn het waarschijnlijk twee of drie skills`,
  },
  {
    id: 16,
    title: 'Het framework',
    icon: 'layers',
    bullets: ['Geen exacte wetenschap, maar een solide startpunt'],
    notes: `Dit is het framework — geen exacte wetenschap, maar een solide startpunt.`,
  },
  {
    id: 17,
    title: 'Name & trigger',
    icon: 'tag',
    templateSection: 'frontmatter',
    bullets: [
      'Naam + hoe de skill getriggerd wordt',
      'Basis voor naam en beschrijving in de YAML frontmatter',
      'Kies hier ook: model-invoked of user-invoked',
    ],
    notes: `- Definieer de naam en hoe de skill getriggerd moet worden
- Het model gebruikt dit voor naam + beschrijving in de YAML frontmatter
- Kies hier ook: model-invoked of user-invoked`,
  },
  {
    id: 18,
    title: 'Goal',
    icon: 'target',
    templateSection: 'goal',
    bullets: ['Doel van de skill, kort gehouden', 'Diepgang volgt in de processtappen'],
    notes: `- Definieer het doel van de skill
- Houd het kort — de diepgang komt in de processtappen`,
  },
  {
    id: 19,
    title: 'Inputs & context',
    icon: 'inbox',
    templateSection: 'inputs',
    bullets: ['Welke informatie heeft het model nodig?', 'Knowledge files, achtergronddocumenten, assets'],
    notes: `- Welke informatie heeft het model nodig om dit goed te doen?
- Denk aan knowledge files, achtergronddocumenten en assets`,
  },
  {
    id: 20,
    title: 'Tools',
    icon: 'wrench',
    templateSection: 'tools',
    bullets: ['Context over te gebruiken tools', 'MCP, sub-agents, code execution'],
    notes: `- Geef het model context over de tools die het moet gebruiken
- Denk aan MCP, sub-agents of code execution`,
  },
  {
    id: 21,
    title: 'Process: de basis',
    icon: 'steps',
    templateSection: 'process',
    bullets: ['Proces stap voor stap uitleggen', 'Per stap: actie + benodigde informatie'],
    notes: `- Leg het proces stap voor stap uit
- Per stap: de **actie** — wat er moet gebeuren
- Per stap: de **benodigde informatie** — wat het model erbij nodig heeft`,
  },
  {
    id: 22,
    title: 'Human-in-the-loop',
    icon: 'checkpoint',
    templateSection: 'process',
    bullets: [
      'Goed ontworpen skills ondersteunen human-in-the-loop momenten',
      'Punten waar het model pauzeert voor input of goedkeuring',
      'Dit komt terug als checkpoint in de Process-stappen',
    ],
    notes: `- Goed ontworpen skills ondersteunen human-in-the-loop momenten
- Punten waar het model pauzeert voor jouw input of goedkeuring
- In de Process-sectie geef je dit vorm als checkpoint per stap`,
  },
  {
    id: 23,
    title: 'Process: checkpoint & update',
    icon: 'checkpoint',
    templateSection: 'process',
    bullets: [
      'Checkpoint (indien relevant): waar menselijk oordeel nodig is',
      'Vorm: checkbox, open veld, single select, etc.',
      'Update naar gebruiker: wat er gebeurt en waar je in het proces zit',
    ],
    notes: `- Per stap ook het **checkpoint** (indien relevant): waar is menselijk oordeel nodig, en in welke vorm?
- Denk aan: checkbox, open veld, single select, etc.
- En de **update naar gebruiker**: wat gebeurt er en waar sta je in het proces
- Zo houdt de gebruiker eigenaarschap`,
  },
  {
    id: 24,
    title: 'Laatste stap: controle',
    icon: 'check',
    templateSection: 'process',
    bullets: [
      'Check of elke stap is doorlopen zoals bedoeld',
      'Check of alle benodigde informatie voorhanden is',
      'Ontbreekt er iets → eerst vragen stellen',
    ],
    notes: `- Voeg als laatste stap een controle toe
- Check of elke stap daadwerkelijk is doorlopen zoals bedoeld
- Check of alle benodigde informatie voorhanden is
- Ontbreekt er iets? Stel eerst vragen voordat je oplevert`,
  },
  {
    id: 25,
    title: 'Output',
    icon: 'output',
    templateSection: 'output',
    bullets: [
      'Definieer goede output per stap',
      'Echte voorbeelden toevoegen als example output file',
      'Tekst/creatief: meerdere variaties aanbieden',
      'Code/data: nadruk op validatie (testen/uitvoeren)',
    ],
    notes: `- Definieer hoe goede output eruitziet, per stap
- Echte voorbeelden toevoegen als example output file — zeer effectief om het model te sturen
- Tekst/creatief: laat het model meerdere variaties aanbieden
- Code/data: nadruk op validatie — laat het model testen of uitvoeren`,
  },
  {
    id: 26,
    title: 'Rules: wat vastleggen',
    icon: 'rules',
    templateSection: 'rules',
    bullets: [
      'Voorspel wat er mis kan gaan → schrijf het op als regel',
      'Leg ook vast wat je juist wilt zien',
      'Schrijf als opdracht: NIET, NOOIT, ALTIJD — geen vrijblijvende suggestie',
    ],
    notes: `- Leg vast wat wel en niet mag
- Voorspel wat er mis kan gaan → schrijf het op als regel
- Leg ook vast wat je juist wilt zien
- Schrijf als opdracht — NIET, NOOIT, ALTIJD — geen vrijblijvende suggestie`,
  },
  {
    id: 27,
    title: 'Rules: verbod + alternatief',
    icon: 'swap',
    templateSection: 'rules',
    bullets: [
      'Koppel een verbod aan het gewenste alternatief',
      'Voorbeeld: "NOOIT klantnamen" + "ALTIJD sector noemen"',
      'Modellen volgen positieve instructies beter op',
    ],
    notes: `- Koppel een verbod aan het gewenste alternatief
- Bijv.: niet alleen "NOOIT klantnamen noemen"
- Maar ook "ALTIJD spreken over een klant uit de sector" (bijv. "een klant uit de automotive industrie")
- Modellen volgen positieve instructies doorgaans beter op dan pure verboden`,
  },
  {
    id: 28,
    title: 'Rules: groeit continu',
    icon: 'repeat',
    templateSection: 'rules',
    bullets: [
      'Groeit voortdurend bij gebruik van de skill',
      'Check per bevinding: losstaande rule, of hoort het ergens anders?',
      'Herhaling van terugkerende issues mag',
    ],
    notes: `- Deze sectie groeit voortdurend bij gebruik van de skill
- Check per bevinding: losstaande rule, of hoort het ergens anders?
- Herhaling van terugkerende issues mag`,
  },
  {
    id: 29,
    title: 'Vuistregel: 500 regels',
    icon: 'ruler',
    bullets: [
      'Houd de `skill.md` overal gefocust op alleen het proces',
      'Al het andere hoort in referentiebestanden',
      'Vuistregel: `skill.md` onder de 500 regels',
    ],
    notes: `- Houd de \`skill.md\` overal gefocust op alleen het proces
- Al het andere hoort in referentiebestanden
- Vuistregel: \`skill.md\` onder de 500 regels`,
  },
  {
    id: 30,
    title: 'Terug naar het skeleton',
    icon: 'template',
    isTemplateAnchor: true,
    bullets: [],
    notes: `- Dit is dezelfde \`skill.md\` die je eerder zag
- Nu weet je wat elke sectie betekent
- Frontmatter: name + description
- Secties: Goal, Inputs & context, Tools, Process, Output, Rules
- Het verschil met daarnet: nu snap je waarom elke sectie er staat`,
  },
  {
    id: 31,
    title: 'Tot slot: als je maar drie dingen onthoudt',
    icon: 'flag',
    bullets: [
      'Geef elke skill één duidelijk, afgebakend doel — liever meerdere kleine skills dan één grote',
      'Houd de `skill.md` gefocust op alleen het proces — de rest hoort in een referentiebestand',
      'Bouw bewust human-in-the-loop checkpoints in',
    ],
    notes: `1. **Geef elke skill één duidelijk, afgebakend doel** — liever meerdere kleine skills dan één grote.
2. **Houd de \`skill.md\` gefocust op alleen het proces** — alles wat geen proces is, hoort in een referentiebestand.
3. **Bouw bewust human-in-the-loop checkpoints in** — zonder die momenten verlies je grip op de kwaliteit én raken mensen betrokkenheid en eigenaarschap kwijt.`,
  },
];
