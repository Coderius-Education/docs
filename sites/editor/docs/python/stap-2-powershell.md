---
sidebar_position: 2
sidebar_label: "Stap 2: PowerShell"
title: "Stap 2: PowerShell openen vanuit je map"
---

# Stap 2: PowerShell openen vanuit je map

**PowerShell** is de terminal van Windows: een venster waarin je commando's typt in plaats van klikt. Het maakt uit vanuit welke map je hem opent, want alles wat je typt gebeurt in díé map. Open hem daarom vanuit je projectmap, niet vanuit het startmenu.

1. Zorg dat je in de Verkenner in je projectmap staat
2. Klik met de rechtermuisknop in het lege deel van het venster
3. Kies **Openen in Terminal**

Op Windows 10 heet die keuze **PowerShell-venster hier openen**, en die verschijnt pas als je de Shift-toets ingedrukt houdt terwijl je rechtsklikt.

## Wat je nu ziet

Een venster met een prompt die eindigt op het pad van je map, gevolgd door een `>`:

```
PS C:\Users\jij\Documenten\python-project>
```

Staat daar een ander pad, dan heb je PowerShell vanuit de verkeerde map geopend. Sluit het venster en begin opnieuw bij stap 1 hierboven.

<details>
<summary>De keuze staat niet in het menu</summary>

Sommige computers hebben dat menu-item niet, bijvoorbeeld omdat de schoolbeheerder het heeft weggehaald. Dan kan het via de adresbalk:

1. Klik in de adresbalk bovenin de Verkenner, zodat het pad geselecteerd wordt
2. Typ `powershell` over het pad heen en druk op Enter

Het resultaat is hetzelfde: een prompt die op je projectmap staat.

</details>

<details>
<summary>Op een Mac of Linux</summary>

Daar heet het de Terminal. In Finder klik je met de rechtermuisknop op de map en kies je **Diensten** → **Nieuwe terminal bij map**. Staat die optie er niet, open dan de Terminal en typ `cd`, een spatie, en sleep de map het venster in; druk daarna op Enter.

</details>
