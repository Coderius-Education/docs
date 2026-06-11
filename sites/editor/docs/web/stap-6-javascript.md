---
sidebar_position: 6
title: "Stap 6: JavaScript toevoegen"
hide_table_of_contents: true
---

# Stap 6: JavaScript toevoegen

Met JavaScript kun je je website interactief maken.

1. Maak een nieuw bestand aan: klik rechts in de Explorer → **New File...** → noem het `script.js`
2. Typ het volgende:

```javascript
let knop = document.getElementById("mijnKnop");

knop.addEventListener("click", function() {
    alert("Je hebt op de knop geklikt!");
});
```

3. Sla het bestand op
4. Open `index.html` en voeg een knop toe in de `<body>`:

```html
<button id="mijnKnop">Klik hier</button>
```

5. Voeg het script toe net voor de sluitende `</body>` tag:

```html
<script src="script.js"></script>
```

6. Sla `index.html` op en klik op de knop in je browser
