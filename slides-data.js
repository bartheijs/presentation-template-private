/*
 * Slide content for the Skill Engineering Workshop.
 * Plain data only — no DOM/logic here. Loaded as a classic <script> (not a
 * module) so the page keeps working when opened directly via file://.
 *
 * Edit a slide: find its object below and change title / bullets / notes.
 * Add a slide: copy an object, bump `id`, insert it at the right position.
 */

// Shared skill.md skeleton — used inside slide 9 & 30 notes AND the
// floating "Skill Template" overlay, so it only has to be maintained once.
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
// per-slide highlight while walking through the framework, slides 17-30).
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
    title: 'Titel',
    icon: 'spark',
    bullets: ['Skill Workshop'],
    notes: `Skill Workshop`,
  },
  {
    id: 2,
    title: 'Intro',
    icon: 'bulb',
    bullets: [
      'Skill engineering: één van de meest waardevolle AI-vaardigheden van 2026',
      'De discipline van ontwerpen, verbeteren en onderhouden van workflows',
    ],
    notes: `Ik ben ervan overtuigd dat skill engineering in 2026 een van de meest waardevolle AI-vaardigheden is die je kunt opbouwen. Skills stellen iedereen in staat om terugkerende workflows te automatiseren met AI. Deze workshop gebruikt voor de discipline van het ontwerpen, verbeteren en onderhouden van die workflows de term **skill engineering**.`,
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
    notes: `In deze workshop ontdek je waarom je skill engineering moet leren, wat skills eigenlijk zijn en wanneer je ze inzet, en welk framework je kunt gebruiken om je eigen skills te bouwen — geen exacte wetenschap, maar een startpunt dat werkt. Hoewel de implementatie verschilt, ondersteunen Claude, ChatGPT en Gemini allemaal een vorm van herbruikbare AI-workflows.`,
  },
  {
    id: 4,
    title: 'Het probleem',
    icon: 'alert',
    bullets: [
      'AI-modellen worden steeds krachtiger',
      'Maar blijven guard rails, context en instructies nodig hebben',
    ],
    notes: `We zien allemaal dat algemene AI-modellen enorm krachtig worden. Maar hoe goed ze ook worden, ze hebben altijd specifieke guard rails, context en stap-voor-stap instructies nodig rondom de unieke manier waarop wij dingen doen.`,
  },
  {
    id: 5,
    title: 'Prompts vs. skills',
    icon: 'compare',
    bullets: ['Prompt = eenmalige taak', 'Skill = terugkerende taak'],
    notes: `Kort gezegd: **prompts lossen een eenmalige taak op. Skills lossen terugkerende taken op.** Een prompt is meestal bedoeld voor één specifieke uitvoering. Een skill verpakt jouw proces, context en domeinkennis in iets herbruikbaars, herhaalbaars en makkelijk te verbeteren in de loop van de tijd. Skills maken expertise overdraagbaar: je legt een proces één keer vast en kunt het daarna blijven hergebruiken en verbeteren.`,
  },
  {
    id: 6,
    title: 'Wanneer een prompt',
    icon: 'bolt',
    bullets: ['Je de taak zelden doet', 'De instructie kort is', 'Er geen vaste workflow is'],
    notes: `Gebruik een prompt wanneer je de taak zelden doet, de instructie kort is, of er geen vaste workflow is.`,
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
    notes: `Gebruik een skill wanneer je hetzelfde proces herhaalt, kwaliteit belangrijk is, meerdere mensen hetzelfde doen, of je het proces wilt kunnen verbeteren.`,
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
    notes: `Een skill is een herbruikbare workflow voor een algemeen AI-model. Op de meeste platforms vandaag is het verpakt als een folder met een centraal instructiebestand, referentiebestanden, scripts en andere bronnen — maar de folder is de container, niet de skill zelf. Het centrale bestand is de \`skill.md\`. Zie het als de stap-voor-stap instructies voor een specifiek proces.`,
  },
  {
    id: 9,
    title: 'Zo ziet een skill.md eruit',
    icon: 'template',
    isTemplateAnchor: true,
    bullets: [
      'Concreet: een skill.md heeft een vaste basisvorm',
      'Frontmatter (name + description) + secties voor Goal, Process, Output, Rules',
      'We komen hier later op terug, na het framework',
    ],
    notes: `Om het meteen concreet te maken — dit is hoe zo'n \`skill.md\` eruitziet in de praktijk:

\`\`\`
${SKILL_TEMPLATE_MD}
\`\`\`

Onthoud deze vorm even — we lopen zo dit hele bestand sectie voor sectie door.`,
  },
  {
    id: 10,
    title: 'Maken door te prompten',
    icon: 'chat',
    bullets: [
      'Skills maak en verbeter je door te prompten',
      'Iedereen kan zo zijn taken en workflows automatiseren',
    ],
    notes: `Je maakt en verbetert skills door te prompten. Dat betekent dat iedereen zijn taken en workflows kan automatiseren met AI.`,
  },
  {
    id: 11,
    title: 'Simpel beginnen',
    icon: 'seed',
    bullets: [
      'Begin met alleen een `skill.md`',
      'Voeg later referentiebestanden toe naarmate de skill volwassener wordt',
    ],
    notes: `Naast die kerninstructie kan een skill aanvullende richtlijnen bevatten over hoe en wanneer je knowledge files, tools, sub-agents of code execution inzet. Deze aanvullende bestanden maken een skill nog krachtiger. Om eenvoudig te beginnen kun je een skill bouwen zonder referentiebestanden — alleen een \`skill.md\` met een procesinstructie. Maar naarmate skills volwassener worden, wil je doorgaans referentiebestanden toevoegen om het model meer houvast te geven.`,
  },
  {
    id: 12,
    title: 'Voordat je begint',
    icon: 'pause',
    bullets: ['De stap die meestal wordt overgeslagen', 'Maar met grote impact'],
    notes: `De eerste stap is er een die de meeste mensen overslaan, maar die een grote impact heeft. Voordat je begint met prompten, helpt het om na te denken over vragen als:`,
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
    notes: `Bedenk bij die laatste vraag alvast een paar representatieve testprompts en de output die je daarbij verwacht. Bewaar ze in de skill-folder — zo kun je vanaf de eerste versie checken of een wijziging een verbetering is, in plaats van dat pas achteraf te bedenken.`,
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
    notes: `Een veelgemaakte fout hierbij: één skill van 1500 regels proberen te bouwen die in haar eentje een heel domein dekt. Geef een skill één duidelijk, afgebakend doel — merk je tijdens het beantwoorden van bovenstaande vragen dat je eigenlijk twee of drie processen aan het beschrijven bent? Dan zijn het waarschijnlijk ook twee of drie skills.`,
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
    notes: `**Name & trigger** — Definieer de naam en hoe de skill getriggerd moet worden. Dit gebruikt het model om de naam en beschrijving in de YAML frontmatter te schrijven. Kies hier ook of de skill model-invoked of user-invoked wordt.`,
  },
  {
    id: 18,
    title: 'Goal',
    icon: 'target',
    templateSection: 'goal',
    bullets: ['Doel van de skill, kort gehouden', 'Diepgang volgt in de processtappen'],
    notes: `**Goal** — Definieer het doel van de skill. Houd het kort — in de processtappen ga je dieper.`,
  },
  {
    id: 19,
    title: 'Inputs & context',
    icon: 'inbox',
    templateSection: 'inputs',
    bullets: ['Welke informatie heeft het model nodig?', 'Knowledge files, achtergronddocumenten, assets'],
    notes: `**Inputs & context** — Welke informatie heeft het model nodig om dit goed te doen? Denk aan knowledge files, achtergronddocumenten en assets.`,
  },
  {
    id: 20,
    title: 'Tools',
    icon: 'wrench',
    templateSection: 'tools',
    bullets: ['Context over te gebruiken tools', 'MCP, sub-agents, code execution'],
    notes: `**Tools** — Geef het model context over de tools die het in deze skill moet gebruiken, zoals MCP, sub-agents of code execution.`,
  },
  {
    id: 21,
    title: 'Process: de basis',
    icon: 'steps',
    templateSection: 'process',
    bullets: ['Proces stap voor stap uitleggen', 'Per stap: actie + benodigde informatie'],
    notes: `**Process** — Leg het proces stap voor stap uit. Beschrijf per stap de **actie** — wat er in deze stap moet gebeuren — en de **benodigde informatie** — welke aanvullende informatie het model hierbij nodig heeft.`,
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
    notes: `Goed ontworpen skills ondersteunen ook human-in-the-loop momenten: punten in het proces waar het model pauzeert voor jouw input of goedkeuring. In de Process-sectie geef je dit concreet vorm als checkpoint per stap.`,
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
    notes: `Beschrijf ook per stap het **checkpoint** (indien relevant) — waar menselijk oordeel/input nodig is en in welke vorm (checkbox, open veld, single select, etc.) — en de **update naar gebruiker** — wat je meldt over wat er gebeurt en waar je in het proces zit, zodat de gebruiker eigenaarschap houdt.`,
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
    notes: `Voeg als laatste stap een controle toe: check of elke stap daadwerkelijk is doorlopen zoals bedoeld en of alle benodigde informatie voorhanden is. Ontbreekt er iets, stel dan eerst vragen voordat je het resultaat oplevert.`,
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
    notes: `**Output** — Definieer hoe een goede output eruitziet voor elke stap. Als je echte voorbeelden hebt, voeg ze dan toe als example output file — ze zijn een van de meest effectieve manieren om het model te sturen. Bij tekstuele of creatieve output vraag je het model waar mogelijk meerdere variaties aan te bieden om uit te kiezen. Bij code of gestructureerde data ligt de nadruk op validatie: laat het model de output testen of uitvoeren voordat hij wordt opgeleverd.`,
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
    notes: `**Rules** — Leg vast wat wel en niet mag: voorspel wat er mis kan gaan en schrijf dat op als regel. Leg ook vast wat je juist wilt zien. Schrijf rules heel duidelijk op: geef écht een opdracht — NIET, NOOIT of ALTIJD — in plaats van een vrijblijvende suggestie.`,
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
    notes: `Koppel een verbod waar mogelijk aan het gewenste alternatief — bijvoorbeeld niet alleen "NOOIT klantnamen noemen" maar ook "ALTIJD spreken over een klant uit de sector, bijvoorbeeld 'een klant uit de automotive industrie'". Modellen volgen positieve instructies doorgaans beter op dan pure verboden.`,
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
    notes: `Deze sectie groeit voortdurend naarmate je de skill gebruikt en verbetert. Vraag jezelf bij elke bevinding af of het een losstaande rule is, of dat het eigenlijk beter thuishoort in een andere sectie van de skill. Je mag hier ook dingen herhalen die niet altijd goed gaan.`,
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
    notes: `Houd de \`skill.md\` door het hele framework heen gefocust op alleen het proces — al het andere hoort thuis in referentiebestanden. Houd als vuistregel je \`skill.md\` onder de 500 regels.`,
  },
  {
    id: 30,
    title: 'Terug naar het skeleton',
    icon: 'template',
    isTemplateAnchor: true,
    bullets: [
      'Dit is dezelfde skill.md die je eerder zag',
      'Nu weet je wat elke sectie betekent',
      'Frontmatter: name + description',
      'Secties: Goal, Inputs & context, Tools, Process, Output, Rules',
    ],
    notes: `Zo ziet het framework eruit als je het samenbrengt in een echte \`skill.md\` — dezelfde vorm die je eerder al zag:

\`\`\`
${SKILL_TEMPLATE_MD}
\`\`\`

Het verschil met daarnet: nu snap je waarom elke sectie er staat.`,
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
    notes: `Als je maar drie dingen onthoudt, laat het deze zijn:
1. **Geef elke skill één duidelijk, afgebakend doel** — liever meerdere kleine skills dan één grote.
2. **Houd de \`skill.md\` gefocust op alleen het proces** — alles wat geen proces is, hoort in een referentiebestand.
3. **Bouw bewust human-in-the-loop checkpoints in** — zonder die momenten verlies je grip op de kwaliteit én raken mensen betrokkenheid en eigenaarschap kwijt.`,
  },
];
