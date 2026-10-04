import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { beschrijving, isLeegProject } from './beschrijving';

describe('WokwiSimulator: wat de kaart belooft', () => {
  it('een leeg project belooft geen kant-en-klaar circuit', () => {
    const tekst = beschrijving('https://wokwi.com/projects/new/arduino-uno');
    expect(tekst).toMatch(/leeg/);
    expect(tekst).not.toMatch(/Simuleer het circuit direct/);
  });

  it('een echt project mag dat wel', () => {
    expect(isLeegProject('https://wokwi.com/projects/322062421191557714')).toBe(false);
    expect(beschrijving('322062421191557714')).toMatch(/Simuleer het circuit direct/);
  });

  it('de component gebruikt de beschrijving', () => {
    const bron = readFileSync(fileURLToPath(new URL('./index.tsx', import.meta.url)), 'utf8');
    expect(bron).toContain('beschrijving(url)');
    expect(bron).not.toContain('Simuleer het circuit direct');
  });

  it('twee lessen delen geen echt project', () => {
    // Een eigen project per les is het doel; dezelfde URL bij twee lessen
    // zou weer een circuit beloven dat bij maar één van de twee hoort.
    const docs = fileURLToPath(new URL('../../../docs/', import.meta.url));
    const lessen = (map: string): string[] =>
      readdirSync(map).flatMap((n) => {
        const p = join(map, n);
        return statSync(p).isDirectory() ? lessen(p) : /\.mdx?$/.test(n) ? [p] : [];
      });
    const urls = lessen(docs).flatMap((p) =>
      [...readFileSync(p, 'utf8').matchAll(/projectUrl="([^"]+)"/g)].map((m) => m[1]),
    );
    expect(urls.length).toBeGreaterThan(0);
    const echt = urls.filter((u) => !isLeegProject(u));
    expect(new Set(echt).size).toBe(echt.length);
  });
});
