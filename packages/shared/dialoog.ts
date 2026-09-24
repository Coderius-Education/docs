// Eigen vervangers voor alert(), confirm() en prompt().
//
// De ingebouwde vensters van de browser passen niet bij de sites: grijs,
// met de naam van het domein erboven, en in sommige browsers verlaten ze
// volledig scherm. Ze blokkeren bovendien de hele pagina. Deze versie is een
// <dialog> met showModal(): die staat in de bovenste laag van de browser, dus
// ook boven een element op volledig scherm, houdt de focus vast, maakt de rest
// van de pagina inert en sluit met Escape.
//
// Bewust zonder React: ook de Python-runner (input()) gebruikt dit, en die
// is geen component. De opmaak staat in css/custom.css onder .coderius-dialoog.

export interface DialoogOpties {
  titel?: string;
  bevestigLabel?: string;
  annuleerLabel?: string;
  // Rode bevestigknop, voor acties die werk weggooien.
  gevaarlijk?: boolean;
}

export interface VraagOpties extends DialoogOpties {
  standaard?: string;
  placeholder?: string;
  // Geeft een foutmelding terug als de invoer niet deugt; het venster blijft
  // dan open met de melding eronder, in plaats van een tweede venster.
  valideer?: (waarde: string) => string | null;
  // De invoer precies zoals getypt, spaties eromheen inbegrepen (input() in
  // Python); standaard gaan die eraf.
  ruw?: boolean;
}

type Soort = 'meld' | 'bevestig' | 'vraag';

interface Uitkomst {
  bevestigd: boolean;
  waarde: string;
}

let volgnummer = 0;

function maak<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  klasse: string,
  tekst?: string,
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  el.className = klasse;
  if (tekst !== undefined) el.textContent = tekst;
  return el;
}

function open(soort: Soort, tekst: string, opties: VraagOpties): Promise<Uitkomst> {
  return new Promise((resolve) => {
    volgnummer += 1;
    const id = `coderius-dialoog-${volgnummer}`;
    const vorigeFocus = document.activeElement as HTMLElement | null;

    const dialoog = maak('dialog', 'coderius-dialoog');
    if (opties.gevaarlijk) dialoog.classList.add('coderius-dialoog--gevaarlijk');
    const form = maak('form', 'coderius-dialoog__vorm');
    form.noValidate = true;

    if (opties.titel) {
      const titel = maak('h2', 'coderius-dialoog__titel', opties.titel);
      titel.id = `${id}-titel`;
      dialoog.setAttribute('aria-labelledby', titel.id);
      form.append(titel);
    }
    const bericht = maak('p', 'coderius-dialoog__tekst', tekst);
    bericht.id = `${id}-tekst`;
    dialoog.setAttribute(opties.titel ? 'aria-describedby' : 'aria-labelledby', bericht.id);
    form.append(bericht);

    let invoer: HTMLInputElement | null = null;
    let fout: HTMLParagraphElement | null = null;
    if (soort === 'vraag') {
      invoer = maak('input', 'coderius-dialoog__invoer');
      invoer.type = 'text';
      invoer.value = opties.standaard ?? '';
      invoer.placeholder = opties.placeholder ?? '';
      invoer.autocomplete = 'off';
      invoer.spellcheck = false;
      invoer.setAttribute('aria-describedby', `${id}-fout`);
      fout = maak('p', 'coderius-dialoog__fout');
      fout.id = `${id}-fout`;
      fout.setAttribute('role', 'alert');
      fout.hidden = true;
      const veld = invoer;
      const melding = fout;
      veld.addEventListener('input', () => {
        melding.hidden = true;
        veld.removeAttribute('aria-invalid');
      });
      form.append(invoer, fout);
    }

    const knoppen = maak('div', 'coderius-dialoog__knoppen');
    if (soort !== 'meld') {
      const annuleer = maak(
        'button',
        'coderius-dialoog__knop',
        opties.annuleerLabel ?? 'Annuleren',
      );
      annuleer.type = 'button';
      annuleer.addEventListener('click', () => sluit(false));
      knoppen.append(annuleer);
    }
    const bevestig = maak(
      'button',
      'coderius-dialoog__knop coderius-dialoog__knop--hoofd',
      opties.bevestigLabel ?? 'OK',
    );
    bevestig.type = 'submit';
    knoppen.append(bevestig);
    form.append(knoppen);
    dialoog.append(form);

    let klaar = false;
    function sluit(bevestigd: boolean) {
      if (klaar) return;
      klaar = true;
      const waarde = invoer?.value ?? '';
      dialoog.close();
      dialoog.remove();
      // Terug naar waar de leerling was, bijvoorbeeld de knop of de editor.
      if (vorigeFocus?.isConnected) vorigeFocus.focus({ preventScroll: true });
      resolve({ bevestigd, waarde });
    }

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (invoer && fout && opties.valideer) {
        const melding = opties.valideer(opties.ruw ? invoer.value : invoer.value.trim());
        if (melding) {
          fout.textContent = melding;
          fout.hidden = false;
          invoer.setAttribute('aria-invalid', 'true');
          invoer.focus();
          return;
        }
      }
      sluit(true);
    });
    // Escape. Bij een melding betekent wegdrukken gewoon "gezien".
    dialoog.addEventListener('cancel', (e) => {
      e.preventDefault();
      sluit(soort === 'meld');
    });
    // Een klik naast het venster (op de achtergrond) is annuleren.
    dialoog.addEventListener('mousedown', (e) => {
      if (e.target === dialoog) sluit(soort === 'meld');
    });

    document.body.append(dialoog);
    dialoog.showModal();
    if (invoer) {
      invoer.focus();
      invoer.select();
    } else {
      // Bij een gevaarlijke vraag staat de focus op Annuleren, zodat een
      // Enter uit gewoonte niets weggooit.
      const eerste = opties.gevaarlijk ? knoppen.firstElementChild : bevestig;
      (eerste as HTMLElement | null)?.focus();
    }
  });
}

export async function meld(tekst: string, opties: DialoogOpties = {}): Promise<void> {
  await open('meld', tekst, opties);
}

export async function bevestig(tekst: string, opties: DialoogOpties = {}): Promise<boolean> {
  return (await open('bevestig', tekst, opties)).bevestigd;
}

// Geeft de ingevulde tekst terug (zonder spaties eromheen, tenzij `ruw`), of
// null bij annuleren.
export async function vraag(tekst: string, opties: VraagOpties = {}): Promise<string | null> {
  const { bevestigd, waarde } = await open('vraag', tekst, opties);
  if (!bevestigd) return null;
  return opties.ruw ? waarde : waarde.trim();
}
