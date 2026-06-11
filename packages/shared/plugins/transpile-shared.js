const { createRequire } = require('node:module');
const path = require('node:path');

/**
 * Docusaurus transpileert standaard geen code uit node_modules. Onze gedeelde
 * workspace-packages (@coderius/shared, @coderius/python-runner, …) bevatten
 * TSX-broncode, dus we voegen hun `src`-mappen toe aan de bestaande JS-loader.
 *
 * options.packages: lijst van package-namen waarvan de bron getranspileerd moet
 * worden. Niet-geïnstalleerde packages worden stil overgeslagen, zodat een site
 * alleen betaalt voor wat het importeert.
 *
 * Resolutie gebeurt vanuit de site-map (context.siteDir): met pnpm zijn
 * workspace-packages alleen zichtbaar in de node_modules van de site die ze
 * als dependency heeft, niet vanuit deze plugin-map.
 *
 * Let op — singleton-packages (@docusaurus/theme-common): die mogen maar één
 * fysieke kopie hebben, anders krijg je dubbele React-contexts ("Hook ... called
 * outside the <Provider>", ReactContextError tijdens SSG). Een resolve-alias via
 * deze plugin helpt daar NIET (Docusaurus negeert resolve.alias uit
 * configureWebpack). De oplossing zit aan de bron: gedeelde packages importeren
 * geen theme-common (ze lezen de kleurmodus van het `data-theme`-attribuut), en
 * de workspace gebruikt overal dezelfde (klassieke webpack-) bundler zodat pnpm
 * geen rspack-variant van theme-common bijmaakt.
 */
function resolvePackageDir(name, siteDir) {
  const resolvers = [];
  if (siteDir) {
    resolvers.push(createRequire(path.join(siteDir, 'package.json')));
  }
  resolvers.push(require);
  const marker = path.join('node_modules', ...name.split('/'));
  for (const resolver of resolvers) {
    // 1) Snelste pad: package.json direct resolven (werkt voor @coderius/*).
    try {
      return path.dirname(resolver.resolve(`${name}/package.json`));
    } catch {
      // package.json staat niet in de exports-map (bijv. @codemirror/*):
      // 2) resolve de entry en loop terug naar de package-root.
      try {
        const entry = resolver.resolve(name);
        const idx = entry.lastIndexOf(marker);
        if (idx !== -1) return entry.slice(0, idx + marker.length);
      } catch {
        // probeer de volgende resolver
      }
    }
  }
  return null;
}

module.exports = function transpileSharedPlugin(context, options = {}) {
  const siteDir = context && context.siteDir;
  const dirs = (options.packages || [])
    .map((name) => resolvePackageDir(name, siteDir))
    .filter(Boolean);

  return {
    name: 'coderius-transpile-shared',
    configureWebpack(_config, isServer, utils) {
      if (dirs.length === 0) return {};
      return {
        module: {
          rules: [
            {
              test: /\.[jt]sx?$/,
              include: dirs,
              use: [utils.getJSLoader({isServer})],
            },
          ],
        },
      };
    },
  };
};

module.exports.resolvePackageDir = resolvePackageDir;
