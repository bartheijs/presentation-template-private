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
    notes: `Open met de kernboodschap van de hele dag in twee zinnen. Geen lange intro — de titel zelf is de hook. Vertel kort wie je bent en waarom je dit doet: je eigen skill-suite en je ervaring met widgets bouwen met AI.`,
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
    ],
    notes: `Leg uit dat AI heel goed code kan schrijven, maar niet weet wélke keuzes goed zijn voor jouw project — welke properties, welke edge cases, welke afhankelijkheden. Dat is waar de developer als regisseur naar voren komt.

Let op: “production-ready” slaat hier op de werkwijze en kwaliteitscriteria die je vandaag leert — niet op een garantie dat je eigen widget aan het eind van de dag alles aankan. Dat verwacht je ook niet van iemand die voor het eerst een widget bouwt; klein en werkend is het echte doel (zie slide 4). Dit is de rode draad voor de rest van de dag.`,
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
    notes: `Begin geruststellend: geen coding-achtergrond nodig, dat is een pré, geen vereiste. Bouw dan naar de lichte uitdaging toe — noem het gerust een experiment: kan iemand zonder codekennis, met AI en de juiste sturing, toch een werkende widget opleveren? Dat maakt het spannend zonder dat het bedreigend wordt.

Vraag hier ook echt even handen omhoog — een kort, licht moment om de zaal wakker te maken en een beeld te krijgen van de spreiding in ervaring. Dit is het enige echte interactiemoment vóór het hands-on gedeelte begint; daarna zit de interactie al vanzelf in het meetypen tijdens Scaffolding.`,
    duration: 180,
  },
  {
    id: 4,
    title: 'Wat je vandaag maakt',
    icon: 'output',
    align: 'left',
    bullets: [
      'Je eigen widget-idee, door jou en je teamgenoot gekozen',
      'Aan het eind van de dag: lokaal volledig werkend, al is het klein',
      'Geen live coding door mij',
    ],
    notes: `Wees hier expliciet over het succescriterium: klein en werkend is beter dan groot en kapot. Leg uit dat je zelf niet live gaat zitten coderen op het scherm, maar dat je af en toe wisselt naar je eigen VSC/Studio Pro om iets concreets te laten zien uit een bestaande widget van jezelf.`,
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
    notes: `Dit is de echte dagplanning, niet het conceptuele 6-fasenmodel. Loop de starttijden kort langs: 09:00 presentatie en scaffolding, 09:45 Exploring, 10:30 Plannen en vanaf 11:00 Coderen. Om 12:00 is er lunchpauze; om 12:45 gaat Coderen verder. De demo’s beginnen om 14:30 en de workshop eindigt om 15:30. Releasen komt in de presentatie nog kort aan bod, maar is geen apart praktisch tijdsblok.

Loop de blokken kort langs zonder in te zoomen — dit is de roadmap, niet de inhoud. Testen is bewust geen aparte stap: als developer test je continu terwijl je codeert, dus dat hoort al bij Coderen. Vertel dat de rest van de dag deze indeling volgt en dat dit de kapstok is waar alles aan hangt.`,
    duration: 90,
  },
  {
    id: 6,
    title: 'Fase 1: Scaffolding',
    icon: 'wrench',
    align: 'left',
    bullets: [
      'Kies je Mendix-versie: nieuwste 11.12-patch (huidige LTS)',
      'Node.js 22.20.0 (aanbevolen) of hoger is vereist',
      'Maak een testproject in Mendix Studio Pro',
      'Maak een `PluggableWidgets` folder in je projectroot en open daar de terminal',
      'Voeg de `PluggableWidgets` folder toe aan de .gitignore van het Mendix project',
      '`npx @mendix/generator-widget "MyWidget"` (TypeScript + unit tests aan)',
      '`npm install`',
      'Initialiseer Git, maak de eerste commit',
      '`npm run start`',
      'In Mendix Studio Pro, F4, run en test `Hello World` versie',
    ],
    notes: `Dit zijn bewuste keuzes die de developer maakt vóórdat AI iets ziet — niet aan AI overlaten. De versiekeuze is meer dan een detail: tussen 10.24 en 11.12 zitten mogelijk breaking changes of nieuwe features, dus als je de widget ook met 10.24 compatible wilt maken, moet je daar bewust rekening mee houden. Voor vandaag houden we het bij de nieuwste 11.12-patch; wie zelf op 10.x zit pint een specifieke tools-versie, maar dat is geen dagvullend onderwerp.

**Iemand heeft een te oude Node-versie?** Update met een version manager:

\`\`\`
nvm install 22.20.0 64
nvm use 22.20.0
node -v
\`\`\`

Het \`64\`-argument dwingt de x64-build af — nvm-windows raadt de architectuur soms verkeerd (bekende bug, geeft dan een “arm64.msi is not available”-foutmelding, ook op gewone x64-laptops). Zonder nvm: download de 22.x-lijn direct van nodejs.org — niet zomaar “latest” pakken, want dat installeert nu Node 26.x (nog geen LTS, valt buiten wat we nodig hebben).

Het commando is \`npx @mendix/generator-widget <WidgetName>\` — dat start de generator direct zonder dat je eerst los \`yo\` hoeft te installeren. Geef de widgetnaam als argument mee (tussen aanhalingstekens als er spaties in zitten, bijvoorbeeld \`"My Cool Widget"\`) en de generator maakt zelf een nieuwe submap aan (in kebab-case, bijvoorbeeld \`my-cool-widget\`) op de plek waar je de terminal hebt geopend. Daar komt de hele widget-projectstructuur in te staan. Zonder argument vraagt de generator er interactief naar en schrijft hij in de huidige map zelf, zonder submap.

TypeScript en tests altijd aanzetten is onze standaard voor vandaag, geen algemene Mendix-regel — vertel dat er ook mensen zijn die bewust anders kiezen, maar dat we het hier bewust simpel en consistent houden. TypeScript is de kern: Mendix genereert typings uit de widget-XML, en die typings zorgen dat fouten van AI meteen zichtbaar worden tijdens het bouwen, in plaats van pas bij het testen. Tests aanzetten geeft je straks een vangnet wanneer AI iets aanpast.

Vergeet niet eerst \`npm install\` te draaien in de widget-map — pas dan werkt \`npm start\`. De hello-world voorbeeldcode heeft hier nut: draai \`npm start\` en check in Studio Pro of de widget daadwerkelijk verschijnt. Dat bevestigt dat de scaffolding goed is gelukt, vóórdat je verdergaat. Die voorbeeldcode hoef je niet apart op te ruimen: zodra je in fase 4 met AI gaat coderen, verdwijnt die vanzelf.

Git komt bewust als laatste stap — pas als de map schoon is, leg je die vast: \`git init\`, daarna \`git add .\` en \`git commit -m "Initial scaffold"\` in de widget-map zelf. Vergeet niet de widget-map (bijvoorbeeld \`PluggableWidgets/\`) toe te voegen aan de \`.gitignore\` van je Mendix-project, zodat de twee repo’s netjes gescheiden blijven.

**Achter de hand — voor wie tóch 10.24 wil (niet standaard vandaag):** scaffold zoals hierboven en pin daarna in de widget-map een oudere versie van de tools: \`npm install --save-dev @mendix/pluggable-widgets-tools@YOUR_VERSION\`, gevolgd door \`npm run start\`. Dit is de officiële Mendix-procedure uit “Update Pluggable Widgets Tools”. Welk versienummer het beste bij 10.24 past, checken jullie samen in de release notes van pluggable-widgets-tools; dat verandert regelmatig, dus claim hier niet blind een vast nummer.

Dit is de fase waarin je je verhaal en de hands-on combineert: vertel deze stappen terwijl iedereen ze letterlijk meetypt op de eigen laptop.`,
    duration: 1200,
  },
  {
    id: 7,
    title: 'Even rondkijken: waar leeft de code?',
    icon: 'folder',
    align: 'left',
    bullets: [
      '`src/<WidgetName>.xml` — configuratie die Studio Pro leest',
      '`src/<WidgetName>.tsx` — de widget-code zelf',
      '`src/ui/<WidgetName>.css` — de widget css styling',
      '`src/componenten/..` — de ui componenten (widgets) van de widget',
      '`typings/` — automatisch gegenereerd uit de XML; nooit aanpassen',
    ],
    notes: `Nu iedereen VSC open heeft staan na het scaffolden, is dit hét moment om kort te wijzen waar wat leeft — voordat je verdergaat naar plannen en coderen. Laat zien dat de XML de “input” van de widget beschrijft (wat de modeler in Studio Pro configureert) en dat de typings-map daar automatisch uit wordt gegenereerd — vandaar ook waarom je die nooit met de hand aanpast. Dit hoeft geen diepe uitleg te zijn, puur een kort rondje wijzen: “dit leeft hier, dat leeft daar”.`,
    duration: 180,
  },
  {
    id: 8,
    title: 'Projectmechanica naast de widget-code',
    icon: 'layers',
    align: 'left',
    bullets: [
      '`editorConfig.ts` — Structure mode + zichtbaarheid van properties',
      '`editorPreview.tsx` — Design mode-preview, alleen voor web-widgets',
      '`package.json` — naam, versie, afhankelijkheden en build-instellingen',
      'Widget-icoon: PNG’s in de projectroot volgens naamconventie',
      '`npm start` / `npm run build` / `npm run release`',
      '`dist/` — hier landt het uiteindelijke `.mpk`-bestand',
    ],
    notes: `Vervolg op slide 7: laat nu ook de andere kant zien — niet alleen hoe de widget zich gedraagt, maar ook hoe hij zich toont en hoe je hem straks weer buiten VSC krijgt (build/release, dist-map).

Er zijn twee aparte preview-bestanden, niet één: \`editorConfig.ts\` regelt de preview in Structure mode én de property-zichtbaarheid; \`editorPreview.tsx\` is de losse, visuele preview in Design mode, alleen bij web-widgets. Het icoon hoort hier ook thuis: geen technisch aspect van de widget-code zelf, gewoon PNG’s droppen volgens de naamconventie, geen gedoe met base64.

Dit hoeft geen diepe uitleg te zijn — puur een korte rondleiding zodat niemand later verrast is door een onbekende map of file. \`npm start\` gebruiken ze straks meteen in fase 4; \`build\` en \`release\` komen pas terug bij fase 5, dus die mag je hier heel kort laten.`,
    duration: 180,
  },
  {
    id: 9,
    title: 'Fase 2: Exploring',
    icon: 'question',
    align: 'left',
    bullets: [
      'Voordat er code komt: stress-test je eigen idee',
      { text: 'Tip: gebruik de grillme- of superpowers-skill', subtext: 'Werk je plan uit naar features en userstories.' },
      'Vertaal het idee naar properties én gewenst gedrag',
      'Werk binnen je widget-project, zodat AI de output blijft gebruiken',
    ],
    notes: `Dit is een fase die mensen vaak overslaan — meteen los coderen. Grillme en superpowers zijn allebei skills van externe aanbieders die enorm helpen om een los idee uit te werken tot concrete features en userstories. Leg uit dat zo’n skill het plan zelf onder druk zet: welke aannames zitten erin, wat is de kern, wat kan wachten.

Vanuit die userstories vertaal je het idee vervolgens naar een concrete spec: welke properties komen er in de widget-XML, en wat moet de widget functioneel doen. Dit is het omslagpunt van “vaag idee” naar “iets waar AI mee kan werken” — hoe concreter deze spec, hoe minder AI hoeft te gokken in de volgende fase.

Belangrijk: doe dit gesprek binnen dezelfde Claude Code-projectmap als de widget zelf, niet in een los gesprek ergens anders. Zo blijft alle output — features, userstories, properties en gedrag — direct beschikbaar voor de volgende fases.`,
    duration: 240,
  },
  {
    id: 10,
    title: 'Fase 3: Plannen',
    icon: 'steps',
    align: 'left',
    bullets: [
      'Laat Claude Code in plan-modus een implementatieplan maken',
      'AI stelt voor hóe het gebouwd wordt — jij beoordeelt of dat klopt',
      'Pas na akkoord op het plan ga je door naar coderen',
    ],
    notes: `Dit is een aparte, technische stap die op de spec uit Exploring volgt: je laat AI in plan-modus een concreet implementatieplan opstellen, vóórdat er ook maar één regel code geschreven wordt. AI stelt een aanpak voor — welke bestanden, welke volgorde, welke technische keuzes — en de developer beoordeelt of dat aansluit bij het eigen idee en de spec.

Dit is opnieuw een regiemoment: je hoeft het plan niet zelf te kunnen schrijven, maar wel te kunnen beoordelen of het de goede kant op gaat. Pas als je akkoord bent met het plan, laat je AI daadwerkelijk coderen — dat voorkomt dat AI een hele verkeerde richting inslaat en je pas achteraf merkt dat het niet klopt.`,
    duration: 180,
  },
  {
    id: 11,
    title: 'Fase 4: Coderen — wat AI doet',
    icon: 'bolt',
    align: 'left',
    bullets: [
      'Krijgt vooraf de skill-suite mee als spelregels',
      'Schrijft de code',
      'Reviewt de eigen code tegen de standaarden met `pw-review`',
      'Kan tests genereren op basis van het gewenste gedrag',
    ],
    notes: `Dit is de kernslide van de dag — en ook het langste blok, want testen is geen aparte fase meer. De skill-suite (jouw pw-* skills) zijn de technische spelregels die AI meekrijgt vóórdat er iets geschreven wordt — die hoeft de developer zelf niet te kennen, dat is voor AI.

Laat AI de eigen gegenereerde code ook direct checken tegen de standaarden met de pw-review-skill. Dat hoort hier al thuis, meteen na het coderen, in plaats van pas als aparte stap later. Belangrijke nuance: AI die de eigen code reviewt is één controlelaag, niet de enige. Betrouwbaarheid komt vooral uit de onafhankelijke signalen samen: de typings/compiler, lint, de gegenereerde tests én het functionele testen dat jij zelf doet (volgende slide). AI kan ook tests genereren op basis van wat de widget hoort te doen — dat legt het gedrag vast voor de toekomst.`,
    duration: 240,
  },
  {
    id: 12,
    title: 'Fase 4: Coderen — wat jij doet',
    icon: 'checkpoint',
    align: 'left',
    bullets: [
      'Test doorlopend: klik de widget door in Studio Pro',
      'Zorg voor testdata: domeinmodel + CRUD-pagina’s',
      'Beoordeel het resultaat tegen je plan — niet de code zelf',
      'Commit vaak, zodat je altijd terug kunt',
    ],
    notes: `Als developer test je de hele tijd door, terwijl je codeert — niet als losse stap achteraf. Niet de code lezen, maar de widget in Studio Pro in verschillende situaties proberen en checken of het gedrag klopt met wat je in fase 3 hebt gepland. Dat is de regierol in de praktijk. Jij stelt vast of het gedrag klopt; AI verwerkt je bevindingen en voert de automatiseerbare controles uit, zoals de review van de vorige slide.

Testdata regelen — een minimaal domeinmodel plus CRUD-pagina’s — hoort hier ook bij. Zonder data kun je een widget die op een datasource werkt niet functioneel beoordelen. Er is geen voorgeschreven volgorde tussen deze taken; dat hoort bij de eigen regie van elk duo.

Commit vaak, bij elke werkende stap. Dat geeft je een terugvalpunt zodra AI iets aanpast dat het toch net niet doet. Zonder die gewoonte kom je sneller in de verleiding om maar door te blijven proberen op een kapotte staat, in plaats van simpelweg terug te gaan naar de laatste werkende versie.`,
    duration: 240,
  },
  {
    id: 13,
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
    notes: `Dit is misschien wel de belangrijkste praktische les van de dag: regisseren is geen lineair proces, maar een korte cyclus die je steeds opnieuw doorloopt. Klein wijzigen — niet alles tegelijk aan AI vragen. Laat AI de build en checks draaien. Probeer het zelf in Studio Pro. Geef je bevinding terug aan AI (“dit werkte niet, want...”), zodat die de volgende aanpassing kan maken. Herhaal dit tot het klopt, en commit dan pas.

Dit tempo — klein, testen, terugkoppelen, opnieuw — is precies wat er de komende 2 uur en 50 minuten tijdens Coderen continu gebeurt. Benoem dit letterlijk: “dit ritme ga je nu de hele tijd herhalen.”

Optioneel, voor wie verder wil: laat AI ook automatische frontend-tests toevoegen aan deze cyclus, zodat “Build/checks laten lopen” niet alleen typings en lint dekt, maar ook geautomatiseerd checkt of het gedrag klopt. Dat vangnet wordt vooral waardevol zodra je meerdere iteraties verder bent.`,
    duration: 180,
  },
  {
    id: 14,
    title: 'Fase 5: Releasen',
    icon: 'output',
    align: 'left',
    bullets: [
      'Versiebump is een bewuste daad, nooit een bijeffect',
      '`npm run release` bouwt de definitieve `.mpk` en lint eerst',
      'Repo-hygiëne: CHANGELOG.md, README.md',
      'Eerst review door Sander of Anthony',
      'Marketplace: privé of publiek (no way back)',
    ],
    notes: `Deze fase doen we vandaag bewust niet hands-on — puur ter afronding van het complete plaatje, zodat iedereen weet wat er ná vandaag nog volgt. Dat is ook geen toeval: publiceren gaat bij ons altijd via een review door Sander of Anthony, die vandaag niet beschikbaar zijn. Dus zelfs als je zover zou komen, kun je vandaag niet daadwerkelijk publiceren.

Wees duidelijk dat dit een **interne afspraak van ons team** is, geen Mendix-vereiste: Mendix zelf beoordeelt alleen publieke Marketplace-content; private content vereist geen Mendix-review. Onze eigen reviewstap komt daar dus nog bovenop.

Benadruk dat een versienummer een keuze is, niet een automatisme — vertel AI expliciet wanneer en waarom je bumpt. \`npm run release\` triggert automatisch eerst het \`prerelease\`-script, de lintcheck. Dat hoef je dus niet los aan te roepen; npm doet dat vanzelf vóór de release.

Leg de onomkeerbaarheid van public/private uit: private is een prima startpunt, public vraagt om onderhoud op de lange termijn. Sluit af met de drie repo-bestanden: CHANGELOG kijkt terug, backlog kijkt vooruit, README heet iedereen welkom — en alle drie zijn met AI makkelijk te onderhouden.`,
    duration: 180,
  },
  {
    id: 15,
    title: 'Jouw rol als regisseur',
    align: 'center',
    bullets: [
      'AI weet hóe, jij weet wát en waaróm',
      'Elke fase is een beslismoment, geen coderegel',
      'Daarom is deze workshop ook zonder codekennis mogelijk',
    ],
    notes: `Dit is de samenvattende slide die alles bij elkaar brengt. Herhaal de rode draad uit slide 2, maar nu met bewijs erachter uit de vier fases die je vandaag zelf uitvoert: Scaffolding, Exploring, Plannen en Coderen. In elke fase heb je een concrete regiebeslissing gezien, geen technische. Dat is precies waarom dit ook voor mensen zonder JS/TS/React-ervaring haalbaar is.`,
    duration: 120,
  },
  {
    id: 16,
    title: 'Praktische afspraken voor vandaag',
    icon: 'clock',
    align: 'left',
    bullets: [
      'Werk in je duo — of alleen, als je dat liever hebt',
      '09:00–15:30 · lunch 12:00–12:45 · demo’s om 14:30',
      'AI, je buren of ik kunnen helpen als je vastloopt',
    ],
    notes: `Kort en praktisch. Herinner aan wie met wie werkt, bekend via de inzendingen van 17 september, en geef aan wanneer pauzes en lunch zijn. Noem expliciet het demomoment om 14:30 — elk duo laat dan kort, ongeveer 7,5 minuut, zien wat er is gebouwd. Dat mag als stip op de horizon meegegeven worden.

Benoem de drie hulpbronnen als iemand vastloopt: eerst AI zelf (vaak de snelste weg), dan de buren (andere duo’s kunnen meedenken), en jij loopt sowieso rond. Dit voorkomt dat mensen te lang blijven vastzitten en normaliseert dat vastlopen erbij hoort.`,
    duration: 90,
  },
  {
    id: 17,
    title: 'Start',
    icon: 'flag',
    align: 'left',
    bullets: [
      'Zoek je duo op — of ga alleen verder',
      'Vanaf nu: Exploring → Plannen → Coderen → Demo’s',
      'Veel plezier — en stel vooral vragen',
    ],
    notes: `Puur een overgang, geen nieuwe inhoud — de scaffolding-stappen zijn immers al gedaan tijdens slides 6 en 7. Dit is het moment om iedereen los te laten richting Exploring en verder, met de resterende fases als concrete leidraad voor de rest van de dag.`,
    duration: 60,
  },
];
