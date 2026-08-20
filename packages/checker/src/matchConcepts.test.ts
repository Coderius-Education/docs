import { describe, expect, it } from 'vitest';
import { analyze } from './matchConcepts';
import type { CheckerConfig, Concept, ProjectFile, ProjectFiles } from './types';

function file(path: string, kind: string, content: string | null): ProjectFile {
  return { path, kind, content, sizeBytes: content?.length ?? 0, tooLarge: content === null };
}

function projectFiles(...files: ProjectFile[]): ProjectFiles {
  return Object.fromEntries(files.map((f) => [f.path, f]));
}

function config(concepts: Concept[]): CheckerConfig {
  return {
    subjects: [{ id: 'alles', label: 'Alles' }],
    concepts,
    fileKinds: [
      { id: 'html', label: 'HTML' },
      { id: 'css', label: 'CSS' },
      { id: 'js', label: 'JS' },
    ],
    classify: () => 'html',
    textKinds: ['html', 'css', 'js'],
    accept: '.html',
    teacher: { password: 'x', storageKey: 'x' },
    pdfFilename: () => 'x.pdf',
  };
}

function concept(id: string, detect: Concept['detect']): Concept {
  return { id, subject: 'alles', group: 'Groep', label: id, level: 'basis', detect };
}

const matchOf = (report: ReturnType<typeof analyze>, id: string) =>
  report.concepts.find((c) => c.id === id);

describe('analyze — regex-concepten', () => {
  it('telt voorkomens op over meerdere bestanden van hetzelfde soort', () => {
    const files = projectFiles(
      file('a.css', 'css', 'p { color: red; }'),
      file('b.css', 'css', 'h1 { color: blue; }\na { color: green; }'),
    );
    const report = analyze(
      files,
      config([concept('kleur', { type: 'regex', pattern: /color\s*:/g })]),
    );

    expect(matchOf(report, 'kleur')).toEqual({ id: 'kleur', count: 3, used: true });
  });

  it('beperkt de detectie tot de soorten in detect.in', () => {
    const files = projectFiles(
      file('style.css', 'css', 'div { color: red; }'),
      file('script.js', 'js', 'const kleur = 1;'),
    );
    const cfg = config([
      concept('alleen-js', { type: 'regex', pattern: /color/g, in: ['js'] }),
      concept('alleen-css', { type: 'regex', pattern: /color/g, in: ['css'] }),
    ]);
    const report = analyze(files, cfg);

    expect(matchOf(report, 'alleen-js')?.used).toBe(false);
    expect(matchOf(report, 'alleen-css')?.used).toBe(true);
  });

  it('negeert bestanden zonder inhoud (te groot ingelezen)', () => {
    const files = projectFiles(file('groot.css', 'css', null));
    const report = analyze(files, config([concept('kleur', { type: 'regex', pattern: /color/g })]));

    expect(matchOf(report, 'kleur')?.used).toBe(false);
    expect(report.fileStats.skippedTooLarge).toBe(1);
  });

  it('negeert bestandssoorten die niet als tekst zijn aangemerkt', () => {
    const files = projectFiles(file('logo.png', 'image', 'data:image/png;base64,color'));
    const report = analyze(files, config([concept('kleur', { type: 'regex', pattern: /color/g })]));

    expect(matchOf(report, 'kleur')?.used).toBe(false);
  });
});

describe('analyze — pad-concepten', () => {
  it('herkent een pad ook als een eerder pad niet matcht', () => {
    // Bewaakt de withoutGlobal()-guard: met een /g-patroon onthoudt RegExp zijn
    // lastIndex tussen test()-aanroepen, waardoor de tweede aanroep zou missen.
    const files = projectFiles(
      file('README.md', 'other', null),
      file('src/main.py', 'other', null),
    );
    const cfg = config([concept('main', { type: 'path', pattern: /(^|\/)main\.py$/g })]);
    const report = analyze(files, cfg);

    expect(matchOf(report, 'main')).toEqual({ id: 'main', count: 1, used: true });
  });

  it('geeft count 0 als geen enkel pad matcht', () => {
    const files = projectFiles(file('index.html', 'html', '<h1>Hoi</h1>'));
    const cfg = config([concept('main', { type: 'path', pattern: /(^|\/)main\.py$/g })]);

    expect(matchOf(analyze(files, cfg), 'main')).toEqual({ id: 'main', count: 0, used: false });
  });
});

describe('analyze — bestandsoverzicht en waarschuwingen', () => {
  it('telt bestanden per soort, ook een soort die niet in fileKinds staat', () => {
    const files = projectFiles(
      file('index.html', 'html', '<h1>Hoi</h1>'),
      file('style.css', 'css', 'p{}'),
      file('raar.xyz', 'onbekend', null),
    );
    const report = analyze(files, config([]));

    expect(report.fileStats.total).toBe(3);
    expect(report.fileStats.byKind.html).toBe(1);
    expect(report.fileStats.byKind.js).toBe(0);
    expect(report.fileStats.byKind.onbekend).toBe(1);
  });

  it('waarschuwt als er geen leesbare codebestanden zijn', () => {
    const report = analyze(projectFiles(file('foto.png', 'image', null)), config([]));

    expect(report.warnings).toHaveLength(1);
    expect(report.warnings[0]).toContain('Geen leesbare codebestanden');
  });

  it('waarschuwt niet zodra er één leesbaar codebestand is', () => {
    const report = analyze(projectFiles(file('index.html', 'html', '<h1>Hoi</h1>')), config([]));

    expect(report.warnings).toEqual([]);
  });
});
