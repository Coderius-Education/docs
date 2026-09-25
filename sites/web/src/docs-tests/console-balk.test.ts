import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// In de html-css-lessen was de console onzichtbaar: hij verscheen alleen als
// er JavaScript in het veld zat. Wie daar toch een <script> of console.log
// probeerde, of wilde weten waar de uitvoer van zijn pagina heen ging, zag
// niets. Nu staat hij in elk veld, als dichte balk zolang er geen JavaScript
// is, zodat het voorbeeld naast de editor zijn ruimte houdt.

const lees = (pad: string) => readFileSync(fileURLToPath(new URL(pad, import.meta.url)), 'utf8');

const bron = lees('../components/CodeEditor/CodeEditor.tsx');
const css = lees('../components/CodeEditor/CodeEditor.module.css');

describe('de console staat in elk oefenveld', () => {
  it('hangt niet meer af van JavaScript in het veld', () => {
    expect(bron).not.toMatch(/toonConsole &&/);
    expect(bron).toMatch(/consolePanel/);
  });

  it('klapt open en dicht met een knop die zijn stand meldt', () => {
    expect(bron).toMatch(/aria-expanded=\{consoleOpen\}/);
  });

  it('klapt open zodra er uitvoer binnenkomt', () => {
    expect(bron).toMatch(/type === 'console'\) \{[\s\S]{0,200}setConsoleOpen\(true\)/);
  });

  it('is dicht alleen zijn kopbalk', () => {
    // De open console is 130px hoog; dicht mag hij dat niet houden, anders
    // kost hij het voorbeeld evenveel ruimte als open.
    expect(css).toMatch(/\.consolePanelDicht\s*\{[^}]*height:\s*auto/);
  });
});
