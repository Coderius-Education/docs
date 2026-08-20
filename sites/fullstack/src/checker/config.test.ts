import { analyze } from '@coderius/checker/matchConcepts';
import type { ProjectFiles } from '@coderius/checker/types';
import { validateCheckerConfig } from '@coderius/checker/validateConfig';
import { describe, expect, it } from 'vitest';
import { fullstackConfig } from './config';

function files(entries: Record<string, string | null>): ProjectFiles {
  return Object.fromEntries(
    Object.entries(entries).map(([path, content]) => [
      path,
      {
        path,
        kind: fullstackConfig.classify(path),
        content,
        sizeBytes: content?.length ?? 0,
        tooLarge: false,
      },
    ]),
  );
}

describe('fullstackConfig', () => {
  it('bevat geen fouten die stil verkeerd zouden scoren', () => {
    expect(validateCheckerConfig(fullstackConfig)).toEqual([]);
  });

  it('herkent de mappenstructuur aan de paden', () => {
    // Fullstack en godot zijn de enige sites met pad-detectie; zonder deze test
    // is dat hele codepad in analyze() ongedekt.
    const report = analyze(
      files({
        'main.py': 'from fastapi import FastAPI',
        'static/style.css': 'body { color: red; }',
        'templates/index.html': '<h1>Hoi</h1>',
      }),
      fullstackConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('struct-main')).toBe(true);
    expect(perId.get('struct-static')).toBe(true);
    expect(perId.get('struct-templates')).toBe(true);
  });

  it('vindt de mappen niet als ze er niet zijn', () => {
    const report = analyze(files({ 'app.py': 'print("hoi")' }), fullstackConfig);
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('struct-main')).toBe(false);
    expect(perId.get('struct-static')).toBe(false);
    expect(perId.get('struct-templates')).toBe(false);
  });

  // De lessen 13-15 (lijst tonen, redirect, detailpagina + 404) leveren code op
  // die hiervoor nergens in de cursus voorkwam. Zonder deze test zou de
  // nakijker een project dat die lessen wél heeft gedaan niet van een project
  // zonder onderscheiden.
  it('herkent doorsturen, path-parameters en 404', () => {
    const report = analyze(
      files({
        'main.py': [
          'from fastapi import FastAPI, HTTPException',
          'from fastapi.responses import RedirectResponse',
          '@app.post("/gastenboek")',
          'async def opslaan():',
          '    return RedirectResponse(url="/berichten", status_code=303)',
          '@app.get("/bericht/{sleutel}")',
          'async def detail(sleutel: str):',
          '    raise HTTPException(status_code=404, detail="Bestaat niet")',
        ].join('\n'),
      }),
      fullstackConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('fastapi-redirect')).toBe(true);
    expect(perId.get('fastapi-httpexception')).toBe(true);
    expect(perId.get('fastapi-path-param')).toBe(true);
  });

  it('ziet een route zonder accolades niet aan voor een path-parameter', () => {
    const report = analyze(
      files({ 'main.py': '@app.get("/berichten")\nasync def berichten():\n    return []' }),
      fullstackConfig,
    );
    const perId = new Map(report.concepts.map((c) => [c.id, c.used]));

    expect(perId.get('fastapi-path-param')).toBe(false);
    expect(perId.get('fastapi-redirect')).toBe(false);
    expect(perId.get('fastapi-httpexception')).toBe(false);
  });

  it('onderscheidt een template met een lus van een template met alleen variabelen', () => {
    const metLus = analyze(
      files({
        'templates/berichten.html':
          '{% if berichten %}<ul>{% for b in berichten %}<li>{{ b.naam }}</li>{% endfor %}</ul>{% endif %}',
      }),
      fullstackConfig,
    );
    const lus = new Map(metLus.concepts.map((c) => [c.id, c.used]));
    expect(lus.get('html-jinja-loop')).toBe(true);
    expect(lus.get('html-jinja-if')).toBe(true);
    expect(lus.get('html-jinja-var')).toBe(true);

    const zonderLus = analyze(
      files({ 'templates/groet.html': '<h1>Hallo {{ naam }}</h1>' }),
      fullstackConfig,
    );
    const plat = new Map(zonderLus.concepts.map((c) => [c.id, c.used]));
    expect(plat.get('html-jinja-var')).toBe(true);
    expect(plat.get('html-jinja-loop')).toBe(false);
    expect(plat.get('html-jinja-if')).toBe(false);
  });
});
