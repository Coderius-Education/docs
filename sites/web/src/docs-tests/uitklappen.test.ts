import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

// Het oefenveld staat in de contentkolom van Docusaurus, en die is begrensd:
// gemeten op de gebouwde site is de editor ~490px en het voorbeeld 327px bij
// een venster van 1440. Voor een Make-opdracht is dat te krap. De knop
// "Groter" laat het veld het scherm vullen; uitgeklapt is het voorbeeld 719px.
//
// Twee dingen mogen daarbij niet stuk:
//
// 1. De code van de leerling. Het veld blijft daarom op dezelfde plek in de
//    React-boom staan en wordt alleen anders gepositioneerd. Zou het naar een
//    portal of een <dialog> verhuizen, dan koppelt de editor opnieuw aan en is
//    zijn undo-geschiedenis weg — precies op het moment dat hij meer ruimte
//    vroeg omdat hij ergens mee bezig was.
// 2. De weg terug. Escape sluit, en de focus gaat terug naar de knop.

const COMPONENT = fileURLToPath(
  new URL('../components/CodeEditor/CodeEditor.tsx', import.meta.url),
);
const CSS = fileURLToPath(
  new URL('../components/CodeEditor/CodeEditor.module.css', import.meta.url),
);

const bron = readFileSync(COMPONENT, 'utf8');
const css = readFileSync(CSS, 'utf8');

describe('het oefenveld kan het scherm vullen', () => {
  it('heeft een knop die uitklapt', () => {
    expect(bron).toMatch(/setUitgeklapt/);
    expect(bron).toMatch(/Groter/);
  });

  it('positioneert alleen, en verhuist het veld niet', () => {
    // createPortal of <dialog> zou de editor opnieuw aankoppelen.
    expect(bron).not.toMatch(/createPortal/);
    expect(bron).not.toMatch(/<dialog/);
    expect(css).toMatch(/\.containerUitgeklapt\s*\{[^}]*position:\s*fixed/);
  });

  it('sluit met Escape en zet de scroll van de pagina vast', () => {
    expect(bron).toMatch(/e\.key === 'Escape'/);
    expect(bron).toMatch(/document\.body\.style\.overflow/);
  });

  it('geeft de focus terug aan de knop, maar niet bij het laden', () => {
    // Zonder die tweede eis trekt elk oefenveld op de pagina bij het laden de
    // focus naar zich toe, en springt de lezer naar het eerste veld.
    expect(bron).toMatch(/isUitgeklaptGeweest/);
    expect(bron).toMatch(/knopRef\.current\?\.focus/);
  });

  it('zet de knoppen in één groep, zodat ze niet elk apart naar rechts duwen', () => {
    // Run, Groter en Reset hadden elk `margin-left: auto`; drie daarvan naast
    // elkaar zet gaten tussen de knoppen in plaats van ze samen te schuiven.
    expect(css).toMatch(/\.tabBarKnoppen\s*\{[^}]*margin-left:\s*auto/);
    const losseAuto = /\.(runButton|resetButton|groterButton)\s*\{[^}]*margin-left:\s*auto/.test(
      css,
    );
    expect(losseAuto).toBe(false);
  });
});

describe('uitgeklapt vullen beide helften hun ruimte', () => {
  // Eerst deed alleen de omlijsting mee. In de gestapelde vorm (js-basics)
  // meet de editor zich naar de code met de height-prop als maximum, en het
  // voorbeeld naar zijn gemeten inhoud. Uitgeklapt bleef daardoor de helft
  // leeg: bij een scherm van 900px was de editorkant 450 hoog maar de code
  // maar 299, en het voorbeeld 160 terwijl er 450 klaarstond.

  it('de editor vult uitgeklapt zijn helft in plaats van de code te volgen', () => {
    expect(bron).toMatch(/height=\{uitgeklapt \? '100%' : height\}/);
    expect(bron).toMatch(/autoHeight=\{stacked && !uitgeklapt\}/);
  });

  it('het voorbeeld laat uitgeklapt zijn vaste hoogte los', () => {
    expect(bron).toMatch(/stacked && !uitgeklapt\s*\?[\s\S]*?previewInhoud/);
  });
});
