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
//
// De route Veiligheid gebruikt hetzelfde rondje met één toevoeging: de stap
// waar de server controleert, heeft `controle` en valt op. Zo ziet de leerling
// per reeks waar de grens zit, en dat die altijd aan de kant van de server
// staat.

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
  /** Hier controleert de server (route Veiligheid). */
  controle?: boolean;
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
    les: 'CSS in een eigen bestand (static files)',
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
    les: 'CSS in een eigen bestand (static files)',
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
    tekst:
      'Zoals de link Terug naar alle berichten: hij wijst naar /berichten, een endpoint, geen bestand.',
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
    les: 'Gegevens opslaan met SqliteDict',
  },
  {
    kant: 'server',
    titel: 'Jinja2 vult de template',
    tekst: 'De for-lus maakt van elk bericht een regel HTML.',
    to: '/docs/FastAPI/lijst_tonen',
    les: 'Alles tonen: een for-lus in je template',
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
    tekst: 'De browser controleert of elk veld met required is ingevuld. Meer niet.',
    to: '/docs/FastAPI/forms',
    les: 'Een formulier versturen (POST)',
  },
  {
    kant: 'browser',
    titel: 'De browser stuurt een POST',
    tekst: 'De ingevulde velden gaan mee in het verzoek, niet in de URL.',
    to: '/docs/FastAPI/forms',
    les: 'Een formulier versturen (POST)',
  },
  {
    kant: 'server',
    titel: 'FastAPI pakt de velden uit',
    tekst: 'Elke naam uit je formulier wordt een Form-parameter van je functie.',
    to: '/docs/FastAPI/forms',
    les: 'Een formulier versturen (POST)',
  },
  {
    kant: 'server',
    titel: 'Jouw Python slaat op',
    tekst: 'Controleer hier wat je van de browser hebt gekregen, en bewaar het.',
    to: '/docs/FastAPI/post_naar_database',
    les: 'Een formulier opslaan',
  },
  {
    kant: 'server',
    titel: 'Het antwoord is een omleiding',
    tekst: 'Geen pagina, maar een opdracht: ga naar /berichten. Met status 303.',
    to: '/docs/FastAPI/redirect',
    les: 'Doorsturen na opslaan (redirect)',
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
    titel: 'Je klikt op een knop',
    tekst:
      'htmx ziet hx-get of hx-post op het element en houdt de browser tegen: geen nieuwe pagina.',
    to: '/docs/FastAPI/htmx',
    les: 'Zonder herladen met htmx',
  },
  {
    kant: 'browser',
    titel: 'htmx stuurt het verzoek',
    tekst: 'Een GET of een POST, met dezelfde velden als anders. In Netwerk staat hij als xhr.',
    to: '/docs/FastAPI/devtools-netwerk',
    les: 'Kijken wat de browser doet',
  },
  {
    kant: 'server',
    titel: 'FastAPI zoekt het endpoint',
    tekst: 'Voor je endpoint is er geen verschil met een verzoek zonder htmx.',
    to: '/docs/FastAPI/eerste_endpoint',
    les: 'Je eerste endpoint',
  },
  {
    kant: 'server',
    titel: 'Jouw Python draait',
    tekst:
      'Leest de tijd, of slaat een bericht op. Ook dit verzoek komt van de bezoeker, dus controleer hier.',
    to: '/docs/FastAPI/detailpagina',
    les: 'Eén item tonen: path-parameters en 404',
  },
  {
    kant: 'server',
    titel: 'Het antwoord is een stukje HTML',
    tekst:
      'Eén zin in een HTMLResponse, of een template zonder <html> eromheen. Geen omleiding: de browser is nooit weggegaan.',
    to: '/docs/FastAPI/htmx-overzicht',
    les: 'htmx-recepten',
  },
  {
    kant: 'browser',
    titel: 'htmx zet het stukje op zijn plek',
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
    les: 'Onthouden op de server: sessies',
  },
  {
    kant: 'server',
    titel: 'Nu pas weet je wie er is',
    tekst: 'De naam komt uit jouw database, niet uit de cookie — dus die klopt.',
    to: '/docs/FastAPI/sessies',
    les: 'Onthouden op de server: sessies',
  },
  {
    kant: 'server',
    titel: 'Het antwoord gaat terug',
    tekst: 'Na een bericht zet set_cookie het sessie-id erop: een nieuw id als er nog geen was.',
    to: '/docs/FastAPI/sessies',
    les: 'Onthouden op de server: sessies',
  },
  {
    kant: 'browser',
    titel: 'De browser bewaart de cookie',
    tekst: 'En stuurt hem bij het volgende verzoek weer mee — het rondje begint opnieuw.',
  },
];

const INVOER_STAPPEN: Stap[] = [
  {
    kant: 'browser',
    titel: 'Je vult het formulier in',
    tekst: 'maxlength houdt je tegen, maar alleen in de browser.',
    to: '/docs/veiligheid/invoer/maxlength',
    les: 'maxlength is geen controle',
  },
  {
    kant: 'browser',
    titel: 'Een script slaat de browser over',
    tekst: 'httpx stuurt hetzelfde verzoek, zonder maxlength en zonder formulier.',
    to: '/docs/veiligheid/gereedschap',
    les: 'Een script als bezoeker',
  },
  {
    kant: 'server',
    titel: 'FastAPI leest het formulier',
    tekst: 'max_length in Form: een te lang of leeg veld geeft een 422.',
    to: '/docs/veiligheid/invoer/grenzen',
    les: 'Grenzen in Form',
    controle: true,
  },
  {
    kant: 'server',
    titel: 'Jouw functie controleert de inhoud',
    tekst: 'Een naam van alleen spaties geeft jouw eigen 400.',
    to: '/docs/veiligheid/invoer/inhoud',
    les: 'De inhoud controleren',
    controle: true,
  },
  {
    kant: 'server',
    titel: 'Pas dan de database in',
    tekst: 'Wat hier aankomt, heeft beide controles gehad.',
  },
  {
    kant: 'browser',
    titel: 'Het antwoord komt terug',
    tekst: 'Een 200, of een 422 of 400 met in detail wat er mis is.',
    to: '/docs/veiligheid/invoer/fouten-lezen',
    les: 'Een 422 lezen',
  },
];

const XSS_STAPPEN: Stap[] = [
  {
    kant: 'browser',
    titel: 'Een bezoeker typt HTML',
    tekst: 'Bijvoorbeeld <b>vet</b> in zijn bericht.',
    to: '/docs/veiligheid/xss/zwakheid',
    les: 'De zwakheid',
  },
  {
    kant: 'server',
    titel: 'Het bericht gaat de database in',
    tekst: 'Zoals het getypt is. Dat is prima: het gevaar zit pas bij het tonen.',
  },
  {
    kant: 'browser',
    titel: 'Een ander vraagt de lijst op',
    tekst: 'Met hx-get of door de pagina te openen.',
  },
  {
    kant: 'server',
    titel: 'De lijst wordt HTML',
    tekst: 'Een .html-template of escape() maakt van < een &lt;.',
    to: '/docs/veiligheid/xss/escape',
    les: 'Escapen in Python',
    controle: true,
  },
  {
    kant: 'browser',
    titel: 'De browser toont tekst',
    tekst: 'Je ziet <b>vet</b> met de haakjes erbij; niets van de bezoeker wordt HTML.',
  },
];

const TOEGANG_STAPPEN: Stap[] = [
  {
    kant: 'browser',
    titel: 'Alex stuurt een DELETE',
    tekst: 'Met de sleutel van het bericht van Sara; die staat gewoon in de pagina.',
    to: '/docs/veiligheid/toegang/zwakheid',
    les: 'De zwakheid',
  },
  {
    kant: 'server',
    titel: 'Het endpoint haalt de sessie op',
    tekst: 'Uit de cookie het sessie-id, uit sessies.db de sleutels van Alex.',
    to: '/docs/FastAPI/sessies',
    les: 'Onthouden op de server: sessies',
  },
  {
    kant: 'server',
    titel: 'Is dit bericht van Alex?',
    tekst: 'Nee: 403, en er verandert niets. Pas bij ja gaat het bericht weg.',
    to: '/docs/veiligheid/toegang/controle',
    les: 'De controle met 403',
    controle: true,
  },
  {
    kant: 'browser',
    titel: 'Alex krijgt een 403',
    tekst: 'Het bericht van Sara staat er nog.',
  },
];

const COOKIES_STAPPEN: Stap[] = [
  {
    kant: 'server',
    titel: 'De server zet de sessie-cookie',
    tekst: 'Met httponly=True in set_cookie.',
    to: '/docs/veiligheid/cookies/httponly',
    les: 'httponly',
    controle: true,
  },
  {
    kant: 'browser',
    titel: 'De browser bewaart hem',
    tekst: 'In het tabblad App staat een vinkje bij HttpOnly.',
  },
  {
    kant: 'browser',
    titel: 'Een script vraagt document.cookie',
    tekst: 'Het krijgt de sessie-cookie niet te zien.',
    to: '/docs/veiligheid/cookies/zwakheid',
    les: 'De zwakheid',
  },
  {
    kant: 'server',
    titel: 'Bij een verzoek gaat hij wel mee',
    tekst: 'De browser stuurt hem in de kop Cookie; je server leest hem met Cookie().',
  },
  {
    kant: 'browser',
    titel: 'Het antwoord komt terug',
    tekst: 'De server heeft je herkend, zonder dat een script het sessie-id zag.',
  },
];

const WACHTWOORDEN_STAPPEN: Stap[] = [
  {
    kant: 'browser',
    titel: 'Je registreert',
    tekst: 'Naam en wachtwoord gaan via het formulier naar de server.',
  },
  {
    kant: 'server',
    titel: 'ph.hash maakt de hash',
    tekst: 'Met een eigen zout, en expres traag. Alleen de hash gaat de database in.',
    to: '/docs/veiligheid/wachtwoorden/registreren',
    les: 'Registreren met Argon2',
    controle: true,
  },
  {
    kant: 'browser',
    titel: 'Je logt in',
    tekst: 'Weer naam en wachtwoord via het formulier.',
  },
  {
    kant: 'server',
    titel: 'ph.verify vergelijkt',
    tekst: 'Met het zout en de instellingen uit de opgeslagen hash.',
    to: '/docs/veiligheid/wachtwoorden/inloggen',
    les: 'Inloggen met verify',
    controle: true,
  },
  {
    kant: 'browser',
    titel: 'Ingelogd, of één melding',
    tekst: 'Een foute naam en een fout wachtwoord geven hetzelfde antwoord.',
  },
];

const DOS_STAPPEN: Stap[] = [
  {
    kant: 'browser',
    titel: 'Een script stuurt veel verzoeken',
    tekst: 'Veel meer dan een mens die een pagina leest.',
    to: '/docs/veiligheid/dos/zelf-meten',
    les: 'Zelf twintig verzoeken',
  },
  {
    kant: 'server',
    titel: 'slowapi telt per computer',
    tekst: 'Vóór je functie draait, met @limiter.limit erboven.',
    to: '/docs/veiligheid/dos/limiet',
    les: 'Een limiet met slowapi',
    controle: true,
  },
  {
    kant: 'server',
    titel: 'Binnen de grens: je functie draait',
    tekst: 'Zoals altijd, en het antwoord gaat terug.',
  },
  {
    kant: 'browser',
    titel: 'Over de grens: een 429',
    tekst: 'Je functie draait niet. Met headers_enabled staat erbij wanneer het weer mag.',
    to: '/docs/veiligheid/dos/te-veel',
    les: 'Wat de 429 vertelt',
  },
];

const VARIANTEN = {
  eerste: { stappen: EERSTE_STAPPEN, titel: 'Je eerste verzoek' },
  static: { stappen: STATIC_STAPPEN, titel: 'Eén pagina, drie verzoeken' },
  get: { stappen: GET_STAPPEN, titel: 'Een pagina opvragen' },
  post: { stappen: POST_STAPPEN, titel: 'Een formulier versturen' },
  htmx: { stappen: HTMX_STAPPEN, titel: 'Een verzoek zonder herladen' },
  sessie: { stappen: SESSIE_STAPPEN, titel: 'Herkend worden met een sessie' },
  invoer: { stappen: INVOER_STAPPEN, titel: 'Waar de controle zit: invoer' },
  xss: { stappen: XSS_STAPPEN, titel: 'Waar de controle zit: HTML van een bezoeker' },
  toegang: { stappen: TOEGANG_STAPPEN, titel: 'Waar de controle zit: wie mag wat' },
  cookies: { stappen: COOKIES_STAPPEN, titel: 'Waar de controle zit: cookies' },
  wachtwoorden: { stappen: WACHTWOORDEN_STAPPEN, titel: 'Waar de controle zit: wachtwoorden' },
  dos: { stappen: DOS_STAPPEN, titel: 'Waar de controle zit: te veel verzoeken' },
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
            <li
              key={stap.titel + stap.kant}
              className={clsx(styles.stap, styles[stap.kant], stap.controle && styles.controle)}
            >
              <span className={styles.nummer} aria-hidden="true">
                {i + 1}
              </span>
              <span className={styles.baan} aria-hidden="true">
                <span className={clsx(styles.stip, stap.kant === 'browser' && styles.actief)} />
                <span className={styles.pijl}>{pijl}</span>
                <span className={clsx(styles.stip, stap.kant === 'server' && styles.actief)} />
              </span>
              <p className={styles.inhoud}>
                {stap.controle && (
                  <span className={styles.controleLabel}>
                    <span className={styles.srOnly}>Hier zit de </span>controle
                  </span>
                )}
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
