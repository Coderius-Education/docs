---
sidebar_position: 3
sidebar_label: "Stap 3: PR bekijken"
title: "Stap 3: de pull request bekijken"
---

# Stap 3: de pull request bekijken

De PR-pagina op GitHub heeft drie tabbladen. Klik ze een voor een aan:

- **Conversation** op GitHub: alle commentaren bij deze PR, met de status (open, gemerged, gesloten). Helemaal onderaan laat je een nieuwe opmerking achter, bijvoorbeeld een vraag die je later wilt aanpakken.
- **Commits** op GitHub: alle commits die in deze PR zitten. Klik op een commit om te zien wat erin veranderd is.
- **Files changed** op GitHub: het belangrijkste van de drie. Je ziet de **diff**: links de oude versie, rechts de nieuwe (of in één kolom met `+` en `-`-regels). Groen is toegevoegd, rood is verwijderd.

## Commentaar op een regel

Dit doe je op GitHub onder **Files changed**.

1. Zweef met je muis over een regel in de diff
2. Er verschijnt een blauw **`+`**-icoon links van de regel
3. Klik erop: er opent een tekstveld
4. Typ je commentaar en klik **Add single comment** (of **Start a review** als je meer comments wil bundelen)

## Wat je nu ziet

Onder **Files changed** staat `hello.txt` met één groene regel: je afscheidsregel. Bovenaan staat `1 changed file` met `+1 −0` ernaast: één toegevoegde regel, geen weggehaalde.

Dit is *de* manier waarop teams code reviewen. Ook voor jezelf is het waardevol om hier kritisch naar je eigen diff te kijken: zie ik nog typo's? Heb ik commentaar laten staan? Vergat ik een bestand?
