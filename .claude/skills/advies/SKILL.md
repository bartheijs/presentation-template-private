---
name: advies
description: Stel de gebruiker 3 korte vragen over een beslissing waar ze mee worstelen, en geef daarna een kort, onderbouwd advies. Gebruik wanneer de gebruiker om advies vraagt of typt "/advies".
user-invocable: true
disable-model-invocation: false
---

## Goal
Iemand die twijfelt over een beslissing helpt vooruit door met 3 gerichte
vragen de kern van de afweging boven tafel te krijgen, en daarna een kort,
onderbouwd advies te geven.

## Inputs & context
Alleen gebruiker input.

## Tools
Geen.

## Process
1. Vraag naar de beslissing waar de gebruiker over twijfelt, tenzij dat al
   duidelijk is uit het verzoek.
2. CHECKPOINT: Stel daarna precies 3 korte vragen. Wacht
   steeds op het antwoord van de gebruiker voordat je de volgende vraag
   stelt:
   - Wat is de belangrijkste reden om het WEL te doen?
   - Wat is de belangrijkste reden om het NIET te doen?
   - Wat zou je jezelf over een jaar kwalijk nemen: het wel gedaan hebben,
     of het niet gedaan hebben?
3. Controleer of alle drie de antwoorden binnen zijn. Ontbreekt er nog een
   antwoord, vraag daar dan eerst naar voordat je advies geeft.

## Output
Eén kort, concreet advies van maximaal 3-4 zinnen: een duidelijke richting
plus de belangrijkste reden waarom, gebaseerd op de drie antwoorden.

## Rules
- ALTIJD de vragen één voor één stellen, nooit alle 3 tegelijk.
- ALTIJD snel tot de vragen komen — geen lange uitleg vooraf.
- NOOIT advies geven voordat alle 3 de antwoorden binnen zijn.
- Sluit het advies ALTIJD af met: "Laat jouw problemen mijn problemen worden."
