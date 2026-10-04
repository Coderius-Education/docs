/**
 * Print de registry uit packages/shared/sites.js als JSON, voor alles wat geen
 * JavaScript is: de Python-blokrunners (via scripts/sites_registry.py), de
 * CI-workflow en docs-management.
 *
 *     node scripts/sites-json.mjs            de hele registry
 *     node scripts/sites-json.mjs python     alleen de map van één site
 *
 * Vorm: { subjects: [{id,label,url}],
 *         sites: [{id,label,subject,path,url,legacyUrl?,dir,docenten}],
 *         home: {id,label,url,dir} }
 * `dir` is relatief aan de repo-root (sites/<vak>/<id>, of sites/home).
 */

import { createRequire } from 'node:module';

const { SUBJECTS, SITES, DOCENTEN_SITES, HOME, siteDir } = createRequire(import.meta.url)(
  '../packages/shared/sites.js',
);

const id = process.argv[2];
if (id) {
  console.log(siteDir(id));
} else {
  const site = (s, docenten) => ({ ...s, dir: siteDir(s.id), docenten });
  console.log(
    JSON.stringify(
      {
        subjects: SUBJECTS,
        sites: [...SITES.map((s) => site(s, false)), ...DOCENTEN_SITES.map((s) => site(s, true))],
        home: { ...HOME, dir: siteDir(HOME.id) },
      },
      null,
      2,
    ),
  );
}
