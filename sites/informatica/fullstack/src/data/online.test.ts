import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import sidebars from '../../sidebars';

// De route Online zetten (docs/online/, eigen sidebar en navbar-link): eerst
// het project klaar op de laptop, dan Docker in WSL, dan dezelfde bestanden
// op een server, en Portainer als extra. Hij legt geen Linux uit maar linkt
// naar de Linux-cursus (site linux). Deze test bewaakt:
// - de sidebar noemt elke les één keer, met een map per categorie;
// - elke les heeft één controlevraag vóór de opdrachten, een Er gaat iets
//   mis, bij elke opdracht een antwoord, en linkt aan het eind naar de
//   volgende;
// - de keten van Docker past op elkaar: de poort van fastapi run, het label
//   van Traefik en de ports van Compose zijn gelijk, het volume hangt op
//   WORKDIR plus data, en USER komt na het maken van de map data;
// - Docker zet een gepubliceerde poort open langs ufw. Daarom publiceert geen
//   container in de route een poort op internet, behalve Traefik op 80 en
//   443, en heeft een container die X-Forwarded-For van iedereen gelooft geen
//   ports;
// - Traefik ouder dan v3.6 praat niet met Docker 29 (client version 1.24 is
//   too old), dus elk image van Traefik is traefik:v3;
// - geen bash-blok gooit volumes weg of draait docker met sudo;
// - de volgorde op de server: ssh alleen met een sleutel en de firewall vóór
//   de site, de deploy key vóór git clone;
// - een IP-adres is een adres van de computer zelf (127.0.0.0/8), 0.0.0.0, een
//   adres van Docker uit
//   172.16.0.0/12 of een voorbeeldadres uit 203.0.113.0/24 (RFC 5737).

const DOCS = fileURLToPath(new URL('../../docs', import.meta.url));
const ONLINE = join(DOCS, 'online');

type Categorie = { type: 'category'; label: string; items: string[] };
const route = sidebars.onlineSidebar as unknown as (string | Categorie)[];
const delen = route.filter((i): i is Categorie => typeof i !== 'string');
const lessen = delen.flatMap((c) => c.items);

const bestanden = (map: string): string[] =>
  readdirSync(map).flatMap((naam) => {
    const pad = join(map, naam);
    if (statSync(pad).isDirectory()) return bestanden(pad);
    return naam.endsWith('.mdx') ? [pad] : [];
  });
const idVan = (pad: string) =>
  relative(DOCS, pad)
    .split('\\')
    .join('/')
    .replace(/\.mdx$/, '');
const lees = (id: string) => readFileSync(join(DOCS, `${id}.mdx`), 'utf8');
const blokken = (id: string, taal: string) =>
  [...lees(id).matchAll(new RegExp(`\`\`\`${taal}\\n([\\s\\S]*?)\`\`\``, 'g'))].map((m) => m[1]);
const alleBlokken = (taal: string) => lessen.flatMap((id) => blokken(id, taal));

describe('de route Online zetten', () => {
  it('de sidebar begint bij de startpagina en noemt elke les één keer, met een map per categorie', () => {
    expect(route[0]).toBe('online/index');
    expect([...lessen, 'online/index'].sort()).toEqual(bestanden(ONLINE).map(idVan).sort());
    expect(delen.map((d) => [...new Set(d.items.map((id) => id.split('/')[1]))])).toEqual([
      ['project'],
      ['docker'],
      ['server'],
      ['extra'],
    ]);
  });

  it('geen les heet zoals zijn map (server/server.mdx kreeg het adres van de map, en vier links braken)', () => {
    const dubbel = lessen.filter((id) => {
      const delen = id.split('/');
      return delen.at(-1) === delen.at(-2);
    });
    expect(dubbel).toEqual([]);
  });

  it('geen les heet readme of index: Docusaurus maakt daar de pagina van de map van', () => {
    // De les over de README heette eerst project/readme.mdx, en kwam op
    // /docs/online/project/ terecht, zodat elke link ernaar brak.
    expect(lessen.filter((id) => /^(readme|index)$/i.test(id.split('/').at(-1) ?? ''))).toEqual([]);
  });

  it('elke les: één controlevraag vóór de opdrachten, Er gaat iets mis, en een antwoord per opdracht', () => {
    const fout: string[] = [];
    for (const id of lessen) {
      const tekst = lees(id);
      const opdrachten = tekst.indexOf('\n## Opdrachten');
      const vragen = [...tekst.matchAll(/<Voorspel soort="Controlevraag"/g)];
      if (vragen.length !== 1 || (vragen[0].index ?? 0) > opdrachten)
        fout.push(`${id}: controlevraag`);
      if (!tekst.includes('\n## Er gaat iets mis\n')) fout.push(`${id}: Er gaat iets mis`);
      const blokken = tekst.slice(opdrachten).split('\n### Opdracht ').slice(1);
      if (blokken.length === 0) fout.push(`${id}: geen opdracht`);
      blokken.forEach((blok, i) => {
        if (!blok.startsWith(`${i + 1}: `))
          fout.push(`${id}: opdracht ${i + 1} heeft een ander nummer`);
        if (!blok.includes('<summary>Antwoord</summary>'))
          fout.push(`${id}: opdracht ${i + 1} zonder antwoord`);
      });
    }
    expect(fout).toEqual([]);
  });

  it('het nummer in de sidebar is de plek in de route', () => {
    const fout = lessen.filter((id, i) => !lees(id).includes(`sidebar_label: '${i + 1}. `));
    expect(fout).toEqual([]);
  });

  it('elke les linkt aan het eind naar de volgende, en de laatste naar de controlelijst van Veiligheid', () => {
    const fout: string[] = [];
    lessen.forEach((id, i) => {
      const laatste = lees(id).trim().split('\n').pop() ?? '';
      const doel = lessen[i + 1] ?? 'veiligheid/eigen-project';
      if (!laatste.includes(`(site:fullstack/docs/${doel})`)) fout.push(`${id}: "${laatste}"`);
    });
    expect(fout).toEqual([]);
  });

  it('Linux en git staan in hun eigen cursus: de startpagina noemt ze allebei', () => {
    expect(lees('online/index')).toContain('(site:linux/docs)');
    expect(lees('online/index')).toContain('(site:linux/docs/wsl/installeren)');
    expect(lees('online/index')).toContain('(site:editor/git)');
  });

  // De route legt geen Linux en geen git uit. Een commando dat een leerling
  // voor het eerst typt, moet dus een link hebben naar de les die het
  // uitlegt: in die les of een les ervoor, als <Voorkennis>-item of als
  // site:-link. Eerst gebruikten requirements (git commit en push), image
  // (cd), traefik (mkdir en nano) en nieuwe-versie (git pull) een commando
  // zonder link.
  const BRONNEN: { commando: RegExp; doel: string[] }[] = [
    { commando: /^git (add|commit)\b/, doel: ['editor/git/basis/'] },
    { commando: /^git push\b/, doel: ['editor/git/push/'] },
    { commando: /^git (clone|pull)\b/, doel: ['editor/git/pull-clone/'] },
    { commando: /^sudo apt\b/, doel: ['linux/docs/wsl/apt'] },
    { commando: /^(sudo )?nano\b/, doel: ['linux/docs/wsl/nano'] },
    { commando: /^(sudo )?(systemctl|journalctl)\b/, doel: ['linux/docs/wsl/diensten'] },
    { commando: /^(ssh|ssh-keygen)\b/, doel: ['linux/docs/wsl/ssh'] },
    { commando: /^(cd|ls)\b/, doel: ['linux/docs/terminal/mappen'] },
    { commando: /^mkdir\b/, doel: ['linux/docs/terminal/maken'] },
    { commando: /^cat\b/, doel: ['linux/docs/terminal/bestanden-lezen'] },
    { commando: /^code \./, doel: ['linux/docs/wsl/windows-en-linux'] },
  ];
  const linksVan = (id: string) => {
    const tekst = lees(id);
    return [
      ...[...tekst.matchAll(/site: '([a-z]+)', to: '\/([^']+)'/g)].map((m) => `${m[1]}/${m[2]}`),
      ...[...tekst.matchAll(/\(site:([a-z]+\/[^)#\s]+)/g)].map((m) => m[1]),
    ];
  };
  it.each(BRONNEN)(
    '$commando: de eerste les die het gebruikt, of een les ervoor, linkt naar de uitleg',
    ({ commando, doel }) => {
      const regels = (id: string) =>
        ['bash', 'powershell'].flatMap((taal) => blokken(id, taal).join('\n').split('\n'));
      const eerste = lessen.findIndex((id) => regels(id).some((r) => commando.test(r)));
      expect(eerste, 'geen les gebruikt dit commando').toBeGreaterThan(-1);
      const links = lessen.slice(0, eerste + 1).flatMap(linksVan);
      expect(
        links.some((l) => doel.some((d) => l.startsWith(d))),
        `${lessen[eerste]} gebruikt het eerst, zonder link naar ${doel.join(' of ')}`,
      ).toBe(true);
    },
  );
});

describe('links en codeblokken', () => {
  // Een linktekst noemt de les waar hij uitkomt: de titel uit de sidebar of
  // de H1, of 'les N'. "Wat er in je map staat" kwam uit op de les over
  // .gitignore, terwijl een andere les zo heet.
  const titels = (pad: string) => {
    const kandidaten = [`${pad}.mdx`, `${pad}.md`, `${pad}/index.mdx`, `${pad}/index.md`];
    const bestand = kandidaten
      .map((k) => join(DOCS, k))
      .find((k) => {
        try {
          return statSync(k).isFile();
        } catch {
          return false;
        }
      });
    if (!bestand) return [];
    const tekst = readFileSync(bestand, 'utf8');
    const label = tekst.match(/^sidebar_label: '(?:\d+\. )?(.*)'$/m)?.[1] ?? '';
    const h1 = tekst.match(/^# (.*)$/m)?.[1] ?? '';
    return [label, h1].map((t) => t.toLowerCase());
  };

  it('een linktekst naar een les van de cursus noemt die les', () => {
    const fout: string[] = [];
    for (const id of ['online/index', ...lessen]) {
      for (const m of lees(id).matchAll(/\[([^\]]+)\]\(site:fullstack\/docs\/([^)#]+)/g)) {
        const tekst = m[1].toLowerCase();
        if (/^les \d+/.test(tekst)) continue;
        if (!titels(m[2]).some((t) => t.includes(tekst))) fout.push(`${id}: [${m[1]}] -> ${m[2]}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('een commando voor PowerShell staat in een powershell-blok, niet in bash', () => {
    const fout = lessen.filter((id) =>
      blokken(id, 'bash').some((b) => /Out-File|\$env:|^\.\\/m.test(b)),
    );
    expect(fout).toEqual([]);
  });
});

describe('vanaf les 5 werk je alleen in WSL', () => {
  // De doorloop van november 2026 vond dat les 5 liet klonen en pushen vanuit
  // Ubuntu zonder git daar klaar te zetten: een verse git weigert de eerste
  // commit (Author identity unknown), en GitHub laat over https niet inloggen
  // met een wachtwoord. Les 7 vroeg daarna te testen met fastapi dev, dat in
  // Ubuntu niet geinstalleerd is.
  it('les 5 zet git klaar: naam, e-mail, een ssh-sleutel op GitHub, en klonen met ssh', () => {
    const regels = blokken('online/docker/image', 'bash').join('\n');
    expect(regels).toContain('git config --global user.name');
    expect(regels).toContain('git config --global user.email');
    expect(regels).toContain('ssh -T git@github.com');
    expect(regels).toMatch(/^git clone git@github\.com:/m);
    expect(regels).not.toMatch(/^git clone https:/m);
  });

  it('les 1 speelt op Windows: 127.0.0.1 openen, de firewall vóór de opdrachten, de melding van Windows', () => {
    // De doorloop vond: geen adres om te openen (de terminal toont 0.0.0.0),
    // het firewallvenster pas onder Er gaat iets mis, en de melding van Linux.
    const tekst = lees('online/project/dev-of-run');
    const opdrachten = tekst.indexOf('## Opdrachten');
    expect(tekst.indexOf('Open je site op `http://127.0.0.1:8000`')).toBeGreaterThan(-1);
    expect(tekst.indexOf('Annuleren')).toBeLessThan(tekst.indexOf('<Voorspel'));
    expect(tekst.indexOf('Annuleren')).toBeLessThan(opdrachten);
    expect(tekst).toContain('[Errno 10048]');
    expect(tekst).not.toContain('[Errno 98]');
  });

  it('les 5 legt de waarschuwing van pip uit, die tegen een image zonder venv in gaat', () => {
    // Bij RUN python -m pip install zegt pip: use a virtual environment
    // instead. De les zei twee alinea's eerder dat dat niet nodig is.
    expect(lees('online/docker/image')).toContain("WARNING: Running pip as the 'root' user");
  });

  it('na les 4 start geen codeblok de site nog met fastapi dev', () => {
    const fout = lessen
      .slice(lessen.indexOf('online/docker/image'))
      .filter((id) => blokken(id, 'bash').some((b) => /^fastapi dev\b/m.test(b)));
    expect(fout).toEqual([]);
  });
});

describe('de keten van Docker', () => {
  const dockerfile = () => {
    const laatste = blokken('online/docker/niet-als-root', 'dockerfile').find((b) =>
      b.startsWith('FROM '),
    );
    if (!laatste) throw new Error('geen hele Dockerfile in niet-als-root');
    return laatste;
  };

  it('de hele Dockerfile in niet-als-root bouwt op die van les 5, met USER na de map data', () => {
    const eerste = blokken('online/docker/image', 'dockerfile')[0];
    const hele = dockerfile();
    for (const regel of eerste.split('\n').filter(Boolean)) expect(hele).toContain(regel);
    expect(hele).toMatch(/^RUN useradd --system app && mkdir data && chown app data\nUSER app$/m);
    expect(hele.indexOf('USER app')).toBeGreaterThan(hele.indexOf('COPY . .'));
  });

  it('de container luistert op 0.0.0.0 en overal op dezelfde poort', () => {
    const cmd = dockerfile().match(/^CMD \[(.*)\]$/m)?.[1] ?? '';
    expect(cmd).not.toContain('--host');
    const poort = cmd.match(/"--port", "(\d+)"/)?.[1];
    expect(poort).toBeDefined();
    const yaml = alleBlokken('yaml').join('\n');
    for (const m of yaml.matchAll(/loadbalancer\.server\.port=(\d+)/g)) expect(m[1]).toBe(poort);
    for (const m of yaml.matchAll(/- "127\.0\.0\.1:(\d+):(\d+)"/g)) {
      if (m[2] !== '9443') expect(m[2]).toBe(poort);
    }
  });

  it('het volume hangt op WORKDIR plus de map data uit main.py', () => {
    const werkmap = dockerfile().match(/^WORKDIR (\S+)$/m)?.[1];
    expect(lees('online/docker/niet-als-root')).toContain('os.makedirs("data", exist_ok=True)');
    const doel = `${werkmap}/data`;
    expect(lees('online/docker/volume')).toContain(`-v gastenboek-data:${doel} `);
    for (const id of ['online/docker/compose', 'online/docker/traefik']) {
      expect(blokken(id, 'yaml').join('\n'), id).toContain(`- data:${doel}`);
    }
    const negeer = blokken('online/docker/niet-als-root', 'text').find((b) => b.includes('.venv'));
    expect(negeer).toContain('data/');
  });

  it('geen container publiceert een poort op internet, behalve Traefik op 80 en 443', () => {
    // Docker zet een gepubliceerde poort open vóór de regels van ufw.
    const fout: string[] = [];
    for (const id of lessen) {
      for (const blok of blokken(id, 'yaml')) {
        for (const m of blok.matchAll(/^\s+- "([^"]+)"$/gm)) {
          const poort = m[1];
          if (/^\d+:\d+$/.test(poort) && !['80:80', '443:443'].includes(poort))
            fout.push(`${id}: ${poort}`);
          if (/^(80|443):/.test(poort) && !blok.includes('image: traefik:'))
            fout.push(`${id}: ${poort} zonder Traefik`);
        }
      }
    }
    expect(fout).toEqual([]);
  });

  it('wie X-Forwarded-For van iedereen gelooft, heeft geen ports', () => {
    const blokkenMet = alleBlokken('yaml').filter((b) => b.includes('FORWARDED_ALLOW_IPS=*'));
    expect(blokkenMet.length).toBeGreaterThan(0);
    for (const b of blokkenMet) expect(b).not.toMatch(/^\s+ports:/m);
  });

  it('Traefik is overal traefik:v3', () => {
    const images = [
      ...alleBlokken('yaml')
        .join('\n')
        .matchAll(/image: (traefik:\S+)/g),
    ].map((m) => m[1]);
    expect(images.length).toBeGreaterThan(0);
    expect([...new Set(images)]).toEqual(['traefik:v3']);
  });

  it('de domeinnaam komt op de server uit .env, met gastenboek.localhost als standaard', () => {
    const site = lees('online/server/site');
    expect(site).toContain('Host(`${DOMEIN:-gastenboek.localhost}`)');
    expect(site).toContain('echo "DOMEIN=gastenboek.voorbeeld.nl" > .env');
    expect(blokken('online/docker/traefik', 'yaml').join('\n')).toContain(
      'Host(`gastenboek.localhost`)',
    );
  });

  it('dezelfde pakketten in WSL en op de server', () => {
    const regel = 'sudo apt install docker.io docker-compose-v2 docker-buildx git';
    expect(lees('online/docker/installeren')).toContain(regel);
    expect(lees('online/server/site')).toContain(regel);
  });

  it('geen bash-blok gooit volumes weg of draait docker met sudo', () => {
    const fout: string[] = [];
    for (const id of lessen) {
      for (const regel of blokken(id, 'bash').join('\n').split('\n')) {
        if (/^sudo docker\b/.test(regel)) fout.push(`${id}: ${regel}`);
        if (/down -v|volume prune|--volumes|volume rm/.test(regel)) fout.push(`${id}: ${regel}`);
      }
    }
    expect(fout).toEqual([]);
  });
});

describe('de server', () => {
  it('ssh alleen met een sleutel en de firewall staan vóór de site', () => {
    // Eerst stond de sleutel pas in de les na het huren: die hele les kon je
    // met het wachtwoord van sam inloggen, terwijl een 50-cloud-init.conf dat
    // toestond.
    const huren = lees('online/server/huren');
    const sleutel = huren.indexOf('PasswordAuthentication no');
    expect(sleutel).toBeGreaterThan(huren.indexOf('usermod -aG sudo sam'));
    expect(lees('online/server/dichtzetten')).not.toContain('PasswordAuthentication');
    expect(lessen.indexOf('online/server/dichtzetten')).toBeLessThan(
      lessen.indexOf('online/server/site'),
    );
  });

  it('de firewall laat ssh door voordat hij aangaat', () => {
    const tekst = lees('online/server/dichtzetten');
    const ssh = tekst.indexOf('sudo ufw allow OpenSSH');
    expect(ssh).toBeGreaterThan(-1);
    expect(ssh).toBeLessThan(tekst.indexOf('sudo ufw enable'));
  });

  it('de deploy key komt vóór git clone', () => {
    const site = lees('online/server/site');
    expect(site.indexOf('Deploy keys')).toBeGreaterThan(-1);
    expect(site.indexOf('Deploy keys')).toBeLessThan(site.indexOf('git clone git@github.com'));
  });

  it('wat alleen op de server staat, gaat mee in de back-up', () => {
    // Les 15 zei: werk nooit op de server. Toch maken les 13, 14 en 18 daar
    // .env, ~/traefik en ~/portainer, en die staan nergens in git.
    const backup = blokken('online/server/backup', 'bash').join('\n');
    expect(backup).toContain('cp ~/gastenboek/.env ~/backup/');
    expect(backup).toContain('cp -r ~/traefik ~/backup/');
    expect(lees('online/extra/portainer')).toContain('cp -r ~/portainer ~/backup/');
    const script = blokken('online/extra/nachtelijke-backup', 'bash').join('\n');
    expect(script).toContain('cp ~/gastenboek/.env "$MAP"');
    expect(script).toContain('cp -r ~/traefik "$MAP"');
  });

  it('wie een back-up terugzet, geeft de databases terug aan app', () => {
    // docker compose cp zet bestanden in een container als root. De site
    // draait als app, leest ze wel en geeft bij schrijven een 500:
    // sqlite3.OperationalError: attempt to write a readonly database.
    const fout: string[] = [];
    for (const id of lessen) {
      for (const blok of blokken(id, 'bash')) {
        const regels = blok.split('\n');
        const terug = regels.findIndex((r) => /^docker compose cp \S+ gastenboek:/.test(r));
        if (terug === -1) continue;
        const chown = regels.findIndex((r) =>
          r.includes('docker compose exec -u root gastenboek chown -R app /app/data'),
        );
        if (chown < terug) fout.push(`${id}: ${regels[terug]}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('Docker krijgt een grens aan de logboeken voordat de eerste container op de server start', () => {
    // Zonder grens groeit het logboek van elke container tot de schijf vol is,
    // en local geldt alleen voor containers die Docker daarna maakt.
    const site = lees('online/server/site');
    expect(blokken('online/server/site', 'json').join('\n')).toMatch(/"log-driver": "local"/);
    const grens = site.indexOf('sudo systemctl restart docker');
    expect(grens).toBeGreaterThan(-1);
    expect(grens).toBeLessThan(site.indexOf('docker compose up -d'));
    expect(grens).toBeLessThan(site.indexOf('docker network create'));
  });

  it('de healthcheck gebruikt python, want python:3.13-slim heeft geen curl', () => {
    const yaml = blokken('online/server/nieuwe-versie', 'yaml').join('\n');
    expect(yaml).toContain('healthcheck:');
    expect(yaml).toContain('"CMD", "python", "-c"');
    expect(alleBlokken('yaml').join('\n')).not.toMatch(/healthcheck:[\s\S]*?curl/);
  });

  it('bijwerken haalt het nieuwste basisimage op', () => {
    // Zonder --pull bouwt docker build op het Python-image dat al op de
    // server staat, en unattended-upgrades werkt alleen Ubuntu bij.
    const bash = blokken('online/server/bijwerken', 'bash').join('\n');
    expect(bash).toContain('docker compose build --pull');
    expect(bash).toContain('docker compose pull');
  });

  it('het back-upscript start de site ook als het kopiëren misgaat', () => {
    const script = blokken('online/extra/nachtelijke-backup', 'bash').find((b) =>
      b.includes('docker compose stop'),
    );
    if (!script) throw new Error('geen back-upscript');
    expect(script).not.toMatch(/^set -e/m);
    expect(script.indexOf('docker compose start')).toBeGreaterThan(
      script.indexOf('docker compose cp'),
    );
    expect(script).toMatch(/tail -n \+8/);
    const cron = blokken('online/extra/nachtelijke-backup', 'text').find((b) =>
      /^\d+ \d+ \* \* \* /.test(b),
    );
    expect(cron, 'geen regel voor de crontab').toBeDefined();
    expect(cron).not.toContain('~');
  });

  it('Portainer staat alleen op 127.0.0.1 en zonder labels voor Traefik', () => {
    const yaml = blokken('online/extra/portainer', 'yaml').join('\n');
    expect(yaml).toContain('- "127.0.0.1:9443:9443"');
    expect(yaml).not.toContain('traefik.');
  });

  it('een IP-adres is van de computer zelf, 0.0.0.0, van Docker of een voorbeeldadres', () => {
    const fout: string[] = [];
    for (const pad of bestanden(ONLINE)) {
      for (const m of readFileSync(pad, 'utf8').matchAll(/\b\d{1,3}(?:\.\d{1,3}){3}\b/g)) {
        if (
          !/^(127\.\d+\.\d+\.\d+|0\.0\.0\.0|203\.0\.113\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)$/.test(
            m[0],
          )
        )
          fout.push(`${idVan(pad)}: ${m[0]}`);
      }
    }
    expect(fout).toEqual([]);
  });

  it('requirements.txt komt uit Out-File, niet uit > in PowerShell', () => {
    const les = lees('online/project/requirements');
    expect(blokken('online/project/requirements', 'bash').join('\n')).not.toContain('freeze >');
    expect(les).toContain('python -m pip freeze | Out-File -Encoding ascii requirements.txt');
  });
});
