import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { maakEditorLink } from '../../components/WebMicroEditor/codeLink';

// De build van robotica meldde ~90 broken anchors van de vorm
// /editor#code=…: geen kapotte navigatie, want #code= is de code zelf, maar
// ruis waarin een écht kapot anker verdween. De links slaan de controle nu
// over, en de site breekt op elk ander kapot anker.

const bron = (pad: string) => readFileSync(fileURLToPath(new URL(pad, import.meta.url)), 'utf8');

describe('"Open in de editor"-links', () => {
  it('gaan naar de editor-pagina met de code in de hash', () => {
    expect(maakEditorLink('print(1)')).toMatch(/^\/editor#code=/);
    expect(
      ['tsx', 'jsx', 'js', 'md', 'mdx'].some((ext) =>
        existsSync(fileURLToPath(new URL(`../../pages/editor.${ext}`, import.meta.url))),
      ),
    ).toBe(true);
  });

  it('staan met het codeblok in één element', () => {
    // Naast een vraag of een lijst (LesVoorbeeld) is elk kind een kolom. Als
    // fragment gaf het codeblok er twee: de link nam de tweede kolom in en de
    // vraag viel onder de code (gezien in Code beter begrijpen, 1280 breed).
    const tsx = bron('./index.tsx');
    expect(tsx).not.toMatch(/<>\s*<OriginalCodeBlock/);
    expect(tsx).toMatch(/<div className=\{styles\.metLink\}>\s*<OriginalCodeBlock/);
  });

  it('slaan de ankercontrole over, en de site breekt op een echt kapot anker', () => {
    expect(bron('./index.tsx')).toContain('data-noBrokenLinkCheck');
    expect(bron('../../../docusaurus.config.ts')).toMatch(/onBrokenAnchors: 'throw'/);
  });
});
