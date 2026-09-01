// ── Maskeren ────────────────────────────────────────────────────────────────
// Vervangen door spaties in plaats van weghalen: zo blijven regel- en
// kolomnummers kloppen met het bronbestand, en dat is wat een annotatie in de
// pull request nodig heeft.
const spaties = (tekst) => tekst.replace(/[^\n]/g, ' ');

const LINKDOEL = /\]\([^)\n]*\)/g;

const MASKERS = [
  /^---\n[\s\S]*?\n---\n/, // frontmatter
  /```[\s\S]*?```/g, // codeblokken
  // Template-literals in JSX-props vóór de tag-regex hieronder: een `>` in de
  // code (`if a > b:`) sluit anders die tag af en de rest van het blok komt
  // alsnog als proza binnen.
  /=\{`[\s\S]*?`\}/g, // <PygbagRunner code={`…`} />
  // MDX-exports met startcode (web-docs hoist die naar de kop van de pagina,
  // zodat drie velden dezelfde literal delen): ook code, geen lestekst.
  /export const \w+ = `[\s\S]*?`;/g,
  /\{`[\s\S]*?`\}/g, // <CodeExercise>{`…`}</CodeExercise>
  /`[^`\n]*`/g, // inline code
  /<[^>]*>/g, // losse JSX- en HTML-tags
  /\{\/\*[\s\S]*?\*\/\}/g, // MDX-commentaar
  LINKDOEL, // linkdoelen (de linktekst blijft staan)
  /^\s*\|.*\|\s*$/gm, // tabelrijen: kolomkoppen zijn geen zinnen
];

/**
 * Alles wat geen proza is wordt spaties, met behoud van posities.
 *
 * `linkdoelen: false` laat het deel tussen de haakjes van een link staan. Dat
 * is er voor de alt-tekst-regel: die moet juist naar `](` kijken, en had
 * anders de ruwe tekst nodig — waarmee hij ook aansloeg op markdown-voorbeelden
 * ín een codeblok.
 */
function alleenProza(tekst, { linkdoelen = true } = {}) {
  let uit = tekst;
  for (const masker of MASKERS) {
    if (!linkdoelen && masker === LINKDOEL) continue;
    uit = uit.replace(masker, spaties);
  }
  return uit;
}

// ── Hulpstukken ─────────────────────────────────────────────────────────────

/** Regelnummer (1-gebaseerd) van een index in de tekst. */
function regelVan(tekst, index) {
  return tekst.slice(0, index).split('\n').length;
}

/** Alinea's als [tekst, startindex]; een alinea is gescheiden door een lege regel. */
function alineas(proza) {
  const uit = [];
  let start = 0;
  for (const stuk of proza.split(/\n\s*\n/)) {
    uit.push([stuk, start]);
    start += stuk.length + 2;
  }
  return uit;
}

function* treffers(proza, patroon, bericht) {
  for (const m of proza.matchAll(patroon)) {
    yield { index: m.index, bericht: bericht(m) };
  }
}

// Afkortingen die in hoofdletters horen. Alles daarbuiten leest als schreeuwen.
const AFKORTINGEN = new Set([
  'HTML',
  'CSS',
  'JSON',
  'HTTP',
  'HTTPS',
  'JSX',
  'MDX',
  'API',
  'URL',
  'PRIMM',
  'SNES',
  'USB',
  'PDF',
  'CSV',
  'RGB',
  'IDE',
  'CLI',
  'SQL',
  'DOM',
  'GIF',
  'PNG',
  'JPG',
  'SVG',
  'MP3',
  'MP4',
  'WAV',
  'OGG',
  'TTF',
  'FOUT',
  'GOED',
  'QUIT',
  // Web-security: productnamen, protocol-methodes en aanvalsafkortingen
  // (o.a. DVWA-cursus). Geen gewone woorden, dus veilig monorepo-breed.
  'DVWA',
  'CSRF',
  'XSS',
  'CSP',
  'PHP',
  'XML',
  'GET',
  'POST',
  'MIME',
  'JSONP',
  'PHPSESSID',
  'JPEG',
  'IDOR',
  'UNIX',
  'REST',
  'LFI',
  'RFI',
  'SSRF',
]);

// ── De regels ───────────────────────────────────────────────────────────────

const REGELS = [
  {
    naam: 'emoji',
    niveau: 'fout',
    zoek: function* (proza) {
      // Breed zoeken en daarna de functionele symbolen eruit filteren, want
      // die staan verspreid door dezelfde Unicode-blokken als de emoji.
      const TOEGESTAAN = new Set(['✓', '✔', '✗', '✘', '⚠', '→', '←', '↑', '↓', '↔', '⇒', '▶', '…']);
      for (const m of proza.matchAll(
        /[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B00}-\u{2BFF}\u{2190}-\u{21FF}]/gu,
      )) {
        if (TOEGESTAAN.has(m[0])) continue;
        yield { index: m.index, bericht: `emoji ${m[0]} in lestekst; alleen ✓, ⚠ en pijlen mogen` };
      }
    },
  },
  {
    naam: 'u-vorm',
    niveau: 'fout',
    // "uw" is eenduidig. De losse "u" niet: play-docs legt uit dat `color`
    // "zonder u" wordt geschreven, en dat is de letter, niet de lezer. Vandaar
    // dat een losse "u" alleen telt naast een persoonsvorm.
    zoek: function* (proza) {
      const VERB =
        /^(kunt|kan|kon|heeft|hebt|had|bent|was|moet|wilt|wil|ziet|krijgt|gaat|doet|maakt|vindt|weet|mag|zult|zou)$/i;
      for (const m of proza.matchAll(/(?<![\w-])[Uu]w(?![\w-])/g)) {
        yield { index: m.index, bericht: `"${m[0]}" — spreek de lezer aan met "jouw"` };
      }
      for (const m of proza.matchAll(/(?<![\w-])([a-zA-Z]+)?\s*\b[Uu]\b\s*([a-zA-Z]+)?/g)) {
        if (VERB.test(m[1] || '') || VERB.test(m[2] || '')) {
          yield { index: m.index, bericht: '"u" — spreek de lezer aan met "je"' };
        }
      }
    },
  },
  {
    naam: 'uitroepteken',
    niveau: 'fout',
    zoek: (proza) => treffers(proza, /\w!/g, () => 'uitroepteken in lestekst'),
  },
  {
    naam: 'all-caps',
    niveau: 'fout',
    zoek: function* (proza) {
      for (const m of proza.matchAll(/\b[A-Z]{4,}\b/g)) {
        if (AFKORTINGEN.has(m[0])) continue;
        // Onderdeel van een naam of een API-aanroep: play.WallSide.BOTTOM,
        // @VARIABLE.when_touching, Informatica-ACTIEF, pygame.KEYDOWN.
        const voor = proza[m.index - 1];
        const na = proza[m.index + m[0].length];
        if ('.@_-('.includes(voor) || '.@_()'.includes(na)) continue;
        yield { index: m.index, bericht: `"${m[0]}" in hoofdletters` };
      }
    },
  },
  {
    naam: 'alt-tekst',
    niveau: 'fout',
    // Kijkt naar tekst waarin de code wél gemaskeerd is maar het linkdoel niet.
    metLinkdoelen: true,
    zoek: (tekst) =>
      treffers(
        tekst,
        /!\[\s*(afbeelding|image|plaatje|screenshot|img)?\s*\]\(/gi,
        () => 'afbeelding zonder beschrijvende alt-tekst',
      ),
  },
  {
    naam: 'vulwoord',
    niveau: 'waarschuwing',
    zoek: (proza) =>
      treffers(
        proza,
        /\b(eigenlijk|gewoon|eenvoudigweg|simpelweg|zomaar even|gewoonweg)\b/gi,
        (m) => `vulwoord "${m[1]}"`,
      ),
  },
  {
    naam: 'superlatief',
    niveau: 'waarschuwing',
    zoek: (proza) =>
      treffers(
        proza,
        /\b(geweldig|supereenvoudig|superhandig|krachtig|naadloos|moeiteloos|fantastisch|perfect)\w*\b/gi,
        (m) => `hol superlatief "${m[1]}"; laat het voorbeeld het werk doen`,
      ),
  },
  {
    naam: 'formulaire-opener',
    niveau: 'waarschuwing',
    zoek: (proza) =>
      treffers(
        proza,
        /(?<=^|\n)\s*(In dit hoofdstuk|Laten we|We gaan kijken|We zullen|Duik in|In deze les gaan we)/gi,
        (m) => `formulaire opener "${m[1].trim()}"; begin met de inhoud`,
      ),
  },
  {
    naam: 'lege-overgang',
    niveau: 'waarschuwing',
    zoek: (proza) =>
      treffers(
        proza,
        /(?<=^|\n)\s*(Daarnaast|Bovendien|Kortom|Het is belangrijk om te benadrukken)\b/g,
        (m) => `lege overgang "${m[1]}"`,
      ),
  },
  {
    naam: 'engels-opvulling',
    niveau: 'waarschuwing',
    zoek: (proza) =>
      treffers(
        proza,
        /\b(let's|we're|gonna|awesome|nice|cool)\b/gi,
        (m) => `Engelse opvulling "${m[1]}"`,
      ),
  },
  {
    naam: 'passief',
    niveau: 'waarschuwing',
    zoek: (proza) =>
      treffers(
        proza,
        /\b(wordt|worden) (?:er )?\w+(?:erd|end|aan|even|omen|onden)\b/g,
        (m) => `passieve constructie "${m[0]}"`,
      ),
  },
  {
    naam: 'em-dash',
    niveau: 'waarschuwing',
    zoek: function* (proza) {
      for (const [stuk, start] of alineas(proza)) {
        const aantal = (stuk.match(/—/g) || []).length;
        if (aantal >= 3) {
          yield { index: start, bericht: `${aantal} gedachtestreepjes in één alinea` };
        }
      }
    },
  },
  {
    naam: 'vet-overdaad',
    niveau: 'waarschuwing',
    zoek: function* (proza) {
      for (const [stuk, start] of alineas(proza)) {
        const aantal = (stuk.match(/\*\*[^*\n]+\*\*/g) || []).length;
        if (aantal >= 5) yield { index: start, bericht: `${aantal} keer vet in één alinea` };
      }
    },
  },
  {
    naam: 'lange-zin',
    niveau: 'waarschuwing',
    zoek: function* (proza) {
      const zinnen = /[^.!?\n]+[.!?]/g;
      for (const m of proza.matchAll(zinnen)) {
        const woorden = m[0].trim().split(/\s+/).filter(Boolean).length;
        if (woorden > 40) yield { index: m.index, bericht: `zin van ${woorden} woorden` };
      }
    },
  },
  {
    naam: 'herhaalde-opening',
    niveau: 'waarschuwing',
    zoek: function* (proza) {
      const regels = proza.split('\n');
      let vorig = null;
      let reeks = 0;
      let positie = 0;
      let startRegel = 0;
      for (let i = 0; i < regels.length; i++) {
        const eerste = (regels[i].trim().match(/^[-*]?\s*(\w+)/) || [])[1];
        if (eerste && eerste === vorig) {
          reeks += 1;
          if (reeks === 2) {
            yield { index: startRegel, bericht: `drie regels op rij beginnen met "${eerste}"` };
          }
        } else {
          reeks = 0;
          startRegel = positie;
        }
        vorig = eerste || null;
        positie += regels[i].length + 1;
      }
    },
  },
  {
    naam: 'samenvatting',
    niveau: 'waarschuwing',
    zoek: (proza) =>
      treffers(
        proza,
        /(?<=^|\n)#{2,6}\s+(Samenvatting|Kortom|Tot slot|Samengevat)\b/gi,
        (m) => `"${m[1]}" aan het eind; de leerling heeft het net gelezen`,
      ),
  },
  {
    naam: 'leerling-vorm',
    niveau: 'waarschuwing',
    // Niet op docentmateriaal: §15 schrijft daar juist "je leerlingen" voor.
    nietIn: /voor-de-docent|docenten\.mdx?$/,
    zoek: (proza) =>
      treffers(
        proza,
        /\bde leerling\b/gi,
        () => '"de leerling" in lestekst; spreek de lezer aan met "je"',
      ),
  },
];

const REGELNAMEN = new Set(REGELS.map((r) => r.naam));

// ── Uitzonderingen ──────────────────────────────────────────────────────────

const UITZONDERING = /\{\/\*\s*stijl-uitzondering:\s*([a-z-]+(?:\s*,\s*[a-z-]+)*)\s+(.+?)\*\/\}/g;
const UITZONDERING_BESTAND =
  /\{\/\*\s*stijl-uitzondering-bestand:\s*([a-z-]+(?:\s*,\s*[a-z-]+)*)\s+(.+?)\*\/\}/g;

function parseUitzonderingen(tekst) {
  const bestand = new Set();
  for (const m of tekst.matchAll(UITZONDERING_BESTAND)) {
    for (const naam of m[1].split(',')) bestand.add(naam.trim());
  }
  // Een losse marker geldt tot de volgende lege regel ná de marker.
  const lokaal = [];
  for (const m of tekst.matchAll(UITZONDERING)) {
    const na = tekst.indexOf('\n\n', m.index + m[0].length);
    const einde = tekst.indexOf('\n\n', na + 2);
    lokaal.push({
      namen: new Set(m[1].split(',').map((n) => n.trim())),
      van: m.index,
      tot: einde === -1 ? tekst.length : einde,
    });
  }
  return { bestand, lokaal };
}

// ── De controle ─────────────────────────────────────────────────────────────

/**
 * @param {string} tekst  de ruwe inhoud van een .md/.mdx-bestand
 * @param {{bestand?: string}} opties  het pad, voor regels die niet overal gelden
 * @returns {{regel:number, naam:string, niveau:string, bericht:string}[]}
 */
function controleer(tekst, { bestand = '' } = {}) {
  const proza = alleenProza(tekst);
  const prozaMetLinks = alleenProza(tekst, { linkdoelen: false });
  const { bestand: uitgezonderd, lokaal } = parseUitzonderingen(tekst);
  const meldingen = [];

  for (const regel of REGELS) {
    if (uitgezonderd.has(regel.naam)) continue;
    if (regel.nietIn?.test(bestand)) continue;
    for (const { index, bericht } of regel.zoek(regel.metLinkdoelen ? prozaMetLinks : proza)) {
      const gedekt = lokaal.some(
        (u) => u.namen.has(regel.naam) && index >= u.van && index <= u.tot,
      );
      if (gedekt) continue;
      meldingen.push({
        regel: regelVan(tekst, index),
        naam: regel.naam,
        niveau: regel.niveau,
        bericht,
      });
    }
  }

  return meldingen.sort((a, b) => a.regel - b.regel);
}

module.exports = { controleer, alleenProza, REGELS, REGELNAMEN };
