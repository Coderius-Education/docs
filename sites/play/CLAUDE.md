# Project-specifieke conventies (play)

Algemene schrijfstijl, didactiek en schrijfskills staan in `../CLAUDE.md` (en de daarin geïmporteerde documenten in `../org-handbook/`).

- **`play-docs` is de stijl-referentie** voor alle andere `*-docs` projecten — wijzigingen aan voorbeelden, opdracht-format of cheatsheet hier zijn richtinggevend.
- **Interne links altijd controleren** dat ze bestaan vóór commit.
- **Opdracht-nummering** strikt volgens `H.S.letter` (sectie 2.1 begint met 2.1.a, dan 2.1.b, doortellend over de hele sectie).
- **MDX-pagina's** met runnable code voorzien van `<TryButton code={`…`} />` direct ná het Markdown-codeblok (identieke code, niet een variant).
- **Cheatsheet** in `cheatsheet.md` of `cheatsheet.mdx` met `<details><summary>vraag (functie_naam)</summary>`-blokken, gegroepeerd onder H2-thema's.
- **API-wijzigingen die uitstralen vanuit `../play/`**: update beide repos in dezelfde wijzigingsronde.
