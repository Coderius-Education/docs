---
sidebar_position: 3
hide_table_of_contents: true
---

# 14.3 Code op de microcontroller zetten

Zonder USB-kabel kan niemand op **Run** drukken. De code moet dus al **op de microcontroller** staan. De truc: een bestand dat **`main.py`** heet wordt automatisch uitgevoerd zodra de microcontroller stroom krijgt.

:::info Samengevat

- Code op je **laptop** opslaan → werkt alleen als je in Thonny op **Run** drukt.
- Code als **`main.py`** op de **microcontroller** opslaan → start automatisch zodra de microcontroller stroom krijgt.

:::

## Stap 1: kies de juiste interpreter

Kijk rechtsonder in Thonny. Daar moet **MicroPython (RP2040)** staan.

<details>
<summary>Hoe selecteer ik de juiste interpreter?</summary>

Klik rechtsonder en kies **MicroPython (RP2040)** uit de lijst. Zie je hem niet? Controleer dan of de microcontroller via USB aangesloten is.

</details>

## Stap 2: check de REPL

Onderin Thonny zie je de **Shell** (REPL). Als de verbinding goed is, zie je zoiets:

```
MicroPython v1.20.0 on 2023-04-26; Arduino Nano RP2040 Connect with RP2040
Type "help()" for more information.
>>>
```

Het belangrijkste is dat je de `>>>`-prompt ziet.

<details>
<summary>Ik zie geen >>> prompt</summary>

- Zit de USB-kabel goed?
- Druk op de **Stop/Restart**-knop in Thonny.
- Check of de juiste interpreter is geselecteerd (Stap 1).

</details>

## Stap 3: maak het bestandsvenster open

1. Klik op **View** → **Files**.
2. Links verschijnen twee lijsten:
   - **Boven**: bestanden op je **laptop**.
   - **Onder**: bestanden op de **microcontroller**.

:::warning Let op

Alleen bestanden met **blokhaken** `[ ]` om de naam in het tabblad staan op de microcontroller. Tabbladen zonder blokhaken zijn bestanden op je laptop.

:::

## Stap 4: maak `main.py` aan

1. Klik met de **rechtermuisknop** in de onderste lijst.
2. Kies **New file...**.
3. Typ als naam: **`main.py`** (exact zo).
4. Klik op **OK**.

Het bestand `[main.py]` opent vanzelf. Hier komt je code te staan.

:::danger Bestandsnaam moet kloppen

Het moet precies **`main.py`** zijn. Niet `Main.py`, niet `main.PY`, niet `mijn_code.py`. Alleen `main.py` wordt automatisch uitgevoerd.

:::

:::warning Vergeet de while-loop niet

Zorg dat je code een `while True:`-loop heeft. Anders voert de microcontroller je code één keer uit en stopt.

:::

## Klaar

Koppel de USB-kabel los, zet de batterijhouder op **ON**, en je robot werkt zelfstandig.

<details>
<summary>Controlevraag</summary>

Wat gebeurt er als je je code als **`programma.py`** opslaat in plaats van **`main.py`**?

</details>

<details>
<summary>Antwoord</summary>

Dan gebeurt er **niets** als de microcontroller op batterijen aangaat. Alleen het bestand `main.py` wordt automatisch gestart.

</details>
