import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { join, relative } from 'node:path';
import { compile } from '@mdx-js/mdx';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { leesBegrippen, markeer, slaOver } from './begrippen';
import { SITES, siteDir } from './sites';

const require = createRequire(import.meta.url);
const plugin = require('./plugins/begrippen');
const ROOT = join(__dirname, '..', '..');

const begrippen = leesBegrippen({
  begrippen: [
    { id: 'pipe', term: 'pipe', vormen: ['pipe', 'pipes'], kort: 'Het teken |.', les: 'zoeken' },
    { id: 'pad', term: 'pad', vormen: ['pad', 'paden'], kort: 'De weg naar een bestand.' },
    {
      id: 'absoluut-pad',
      term: 'absoluut pad',
      vormen: ['absoluut pad', 'absolute pad'],
      kort: 'Een pad vanaf de root.',
    },
    { id: 'shell', term: 'shell', kort: 'Het programma dat leest wat je typt.' },
  ],
}).begrippen;

type Knoop = {
  type: string;
  name?: string;
  value?: string;
  attributes?: { value: string }[];
  children?: Knoop[];
};

/** De pagina als tekst, met elk begrip als [id:tekst]. */
function alsTekst(node: Knoop): string {
  if (node.type === 'mdxJsxTextElement' && node.name === 'Begrip') {
    return `[${node.attributes?.[0].value}:${node.children?.map(alsTekst).join('')}]`;
  }
  if (node.type === 'text' || node.type === 'inlineCode') return node.value ?? '';
  return (node.children ?? []).map(alsTekst).join(node.type === 'root' ? '\n' : '');
}

async function markeerMdx(bron: string, docId = 'les') {
  let uit = '';
  let gevonden: string[] = [];
  await compile(bron, {
    remarkPlugins: [
      () => (tree: Knoop) => {
        gevonden = markeer(tree, begrippen, { docId });
        uit = alsTekst(tree);
      },
    ],
  });
  return { uit, gevonden };
}

describe('markeer: een tooltip op het eerste voorkomen', () => {
  it('markeert elk begrip één keer per pagina, in lopende tekst', async () => {
    const { uit, gevonden } = await markeerMdx(
      'Een pipe geeft door. Nog een pipe.\n\nDe shell en de Pipes.',
    );
    expect(uit).toBe('Een [pipe:pipe] geeft door. Nog een pipe.\nDe [shell:shell] en de Pipes.');
    expect(gevonden).toEqual(['pipe', 'shell']);
  });

  it('neemt de langste vorm, en een vorm alleen als heel woord', async () => {
    const { uit } = await markeerMdx('Een absoluut pad is ook een pad. Het padje en de shells.');
    // "pad" binnen "absoluut pad" telt al als het begrip absoluut-pad; het
    // losse "pad" erna krijgt zijn eigen tooltip. Padje en shells niet.
    expect(uit).toBe(
      'Een [absoluut-pad:absoluut pad] is ook een [pad:pad]. Het padje en de shells.',
    );
  });

  it('slaat code, koppen, links en componenten over, maar niet een uitklapblok', async () => {
    const { uit } = await markeerMdx(
      [
        '# De pipe',
        '',
        'Typ `ls | wc` met een [pipe](https://example.com).',
        '',
        '```bash\necho pipe\n```',
        '',
        '<Terminal>de pipe</Terminal>',
        '',
        '<details>',
        '<summary>Waarom een pipe?</summary>',
        '',
        'Omdat de pipe doorgeeft.',
        '',
        '</details>',
      ].join('\n'),
    );
    // Alleen de lestekst in het uitklapblok krijgt hem, niet de kop, de code,
    // de link, de component of de summary.
    expect(uit.match(/\[pipe:/g)).toHaveLength(1);
    expect(uit).toContain('Omdat de [pipe:pipe] doorgeeft.');
  });

  it('niet in cursief: daar staat de Engelse voluit-vorm', async () => {
    // Bij ssh: "via **ssh** (*secure shell*)" gaf een tooltip op shell.
    const { uit } = await markeerMdx('Via ssh (*secure shell*) log je in. De shell leest.');
    expect(uit).toBe('Via ssh (secure shell) log je in. De [shell:shell] leest.');
  });

  it('niet in een tabel: daar viel het kadertje half weg', () => {
    // Zoals remark-gfm een tabel maakt (die draait in Docusaurus vóór deze stap).
    const cel = (tekst: string) => ({
      type: 'tableCell',
      children: [{ type: 'text', value: tekst }],
    });
    const tree = {
      type: 'root',
      children: [
        { type: 'table', children: [{ type: 'tableRow', children: [cel('een pipe')] }] },
        { type: 'paragraph', children: [{ type: 'text', value: 'Een pipe.' }] },
      ],
    };
    expect(markeer(tree, begrippen)).toEqual(['pipe']);
    expect(alsTekst(tree as Knoop)).toBe('een pipe\nEen [pipe:pipe].');
  });

  it('niet op de les die het begrip zelf uitlegt', async () => {
    const { gevonden } = await markeerMdx('Een pipe en een shell.', 'zoeken');
    expect(gevonden).toEqual(['shell']);
  });

  it('een begrip zonder les ook als de pagina geen doc-id heeft', async () => {
    // undefined === undefined: zonder doc-id viel elk begrip zonder les weg.
    const tree = {
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Een pad.' }] }],
    };
    expect(markeer(tree, begrippen)).toEqual(['pad']);
  });

  it('een hele map overslaan kan met een id op /', () => {
    expect(slaOver('unplugged/boom', ['cheatsheet', 'unplugged/'])).toBe(true);
    expect(slaOver('cheatsheet', ['cheatsheet', 'unplugged/'])).toBe(true);
    expect(slaOver('terminal/zoeken', ['cheatsheet', 'unplugged/'])).toBe(false);
  });

  it('wat eruit komt, compileert als MDX met een component Begrip', async () => {
    const js = String(
      await compile('Een pipe.', {
        remarkPlugins: [() => (tree: Knoop) => void markeer(tree, begrippen, {})],
      }),
    );
    expect(js).toMatch(/Begrip/);
  });
});

describe('leesBegrippen', () => {
  it('meldt elke fout in één keer, met het bestand erbij', () => {
    let melding = '';
    try {
      leesBegrippen(
        {
          begrippen: [
            { id: 'Pipe', term: 'pipe', kort: 'Het teken.' },
            { id: 'a', term: 'a', kort: 'zonder punt' },
            { id: 'a', term: 'b', kort: 'Dubbel.' },
            { id: 'c', term: 'c', vormen: ['pipe'], kort: 'Zelfde vorm.' },
            { id: 'd', term: 'd', kort: 'Anker.', anker: 'x' },
            { id: 'e', term: 'e', kort: 'Onbekend.', uitleg: 'x' },
          ],
          extra: 1,
        },
        'linux/src/begrippen.json',
      );
    } catch (err) {
      melding = (err as Error).message;
    }
    expect(melding).toContain('linux/src/begrippen.json');
    expect(melding).toContain('begrip Pipe: id in kleine letters');
    expect(melding).toContain('begrip a: kort is een hele zin');
    expect(melding).toContain('begrip a: staat er twee keer');
    expect(melding).toContain("begrip c: de vorm 'pipe' is ook van Pipe");
    expect(melding).toContain('begrip d: een anker zonder les');
    expect(melding).toContain("begrip e: onbekend veld 'uitleg'");
    expect(melding).toContain("onbekend veld 'extra'");
  });

  it('slaat de woordenlijst zelf over: daar staat de uitleg al', () => {
    const { overslaan } = leesBegrippen({ woordenlijst: 'begrippen', begrippen: [] });
    expect(slaOver('begrippen', overslaan)).toBe(true);
  });

  it('zonder vormen is de term de enige vorm', () => {
    expect(begrippen.find((b) => b.id === 'shell')?.vormen).toEqual(['shell']);
  });
});

describe('de plugin', () => {
  let map = '';
  afterEach(() => {
    if (map) rmSync(map, { recursive: true, force: true });
    map = '';
    vi.restoreAllMocks();
  });

  it('zoekt titel en adres van de les op, en stopt bij een les die niet bestaat', () => {
    const gelezen = leesBegrippen({
      begrippen: [
        { id: 'pipe', term: 'pipe', kort: 'Het teken.', les: 'zoeken', anker: 'de-pipe' },
        { id: 'arg', term: 'argument', kort: 'Wat erachter staat.' },
      ],
    });
    const docs = [{ id: 'zoeken', title: '3.1 Zoeken', permalink: '/linux/docs/zoeken' }];
    expect(plugin.koppelLessen(gelezen, docs)).toEqual({
      begrippen: [
        { id: 'arg', term: 'argument', kort: 'Wat erachter staat.' },
        {
          id: 'pipe',
          term: 'pipe',
          kort: 'Het teken.',
          les: { titel: '3.1 Zoeken', pad: '/linux/docs/zoeken#de-pipe' },
        },
      ],
      woordenlijst: null,
    });
    expect(() => plugin.koppelLessen(gelezen, [])).toThrow(
      "begrip pipe: les 'zoeken' bestaat niet",
    );
    const metLijst = { ...gelezen, woordenlijst: 'begrippen' };
    expect(() => plugin.koppelLessen(metLijst, docs)).toThrow(
      "woordenlijst: les 'begrippen' bestaat niet",
    );
    const lijst = { id: 'begrippen', title: 'Begrippen', permalink: '/linux/docs/begrippen' };
    expect(plugin.koppelLessen(metLijst, [...docs, lijst]).woordenlijst).toBe(
      '/linux/docs/begrippen',
    );
  });

  it('zet de begrippen in de globale data, en de remark-stap kent het doc-id', async () => {
    map = mkdtempSync(join(tmpdir(), 'begrippen-'));
    mkdirSync(join(map, 'src'));
    writeFileSync(
      join(map, 'src', 'begrippen.json'),
      JSON.stringify({
        overslaan: ['cheatsheet'],
        begrippen: [{ id: 'pipe', term: 'pipe', kort: 'Het teken.', les: 'terminal/zoeken' }],
      }),
    );
    const p = plugin({ siteDir: map });
    let data: { begrippen: unknown[]; woordenlijst: string | null } = {
      begrippen: [],
      woordenlijst: null,
    };
    await p.allContentLoaded({
      allContent: {
        'docusaurus-plugin-content-docs': {
          default: {
            loadedVersions: [
              {
                docs: [
                  { id: 'terminal/zoeken', title: '3.1', permalink: '/x/docs/terminal/zoeken' },
                ],
              },
            ],
          },
        },
      },
      actions: {
        setGlobalData: (d: typeof data) => {
          data = d;
        },
      },
    });
    expect(data.begrippen).toHaveLength(1);

    const remark = plugin.remarkBegrippen({
      bestand: join(map, 'src', 'begrippen.json'),
      docsDir: join(map, 'docs'),
    });
    const boom = () => ({
      type: 'root',
      children: [{ type: 'paragraph', children: [{ type: 'text', value: 'Een pipe.' }] }],
    });
    const op = (pad: string) => {
      const tree = boom();
      remark(tree, { path: join(map, 'docs', pad) });
      return alsTekst(tree as Knoop);
    };
    expect(op('wsl/ssh.mdx')).toBe('Een [pipe:pipe].');
    // Een .md ook: Docusaurus leest dat als MDX, en een cursus met .md-lessen
    // kreeg eerst stil geen enkele tooltip. De eigen les en de cheatsheet niet.
    expect(op('wsl/ssh.md')).toBe('Een [pipe:pipe].');
    expect(op('terminal/zoeken.mdx')).toBe('Een pipe.');
    expect(op('terminal/zoeken.md')).toBe('Een pipe.');
    expect(op('cheatsheet.mdx')).toBe('Een pipe.');

    writeFileSync(join(map, 'src', 'begrippen.json'), '{"begrippen": [{"id": "x"}]}');
    expect(() => plugin({ siteDir: map })).toThrow(/term ontbreekt/);
  });

  it('createConfig zet plugin en remark-stap alleen bij een site met begrippen', () => {
    const { createConfig } = require('./config');
    type Config = {
      plugins: unknown[];
      presets: [string, { docs?: { remarkPlugins?: unknown[][] } }][];
    };
    const remark = (config: Config) =>
      (config.presets[0][1].docs?.remarkPlugins ?? []).filter(
        (r) => r[0] === plugin.remarkBegrippen,
      );
    const preset = [['classic', { docs: { path: 'docs' } }]];

    vi.spyOn(process, 'cwd').mockReturnValue(join(ROOT, siteDir('linux')));
    const linux: Config = createConfig({ siteId: 'linux', presets: preset });
    expect(linux.plugins).toContain(plugin);
    expect(remark(linux)).toEqual([
      [
        plugin.remarkBegrippen,
        {
          bestand: join(ROOT, siteDir('linux'), 'src', 'begrippen.json'),
          docsDir: join(ROOT, siteDir('linux'), 'docs'),
        },
      ],
    ]);

    vi.spyOn(process, 'cwd').mockReturnValue(join(ROOT, siteDir('python')));
    const python: Config = createConfig({ siteId: 'python', presets: preset });
    expect(python.plugins).not.toContain(plugin);
    expect(remark(python)).toEqual([]);
  });
});

// Elke cursus met src/begrippen.json: de vorm klopt, de les bestaat en noemt
// het begrip, het anker staat erop, en elk begrip krijgt ergens een tooltip.
// Anders stond een begrip alleen in de woordenlijst, omdat geen vorm in de
// lestekst voorkwam (een meervoud dat ontbrak, een woord dat alleen in code
// staat).
const MET_BEGRIPPEN = SITES.filter((s) =>
  existsSync(join(ROOT, siteDir(s.id), 'src', 'begrippen.json')),
);

/** Het anker van een kop zoals Docusaurus het maakt, of het vaste id. */
function anker(kop: string): string {
  const vast = /\\?\{#([\w-]+)\}\s*$/.exec(kop);
  if (vast) return vast[1];
  return kop
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s_-]/gu, '')
    .replace(/\s/g, '-');
}

function mdxBestanden(map: string): string[] {
  return readdirSync(map, { withFileTypes: true }).flatMap((e) =>
    e.isDirectory()
      ? mdxBestanden(join(map, e.name))
      : /\.mdx?$/.test(e.name)
        ? [join(map, e.name)]
        : [],
  );
}

describe.each(MET_BEGRIPPEN.map((s) => s.id))('de begrippen van %s', (id) => {
  const dir = join(ROOT, siteDir(id));
  const bestand = join(dir, 'src', 'begrippen.json');
  const gelezen = leesBegrippen(JSON.parse(readFileSync(bestand, 'utf8')), bestand);
  const docs = join(dir, 'docs');
  const lesTekst = (les: string) => readFileSync(join(docs, `${les}.mdx`), 'utf8');

  it('elke les bestaat, noemt het begrip en heeft het anker', () => {
    const fout: string[] = [];
    for (const b of gelezen.begrippen) {
      if (!b.les) continue;
      if (!existsSync(join(docs, `${b.les}.mdx`))) {
        fout.push(`${b.id}: geen les ${b.les}`);
        continue;
      }
      const tekst = lesTekst(b.les);
      if (!b.vormen.some((v) => tekst.toLowerCase().includes(v.toLowerCase()))) {
        fout.push(`${b.id}: ${b.les} noemt het niet`);
      }
      const koppen = [...tekst.matchAll(/^#{2,6} (.+)$/gm)].map((m) => anker(m[1]));
      if (b.anker && !koppen.includes(b.anker))
        fout.push(`${b.id}: geen kop #${b.anker} in ${b.les}`);
    }
    expect(fout).toEqual([]);
  });

  it('elk begrip staat in lestekst, waar de remark-stap het vindt', async () => {
    // Ook in zijn eigen les, waar het geen tooltip krijgt: een begrip als
    // root of localhost staat in de andere lessen alleen als code, en hoort
    // toch in de woordenlijst. Wat hier faalt, heeft een vorm die nergens in
    // gewone tekst staat (een meervoud dat ontbreekt, een typfout).
    const gezien = new Set<string>();
    for (const pad of mdxBestanden(docs)) {
      const docId = relative(docs, pad)
        .split('\\')
        .join('/')
        .replace(/\.mdx?$/, '');
      if (slaOver(docId, gelezen.overslaan)) continue;
      await compile(readFileSync(pad, 'utf8'), {
        remarkPlugins: [
          () => (tree: Knoop) => {
            for (const b of markeer(tree, gelezen.begrippen)) gezien.add(b);
          },
        ],
      });
    }
    expect(gelezen.begrippen.map((b) => b.id).filter((b) => !gezien.has(b))).toEqual([]);
  });
});
