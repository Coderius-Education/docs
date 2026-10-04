import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// De uitbreiding "onthouden" (cookies en sessies), Afronden en de naslag
// Projectstructuur.
//
// Na de herordening kwamen htmx en JavaScript vóór de cookies, en Afronden
// erna. Toch gaven antwoorden in Cookie of sessie? en Laat het zien een
// compleet endpoint in de stand van de redirect-les: wie het overnam, gooide
// zijn sessie en zijn verwijderknoppen weg. De volgorde-knop draaide de lijst
// de verkeerde kant op, want de database geeft oud → nieuw. Projectstructuur
// liet bestanden verdwijnen en weer verschijnen, en had geen stand voor
// cookies en sessies. Laat het zien noemde `ip addr` voor macOS, waar dat
// commando niet bestaat, en zweeg over de 0.0.0.0 in de terminal.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const les = (id: string) => readFileSync(`${DOCS}/${id}.mdx`, 'utf8');

type Item = string | { type: string; label: string; items: Item[] };
const plat = (items: Item[]): string[] =>
  items.flatMap((i) => (typeof i === 'string' ? [i] : plat(i.items)));
const volgorde = plat(sidebars.apiSidebar as unknown as Item[]);

const pythonBlokken = (tekst: string) =>
  [...tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)].map((m) => m[1]);

// Leest een mappenboom als die in Projectstructuur: elke regel met ├── of └──
// is een map (eindigt op /) of een bestand; vier tekens per niveau.
function paden(boom: string): string[] {
  const stapel: string[] = [];
  const uit: string[] = [];
  for (const regel of boom.split('\n')) {
    const m = regel.match(/^((?:│ {3}| {4})*)[├└]── (\S+)/);
    if (!m) continue;
    const diepte = m[1].length / 4;
    stapel.length = diepte;
    if (m[2].endsWith('/')) stapel.push(m[2]);
    else uit.push(stapel.join('') + m[2]);
  }
  return uit;
}

describe('Projectstructuur', () => {
  const secties = les('FastAPI/projectstructuur')
    .split(/\n(?=## Bij )/)
    .slice(1)
    .map((s) => ({
      kop: s.split('\n')[0],
      paden: paden(s.match(/```\n([\s\S]*?)```/)?.[1] ?? ''),
    }));

  // Een bestand mag alleen verdwijnen als een les het verplaatst.
  const VERPLAATST: Record<string, string> = {
    'static/pages/gastenboek_form.html':
      'wordt templates/gastenboek.html in Onthouden met een cookie',
  };

  it('elke stand is de vorige plus wat erbij komt', () => {
    const kwijt = secties
      .slice(1)
      .flatMap((s, i) =>
        secties[i].paden
          .filter((p) => !s.paden.includes(p) && !VERPLAATST[p])
          .map((p) => `${s.kop}: ${p} is verdwenen`),
      );
    expect(kwijt).toEqual([]);
  });

  it('heeft een stand voor cookies en sessies, met sessies.db en de verhuisde template', () => {
    const stand = secties.find((s) => s.kop.includes('/docs/FastAPI/sessies'));
    expect(stand?.paden).toEqual(
      expect.arrayContaining(['sessies.db', 'templates/gastenboek.html']),
    );
    expect(stand?.paden).not.toContain('static/pages/gastenboek_form.html');
  });
});

describe('antwoorden gaan uit van het project zoals het nu is', () => {
  const naSessies = volgorde.slice(volgorde.indexOf('FastAPI/sessies') + 1);

  it('na de sessies gooit geen blok het gastenboek of de lijst zonder sessie_id opnieuw neer', () => {
    const fout = naSessies.flatMap((id) =>
      pythonBlokken(les(id))
        .filter(
          (b) =>
            /@app\.(post|get)\("\/(gastenboek|berichten)"\)/.test(b) && !b.includes('sessie_id'),
        )
        .map((b) => `${id}: ${b.split('\n')[0]}`),
    );
    expect(fout).toEqual([]);
  });

  it('de sessieles schermt ook het htmx-endpoint voor verwijderen af', () => {
    const tekst = les('FastAPI/sessies');
    expect(tekst).toContain('DELETE /bericht/{sleutel}');
    expect(tekst).toContain('/docs/veiligheid/toegang/elk-endpoint');
  });

  it('de volgorde-knop draait om voor nieuwste eerst: de database geeft oud → nieuw', () => {
    const blok = pythonBlokken(les('FastAPI/cookie-of-sessie')).find((b) =>
      b.includes('reversed('),
    );
    expect(blok).toBeDefined();
    expect(blok).not.toMatch(/if volgorde == "oud"/);
  });

  it('alleen de sessie weggooien geeft geen tweede sessie, maar dezelfde onder het oude id', () => {
    expect(les('FastAPI/cookie-of-sessie')).not.toContain('tweede sessie aan naast de eerste');
  });
});

describe('Laat het zien', () => {
  const tekst = les('FastAPI/laat-het-zien');

  it('`ip addr` staat er nooit zonder een commando voor macOS', () => {
    const zonder = volgorde
      .filter((id) => les(id).includes('ip addr'))
      .filter((id) => !/ipconfig getifaddr|ifconfig/.test(les(id)));
    expect(zonder).toEqual([]);
  });

  it('wie --host 0.0.0.0 start, leest wat de terminal dan toont', () => {
    expect(tekst).toContain('--host 0.0.0.0');
    expect(tekst).toContain('http://0.0.0.0:8000');
  });
});
