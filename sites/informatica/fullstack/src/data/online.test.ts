import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// De route Online zetten (docs/online/, eigen sidebar en navbar-link). Hij legt
// geen Linux uit maar linkt naar de Linux-cursus (site linux), en
// zijn lessen bouwen op elkaar: de dienst uit les 5 start wat de voordeur uit
// les 6 en de Caddyfile uit les 9 doorgeven. Deze test bewaakt:
// - de sidebar noemt elke les één keer, in de mappen wsl/ en server/;
// - elke les heeft één controlevraag vóór de opdrachten, een Er gaat iets mis,
//   en bij elke opdracht een antwoord, en linkt aan het eind naar de volgende;
// - de startpagina en de eerste les die Linux nodig heeft, linken naar de
//   Linux-cursus;
// - de dienst luistert op 127.0.0.1, en de poort is overal dezelfde;
// - de firewall laat ssh door vóór hij aangaat;
// - een IP-adres in een les is 127.0.0.1, 0.0.0.0 of een voorbeeldadres uit
//   203.0.113.0/24 (RFC 5737), nooit een echt adres.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const ONLINE = join(DOCS, 'online');

type Categorie = { type: 'category'; label: string; items: string[] };
const route = sidebars.onlineSidebar as unknown as (string | Categorie)[];
const delen = route.filter((i): i is Categorie => typeof i !== 'string');
const lessen = delen.flatMap((c) => c.items);

const bestanden = (map: string): string[] =>
  readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return bestanden(pad);
    return naam.endsWith('.mdx') ? [pad] : [];
  });
const idVan = (pad: string) =>
  relative(DOCS, pad)
    .split('\\')
    .join('/')
    .replace(/\.mdx$/, '');
const lees = (id: string) => readFileSync(join(DOCS, `${id}.mdx`), 'utf8');

describe('de route Online zetten', () => {
  it('de sidebar begint bij de startpagina en noemt elke les één keer', () => {
    expect(route[0]).toBe('online/index');
    expect([...lessen, 'online/index'].sort()).toEqual(bestanden(ONLINE).map(idVan).sort());
    expect(delen.map((d) => d.items.map((id) => id.split('/')[1]))).toEqual([
      lessen.filter((id) => id.startsWith('online/wsl/')).map(() => 'wsl'),
      lessen.filter((id) => id.startsWith('online/server/')).map(() => 'server'),
    ]);
  });

  it('geen les heet zoals zijn map (server/server.mdx kreeg het adres van de map, en vier links braken)', () => {
    const dubbel = lessen.filter((id) => {
      const delen = id.split('/');
      return delen.at(-1) === delen.at(-2);
    });
    expect(dubbel).toEqual([]);
  });

  it('elke les: één controlevraag vóór de opdrachten, Er gaat iets mis, en een antwoord per opdracht', () => {
    const fout: string[] = [];
    for (const id of lessen) {
      const tekst = lees(id);
      const opdrachten = tekst.indexOf('\n## Opdrachten');
      const vragen = [...tekst.matchAll(/<Voorspel soort="Controlevraag"/g)];
      if (vragen.length !== 1 || (vragen[0].index ?? 0) > opdrachten)
        fout.push(`${id}: controlevraag`);
      if (!tekst.includes('\n## Er gaat iets mis\n')) fout.push(`${id}: Er gaat iets mis`);
      const blokken = tekst.slice(opdrachten).split('\n### Opdracht ').slice(1);
      if (blokken.length === 0) fout.push(`${id}: geen opdracht`);
      blokken.forEach((blok, i) => {
        if (!blok.startsWith(`${i + 1}: `))
          fout.push(`${id}: opdracht ${i + 1} heeft een ander nummer`);
        if (!blok.includes('<summary>Antwoord</summary>'))
          fout.push(`${id}: opdracht ${i + 1} zonder antwoord`);
      });
    }
    expect(fout).toEqual([]);
  });

  it('elke les linkt aan het eind naar de volgende, en de laatste naar de controlelijst van Veiligheid', () => {
    const fout: string[] = [];
    lessen.forEach((id, i) => {
      const laatste = lees(id).trim().split('\n').pop() ?? '';
      const doel = lessen[i + 1] ?? 'veiligheid/eigen-project';
      if (!laatste.includes(`(site:fullstack/docs/${doel})`)) fout.push(`${id}: "${laatste}"`);
    });
    expect(fout).toEqual([]);
  });

  it('Linux staat in de Linux-cursus: de startpagina en project-in-linux linken ernaar', () => {
    expect(lees('online/index')).toContain('(site:linux/docs)');
    expect(lees('online/index')).toContain('(site:linux/docs/wsl/installeren)');
    expect(lees('online/wsl/project-in-linux')).toMatch(/site: 'linux', to: '\/docs\//);
  });

  it('de dienst luistert op 127.0.0.1, en de voordeur geeft door aan dezelfde poort', () => {
    const dienst = lees('online/wsl/dienst');
    const exec = dienst.match(/^ExecStart=.* --host (\S+) --port (\d+)$/m);
    expect(exec?.[1]).toBe('127.0.0.1');
    expect(dienst).toMatch(/^User=gastenboek$/m);
    const poort = exec?.[2];
    for (const id of ['online/wsl/voordeur', 'online/server/https']) {
      expect(lees(id), id).toContain(`reverse_proxy 127.0.0.1:${poort}`);
    }
    expect(lees('online/wsl/fastapi-run')).toContain(`--host 127.0.0.1 --port ${poort}`);
  });

  it('de firewall laat ssh door voordat hij aangaat', () => {
    const tekst = lees('online/server/dichtzetten');
    const ssh = tekst.indexOf('sudo ufw allow OpenSSH');
    expect(ssh).toBeGreaterThan(-1);
    expect(ssh).toBeLessThan(tekst.indexOf('sudo ufw enable'));
  });

  it('een IP-adres is 127.0.0.1, 0.0.0.0 of een voorbeeldadres', () => {
    const fout: string[] = [];
    for (const pad of bestanden(ONLINE)) {
      for (const m of readFileSync(pad, 'utf8').matchAll(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g)) {
        if (!/^(127\.0\.0\.1|0\.0\.0\.0|203\.0\.113\.\d+)$/.test(m[0]))
          fout.push(`${idVan(pad)}: ${m[0]}`);
      }
    }
    expect(fout).toEqual([]);
  });
});
