---
sidebar_position: 0
title: Git in VS Code
---

# Git in VS Code

In [Git basis](/git/basis/) heb je de werkmap, staging en commits leren kennen in de simulator, en in [GitHub: account en repo](/git/github/) staat je online repository klaar. Nu ga je op je eigen computer werken, in VS Code.

## Voorbereiding

Zorg dat je het volgende hebt:

- **VS Code** geïnstalleerd (zie [Installatie VS Code](/installatie-vscode/))
- **Git** geïnstalleerd op je computer

Heb je git nog niet?

### Windows

1. Ga naar [https://git-scm.com/download/win](https://git-scm.com/download/win)
2. De download start automatisch
3. Open het `.exe`-bestand en klik door de installatie — de standaard instellingen zijn prima
4. Herstart VS Code als die al open stond

### macOS

Open de terminal en typ:

```bash
git --version
```

Als git niet aanwezig is, vraagt macOS om het te installeren. Volg de stappen.

### Linux

Git zit meestal al op je systeem. Controleer het met:

```bash
git --version
```

Krijg je een foutmelding, installeer git dan met de pakketbeheerder van je distributie:

```bash
sudo apt install git      # Ubuntu, Debian, Linux Mint
sudo dnf install git      # Fedora
sudo pacman -S git        # Arch, Manjaro
```

## Aan de slag

Begin met **[Stap 1: vertel git wie je bent](./stap-1-config)**.
