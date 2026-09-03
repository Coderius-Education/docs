import { describe, expect, it } from 'vitest';
import { RUNNER_META } from '../runners/registry';
import { buildDoc } from '../runners/web/buildDoc';
import { BUILTIN_TEMPLATES } from './templates';

// De startprojecten zijn het eerste wat een leerling in de editor ziet. Een
// template waarvan het startbestand niet in files zit, of die naar een
// onbekende runner wijst, geeft een lege editor zonder foutmelding.

describe('BUILTIN_TEMPLATES', () => {
  it('hebben unieke ids', () => {
    const ids = BUILTIN_TEMPLATES.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it.each(BUILTIN_TEMPLATES.map((t) => [t.id, t] as const))(
    '%s heeft zijn startbestand en een bekende runner',
    (_id, template) => {
      expect(template.files).toHaveProperty(template.entry);
      expect(RUNNER_META).toHaveProperty(template.runnerId);
    },
  );

  it("het web-startproject rendert met ge-inline'de stylesheet en script", () => {
    const web = BUILTIN_TEMPLATES.find((t) => t.runnerId === 'web');
    expect(web).toBeDefined();
    if (!web) return;
    const doc = buildDoc(web.files, web.entry, 't');
    expect(doc).not.toContain('<link');
    expect(doc).not.toContain('src="script.js"');
    expect(doc).toContain('<style>');
    expect(doc).toContain('try {');
  });
});
