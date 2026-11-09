// Waar elke naam vandaan komt die een leerling in deze cursus importeert. De
// lessen gebruiken de vorm van iedereen die met FastAPI werkt
// (`from fastapi import Form`), en daarin liep een leerling vast: in bijna elke
// les groeit de import-regel, en wie één naam mist, krijgt een NameError en
// een server die niet start. Deze tabel is de ene bron voor drie dingen: de
// tabel op de cheatsheet en bij Er gaat iets mis (cheatsheet.test.ts en
// imports.test.ts eisen dat ze gelijk zijn), de nakijker die een gebruikte
// naam zonder import meldt (samenhang.ts), en de test die eist dat elke les de
// import-regel toont waar hij verandert.

export const IMPORT_VAN: Record<string, string> = {
  FastAPI: 'fastapi',
  Form: 'fastapi',
  Request: 'fastapi',
  Response: 'fastapi',
  HTTPException: 'fastapi',
  Cookie: 'fastapi',
  HTMLResponse: 'fastapi.responses',
  FileResponse: 'fastapi.responses',
  RedirectResponse: 'fastapi.responses',
  JSONResponse: 'fastapi.responses',
  StaticFiles: 'fastapi.staticfiles',
  Jinja2Templates: 'fastapi.templating',
  SqliteDict: 'sqlitedict',
  escape: 'html',
};

/** De regel die een leerling bovenaan zet voor één naam. */
export const importRegel = (naam: string) => `from ${IMPORT_VAN[naam]} import ${naam}`;

/**
 * Python-code zonder strings en commentaar, met behoud van posities: een
 * `Form` in een HTML-string of een `# HTMLResponse` telt niet als gebruik.
 */
export function zonderStringsEnCommentaar(code: string): string {
  return code.replace(
    /("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*'|#[^\n]*)/g,
    (m) => m.replace(/[^\n]/g, ' '),
  );
}

/** Welke namen een stuk Python importeert, uit welke module. */
export function geimporteerd(code: string): Map<string, string> {
  const namen = new Map<string, string>();
  // Eerst commentaar weg en een regel met \ aan het eind aan de volgende
  // vast: `from fastapi import FastAPI, Form  # Form erbij` gaf eerst de
  // melding dat FastAPI en Form niet geïmporteerd waren.
  const zonder = code.replace(/#[^\n]*/g, '').replace(/\\[ \t]*\n/g, ' ');
  const schoon = zonder.replace(/\(\s*([\w\s,]+?)\s*\)/g, (_, binnen: string) =>
    binnen.replace(/\s+/g, ' '),
  );
  for (const m of schoon.matchAll(/^\s*from ([\w.]+) import ([\w ,\t]+?)[ \t]*$/gm))
    for (const deel of m[2].split(',')) {
      const [naam, , alias] = deel.trim().split(/\s+/);
      if (naam) namen.set(alias ?? naam, m[1]);
    }
  return namen;
}

/**
 * De namen uit de tabel die de code gebruikt, met de index van het eerste
 * gebruik. `fastapi.Form` of `x.escape` is geen gebruik van de kale naam.
 */
export function gebruikt(code: string): Map<string, number> {
  const schoon = zonderStringsEnCommentaar(code)
    .split('\n')
    .map((regel) => (/^\s*(from|import)\s/.test(regel) ? ' '.repeat(regel.length) : regel))
    .join('\n');
  const uit = new Map<string, number>();
  for (const naam of Object.keys(IMPORT_VAN)) {
    const m = new RegExp(`(?<![\\w.])${naam}\\b`).exec(schoon);
    if (m) uit.set(naam, m.index);
  }
  return uit;
}
