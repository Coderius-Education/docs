import { createHash, createHmac } from 'node:crypto';
import { beforeEach, describe, expect, it } from 'vitest';
import { createPhp, execPhp } from '../components/DvwaLab/PhpWasmProvider';
import { authorizationBypass } from '../components/DvwaLab/modules/authorization_bypass';
import { bruteForce } from '../components/DvwaLab/modules/brute_force';
import { cspBypass } from '../components/DvwaLab/modules/csp_bypass';
import { csrf } from '../components/DvwaLab/modules/csrf';
import { fileInclusion } from '../components/DvwaLab/modules/file_inclusion';
import { fileUpload } from '../components/DvwaLab/modules/file_upload';
import { javascriptAttacks } from '../components/DvwaLab/modules/javascript_attacks';
import { sqlInjection } from '../components/DvwaLab/modules/sql_injection';
import { sqlInjectionBlind } from '../components/DvwaLab/modules/sql_injection_blind';
import { weakSessionIds } from '../components/DvwaLab/modules/weak_session_ids';
import { xssDom } from '../components/DvwaLab/modules/xss_dom';
import { xssReflected } from '../components/DvwaLab/modules/xss_reflected';
import { xssStored } from '../components/DvwaLab/modules/xss_stored';

// Draait de kwetsbare PHP van elke lab-module écht, via de Node-build van
// php-wasm — dezelfde interpreter als in de browser. Zo bewijst de test de
// didactische ladder: de aanval slaagt op `low` en wordt geweigerd op
// `impossible`. `command_injection` valt buiten deze suite: dat lab draait
// client-side JS (zie commands.test.ts), niet PHP.
//
// De seed- en superglobal-injectielogica komt uit PhpWasmProvider.js, precies
// wat de browser gebruikt; een groene suite bewijst dus de echte lab-runtime,
// geen namaak.

const MODULES: Record<string, Record<string, { method: string; php: string }>> = {
  brute_force: bruteForce,
  sql_injection: sqlInjection,
  sql_injection_blind: sqlInjectionBlind,
  xss_reflected: xssReflected,
  xss_stored: xssStored,
  xss_dom: xssDom,
  authorization_bypass: authorizationBypass,
  csrf,
  file_inclusion: fileInclusion,
  file_upload: fileUpload,
  weak_session_ids: weakSessionIds,
  csp_bypass: cspBypass,
  javascript_attacks: javascriptAttacks,
};

// Token-berekeningen die de client-side scripts van javascript_attacks doen —
// hier in Node nagerekend zodat we de serverkant kunnen valideren.
const strrev = (s: string) => s.split('').reverse().join('');
const rot13 = (s: string) =>
  s.replace(/[a-z]/gi, (c) => {
    const basis = c <= 'Z' ? 65 : 97;
    return String.fromCharCode(((c.charCodeAt(0) - basis + 13) % 26) + basis);
  });
const sha256 = (s: string) => createHash('sha256').update(s).digest('hex');
const hmac = (s: string) => createHmac('sha256', 'dvwa_server_secret_2024').update(s).digest('hex');

type Verwacht = {
  bevat?: string[];
  bevatNiet?: string[];
  regex?: RegExp[];
  staWaarschuwing?: boolean;
};
type Geval = {
  module: string;
  level: 'low' | 'medium' | 'high' | 'impossible';
  naam: string;
  invoer: Record<string, string>;
  verwacht: Verwacht;
};

const GEVALLEN: Geval[] = [
  // --- Brute Force (GET) ---
  {
    module: 'brute_force',
    level: 'low',
    naam: 'juiste inlog lukt',
    invoer: { username: 'admin', password: 'password' },
    verwacht: { bevat: ['Welkom, admin'] },
  },
  {
    module: 'brute_force',
    level: 'low',
    naam: 'fout wachtwoord faalt',
    invoer: { username: 'admin', password: 'fout' },
    verwacht: { bevat: ['onjuist'] },
  },
  {
    module: 'brute_force',
    level: 'low',
    naam: "SQLi met '-- ' omzeilt de wachtwoordcheck",
    invoer: { username: "admin' -- ", password: 'onzin' },
    verwacht: { bevat: ['Welkom, admin'] },
  },
  {
    module: 'brute_force',
    level: 'medium',
    naam: 'SQLi wordt ge-escaped en faalt',
    invoer: { username: "admin' -- ", password: 'onzin' },
    verwacht: { bevat: ['onjuist'] },
  },

  // --- SQL Injection (low/high/impossible GET, medium POST) ---
  {
    module: 'sql_injection',
    level: 'low',
    naam: 'onschuldige id toont alleen admin',
    invoer: { id: '1' },
    verwacht: { bevat: ['admin'], bevatNiet: ['Gordon'] },
  },
  {
    module: 'sql_injection',
    level: 'low',
    naam: "' OR '1'='1 lekt alle namen",
    invoer: { id: "1' OR '1'='1" },
    verwacht: { bevat: ['admin', 'Gordon', 'Pablo'] },
  },
  {
    module: 'sql_injection',
    level: 'medium',
    naam: '(int)-cast blokkeert de string-injectie',
    invoer: { id: '1 OR 1=1' },
    verwacht: { bevat: ['admin'], bevatNiet: ['Gordon'] },
  },
  {
    module: 'sql_injection',
    level: 'high',
    naam: 'LIMIT 1 laat maar één rij door',
    invoer: { id: "1' OR '1'='1" },
    verwacht: { bevat: ['admin'], bevatNiet: ['Gordon'] },
  },
  {
    module: 'sql_injection',
    level: 'impossible',
    naam: "' OR '1'='1 wordt geweigerd",
    invoer: { id: "1' OR '1'='1" },
    verwacht: { bevat: ['Ongeldige invoer'], bevatNiet: ['Gordon'] },
  },

  // --- Blind SQL Injection ---
  {
    module: 'sql_injection_blind',
    level: 'low',
    naam: 'bestaande id meldt "bestaat"',
    invoer: { id: '1' },
    verwacht: { bevat: ['bestaat'], bevatNiet: ['NIET'] },
  },
  {
    module: 'sql_injection_blind',
    level: 'low',
    naam: 'onbestaande id meldt "bestaat NIET"',
    invoer: { id: '999' },
    verwacht: { bevat: ['bestaat NIET'] },
  },
  {
    module: 'sql_injection_blind',
    level: 'low',
    naam: 'boolean-injectie draait NIET om naar bestaat',
    invoer: { id: "999' OR '1'='1" },
    verwacht: { bevat: ['bestaat'], bevatNiet: ['NIET'] },
  },
  {
    module: 'sql_injection_blind',
    level: 'impossible',
    naam: 'niet-numerieke invoer geweigerd',
    invoer: { id: "999' OR '1'='1" },
    verwacht: { bevat: ['Ongeldige invoer'] },
  },

  // --- XSS Reflected (GET) ---
  {
    module: 'xss_reflected',
    level: 'low',
    naam: 'script-tag komt rauw terug',
    invoer: { name: '<script>alert(1)</script>' },
    verwacht: { bevat: ['<script>alert(1)</script>'] },
  },
  {
    module: 'xss_reflected',
    level: 'medium',
    naam: 'hoofdletter-SCRIPT omzeilt het filter',
    invoer: { name: '<SCRIPT>alert(1)</SCRIPT>' },
    verwacht: { bevat: ['<SCRIPT>alert(1)</SCRIPT>'] },
  },
  {
    module: 'xss_reflected',
    level: 'high',
    naam: 'img-onerror omzeilt het script-filter',
    invoer: { name: '<img src=x onerror=alert(1)>' },
    verwacht: { bevat: ['<img src=x onerror=alert(1)>'] },
  },
  {
    module: 'xss_reflected',
    level: 'impossible',
    naam: 'htmlspecialchars encodeert de tags',
    invoer: { name: '<script>alert(1)</script>' },
    verwacht: {
      bevat: ['&lt;script&gt;alert(1)&lt;/script&gt;'],
      bevatNiet: ['<script>alert(1)</script>'],
    },
  },

  // --- XSS Stored (POST) ---
  {
    module: 'xss_stored',
    level: 'low',
    naam: 'bericht wordt rauw opgeslagen en getoond',
    invoer: { name: 'Jan', mtxMessage: '<script>alert(1)</script>' },
    verwacht: { bevat: ['<script>alert(1)</script>'] },
  },
  {
    module: 'xss_stored',
    level: 'medium',
    naam: 'naamveld blijft ongefilterd',
    invoer: { name: '<b>me</b>', mtxMessage: 'hoi' },
    verwacht: { bevat: ['<b>me</b>'] },
  },
  {
    module: 'xss_stored',
    level: 'high',
    naam: 'img-onerror in bericht glipt langs het script-filter',
    invoer: { name: 'Jan', mtxMessage: '<img src=x onerror=alert(1)>' },
    verwacht: { bevat: ['<img src=x onerror=alert(1)>'] },
  },
  {
    module: 'xss_stored',
    level: 'impossible',
    naam: 'script-tags worden gestript, niets voert uit',
    invoer: { name: 'Jan', mtxMessage: '<script>alert(1)</script>' },
    verwacht: { bevat: ['Jan'], bevatNiet: ['<script>'] },
  },

  // --- XSS DOM (GET) — de payload komt in de inline-JS; hier asserten we de
  //     door PHP geëchode waarde (de eigenlijke alert draait client-side). ---
  {
    module: 'xss_dom',
    level: 'low',
    naam: 'invoer belandt rauw in de inline-JS-variabele',
    invoer: { default: '";alert(1)//' },
    verwacht: { bevat: ['";alert(1)//'] },
  },
  {
    module: 'xss_dom',
    level: 'high',
    naam: 'niet-gewhiteliste waarde valt terug op Nederlands',
    invoer: { default: 'PWNED' },
    verwacht: { bevat: ['Nederlands'], bevatNiet: ['PWNED'] },
  },
  {
    module: 'xss_dom',
    level: 'impossible',
    naam: 'niet-gewhiteliste waarde wordt niet weerspiegeld',
    invoer: { default: 'PWNED' },
    verwacht: { bevatNiet: ['PWNED'] },
  },

  // --- Authorization Bypass (GET) ---
  {
    module: 'authorization_bypass',
    level: 'low',
    naam: 'role=admin lekt de geheimen',
    invoer: { role: 'admin' },
    verwacht: { bevat: ['supersecret123', 'Admin Dashboard'] },
  },
  {
    module: 'authorization_bypass',
    level: 'low',
    naam: 'gewone gebruiker ziet geen geheimen',
    invoer: { role: 'user' },
    verwacht: { bevat: ['beperkte toegang'], bevatNiet: ['supersecret123'] },
  },
  {
    module: 'authorization_bypass',
    level: 'medium',
    naam: 'cookie_role=admin geeft toegang',
    invoer: { cookie_role: 'admin' },
    verwacht: { bevat: ['Admin Dashboard'] },
  },
  {
    module: 'authorization_bypass',
    level: 'high',
    naam: 'admin zonder geldig token wordt geweigerd',
    invoer: { role: 'admin' },
    verwacht: {
      bevat: ['Toegang geweigerd'],
      bevatNiet: ['supersecret123'],
      staWaarschuwing: true,
    },
  },
  {
    module: 'authorization_bypass',
    level: 'impossible',
    naam: 'role-parameter wordt genegeerd',
    invoer: { role: 'admin' },
    verwacht: { bevat: ['beperkte toegang', 'Gordon'], bevatNiet: ['supersecret123'] },
  },

  // --- CSRF (GET) ---
  {
    module: 'csrf',
    level: 'low',
    naam: 'wachtwoord wijzigen zonder token lukt',
    invoer: { password_new: 'hacked', password_conf: 'hacked' },
    verwacht: { bevat: ['succesvol gewijzigd'] },
  },
  {
    module: 'csrf',
    level: 'low',
    naam: 'niet-overeenkomende wachtwoorden worden geweigerd',
    invoer: { password_new: 'a', password_conf: 'b' },
    verwacht: { bevat: ['komen niet overeen'] },
  },
  {
    module: 'csrf',
    level: 'high',
    naam: 'een verzonnen token wordt geweigerd',
    invoer: { password_new: 'x', password_conf: 'x', user_token: 'BOGUS' },
    verwacht: { bevat: ['token ongeldig'] },
  },
  {
    module: 'csrf',
    level: 'high',
    naam: 'een gekopieerde link zonder token wordt geweigerd',
    invoer: { password_new: 'x', password_conf: 'x' },
    verwacht: { bevat: ['token ongeldig of ontbreekt'] },
  },
  {
    module: 'csrf',
    level: 'impossible',
    naam: 'juist huidig wachtwoord laat de wijziging toe',
    invoer: { password_current: 'password', password_new: 'nieuwpass', password_conf: 'nieuwpass' },
    verwacht: { bevat: ['succesvol gewijzigd'] },
  },
  {
    module: 'csrf',
    level: 'impossible',
    naam: 'fout huidig wachtwoord blokkeert de wijziging',
    invoer: { password_current: 'fout', password_new: 'nieuwpass', password_conf: 'nieuwpass' },
    verwacht: { bevat: ['Huidig wachtwoord onjuist'] },
  },

  // --- File Inclusion (GET) ---
  {
    module: 'file_inclusion',
    level: 'low',
    naam: 'pad naar /etc/passwd wordt getoond',
    invoer: { page: '../../etc/passwd' },
    verwacht: { bevat: ['root:x:0:0'] },
  },
  {
    module: 'file_inclusion',
    level: 'medium',
    naam: '....// omzeilt het ../-filter',
    invoer: { page: '....//passwords.txt' },
    verwacht: { bevat: ['admin:password123'] },
  },
  {
    module: 'file_inclusion',
    level: 'high',
    naam: 'pad zonder "file"-prefix wordt geweigerd',
    invoer: { page: '../../etc/passwd' },
    verwacht: { bevat: ['Toegang geweigerd'] },
  },
  {
    module: 'file_inclusion',
    level: 'high',
    naam: 'toegestaan bestand werkt',
    invoer: { page: 'file1.php' },
    verwacht: { bevat: ['Bestand 1'] },
  },
  {
    module: 'file_inclusion',
    level: 'impossible',
    naam: 'alles buiten de whitelist wordt geweigerd',
    invoer: { page: '../../etc/passwd' },
    verwacht: { bevat: ['whitelist'] },
  },

  // --- File Upload (POST) ---
  {
    module: 'file_upload',
    level: 'low',
    naam: 'php-shell wordt geaccepteerd',
    invoer: { filename: 'shell.php', filecontent: '<?php ?>' },
    verwacht: { bevat: ['PHP-bestand geüpload'] },
  },
  {
    module: 'file_upload',
    level: 'medium',
    naam: 'verboden mime-type wordt geweigerd',
    invoer: { filename: 'shell.php', filecontent: 'x', mimetype: 'application/php' },
    verwacht: { bevat: ['niet toegestaan'] },
  },
  {
    module: 'file_upload',
    level: 'medium',
    naam: 'vervalst image/jpeg glipt de .php erdoor',
    invoer: { filename: 'shell.php', filecontent: 'x', mimetype: 'image/jpeg' },
    verwacht: { bevat: ['PHP-extensie gedetecteerd'] },
  },
  {
    module: 'file_upload',
    level: 'high',
    naam: '.php-extensie wordt geweigerd',
    invoer: { filename: 'shell.php', filecontent: 'x' },
    verwacht: { bevat: ['niet toegestaan'] },
  },
  {
    module: 'file_upload',
    level: 'impossible',
    naam: '.jpg krijgt een veilige MD5-naam',
    invoer: { filename: 'foto.jpg', filecontent: 'x' },
    verwacht: { bevat: ['veilig opgeslagen'] },
  },
  {
    module: 'file_upload',
    level: 'impossible',
    naam: '.php-extensie blijft geweigerd',
    invoer: { filename: 'shell.php', filecontent: 'x' },
    verwacht: { bevat: ['niet toegestaan'] },
  },

  // --- Weak Session IDs (POST) — vorm-asserts op tijd/willekeur ---
  {
    module: 'weak_session_ids',
    level: 'medium',
    naam: 'sessie-ID is een Unix-timestamp',
    invoer: { generate: '1' },
    verwacht: { bevat: ['Unix timestamp'], regex: [/\d{10}/] },
  },
  {
    module: 'weak_session_ids',
    level: 'high',
    naam: 'sessie-ID is een 32-hex MD5',
    invoer: { generate: '1' },
    verwacht: { regex: [/[0-9a-f]{32}/] },
  },
  {
    module: 'weak_session_ids',
    level: 'impossible',
    naam: 'sessie-ID is 64 hex (256-bit random)',
    invoer: { generate: '1' },
    verwacht: { regex: [/[0-9a-f]{64}/] },
  },

  // --- CSP Bypass (POST) — smoke + escaping ---
  {
    module: 'csp_bypass',
    level: 'low',
    naam: 'externe URL wordt zonder CSP opgenomen',
    invoer: { include: 'https://evil.nl/x.js' },
    verwacht: { bevat: ['Script opgenomen van', 'https://evil.nl/x.js'] },
  },
  {
    module: 'csp_bypass',
    level: 'medium',
    naam: 'unsafe-inline laat inline scripts toe',
    invoer: { include: 'x' },
    verwacht: { bevat: ['unsafe-inline'] },
  },
  {
    module: 'csp_bypass',
    level: 'high',
    naam: 'nonce wordt willekeurig gegenereerd',
    invoer: { include: 'x' },
    verwacht: { bevat: ['nonce-'], regex: [/nonce-[A-Za-z0-9+/=]+/] },
  },
  {
    module: 'csp_bypass',
    level: 'impossible',
    naam: 'alle externe verzoeken geblokkeerd',
    invoer: { include: 'x' },
    verwacht: { bevat: ['geblokkeerd'] },
  },

  // --- JavaScript Attacks (POST) ---
  {
    module: 'javascript_attacks',
    level: 'low',
    naam: 'omgekeerd woord is een geldig token',
    invoer: { phrase: 'success', token: strrev('success') },
    verwacht: { bevat: ['Gefeliciteerd'] },
  },
  {
    module: 'javascript_attacks',
    level: 'low',
    naam: 'fout token faalt',
    invoer: { phrase: 'success', token: 'xxx' },
    verwacht: { bevat: ['Ongeldig'] },
  },
  {
    module: 'javascript_attacks',
    level: 'medium',
    naam: 'ROT13 van het woord is een geldig token',
    invoer: { phrase: 'success', token: rot13('success') },
    verwacht: { bevat: ['Correct'] },
  },
  {
    module: 'javascript_attacks',
    level: 'high',
    naam: 'zelf berekende SHA-256 is een geldig token',
    invoer: { phrase: 'success', token: sha256('XXSUCCESSXX') },
    verwacht: { bevat: ['Correct'] },
  },
  {
    module: 'javascript_attacks',
    level: 'impossible',
    naam: 'zonder de geheime sleutel faalt het token',
    invoer: { phrase: 'success', token: sha256('XXSUCCESSXX') },
    verwacht: { bevat: ['de geheime sleutel is server-side'] },
  },
  {
    module: 'javascript_attacks',
    level: 'impossible',
    naam: 'het server-side HMAC-token klopt wél',
    invoer: { phrase: 'success', token: hmac('success') },
    verwacht: { bevat: ['server-side gevalideerd'] },
  },
];

// Elke test krijgt een verse php-wasm-instantie (± 100 ms): een schoon
// bestandssysteem en schone PHP-globals, zodat geen enkele case naar de
// volgende lekt (csrf overschrijft admins wachtwoord, sessie-tellers tellen op,
// en php-wasm bewaart waarschuwingen tussen runs).
let php: Awaited<ReturnType<typeof createPhp>>;

async function draai(module: string, level: string, invoer: Record<string, string>) {
  const config = MODULES[module][level];
  const get = config.method === 'GET' ? invoer : {};
  const post = config.method === 'POST' ? invoer : {};
  return execPhp(php, config.php, get, post);
}

/** Een lab-run mag geen PHP-fout of lege uitvoer geven. */
function verifieerSchoon(uit: string, waar: string, staWaarschuwing = false) {
  expect(uit, `${waar}: PHP-fatal`).not.toMatch(/Fatal error|Parse error|Uncaught/i);
  if (!staWaarschuwing) {
    expect(uit, `${waar}: PHP-waarschuwing`).not.toMatch(/\bWarning:|\bNotice:|\bDeprecated:/);
  }
  expect(uit.trim().length, `${waar}: lege uitvoer`).toBeGreaterThan(0);
}

describe('DVWA-labs draaien de kwetsbare PHP echt', () => {
  beforeEach(async () => {
    php = await createPhp(async () => {
      const { PhpNode } = await import('php-wasm/PhpNode.mjs');
      return new PhpNode();
    });
  }, 60_000);

  it.each(GEVALLEN)('$module/$level — $naam', async (g) => {
    const uit = await draai(g.module, g.level, g.invoer);
    verifieerSchoon(uit, `${g.module}/${g.level}`, g.verwacht.staWaarschuwing);
    for (const s of g.verwacht.bevat ?? []) expect(uit, g.naam).toContain(s);
    for (const s of g.verwacht.bevatNiet ?? []) expect(uit, g.naam).not.toContain(s);
    for (const r of g.verwacht.regex ?? []) expect(uit, g.naam).toMatch(r);
  });

  it('csrf/high accepteert het echte token uit het formulier, maar eenmalig', async () => {
    // Het formulier rendert een vers token; dat token mag de wijziging doorvoeren.
    const render = await draai('csrf', 'high', {});
    verifieerSchoon(render, 'csrf/high render');
    const m = render.match(/name="user_token" value="([0-9a-f]+)"/);
    expect(m, 'token in het formulier').not.toBeNull();
    const token = (m as RegExpMatchArray)[1];

    const eerste = await draai('csrf', 'high', {
      password_new: 'nieuw',
      password_conf: 'nieuw',
      user_token: token,
    });
    verifieerSchoon(eerste, 'csrf/high submit');
    expect(eerste).toContain('token gevalideerd');

    // Hetzelfde token nog eens indienen faalt: het is opgebruikt.
    const nogmaals = await draai('csrf', 'high', {
      password_new: 'nieuw2',
      password_conf: 'nieuw2',
      user_token: token,
    });
    verifieerSchoon(nogmaals, 'csrf/high hergebruik');
    expect(nogmaals).toContain('token ongeldig');
  });

  it('weak_session_ids/low telt de sessie-IDs op: 1, dan 2', async () => {
    const eerste = await draai('weak_session_ids', 'low', { generate: '1' });
    const tweede = await draai('weak_session_ids', 'low', { generate: '1' });
    verifieerSchoon(eerste, 'weak_session_ids/low #1');
    verifieerSchoon(tweede, 'weak_session_ids/low #2');
    expect(eerste).toContain('<b>1</b>');
    expect(tweede).toContain('<b>2</b>');
  });

  it('brute_force/impossible vergrendelt na 3 foute pogingen', async () => {
    for (let i = 0; i < 3; i++) {
      await draai('brute_force', 'impossible', { username: 'admin', password: 'fout' });
    }
    // Zelfs met het juiste wachtwoord blijft het account nu geblokkeerd.
    const naLockout = await draai('brute_force', 'impossible', {
      username: 'admin',
      password: 'password',
    });
    verifieerSchoon(naLockout, 'brute_force/impossible');
    expect(naLockout).toContain('vergrendeld');
  });

  it('brute_force/impossible laat een juiste inlog toe zonder eerdere fouten', async () => {
    const uit = await draai('brute_force', 'impossible', {
      username: 'admin',
      password: 'password',
    });
    verifieerSchoon(uit, 'brute_force/impossible');
    expect(uit).toContain('Welkom, admin');
  });
});
