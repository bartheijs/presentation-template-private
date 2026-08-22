---
name: update-slides
description: Update an existing presentation from feedback or replacement content in ordinary language while preserving unrelated slides and configuration. Never use to modify the protected skill-workshop-presentation branch unless explicitly requested.
---

# Bestaande slides bijwerken vanuit gewone tekst

Verwerk feedback, nieuwe inhoud of vervangende tekst in een bestaande
presentatie. De gebruiker hoeft geen veldnamen, Markdown-schema of technische
bestanden te noemen.

## Input

Accepteer aanwijzingen in iedere duidelijke tekstvorm, zoals:

- “maak slide 4 korter en voeg dit voorbeeld toe”;
- nieuwe of herschreven tekst voor één of meer slides;
- een aangepaste outline of volledige decktekst;
- feedback op toon, volgorde, vormgeving, overgangen of speaker notes.

Leid uit de formulering af welke slides en aspecten bedoeld zijn. Vraag alleen
door als de match dubbelzinnig is of als onduidelijkheid tot het overschrijven
van inhoud kan leiden.

## Werkwijze

1. Controleer de actieve Git-branch. Stop op
   `skill-workshop-presentation`, tenzij de gebruiker in dezelfde opdracht
   expliciet vraagt die productiepresentatie te wijzigen.
2. Lees `slides-data.js`, `config.js` en de aangeleverde feedback volledig.
3. Kies gerichte update als standaard. Match op slide-id, exacte titel of een
   ondubbelzinnige inhoudelijke beschrijving. Behoud alle niet-genoemde slides,
   hun volgorde en hun instellingen.
4. Vervang de volledige deck alleen wanneer de gebruiker dit expliciet vraagt
   of onmiskenbaar een complete vervangende presentatie aanlevert. Vraag bij
   twijfel voordat bestaande inhoud wordt overschreven.
5. Verwerk feedback inhoudelijk: houd slidecopy bondig, plaats verdieping in
   speaker notes en kies zelf passende layouts of overgangen. Pas
   presentatiebrede instellingen alleen aan wanneer de gebruiker daar direct
   of inhoudelijk om vraagt.
6. Schrijf wijzigingen naar `slides-data.js` en zo nodig `config.js`, als
   classic scripts zonder `import`/`export`. Laat `app.js` en `styles.css`
   intact voor gewone inhoudswijzigingen.
7. Gebruik alleen bestaande SVG-symbolen uit `index.html`. Als een nieuw
   inhoudelijk noodzakelijk icoon ontbreekt, voeg één symbol aan de sprite toe
   en meld dit. Combineer een icoon alleen met volledig links uitgelijnde
   inhoud; een gecentreerde titel heeft geen icoon.
8. Controleer iedere toegevoegde of gewijzigde slide op een geldige `id`,
   niet-lege `title`, `bullets`-array en `notes`-string. Test de presentatie
   daarna volgens `.claude/skills/test-presentation/SKILL.md` en bekijk de
   gewijzigde slides visueel.

## Behoudregels

- Laat niet-genoemde slides en hun positie ongemoeid bij een gerichte update.
- Bewaar bestaande specialistische velden zoals `isTemplateAnchor`,
  `templateSection`, `discoHoldMs`, `discoTitleLines` en `duration`, tenzij
  de feedback ze daadwerkelijk raakt.
- Pas `duration` (seconden, presenter-only) aan wanneer de gebruiker een
  tijd voor een slide noemt of vraagt een eerdere schatting te corrigeren
  (bijv. na een droogloop met de presentatietimer in de Presenter View) —
  dit raakt alleen de schema-indicatie daar, nooit de zichtbare
  presentatie.
- Pas ongerelateerde sleutels in `config.js` niet aan.
- Schrijf onderwerpcontent nooit terug naar `main` of `develop`; alleen
  herbruikbare engineverbeteringen horen daar.
- Lever nooit een slide zonder geldige `title`, `bullets` en `notes` op.

## Oplevering

Noem kort welke slides zijn toegevoegd of gewijzigd, welke brede instellingen
eventueel zijn aangepast en hoe het resultaat is gecontroleerd. Vertaal
interne implementatiedetails naar begrijpelijke taal, tenzij de gebruiker om
de techniek vraagt.
