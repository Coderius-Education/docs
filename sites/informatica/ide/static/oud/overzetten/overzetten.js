// Draait op de oude origin (https://ide.coderius.nl/oud/overzetten/): alleen
// daar is de IndexedDB met projecten van vóór de verhuizing te lezen. Leest de
// projecten en geeft ze aan https://informatica.coderius.nl/ide/overzetten.
// Het contract (en de tests die deze waarden pinnen) staat in
// src/components/Overzetten/overzettenContract.ts.
(() => {
  const BRON_OUD = 'coderius-ide-oud';
  const BRON_NIEUW = 'coderius-ide-overzetten';
  const VERSIE = 1;
  const OUDE_DATABASE = 'coderius-editor';
  const OUDE_STORE = 'projects';
  const NIEUW_VAK = 'informatica';
  const NIEUW_PAD = '/ide/';
  const TIMEOUT_MS = 20000;

  const $ = (id) => document.getElementById(id);
  const status = (tekst) => {
    $('status').textContent = tekst;
  };

  // ide.<domein> -> informatica.<domein>, zelfde protocol en poort.
  const domein = location.hostname.replace(/^ide\./, '');
  const poort = location.port ? `:${location.port}` : '';
  const nieuweOrigin = `${location.protocol}//${NIEUW_VAK}.${domein}${poort}`;
  const nieuweIde = nieuweOrigin + NIEUW_PAD;
  $('nieuwe-ide').href = nieuweIde;

  if (!location.hostname.startsWith('ide.')) {
    status('Deze pagina werkt alleen op het oude adres van de IDE (ide.coderius.nl).');
    return;
  }

  /** Alle projecten uit de oude database; maakt hem niet aan als hij er niet is. */
  function leesOudeProjecten() {
    return new Promise((klaar, mis) => {
      let nieuwAangemaakt = false;
      const verzoek = indexedDB.open(OUDE_DATABASE);
      verzoek.onupgradeneeded = () => {
        nieuwAangemaakt = true;
      };
      verzoek.onerror = () => mis(verzoek.error);
      verzoek.onsuccess = () => {
        const db = verzoek.result;
        if (nieuwAangemaakt || !db.objectStoreNames.contains(OUDE_STORE)) {
          db.close();
          if (nieuwAangemaakt) indexedDB.deleteDatabase(OUDE_DATABASE);
          klaar([]);
          return;
        }
        const projecten = [];
        const cursor = db.transaction(OUDE_STORE, 'readonly').objectStore(OUDE_STORE).openCursor();
        cursor.onerror = () => mis(cursor.error);
        cursor.onsuccess = () => {
          const c = cursor.result;
          if (!c) {
            db.close();
            projecten.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0));
            klaar(projecten);
            return;
          }
          if (typeof c.key === 'string' && c.key.startsWith('project:') && c.value) {
            projecten.push(c.value);
          }
          c.continue();
        };
      };
    });
  }

  function toonLijst(projecten) {
    const lijst = $('lijst');
    lijst.replaceChildren(
      ...projecten.map((p) => {
        const li = document.createElement('li');
        const naam = document.createElement('span');
        naam.textContent = p.name || 'Naamloos project';
        const wanneer = document.createElement('span');
        wanneer.className = 'wanneer';
        wanneer.textContent = p.updatedAt
          ? new Date(p.updatedAt).toLocaleDateString('nl-NL', { dateStyle: 'medium' })
          : '';
        li.append(naam, wanneer);
        return li;
      }),
    );
    lijst.hidden = false;
  }

  function download(bericht) {
    const blob = new Blob([JSON.stringify(bericht)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'ide-projecten.json';
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function zetOver(bericht) {
    const venster = window.open(`${nieuweOrigin}${NIEUW_PAD}overzetten`, 'coderius-ide-overzetten');
    if (!venster) {
      status('Je browser hield het nieuwe venster tegen. Download het bestand hieronder.');
      $('uitleg-download').hidden = false;
      return;
    }
    status('De nieuwe IDE wordt geopend…');
    let ontvangen = false;
    const timer = setTimeout(() => {
      if (!ontvangen) {
        status('Geen antwoord van de nieuwe IDE. Probeer het opnieuw, of download het bestand.');
        $('uitleg-download').hidden = false;
      }
    }, TIMEOUT_MS);

    window.addEventListener('message', function luister(event) {
      // Alleen het venster dat we zelf openden, op precies de nieuwe origin.
      if (event.origin !== nieuweOrigin || event.source !== venster) return;
      const d = event.data;
      if (!d || d.source !== BRON_NIEUW) return;
      if (d.type === 'klaar') {
        venster.postMessage(bericht, nieuweOrigin);
      } else if (d.type === 'ontvangen') {
        ontvangen = true;
        clearTimeout(timer);
        window.removeEventListener('message', luister);
        const n = Number(d.aantal) || 0;
        status(
          `${n} ${n === 1 ? 'project staat' : 'projecten staan'} nu in de nieuwe IDE. Je kunt dit tabblad sluiten.`,
        );
      }
    });
  }

  leesOudeProjecten()
    .then((projecten) => {
      if (projecten.length === 0) {
        status(
          'In deze browser staan geen projecten van de oude IDE. Gebruikte je een andere computer of browser? Open deze pagina daar.',
        );
        return;
      }
      const n = projecten.length;
      status(`${n} ${n === 1 ? 'project' : 'projecten'} gevonden in deze browser.`);
      toonLijst(projecten);
      const bericht = { source: BRON_OUD, type: 'projecten', versie: VERSIE, projecten };
      $('knoppen').hidden = false;
      $('overzetten').addEventListener('click', () => zetOver(bericht));
      $('download').addEventListener('click', () => download(bericht));
    })
    .catch(() => {
      status('De oude projecten konden niet gelezen worden. Staat opslag voor deze site uit?');
    });
})();
