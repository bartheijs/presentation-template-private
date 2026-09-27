# Concept: "Slimste Mens" Quiz-tool (2-venster opzet)

## Doel
Een losse quiz-onderbreking binnen een bestaande presentatie/presenterview-setup. Publiek ziet een lijst die zich vult; quizmaster bedient dit vanuit een apart scherm, zoals PowerPoint presenter view.

## 1. Basisopzet

### 1a. Vensters en rollen
- **Venster 1 (publiek/presentatiescherm)**: toont de lijst met plekken. Lege plekken tonen alleen een nummer. Zodra quizmaster een item "toont", verschijnt het antwoord op die plek.
- **Venster 2 (quizmaster/laptop)**: toont de volledige lijst inclusief alle antwoorden en uitleg. Per item een set knoppen: **toon / verberg / ga naar uitleg**. Vanuit de uitlegslide een knop **terug naar lijst**.
- Fysieke opstelling: venster 1 op het presentatiescherm/projector, venster 2 op de laptop — analoog aan PowerPoint presenter view.

### 1b. Communicatie tussen vensters
- **Hergebruik het bestaande cross-window communicatieprotocol uit het huidige presentatie/presenterview-project.** Niet opnieuw uitvinden — implementatie moet dit protocol overnemen/aanroepen zoals daar al gebruikt wordt.
- Losstaand van dat protocol, voor de state-persistentie (welke items al getoond zijn, zodat een refresh niets kapotmaakt), overwogen opties:
  - JSON-bestand bijhouden
  - React state (grote impact, want nog niet in gebruik in dit project)
  - localStorage
  - BroadcastChannel API (vaak gecombineerd met localStorage)
  - `window.opener`-referentie (simpel, maar fragiel bij refresh)
- **Openstaand: bepalen welke combinatie het beste aansluit op het bestaande protocol.**

### 1c. Lijstgrootte
- Lijst is **variabel**, niet vast op 10 — bruikbaar voor 1 tot x items.
- Lijst is **statisch qua posities**: items verschijnen op hun eigen vaste plek, dus tijdens het spel kunnen er lege plekken tussen ingevulde plekken blijven staan (geen automatisch opschuiven).

## 2. Functionaliteit per item (quizmaster-kant)
Per item in venster 2, knoppen voor:
- **Toon** — item verschijnt in venster 1
- **Verberg** — item verdwijnt weer uit venster 1 (voor correcties)
- **Ga naar uitleg** — springt naar de uitlegslide voor dit item
- Vanuit de uitlegslide: knop **terug naar lijst**

### 2a. Status zichtbaar in venster 2
De open/gesloten status van elk item moet in venster 2 in één oogopslag te zien zijn — bijvoorbeeld via een kleurcode per item (bijv. grijs = nog verborgen, groen = getoond). Zo weet de quizmaster zonder te schakelen naar venster 1 welke items al onthuld zijn.

## 3. Reveal-effect (venster 1)
Bij het tonen van een item:
1. Item verschijnt groot op een tussenscherm/overlay
2. Draait, komt tot stilstand
3. Confetti-animatie
4. Valt daarna pas op zijn plek in de lijst

*(Leuk-to-have, geen blocker voor MVP — kan later toegevoegd worden.)*

## 4. Score-telling
- Puntensysteem per **team** (pubquiz-setting), niet per individuele speler.
- **4 teams**.
- Moet **per presentatie aan/uit te zetten zijn** — niet elke presentatie gebruikt scoretelling.
- **Geen prioriteit**, maar leuke toevoeging voor latere iteratie.

## 5. Uitlegslides
- Vrije indeling/opmaak.
- Start met een **template** (branding-consistent met bestaande presentatie), quizmaster vult per vraag de inhoud in (tekst, evt. afbeelding/bron).

## 6. Expliciet uitgesloten
- Geen timer per vraag/ronde.
- Geen ondersteuning voor meerdere rondes/categorieën binnen één tool — dit is bedoeld als simpele onderbreking binnen een grotere presentatie, niet een volwaardig quizplatform.

## 7. Openstaande vragen voor implementatie
- Welk exact mechanisme gebruikt het bestaande presenterview-protocol voor cross-window communicatie? (bepaalt keuze bij 1b)
- Waar leeft de content (vragen/antwoorden/uitleg) — los JSON-bestand, ingebakken in de HTML, of anders?
- Hoe wordt de reveal-animatie (punt 3) technisch aangepakt — CSS-only of met een animatie-library?
