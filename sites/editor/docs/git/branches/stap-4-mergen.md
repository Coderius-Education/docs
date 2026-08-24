---
sidebar_position: 4
sidebar_label: "Stap 4: mergen"
title: "Stap 4: branches samenvoegen (merge)"
---

# Stap 4: branches samenvoegen (merge)

Je feature werkt en je wil hem in `main` hebben. Dat heet **mergen**.

## Wissel eerst naar de doel-branch

Mergen werkt zo: je staat op de branch die de nieuwe commits moet **ontvangen**, en je geeft aan welke branch ze **levert**.

1. Klik linksonder op `feature/welkomsbericht` → kies **main**

Je staat nu op `main`.

## Voer de merge uit

1. Ga naar **Source Control** (Ctrl+Shift+G)
2. Klik op de **`...`** rechtsboven in het Source Control-paneel
3. Kies **Branch** → **Merge Branch...**
4. Kies **feature/welkomsbericht** uit de lijst

## Wat je nu ziet

VS Code voegt de commits van je feature-branch samen met `main`. Open `hello.txt`: je welkomsbericht staat erin, terwijl linksonder `main` staat. Beide branches wijzen nu naar dezelfde commit.

**Wat gebeurde er onder de motorkap?**

```bash
git merge feature/welkomsbericht
```

## En als er een conflict is?

Als je dezelfde regel op `main` én op de feature-branch hebt aangepast, weet git niet welke versie het moet kiezen. Dat heet een **merge conflict**. Je merge stopt halverwege en git zet allebei de versies in je bestand, met streepjes ertussen.

In deze tutorial werkte je alleen op de feature-branch, dus je hebt er geen gekregen. Wil je weten hoe het eruitziet voordat je het een keer onverwacht tegenkomt, maak er dan zelf een.

<details>
<summary>Zelf een conflict maken en oplossen</summary>

Dit duurt vijf minuten en is de enige manier om te weten hoe het voelt.

1. Zorg dat je op `main` staat. Open `hello.txt` en verander de eerste regel in `Hallo vanaf main.` Sla op, stage en commit met de boodschap `regel van main`.
2. Wissel naar `feature/welkomsbericht`. Verander diezelfde eerste regel in `Hallo vanaf de feature.` Sla op, stage en commit met `regel van de feature`.
3. Wissel terug naar `main` en merge de feature-branch, net als hierboven.

Nu klapt het. VS Code meldt bovenin dat er een conflict is, en `hello.txt` ziet er zo uit:

```
<<<<<<< HEAD
Hallo vanaf main.
=======
Hallo vanaf de feature.
>>>>>>> feature/welkomsbericht
```

Lees dat als een keuzemenu. Boven de streep staat wat er op je huidige branch stond (`HEAD`, dus `main`), onder de streep wat de andere branch meebrengt.

VS Code zet vier kleine knoppen boven het blok:

| Knop | Wat je overhoudt |
|:---|:---|
| **Accept Current Change** | alleen de regel van `main` |
| **Accept Incoming Change** | alleen de regel van de feature-branch |
| **Accept Both Changes** | allebei de regels, onder elkaar |
| **Compare Changes** | de twee versies naast elkaar, om te kiezen |

4. Klik er een aan, of typ zelf iets anders in dat blok — je mag ook een derde versie schrijven die geen van beide is.
5. Controleer dat `<<<<<<<`, `=======` en `>>>>>>>` weg zijn. Blijft er één staan, dan komt hij letterlijk in je commit.
6. Stage `hello.txt` en commit. De boodschap staat al voorgevuld met `Merge branch 'feature/welkomsbericht'` — die mag je zo laten.

Klaar. Een conflict is geen fout van jou: het is git die weigert te gokken.

**Vastgelopen halverwege?** Je kunt de merge altijd afbreken en doen alsof er niets gebeurd is:

```bash
git merge --abort
```

</details>
