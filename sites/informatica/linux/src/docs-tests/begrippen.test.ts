import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { leesBegrippen, markeer } from '@coderius/shared/begrippen';
import { compile } from '@mdx-js/mdx';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';
import { EERSTE_LES } from '../components/LinuxTerminal/commandos';

// De tooltips van de begrippen (src/begrippen.json) volgen dezelfde regel als
// de lessen (volgorde.test.ts): geen commando vóór de les die het uitlegt. De
// uitleg van "systemd" noemt `systemctl`; stond die tooltip in een les vóór
// 6.4, dan zag de leerling het commando daar al.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const BESTAND = fileURLToPath(new URL('../begrippen.json', import.meta.url));
const { begrippen } = leesBegrippen(JSON.parse(readFileSync(BESTAND, 'utf8')), BESTAND);

type Categorie = { type: 'category'; label: string; items: string[] };
const lessen = (sidebars.linuxSidebar as unknown as (string | Categorie)[])
  .filter((i): i is Categorie => typeof i !== 'string')
  .flatMap((t) => t.items);
const plek = new Map(lessen.map((id, i) => [id, i]));

/** De commando's tussen backticks in een uitleg: het eerste woord. */
const commandosIn = (kort: string) =>
  [...kort.matchAll(/`([^`]+)`/g)]
    .map((m) => m[1].trim().split(/\s+/)[0])
    .filter((c) => Object.hasOwn(EERSTE_LES, c));

describe('de begrippen van de Linux-cursus', () => {
  it('geen tooltip noemt een commando vóór zijn les', async () => {
    const fout: string[] = [];
    for (const les of lessen) {
      let gevonden: string[] = [];
      await compile(readFileSync(`${DOCS}/${les}.mdx`, 'utf8'), {
        remarkPlugins: [
          () => (tree) => {
            gevonden = markeer(tree, begrippen, { docId: les });
          },
        ],
      });
      for (const id of gevonden) {
        const b = begrippen.find((x) => x.id === id);
        for (const c of commandosIn(b?.kort ?? '')) {
          const eerste = EERSTE_LES[c as keyof typeof EERSTE_LES];
          if ((plek.get(eerste.pagina) ?? 0) > (plek.get(les) ?? 0)) {
            fout.push(`${les}: tooltip ${id} noemt ${c}, uit ${eerste.les}`);
          }
        }
      }
    }
    expect(fout).toEqual([]);
  });
});
