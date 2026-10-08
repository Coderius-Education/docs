const fs = require('node:fs');
const path = require('node:path');
const { themes: prismThemes } = require('prism-react-renderer');
const transpileShared = require('../plugins/transpile-shared');
const { plugin: mdxInspringing } = require('../plugins/mdx-inspringing');
const cursussenRoute = require('../plugins/cursussen-route');
const privacyRoute = require('../plugins/privacy-route');
const omleidingenPlugin = require('../plugins/omleidingen');
const matomoPlugin = require('../plugins/matomo');
const {
  SITES,
  DOCENTEN_SITES,
  SITES_BY_ID,
  SUBJECTS_BY_ID,
  HOME,
  normalizeUrl,
  siteByUrl,
  sitesOfSubject,
} = require('../sites');
const { CURSUSSEN } = require('../huisstijl');
const { resolvePackageDir } = transpileShared;
const { loadSettings, applySettings, deepMerge } = require('./managed-settings');
const managedManifest = require('../plugins/managed-manifest');
const sidebarManifest = require('../plugins/sidebar-manifest');
const klasPlugin = require('../plugins/klas');
const oudeOpslagPlugin = require('../plugins/oude-opslag');
const { controleerRegels } = require('../oude-opslag');

/**
 * Welke site uit de registry bouwen we? De registry is de bron van waarheid
 * voor host en pad, dus een site noemt alleen zijn id (`siteId`). Voor oudere
 * configs (en docs-management) werkt ook een `url` die de oude of nieuwe URL
 * van een cursus is, en anders de mapnaam: docusaurus draait altijd vanuit de
 * map van de site, en die heet naar het id.
 */
function registrySite(siteId, url) {
  if (siteId) {
    const site = SITES_BY_ID[siteId];
    if (!site) throw new Error(`createConfig: onbekende siteId '${siteId}' (zie sites.js)`);
    return site;
  }
  const norm = normalizeUrl(url);
  if (norm) {
    const site =
      [...SITES, ...DOCENTEN_SITES].find((s) => normalizeUrl(s.legacyUrl) === norm) ||
      siteByUrl(norm) ||
      DOCENTEN_SITES.find((s) => norm === normalizeUrl(s.url));
    if (site) return site;
  }
  return SITES_BY_ID[path.basename(process.cwd())];
}

// De andere cursussen van hetzelfde vak. Voedt de navbar-dropdown, zodat
// cross-site links uit één registry komen; cursussen van een ander vak staan
// op coderius.nl ("Andere vakken").
function otherSites(site) {
  if (!site) return SITES;
  return sitesOfSubject(site.subject).filter((s) => s.id !== site.id);
}

// Absolute paths into deze package — robuust ongeacht waar de site staat.
const SHARED_STATIC = path.join(__dirname, '..', 'static');
const SHARED_CSS = path.join(__dirname, '..', 'css', 'custom.css');
const HUISSTIJL_CSS = path.join(__dirname, '..', 'css', 'huisstijl.css');
const cursusCss = (id) => path.join(__dirname, '..', 'css', 'cursus', `${id}.css`);

// Letters van de huisstijl, zelf gehost via fontsource: geen verzoek naar
// Google vanaf een schoolnetwerk, en ze werken ook offline in de PWA van play.
const LETTER_CSS = [
  require.resolve('@fontsource-variable/atkinson-hyperlegible-next'),
  require.resolve('@fontsource-variable/atkinson-hyperlegible-mono'),
  require.resolve('@fontsource-variable/literata'),
];

/** Het huisstijl-merk van een site uit de registry (cursussen én docentensites). */
function merkVoorSite(site) {
  return site ? CURSUSSEN.find((c) => c.id === site.id) : undefined;
}

// Coderius gebruikt overal dezelfde licentie (zie org-handbook).
const CC_BY_NC =
  'Licensed under <a href="https://creativecommons.org/licenses/by-nc/4.0/deed.nl" target="_blank" rel="license noopener noreferrer">' +
  'Creative Commons Attribution-NonCommercial 4.0 International (CC BY-NC 4.0)</a>.';

// Sommige gedeelde packages (zoals @coderius/editor) brengen hun eigen
// static-assets mee (bijv. de self-hosted Monaco-distributie). Elke shared
// package met een `static`-map wordt automatisch geserveerd door de site.
// Resolutie vanuit de site (process.cwd(): docusaurus draait altijd vanuit de
// site-map), want met pnpm zijn workspace-packages alleen daar zichtbaar.
function packageStaticDirs(packages) {
  const dirs = [];
  for (const name of packages) {
    const pkgDir = resolvePackageDir(name, process.cwd());
    if (!pkgDir) continue;
    const staticDir = path.join(pkgDir, 'static');
    if (fs.existsSync(staticDir)) dirs.push(staticDir);
  }
  return dirs;
}

// Dedupliceer op realpath: SHARED_STATIC en de static-map van
// @coderius/shared (via packageStaticDirs) zijn hetzelfde pad via een symlink.
function uniqueDirs(dirs) {
  const seen = new Set();
  const result = [];
  for (const dir of dirs) {
    let key = dir;
    try {
      key = fs.realpathSync(dir);
    } catch {
      // niet-bestaand pad (zoals het relatieve 'static'): gebruik zoals-is
    }
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(dir);
  }
  return result;
}

// Zet de gedeelde merk-CSS vóór de eventuele site-eigen customCss in het classic
// preset: eerst de huisstijl, dan de gedeelde regels, dan de kleur van de cursus.
function withSharedCustomCss(presets, merk) {
  return (presets || []).map((entry) => {
    if (!Array.isArray(entry)) return entry;
    const [name, opts] = entry;
    if (name !== 'classic' || !opts) return entry;
    const theme = { ...opts.theme };
    const existing = theme.customCss;
    const local = existing == null ? [] : Array.isArray(existing) ? existing : [existing];
    theme.customCss = [HUISSTIJL_CSS, SHARED_CSS, ...(merk ? [cursusCss(merk.id)] : []), ...local];
    return [name, { ...opts, theme }];
  });
}

/**
 * Bouwt een volledige Docusaurus-config uit de site-specifieke onderdelen plus
 * de gedeelde standaarden. Wat een site meegeeft wint; de factory zorgt voor:
 *  - gedeelde brand-assets via staticDirectories (img/merk/: merk, tegel en
 *    woordmerk per cursus, gegenereerd uit huisstijl/)
 *  - navbar-merk, naam en favicon van de cursus uit de huisstijl
 *  - gedeelde merk-CSS vóór de site-CSS
 *  - de CC BY-NC 4.0 copyright als de footer er geen heeft
 *  - transpilatie van @coderius/* workspace-componenten
 *  - static-mappen van sharedPackages worden automatisch mee-geserveerd
 *  - sensible defaults (i18n nl, onBrokenLinks throw, future.v4, prism-thema)
 *
 * Handige extra's: geef `description`/`keywords` mee i.p.v. zelf headTags te
 * schrijven, en `omleidingen` ([{ van, naar }]) als een les verhuist: op elk
 * oud adres komt dan na de build een pagina die doorstuurt. Bewaarde de
 * cursus op zijn oude subdomein iets in de browser, geef dan `oudeOpslag` mee
 * (zie oude-opslag.js): de leerling kan dat werk dan overzetten.
 */
function createConfig(course = {}) {
  const managed = loadSettings(process.cwd());
  const site = managed ? applySettings(course, managed, process.cwd()) : course;
  const {
    sharedPackages = ['@coderius/shared'],
    description,
    keywords,
    headTags,
    themeConfig: siteThemeConfig,
    presets,
    plugins,
    staticDirectories,
    future,
    matomoSiteId,
    omleidingen,
    oudeOpslag,
    siteId,
    ...rest
  } = site;

  // Host en pad uit de registry: https://informatica.coderius.nl + /python/.
  // Dat is niet overschrijfbaar; een cursus die ergens anders wil staan, past
  // sites.js aan, zodat links, scripts en hosting het eens blijven.
  const registry = registrySite(siteId, rest.url);
  const vak = registry && SUBJECTS_BY_ID[registry.subject];
  if (registry) {
    rest.url = vak.url;
    rest.baseUrl = `/${registry.path}/`;
  }

  if (oudeOpslag) {
    // Werk van het oude subdomein overzetten kan alleen als er een was.
    if (!registry?.legacyUrl) {
      throw new Error(`oudeOpslag: ${registry?.id ?? siteId} had geen eigen subdomein`);
    }
    controleerRegels(oudeOpslag);
  }

  const seoTags = [];
  if (description)
    seoTags.push({ tagName: 'meta', attributes: { name: 'description', content: description } });
  if (keywords)
    seoTags.push({ tagName: 'meta', attributes: { name: 'keywords', content: keywords } });

  const themeConfig = deepMerge(
    {
      colorMode: { respectPrefersColorScheme: true },
      prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula },
      // Rechter inhoudsopgave toont standaard alleen H2-koppen. Een site mag dit
      // overschrijven via themeConfig.tableOfContents.
      tableOfContents: { minHeadingLevel: 2, maxHeadingLevel: 2 },
    },
    siteThemeConfig || {},
  );
  // Validate only after shared defaults, course settings and managed overrides
  // have merged: a partial override must use the actual inherited other bound.
  const { minHeadingLevel, maxHeadingLevel } = themeConfig.tableOfContents || {};
  if (
    ![minHeadingLevel, maxHeadingLevel].every(
      (value) => Number.isInteger(value) && value >= 2 && value <= 6,
    )
  ) {
    throw new Error(
      'themeConfig.tableOfContents: minHeadingLevel and maxHeadingLevel must be integers between 2 and 6',
    );
  }
  if (minHeadingLevel > maxHeadingLevel) {
    throw new Error(
      `themeConfig.tableOfContents: effective minHeadingLevel (${minHeadingLevel}) must not exceed effective maxHeadingLevel (${maxHeadingLevel})`,
    );
  }
  for (const key of ['theme', 'darkTheme']) {
    const value = themeConfig.prism?.[key];
    if (typeof value === 'string') {
      if (!prismThemes[value]) throw new Error(`Unknown Prism theme ${value}`);
      themeConfig.prism[key] = prismThemes[value];
    }
  }
  const others = otherSites(registry);
  const merk = merkVoorSite(registry);

  // Footer: zorg voor de CC-BY-NC copyright en één teruglink naar de homepage.
  // Cross-site navigatie tussen cursussen zit in de navbar-dropdown "Cursussen"
  // en op /cursussen; de footer wijst terug naar de overkoepelende coderius.nl.
  const footer = themeConfig.footer ? { ...themeConfig.footer } : { style: 'dark' };
  if (!footer.copyright) footer.copyright = CC_BY_NC;
  const footerLinks = footer.links ? [...footer.links] : [];
  const hasHomeLink = footerLinks.some((col) =>
    (col.items || []).some((item) => item.href === HOME.url),
  );
  const hasPrivacyLink = footerLinks.some((col) =>
    (col.items || []).some((item) => item.to === '/privacy'),
  );
  if (!hasHomeLink) {
    footerLinks.push({
      title: HOME.label,
      items: [
        { label: 'Home', href: HOME.url },
        ...(hasPrivacyLink ? [] : [{ label: 'Privacy', to: '/privacy' }]),
      ],
    });
  } else if (!hasPrivacyLink) {
    footerLinks.push({ title: 'Privacy', items: [{ label: 'Privacy', to: '/privacy' }] });
  }
  if (oudeOpslag) {
    // Werk van het oude subdomein ophalen: onder Home en Privacy, voor wie het zoekt.
    const kolom = footerLinks.find((col) => col.title === HOME.label) ?? footerLinks.at(-1);
    kolom.items = [...(kolom.items || []), { label: 'Werk van het oude adres', to: '/overzetten' }];
  }
  footer.links = footerLinks;
  themeConfig.footer = footer;

  // Navbar: één "Cursussen"-dropdown (rechts) om naar een andere cursus van
  // hetzelfde vak te springen, plus het overzicht op /cursussen en een link
  // naar coderius.nl voor de andere vakken.
  const navbar = themeConfig.navbar ? { ...themeConfig.navbar } : {};
  // Merk en naam uit de huisstijl, tenzij de site (of docs-management) er
  // bewust een eigen zet.
  if (merk) {
    if (!navbar.logo) {
      navbar.logo = {
        alt: `Coderius ${merk.label}`,
        src: `img/merk/${merk.id}.svg`,
        srcDark: `img/merk/${merk.id}-donker.svg`,
        width: 32,
        height: 32,
      };
    }
    if (navbar.title === undefined) navbar.title = merk.label;
  }
  navbar.items = [
    ...(navbar.items || []).filter(
      (item) =>
        item.to !== '/docenten' && !(item.type === 'dropdown' && item.label === 'Cursussen'),
    ),
    // Elke site heeft een docentenhandleiding op /docenten (zie stijlgids §15).
    { to: '/docenten', label: 'Docenten', position: 'right' },
    {
      type: 'dropdown',
      label: 'Cursussen',
      position: 'right',
      items: [
        ...others.map((s) => ({ label: s.label, href: s.url })),
        { label: 'Alle cursussen', to: '/cursussen' },
        { label: 'Andere vakken', href: HOME.url },
      ],
    },
  ];
  themeConfig.navbar = navbar;

  return {
    // ---- gedeelde standaarden (site mag overschrijven via ...rest) ----
    favicon: merk ? `img/merk/${merk.id}-tegel.svg` : 'img/favicon.ico',
    baseUrl: '/',
    organizationName: 'Coderius-Education',
    onBrokenLinks: 'throw',
    // v4-compat aan, en de rspack ("faster") bundler standaard uit: onze
    // transpile-plugin voor gedeelde componenten leunt op de klassieke
    // webpack-loader (utils.getJSLoader). Sites zonder gedeelde componenten
    // mogen faster weer aanzetten via future.faster.
    future: { v4: true, faster: false, ...future },
    i18n: { defaultLocale: 'nl', locales: ['nl'] },
    ...rest,
    // ---- door de factory beheerd (niet overschrijfbaar via ...rest) ----
    headTags: headTags || (seoTags.length ? seoTags : undefined),
    // De site-id uit de registry, voor componenten die per site opslaan
    // (storageKey in opslag.js): alle cursussen van een vak delen één origin.
    customFields: {
      ...(rest.customFields || {}),
      ...(registry ? { siteId: registry.id } : {}),
      ...(oudeOpslag ? { oudeOpslag } : {}),
    },
    staticDirectories:
      staticDirectories ||
      uniqueDirs(['static', SHARED_STATIC, ...packageStaticDirs(sharedPackages)]),
    presets: withSharedCustomCss(presets, merk),
    clientModules: [...LETTER_CSS, ...(rest.clientModules || [])],
    plugins: [
      ...(plugins || []),
      ...(managed ? [[managedManifest, { settings: managed }]] : []),
      // Klassen (docs-management): hoofdstukkenlijst voor docenten, en de
      // klasweergave in de sidebar voor leerlingen.
      sidebarManifest,
      klasPlugin,
      [transpileShared, { packages: sharedPackages }],
      mdxInspringing,
      cursussenRoute,
      privacyRoute,
      [matomoPlugin, { siteId: matomoSiteId }],
      ...(omleidingen?.length ? [[omleidingenPlugin, { omleidingen }]] : []),
      ...(oudeOpslag ? [[oudeOpslagPlugin, { siteId: registry?.id, regels: oudeOpslag }]] : []),
    ],
    themeConfig,
  };
}

module.exports = { createConfig, prismThemes, CC_BY_NC };
