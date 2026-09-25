import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Bij het herontwerp van de werkbalk verdween .barButton uit de CSS, terwijl
// de Annuleren-knop van de sjabloonkiezer hem nog gebruikte. Een CSS-module
// geeft voor een onbekende klasse gewoon undefined, dus niets faalde: de knop
// stond er ongestyled bij, grijs en systeemstandaard. Deze test legt elke
// `styles.x` naast de CSS-module die het bestand importeert.

const MAP = fileURLToPath(new URL('.', import.meta.url));

function componenten(map: string, uit: string[] = []): string[] {
  for (const e of readdirSync(map, { withFileTypes: true })) {
    const pad = join(map, e.name);
    if (e.isDirectory()) componenten(pad, uit);
    else if (e.name.endsWith('.tsx')) uit.push(pad);
  }
  return uit;
}

describe('elke gebruikte CSS-klasse bestaat', () => {
  const bestanden = componenten(MAP).filter((pad) =>
    readFileSync(pad, 'utf8').includes("from './styles.module.css'"),
  );

  it('vindt de componenten', () => {
    expect(bestanden.length).toBeGreaterThan(3);
  });

  it.each(bestanden.map((pad) => [pad.slice(MAP.length)]))('%s', (rel) => {
    const pad = join(MAP, rel);
    const bron = readFileSync(pad, 'utf8');
    const css = readFileSync(join(pad, '..', 'styles.module.css'), 'utf8');
    const gedefinieerd = new Set([...css.matchAll(/\.([A-Za-z_][\w-]*)/g)].map((m) => m[1]));
    const gebruikt = new Set(
      [...bron.matchAll(/(?<![\w/.])styles(?:\.(\w+)|\[['"`](\w+)['"`]\])/g)].map(
        (m) => m[1] ?? m[2],
      ),
    );
    const ontbreekt = [...gebruikt].filter((k) => !gedefinieerd.has(k));

    expect(ontbreekt).toEqual([]);
  });
});
