---
name: update-slides
description: Add or edit slides in an existing skill-workshop-presentation deck from a Markdown content document, without touching unrelated slides or config. Use when the user wants to tweak, add, or replace some or all slides of a presentation that already has a config.js/slides-data.js, via a content document (title, bullets, speaker notes, disco yes/no).
---

# Slides bijwerken vanuit een content-document

Deze skill werkt een **bestaande** presentatie (die al een `config.js` en
`slides-data.js` heeft) bij op basis van een Markdown content-document,
zonder ongerelateerde slides of instellingen te raken. Gebruikt hetzelfde
documentformaat als de `scaffold-presentation`-skill.

## Goal

Eén of meer slides toevoegen/wijzigen (of, indien het document de hele deck
bevat, de volledige `SLIDES`-array vervangen) zonder niet-genoemde slides,
hun `isTemplateAnchor`/`templateSection`-velden, of ongerelateerde
`config.js`-instellingen aan te tasten.

## Inputs & context

- Het (deel-)content-document van de gebruiker.
- De bestaande `slides-data.js` in deze repo (`SLIDES`-array, vorm:
  `{ id, title, icon, bullets, notes, disco?, discoMode?, align?, isTemplateAnchor?, templateSection? }`.
  `discoMode` (`'auto'`/`'pause'`) is alleen relevant als disco voor die
  slide aan staat. `align` (`'center'`/`'left'`) overschrijft
  `CONFIG.layout.align` voor die ene slide. Een item in `bullets` is een
  plain string, óf `{ text, subtext }`.)
  en `config.js` (vorm: zie dat bestand — `lang`, `title`, `toc.heading`,
  `layout.align`, `disco.enabled`/`disco.titleLines`/`disco.mode`,
  `timer.defaultMinutes`/`addMinutes`, `confettiColors`,
  `templateOverlay.enabled`, `ui.*`).
- Beschikbare iconen (`<symbol id="icon-...">` in `index.html`):
  `spark, bulb, book, alert, compare, bolt, repeat, folder, template, chat,
  seed, pause, question, checklist, target, layers, tag, inbox, wrench,
  steps, checkpoint, check, output, rules, swap, ruler, flag`
  (`clock, close, arrow-left, arrow-right, party` zijn UI-chrome, niet voor
  slide-content).

## Content-document formaat

Zelfde formaat als bij `scaffold-presentation`: optionele `---`-frontmatter
met document-brede instellingen, gevolgd door `##`-koppen per slide met
optionele `Icon:`/`Disco:`/`Disco modus:`/`Uitlijning:`-regels, een
bullet-lijst (met optionele ingesprongen `subtext:`-vervolgregels) en een
`Notes:`-sectie. Hier mag het document echter **een deelverzameling** van de
slides bevatten — alleen de slides die je wilt toevoegen of wijzigen.

## Tools

Alleen bestandslezen/schrijven nodig (Read/Write/Edit) — geen MCP,
sub-agents of code execution.

## Process

1. Lees het bestaande `slides-data.js` (en `config.js` als het document een
   frontmatter-blok bevat) om te weten wat er al staat.
2. Lees het content-document.
3. Bepaal de modus:
   - **Volledige vervanging**: het document bevat duidelijk de hele deck
     (bijv. expliciet aangegeven door de gebruiker, of het aantal
     `##`-secties komt overeen met de bestaande deck-grootte en dekt elk
     onderwerp opnieuw). Vervang dan de hele `SLIDES`-array zoals in
     `scaffold-presentation` stap 3.
   - **Gerichte update** (standaard als het document duidelijk een kleiner
     deel is): match elke `##`-sectie op **exacte slide-titel** tegen de
     bestaande `SLIDES`-array.
     - Bestaat de titel al → overschrijf alleen die entry's `title`, `icon`
       (als opgegeven), `bullets`, `notes`, `disco` (als opgegeven),
       `discoMode` (als opgegeven), `align` (als opgegeven). Laat bestaande
       `isTemplateAnchor`/`templateSection`-velden van díe entry ongemoeid
       tenzij het document ze expliciet aanpast.
     - Bestaat de titel nog niet → nieuwe slide, toegevoegd aan het eind van
       de array met een nieuwe oplopende `id`, tenzij de gebruiker een
       positie aangeeft (bijv. "na slide 5" of "vóór 'Wat is een skill?'").
     - Alle overige, niet-genoemde slides in `slides-data.js` blijven
       volledig ongewijzigd (inclusief hun positie).
   - → CHECKPOINT: als niet duidelijk is of het om een volledige vervanging
     of een gerichte update gaat, vraag dit expliciet aan de gebruiker
     voordat je iets overschrijft.
4. Bevat het document frontmatter-velden, werk dan alléén de bijbehorende
   sleutels in `config.js` bij (bijv. alleen `disco tekst` opgegeven →
   alleen `CONFIG.disco.titleLines` aanpassen; alleen `disco modus`
   opgegeven → alleen `CONFIG.disco.mode` aanpassen; alleen `uitlijning
   standaard` opgegeven → alleen `CONFIG.layout.align` aanpassen; de rest
   van `config.js` ongemoeid laten). Ontbreekt de frontmatter volledig, laat
   `config.js` dan helemaal met rust.
5. Ontbreekt een passend icoon in de vaste lijst voor een nieuwe/gewijzigde
   slide, voeg dan één nieuwe `<symbol id="icon-...">` toe aan de sprite in
   `index.html` (regels 13-44) — enige toegestane wijziging buiten
   `config.js`/`slides-data.js`. Meld dit expliciet.
6. Schrijf de bijgewerkte `slides-data.js` (en eventueel `config.js`) weg.
7. Update naar gebruiker: som op welke slides zijn toegevoegd, welke zijn
   gewijzigd (met titel), en welke `config.js`-sleutels (indien van
   toepassing) zijn aangepast.
8. Controleer of elke `##`-sectie uit het document daadwerkelijk is verwerkt
   en of geen niet-genoemde slide per ongeluk is aangepast of van positie is
   veranderd. Ontbreekt er iets of is een match dubbelzinnig (bijv. twee
   bestaande slides met (bijna) dezelfde titel), stel dan eerst een vraag
   voordat je oplevert.

## Output

- Bijgewerkte `slides-data.js`, eventueel `config.js` en/of een nieuw
  `<symbol>` in `index.html`.
- Een korte chat-samenvatting van wat is toegevoegd/gewijzigd + de instructie
  om `index.html` in de browser te openen ter controle.

## Rules

- ALTIJD niet-genoemde slides en hun volgorde ongemoeid laten bij een
  gerichte update.
- ALTIJD `isTemplateAnchor`/`templateSection` van bestaande slides bewaren
  tenzij het content-document ze expliciet noemt.
- NOOIT `config.js`-sleutels aanpassen die niet in de frontmatter van het
  document voorkomen.
- NOOIT `app.js`/`styles.css` aanraken voor deze skill.
