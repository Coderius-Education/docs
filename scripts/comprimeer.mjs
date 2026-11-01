// Zet `.gz` en `.br` naast de bestanden van een gebouwde site; zie
// packages/shared/comprimeer.js.
//
//   node scripts/comprimeer.mjs <map-van-de-build>

import { existsSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { comprimeerMap } = require('../packages/shared/comprimeer.js');

const map = process.argv[2];
if (!map || !existsSync(map)) {
  console.error('Gebruik: node scripts/comprimeer.mjs <map-van-de-build>');
  process.exit(1);
}

const begin = Date.now();
const { bestanden, voor, gz, br } = await comprimeerMap(map);
const mb = (n) => `${(n / 1e6).toFixed(1)} MB`;
console.log(
  `${map}: ${bestanden} bestanden, ${mb(voor)}; gzip ${mb(gz)}, brotli ${mb(br)} ` +
    `(${((Date.now() - begin) / 1000).toFixed(1)} s)`,
);
