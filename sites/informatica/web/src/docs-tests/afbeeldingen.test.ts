import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Issue #128: een leerling liep vast op een PNG met nep-doorzichtigheid (het
// geblokte patroon zat in het plaatje), en remove.bg verdwijnt. De les raadt
// nu Iconify aan voor icoontjes. De oefenvelden kunnen geen eigen bestanden
// laden, dus het icoon komt via een adres van de Iconify-API:
// https://api.iconify.design/{set}/{naam}.svg (iconify/documentation,
// pages/api/svg.md).

const LES = readFileSync(
  fileURLToPath(new URL('../../docs/html-css/afbeeldingen.mdx', import.meta.url)),
  'utf8',
);

describe('icoontjes in de les over afbeeldingen', () => {
  // De uitleg over icoontjes is een eigen ###: in een les-tabblad is dat een
  // stap. Eerst was het een tip onder het zoeken van een adres, en samen
  // waren die twee 294 pixels te lang voor één scherm.
  const tip = LES.slice(LES.indexOf('### Een icoontje zoeken'));
  const blok = tip.slice(0, tip.indexOf('\n## '));

  it('het voorbeeldadres hoort bij de naam die de tip noemt', () => {
    const naam = blok.match(/zoals `([a-z0-9-]+):([a-z0-9-]+)`/);
    expect(naam).not.toBeNull();
    const [, set, icoon] = naam as RegExpMatchArray;
    expect(blok).toContain(`src="https://api.iconify.design/${set}/${icoon}.svg"`);
    expect(blok).toContain(`\`${set}/${icoon}.svg\``);
  });

  it('een kleur zonder # in het adres', () => {
    // Een # moet in een adres %23 worden; een kleurnaam heeft dat niet nodig.
    for (const m of blok.matchAll(/\?color=([^`\s"]+)/g)) expect(m[1]).toMatch(/^[a-z]+$/);
  });

  it('Er gaat iets mis legt het geblokte patroon uit', () => {
    const mis = LES.slice(LES.indexOf('## Er gaat iets mis'));
    expect(mis).toMatch(/^### Een geblokt vlak achter je plaatje$/m);
    // De verwijzing naar Iconify wijst naar de kop die het uitlegt.
    expect(LES).toMatch(/^### Een icoontje zoeken$/m);
    expect(mis).toContain('[Iconify](#een-icoontje-zoeken)');
    expect(mis).toMatch(/zitten in het plaatje zelf/);
  });
});
