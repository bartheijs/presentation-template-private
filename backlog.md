# Backlog

Toekomstig werk dat bewust nog niet is uitgevoerd. Zie per item de reden.

---

## Branch-strategie: engine-template vs. persoonlijke presentaties

**Status:** gepland, nog niet uitgevoerd. Uit te voeren ná de live-presentatie
van de gebruiker (huidige workshop), in een nieuwe sessie — niet nu, om niets
te riskeren vlak voor het optreden.

### Context

`main` bevat op dit moment nog de originele, kale versie van de repo: de
persoonlijke "Skill Engineering Workshop"-content, zonder alle
engine-verbeteringen van deze sessie (config.js, disco/pauze-modus,
uitlijning/kolommen, fonts, notities-toggle, skills, testsuite). Al dat werk
staat alleen op `claude/project-overview-dpv3l1` (en de remote-tegenhanger),
nooit gemerged naar `main`.

De gebruiker wil de repo opsplitsen in drie rollen:
- **`main`** — het herbruikbare sjabloon: de volledige engine + een
  zelf-documenterende voorbeeld-presentatie die elke instelmogelijkheid
  uitlegt én live laat zien. Dit is het startpunt voor elke nieuwe
  presentatie.
- **`develop`** — waar nieuwe engine-features gebouwd worden, los van
  specifieke presentatie-content.
- **`presentation-<naam>`** — één branch per echte presentatie, vanaf
  `main` getakt, met eigen content. Vrije naam na de prefix. De huidige
  content van de gebruiker wordt `presentation-skill-workshop`.

### Doelstructuur

```
main                        engine (index.html/app.js/styles.css/config.js/
                             skills/tests) + zelf-documenterende voorbeeld-
                             presentatie ("hoe werkt dit sjabloon")

develop                      zelfde engine + voorbeeld-content, hier komen
                             nieuwe features eerst binnen vóór ze naar main
                             gepromoveerd worden

presentation-skill-workshop  huidige echte content (de workshop van de
                             gebruiker) + de nieuwste engine op het moment
                             van aftakken

presentation-<naam>          toekomstige presentaties, elk vanaf main
                             getakt, vrije naam na de prefix
```

### Migratiestappen (uit te voeren in een latere sessie, ná de presentatie)

1. **`presentation-skill-workshop` aanmaken** vanaf de huidige stand van
   `claude/project-overview-dpv3l1` (engine + echte content) — dit wordt
   direct de branch om vanaf te presenteren, heeft geen verdere wijziging
   nodig.
2. **`claude/project-overview-dpv3l1` mergen naar `main`** — brengt de
   volledige engine naar `main` (de content is op dit punt nog steeds de
   persoonlijke workshop-inhoud).
3. **`main`'s content vervangen** door een nieuwe voorbeeld-/tutorial-deck
   (zie checklist hieronder). Claude stelt hiervoor een eerste concept voor
   bij uitvoering; de gebruiker kan het daarna bijschaven. `config.js` op
   `main` krijgt bijpassende generieke defaults (titel, disco-tekst, etc.).
4. **`develop` aanmaken** vanaf het bijgewerkte `main` (engine +
   voorbeeld-content) — toekomstige features worden hier ontwikkeld.
5. **Workflow documenteren** (README.md-sectie of nieuw `CONTRIBUTING.md`):
   - Nieuwe presentatie starten: tak `presentation-<naam>` af van `main`,
     gebruik de `scaffold-presentation`-skill (of `content-template.md`) om
     de voorbeeld-content te vervangen.
   - Nieuwe engine-feature bouwen: werk op (een branch vanaf) `develop`,
     merge terug naar `develop`; promoot `develop` periodiek naar `main`
     (en werk de voorbeeld-deck bij zodat 'ie de nieuwe feature ook toont).
     Bestaande `presentation-*`-branches kunnen daarna zelf `main` mergen om
     engine-updates te ontvangen zonder hun eigen content te raken.
6. **GitHub-instellingen** (handmatig, niet iets wat Claude zonder overleg
   aanpast): overwegen of `main` de default/protected branch blijft, en of
   `develop` ook bescherming nodig heeft. Aparte beslissing voor de
   gebruiker, buiten scope van dit plan.

### Checklist: wat de voorbeeld-deck op `main` moet laten zien

Geen volledige content nu al uitschrijven — bij uitvoering stelt Claude een
eerste opzet voor (één of enkele slides per punt), gebruiker schaaft bij:

- Welkomst-/introslide: dit is een sjabloon, hoe het te gebruiken.
- Korte uitleg van `config.js`'s opbouw (namespaces).
- Disco: een slide met disco uit, één met auto-modus, één die live de
  pauze-modus (`discoMode: 'pause'`) demonstreert.
- Uitlijning: een center-slide en een links-uitgelijnde slide,
  met uitleg van `CONFIG.layout.align` + per-slide `align`.
- Bullet-subtekst: een live voorbeeld van een `{ text, subtext }`-bullet.
- 8/12-koloms-breedte: beschrijvend (niet per-slide instelbaar).
- Fonts: uitleg van `--font-heading`/`--font-bullet`/`--font-body` (CSS,
  niet config.js).
- Notities-toggle: vermelding van de presenter-knop.
- Timer, confetti, "Klaar!"-knop: kort behandelen.
- Skill Template-overlay: als generiek concept uitleggen (of
  `templateOverlay.enabled: false` tonen voor wie het niet gebruikt).
- Verwijzing naar `content-template.md` + de skills
  (`scaffold-presentation`/`update-slides`/`test-presentation`) als
  aanbevolen manier om een nieuwe `presentation-*`-branch te vullen.

### Kritieke bestanden (bij uitvoering)

- `slides-data.js`/`config.js` op `main` — nieuwe voorbeeld-content.
- `README.md` (of nieuw `CONTRIBUTING.md`) — branch-workflow.
- Git-branches zelf (`presentation-skill-workshop`, `develop`) — geen
  bestandswijzigingen, wel merge-/aftak-operaties.

### Bekend aandachtspunt voor de testsuite — en waarom dit juist goed uitkomt

`tests/README.md` documenteert al dat sommige tests (specifiek de
`isTemplateAnchor`-test in `layout.spec.js`, en de slide-index-aannames in
`disco-and-pause.spec.js`/`notes-toggle.spec.js`/`notes-resize.spec.js`)
aannames doen over welke slide-indexen bepaalde eigenschappen hebben. Zodra
`main`'s content verandert, moeten deze tests gecontroleerd/aangepast
worden aan de nieuwe voorbeeld-deck.

Gebruiker bevestigt: dit is precies waarom `main` én `develop` allebei de
volledige "alle-opties"-voorbeeld-deck horen te hebben (niet een uitgeklede
variant) — omdat die deck bewust élke feature laat zien, is 'ie ook meteen
het beste testmateriaal. D.w.z. bij stap 3/4 hierboven niet een minimale
demo bouwen, maar juist een deck dat elke configureerbare optie bevat, zodat
de testsuite straks tegen die rijke content kan draaien in plaats van tegen
de persoonlijke workshop-content van de gebruiker. `presentation-*`-branches
(met echte, mogelijk kortere content) blijven dan de enige plek waar de
testsuite bewust wat minder dekking heeft — precies zoals nu al voor
`presentation-skill-workshop` het geval zou zijn.

### Verificatie (bij uitvoering)

1. `presentation-skill-workshop`: `index.html` openen, bevestigen dat dit
   exact de huidige, volledig werkende presentatie is (engine + echte
   content) — workshop-klaar zonder verdere wijziging.
2. `main`: `index.html` openen, de voorbeeld-deck doorlopen, bevestigen dat
   elke gedemonstreerde feature (disco-pauze, links uitlijnen, subtekst,
   notities-toggle) daadwerkelijk werkt zoals beschreven.
3. `npx playwright test` draaien op zowel `main` als `develop` na het
   aanpassen van de content-afhankelijke tests.
4. Steekproef: vanaf `main` een nieuwe `presentation-test`-branch
   aanmaken en met de `scaffold-presentation`-skill (of handmatig) vullen,
   om te bevestigen dat de workflow voor een nieuwe presentatie soepel
   werkt.
