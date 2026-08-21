---
name: update-slides
description: Add or edit slides in an existing presentation built from this template, using a Markdown content document without touching unrelated slides or configuration. Do not use to modify the protected skill-workshop-presentation branch.
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
  `{ id, title, icon, bullets, notes, disco?, discoMode?, discoTitleLines?, align?, isTemplateAnchor?, templateSection? }`.
  `discoMode` (`'auto'`/`'pause'`) is alleen relevant als disco voor die
  slide aan staat. `discoTitleLines` (array van strings) overschrijft
  `CONFIG.disco.titleLines` voor alléén de overgang die op die ene slide
  landt — zeldzaam gebruik, alleen zetten als expliciet gevraagd. `align`
  (`'center'`/`'left'`) overschrijft `CONFIG.layout.align` voor die ene
  slide. Een item in `bullets` is een plain string, óf `{ text, subtext }`.)
  en `config.js` (vorm: zie dat bestand — `lang`, `title`, `toc.heading`,
  `layout.align`, `disco.enabled`/`disco.titleLines`/`disco.mode`,
  `timer.defaultMinutes`/`addMinutes`, `transitions.*`, `confettiColors`,
  `templateOverlay.enabled`, `ui.*`).
- Beschikbare iconen (`<symbol id="icon-...">` in `index.html`):
  `spark, bulb, book, alert, compare, bolt, repeat, folder, template, chat,
  seed, pause, question, checklist, target, layers, tag, inbox, wrench,
  steps, checkpoint, check, output, rules, swap, ruler, flag`
  (`clock, close, arrow-left, arrow-right, party` zijn UI-chrome, niet voor
  slide-content).
- Vaste compositieregel: `icon` vereist effectieve uitlijning `left`.
  Gecentreerde slides laten `icon` weg; hun bullets blijven links uitgelijnd.

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

0. Controleer de actieve Git-branch en stop als dit
   `skill-workshop-presentation` is, tenzij de gebruiker in dezelfde opdracht
   expliciet vraagt die productiepresentatie te wijzigen.
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
       `isTemplateAnchor`/`templateSection`/`discoTitleLines`-velden van díe
       entry ongemoeid tenzij het document ze expliciet aanpast — dit
       content-formaat heeft geen frontmatter-regel voor `discoTitleLines`,
       dus een bestaande waarde alleen laten staan, nooit stilzwijgend
       verwijderen omdat het document het veld niet noemt.
     - Bestaat de titel nog niet → nieuwe slide, toegevoegd aan het eind van
       de array met een nieuwe oplopende `id`, tenzij de gebruiker een
       positie aangeeft (bijv. "na slide 5" of "vóór 'Wat is een skill?'").
     - Alle overige, niet-genoemde slides in `slides-data.js` blijven
       volledig ongewijzigd (inclusief hun positie).
   - → CHECKPOINT: als niet duidelijk is of het om een volledige vervanging
     of een gerichte update gaat, vraag dit expliciet aan de gebruiker
     voordat je iets overschrijft.
4. Bevat het document frontmatter-velden, werk dan alléén de bijbehorende
   sleutels in `config.js` bij, per veld:
   - `titel` → `CONFIG.title`
   - `taal` → `CONFIG.lang`
   - `timer minuten` → `CONFIG.timer.defaultMinutes`
   - `disco standaard` → `CONFIG.disco.enabled`
   - `disco tekst` → `CONFIG.disco.titleLines`
   - `disco modus` → `CONFIG.disco.mode`
   - `uitlijning standaard` → `CONFIG.layout.align`

   Pas alleen de sleutels aan die daadwerkelijk in de frontmatter voorkomen;
   laat de rest van `config.js` ongemoeid. Ontbreekt de frontmatter volledig,
   laat `config.js` dan helemaal met rust.
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
   veranderd. **Controleer ook expliciet dat elke toegevoegde/gewijzigde
   slide een niet-lege `title` (string) en een `bullets`-array heeft** (`[]`
   is prima, `undefined`/ontbrekend niet) — één slide zonder deze twee
   velden breekt de hele presentatie bij het opstarten, niet alleen die ene
   slide (zie Rules). Ontbreekt er iets of is een match dubbelzinnig (bijv.
   twee bestaande slides met (bijna) dezelfde titel), stel dan eerst een
   vraag voordat je oplevert.

## Output

- Bijgewerkte `slides-data.js`, eventueel `config.js` en/of een nieuw
  `<symbol>` in `index.html`.
- Een korte chat-samenvatting van wat is toegevoegd/gewijzigd + de instructie
  om `index.html` in de browser te openen ter controle.

## Rules

- ALTIJD niet-genoemde slides en hun volgorde ongemoeid laten bij een
  gerichte update.
- ALTIJD kiezen tussen icoon + volledig links uitgelijnd, of gecentreerde
  titel zonder icoon + links uitgelijnde bullets. NOOIT een icoon naast een
  gecentreerde titel plaatsen.
- ALTIJD `isTemplateAnchor`/`templateSection`/`discoTitleLines` van
  bestaande slides bewaren tenzij het content-document ze expliciet noemt.
- NOOIT `config.js`-sleutels aanpassen die niet in de frontmatter van het
  document voorkomen.
- NOOIT `app.js`/`styles.css` aanraken voor deze skill.
- NOOIT een slide-object opleveren zonder `title` (niet-lege string) of
  zonder `bullets` (array, mag leeg zijn). `app.js` degradeert dit
  tegenwoordig defensief (lege titel/geen bullets i.p.v. een crash), maar
  dat is een vangnet — geen excuus om deze velden achterwege te laten.
- NOOIT onderwerpcontent vanuit een presentatiebranch terugschrijven naar
  `main` of `develop`; alleen herbruikbare engineverbeteringen horen daar.
