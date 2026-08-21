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

// Generic reference content shown by the "Presentatiebrief" overlay.
// The variable names are retained for backwards compatibility with app.js.
const SKILL_TEMPLATE_MD = `PRESENTATIEBRIEF

DOEL
Wat moet deze presentatie bereiken?

PUBLIEK
Wie zit er in de zaal en wat weten zij al?

KERNBOODSCHAP
Wat moet het publiek vooral onthouden of doen?

OPBOUW
1. Opening: waarom dit belangrijk is
2. Kernargument of leeropbouw
3. Bewijs, voorbeeld of demonstratie
4. Afsluiting: besluit, actie of toepassing

UITVOERING
Duur, taal, toon en aanwijzingen voor de presentator.`;

const SKILL_TEMPLATE_SECTIONS = [
  {
    id: 'purpose',
    label: 'Doel',
    icon: 'target',
    body: `## Doel\n[Wat moet deze presentatie bereiken?]`,
  },
  {
    id: 'audience',
    label: 'Publiek',
    icon: 'chat',
    body: `## Publiek\n[Wie zit er in de zaal en wat weten zij al?]`,
  },
  {
    id: 'takeaway',
    label: 'Kernboodschap',
    icon: 'flag',
    body: `## Kernboodschap\n[Wat moet het publiek vooral onthouden of doen?]`,
  },
  {
    id: 'outline',
    label: 'Opbouw',
    icon: 'steps',
    body: `## Opbouw\n1. [Opening: waarom dit belangrijk is]\n2. [Kernargument of leeropbouw]\n3. [Bewijs, voorbeeld of demonstratie]\n4. [Afsluiting: besluit, actie of toepassing]`,
  },
  {
    id: 'delivery',
    label: 'Uitvoering',
    icon: 'clock',
    body: `## Uitvoering\n[Duur, taal, toon en aanwijzingen voor de presentator.]`,
  },
];

const SLIDES = [
  {
    id: 1,
    title: 'Van tekst naar presentatie',
    subtitle: 'Lever je verhaal aan als tekst. AI doet de rest.',
    bullets: [],
    meta: ['Van ruwe inhoud', 'naar een werkende presentatie'],
    notes: `Deze demo laat zien wat het template kan. Voor een nieuwe presentatie hoeft de gebruiker alleen de inhoud en context aan te leveren.`,
  },
  {
    id: 2,
    title: 'Begin met drie dingen',
    icon: 'target',
    align: 'left',
    bullets: [
      'Waar gaat de presentatie over?',
      'Voor wie is hij bedoeld?',
      'Wat moet het publiek na afloop begrijpen, voelen of doen?',
    ],
    notes: `Meer hoeft niet om te beginnen. Als duur, taal of toon belangrijk zijn, kunnen die er gewoon in normale taal bij.`,
  },
  {
    id: 3,
    title: 'Lever je verhaal aan zoals het er nu ligt',
    icon: 'inbox',
    align: 'left',
    bullets: [
      {
        text: 'Plak een ruwe opzet, document of lijst met ideeën',
        subtext: 'De tekst hoeft nog niet kort, compleet of netjes gestructureerd te zijn.',
      },
      {
        text: 'Geef een gewenste volgorde mee als je die al hebt',
        subtext: 'AI kan hem behouden of een betere verhaallijn voorstellen.',
      },
      {
        text: 'Voeg notities, bronnen of voorbeelden toe waar relevant',
        subtext: 'Ook losse aanwijzingen en feedback in gewone taal zijn voldoende.',
      },
    ],
    notes: `content-template.md is alleen een optioneel hulpmiddel. Een e-mail, outline, document of geplakte tekst werkt net zo goed.`,
  },
  {
    id: 4,
    title: 'AI maakt er een complete presentatie van',
    icon: 'spark',
    align: 'left',
    bullets: [
      'Brengt structuur en een heldere verhaallijn aan',
      'Schrijft compacte titels en scanbare bullets',
      'Kiest passende layouts en overgangen',
      'Voegt speaker notes toe en controleert het resultaat',
    ],
    notes: `AI verwerkt de inhoud achter de schermen in het template. De gebruiker hoeft de technische bestanden of instellingen niet te kennen.`,
  },
  {
    id: 5,
    title: 'Center is geschikt voor één kernboodschap',
    align: 'center',
    bullets: [
      'Rustige compositie',
      'Korte, krachtige copy',
    ],
    notes: `Een rustige, gecentreerde compositie helpt wanneer één boodschap alle aandacht verdient.`,
  },
  {
    id: 6,
    title: 'Goede uitleg blijft makkelijk te volgen',
    icon: 'book',
    align: 'left',
    bullets: [
      'Elke slide heeft één duidelijke boodschap',
      'De belangrijkste punten staan in een logische volgorde',
      'Verdieping verhuist naar de sprekersnotities',
    ],
    notes: `AI verdeelt de aangeleverde tekst over begrijpelijke stappen en bewaart extra uitleg voor de presentator.`,
  },
  {
    id: 7,
    title: 'Subtekst voegt nuance toe zonder extra bullets',
    icon: 'ruler',
    align: 'left',
    bullets: [
      {
        text: 'Houd de hoofdregel scanbaar',
        subtext: 'Zet de nuance eronder in een rustiger formaat.',
      },
      {
        text: 'Benadruk alleen wat echt belangrijk is',
        subtext: 'Zo blijft de hoofdboodschap helder voor het publiek.',
      },
    ],
    notes: `AI kan toelichting visueel ondergeschikt maken, zodat de slide snel te begrijpen blijft.`,
  },
  {
    id: 8,
    title: 'Sommige overgangen mogen rustig blijven',
    disco: false,
    bullets: [
      'Deze slide verschijnt zonder extra effect',
      'AI stemt het tempo af op het moment in het verhaal',
    ],
    notes: `Niet iedere stap in een verhaal heeft nadruk nodig. Een rustige overgang helpt het publiek de inhoud te blijven volgen.`,
  },
  {
    id: 9,
    title: 'Een automatische overgang geeft kort extra energie',
    disco: true,
    discoMode: 'auto',
    discoHoldMs: 800,
    discoTitleLines: ['KORTE', 'ENERGIE'],
    bullets: [
      'Eén klik is genoeg',
      'De overgang speelt af en de volgende slide verschijnt vanzelf',
    ],
    notes: `Deze overgang blijft bewust iets langer zichtbaar dan de overgang ervoor. Dat maakt het verschil in tempo goed merkbaar.`,
  },
  {
    id: 10,
    title: 'Een pauze-overgang maakt ruimte voor een live moment',
    disco: true,
    discoMode: 'pause',
    discoTitleLines: ['PAUSE', 'EN', 'VERVOLG'],
    bullets: [
      'De eerste klik bevriest de overgang halverwege',
      'De tweede klik landt op deze slide',
    ],
    notes: `Gebruik dit bijvoorbeeld voor een reveal, publieksvraag of live demonstratie.`,
  },
  {
    id: 11,
    title: 'Achtergrondinformatie blijft binnen bereik',
    isTemplateAnchor: true,
    bullets: [
      'Open de presentatiebrief wanneer je extra context nodig hebt',
      'De slide blijft zichtbaar terwijl je de briefing raadpleegt',
      'Sluit het paneel en ga direct verder met presenteren',
    ],
    notes: `Open de knop “Presentatiebrief”. De briefing kan tijdens het presenteren naast de slides worden geraadpleegd.`,
  },
  {
    id: 12,
    title: 'De juiste achtergrond verschijnt op het juiste moment',
    icon: 'target',
    templateSection: 'takeaway',
    align: 'left',
    bullets: [
      'Open de Presentatiebrief',
      'De relevante sectie “Kernboodschap” wordt automatisch gemarkeerd',
      'AI koppelt ondersteunende context aan de juiste slide',
    ],
    notes: `De briefing is een voorbeeld van ondersteunende context. AI gebruikt dit alleen wanneer het iets toevoegt aan de presentatie.`,
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
      'Pijltjestoetsen en een presentatieklikker navigeren door de slides',
    ],
    notes: `Test de timer en de Klaar-knop. Een gangbare presentatieklikker stuurt PageDown/PageUp of pijltjestoetsen; beide werken. De standaardduur en alle labels komen uit config.js.`,
  },
  {
    id: 15,
    title: 'Je hoeft geen technisch format te leren',
    icon: 'spark',
    align: 'left',
    bullets: [
      'Plak of voeg tekst toe in de vorm die je al hebt',
      'AI vraagt alleen door als essentiële context echt ontbreekt',
      'Bekijk het resultaat en geef feedback in gewone taal',
      'AI verwerkt de feedback en controleert de presentatie opnieuw',
    ],
    notes: `content-template.md is beschikbaar als eenvoudig startpunt, maar is nooit verplicht.`,
  },
  {
    id: 16,
    title: 'Begin gewoon met je verhaal',
    bullets: [
      '`Maak een presentatie over [onderwerp] voor [publiek]`',
      '`Na afloop moeten zij [gewenste uitkomst]`',
      '`Gebruik onderstaande tekst als inhoud: …`',
      'AI regelt structuur, vormgeving en techniek',
    ],
    notes: `Dit is voldoende om te starten. Extra wensen kunnen vooraf of als feedback op het eerste resultaat worden toegevoegd.`,
  },
];
