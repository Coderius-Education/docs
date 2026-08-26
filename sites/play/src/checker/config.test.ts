import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeLevelSummary } from '@coderius/checker/levelSummary';
import { analyze } from '@coderius/checker/matchConcepts';
import type { ProjectFiles } from '@coderius/checker/types';
import { validateCheckerConfig } from '@coderius/checker/validateConfig';
import { describe, expect, it } from 'vitest';
import { playConfig } from './config';

// De play-nakijker is afgeleid van de hoofdstukken zelf, en dat is hier ook de
// belangrijkste controle: elk concept moet ergens in de lesstof voorkomen.
// Vindt een regex nergens in de hele cursus iets, dan kijkt hij naar iets wat
// deze cursus niet leert — en dan kan een leerling het ook nooit aanvinken.

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));

function bestanden(entries: Record<string, string | null>): ProjectFiles {
  return Object.fromEntries(
    Object.entries(entries).map(([path, content]) => [
      path,
      {
        path,
        kind: playConfig.classify(path),
        content,
        sizeBytes: content?.length ?? 0,
        tooLarge: false,
      },
    ]),
  );
}

/** Alle Python uit de lessen: de speeltuin-blokken plus de kale codeblokken. */
function alleLescode(): string {
  const stukken: string[] = [];
  const loop = (map: string) => {
    for (const naam of readdirSync(map)) {
      const pad = join(map, naam);
      if (statSync(pad).isDirectory()) loop(pad);
      else if (/\.mdx?$/.test(naam)) {
        const tekst = readFileSync(pad, 'utf8');
        for (const m of tekst.matchAll(/<PygbagRunner code=\{`([\s\S]*?)`\}/g)) stukken.push(m[1]);
        for (const m of tekst.matchAll(/```python[^\n]*\n([\s\S]*?)```/g)) stukken.push(m[1]);
      }
    }
  };
  loop(DOCS);
  return stukken.join('\n');
}

const LESCODE = alleLescode();

describe('play-nakijker', () => {
  it('is een geldige checker-configuratie', () => {
    expect(validateCheckerConfig(playConfig)).toEqual([]);
  });

  it('heeft unieke concept-ids', () => {
    const ids = playConfig.concepts.map((c) => c.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('koppelt elk concept aan een bestaand onderwerp', () => {
    const onderwerpen = new Set(playConfig.subjects.map((s) => s.id));
    const fout = playConfig.concepts.filter((c) => !onderwerpen.has(c.subject)).map((c) => c.id);
    expect(fout).toEqual([]);
  });

  it('noemt zijn groepen naar de hoofdstukken van de cursus', () => {
    const groepen = [...new Set(playConfig.concepts.map((c) => c.group))];
    expect(groepen).toContain('1 Vormen');
    expect(groepen).toContain('9 Levels');
    expect(groepen).toContain('10 Pygame-ce');
  });

  it('zoekt alleen naar dingen die de cursus ook echt leert', () => {
    const nergens = playConfig.concepts
      .filter((c) => c.detect.type === 'regex')
      .filter((c) => {
        const bron = (c.detect as { pattern: RegExp }).pattern;
        const patroon = new RegExp(bron.source, bron.flags);
        return !patroon.test(LESCODE);
      })
      .map((c) => `${c.id} (${c.label})`);
    expect(nergens).toEqual([]);
  });

  it('herkent een eenvoudig eerste programma als basis', () => {
    const rapport = analyze(
      bestanden({
        'main.py': 'import play\n\ncirkel = play.new_circle(color="red")\ncirkel.x = 100\n',
      }),
      playConfig,
    );
    const gevonden = new Set(rapport.concepts.filter((m) => m.used).map((m) => m.id));
    expect(gevonden).toContain('play-circle');
    expect(gevonden).toContain('play-vorm-aanpassen');
    expect(gevonden).not.toContain('play-button');
  });

  it('herkent een project met levels, UI en geluid als gevorderd', () => {
    const code = [
      'import play',
      '',
      'levels = [{"snelheid": 100}, {"snelheid": 200}]',
      'vormen = []',
      'geluid = play.new_sound("klik.mp3")',
      'knop = play.new_button(text="Start")',
      '',
      'def bouw_level():',
      '    for vorm in vormen:',
      '        vorm.remove()',
      '',
      '@knop.when_clicked',
      'def geklikt():',
      '    geluid.play()',
      '',
    ].join('\n');
    const rapport = analyze(bestanden({ 'spel.py': code, 'klik.mp3': null }), playConfig);
    const gevonden = new Set(rapport.concepts.filter((m) => m.used).map((m) => m.id));
    for (const id of [
      'play-level-instellingen',
      'play-level-opruimen',
      'play-level-bouwen',
      'play-button',
      'play-sound',
      'play-sound-bestand',
      'py-for',
    ]) {
      expect(gevonden, id).toContain(id);
    }
  });

  it('telt de niveaus zonder te struikelen over een leeg project', () => {
    const leeg = computeLevelSummary(analyze(bestanden({}), playConfig), playConfig);
    expect(leeg).toBeTruthy();
  });

  it('herkent de bestandssoorten die een play-project oplevert', () => {
    expect(playConfig.classify('spel.py')).toBe('py');
    expect(playConfig.classify('database.json')).toBe('json');
    expect(playConfig.classify('platform.jpg')).toBe('image');
    expect(playConfig.classify('klik.mp3')).toBe('audio');
    expect(playConfig.classify('intro.mp4')).toBe('video');
    expect(playConfig.classify('leesmij.txt')).toBe('other');
  });

  it('biedt in accept precies de extensies aan die classify kent', () => {
    // Loopt dit uiteen, dan verschijnt een bestand uit een zip wel in het
    // overzicht terwijl je datzelfde bestand niet los kunt kiezen.
    for (const ext of ['.py', '.json', '.png', '.jpg', '.mp3', '.wav', '.ogg', '.mp4']) {
      expect(playConfig.accept, ext).toContain(ext);
    }
  });
});
