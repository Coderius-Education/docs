---
sidebar_position: 2
sidebar_label: 'Thonny'
sidebar_custom_props:
  level: beginner
---

# Thonny

## Stap 1: Thonny installeren
Volg deze stappen om Thonny te installeren:

1. Had je Thonny 4 al? Verwijder die dan eerst, via **Instellingen** → **Apps**. Thonny 5 kan anders een foutmelding geven bij het opstarten.
2. Ga naar [thonny.org](https://thonny.org/).
3. Download bij **Windows** het bestand dat eindigt op **-x64.exe**, bijvoorbeeld `thonny-5.0.0-x64.exe`. Neem dat bestand ook als je laptop een Arm-processor heeft, zoals een Snapdragon: niet elk onderdeel van coderius-play bestaat voor Arm. Op een Mac neem je het bestand dat eindigt op **-arm64.pkg** (een Mac met een Apple-chip, M1 of nieuwer) of **-x64.pkg** (een oudere Mac met Intel).
4. Installeer het programma en open het.

Thonny 5 werkt op Windows 10 en 11, en heeft Python al ingebouwd. Python apart installeren hoeft niet.


## Stap 2: coderius-play installeren

Klik bovenaan op `Tools` en daarna op `Open system shell`

![system shell](@site/static/img/thonny_system_shell.png)


Kopieer het volgende commando in het zwarte scherm dat zich net geopend heeft:


```bash
pip install --upgrade coderius-play
```

Mocht je meldingen krijgen zoals `Toegang geweigerd` kan het helpen om `--user` toe te voegen:
```bash
pip install --upgrade --user coderius-play
```
Je gaat een hele lap tekst zien verschijnen. Dat is ok, want de software wordt nu geïnstalleerd.

Als je geen tekst meer ziet verschijnen, is waarschijnlijk de installatie gelukt.
We kunnen dit controleren door eerst het zwarte venter weg te klikken (klik op kruisje rechtsboven) en terug te gaan naar Thonny.

Kopieer de onderstaande code in je editor:
```python
import play

play.new_circle()
```

Klik op de groene knop (`Run current script`) om de code te draaien

![run](@site/static/img/thonny_run_current_script.png)

Als er een zwarte bal verschijnt, dan is de installatie gelukt.

## Stap 3: En beginnen maar
Je kan nu beginnen [met het lesmateriaal](site:play/docs/vormen/je_eerste_programma).