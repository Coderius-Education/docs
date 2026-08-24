// Haalt de Python-voorbeelden uit lespagina's, zodat CI ze kan compileren.
//
// Waarom: lescode wordt nergens uitgevoerd. Een typefout, een vergeten haakje
// of scheve inspringing valt pas op als een leerling het blok overtypt.
// CPython's compile() is puur syntactisch — namen en imports hoeven niet te
// bestaan — dus elk blok kan mee zonder server, board of dependencies.
//
// Gedeeld door robotica (MicroPython) en fullstack (FastAPI). MicroPython-
// syntax is voor compile() gewoon Python, dus dezelfde extractie volstaat.

const { readFileSync } = require('node:fs');
const { alleLesbestanden } = require('./voorkennis');

// Ook fences met een meta ("```python geen-editor-link") tellen mee — anders
// zou zo'n blok stil aan de CI-compilatie ontsnappen.
const BLOK = /```python(?:[ \t][^\n]*)?\n([\s\S]*?)```/g;

/**
 * Sommige blokken horen niet te compileren: een bewust kapot voorbeeld
 * ("wat is er mis?"), of een fragment dat alleen binnen een groter script
 * betekenis heeft. De bron markeert ze met een MDX-commentaar boven het blok
 * — onzichtbaar voor de leerling. De marker geldt voor precies één blok: het
 * eerstvolgende na de marker (alles tussen het vorige codeblok en dit blok
 * telt mee, hoe lang dat stuk ook is). Let op de MDX-vorm: `<!-- -->` laat
 * de docusaurus-build stuklopen.
 */
const NIET_COMPILEREN = '{/* niet-compileren:';

/** Gemeenschappelijke inspringing weghalen (blokken in lijsten staan ingesprongen). */
function dedent(code) {
  const regels = code.split('\n');
  let kleinste = Number.POSITIVE_INFINITY;
  for (const regel of regels) {
    if (regel.trim() === '') continue;
    const inspring = regel.length - regel.trimStart().length;
    if (inspring < kleinste) kleinste = inspring;
  }
  if (!Number.isFinite(kleinste) || kleinste === 0) return code;
  return regels.map((r) => r.slice(kleinste)).join('\n');
}

function slugVan(inhoud) {
  return inhoud.match(/^slug:\s*\/(\S+)/m)?.[1];
}

function fragmentenUit(bron, inhoud) {
  // Pagina's zonder slug krijgen mapnaam plus bestandsnaam: gelijknamige
  // bestanden in verschillende mappen (4_code.md, 2_wiring.md, …) botsen dan
  // niet, en de naam hangt nog steeds niet van het absolute pad af.
  const delen = bron.split('/');
  const bestand = (delen.pop() ?? bron).replace(/\.mdx?$/, '');
  const mapNaam = delen.pop();
  const slug = slugVan(inhoud) ?? (mapNaam ? `${mapNaam}_${bestand}` : bestand);
  const basis = slug.replace(/[^a-z0-9]+/gi, '_');
  const fragmenten = [];
  const overgeslagen = [];
  let n = 0;

  for (const match of inhoud.matchAll(BLOK)) {
    const rauw = match[1].replace(/\s+$/, '');
    const ervoor = inhoud.slice(0, match.index);
    const regel = ervoor.split('\n').length;
    const koppen = ervoor.match(/^#{2,3} (.+)$/gm);
    const kop = koppen ? koppen[koppen.length - 1].replace(/^#+ /, '') : '';
    n += 1;

    const vorigeFence = ervoor.lastIndexOf('```');
    const tussenVorigBlok = vorigeFence === -1 ? ervoor : ervoor.slice(vorigeFence + 3);
    if (tussenVorigBlok.includes(NIET_COMPILEREN)) {
      overgeslagen.push({ bron, regel, reden: 'bewust niet-compileerbaar (marker)' });
      continue;
    }

    const code = dedent(rauw);
    if (/^>>>/m.test(code)) {
      overgeslagen.push({ bron, regel, reden: 'REPL-transcript' });
      continue;
    }

    fragmenten.push({ naam: `${basis}_${n}`, bron, regel, kop, code: `${code}\n` });
  }

  return { fragmenten, overgeslagen };
}

function verzamel(wortels) {
  const fragmenten = [];
  const overgeslagen = [];
  // Botsende namen zouden elkaars .py-bestand stil overschrijven, waarna een
  // deel van de blokken nooit gecompileerd wordt. Liever hard falen.
  const bronPerNaam = new Map();
  for (const wortel of wortels) {
    for (const pad of alleLesbestanden(wortel).sort()) {
      const resultaat = fragmentenUit(pad, readFileSync(pad, 'utf8'));
      for (const f of resultaat.fragmenten) {
        const eerder = bronPerNaam.get(f.naam);
        if (eerder) {
          throw new Error(
            `Fragmentnaam '${f.naam}' botst: ${eerder} en ${f.bron}. Geef een van beide pagina's een eigen slug.`,
          );
        }
        bronPerNaam.set(f.naam, f.bron);
      }
      fragmenten.push(...resultaat.fragmenten);
      overgeslagen.push(...resultaat.overgeslagen);
    }
  }
  return { fragmenten, overgeslagen };
}

module.exports = { BLOK, NIET_COMPILEREN, dedent, fragmentenUit, verzamel, alleLesbestanden };
