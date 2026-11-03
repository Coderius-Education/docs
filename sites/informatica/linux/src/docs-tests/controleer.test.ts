import { spawnSync } from 'node:child_process';
import {
  chmodSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITES_BY_ID } from '@coderius/shared/sites';
import { createSlugger } from '@docusaurus/utils';
import { describe, expect, it } from 'vitest';

// static/controleer.sh kijkt de eigen Ubuntu van een leerling na, per thema
// met WSL-lessen (5, 6 en 7). Deze test eist:
// - de basis-URL is die van de registry, en elke link wijst naar een les en
//   een kop die erop staat;
// - op een computer waar alles klopt, geeft elk thema alleen ✓ en exit 0;
// - op een computer waar alles misgaat, geeft elke controle een ✗ en exit 1;
// - een onbekend thema geeft exit 2.
// De computer is nagebouwd: eigen versies van man, id, ps, systemctl, curl
// en ssh in PATH, en een eigen thuismap.

const SITE = fileURLToPath(new URL('../..', import.meta.url));
const SCRIPT = join(SITE, 'static', 'controleer.sh');
const TEKST = readFileSync(SCRIPT, 'utf8');

/** De ankers van de koppen op een pagina, zoals Docusaurus ze maakt. */
function ankers(tekst: string): string[] {
  const slugger = createSlugger();
  const uit: string[] = [];
  let inCode = false;
  for (const regel of tekst.split('\n')) {
    if (/^\s*```/.test(regel)) inCode = !inCode;
    if (inCode) continue;
    const m = regel.match(/^#{1,6}\s+(.*?)\s*$/);
    if (!m) continue;
    const vast = m[1].match(/\\?\{#([^}]+)\}$/);
    if (vast) {
      uit.push(vast[1]);
      continue;
    }
    uit.push(slugger.slug(m[1].replace(/[`*_]/g, '').trim()));
  }
  return uit;
}

type Stand = 'goed' | 'fout';

/** Een nagebouwde computer: een map met commando's en een thuismap. */
function computer(stand: Stand) {
  const map = mkdtempSync(join(tmpdir(), `controleer-${stand}-`));
  const bin = join(map, 'bin');
  const thuis = join(map, 'thuis');
  mkdirSync(bin);
  mkdirSync(join(thuis, '.ssh'), { recursive: true });
  const goed = stand === 'goed';
  const stub = (naam: string, inhoud: string) => {
    writeFileSync(join(bin, naam), `#!/bin/bash\n${inhoud}\n`);
    chmodSync(join(bin, naam), 0o755);
  };
  stub('man', `exit ${goed ? 0 : 1}`);
  stub('id', `echo "${goed ? 'sam adm sudo' : 'sam klas'}"`);
  stub('ps', `echo "${goed ? 'systemd' : 'init'}"`);
  // goed: nginx en ssh staan uit; fout: ze staan aan.
  stub('systemctl', `exit ${goed ? 3 : 0}`);
  stub('curl', `exit ${goed ? 0 : 6}`);
  stub(
    'ssh',
    goed
      ? `echo "Hi sam! You've successfully authenticated, but GitHub does not provide shell access." >&2; exit 1`
      : `echo "git@github.com: Permission denied (publickey)." >&2; exit 255`,
  );
  if (goed) {
    stub('cowsay', 'exit 0');
    writeFileSync(join(thuis, '.bashrc'), 'echo "Welkom terug, $USER"\n');
    writeFileSync(join(thuis, '.ssh', 'id_ed25519'), 'geheim\n');
    chmodSync(join(thuis, '.ssh', 'id_ed25519'), 0o600);
    writeFileSync(join(thuis, '.ssh', 'id_ed25519.pub'), 'ssh-ed25519 AAAA sam@laptop\n');
  } else {
    writeFileSync(join(thuis, '.bashrc'), 'if [ 1 ]; then\n');
  }
  writeFileSync(
    join(map, 'os-release'),
    goed ? 'NAME="Ubuntu"\nVERSION_ID="24.04"\n' : 'NAME="Ubuntu"\nVERSION_ID="22.04"\n',
  );
  writeFileSync(
    join(map, 'version'),
    goed ? 'Linux version 6.6.87.2-microsoft-standard-WSL2\n' : 'Linux version 6.8.0-generic\n',
  );
  return { map, bin, thuis };
}

function draai(stand: Stand, thema: string) {
  const { map, bin, thuis } = computer(stand);
  const r = spawnSync('bash', [SCRIPT, thema], {
    cwd: thuis,
    encoding: 'utf8',
    env: {
      PATH: `${bin}:/usr/bin:/bin`,
      HOME: thuis,
      USER: 'sam',
      // Een map van Windows bij "fout".
      CONTROLEER_WERKMAP: stand === 'goed' ? thuis : '/mnt/c/Users/sam',
      CONTROLEER_OS_RELEASE: join(map, 'os-release'),
      CONTROLEER_PROC_VERSION: join(map, 'version'),
    },
  });
  return { uit: r.stdout, code: r.status };
}

const THEMAS = { '5': 4, '6': 5, '7': 4 } as const;

describe('controleer.sh', () => {
  it('de basis-URL is die van de registry', () => {
    const cursus = TEKST.match(/^CURSUS="([^"]+)"$/m)?.[1];
    expect(`${cursus}/`).toBe(SITES_BY_ID.linux.url);
  });

  it('elke link wijst naar een les en een kop die erop staat', () => {
    const links = [...TEKST.matchAll(/^\s+"(docs\/[^"#]+)#([^"]+)"/gm)];
    expect(links.length).toBeGreaterThan(10);
    const fout: string[] = [];
    for (const [, pad, anker] of links) {
      const bestand = join(SITE, `${pad}.mdx`);
      if (!existsSync(bestand)) fout.push(`geen pagina ${pad}`);
      else if (!ankers(readFileSync(bestand, 'utf8')).includes(anker))
        fout.push(`geen kop #${anker} op ${pad}`);
    }
    expect(fout).toEqual([]);
  });

  it.each(Object.entries(THEMAS))('thema %s: alles goed geeft alleen ✓', (thema, aantal) => {
    const { uit, code } = draai('goed', thema);
    expect(uit, uit).not.toContain('✗');
    expect(uit.match(/^✓/gm)?.length ?? 0).toBeGreaterThanOrEqual(aantal);
    expect(uit).toContain('Alles klopt.');
    expect(code).toBe(0);
  });

  it.each(Object.entries(THEMAS))(
    'thema %s: alles fout geeft bij elke controle een ✗',
    (thema, aantal) => {
      const { uit, code } = draai('fout', thema);
      expect(uit, uit).not.toMatch(/^✓/m);
      expect(uit.match(/^✗/gm)?.length).toBe(aantal);
      expect(uit).toContain(`Zie ${SITES_BY_ID.linux.url}docs/`);
      expect(code).toBe(1);
    },
  );

  it('een onbekend thema geeft uitleg en exit 2', () => {
    const { uit, code } = draai('goed', '4');
    expect(uit).toContain('bash controleer.sh 5, 6 of 7');
    expect(code).toBe(2);
  });

  it('de startpagina linkt naar het script, met de baseUrl, en noemt elk thema', () => {
    const start = readFileSync(join(SITE, 'docs', 'index.mdx'), 'utf8');
    expect(start).toContain("useBaseUrl('/controleer.sh')");
    for (const thema of Object.keys(THEMAS)) expect(start).toContain(`bash controleer.sh ${thema}`);
  });

  it('de laatste les van elk WSL-thema wijst naar het script', () => {
    for (const les of ['wsl/variabelen', 'wsl/groepen', 'wsl/tunnel']) {
      const tekst = readFileSync(join(SITE, 'docs', `${les}.mdx`), 'utf8');
      expect(tekst, les).toMatch(/:::tip\[Controleer je Ubuntu\]\n.*bash controleer\.sh \d/);
    }
  });
});
