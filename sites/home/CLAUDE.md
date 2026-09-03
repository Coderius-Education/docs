# Project-specifieke conventies (coderius)

Algemene schrijfstijl, didactiek en schrijfskills staan in `../CLAUDE.md` (en de daarin geïmporteerde documenten in `../org-handbook/`).

- **De homepage-kaarten komen uit twee handgeschreven mappings, en die worden getest.** `src/lib/Curriculum.ts` koppelt elke cursus-id uit `packages/shared/sites.js` aan examendomeinen uit `src/lib/ExamProgram.ts`; `Curriculum.test.ts` en `ExamProgram.test.ts` bewaken dat elke id in de registry staat (en omgekeerd: elke cursus uit de registry een kaart heeft), dat elke examencode bestaat, dat codes en keuzedomein-letters uniek zijn en dat de links de registry-URL zijn en geen hardcoded adres. Een onbekende code geeft anders geen fout: `buildCardChips` laat hem stil weg. De drie `TODO(curriculum)`-vragen in Curriculum.ts staan als `it.todo` in de test, zodat ze in de testuitvoer zichtbaar blijven tot de curriculum-eigenaar ze beantwoordt.
