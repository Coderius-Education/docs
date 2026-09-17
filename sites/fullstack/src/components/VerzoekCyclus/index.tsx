import Link from '@docusaurus/Link';
import clsx from 'clsx';
import type { ReactElement } from 'react';
import styles from './styles.module.css';

// Zes keer hetzelfde verhaal, elke keer met meer ertussen: het eerste
// verzoek (één functie, JSON terug), een pagina met CSS en een afbeelding
// (drie verzoeken), een pagina uit de database (GET), een formulier (POST),
// hetzelfde formulier zonder herladen (htmx) en een sessie. De stappen staan hier en niet in een los datamodel, zodat er
// niets uit de pas kan lopen: het is één bestand met de tekst én de links
// erin. Elke `to` wijst naar een bestaande lespagina; onBrokenLinks staat op
// 'throw', dus een hernoemde les breekt de build in plaats van stilletjes een
// dode link op te leveren. De twee vroege varianten linken alleen naar lessen
// die de leerling dan al heeft gehad.

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

const EERSTE_STAPPEN: Stap[] = [
  {
    kant: 'browser',
    titel: 'Je typt een adres',
    tekst: '127.0.0.1:8000 is jouw eigen computer, met daarop de server die je net startte.',
    to: '/docs/FastAPI/eerste_endpoint',
    les: 'Je eerste endpoint',
  },
  {
    kant: 'browser',
    titel: 'De browser stuurt een GET',
    tekst: 'Een verzoek over het netwerk: geef me wat er op / staat. Dat is de get uit @app.get.',
  },
  {
    kant: 'server',
    titel: 'FastAPI zoekt het endpoint',
    tekst: 'Welke functie hoort bij dit pad? Die met @app.get("/").',
    to: '/docs/FastAPI/eerste_endpoint',
    les: 'Je eerste endpoint',
  },
  {
    kant: 'server',
    titel: 'Jouw functie draait',
    tekst: 'root() geeft een dictionary terug. Dit is de enige stap met code van jou.',
    to: '/docs/FastAPI/eerste_endpoint',
    les: 'Je eerste endpoint',
  },
  {
    kant: 'server',
    titel: 'Het antwoord gaat terug',
    tekst: 'FastAPI maakt van de dictionary JSON en stuurt die over het netwerk.',
  },
  {
    kant: 'browser',
    titel: 'De browser toont het',
    tekst: 'Wat er binnenkomt, komt op het scherm. Meer doet de browser nu nog niet.',
  },
];

const STATIC_STAPPEN: Stap[] = [
  {
    kant: 'browser',
    titel: 'De browser stuurt een GET naar /',
    tekst: 'Je typt het adres of klikt op een link; de pagina wordt opgevraagd.',
    to: '/docs/FastAPI/links',
    les: 'Links tussen pagina’s',
  },
  {
    kant: 'server',
    titel: 'Jouw functie stuurt het bestand',
    tekst: 'home() geeft een FileResponse: de inhoud van static/pages/home.html, ongewijzigd.',
    to: '/docs/FastAPI/html_bestanden',
    les: 'HTML in bestanden',
  },
  {
    kant: 'browser',
    titel: 'De browser leest de HTML',
    tekst: 'Daarin staan een <link> naar CSS en een <img>. Die bestanden heeft hij nog niet.',
    to: '/docs/FastAPI/static_files',
    les: 'Static files',
  },
  {
    kant: 'browser',
    titel: 'Nog twee verzoeken',
    tekst: 'Een GET naar /static/css/style.css en een naar /static/kat.jpg, allebei apart.',
    to: '/docs/FastAPI/afbeeldingen',
    les: 'Afbeeldingen tonen',
  },
  {
    kant: 'server',
    titel: 'StaticFiles antwoordt',
    tekst:
      'Zonder een functie van jou: app.mount geeft het bestand door zoals het op schijf staat.',
    to: '/docs/FastAPI/static_files',
    les: 'Static files',
  },
  {
    kant: 'browser',
    titel: 'De browser tekent alles',
    tekst: 'Pas als de CSS en de afbeelding binnen zijn, ziet de pagina eruit zoals bedoeld.',
  },
];

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

const HTMX_STAPPEN: Stap[] = [
  {
    kant: 'browser',
    titel: 'Je klikt op Verstuur',
    tekst: 'htmx ziet hx-post op het formulier en houdt de browser tegen: geen nieuwe pagina.',
    to: '/docs/FastAPI/htmx',
    les: 'Zonder herladen met htmx',
  },
  {
    kant: 'browser',
    titel: 'htmx stuurt de POST',
    tekst:
      'Dezelfde velden als anders, plus een header HX-Request: true. In Netwerk staat hij als xhr.',
    to: '/docs/FastAPI/devtools-netwerk',
    les: 'Kijken wat de browser doet',
  },
  {
    kant: 'server',
    titel: 'FastAPI pakt de velden uit',
    tekst: 'Voor je endpoint is er geen verschil met een formulier zonder htmx.',
    to: '/docs/FastAPI/forms',
    les: 'Eigen POST request',
  },
  {
    kant: 'server',
    titel: 'Jouw Python slaat op',
    tekst:
      'Controleer hier wat je hebt gekregen, en bewaar het. Ook dit verzoek komt van de bezoeker.',
    to: '/docs/FastAPI/post_naar_database',
    les: 'POST naar database',
  },
  {
    kant: 'server',
    titel: 'Jinja2 vult alleen het stuk',
    tekst: 'berichten_lijst.html, zonder <html> of <head> eromheen.',
    to: '/docs/FastAPI/htmx',
    les: 'Zonder herladen met htmx',
  },
  {
    kant: 'server',
    titel: 'Het antwoord is een stuk HTML',
    tekst:
      'Geen omleiding: de browser is nooit weggegaan, dus er is niets om naar terug te sturen.',
    to: '/docs/FastAPI/redirect',
    les: 'Terug naar de lijst',
  },
  {
    kant: 'browser',
    titel: 'htmx zet het stuk op zijn plek',
    tekst: 'In het element van hx-target. De rest van de pagina blijft staan, de adresbalk ook.',
    to: '/docs/FastAPI/htmx',
    les: 'Zonder herladen met htmx',
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
  eerste: { stappen: EERSTE_STAPPEN, titel: 'Je eerste verzoek' },
  static: { stappen: STATIC_STAPPEN, titel: 'Eén pagina, drie verzoeken' },
  get: { stappen: GET_STAPPEN, titel: 'Een pagina opvragen' },
  post: { stappen: POST_STAPPEN, titel: 'Een formulier versturen' },
  htmx: { stappen: HTMX_STAPPEN, titel: 'Een formulier versturen zonder herladen' },
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
          // Een stap die van kant wisselt is het moment dat er iets over het
          // netwerk gaat; de pijl tussen de banen wijst die kant op.
          const wisselt = !!vorige && vorige.kant !== stap.kant;
          const pijl = !wisselt ? '' : stap.kant === 'server' ? '→' : '←';

          return (
            <li key={stap.titel + stap.kant} className={clsx(styles.stap, styles[stap.kant])}>
              <span className={styles.nummer} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.baan} aria-hidden="true">
                <span className={clsx(styles.stip, stap.kant === 'browser' && styles.actief)} />
                <span className={styles.pijl}>{pijl}</span>
                <span className={clsx(styles.stip, stap.kant === 'server' && styles.actief)} />
              </span>
              <p className={styles.inhoud}>
                <strong className={styles.stapTitel}>
                  <span className={styles.srOnly}>
                    {stap.kant === 'browser' ? 'Browser: ' : 'Server: '}
                  </span>
                  {stap.titel}.
                </strong>{' '}
                {stap.tekst}
                {stap.to && stap.les && (
                  <>
                    <span className={styles.scheiding}> · </span>
                    <Link className={styles.les} to={stap.to}>
                      {stap.les}
                    </Link>
                  </>
                )}
              </p>
            </li>
          );
        })}
      </ol>
    </figure>
  );
}
