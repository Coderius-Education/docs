// Kopieert de Monaco AMD-distributie (min/vs) uit node_modules/monaco-editor/
// naar static/monaco/vs/ zodat sites Monaco zelf serveren (geen CDN — werkt
// ook op schoolnetwerken die externe CDN's blokkeren).
//
// Gebruik: `pnpm --filter @coderius/editor copy:monaco`
// Daarna: commit de gewijzigde bestanden in static/monaco/.

import { cpSync, existsSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, '..');
const require = createRequire(join(packageRoot, 'package.json'));

let monacoDir;
try {
  monacoDir = dirname(require.resolve('monaco-editor/package.json'));
} catch {
  console.error('Kan monaco-editor niet vinden. Heb je `pnpm install` gedraaid?');
  process.exit(1);
}

const src = join(monacoDir, 'min', 'vs');
const dest = join(packageRoot, 'static', 'monaco', 'vs');

if (!existsSync(src)) {
  console.error(`Bron niet gevonden: ${src}`);
  process.exit(1);
}

// Schoonmaken om verweesde bestanden van een vorige versie te verwijderen.
if (existsSync(dest)) {
  rmSync(dest, { recursive: true, force: true });
}

// `min/vs` is al geminificeerd en bevat geen sourcemaps; integraal kopiëren.
// De volledige build levert alle talen (python, html, css, js, json, …) en
// hun workers zonder bundler-configuratie.
cpSync(src, dest, { recursive: true });

// UI-vertalingen weggooien: Monaco heeft geen Nederlands, dus de editor-UI
// blijft Engels en de andere talen zijn dood gewicht.
const { readdirSync, unlinkSync } = await import('node:fs');
let dropped = 0;
for (const entry of readdirSync(dest)) {
  if (/^nls\.messages\..+\.js$/.test(entry)) {
    unlinkSync(join(dest, entry));
    dropped++;
  }
}

console.log(`Monaco gekopieerd naar ${dest} (${dropped} vertaalbestanden verwijderd)`);
