import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';
import { EERSTE_LES } from '../components/LinuxTerminal/commandos';

// De cheatsheet liep achter op de lessen: whoami, sort, chmod 600 en
// journalctl -f ontbraken, sudo stond onder thema 4 terwijl 6.1 het leert,
// en het label (ps, kill, top) noemde pgrep en pkill niet. Deze test eist:
// - dezelfde thema's als de sidebar, in dezelfde volgorde;
// - elk commando uit de lessen (commandos.js) op de cheatsheet, voor het
//   eerst onder het thema van de les die het uitlegt;
// - elk commando in een codeblok staat in het label van dat item of van een
//   eerder item, zodat de zoeker het vindt.

const CHEATSHEET = fileURLToPath(new URL('../../docs/cheatsheet.mdx', import.meta.url));

/** Commando's die alleen als voorbeeld in een les staan, met de reden. */
const NIET_OP_CHEATSHEET: Record<string, string> = {
  sleep: 'alleen een proces om te stoppen in 6.3',
};

type Categorie = { type: 'category'; label: string; items: string[] };
const themas = (sidebars.linuxSidebar as unknown as (string | Categorie)[]).filter(
  (i): i is Categorie => typeof i !== 'string',
);
const themaVan = new Map(
  themas.flatMap((t) => t.items.map((id) => [id, t.label.replace(/^\d+\.\s*/, '')] as const)),
);

type Item = { thema: string; label: string[]; code: string[] };

function items(): Item[] {
  const tekst = readFileSync(CHEATSHEET, 'utf8');
  const uit: Item[] = [];
  let thema = '';
  for (const deel of tekst.split(/^(## .+)$/m)) {
    if (deel.startsWith('## ')) {
      thema = deel.slice(3).trim();
      continue;
    }
    for (const m of deel.matchAll(/<details>\s*<summary>(.*?)<\/summary>([\s\S]*?)<\/details>/g)) {
      const label = (m[1].match(/\(([^()]+)\)\s*$/)?.[1] ?? '')
        .split(',')
        .map((w) => w.trim().split(/\s+/)[0]);
      const code = [...m[2].matchAll(/```(?:bash|powershell)\n([\s\S]*?)```/g)].flatMap((b) =>
        b[1]
          .split('\n')
          .flatMap((r) => r.split(/;|&&|\||\|\|/))
          .flatMap((stuk) => {
            const w = stuk.trim().split(/\s+/);
            return w[0] === 'sudo' ? ['sudo', w[1] ?? ''] : [w[0]];
          })
          .filter((c) => c && Object.hasOwn(EERSTE_LES, c)),
      );
      uit.push({ thema, label, code });
    }
  }
  return uit;
}

describe('de cheatsheet', () => {
  it('heeft de thema’s van de sidebar, in dezelfde volgorde', () => {
    const koppen = [...readFileSync(CHEATSHEET, 'utf8').matchAll(/^## (.+)$/gm)].map((m) => m[1]);
    expect(koppen).toEqual(themas.map((t) => t.label.replace(/^\d+\.\s*/, '')));
  });

  it('elk commando uit de lessen staat erop, onder het thema van zijn eerste les', () => {
    const lijst = items();
    const fout: string[] = [];
    for (const [c, { pagina }] of Object.entries(EERSTE_LES)) {
      if (c in NIET_OP_CHEATSHEET) continue;
      const eerste = lijst.find((i) => i.label.includes(c) || i.code.includes(c));
      if (!eerste) fout.push(`${c}: staat er niet op`);
      else if (eerste.thema !== themaVan.get(pagina))
        fout.push(`${c}: onder ${eerste.thema}, hoort bij ${themaVan.get(pagina)}`);
    }
    expect(fout).toEqual([]);
  });

  it('elk commando in een blok staat in het label, of in dat van een eerder item', () => {
    const lijst = items();
    const fout: string[] = [];
    const gezien = new Set<string>();
    for (const i of lijst) {
      for (const l of i.label) gezien.add(l);
      for (const c of i.code) if (!gezien.has(c)) fout.push(`${c} in "${i.label.join(', ')}"`);
    }
    expect(fout).toEqual([]);
  });
});
