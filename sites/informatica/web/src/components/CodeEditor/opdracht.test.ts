// @vitest-environment jsdom
import { describe, expect, it } from 'vitest';
import { opdrachtBoven } from './opdracht';

// Op Groter en volledig scherm vult het oefenveld het scherm. De opdracht
// stond in de les erboven en was dan weg: de leerling moest het veld sluiten
// om te lezen wat hij moest maken.

function paneel(html: string): HTMLElement {
  document.body.innerHTML = `<section data-les-tab="opdracht" class="markdown">${html}</section>`;
  return document.querySelector('[data-zaad]') as HTMLElement;
}

const tekst = (nodes: Node[]) => nodes.map((n) => n.textContent).join(' | ');

describe('opdrachtBoven', () => {
  it('geeft de kop van het onderdeel en de tekst tussen die kop en het veld', () => {
    const veld = paneel(`
      <h2 id="opdracht-2-klik-teller">Opdracht 2: Klik-teller<a class="hash-link" href="#opdracht-2-klik-teller">\u200B</a></h2>
      <p>Schrijf een functie <code>telKlik</code>.</p>
      <ul><li>Elke klik telt.</li></ul>
      <div data-zaad="1"></div>
      <details><summary>Tip</summary>Niet deze.</details>`);
    const opdracht = opdrachtBoven(veld);
    expect(opdracht?.titel).toBe('Opdracht 2: Klik-teller');
    expect(tekst(opdracht?.inhoud ?? [])).toBe('Schrijf een functie telKlik. | Elke klik telt.');
  });

  it('vindt het veld ook als het dieper in een blok staat', () => {
    const veld = paneel(
      '<h2>Modify</h2><p><strong>Opdracht:</strong> Maak de kop rood.</p><div><div data-zaad="1"></div></div>',
    );
    expect(tekst(opdrachtBoven(veld)?.inhoud ?? [])).toBe('Opdracht: Maak de kop rood.');
  });

  it('neemt geen id en geen knop mee: de kopie staat naast het origineel op de pagina', () => {
    const veld = paneel(`
      <h2>Modify</h2>
      <p id="uitleg">Gebruik deze URL.</p>
      <div class="codeBlock"><pre id="code">https://example.com</pre><button>Kopieer</button></div>
      <div data-zaad="1"></div>`);
    const houder = document.createElement('div');
    houder.append(...(opdrachtBoven(veld)?.inhoud ?? []));
    expect(houder.querySelector('[id]')).toBeNull();
    expect(houder.querySelector('button')).toBeNull();
    expect(houder.textContent).toContain('https://example.com');
    // Het origineel is niet aangeraakt.
    expect(document.getElementById('uitleg')).not.toBeNull();
    expect(document.querySelector('.codeBlock button')).not.toBeNull();
  });

  it('stopt bij een eerder veld: dat is een andere opdracht', () => {
    const veld = paneel(`
      <h2>Opdrachten</h2>
      <p>Eerste opdracht.</p>
      <div data-zaad="0"></div>
      <details><summary>Antwoord</summary>x</details>
      <p>Tweede opdracht.</p>
      <div data-zaad="1"></div>`);
    const tweede = document.querySelector('[data-zaad="1"]') as HTMLElement;
    expect(veld.dataset.zaad).toBe('0');
    expect(tekst(opdrachtBoven(tweede)?.inhoud ?? [])).toBe('Tweede opdracht.');
  });

  it('geeft niets als er geen tekst boven het veld staat', () => {
    // Probeer en onderzoek: daar staan de vragen al in het veld.
    expect(
      opdrachtBoven(paneel('<h2>Probeer en onderzoek</h2><div data-zaad="1"></div>')),
    ).toBeNull();
    document.body.innerHTML = '<div data-zaad="1"></div>';
    expect(opdrachtBoven(document.querySelector('[data-zaad]') as HTMLElement)).toBeNull();
  });
});
