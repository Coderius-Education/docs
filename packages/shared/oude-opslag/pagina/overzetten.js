// Draait op het oude subdomein van een cursus (https://web.coderius.nl/oud/overzetten/):
// alleen daar is de browseropslag van vóór de verhuizing te lezen. Leest wat
// regels.json noemt en geeft het aan /overzetten op de vak-host. Het contract
// staat in packages/shared/oude-opslag.js; oude-opslag.test.ts pint deze
// waarden.
(() => {
  const BRON_OUD = 'coderius-oude-site';
  const BRON_NIEUW = 'coderius-overzetten';
  const VERSIE = 1;
  const TIMEOUT_MS = 20000;

  const $ = (id) => document.getElementById(id);
  const status = (tekst) => {
    $('status').textContent = tekst;
  };

  /** Eén IndexedDB-store als [[sleutel, waarde]]; maakt de database niet aan. */
  function leesStore(database, store) {
    return new Promise((klaar, mis) => {
      let nieuwAangemaakt = false;
      const verzoek = indexedDB.open(database);
      verzoek.onupgradeneeded = () => {
        nieuwAangemaakt = true;
      };
      verzoek.onerror = () => mis(verzoek.error);
      verzoek.onsuccess = () => {
        const db = verzoek.result;
        if (nieuwAangemaakt || !db.objectStoreNames.contains(store)) {
          db.close();
          if (nieuwAangemaakt) indexedDB.deleteDatabase(database);
          klaar([]);
          return;
        }
        const items = [];
        const cursor = db.transaction(store, 'readonly').objectStore(store).openCursor();
        cursor.onerror = () => mis(cursor.error);
        cursor.onsuccess = () => {
          const c = cursor.result;
          if (!c) {
            db.close();
            klaar(items);
            return;
          }
          items.push([c.key, c.value]);
          c.continue();
        };
      };
    });
  }

  function past(regel, sleutel) {
    return regel.prefix
      ? sleutel.startsWith(regel.van) && sleutel.length > regel.van.length
      : sleutel === regel.van;
  }

  async function verzamel(gegevens) {
    const regels = gegevens.regels;
    const ls = {};
    const gevonden = [];
    for (const regel of regels.localStorage || []) {
      let aantal = 0;
      for (let i = 0; i < localStorage.length; i++) {
        const sleutel = localStorage.key(i);
        if (sleutel !== null && past(regel, sleutel)) {
          ls[sleutel] = localStorage.getItem(sleutel);
          aantal += 1;
        }
      }
      if (aantal) gevonden.push({ label: regel.label, aantal });
    }
    const idb = [];
    for (const regel of regels.indexedDB || []) {
      const items = await leesStore(regel.van, regel.store);
      if (items.length) {
        idb.push({ van: regel.van, store: regel.store, items });
        gevonden.push({ label: regel.label, aantal: items.length });
      }
    }
    const bericht = {
      source: BRON_OUD,
      type: 'gegevens',
      versie: VERSIE,
      site: gegevens.site,
      localStorage: ls,
      indexedDB: idb,
    };
    return { bericht, gevonden };
  }

  function toonLijst(gevonden) {
    $('lijst').replaceChildren(
      ...gevonden.map(({ label, aantal }) => {
        const li = document.createElement('li');
        const naam = document.createElement('span');
        naam.textContent = label;
        const hoeveel = document.createElement('span');
        hoeveel.className = 'wanneer';
        hoeveel.textContent = aantal === 1 ? '1 item' : `${aantal} items`;
        li.append(naam, hoeveel);
        return li;
      }),
    );
    $('lijst').hidden = false;
  }

  function download(bericht, site) {
    const blob = new Blob([JSON.stringify(bericht)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${site}-werk.json`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  function zetOver(bericht, nieuweOrigin, doel) {
    const venster = window.open(doel, `coderius-overzetten-${bericht.site}`);
    if (!venster) {
      status('Je browser hield het nieuwe venster tegen. Download het bestand hieronder.');
      $('uitleg-download').hidden = false;
      return;
    }
    status('Het nieuwe adres wordt geopend…');
    let ontvangen = false;
    const timer = setTimeout(() => {
      if (!ontvangen) {
        status('Geen antwoord van het nieuwe adres. Probeer het opnieuw, of download het bestand.');
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
        status('Je werk staat nu op het nieuwe adres. Je kunt dit tabblad sluiten.');
      }
    });
  }

  async function start() {
    const gegevens = await (await fetch('regels.json')).json();
    if (gegevens.versie !== VERSIE) throw new Error('onbekende versie');

    // <oud>.<domein> -> <vak>.<domein>/<pad>, zelfde protocol en poort.
    const domein = location.hostname.split('.').slice(1).join('.');
    const poort = location.port ? `:${location.port}` : '';
    const nieuweOrigin = `${location.protocol}//${gegevens.vak}.${domein}${poort}`;
    const nieuweCursus = nieuweOrigin + gegevens.pad;
    $('naam').textContent = gegevens.naam;
    $('nieuw-adres').href = nieuweCursus;
    $('nieuw-adres').textContent = `${gegevens.vak}.${domein}${gegevens.pad}`;

    if (location.hostname.startsWith(`${gegevens.vak}.`)) {
      status('Deze pagina werkt alleen op het oude adres van de cursus.');
      return;
    }

    const { bericht, gevonden } = await verzamel(gegevens);
    if (gevonden.length === 0) {
      status(
        'In deze browser staat geen werk van het oude adres. Gebruikte je een andere computer of browser? Open deze pagina daar.',
      );
      return;
    }
    status('Dit staat nog in deze browser:');
    toonLijst(gevonden);
    $('knoppen').hidden = false;
    $('overzetten').addEventListener('click', () =>
      zetOver(bericht, nieuweOrigin, `${nieuweCursus}overzetten`),
    );
    $('download').addEventListener('click', () => download(bericht, gegevens.site));
  }

  start().catch(() => {
    status('Je oude werk kon niet gelezen worden. Staat opslag voor deze site uit?');
  });
})();
