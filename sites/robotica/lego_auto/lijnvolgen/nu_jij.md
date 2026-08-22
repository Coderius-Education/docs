---
sidebar_position: 4
slug: /lijnvolgen/nu-jij
title: "Deel 8: Nu jij"
---

# Het robotscript bouwen — Deel 8: Nu jij

Je robot rijdt rechtdoor zolang beide sensoren wit zien. Zodra hij afdwaalt, ziet één sensor de lijn — en dan gebeurt er nog niets. Dit laatste deel is aan jou: zoals in Deel 7 aangekondigd, staat hier geen uitwerking. Alles wat je nodig hebt, heb je in de vorige delen zelf gebouwd.

<Voorkennis
  items={[
    {site: 'python', to: '/docs/beslissen/05c-and-or-elif', label: 'and, or en elif'},
    {site: 'python', to: '/docs/beslissen/05b-if-else', label: 'If en else'},
  ]}
/>

## Opdracht 10.4.a: maak de lijnvolger af

Breid het `if`-blok uit Deel 7 uit met **twee extra gevallen**, met `elif`:

1. **Links ziet zwart, rechts wit** → de lijn ligt links. Stuur bij.
2. **Links ziet wit, rechts zwart** → de lijn ligt rechts. Stuur bij.

```python
    if kleur_links == "white" and kleur_rechts == "white":
        motor_a.forward(255)
        motor_b.forward(255)
    elif kleur_links == "black" and kleur_rechts == "white":
        # TODO: welke motor zet je zachter?
        pass
    elif kleur_links == "white" and kleur_rechts == "black":
        # TODO: en hier de andere kant op
        pass
```

Vervang elke `# TODO` en de `pass` door de juiste `motor_a.forward(...)` en `motor_b.forward(...)`. Het scherm draait mee — daaraan zie je of je robot het goede geval te pakken heeft.

## Denk na

Drie vragen om je op weg te helpen — beantwoord ze voor jezelf voordat je typt:

1. De lijn ligt **links**. Welke kant moet de robot dan op draaien, en welke motor moet daarvoor zachter?
2. Hoe véél zachter? Wat verwacht je bij een klein verschil (255 tegenover 200), en wat bij een groot verschil (255 tegenover 0)?
3. In [Hoe werkt lijnvolgen?](./hoe_werkt.md) heb je dit al eens beredeneerd. Klopt je antwoord daar nog mee?

<details>
<summary>Tip — ik kom er niet uit</summary>

- Ziet de **linkersensor** de lijn (`black`)? Zet dan `motor_a` (links) bijvoorbeeld op `150` en laat `motor_b` (rechts) op `255`.
- Ziet de **rechtersensor** de lijn? Precies andersom.
- Draait je robot de verkeerde kant op? Dan kloppen de namen niet met de werkelijkheid — check met `motor_a.test()` welke motor echt links zit ([Deel 6](../motoren/deel6_draaien.md)).

</details>

<details>
<summary>Afstellen</summary>

Werkt het, maar niet soepel?

- **Slingert** hij hard heen en weer? Maak het verschil tussen de motoren kleiner (bijvoorbeeld `200` in plaats van `150`).
- **Mist** hij de bocht? Maak het verschil juist groter, tot aan `0` toe.
- Denk aan Deel 6: onder de **180–200** komt een beladen robot vaak niet in beweging — "zachter" kan dus ook "stil" betekenen.

</details>

## Test het

Zet je robot aan het begin van de baan en laat los. Volgt hij de lijn, ook door een bocht? Werkt het aan de kabel, zet je script dan als `main.py` op het bord ([Batterijen](../batterijen/code.md)) en laat hem echt los rijden.

Dit is het moment waarop het hele traject samenkomt: elk deel van je script heb je zelf getypt, en je weet van elke regel waarom hij er staat.

## Opdracht 10.4.b: de kruising

Wat doet je robot als **beide** sensoren tegelijk zwart zien? Dat is meestal een kruising. Voeg zelf een extra `elif` toe en maak een keuze: stoppen, rechtdoor, of een kant op draaien. Er is geen fout antwoord — er is alleen wat jouw robot op jouw baan moet doen.

<details>
<summary>Tip</summary>

Stoppen is het makkelijkst om te zien: allebei de motoren `forward(0)`. Kijk op het scherm of het kruising-geval echt geraakt wordt — flitsen de twee kolommen maar heel even allebei op `black`, dan rijdt je robot er misschien al overheen voordat de loop het ziet.

</details>

## Er gaat iets mis

<details>
<summary>De robot draait bij de lijn juist de verkeerde kant op</summary>

**Oorzaak:** Je code is goed — maar de namen kloppen niet. `motor_a` is bij jou niet links, of `links` is niet de linkersensor.

**Oplossing:** Je hebt beide checks al gedaan: [Opdracht 5.5.a](../analoog_ir/deel4_twee_sensoren.md) voor de sensoren en [Deel 6](../motoren/deel6_draaien.md) voor de motoren. Doe ze allebei opnieuw en verwissel wat niet klopt. **Zelf vinden:** houd de robot in je hand en dek de linkersensor af. Kijk op het scherm welke kolom omklapt, en voel welke motor zachter gaat draaien — dan zie je meteen welke van de twee verwisseld is.

</details>

<details>
<summary>Hij rijdt de bocht uit alsof er geen lijn is</summary>

**Oorzaak:** De `elif`-takken worden nooit waar: de drempel klopt niet meer, of de loop is te traag omdat de `sleep` nog op `0.2` staat.

**Oplossing:** Controleer op het scherm dat de sensoren echt `black` zeggen boven de lijn, en dat je `sleep(0.01)` uit Deel 7 hebt overgenomen.

</details>

---

← [Deel 7 — Rechtdoor rijden](./deel7_rechtdoor.md) · **Volgende:** [de afstandssensor](../afstand/doel.md) →
