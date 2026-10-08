import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// Bevindingen uit de leerling-doorloop van de hele FastAPI-route (oktober
// 2026), elk nagedraaid, met hier de regel die voorkomt dat ze terugkomen.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const les = (id: string) => readFileSync(`${DOCS}/FastAPI/${id}.mdx`, 'utf8');
const opdracht = (tekst: string, n: number) =>
  tekst.split(new RegExp(`\\n### Opdracht ${n}:`))[1]?.split(/\n### |\n## /)[0] ?? '';
const hoofdtekst = (tekst: string) =>
  tekst.split(/\n## Opdrachten\n/)[0].replace(/<details>[\s\S]*?<\/details>/g, '');

type Categorie = { type: 'category'; label: string; items: string[] };

describe('leerling-doorloop van de FastAPI-route', () => {
  it('de startpagina noemt waar de basis eindigt, met de categorie uit de sidebar', () => {
    // Er stond "De eerste vier stappen zijn de basis", maar de routekaart
    // toonde tien basiscategorieën.
    const items = sidebars.apiSidebar as unknown as (string | Categorie)[];
    const categorieen = items.filter((i): i is Categorie => typeof i !== 'string');
    const grens = categorieen.findIndex((c) => c.label.startsWith('Uitbreiding:'));
    const route = les('index').split('\n## De route\n')[1]?.split('\n## ')[0] ?? '';
    expect(route).toContain(`tot en met ${categorieen[grens - 1].label}`);
    expect(route).not.toMatch(/eerste \w+ stappen/);
  });

  it('path-parameters noemt alleen pagina’s die in de stand van Links staan', () => {
    // "/contact" ontstaat alleen in een Make-opdracht van Links, en die mag je
    // overslaan.
    expect(hoofdtekst(les('veel-paginas/path-parameters'))).not.toContain('/contact');
  });

  it('wie de opdrachten van de eerste SqliteDict-les maakt, zet Jan en 16 terug', () => {
    // Bekijken en Zoeken beloven Jan en 16; opdracht 2 zette 17 en opdracht 3
    // liet Piet staan.
    const database = les('sqlitedict/database');
    expect(opdracht(database, 2)).toMatch(/terug op `16`/);
    expect(opdracht(database, 3)).toMatch(/terug op `"Jan"`/);
  });

  it('Aanpassen laat eerst voorspellen, en geeft daarna pas ophalen, aanpassen, terugzetten', () => {
    const tekst = les('sqlitedict/aanpassen');
    expect(tekst.indexOf('Voorspel')).toBeGreaterThan(-1);
    expect(tekst.indexOf('Voorspel')).toBeLessThan(tekst.indexOf('db["sara"] = sara'));
  });

  it('Nog niets? laat het lege bestand weggooien vóór het terug hernoemen', () => {
    // Een naam die al bestaat weigeren VS Code en de Verkenner.
    const testen = les('berichten-tonen/leeg').split('\n## Testen\n')[1] ?? '';
    expect(testen.indexOf('gooi die weg')).toBeGreaterThan(-1);
    expect(testen.indexOf('gooi die weg')).toBeLessThan(
      testen.indexOf('terug naar `gastenboek.db`'),
    );
  });

  it('geen opdracht in de basis verraadt met een 404 welke namen een account hebben', () => {
    // Inloggen legt in opdracht 3 uit waarom één melding veiliger is; opdracht
    // 4 bouwde daarna een 404 op `naam not in gebruikers`.
    for (const id of ['accounts/registreren', 'accounts/inloggen']) {
      expect(les(id), id).not.toMatch(
        /not in gebruikers:\s*\n\s*raise HTTPException\(status_code=404/,
      );
    }
  });

  it('wie een tabel moet maken, krijgt de tags erbij', () => {
    expect(opdracht(les('berichten-tonen/lijst_tonen'), 5).split('<details>')[0]).toMatch(
      /<tr>.*<th>.*<td>/s,
    );
  });

  it('Sessies beschrijft wat je ziet zonder commit: weer het inlogformulier', () => {
    const blok =
      les('onthouden/sessies').split(':::danger[Gaat er iets mis?]')[1]?.split(':::')[0] ?? '';
    expect(blok).toContain('weer het inlogformulier');
    expect(blok).toContain('sessies.commit()');
  });

  it('een antwoord na Sessies gebruikt geen sleutel die in het project niet bestaat', () => {
    // Laat het zien opdracht 5 gaf db[sleutel] = …, terwijl POST /gastenboek
    // sinds Cookies db[f"bericht_{time.time_ns()}"] gebruikt: overnemen gaf een
    // NameError en een 500.
    const blokken = [...les('afronden/laat-het-zien').matchAll(/```python\n([\s\S]*?)```/g)].map(
      (m) => m[1],
    );
    for (const b of blokken) {
      if (b.includes('db[sleutel] =')) expect(b, b).toMatch(/sleutel = /);
    }
  });

  it('elke opdracht behalve Run heeft een antwoord, zoals de startpagina belooft', () => {
    // De startpagina beloofde "bij elke opdracht een tip en een antwoord";
    // Run-opdrachten hebben vaak geen antwoord, want daar zie je het zelf.
    const items = sidebars.apiSidebar as unknown as (string | Categorie)[];
    const ids = items.flatMap((i) => (typeof i === 'string' ? [i] : i.items));
    const fout = ids.flatMap((id) => {
      const deel = readFileSync(`${DOCS}/${id}.mdx`, 'utf8').split('\n## Opdrachten\n')[1] ?? '';
      return deel
        .split(/\n(?=### Opdracht )/)
        .filter(
          (b) => /^### Opdracht \d+: (?!Run)/.test(b) && !b.includes('<summary>Antwoord</summary>'),
        )
        .map((b) => `${id}: ${b.split('\n')[0]}`);
    });
    expect(fout).toEqual([]);
    expect(les('index')).toContain('Bij Run zie je zelf of het');
  });
});
