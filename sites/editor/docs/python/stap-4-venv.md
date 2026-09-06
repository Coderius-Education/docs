---
sidebar_position: 4
sidebar_label: "Stap 4: virtual environment"
title: "Stap 4: een virtual environment aanmaken"
---

# Stap 4: een virtual environment aanmaken

Een **virtual environment** (venv) is een afgesloten omgeving voor dit ene project. Packages die je erin installeert komen niet in de weg van je andere projecten, en andersom. Elk project krijgt zijn eigen omgeving.

Typ in PowerShell (open die zoals in [stap 2](./stap-2-powershell) als je hem gesloten hebt), in je projectmap:

```bash
python -m venv .venv
```

Het commando zegt niets terug en duurt een paar seconden.

## Wat je nu ziet

In de Verkenner staat er een map `.venv` in je projectmap. Daar zit de losse kopie van Python die alleen bij dit project hoort; je hoeft er nooit iets in te veranderen.

Verschijnt die map niet, kijk dan of het prompt van PowerShell nog op je projectmap staat. Zo niet, dan is de map ergens anders terechtgekomen.

**Let op:** de omgeving bestaat nu wel, maar is nog niet in gebruik. Dat regelt VS Code in de volgende stap.

<details>
<summary>Op een Mac of Linux</summary>

```bash
python3 -m venv .venv
```

Verder gaat het precies hetzelfde.

</details>
