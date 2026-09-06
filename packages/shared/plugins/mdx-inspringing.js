/**
 * MDX eet van elke vervolgregel in een `{`…`}`-expressie tot twee spaties op
 * (micromark-factory-mdx-expression, `indentSize = 2`: de inspringing van een
 * container zoals een lijst). Voor code in een template-literal, zoals
 * `<PyRunner initialCode={`…`} />` of `<CodeExercise>{`…`}</CodeExercise>`,
 * betekent dat: vier spaties in de les, twee in de editor van de leerling.
 *
 * Deze pre-loader draait vóór de MDX-loader en zet die twee spaties er alvast
 * bij op elke niet-lege vervolgregel binnen zo'n literal. MDX haalt ze er weer
 * af en houdt precies de bron over. Fenced codeblokken blijven met rust: daar
 * eet MDX niets en zou een backtick-accolade in een JS-voorbeeld ons anders
 * misleiden. Literals op één regel hebben geen vervolgregels en veranderen
 * niet.
 */

const INSPRINGING = '  ';

/** Voegt de twee spaties toe die MDX straks weer weghaalt. Puur, getest. */
function bewaarInspringing(bron) {
  const regels = bron.split('\n');
  let inFence = null;
  let inLiteral = false;
  for (let i = 0; i < regels.length; i++) {
    const regel = regels[i];
    if (!inLiteral) {
      const fence = regel.match(/^\s*(`{3,}|~{3,})/);
      if (fence) {
        if (inFence === null) inFence = fence[1][0].repeat(3);
        else if (fence[1].startsWith(inFence)) inFence = null;
        continue;
      }
      if (inFence !== null) continue;
      // Opent deze regel een literal die niet op dezelfde regel sluit?
      const open = regel.indexOf('{`');
      if (open === -1) continue;
      if (regel.indexOf('`}', open + 2) !== -1) continue;
      inLiteral = true;
      continue;
    }
    if (regel.trim() !== '') regels[i] = INSPRINGING + regel;
    if (regel.includes('`}')) inLiteral = false;
  }
  return regels.join('\n');
}

/** Webpack-loader: bron in, bron met bewaarde inspringing uit. */
module.exports = function mdxInspringingLoader(bron) {
  return bewaarInspringing(bron);
};

module.exports.bewaarInspringing = bewaarInspringing;

/** Docusaurus-plugin die de loader vóór de MDX-loader hangt (enforce: 'pre'). */
module.exports.plugin = function mdxInspringingPlugin() {
  return {
    name: 'coderius-mdx-inspringing',
    configureWebpack() {
      return {
        module: {
          rules: [
            {
              // Bewust `resource` en niet `test`: Docusaurus' interne
              // mdx-fallback-plugin leest van elke rule met een .mdx-`test` de
              // `include`-paden, en een rule zonder include zet dan een
              // undefined in zijn exclude-lijst, waar webpack op stukloopt.
              resource: /\.mdx?$/i,
              enforce: 'pre',
              use: [require.resolve('./mdx-inspringing.js')],
            },
          ],
        },
      };
    },
  };
};
