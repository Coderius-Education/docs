import Link from '@docusaurus/Link';
import clsx from 'clsx';
import type { ReactElement } from 'react';
import styles from './styles.module.css';

// Twee verhalen die de cursus van begin tot eind vertellen: een pagina
// opvragen (GET) en een formulier versturen (POST). De stappen staan hier en
// niet in een los datamodel, zodat er niets uit de pas kan lopen: het is één
// bestand met de tekst én de links erin. Elke `to` wijst naar een bestaande
// lespagina; onBrokenLinks staat op 'throw', dus een hernoemde les breekt de
// build in plaats van stilletjes een dode link op te leveren.

type Kant = 'browser' | 'server';

type Stap = {
  kant: Kant;
  /** Korte titel van de stap. */
  titel: string;
  /** Eén zin: wat er gebeurt. */
  tekst: string;
  /** De les waar deze stap wordt uitgelegd. Weglaten als er geen les bij hoort. */
  to?: string;
  /** Linktekst; alleen nodig als `to` gezet is. */
  les?: string;
};

const GET_STAPPEN: Stap[] = [
  {
    kant: 'browser',
    titel: 'Je klikt op een link',
    tekst: 'De link wijst naar /berichten — een endpoint, geen bestand.',
    to: '/docs/FastAPI/links',
    les: 'Links tussen pagina’s',
  },
  {
    kant: 'browser',
    titel: 'De browser stuurt een GET',
    tekst: 'Een verzoek over het netwerk: geef me wat er op /berichten staat.',
    to: '/docs/FastAPI/get_vs_post',
    les: 'GET vs POST',
  },
  {
    kant: 'server',
    titel: 'FastAPI zoekt het endpoint',
    tekst: 'Welke functie hoort bij dit pad? Die met @app.get("/berichten").',
    to: '/docs/FastAPI/eerste_endpoint',
    les: 'Je eerste endpoint',
  },
  {
    kant: 'server',
    titel: 'Jouw Python draait',
    tekst: 'De functie leest de berichten uit de database.',
    to: '/docs/FastAPI/database',
    les: 'Gegevens opslaan',
  },
  {
    kant: 'server',
    titel: 'Jinja2 vult de template',
    tekst: 'De for-lus maakt van elk bericht een regel HTML.',
    to: '/docs/FastAPI/lijst_tonen',
    les: 'Een lijst tonen',
  },
  {
    kant: 'server',
    titel: 'Het antwoord gaat terug',
    tekst: 'Kant-en-klare HTML. De database en je Python-code gaan niet mee.',
  },
  {
    kant: 'browser',
    titel: 'De browser tekent de pagina',
    tekst: 'CSS wordt opgehaald, JavaScript begint. Hier stopt de server.',
    to: '/docs/FastAPI/javascript',
    les: 'JavaScript erbij',
  },
];

const POST_STAPPEN: Stap[] = [
  {
    kant: 'browser',
    titel: 'Je vult het formulier in',
    tekst: 'De browser controleert required en maxlength — meer niet.',
    to: '/docs/FastAPI/server-of-browser',
    les: 'Server of browser?',
  },
  {
    kant: 'browser',
    titel: 'De browser stuurt een POST',
    tekst: 'De ingevulde velden gaan mee in het verzoek, niet in de URL.',
    to: '/docs/FastAPI/forms',
    les: 'Eigen POST request',
  },
  {
    kant: 'server',
    titel: 'FastAPI pakt de velden uit',
    tekst: 'Elke naam uit je formulier wordt een Form-parameter van je functie.',
    to: '/docs/FastAPI/forms',
    les: 'Eigen POST request',
  },
  {
    kant: 'server',
    titel: 'Jouw Python slaat op',
    tekst: 'Controleer hier wat je van de browser hebt gekregen, en bewaar het.',
    to: '/docs/FastAPI/post_naar_database',
    les: 'POST naar database',
  },
  {
    kant: 'server',
    titel: 'Het antwoord is een omleiding',
    tekst: 'Geen pagina, maar een opdracht: ga naar /berichten. Met status 303.',
    to: '/docs/FastAPI/redirect',
    les: 'Terug naar de lijst',
  },
  {
    kant: 'browser',
    titel: 'De browser begint opnieuw',
    tekst: 'Nu met een GET naar /berichten — en het verhaal hierboven start.',
  },
];

const SESSIE_STAPPEN: Stap[] = [
  {
    kant: 'browser',
    titel: 'De browser stuurt de cookie mee',
    tekst: 'Bij elk verzoek aan jouw server gaat sessie_id automatisch mee, ongevraagd.',
    to: '/docs/FastAPI/cookies',
    les: 'Onthouden met een cookie',
  },
  {
    kant: 'server',
    titel: 'FastAPI geeft de cookie door',
    tekst: 'De parameter met Cookie(default="") vangt hem op, net als Form bij een formulier.',
    to: '/docs/FastAPI/cookies',
    les: 'Onthouden met een cookie',
  },
  {
    kant: 'server',
    titel: 'De server zoekt de sessie op',
    tekst: 'Het sessie-id is een sleutel in sessies.db; daar staan de echte gegevens.',
    to: '/docs/FastAPI/sessies',
    les: 'Sessies',
  },
  {
    kant: 'server',
    titel: 'Nu pas weet je wie er is',
    tekst: 'De naam komt uit jouw database, niet uit de cookie — dus die klopt.',
    to: '/docs/FastAPI/sessies',
    les: 'Sessies',
  },
  {
    kant: 'server',
    titel: 'Het antwoord gaat terug',
    tekst: 'Was er nog geen sessie, dan zet set_cookie het nieuwe sessie-id erop.',
    to: '/docs/FastAPI/sessies',
    les: 'Sessies',
  },
  {
    kant: 'browser',
    titel: 'De browser bewaart de cookie',
    tekst: 'En stuurt hem bij het volgende verzoek weer mee — het rondje begint opnieuw.',
  },
];

const VARIANTEN = {
  get: { stappen: GET_STAPPEN, titel: 'Een pagina opvragen' },
  post: { stappen: POST_STAPPEN, titel: 'Een formulier versturen' },
  sessie: { stappen: SESSIE_STAPPEN, titel: 'Herkend worden met een sessie' },
} as const;

export default function VerzoekCyclus({
  variant = 'get',
}: {
  variant?: keyof typeof VARIANTEN;
}): ReactElement {
  const { stappen, titel } = VARIANTEN[variant];

  return (
    <figure className={styles.cyclus}>
      <figcaption className={styles.titel}>{titel}</figcaption>

      <div className={styles.koppen} aria-hidden="true">
        <span className={styles.kop}>Browser</span>
        <span className={styles.kop}>Server</span>
      </div>

      <ol className={styles.stappen}>
        {stappen.map((stap, i) => {
          const vorige = stappen[i - 1];
          const wisselt = !!vorige && vorige.kant !== stap.kant;

          return (
            <li
              key={stap.titel + stap.kant}
              className={clsx(styles.stap, styles[stap.kant], wisselt && styles.wisselt)}
              // Eén stap per rij. Zonder dit vult de grid de eerste vrije cel,
              // en komen stap 2 (browser) en 3 (server) naast elkaar te staan —
              // dat leest als "tegelijk" terwijl het "daarna" is.
              style={{ gridRow: i + 1 }}
            >
              <span className={styles.nummer} aria-hidden="true">
                {i + 1}
              </span>
              <div className={styles.inhoud}>
                <strong className={styles.stapTitel}>
                  <span className={styles.srOnly}>
                    {stap.kant === 'browser' ? 'Browser: ' : 'Server: '}
                  </span>
                  {stap.titel}
                </strong>
                <p className={styles.stapTekst}>{stap.tekst}</p>
                {stap.to && stap.les && (
                  <Link className={styles.les} to={stap.to}>
                    {stap.les}
                  </Link>
                )}
              </div>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
