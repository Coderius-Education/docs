import { readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { ROUTES } from '../lib/routes';

// De sitemap is een handgeschreven lijst. Wat hier stil misgaat: een nieuwe
// route (zoals /docent/examenprogramma) die wel gebouwd wordt maar niet in de
// sitemap staat, of een route in de sitemap die geen pagina meer heeft.

const ROUTES_DIR = fileURLToPath(new URL('.', import.meta.url));

function paginas(dir: string): string[] {
  const uit: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) uit.push(...paginas(join(dir, entry.name)));
    else if (entry.name === '+page.svelte') {
      const pad = relative(ROUTES_DIR, dir).split('\\').join('/');
      uit.push(pad === '' ? '/' : `/${pad}`);
    }
  }
  return uit;
}

describe('de sitemap', () => {
  it('bevat precies de routes die een +page.svelte hebben', () => {
    expect([...ROUTES].sort()).toEqual(paginas(ROUTES_DIR).sort());
  });
});
