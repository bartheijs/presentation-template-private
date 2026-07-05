---
name: scaffold-presentation
description: Build a brand-new skill-workshop-presentation deck (config.js + slides-data.js) from a Markdown content document. Use when the user hands over a content document (title, per-slide bullets, speaker notes, disco yes/no, disco text) and wants a fresh presentation set up from scratch — typically right after branching this repo for a new topic.
---

# Nieuwe presentatie opzetten vanuit een content-document

Deze skill vertaalt één Markdown content-document naar een compleet
`config.js` + `slides-data.js`-paar voor deze presentatie-engine
(`index.html`/`app.js`/`styles.css`). Gebruik hem meteen na het aanmaken van
een nieuwe branch voor een nieuwe presentatie, zodat de gebruiker zelf geen
JavaScript hoeft te schrijven.

## Goal

Een content-document (titel, per-slide bullets/speaker notes/disco-keuze)
omzetten in een werkende presentatie, zonder de render-/animatie-/timer-/
confetti-engine (`app.js`, `styles.css`) aan te raken — behalve het
uitzonderingsgeval van een ontbrekend icoon (zie stap 5).

## Inputs & context

- Het content-document van de gebruiker (vraag erom als het niet is
  meegegeven — pad of geplakte tekst).
- `config.js` in deze repo als referentie voor de exacte `CONFIG`-vorm
  (`lang`, `title`, `toc.heading`,
  `disco.enabled`/`disco.titleLines`/`disco.mode`,
  `timer.defaultMinutes`/`addMinutes`, `confettiColors`,
  `templateOverlay.enabled`, `ui.*`).
- `slides-data.js` in deze repo als referentie voor de exacte `SLIDES`-vorm:
  `{ id, title, icon, bullets, notes, disco?, discoMode?, isTemplateAnchor?, templateSection? }`.
  `discoMode` (`'auto'`/`'pause'`) is alleen relevant als disco voor die
  slide aan staat — `'pause'` bevriest de disco-overgang volledig zichtbaar
  tot een tweede, bijpassende klik op Volgende/Vorige.
  `isTemplateAnchor`/`templateSection`/`SKILL_TEMPLATE_MD`/`SKILL_TEMPLATE_SECTIONS`
  horen bij het "skill.md-sjabloon"-concept van *deze* workshop — een nieuw
  onderwerp heeft dat vrijwel nooit nodig.
- Beschikbare iconen (`<symbol id="icon-...">` in `index.html`), te gebruiken
  voor het `icon`-veld van een slide:
  `spark, bulb, book, alert, compare, bolt, repeat, folder, template, chat,
  seed, pause, question, checklist, target, layers, tag, inbox, wrench,
  steps, checkpoint, check, output, rules, swap, ruler, flag`.
  (`clock, close, arrow-left, arrow-right, party` zijn vaste UI-chrome-iconen
  — gebruik die niet voor slide-content tenzij de gebruiker dat expliciet vraagt.)

## Content-document formaat

Eén Markdown-bestand: een `---`-frontmatter-blok met document-brede
instellingen, gevolgd door één `##`-kop per slide.

```markdown
---
titel: Naam van de presentatie
taal: nl
timer minuten: 30
disco standaard: ja
disco tekst: SKILLS, THRILLS
disco modus: auto
---

## Titel van de slide
Icon: bulb
Disco: nee

- Eerste bullet, ondersteunt **vet** en `code`
- Tweede bullet

Notes:
Vrije tekst voor de speaker notes. Lege regel = nieuwe paragraaf.
- Lijstjes met - of * werken
1. Genummerde lijstjes ook

## Een andere slide, met een bevroren disco-overgang
Disco modus: pause

- Deze overgang stopt halverwege, bevroren op de disco-achtergrond,
  tot de presenter nogmaals op Volgende/Vorige klikt
```

Regels voor het parsen:
- Frontmatter-velden zijn allemaal optioneel; ontbreekt een veld, gebruik dan
  het bijbehorende default uit `config.js` (`timer minuten` → 30, `disco
  standaard` → ja, `disco modus` → auto, `taal` → nl). `disco tekst` is een
  kommagescheiden lijst; elk item wordt één regel op de disco-achtergrond
  (`CONFIG.disco.titleLines`).
- Elke `##`-kop wordt één slide, in documentvolgorde, met oplopende `id`
  vanaf 1.
- Optionele `Icon:`/`Disco:`/`Disco modus:`-regels staan direct onder de
  kop, vóór de bullet-lijst. Ontbreekt `Icon:`, kies dan het best passende
  icoon uit de lijst hierboven op basis van de inhoud van de slide (bijv.
  een waarschuwing → `alert`, een vraag → `question`, een stappenplan →
  `steps`). Ontbreekt `Disco:`/`Disco modus:`, laat het `disco`-/
  `discoMode`-veld dan gewoon weg (het slide-object erft dan de
  document-brede default) — voeg het veld niet expliciet toe met dezelfde
  waarde als de default, dat is ruis. `Disco modus: pause` heeft alleen
  effect als disco voor die slide ook daadwerkelijk aan staat (globaal of
  via `Disco: ja`).
- De bullet-lijst wordt direct `slide.bullets` (array van strings, markdown
  `**bold**`/`` `code` `` blijft behouden — dat rendert `app.js` al).
- Alles ná een regel die begint met `Notes:` (tot de volgende `##`-kop) wordt
  ongewijzigd `slide.notes` — geen extra parsing nodig, `renderNotesHTML()`
  in `app.js` kan paragrafen, `-`/`*`-lijstjes, `1.`-lijstjes en
  ```` ``` ````-codeblokken al aan.
- Ontbreekt een `Notes:`-sectie, dan is `slide.notes` een lege string.

## Tools

Alleen bestandslezen/schrijven nodig (Read/Write/Edit) — geen MCP,
sub-agents of code execution.

## Process

1. Lees het volledige content-document.
2. Vertaal de frontmatter naar een `config.js`, in exact dezelfde vorm als
   het bestaande `config.js` in deze repo (classic script, `const CONFIG =
   {...}`, geladen vóór `slides-data.js`/`app.js`). Zet
   `templateOverlay.enabled: false`, tenzij het document zelf expliciet
   sjabloon-secties beschrijft (zeldzaam — dat concept hoort bij déze
   workshop, niet bij een generiek nieuw onderwerp). → CHECKPOINT: als
   twijfelachtig, vraag de gebruiker expliciet of de skill.md-sjabloon-
   overlay nodig is voor deze presentatie.
3. Vertaal elke `##`-sectie naar een `SLIDES`-object zoals hierboven
   beschreven. Sla het resultaat op als de volledige `SLIDES`-array in
   `slides-data.js` (overschrijft de bestaande inhoud; laat
   `SKILL_TEMPLATE_MD`/`SKILL_TEMPLATE_SECTIONS` weg als ze niet gebruikt
   worden).
4. Schrijf `config.js` en `slides-data.js` weg.
5. Ontbreekt er een passend icoon voor een slide in de vaste lijst (zeldzaam
   — de lijst dekt de meeste onderwerpen), voeg dan één nieuwe
   `<symbol id="icon-...">` toe aan de bestaande sprite in `index.html`
   (regels 13-44) — dit is de enige toegestane wijziging buiten
   `config.js`/`slides-data.js`. Meld dit expliciet in de samenvatting.
6. Update naar gebruiker: geef een korte samenvatting — aantal slides,
   gebruikte `CONFIG`-waarden, of `templateOverlay` aan/uit staat, en of er
   nieuwe iconen zijn toegevoegd.
7. Controleer of alle `##`-secties uit het document zijn verwerkt en of elk
   slide-object een geldig `icon` heeft (bestaat als `<symbol>` in
   `index.html`). Ontbreekt er iets of is een sectie onduidelijk (bijv. geen
   enkele bullet én geen notes), stel dan eerst een vraag voordat je
   oplevert.

## Output

- Nieuw/overschreven `config.js` en `slides-data.js`.
- Eventueel een nieuw `<symbol>` in `index.html` (alleen indien nodig, zie
  stap 5).
- Een korte chat-samenvatting + de instructie om `index.html` in de browser
  te openen ter controle.

## Rules

- ALTIJD `config.js`/`slides-data.js` als classic scripts schrijven (geen
  `import`/`export`), consistent met de rest van deze repo.
- ALTIJD Nederlandse UI-teksten/inhoud aanhouden, tenzij het content-document
  een andere `taal` opgeeft.
- NOOIT `app.js`/`styles.css` structureel wijzigen voor deze skill — alleen
  `index.html`'s iconen-sprite mag uitgebreid worden, en alleen als stap 5
  dat noodzakelijk maakt.
- NOOIT het skill.md-sjabloonconcept (`isTemplateAnchor`, `templateSection`,
  `SKILL_TEMPLATE_MD`/`SECTIONS`) toevoegen tenzij het content-document dat
  expliciet beschrijft.
