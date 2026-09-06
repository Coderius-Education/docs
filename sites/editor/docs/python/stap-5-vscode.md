---
sidebar_position: 5
sidebar_label: "Stap 5: VS Code openen"
title: "Stap 5: je project openen in VS Code"
---

# Stap 5: je project openen in VS Code

Je hoeft VS Code niet te starten en daarna je map op te zoeken. Vanuit PowerShell open je hem meteen op de goede plek. Staat dat venster niet meer open, open het dan opnieuw vanuit je projectmap zoals in [stap 2](./stap-2-powershell). De punt in het commando betekent "de map waar ik nu ben".

```bash
code .
```

De eerste keer vraagt VS Code of je de makers van deze map vertrouwt (Workspace Trust). Het is je eigen map, dus kies **Yes, I trust the authors**.

Installeer daarna de Python-extensie, anders herkent VS Code je virtual environment niet:

1. Klik in de linkerbalk op het blokjes-icoon (Extensions)
2. Typ bovenaan in het zoekveld `Python`
3. Kies het resultaat met de naam **Python** en de uitgever **Microsoft**; dat staat meestal bovenaan
4. Klik op **Install**

## Wat je nu ziet

VS Code opent met je projectmap. In de Explorer links staat de naam van je map bovenaan, en daaronder staat `.venv` — de omgeving uit de vorige stap. VS Code kiest die vanaf nu automatisch voor dit project.

Zegt PowerShell `code : The term 'code' is not recognized`, dan is VS Code geïnstalleerd zonder het vakje **Add to PATH**. Installeer VS Code opnieuw en vink het deze keer aan: [Installatie VS Code](/installatie-vscode/).

<details>
<summary>Op een Mac of Linux</summary>

Het commando `code` bestaat daar pas nadat je het zelf hebt toegevoegd. Open VS Code, klik op **View** → **Command Palette...**, typ `Shell Command: Install 'code' command in PATH` en klik erop. Daarna werkt `code .` ook in je Terminal.

</details>
