---
sidebar_position: 3
hide_table_of_contents: true
sidebar_label: 'VS Code'
sidebar_custom_props:
  level: expert
---

# VS Code

:::caution
**Belangrijk:** Gaaf dat je VS Code wilt gebruiken! Het kan wel uitdagend zijn vanwege de integratie van Python, een werkende virtuele omgeving en de terminal configuratie. Mocht je de installatie van VS code niet zo fijn vinden, dan kun je altijd Thonny proberen.
:::

## Visual Studio Code installeren
Ga naar [editor.coderius.nl/python](https://editor.coderius.nl/python) en volg de instructies om VS Code te installeren.

:::info
**Let op:** Zorg ervoor dat Python 3.10 geïnstalleerd is op je computer. Dit is nodig om `coderius-play` te kunnen gebruiken.
:::

## coderius-play installeren.
- Klik bovenaan op `Terminal`
- Klik op `New terminal`

Onderaan Visual Studio Code opent een terminal.


Dan gaan we nu `coderius-play` installeren. Kopieer het volgende commando en plak het in de terminal:

```bash
python -m pip install --upgrade coderius-play
```

Mocht dit niet werken, probeer dan:

```bash
py -m pip install --upgrade coderius-play
```

Mocht je meldingen krijgen zoals `Toegang geweigerd` kan het helpen om `--user` toe te voegen:
```bash
pip install --upgrade --user coderius-play
```


## Testen of het gelukt is
Kopieer het volgende codefragment naar VS code en voer het uit.
Het hoofdstuk `Executing Python file options` kan hierbij nuttig zijn.

```python
import play

play.new_circle()
```
Als een zwarte bal verschijnt, dan ben je klaar voor [de volgende stap](../vormen/je_eerste_programma.mdx).
