// Afgeleide teksten voor de nakijker van robotica. Elke functie krijgt de
// code van één bestand (zonder commentaar) en geeft een tekst van dezelfde
// lengte terug, met elk regeleinde op zijn plek: wat niet telt, wordt spaties.
// Zo wijst een vondst nog naar de goede regel van het echte bestand (zie
// `AfgeleideSoort` in packages/checker).
//
// Waarom niet gewoon een regex op de code: "één IR-sensor uitlezen" is meer
// dan `AnalogIR("A0", 2500)` op een regel. De sensor moet ook gelezen worden,
// en voor "lijnvolgen met vier" moet wat hij leest in een `if` terechtkomen.
// Dat vraagt namen volgen: welke variabele is de sensor, welke variabele
// krijgt zijn waarde, en staat die in een beslissing. Een regex kan dat
// alleen met terugverwijzingen die niemand meer kan lezen.

const blanco = (s: string) => s.replace(/[^\n]/g, ' ');

/** Alleen de stukken op `[van, tot)` blijven staan; de rest wordt spaties. */
function houd(tekst: string, stukken: [number, number][]): string {
  const uit = blanco(tekst).split('');
  for (const [van, tot] of stukken) {
    for (let i = van; i < tot; i++) uit[i] = tekst[i];
  }
  return uit.join('');
}

/**
 * De code zonder de inhoud van strings: de aanhalingstekens blijven staan, de
 * tekst ertussen wordt spaties. `print("links and rechts")` gaf eerst and/or,
 * `oled.text("Obstakel > stop")` een boolean en `print("DCMotors()")` de
 * motoren. Een f-string verliest ook wat tussen de accolades staat; een
 * vergelijking of berekening daarin is zeldzaam, een woord als "or" niet.
 */
export function zonderTekst(code: string): string {
  let uit = '';
  let i = 0;
  while (i < code.length) {
    const c = code[i];
    if (c !== '"' && c !== "'") {
      uit += c;
      i++;
      continue;
    }
    const drie = code.startsWith(c.repeat(3), i);
    const sluit = drie ? c.repeat(3) : c;
    let j = i + sluit.length;
    while (j < code.length) {
      if (code[j] === '\\') j += 2;
      else if (code.startsWith(sluit, j)) break;
      else if (!drie && code[j] === '\n') break;
      else j++;
    }
    const binnenEind = Math.min(j, code.length);
    const dicht = code.startsWith(sluit, binnenEind);
    uit += sluit + blanco(code.slice(i + sluit.length, binnenEind)) + (dicht ? sluit : '');
    i = binnenEind + (dicht ? sluit.length : 0);
  }
  return uit;
}

const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** De namen waaronder een klasse in dit bestand heet: `AnalogIR as IR` erbij. */
function namenVan(code: string, klasse: string): string[] {
  const namen = new Set([klasse]);
  for (const m of code.matchAll(new RegExp(`\\b${klasse}\\s+as\\s+(\\w+)`, 'g'))) namen.add(m[1]);
  return [...namen];
}

// Een analoge IR-sensor lees je met black_or_white of get_analog_value, een
// digitale met value (zie ir-analoog.mdx en ir-digitaal.mdx).
const LEES_ANALOOG = '\\.(?:black_or_white|get_analog_value)\\s*\\(';
const LEES_DIGITAAL = '\\.value\\s*\\(\\s*\\)';

interface Sensor {
  /** De variabele, of null bij een sensor in een lijst of een hulpfunctie. */
  naam: string | null;
  digitaal: boolean;
  /** Waar de pin staat, met aanhalingstekens. */
  pin: [number, number];
}

function sensorenIn(code: string): Sensor[] {
  const ir = namenVan(code, 'AnalogIR').map(esc).join('|');
  const pin = namenVan(code, 'Pin').map(esc).join('|');
  const sensoren: Sensor[] = [];
  const bezet: [number, number][] = [];
  const pinPlek = (m: RegExpMatchArray, groep: number): [number, number] => {
    const start = (m.index ?? 0) + m[0].lastIndexOf(m[groep]) - 1;
    return [start, start + m[groep].length + 2];
  };

  // `links = AnalogIR("A0", 2500)`, ook `pin_name="A0"` en `self.links`.
  const analoog = new RegExp(
    `^[ \\t]*([\\w.]+)\\s*=\\s*(?:\\w+\\.)?(?:${ir})\\s*\\(\\s*(?:pin_name\\s*=\\s*)?["'](A[0-7])["']`,
    'gm',
  );
  for (const m of code.matchAll(analoog)) {
    sensoren.push({ naam: m[1], digitaal: false, pin: pinPlek(m, 2) });
    bezet.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
  }
  // `sensor = Pin("D14", Pin.IN)`, ook met `mode=`, `machine.Pin` en
  // PULL_DOWN. Met PULL_UP is het een knop (drukknop.mdx).
  const digitaal = new RegExp(
    `^[ \\t]*([\\w.]+)\\s*=\\s*(?:\\w+\\.)?(?:${pin})\\s*\\(\\s*["'](D\\d{1,2})["']\\s*,\\s*(?:mode\\s*=\\s*)?(?:[\\w.]*\\.)?IN\\b([^)\\n]*)\\)`,
    'gm',
  );
  for (const m of code.matchAll(digitaal)) {
    if (/PULL_UP/.test(m[3])) continue;
    sensoren.push({ naam: m[1], digitaal: true, pin: pinPlek(m, 2) });
  }
  // Een sensor zonder eigen variabele: `[AnalogIR("A0", 2500), …]`.
  const binnen = (i: number) => bezet.some(([van, tot]) => i >= van && i < tot);
  const los = new RegExp(`\\b(?:${ir})\\s*\\(\\s*(?:pin_name\\s*=\\s*)?["'](A[0-7])["']`, 'g');
  for (const m of code.matchAll(los)) {
    if (binnen(m.index ?? 0)) continue;
    sensoren.push({ naam: null, digitaal: false, pin: pinPlek(m, 1) });
    bezet.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
  }
  // `AnalogIR(pin, 2500)` met de pin uit een lijst of een hulpfunctie: dan is
  // elke A-pin als tekst in het bestand een sensor. Zonder zo'n aanroep is
  // een lijst A-pinnen iets anders (de joystick en de potmeter lezen ze met
  // ADC).
  if (new RegExp(`\\b(?:${ir})\\s*\\(\\s*(?:pin_name\\s*=\\s*)?[A-Za-z_]`).test(code)) {
    for (const m of code.matchAll(/["'](A[0-7])["']/g)) {
      if (binnen(m.index ?? 0)) continue;
      sensoren.push({ naam: null, digitaal: false, pin: pinPlek(m, 1) });
    }
  }
  return sensoren;
}

const leesVan = (s: Sensor) =>
  new RegExp(
    `${s.naam ? `(?<![\\w.])${esc(s.naam)}` : ''}${s.digitaal ? LEES_DIGITAAL : LEES_ANALOOG}`,
  );

/**
 * De namen die een waarde van een sensor dragen: `kleur_links =
 * links.black_or_white()`, en verder wat daaruit volgt (`tekst =
 * f"L: {kleur_links}"`), tot drie stappen ver.
 */
function waardenVan(code: string, lees: RegExp): Set<string> {
  const namen = new Set<string>();
  const regels = code.split('\n');
  for (let ronde = 0; ronde < 3; ronde++) {
    for (const regel of regels) {
      const m = /^[ \t]*([\w.]+)\s*=(?!=)(.*)$/.exec(regel);
      if (!m || namen.has(m[1])) continue;
      if (
        lees.test(m[2]) ||
        [...namen].some((n) => new RegExp(`(?<![\\w.])${esc(n)}\\b`).test(m[2]))
      )
        namen.add(m[1]);
    }
  }
  return namen;
}

const noemt = (regel: string, lees: RegExp, waarden: Set<string>) =>
  lees.test(regel) || [...waarden].some((n) => new RegExp(`(?<![\\w.])${esc(n)}\\b`).test(regel));

/** Waar de sensor gelezen wordt, en of wat hij leest in een beslissing komt. */
function gebruik(alle: string[], s: Sensor) {
  const lees = leesVan(s);
  const gelezen = alle.some((c) => lees.test(c));
  if (!gelezen) return { gelezen, inBeslissing: false };
  const inBeslissing = alle.some((c) => {
    const waarden = waardenVan(c, lees);
    return c
      .split('\n')
      .some((r) => /^[ \t]*(?:if|elif|while)\b/.test(r) && noemt(r, lees, waarden));
  });
  return { gelezen, inBeslissing };
}

/**
 * Alleen de pinnen van de IR-sensoren die gelezen worden (`beslissing`:
 * waarvan de waarde in een `if`, `elif` of `while` komt). `alle` is de code
 * van elk eigen bestand: een sensor die in `sensoren.py` staat, kan in
 * `main.py` gelezen worden.
 */
export function irPinnen(code: string, alle: string[], beslissing: boolean): string {
  const stukken = sensorenIn(code)
    .filter((s) => {
      const g = gebruik(alle.length > 0 ? alle : [code], s);
      return beslissing ? g.inBeslissing : g.gelezen;
    })
    .map((s) => s.pin);
  return houd(code, stukken);
}

/**
 * Alleen de regels die een waarde van een IR-sensor op het scherm zetten:
 * een `.text(` met die waarde erin, of een eigen functie met een `.text(`
 * erin die de waarde meekrijgt (`toon(f"L: {kleur_links}")`). "Hallo robot",
 * een teller of alleen de afstand op het scherm is niet de rij "waardes van
 * IR-sensoren tonen op scherm".
 */
export function schermMetSensor(code: string, alle: string[]): string {
  const bronnen = alle.length > 0 ? alle : [code];
  const sensoren = bronnen.flatMap(sensorenIn);
  if (sensoren.length === 0) return blanco(code);
  const lezen = [...new Set(sensoren.map((s) => leesVan(s).source))].map((b) => new RegExp(b));
  const waarden = new Set(bronnen.flatMap((c) => lezen.flatMap((l) => [...waardenVan(c, l)])));
  // Eigen functies die iets op het scherm zetten: een `def` met een `.text(`
  // in zijn lichaam (dieper ingesprongen dan de def).
  const toners = new Set<string>();
  for (const c of bronnen) {
    const regels = c.split('\n');
    regels.forEach((regel, i) => {
      const def = /^([ \t]*)def\s+(\w+)\s*\(/.exec(regel);
      if (!def) return;
      for (const volgende of regels.slice(i + 1)) {
        if (volgende.trim() === '') continue;
        if ((volgende.match(/^[ \t]*/)?.[0].length ?? 0) <= def[1].length) break;
        if (/\.text\s*\(/.test(volgende)) toners.add(def[2]);
      }
    });
  }
  const toont = new RegExp(
    `\\.text\\s*\\(${toners.size > 0 ? `|(?<![\\w.])(?:${[...toners].map(esc).join('|')})\\s*\\(` : ''}`,
  );
  const stukken: [number, number][] = [];
  let start = 0;
  for (const regel of code.split('\n')) {
    if (toont.test(regel) && !/^[ \t]*def\b/.test(regel)) {
      if (lezen.some((l) => noemt(regel, l, waarden))) stukken.push([start, start + regel.length]);
    }
    start += regel.length + 1;
  }
  return houd(code, stukken);
}
