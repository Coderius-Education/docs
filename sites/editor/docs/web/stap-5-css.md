---
sidebar_position: 5
title: "Stap 5: CSS toevoegen"
hide_table_of_contents: true
---

# Stap 5: CSS toevoegen

Met CSS kun je het uiterlijk van je website aanpassen (kleuren, lettertype, afstanden, etc.).

1. Maak een nieuw bestand aan: klik rechts in de Explorer → **New File...** → noem het `style.css`
2. Typ het volgende:

```css
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 20px;
    background-color: #f0f0f0;
}

h1 {
    color: #333;
}

p {
    color: #666;
}
```

3. Sla het bestand op
4. Open `index.html` en voeg de volgende regel toe in de `<head>`, onder de `<title>`:

```html
<link rel="stylesheet" href="style.css">
```

5. Sla `index.html` op — je ziet de veranderingen direct in de browser
