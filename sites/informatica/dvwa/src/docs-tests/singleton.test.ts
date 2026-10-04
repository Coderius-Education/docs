import { beforeEach, describe, expect, it } from 'vitest';
import { createPhp, execPhp } from '../components/DvwaLab/PhpWasmProvider';
import { bruteForce } from '../components/DvwaLab/modules/brute_force';
import { csrf } from '../components/DvwaLab/modules/csrf';
import { fileInclusion } from '../components/DvwaLab/modules/file_inclusion';
import { sqlInjection } from '../components/DvwaLab/modules/sql_injection';
import { weakSessionIds } from '../components/DvwaLab/modules/weak_session_ids';

// De browser hergebruikt ÉÉN php-wasm-instantie per tab, over alle labs en alle
// submits heen. De andere suites maken bewust een verse instantie per case, dus
// zij zien niet wat er in die naad kan misgaan: een PHP-functie die bij het
// tweede verzoek opnieuw wordt gedeclareerd (Fatal), of staat die van het ene
// lab naar het andere lekt. Deze suite draait daarom een reeks submits op
// dezelfde instantie.

type Config = { method: string; php: string };

async function submit(
  php: Awaited<ReturnType<typeof createPhp>>,
  config: Config,
  invoer: Record<string, string> = {},
) {
  const get = config.method === 'GET' ? invoer : {};
  const post = config.method === 'POST' ? invoer : {};
  const uit = await execPhp(php, config.php, get, post);
  // Op één instantie is een herdeclaratie of fatal juist het risico.
  expect(uit).not.toMatch(/Cannot redeclare|Fatal error|Parse error/i);
  return uit;
}

let php: Awaited<ReturnType<typeof createPhp>>;

describe('één hergebruikte php-instantie (zoals de browser per tab)', () => {
  beforeEach(async () => {
    php = await createPhp(async () => {
      const { PhpNode } = await import('php-wasm/PhpNode.mjs');
      return new PhpNode();
    });
  }, 60_000);

  it('file_inclusion herdeclareert fi_resolve niet bij herhaald indienen', async () => {
    // fi_resolve wordt top-level gedeclareerd in low én medium; zonder de
    // function_exists-guard zou het tweede verzoek "Cannot redeclare" geven.
    expect(await submit(php, fileInclusion.low, { page: 'file1.php' })).toContain('Bestand 1');
    expect(await submit(php, fileInclusion.low, { page: '../../../etc/passwd' })).toContain(
      'root:x:0:0',
    );
    expect(await submit(php, fileInclusion.medium, { page: '....//passwords.txt' })).toContain(
      'admin:password123',
    );
    expect(await submit(php, fileInclusion.high, { page: 'file:///etc/passwd' })).toContain(
      'root:x:0:0',
    );
    expect(await submit(php, fileInclusion.low, { page: 'file2.php' })).toContain('Bestand 2');
  });

  it('CSRF-wachtwoordwijziging lekt niet naar brute_force, sql_injection of csrf/impossible', async () => {
    // CSRF schrijft in zijn eigen /tmp/dvwa_csrf.db en herzaait user 1 elke
    // render, dus de gedeelde /tmp/dvwa.db blijft intact.
    expect(
      await submit(php, csrf.low, { password_new: 'hacked', password_conf: 'hacked' }),
    ).toContain('gewijzigd');

    // De gedeelde database is ongemoeid: admin/password werkt nog.
    expect(
      await submit(php, bruteForce.low, { username: 'admin', password: 'password' }),
    ).toContain('Welkom, admin');
    // En de gebruikersnamen zijn nog te lekken via sql_injection.
    expect(await submit(php, sqlInjection.low, { id: "1' OR '1'='1" })).toContain('Gordon');

    // csrf/impossible ziet dankzij de herzaai nog steeds 'password' als huidig
    // wachtwoord — de check faalt dus niet door een eerdere csrf-wijziging.
    const imp = await submit(php, csrf.impossible, {
      password_current: 'password',
      password_new: 'nieuwpass',
      password_conf: 'nieuwpass',
    });
    expect(imp).toContain('succesvol gewijzigd');
    expect(imp).not.toContain('Huidig wachtwoord onjuist');
  });

  it("weak_session/low telt de sessie-ID's op over opeenvolgende submits (bedoelde staat)", async () => {
    expect(await submit(php, weakSessionIds.low, { generate: '1' })).toContain('<b>1</b>');
    expect(await submit(php, weakSessionIds.low, { generate: '1' })).toContain('<b>2</b>');
    expect(await submit(php, weakSessionIds.low, { generate: '1' })).toContain('<b>3</b>');
  });
});
