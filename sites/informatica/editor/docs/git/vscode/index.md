---
sidebar_position: 0
title: Git in VS Code
---

# Git in VS Code

In [Git basis](site:editor/git/basis) heb je de werkmap, staging en commits leren kennen in de simulator, en in [GitHub: account en repo](site:editor/git/github) staat je online repository klaar. Nu ga je op je eigen computer werken, in VS Code.

## Voorbereiding

Zorg dat je het volgende hebt:

- **VS Code** geïnstalleerd (zie [Installatie VS Code](site:editor/installatie-vscode))
- **Git** geïnstalleerd op je computer

Heb je git nog niet, of weet je het niet zeker? Klik op jouw systeem.

<details>
<summary>Git op Windows</summary>

Open in VS Code een terminal via **Terminal** → **New Terminal** en typ `git --version`. Staat er een versienummer, zoals `git version 2.47.1.windows.1`, dan heb je git al. Zegt de terminal dat hij `git` niet kent, installeer het dan:

1. Ga naar [https://git-scm.com/download/win](https://git-scm.com/download/win); de download start vanzelf
2. Open het `.exe`-bestand en klik door de installatie. De standaardinstellingen zijn prima
3. Herstart VS Code als die al open stond

</details>

<details>
<summary>Git op een Mac</summary>

Open de terminal (in VS Code: **Terminal** → **New Terminal**) en typ:

```bash
git --version
```

Als git niet aanwezig is, vraagt macOS om het te installeren. Volg de stappen.

</details>

<details>
<summary>Git op Linux</summary>

Git zit meestal al op je systeem. Controleer het in een terminal (in VS Code: **Terminal** → **New Terminal**) met:

```bash
git --version
```

Krijg je een foutmelding, installeer git dan met de pakketbeheerder van je distributie:

```bash
sudo apt install git      # Ubuntu, Debian, Linux Mint
sudo dnf install git      # Fedora
sudo pacman -S git        # Arch, Manjaro
```

</details>

Staat alles klaar? Begin met **[Stap 1: vertel git wie je bent](site:editor/git/vscode/stap-1-config)**.
