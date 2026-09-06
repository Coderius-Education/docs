---
sidebar_position: 2
title: "Stap 2: installatie"
---

# Stap 2: installatie

## Windows

De installatie spreekt de taal van je Windows. Hieronder staan de Engelse knoppen, met de Nederlandse ernaast.

1. Open het gedownloade `.exe`-bestand
2. Accepteer de licentieovereenkomst en klik op **Next** (**Volgende**)
3. Op de pagina **Select Additional Tasks** staan vinkjes. Zet deze drie aan:
   - **Add "Open with Code" action to Windows Explorer file context menu** — rechtsklikken op een bestand en het openen in VS Code
   - **Add "Open with Code" action to Windows Explorer directory context menu** — rechtsklikken op een map en die openen in VS Code
   - **Add to PATH** — VS Code openen vanuit de terminal met het commando `code`. Dit vinkje staat meestal al aan. Laat het aan staan: de Python-tutorial opent je project met `code .`, en zonder dit vinkje bestaat dat commando niet.
4. Klik op **Install** (**Installeren**) en wacht tot de installatie klaar is
5. Klik op **Finish** (**Voltooien**). VS Code opent vanzelf.

## macOS

1. Dubbelklik op het gedownloade `.zip`-bestand. Er verschijnt een bestand **Visual Studio Code** (met het app-icoon) in je Downloads-map.
2. Sleep dat bestand naar je map **Applications** (**Programma's**). Laat je het in Downloads staan, dan werken updates niet goed.
3. Open VS Code vanuit Applications. De eerste keer vraagt macOS of je een app van internet wilt openen: klik op **Open**.

## Linux

Kies op de downloadpagina het pakket voor jouw distributie: `.deb` voor Ubuntu en Debian, `.rpm` voor Fedora. Dubbelklik op het gedownloade bestand en installeer het via de softwarewinkel van je systeem, of typ in een terminal (Ubuntu):

```bash
sudo apt install ./code_*.deb
```
