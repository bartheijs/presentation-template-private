/*
 * Demo content for the reusable presentation template.
 *
 * A real presentation normally changes only this file and config.js. Keep
 * index.html, app.js and styles.css generic so engine improvements can move
 * from develop to main without bringing topic-specific content with them.
 *
 * Each slide requires { id, title, bullets, notes, layout }. `layout` is one
 * of:
 * - 'title': centered heading + subtitle, no bullets (the deck's opening
 *   slide style)
 * - 'bullets': heading + bullet list — the default, general-purpose layout
 * - 'list-image': bullets in one column, `image` stacked beside them
 * - 'quote': a colored quote box (`quote` + optional `attribution` +
 *   optional `bullets` — with bullets, a heading + bullet list render above
 *   the quote box, which then shrinks to a smaller illustrative footnote),
 * - 'image-only': heading + one dominant image, no bullets
 * - 'template-reference': shows the Presentatiebrief content inline on the
 *   slide itself (legacy internal use)
 * - 'quiz': a "Slimste Mens"-style roster of up to 10 items (see
 *   `items` below), revealed one by one from Presenter View's cockpit —
 *   never via Volgende/Vorige. See
 *   docs/superpowers/specs/2026-09-18-quiz-slide-design.md.
 * - 'step': a compact stepper bar (see `steps`/`currentStep` below) plus a
 *   heading auto-composed from the current step's number/label, then
 *   ordinary bullets — for a multi-slide sequence like "3 · Bouwen",
 *   "4 · Testen", each slide highlighting a different step in the same bar.
 *   Still set `title` to the same composed text ("3 · Bouwen") — the
 *   on-slide heading ignores it, but the left-hand TOC reads it directly
 *   and has no other way to know what this slide is about.
 *
 * Other optional fields:
 * - icon: name from the SVG sprite in index.html. Use icons only on
 *   left-aligned slides; centered headings deliberately have no icon.
 * - subtitle / meta: title-slide supporting copy
 * - image: { src, alt } (or an array of those) — used by 'list-image',
 *   'quote' and 'image-only'
 * - imageSize: 'large' | 'side' | 'row' — 'list-image' only, for images shown
 *   uncropped: 'large' = bullets above, image full width below; 'side' =
 *   bullets left, large image right; 'row' = images side by side, centered
 *   (the last one is the largest; no bullets needed)
 * - quote / attribution: used by the 'quote' layout
 * - align: 'center' or 'left' (overrides CONFIG.layout.align)
 * - accent: 0-3 — picks one of the 4 standard accent colors as this
 *   slide's own "theme color" for anything generic that reads it (the
 *   'step' layout's heading; under the conclusion theme, the left rail).
 *   Optional; omit for the ordinary look. Not tied to any one layout.
 * - disco: enables/disables the flashy transition for this slide
 * - discoMode: 'auto' or 'pause'
 * - discoTitleLines: per-slide transition copy
 * - discoHoldMs: extra fully-visible time in auto mode after panels leave
 * - duration: presenter-only planned time for this slide, in seconds (used
 *   for the Presenter View's schedule-adherence indicator; falls back to an
 *   even split of CONFIG.timer.defaultMinutes when omitted)
 * - templateSection: highlights one Presentatiebrief section when the
 *   overlay is opened from this slide (independent of `layout`)
 * - bullets may be strings or { text, subtext } objects
 * - items: [{ id, label, answer, explanation }] — 'quiz' layout only, 1-10
 *   entries at fixed positions (no reshuffling as they're revealed).
 *   `explanation` is a nested slide-content object (same fields as a
 *   regular slide's body: layout/title/bullets/image/align), shown via the
 *   quizmaster's per-item "Uitleg" button without ever becoming its own
 *   addressable slide.
 * - steps: [{ label }] — 'step' layout only. The *whole* sequence, carried
 *   verbatim by every slide in the group (each slide is self-contained,
 *   same as a quiz slide's own `items`) — not a global list.
 * - currentStep: 'step' layout only. 0-based index into `steps` for which
 *   one this slide highlights; also used to compose the heading.
 */

// Reference content shown by the "Presentatiebrief" overlay for this
// specific presentation (HvA gastles, ICT Deeltijd — BI-semester).
const SKILL_TEMPLATE_MD = `PRESENTATIEBRIEF

DOEL
Tweedejaars studenten laten zien dat een IT-carrière niet lineair hoeft te
verlopen, en hen aanmoedigen zelf stappen te zetten — mits in een veilige
omgeving.

PUBLIEK
Tweedejaars studenten ICT Deeltijd (Business Intelligence-semester),
kijkend vanuit de rollen AI Engineer, Digital Business Engineer of
Security Specialist.

KERNBOODSCHAP
Je moet het zelf doen — maar dat kan alleen in een veilige omgeving.

OPBOUW
1. Opener: polshoogte nemen bij de zaal
2. Vast programma (~5 min): carrièrepad, Mendix/Low Code, AI in het werk
3. Vraaggedeelte: het grootste deel van de tijd, "vraag mij alles"
4. Afsluiting: kernboodschap, bemoediging, contact (LinkedIn)

UITVOERING
Duur 40-45 min, Nederlandstalig, persoonlijke/informele toon. Geen
pep-talk-toon bij de kernboodschap. Ravijn-quote alleen als decoratief
sfeerelement tijdens het vraaggedeelte, niet hardop voorlezen.`;

const SKILL_TEMPLATE_SECTIONS = [
  {
    id: 'purpose',
    label: 'Doel',
    icon: 'target',
    body: `## Doel\nTweedejaars studenten laten zien dat een IT-carrière niet lineair hoeft te verlopen, en hen aanmoedigen zelf stappen te zetten — mits in een veilige omgeving.`,
  },
  {
    id: 'audience',
    label: 'Publiek',
    icon: 'chat',
    body: `## Publiek\nTweedejaars studenten ICT Deeltijd (Business Intelligence-semester), kijkend vanuit de rollen AI Engineer, Digital Business Engineer of Security Specialist.`,
  },
  {
    id: 'takeaway',
    label: 'Kernboodschap',
    icon: 'flag',
    body: `## Kernboodschap\nJe moet het zelf doen — maar dat kan alleen in een veilige omgeving.`,
  },
  {
    id: 'outline',
    label: 'Opbouw',
    icon: 'steps',
    body: `## Opbouw\n1. Opener: polshoogte nemen bij de zaal\n2. Vast programma (~5 min): carrièrepad, Mendix/Low Code, AI in het werk\n3. Vraaggedeelte: het grootste deel van de tijd, "vraag mij alles"\n4. Afsluiting: kernboodschap, bemoediging, contact (LinkedIn)`,
  },
  {
    id: 'delivery',
    label: 'Uitvoering',
    icon: 'clock',
    body: `## Uitvoering\nDuur 40-45 min, Nederlandstalig, persoonlijke/informele toon. Geen pep-talk-toon bij de kernboodschap. Ravijn-quote alleen als decoratief sfeerelement tijdens het vraaggedeelte, niet hardop voorlezen.`,
  },
];

const SLIDES = [
  {
    id: 1,
    layout: 'bullets',
    title: 'Wie zijn jullie?',
    icon: 'chat',
    align: 'left',
    bullets: [
      'Wie werkt er naast de opleiding?',
      'Wie werkt er al in IT naast de opleiding?',
    ],
    notes: `Handen laten zien, kort reageren op wat je ziet. Hiermee lees je de zaal zonder meteen druk te leggen op voorbereide vragen.

Verhaal: afhankelijk van de reacties kun je later makkelijker voorbeelden kiezen — carrièreswitch, werkervaring, IT-praktijk of juist eerste kennismaking.`,
    duration: 60,
  },
  {
    id: 2,
    layout: 'title',
    title: 'Bart Heijs',
    subtitle: 'Senior Mendix Consultant',
    bullets: [],
    notes: `Kort, geen uitweiding — dit is de kapstok, niet het verhaal zelf.

Verhaal: dit is puur even face tonen. Het echte verhaal komt in de volgende slide.`,
    duration: 20,
  },
  {
    id: 3,
    layout: 'bullets',
    title: 'Carrièrepad bij Conclusion',
    icon: 'steps',
    align: 'left',
    bullets: [
      'Eerst Facility Manager',
      'Omscholing via Make IT Work (2019)',
      'Naar Conclusion — keuze voor de combinatie low code én consultancy: sneller ontwikkelen, meer klantcontact',
      'Frontend-voorkeur ontwikkeld',
      'HR Coach geworden',
      'Nu ook AI Champion',
      'Volgende doel: Mendix MVP',
    ],
    notes: `Vertel het als één doorlopende lijn, niet als opsomming. Nadruk op: iedere stap kwam voort uit de vorige, niet gepland vooraf.

Verhaal: dit is het hart van je persoonlijke verhaal. Je carrière is niet lineair gepland — het groeide organisch vanuit nieuwsgierigheid en waar je energie van kreeg. Bewaar het "hoe" (durven, coach, ravijn) voor het vraaggedeelte als iemand ernaar vraagt — hier vertel je alleen wát er gebeurde, niet de onderliggende twijfel of het keerpunt.`,
    duration: 120,
  },
  {
    id: 4,
    layout: 'bullets',
    title: 'Werken bij Conclusion',
    icon: 'flag',
    align: 'left',
    bullets: [
      'Veel ruimte voor persoonlijke ontwikkeling',
      'Ambitie: de beste Mendix-partner willen zijn',
      'Veel kennisdeling',
      'Oog voor personeel',
    ],
    notes: `Niet als reclame brengen, maar als verklaring waarom je carrière kón groeien: Conclusion was de omgeving waarin ik kon groeien.

Verhaal: mijn carrière was niet vooraf uitgestippeld. Ik kreeg kansen, maar moest zelf stappen zetten. Dat lukt makkelijker in een omgeving waar je mag leren, proberen, vragen stellen en fouten maken.

En naast een omgeving waarin ik kon groeien, had ik natuurlijk ook een vak nodig waarin ik kon groeien. Voor mij werd dat Mendix.`,
    duration: 45,
  },
  {
    id: 5,
    layout: 'bullets',
    title: 'Het vak waar ik in terechtkwam: Mendix',
    icon: 'spark',
    align: 'left',
    bullets: [
      'Applicaties bouwen met visuele bouwstenen',
      'Niet alles regel voor regel coderen',
      'Maar wél echte bedrijfsapplicaties maken',
    ],
    notes: `Low-code betekent niet "simpel speelgoed".

Verhaal: je bouwt nog steeds echte software, maar veel onderdelen zijn visueel te modelleren.`,
    duration: 30,
  },
  {
    id: 6,
    layout: 'bullets',
    title: 'Voorbeeld: incident afhandelen',
    icon: 'inbox',
    align: 'left',
    bullets: [
      'Iemand meldt een incident via een formulier',
      'Een collega krijgt een taak om actie te ondernemen',
      'Het systeem combineert melding en afhandeling in een rapport',
      'De melder ziet dat het is afgehandeld',
      'Zo ontstaat gestructureerde data voor inzicht en verbetering',
    ],
    notes: `Gebruik dit als rode draad voor Page Builder, Workflow en Microflow. Eén simpel proces waarin mensen, systeemacties en data samenkomen.

Verhaal: korte koppeling met Business Intelligence — als je informatie gestructureerd vastlegt, kun je later patronen herkennen en processen verbeteren.`,
    duration: 60,
  },
  {
    id: 7,
    layout: 'list-image',
    title: 'Page Builder: het formulier',
    icon: 'layers',
    align: 'left',
    imageSize: 'side',
    image: { src: 'assets/HVA-page.png', alt: 'Screenshot van de Mendix page builder met een check-in formulier' },
    bullets: [
      'Hier bouw je de schermen',
      'Bijvoorbeeld: incident melden',
      'Velden, knoppen, validatie, layout',
    ],
    notes: `Laat screenshot zien van de page builder.

Verhaal: niet technisch uitleggen, vooral laten zien dat het visueel en herkenbaar is.`,
    duration: 40,
  },
  {
    id: 8,
    layout: 'list-image',
    title: 'Workflow: het proces',
    icon: 'steps',
    align: 'left',
    imageSize: 'side',
    image: { src: 'assets/HVA-workflow.png', alt: 'Screenshot van een Mendix workflow voor het verwerken van feedback' },
    bullets: [
      'Wie moet iets doen?',
      'Welke stap komt daarna?',
      'Waar neemt het systeem het over?',
    ],
    notes: `Laat de workflow zien als routekaart: melder → actiehouder → systeemactie → terugkoppeling.

Verhaal: hier kun je letterlijk aanwijzen — hier doet een mens iets, hier doet het systeem iets.`,
    duration: 40,
  },
  {
    id: 9,
    layout: 'list-image',
    title: 'Microflow: de logica achter een stap',
    icon: 'target',
    align: 'left',
    imageSize: 'large',
    image: { src: 'assets/HVA-microflow.png', alt: 'Screenshot van een Mendix microflow voor een check-in/check-out' },
    bullets: [
      'Data ophalen',
      'Beslissingen nemen',
      'Acties uitvoeren',
    ],
    notes: `Bijvoorbeeld: bij een taak de juiste melding, afhandeling en betrokken personen ophalen.

Verhaal: dit is de logica achter de workflowstap — de motor die op de achtergrond draait.`,
    duration: 40,
  },
  {
    id: 10,
    layout: 'bullets',
    title: 'Eén compleet platform',
    icon: 'layers',
    align: 'left',
    bullets: [
      'Formulieren en schermen',
      'Workflows en microflows',
      'PDF-generatie',
      'Integraties met andere systemen',
      'Native apps voor iOS en Android',
    ],
    notes: `Dit is de samenvatting van het Mendix-blok.

Verhaal: Mendix is niet alleen een formulierbouwer — het is een compleet platform om bedrijfsprocessen te bouwen, te automatiseren en te koppelen aan andere systemen.

Dit is het vak waarin ik een aantal jaar geleden begon. Maar dat vak ziet er nu alweer anders uit, vooral door AI.`,
    duration: 35,
  },
  {
    id: 11,
    layout: 'bullets',
    title: 'De veranderende developer',
    icon: 'spark',
    align: 'left',
    bullets: [
      'AI neemt het denken niet over',
      'Je werk verschuift: meer sturen, beoordelen en keuzes maken',
      'Ideeën sneller kunnen uitproberen',
      'Meer ruimte voor ontwerp, creativiteit en probleembegrip',
      'Technische kennis blijft nodig om kwaliteit te bewaken',
    ],
    notes: `Dit is geen los AI-onderwerp, maar een verandering in mijn eigen werk als Mendix-developer. AI betekent niet dat ik minder hoef na te denken — het verandert vooral waar ik over nadenk.

Verhaal: als Mendix-developer kom ik sneller van idee naar eerste versie, maar ik blijf verantwoordelijk voor wat ik oplever. Juist daarom worden goede vragen stellen, kritisch beoordelen, testen en begrijpen wat je bouwt steeds belangrijker.`,
    duration: 60,
  },
  {
    id: 12,
    layout: 'bullets',
    title: 'AI in het werk',
    icon: 'book',
    align: 'left',
    bullets: [
      'Deze presentatie is gemaakt met een eigen AI-skill',
      'Niet één losse prompt, maar een herbruikbare werkwijze',
      'Meer uitleg alleen als jullie daar nieuwsgierig naar zijn',
    ],
    notes: `Heel kort noemen, niet demonstreren tenzij er vragen over komen.

Laat zien dat dit onderdeel van mijn dagelijkse werk is geworden: ook als Mendix-developer gebruik ik AI om te voorbereiden, structureren en verbeteren van mijn werk, niet alleen om code te schrijven. Verhaal: als studenten willen weten hoe dit werkt, kan dat in het vraaggedeelte.`,
    duration: 40,
  },
  {
    id: 13,
    layout: 'bullets',
    title: 'AI door de hele lifecycle',
    icon: 'steps',
    align: 'left',
    bullets: [
      'Niet alleen het coderen',
      'Ook alles eromheen (requirements, testen, documentatie, etc.)',
    ],
    notes: `Kort, geen opsomming van alle fases.

Verhaal: in mijn werk als Mendix-developer raakt AI de hele lifecycle, niet alleen het bouwen. Dat weerlegt het beeld dat AI = "code schrijven". Het is breder, en dat is precies waarom het relevant is voor alle drie de beroepsrollen die zij bestuderen.`,
    duration: 35,
  },
  {
    id: 14,
    layout: 'bullets',
    title: 'Niet alleen gebruiken, ook optimaliseren',
    icon: 'ruler',
    align: 'left',
    bullets: [
      'Agents, skills',
      'Script vs. intelligence vs knowledge',
      'Herbruikbaar, onderhoudbaar, testen, doorontwikkelen — net als software',
    ],
    notes: `Dit is een dieper punt — leg uit dat je soms een simpel scriptje nodig hebt, en soms echt AI-redenering.

Verhaal: ook dit hoort bij het vak van een Mendix-developer dat aan het veranderen is. Werken met AI is een onderdeel van het vak geworden — je zet niet zomaar AI ergens op los, je stuurt het bij en optimaliseert het net zoals je met code zou doen.`,
    duration: 45,
  },
  {
    id: 15,
    layout: 'bullets',
    title: 'Vraag mij alles',
    align: 'center',
    bullets: [
      'Geen onderwerp is off-limits',
      'Dit is jullie moment',
    ],
    notes: `Open uitnodiging, ga zitten/leun naar voren, maak ruimte.

Verhaal: dit is het scharnierpunt van de les — van zenden naar luisteren. Neem hier bewust een pauze.`,
    duration: 5,
  },
  {
    id: 16,
    layout: 'quote',
    title: 'Durf je het te vragen?',
    bullets: [
      'Welke vraag zit op het puntje van je tong, maar durfde je nog niet te stellen?',
      'Laatste kans — wie durft?',
      'Straks bij een klant moet je dat ook durven vragen',
    ],
    quote: 'De allermooiste bloemen groeien vlak langs het ravijn. Om die te kunnen plukken moet je durven bang te zijn.',
    attribution: '',
    disco: true,
    discoMode: 'pause',
    discoTitleLines: ['VRAGEN'],
    notes: `Komt binnen via de disco-tussenstop: na "Vraag mij alles" bevriest het scherm op "VRAGEN" — decor, geen tekst om voor te lezen, puur een stil rustpunt terwijl de zaal vragen stelt. Nog een keer op Volgende/pijl-rechts laat deze slide landen: de drie bullets staan nu zelf in beeld als uitnodiging, de quote is illustratie/sfeer eronder — niet voorlezen.

Aanvullend, hardop, afhankelijk van het moment:

1. Bij twijfel of stilte, als aanmoediging: "Welke vraag ligt op het puntje van je tong, maar heb je niet gesteld omdat hij spannend voelt of misschien dom lijkt?"
2. Om de laatste vraag af te dwingen: "laatste kans — wie durft?"
3. Om te complimenteren op de vragen die al gesteld zijn (niet op de slide, want terugkijkend): "mooi dat jullie dit al durfden te vragen"

Verhaal: de derde bullet legt de brug naar de praktijk — durven vragen stopt niet bij de collegezaal, dat geldt straks net zo hard bij een klant.`,
    duration: 45,
  },
  {
    id: 17,
    layout: 'bullets',
    title: 'Kernboodschap',
    align: 'center',
    bullets: [
      'Je moet zelf stappen zetten',
      'De juiste omgeving helpt enorm',
      'Zoek een plek waar je kunt leren, proberen en vragen stellen',
    ],
    notes: `Rustig brengen, geen pep-talk. Mijn loopbaan was niet strak gepland. Ik kreeg kansen, maar moest ze zelf pakken.

Verhaal: een veilige omgeving betekent ruimte om te leren, vragen te stellen, fouten te maken en nieuwe dingen te proberen. Dat geldt voor een carrièreswitch, voor leren programmeren en voor werken met AI.`,
    duration: 45,
  },
  {
    id: 18,
    layout: 'bullets',
    title: 'Jullie hebben de eerste stap al gezet',
    align: 'center',
    bullets: [
      'Door voor deze opleiding te kiezen',
    ],
    notes: `Kort, rustig, als laatste zin voor de deur uit.

Verhaal: dit weerlegt impliciet de aanname dat "zelf doen" alleen voor anderen is weggelegd — bevestig dat zij het al doen, nu al.`,
    duration: 20,
  },
  {
    id: 19,
    layout: 'list-image',
    title: 'Blijf in contact',
    icon: 'chat',
    align: 'left',
    imageSize: 'row',
    image: [
      { src: 'assets/LinkedIn_logo_initials.png', alt: 'LinkedIn-logo' },
      { src: 'assets/qr.jpeg', alt: 'QR-code naar LinkedIn-profiel' },
    ],
    bullets: [],
    notes: `Korte, losse uitnodiging — geen druk, gewoon een open deur.

Verhaal: dit is de praktische afsluiting na de kernboodschap — een laagdrempelige manier om het contact te laten doorlopen na de les, mocht er nog een vraag opkomen of iemand willen doorpraten.`,
    duration: 20,
  },
];

/*
 * Reservemateriaal — geen slides, alleen gebruiken als antwoord op een vraag
 * tijdens het vraaggedeelte. Niet in SLIDES opnemen.
 *
 * - Coach-moment / "durven komt vóór lukken": het volledige verhaal over de
 *   coach die dit tegen je zei.
 * - Ravijn-spreuk voluit: "De allermooiste bloemen groeien vlak langs het
 *   ravijn. Om die te kunnen plukken moet je durven bang te zijn." —
 *   inzetbaar als iemand doorvraagt op het coach-moment.
 */
