---
sidebar_position: 2
sidebar_label: "Stap 2: PowerShell"
title: "Stap 2: PowerShell openen vanuit je map"
---

# Stap 2: PowerShell openen vanuit je map

**PowerShell** is de terminal van Windows: een venster waarin je commando's typt in plaats van klikt. Het maakt uit vanuit welke map je hem opent, want alles wat je typt gebeurt in díé map. Open hem daarom vanuit je projectmap, niet vanuit het startmenu.

1. Zorg dat je in de Verkenner in je projectmap staat
2. Klik in de adresbalk bovenin, zodat het pad geselecteerd wordt
3. Typ `powershell` over het pad heen en druk op Enter

Werkt dat niet, dan kan het ook met de rechtermuisknop in de map: kies **Open in Terminal** op Windows 11, of **Open PowerShell window here** op Windows 10.

## Wat je nu ziet

Een venster met een prompt die eindigt op het pad van je map, gevolgd door een `>`:

```
PS C:\Users\jij\Documenten\python-project>
```

Staat daar een ander pad, dan heb je PowerShell vanuit de verkeerde map geopend. Sluit het venster en begin opnieuw bij stap 1 hierboven.

<details>
<summary>Op een Mac of Linux</summary>

Daar heet het de Terminal. In Finder klik je met de rechtermuisknop op de map en kies je **Diensten** → **Nieuwe terminal bij map**. Staat die optie er niet, open dan de Terminal en typ `cd`, een spatie, en sleep de map het venster in; druk daarna op Enter.

</details>
