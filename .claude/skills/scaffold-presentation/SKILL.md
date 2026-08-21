---
name: scaffold-presentation
description: Build a complete new presentation in this reusable template from ordinary user-provided text, notes, an outline, or a document. Use on a new topic branch from main; never use to modify the protected skill-workshop-presentation branch.
---

# Nieuwe presentatie maken vanuit tekst

Maak van de inhoud die de gebruiker al heeft een complete, werkende
presentatie. De gebruiker hoeft geen technisch format, veldnamen of bestanden
in deze repository te kennen.

## Input

Accepteer de inhoud in iedere bruikbare tekstvorm, bijvoorbeeld:

- ruwe notities, een e-mail of een document;
- een lijst met ideeën of hoofdstukken;
- een bestaande slide-opzet;
- een ingevulde `content-template.md`;
- feedback en aanvullende aanwijzingen in gewone taal.

Leid onderwerp, publiek, doel, taal, toon en gewenste volgorde af uit de
tekst. Vraag alleen door wanneer essentiële context niet redelijk is af te
leiden en de ontbrekende keuze het resultaat wezenlijk verandert. Een exacte
slidevolgorde of technische presentatie-instellingen zijn niet vereist.

## Werkwijze

1. Controleer de actieve Git-branch. Werk alleen op een nieuwe onderwerpbranch
   vanaf `main`. Schrijf nooit naar `skill-workshop-presentation`; die branch
   bewaart de bestaande workshopdeck ongewijzigd. Verwijs naar
   `content-template.md` als optioneel hulpmiddel wanneer de gebruiker nog
   nauwelijks inhoud heeft, maar maak het nooit verplicht.
2. Lees alle aangeleverde inhoud. Bepaal de centrale boodschap en maak een
   logische verhaallijn met een opening, inhoudelijke opbouw en afsluiting.
   Behoud een expliciet opgegeven volgorde, tenzij de gebruiker ruimte geeft
   om die te verbeteren.
3. Verdeel de inhoud over slides. Schrijf bondige titels en scanbare bullets;
   verplaats verdieping naar speaker notes. Behoud bronnen, voorbeelden,
   waarschuwingen en expliciete formuleringen die inhoudelijk belangrijk zijn.
4. Lees `config.js`, `slides-data.js`, `index.html` en de README als technische
   referentie. Kies zelf verstandige presentatiebrede defaults en passende
   opties per slide. Zet de reference-overlay alleen aan wanneer de gebruiker
   ondersteunende bron- of briefingtekst tijdens de presentatie nodig heeft.
5. Schrijf de presentatie naar `config.js` en `slides-data.js`, als classic
   scripts zonder `import`/`export`. Laat `app.js` en `styles.css` intact voor
   gewone inhoudswijzigingen.
6. Gebruik alleen iconen die als `<symbol id="icon-...">` in `index.html`
   bestaan. Ontbreekt een inhoudelijk noodzakelijk icoon, voeg dan één nieuw
   symbol aan die sprite toe en meld dit. Gebruik altijd één van deze
   composities: icoon met volledig links uitgelijnde inhoud, of een
   gecentreerde titel zonder icoon met links uitgelijnde bullets.
7. Controleer iedere slide op een unieke oplopende `id`, een niet-lege
   `title`, een `bullets`-array en een `notes`-string. Test daarna de volledige
   presentatie volgens `.claude/skills/test-presentation/SKILL.md` en bekijk
   de relevante slides visueel.

## Technische datavorm

Gebruik de bestaande bestanden als actuele bron voor alle opties. Een slide
heeft minimaal:

```js
{ id, title, bullets, notes }
```

Ondersteunde opties zijn onder meer `icon`, `subtitle`, `meta`, `align`,
`disco`, `discoMode`, `discoHoldMs`, `discoTitleLines`,
`isTemplateAnchor` en `templateSection`. Bullets mogen strings zijn of
`{ text, subtext }`-objecten. Voeg alleen opties toe die het verhaal of de
presentatie daadwerkelijk helpen; stel de technische keuzes niet als vragen
aan de gebruiker wanneer een verstandige default volstaat.

## Oplevering

Meld kort hoeveel slides zijn gemaakt, welke inhoudelijke structuur is
gekozen, of de reference-overlay wordt gebruikt, welke bestanden zijn
gewijzigd en hoe de presentatie is gecontroleerd. Beschrijf technische
details alleen wanneer ze relevant zijn voor een keuze of uitzondering.

## Grenzen

- Wijzig nooit onderwerpcontent op `main`, `develop` of
  `skill-workshop-presentation` zonder expliciete opdracht; nieuwe
  presentaties horen op een onderwerpbranch vanaf `main`.
- Schrijf onderwerpcontent nooit terug naar `main` of `develop`.
- Verander de gedeelde engine alleen wanneer de gebruiker expliciet om een
  herbruikbare engineverbetering vraagt.
- Lever nooit een slide zonder geldige `title`, `bullets` en `notes` op.
