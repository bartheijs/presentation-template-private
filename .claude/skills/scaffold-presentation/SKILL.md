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
5. Kies de bedieningstaal tijdens het maken van de presentatie: zet
   `CONFIG.lang` op `'nl'` voor een Nederlandstalige presentatie of `'en'`
   voor een Engelstalige presentatie. Presentation View en Presenter View
   volgen deze instelling automatisch. Vertaal de inhoud van de presentatie
   naar dezelfde taal en voeg geen taalwisselaar aan de interface toe.
5b. Vraag de gebruiker, in tegenstelling tot de taalkeuze hierboven, altijd
   expliciet welk thema de presentatie moet gebruiken: `'default'` (het
   bestaande lichte thema) of `'conclusion'` (het donkere
   Conclusion-huisstijlthema, zie `themes/conclusion/theme.css`). Dit is een
   stijlkeuze die niet uit de inhoud is af te leiden. Zet het antwoord in
   `CONFIG.theme`. Kiest de gebruiker `'conclusion'` en noemt hij een
   specifieke business unit of tagline, zet die dan in
   `CONFIG.brand.businessUnit`/`tagline`; laat beide anders leeg voor een
   generieke Conclusion-uitstraling.
6. Schrijf de presentatie naar `config.js` en `slides-data.js`, als classic
   scripts zonder `import`/`export`. Laat `app.js` en `styles.css` intact voor
   gewone inhoudswijzigingen. Geef elke slide een expliciete `layout`
   (`'title'`, `'bullets'`, `'list-image'`, `'quote'`, `'image-only'` of
   `'template-reference'` — zie de README's "Slidegegevens" en
   `slides-data.js`'s koptekst) in plaats van dit impliciet uit andere velden
   af te leiden.
7. Gebruik alleen iconen die als `<symbol id="icon-...">` in `index.html`
   bestaan. Ontbreekt een inhoudelijk noodzakelijk icoon, voeg dan één nieuw
   symbol aan die sprite toe en meld dit. Gebruik altijd één van deze
   composities: icoon met volledig links uitgelijnde inhoud, of een
   gecentreerde titel zonder icoon met links uitgelijnde bullets.
8. Controleer iedere slide op een unieke oplopende `id`, een geldige
   `layout`, een niet-lege `title`, een `bullets`-array (leeg toegestaan bij
   `layout`s die geen bullets tonen) en een `notes`-string. Test daarna de volledige
   presentatie volgens `.claude/skills/test-presentation/SKILL.md` en bekijk
   de relevante slides visueel.

## Technische datavorm

Gebruik de bestaande bestanden als actuele bron voor alle opties. Een slide
heeft minimaal:

```js
{ id, layout, title, bullets, notes }
```

`layout` is verplicht en is één van `'title'`, `'bullets'`, `'list-image'`,
`'quote'`, `'image-only'` of `'template-reference'` — kies de layout die bij
de inhoud van die slide past, niet standaard overal `'bullets'`. Ondersteunde
opties zijn onder meer `icon`, `subtitle`, `meta`, `image`, `quote`,
`attribution`, `align`, `disco`, `discoMode`, `discoHoldMs`,
`discoTitleLines`, `templateSection` en `duration`. Bullets mogen strings
zijn of `{ text, subtext }`-objecten. Voeg alleen opties toe die het
verhaal of de presentatie daadwerkelijk helpen; stel de technische keuzes
niet als vragen aan de gebruiker wanneer een verstandige default volstaat.

Schat voor iedere slide ook een `duration` (seconden, presenter-only) in —
gebaseerd op het aantal woorden in bullets plus notes en een spreektempo
van ongeveer 130 woorden per minuut, met een kleine marge voor een titel-
of overgangsslide met weinig tekst. Dit voedt uitsluitend de
schema-indicatie in de Presenter View (zie
`docs/superpowers/specs/2026-08-22-presenter-view-design.md`); het heeft
geen enkel effect op de zichtbare presentatie. Het zijn bewust eerste
inschattingen, geen vaste tijden — noem in de oplevering dat de gebruiker
ze na een droogloop met de presentatietimer in de Presenter View kan
verfijnen.

## Oplevering

Meld kort hoeveel slides zijn gemaakt, welke inhoudelijke structuur is
gekozen, welk thema (`CONFIG.theme`) is ingesteld, of de reference-overlay
wordt gebruikt, welke bestanden zijn gewijzigd en hoe de presentatie is
gecontroleerd. Vermeld dat elke slide
een geschatte `duration` heeft gekregen voor de Presenter View's
schema-indicatie, en dat de gebruiker die na een droogloop kan aanpassen.
Beschrijf technische details alleen wanneer ze relevant zijn voor een
keuze of uitzondering.

## Grenzen

- Wijzig nooit onderwerpcontent op `main`, `develop` of
  `skill-workshop-presentation` zonder expliciete opdracht; nieuwe
  presentaties horen op een onderwerpbranch vanaf `main`.
- Schrijf onderwerpcontent nooit terug naar `main` of `develop`.
- Verander de gedeelde engine alleen wanneer de gebruiker expliciet om een
  herbruikbare engineverbetering vraagt.
- Lever nooit een slide zonder geldige `title`, `bullets` en `notes` op.
