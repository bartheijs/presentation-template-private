/*
 * Workshop presentation: Mendix Pluggable Widgets bouwen met AI.
 *
 * Audience-facing copy stays concise; Presenter View contains the detailed
 * facilitation guidance supplied for every slide.
 */

const SKILL_TEMPLATE_MD = '';
const SKILL_TEMPLATE_SECTIONS = [];

const SLIDES = [
  {
    id: 1,
    title: 'AI codeert,\njij regisseert',
    subtitle: 'Mendix Pluggable Widgets bouwen met AI',
    bullets: [],
    notes: `- **Opening:** Open met de kernboodschap van de hele dag in twee zinnen. Geen lange intro — de titel zelf is de hook.
- **Jezelf voorstellen:** Vertel kort wie je bent en waarom je dit doet:
- **ervaring met widgets bouwen**
- **ervaring met AI**
- **leuk om op deze manier kennis te delen.**`,
    duration: 45,
  },
  {
    id: 2,
    title: 'Waarom deze workshop',
    icon: 'target',
    align: 'left',
    bullets: [
      'Hoe stuur je AI aan om een pluggable widget te bouwen?',
      'Hoe zorg je dat je resultaat production-ready is?',
      'Niet elke regel code zelf schrijven, wel elke beslissing zelf nemen',
      'Ervaring opdoen met AI gebruiken',
    ],
    notes: `- **AI vs. developer:** AI heel goed in code schrijven, developer regisseert op inhoudelijke keuzes.
- **"Production-ready"** is werkwijze en kwaliteitscriteria — geen garantie op werkende widget einde dag.
- **"Neits releasen vandaag**`,
    duration: 180,
  },
  {
    id: 3,
    title: 'Voor wie',
    icon: 'chat',
    align: 'left',
    bullets: [
      'Je hoeft geen JS/TS/React-kennis te hebben',
      'Het gaat om de concepten die je AI meegeeft, niet om zelf coderen',
    ],
    notes: `- **Wie heeft ervaring met JS/TS/React?**
- **Wie heeft ervaring met Mendix widgets?**
- **Wie heeft ervaring met AI? Wie heeft ervaring met alles tegelijk?**`,
    duration: 180,
  },
  {
    id: 4,
    title: 'Wat je vandaag (mee)maakt',
    icon: 'output',
    align: 'left',
    bullets: [
      'Je eigen widget-idee, door jou en je teamgenoot gekozen',
      'Je wordt verrast door AI (denk ik)',
      'Aan het eind van de dag: lokaal werkend, al is het klein',
      'Geen live coding, wel project structuur',
    ],
    notes: ``,
    duration: 120,
  },
  {
    id: 5,
    title: 'De dag in vogelvlucht',
    align: 'center',
    bullets: [],
    timeline: [
      { time: '09:00', label: 'Presentatie & scaffolding', icon: 'wrench' },
      { time: '09:45', label: 'Exploring', icon: 'question' },
      { time: '10:30', label: 'Plannen', icon: 'steps' },
      { time: '11:00', label: 'Coderen', icon: 'bolt' },
      { time: '12:00', label: 'Lunchpauze', icon: 'pause', kind: 'break' },
      { time: '12:45', label: 'Coderen', icon: 'bolt' },
      { time: '14:30', label: 'Demo’s', icon: 'party' },
      { time: '15:30', label: 'Einde', icon: 'flag', kind: 'end' },
    ],
    notes: ``,
    duration: 90,
  },
  {
    id: 6,
    title: 'Het proces in één plaatje',
    align: 'center',
    bullets: [],
    timeline: [
      { label: 'Scaffold project', icon: 'wrench', tools: 'Node.js, npm, Git' },
      { label: 'npm install', icon: 'inbox', tools: 'Node.js, npm' },
      { label: 'VS Code + Claude Code', icon: 'folder', tools: 'VS Code, Claude Code CLI + extensie' },
      { label: 'Specs & planning', icon: 'steps', tools: 'Superpowers-skill' },
      { label: 'Code genereren', icon: 'bolt', tools: 'Claude Code extensie, pw-skills' },
      { label: 'Testen in Studio Pro', icon: 'checkpoint', tools: 'Mendix Studio Pro' },
    ],
    notes: `- **Roadmap-slide:** Dit is het overzicht van fase 1 t/m 4 in één plaatje — de rest van de ochtend lopen we deze stappen één voor één in detail door.`,
    duration: 90,
  },
  {
    id: 7,
    title: 'Fase 1: Scaffolding',
    icon: 'wrench',
    align: 'left',
    bullets: [
      'Kies je Mendix-versie: nieuwste 11.12-patch (huidige LTS)',
      'Node.js 22.20.0 (aanbevolen) of hoger is vereist',
      'Maak een testproject in Mendix Studio Pro',
      'Maak een `PluggableWidgets` folder in je projectroot en open daar de terminal',
      '`npx @mendix/generator-widget "MyWidget"` (TypeScript + unit tests aan)',
      '`npm install`',
      '`npm run start`',
      'In Mendix Studio Pro, F4, run en test `Hello World` versie',
      'Optioneel: Voeg de `PluggableWidgets` folder toe aan de .gitignore van het Mendix project',
      'Optioneel: Initialiseer Git, maak de eerste commit',
    ],
    notes: `- **Versiekeuze Mendix:** Meer dan een detail — tussen 10.24 en 11.12 zitten mogelijk breaking changes of nieuwe features, dus als je de widget ook met 10.24 compatible wilt maken, moet je daar bewust rekening mee houden. Voor vandaag houden we het bij de nieuwste 11.12-patch; wie zelf op 10.x zit, pint een specifieke tools-versie, maar dat is geen dagvullend onderwerp.
- **Node-versie updaten:**

\`\`\`
nvm install 22.20.0 64
nvm use 22.20.0
node -v
\`\`\`

- **64-argument:** Dwingt de x64-build af — nvm-windows raadt de architectuur soms verkeerd (bekende bug, geeft dan een “arm64.msi is not available”-foutmelding, ook op gewone x64-laptops). Zonder nvm: download de 22.x-lijn direct van nodejs.org — niet zomaar “latest” pakken, want dat installeert nu Node 26.x (nog geen LTS, valt buiten wat we nodig hebben).
- **Generator-commando:** \`npx @mendix/generator-widget <WidgetName>\` start de generator direct zonder dat je eerst los \`yo\` hoeft te installeren. Geef de widgetnaam als argument mee (tussen aanhalingstekens als er spaties in zitten, bijvoorbeeld \`"My Cool Widget"\`) en de generator maakt zelf een nieuwe submap aan (in kebab-case, bijvoorbeeld \`my-cool-widget\`) op de plek waar je de terminal hebt geopend. Daar komt de hele widget-projectstructuur in te staan. Zonder argument vraagt de generator er interactief naar en schrijft hij in de huidige map zelf, zonder submap.
- **npm install niet vergeten:** Draai eerst \`npm install\` in de widget-map.
- **Git als laatste stap:** (wel voor release, hoeft niet tijdens ontwikkelen) \`git init\`, daarna \`git add .\` en \`git commit -m "Initial scaffold"\` in de widget-map zelf.
- **Achter de hand — 10.24 (niet standaard vandaag):** Voor wie tóch op 10.24 wil: scaffold zoals hierboven en pin daarna in de widget-map een oudere versie van de tools: \`npm install --save-dev @mendix/pluggable-widgets-tools@YOUR_VERSION\`, gevolgd door \`npm run start\`. Dit is de officiële Mendix-procedure uit “Update Pluggable Widgets Tools”. Welk versienummer het beste bij 10.24 past, checken jullie samen in de release notes van pluggable-widgets-tools; dat verandert regelmatig, dus claim hier niet blind een vast nummer.`,
    duration: 900,
  },
  {
    id: 8,
    title: 'Fase 1: Scaffolding — skills klaarzetten',
    icon: 'checklist',
    align: 'left',
    bullets: [
      'Check dat de pw-*-skills aanwezig en actief zijn',
      'Installeer de superpowers-skill (skill van derden)',
    ],
    notes: `- **pw-skills:** Even doorlopen wat ze kunnen.
- **Superpowers-skill installeren:** Een skill van derden: brainstorm, specs maken, plannen.`,
    duration: 300,
  },
  {
    id: 9,
    title: 'Widget-opbouw (1/5): volledig overzicht',
    hideTitle: true,
    icon: 'layers',
    align: 'left',
    bullets: [],
    fullImage: { src: 'assets/01-profile-flip-card-skeleton.jpg', alt: 'Schematisch overzicht van de volledige widget-opbouw' },
    notes: ``,
    duration: 60,
  },
  {
    id: 10,
    title: 'Widget-opbouw (2/5): properties',
    hideTitle: true,
    icon: 'layers',
    align: 'left',
    bullets: [],
    fullImage: { src: 'assets/02-profile-flip-card-skeleton.jpg', alt: 'Schematisch overzicht van de widget-properties' },
    notes: ``,
    duration: 60,
  },
  {
    id: 11,
    title: 'Widget-opbouw (3/5): component tree',
    hideTitle: true,
    icon: 'layers',
    align: 'left',
    bullets: [],
    fullImage: { src: 'assets/03-profile-flip-card-skeleton.jpg', alt: 'Schematisch overzicht van de component tree' },
    notes: ``,
    duration: 60,
  },
  {
    id: 12,
    title: 'Widget-opbouw (4/5): skeleton',
    hideTitle: true,
    icon: 'layers',
    align: 'left',
    bullets: [],
    fullImage: { src: 'assets/04-profile-flip-card-skeleton.jpg', alt: 'Schematisch overzicht van de widget-skeleton' },
    notes: ``,
    duration: 60,
  },
  {
    id: 13,
    title: 'Widget-opbouw (5/5): overige bestanden',
    hideTitle: true,
    icon: 'layers',
    align: 'left',
    bullets: [],
    fullImage: { src: 'assets/05-profile-flip-card-skeleton.jpg', alt: 'Schematisch overzicht van de overige widget-bestanden' },
    notes: ``,
    duration: 60,
  },
  {
    id: 14,
    title: 'Even rondkijken: waar leeft de code?',
    icon: 'folder',
    align: 'left',
    bullets: [
      '`src/<WidgetName>.xml` — configuratie die Studio Pro leest',
      '`src/<WidgetName>.tsx` — widget root component',
      '`src/ui/<WidgetName>.css` — de widget css styling',
      '`src/componenten/..` — de ui componenten (widgets) van de widget',
      '`typings/` — automatisch gegenereerd uit de XML; nooit aanpassen',
    ],
    notes: ``,
    duration: 180,
  },
  {
    id: 15,
    title: 'Projectmechanica naast de widget-code',
    icon: 'layers',
    align: 'left',
    bullets: [
      '`editorConfig.ts` — Zichtbaarheid van properties in widget-configuratie & custom error messages',
      '`editorPreview.tsx` — Design mode-preview, alleen voor web-widgets',
      '`package.json` — naam, versie, afhankelijkheden en build-instellingen',
      '`Widget-icoon`: PNG’s in de projectroot volgens naamconventie',
      '`npm start` / `npm run build` / `npm run release`',
      '`dist/` — hier landt het uiteindelijke `.mpk`-bestand (auto update in widget map)',
    ],
    notes: ``,
    duration: 180,
  },
  {
    id: 16,
    title: 'Bonus: wat zit er nog meer in de widget-XML?',
    icon: 'spark',
    align: 'left',
    bullets: [
      '`<studioProCategory>` — categorie in de Studio Pro-toolbox',
      '`<helpUrl>` — link naar aanvullende hulp-documentatie',
      '`<icon>` (deprecated) — bundel liever een PNG in de widget',
      '`<prompt>` — beschrijft de widget voor AI',
      ],
    notes: ``,
    duration: 150,
  },
  {
    id: 17,
    title: 'Fase 2: Exploring',
    icon: 'question',
    align: 'left',
    bullets: [
      'Voordat er code komt: stress-test je eigen idee',
      { text: 'Gebruik de superpowers-skill (al geïnstalleerd bij Scaffolding)', subtext: 'Werk je plan uit naar features en userstories.' },
      'Vertaal het idee naar properties én gewenst gedrag: specs, testcases, voorbeelden',
      'Werk binnen je widget-project, zodat AI de output blijft gebruiken',
    ],
    notes: ``,
    duration: 240,
  },
  {
    id: 18,
    title: 'Fase 3: Plannen',
    icon: 'steps',
    align: 'left',
    bullets: [
      'Laat Claude Code in plan-modus een implementatieplan maken',
      'AI stelt voor hóe het gebouwd wordt — jij beoordeelt of dat klopt',
      'Pas na akkoord op het plan ga je door naar coderen',
    ],
    notes: ``,
    duration: 180,
  },
  {
    id: 19,
    title: 'Fase 4: Coderen — wat AI doet',
    icon: 'bolt',
    align: 'left',
    bullets: [
      'Krijgt vooraf de skill-suite mee als spelregels',
      'Schrijft de code',
      'Reviewt de eigen code tegen de standaarden met `pw-review`',
      'Kan tests genereren op basis van het gewenste gedrag',
    ],
    notes: ``,
    duration: 240,
  },
  {
    id: 20,
    title: 'Fase 4: Coderen — wat jij doet',
    icon: 'checkpoint',
    align: 'left',
    bullets: [
      'Test doorlopend: klik de widget door in Studio Pro',
      'Zorg voor testdata: domeinmodel + CRUD-pagina’s (mxcli?)',
      'Beoordeel het resultaat tegen je plan — niet de code zelf',
      'Commit vaak, zodat je altijd terug kunt',
    ],
    notes: ``,
    duration: 240,
  },
  {
    id: 21,
    title: 'De bouw- en testcyclus',
    icon: 'repeat',
    align: 'left',
    bullets: [
      'AI past de code aan',
      '`npm run start`-script build automatisch na iedere aanpassing',
      'Mendix studio Pro > F4 > Run',
      'Developer test',
      'Bevinding teruggeven',
      'Tevreden? Comitten.',
    ],
    notes: `- **frontend-tests:** Voor wie verder wil: laat AI ook automatische frontend-tests toevoegen aan deze cyclus, en laat mij weten hoe je dat hebt gedaan.`,
    duration: 180,
  },
  {
    id: 22,
    title: 'Fase 5: Releasen',
    icon: 'output',
    align: 'left',
    bullets: [
      'Versiebump is een bewuste daad, nooit een bijeffect',
      '`npm run release` bouwt de definitieve `.mpk` en lint eerst',
      'Repo-hygiëne: CHANGELOG.md, README.md, BACKLOG.md',
      'Eerst review door Sander of Anthony',
      'Marketplace: privé of publiek (no way back)',
    ],
    notes: ``,
    duration: 180,
  },
  {
    id: 23,
    title: 'Jouw rol als regisseur',
    align: 'center',
    bullets: [
      'AI weet hóe, jij weet wát en waaróm',
      'Elke fase is een beslismoment, geen coderegel',
      'Daarom is deze workshop ook zonder codekennis mogelijk',
    ],
    notes: `- **JS/React kennis wel van toegevoegde waarde geweest?** Laat het me aub weten.`,
    duration: 120,
  },
  {
    id: 24,
    title: 'Praktische afspraken voor vandaag',
    icon: 'clock',
    align: 'left',
    bullets: [
      'Werk in je duo — of alleen, als je dat liever hebt',
      '09:00–15:30 · lunch 12:00–12:45 · demo’s & lessons learned met hapjes om 14:30',
      'AI, je buren of ik kunnen helpen als je vastloopt',
      'Sluit je sessie af met een `pw-skills-usage-report`',
    ],
    notes: `TIP: leg ondertussen vast wat je hebt geleerd in een md-file, of vraag voor het sluiten van de sessie aan AI om dat terug te geven. Dat maakt het (laten) voorbereiden van de demo makkelijker.
- **pw-skills-usage-report:** Laat AI bij het afsluiten van de sessie deze skill draaien voor een rapport over hoe de pw-*-skills zijn gebruikt en hoe effectief dat was.`,
    duration: 90,
  },
  {
    id: 25,
    title: 'Start',
    icon: 'flag',
    align: 'left',
    bullets: [
      'Zoek je duo op — of ga alleen verder',
      'Vanaf nu: Exploring → Plannen → Coderen → Demo’s',
      'Veel plezier — en stel vooral vragen',
    ],
    notes: ``,
    duration: 60,
  },
  {
    id: 26,
    title: 'Go Make It!',
    align: 'center',
    bullets: [],
    // Persistent disco look (not the transient disco-reveal transition):
    // this slide's own content renders the disco rays/sparkles/title, so it
    // stays visible for as long as the slide is shown, arriving and leaving
    // via the ordinary slide transition like any other slide.
    discoSlide: true,
    discoTitleLines: ['GO', 'mAIke', 'IT!'],
    notes: ``,
    duration: 20,
  },
];
