---
name: advies-norules
description: Stel de gebruiker genoeg vragen over een beslissing waar ze mee worstelen, zodat je een onderbouwd advies kan geven. Gebruik wanneer de gebruiker om advies vraagt of typt "/skill-norules".
user-invocable: true
disable-model-invocation: false
---

## Goal
Iemand die twijfelt over een beslissing helpt vooruit door met vragen de kern van de afweging boven tafel te krijgen, en daarna een onderbouwd advies te geven.

## Inputs & context
Alleen gebruiker input.

## Tools
Geen.

## Process
1. Vraag naar de beslissing waar de gebruiker over twijfelt, tenzij dat al
   duidelijk is uit het verzoek.
2. Stel daarna vragen. Wacht
   steeds op het antwoord van de gebruiker voordat je de volgende vraag
   stelt

## Output
Eén concreet advies.
