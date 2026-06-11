---
sidebar_position: 2
hide_table_of_contents: true
---

# DVWA installeren

**DVWA** staat voor *Damn Vulnerable Web Application*. Het is een webapplicatie die met opzet vol kwetsbaarheden zit, zodat je er veilig op kunt oefenen. Je installeert DVWA op je eigen Kali Linux in WSL.

:::caution
Oefen alleen op je eigen DVWA-installatie. De technieken die je hier leert, mag je nooit toepassen op websites of systemen die niet van jou zijn — dat is strafbaar.
:::

## Stap 1: WSL openen

Zoek op je computer naar **WSL** en open het programma. Je komt direct in de Kali Linux-shell terecht en je zou iets als dit moeten zien:

![Kali Linux-shell in WSL](kali_linux_succes.png)

## Stap 2: Het installatiecommando uitvoeren

Kopieer het volgende commando (let op: het is één lange regel) in je Kali-shell en druk op Enter:

```bash
sudo bash -c "$(curl --fail --show-error --silent --location https://raw.githubusercontent.com/IamCarron/DVWA-Script/main/Install-DVWA.sh)"
```

Tijdens de installatie krijg je een paar vragen. Beantwoord ze zo:

- **`[sudo] password for ...:`** — vul het wachtwoord in dat je bij de installatie van Kali Linux hebt gekozen.
- **`Enter SQL user:`** — druk op Enter (laat leeg).
- **`Enter SQL password (press Enter for no password):`** — druk op Enter (laat leeg).

De installatie geeft veel tekst weer en duurt een paar minuten. Laat 'm rustig zijn werk doen.

## Stap 3: DVWA opstarten

Kijk in de [Cheatsheet](cheatsheet) hoe je DVWA opstart, hoe je inlogt en welke instellingen je na de installatie nog moet doorlopen.
