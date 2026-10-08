# Vakpagina's

Eén JSON-bestand per vak (`informatica.json`, `wo.json`), gemaakt in docs-management
(Vakpagina-studio) en via een concept gepubliceerd. Zonder bestand toont het vak de
standaardpagina (`../vakpagina/standaard.ts`). De vorm staat in `../vakpagina/types.ts`;
`../vakpagina/valideer.ts` keurt hem bij de build, en een ongeldig bestand breekt de build.
Afbeeldingen staan in `static/vakpaginas/<vak>/`.
