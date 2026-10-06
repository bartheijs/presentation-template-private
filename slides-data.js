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
    notes: ``,
    duration: 60,
  },
  {
    id: 2,
    layout: 'title',
    title: 'Bart Heijs',
    subtitle: 'Senior Mendix Consultant',
    bullets: [
      '46 jaar',
      'Getrouwd',
      '2 tienerdochters',
      'Diemen',
      'Muzikant',
    ],
    notes: ``,
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
    notes: `- Doorlopend verhaal
- Niet gepland, maar gegroeid`,
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
    notes: `Omgeving waarin ik kon groeien`,
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
    notes: `Low code is visueel coderen`,
    duration: 30,
  },
  {
    id: 6,
    layout: 'list-image',
    title: 'Page Builder: het formulier',
    icon: 'layers',
    align: 'left',
    imageSize: 'side',
    image: { src: 'assets/HVA-page.png', alt: 'Screenshot van de Mendix page builder met een check-in formulier' },
    bullets: [
      'Hier bouw je de schermen',
      'Velden, knoppen, validatie, layout',
    ],
    notes: `Zo ziet een page eruit`,
    duration: 40,
  },
  {
    id: 7,
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
    notes: `Zo ziet een workflow eruit`,
    duration: 40,
  },
  {
    id: 8,
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
    notes: `Zo ziet een microflow eruit`,
    duration: 40,
  },
  {
    id: 9,
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
    notes: ``,
    duration: 35,
  },
  {
    id: 10,
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
    notes: `Werk veranderd alweer`,
    duration: 60,
  },
  {
    id: 11,
    layout: 'bullets',
    title: 'AI in het werk',
    icon: 'book',
    align: 'left',
    bullets: [
      'Deze presentatie is gemaakt met een eigen AI-skill',
      'Niet één losse prompt, maar een herbruikbare werkwijze',
      'Meer uitleg alleen als jullie daar nieuwsgierig naar zijn',
    ],
    notes: ``,
    duration: 40,
  },
  {
    id: 12,
    layout: 'bullets',
    title: 'AI door de hele lifecycle',
    icon: 'steps',
    align: 'left',
    bullets: [
      'Niet alleen het coderen',
      'Ook alles eromheen (requirements, testen, documentatie, etc.)',
    ],
    notes: ``,
    duration: 35,
  },
  {
    id: 13,
    layout: 'bullets',
    title: 'Niet alleen gebruiken, ook optimaliseren',
    icon: 'ruler',
    align: 'left',
    bullets: [
      'Agents, skills',
      'Script vs. intelligence vs knowledge',
      'Herbruikbaar, onderhoudbaar, testen, doorontwikkelen — net als software',
    ],
    notes: ``,
    duration: 45,
  },
  {
    id: 14,
    layout: 'bullets',
    title: 'Vraag mij alles',
    align: 'center',
    bullets: [
      'Geen onderwerp is off-limits',
      'Dit is jullie moment',
    ],
    notes: ``,
    duration: 5,
  },
  {
    id: 15,
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
    notes: `- Aanmoedigen
- Nog een laatste vraag
- Complimenteren`,
    duration: 45,
  },
  {
    id: 16,
    layout: 'bullets',
    title: 'Kernboodschap',
    align: 'center',
    bullets: [
      'Je moet zelf stappen zetten',
      'De juiste omgeving helpt enorm',
      'Zoek een plek waar je kunt leren, proberen en vragen stellen',
    ],
    notes: `- Loopbaan niet gepland
- Ik kreeg kansen
- Zelf pakken`,
    duration: 45,
  },
  {
    id: 17,
    layout: 'title',
    title: 'Jullie hebben de eerste stap al gezet door voor deze opleiding te kiezen',
    align: 'center',
    bullets: [],
    notes: ``,
    duration: 20,
  },
  {
    id: 18,
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
    notes: ``,
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
