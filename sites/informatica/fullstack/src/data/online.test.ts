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

  it('Linux staat in de Linux-cursus: de startpagina en de eerste les in WSL linken ernaar', () => {
    expect(lees('online/index')).toContain('(site:linux/docs)');
    expect(lees('online/index')).toContain('(site:linux/docs/wsl/installeren)');
    expect(lees('online/docker/installeren')).toMatch(/site: 'linux', to: '\/docs\//);
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
