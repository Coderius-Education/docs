---
sidebar_position: 2
hide_table_of_contents: true
sidebar_label: 'Thonny'
sidebar_custom_props:
  level: beginner
---

# Thonny

## Stap 1: Thonny installeren
Volg deze stappen om Thonny te installeren:
- Ga naar [thonny.org](https://thonny.org/).
- Kies je besturingssysteem (waarschijnlijk Windows) en download het bestand dat begint met "Installer with 64-bit Python ...".
- Installeer het programma en open het.


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

Als er een zwarte bal verschijnt, dan is de installatie gelukt!

## Stap 3: En beginnen maar!
Je kan nu beginnen [met het lesmateriaal](../vormen/je_eerste_programma.mdx).