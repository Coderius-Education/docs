---
sidebar_position: 9
sidebar_label: "Stap 9: .gitignore"
title: "Stap 9: een .gitignore aanmaken"
---

# Stap 9: een `.gitignore` aanmaken

Maak in VS Code een nieuw bestand (rechtermuisknop in **Explorer** → **New File...**) en noem het `.gitignore` — met de punt vooraan, en verder niets. Zet erin, op één regel:

```
geheim.txt
```

Sla op. Maak daarna op dezelfde manier een bestand `geheim.txt` met wat tekst erin.

**Maak `.gitignore` in VS Code, niet in Verkenner.** Windows laat je in Verkenner geen bestandsnaam typen die met een punt begint.

## Wat je nu ziet

In **Source Control** staat alleen `.gitignore` als nieuw bestand. `geheim.txt` staat er **niet** bij — git negeert het. In het Explorer-paneel is `geheim.txt` grijs geworden.

Stage `.gitignore` en commit hem: die hoort in je repository, want anders weet niemand anders welke bestanden genegeerd moeten worden.
