// De bouwstenen van het palet links in de editor: de onderdelen van de robot
// en de stappen van Python, zoals de blokken in een blokkeneditor.
//
// Een bouwsteen zet niets in de code van de leerling. Een klik toont een
// voorbeeld naast de code, met de regels waar het om gaat gemarkeerd, een zin
// uitleg en links naar de lessen. De leerling typt zelf: wie een regel
// overneemt en aanpast, weet daarna wat hij doet (de opdrachtgever wilde geen
// code die vanzelf verschijnt).
//
// - `voorbeeld` is een heel programma dat op het bord draait: de import, het
//   aanmaken van het onderdeel en een paar regels die het gebruiken. CI
//   compileert en draait elk voorbeeld (src/lego-tests/schrijf.ts) en
//   leaphy-api.test.ts toetst het tegen de bibliotheek, net als een les.
// - `kern` zijn de regels van het voorbeeld waar de bouwsteen om gaat.
// - `links` wijzen naar de les waar je het leert en naar de naslag.
//
// De code volgt de lessen (zie CLAUDE.md van robotica): de namen en pinnen
// van de Lego-auto, of van de onderdeelpagina als de Lego-auto het onderdeel
// niet heeft. bouwstenen.test.ts eist dat elke regel die een onderdeel
// aanmaakt letterlijk in een les staat.
//
// Een label zegt wat de bouwsteen doet ("Onthoud iets"), niet hoe het in
// Python heet ("Variabele").

export type Verwijzing = {
  label: string;
  /** Een andere cursus uit de registry (`python`); zonder: robotica zelf. */
  site?: string;
  /** Het pad op die cursus, zoals in de adresbalk na de naam van de cursus. */
  naar: string;
};

export type Bouwsteen = {
  id: string;
  label: string;
  /** Een heel programma dat op het bord draait. */
  voorbeeld: string;
  /** De regels van het voorbeeld waar het om gaat, letterlijk. */
  kern: string[];
  /** Eén of twee zinnen bij het voorbeeld; tussen backticks staat code. */
  uitleg: string;
  links: Verwijzing[];
};

export type Groep = { id: string; label: string; bouwstenen: Bouwsteen[] };

/** De code waarmee een nieuwe editor begint. */
export const STARTCODE = "# Schrijf hier je code.\nprint('Hallo Lego-auto!')\n";

const programma = (...regels: string[]) => `${regels.join('\n')}\n`;

const onderdeel = (pagina: string, label: string): Verwijzing => ({
  label,
  naar: `/docs/onderdelen/${pagina}`,
});
const legoAuto = (slug: string, label: string): Verwijzing => ({
  label,
  naar: `/lego_auto/${slug}`,
});
const python = (pad: string, label: string): Verwijzing => ({
  label,
  site: 'python',
  naar: `/docs/${pad}`,
});

const WHILE_LOOP = python('herhalen/while-loop', 'De while-loop');
const CODE_BEGRIJPEN = legoAuto('lijnsensor/code-begrijpen', 'Code beter begrijpen: loops');

export const GROEPEN: Groep[] = [
  {
    id: 'sensoren',
    label: 'Sensoren',
    bouwstenen: [
      {
        id: 'lijnsensor',
        label: 'Lijnsensor',
        voorbeeld: programma(
          'from leaphymicropython.sensors.linesensor import AnalogIR',
          'from time import sleep',
          '',
          'links = AnalogIR("A0", 2500)',
          '',
          'while True:',
          '    kleur_links = links.black_or_white()',
          '    print(f"Links: {kleur_links}")',
          '    sleep(0.2)',
        ),
        kern: ['links = AnalogIR("A0", 2500)', '    kleur_links = links.black_or_white()'],
        uitleg:
          'De sensor kijkt naar de vloer onder de auto. `kleur_links` is `"black"` boven de lijn en `"white"` ernaast.',
        links: [
          legoAuto('lijnsensor/een-sensor', 'Deel 3: Eén sensor uitlezen'),
          onderdeel('ir-analoog', 'Analoge IR-sensor: aansluiten en afstellen'),
        ],
      },
      {
        id: 'twee-lijnsensoren',
        label: 'Twee lijnsensoren',
        voorbeeld: programma(
          'from leaphymicropython.sensors.linesensor import AnalogIR',
          'from time import sleep',
          '',
          'links = AnalogIR("A0", 2500)',
          'rechts = AnalogIR("A1", 2500)',
          '',
          'while True:',
          '    kleur_links = links.black_or_white()',
          '    kleur_rechts = rechts.black_or_white()',
          '    print(f"Links: {kleur_links}")',
          '    print(f"Rechts: {kleur_rechts}")',
          '    sleep(0.2)',
        ),
        kern: ['rechts = AnalogIR("A1", 2500)', '    kleur_rechts = rechts.black_or_white()'],
        uitleg:
          'Elke sensor heeft een eigen pin en een eigen naam. Met twee sensoren weet de auto aan welke kant de lijn ligt.',
        links: [
          legoAuto('lijnsensor/twee-sensoren', 'Deel 4: Twee sensoren'),
          onderdeel('lijnvolgen', 'Lijnvolgen'),
        ],
      },
      {
        id: 'lijn-digitaal',
        label: 'Lijnsensor (digitaal)',
        voorbeeld: programma(
          'from machine import Pin',
          'from time import sleep',
          '',
          'sensor = Pin("D14", Pin.IN)',
          '',
          'while True:',
          '    print(sensor.value())',
          '    sleep(0.5)',
        ),
        kern: ['sensor = Pin("D14", Pin.IN)', '    print(sensor.value())'],
        uitleg:
          'Een digitale sensor geeft alleen 0 of 1. Welke van de twee zwart is, zie je door hem boven de lijn te houden.',
        links: [onderdeel('ir-digitaal', 'Digitale IR-sensor: aansluiten en uitlezen')],
      },
      {
        id: 'afstand-tof',
        label: 'Afstand in mm (TOF)',
        voorbeeld: programma(
          'from leaphymicropython.sensors.tof import TimeOfFlight',
          'from time import sleep',
          '',
          'tof = TimeOfFlight(',
          '    channel=0,',
          '    sda_gpio_pin="SDA", scl_gpio_pin="SCL",',
          ')',
          '',
          'while True:',
          '    afstand = tof.get_distance()',
          '    print(afstand)',
          '    sleep(1)',
        ),
        kern: [
          'tof = TimeOfFlight(',
          '    channel=0,',
          '    sda_gpio_pin="SDA", scl_gpio_pin="SCL",',
          ')',
          '    afstand = tof.get_distance()',
        ],
        uitleg:
          '`afstand` is de afstand in millimeters. Ziet de sensor niets, dan krijg je 8191. `channel=0` is het kanaal op de multiplexer.',
        links: [
          legoAuto('afstand/uitlezen', 'De afstand uitlezen'),
          legoAuto('afstand/stoppen', 'Deel 10: Stoppen voor een obstakel'),
          onderdeel('tof', 'Time of Flight-sensor: aansluiten'),
        ],
      },
      {
        id: 'afstand-ultrasoon',
        label: 'Afstand in cm (ultrasoon)',
        voorbeeld: programma(
          'from time import sleep',
          'from leaphymicropython.sensors.sonar import read_distance',
          '',
          'while True:',
          '    afstand_cm = read_distance("D7", "D8")',
          '    print(afstand_cm)',
          '    sleep(1)',
        ),
        kern: ['    afstand_cm = read_distance("D7", "D8")'],
        uitleg:
          '`read_distance` meet met geluid en geeft de afstand in centimeters. De eerste pin is Trig, de tweede Echo.',
        links: [onderdeel('afstandssensor', 'Afstandssensor: aansluiten en uitlezen')],
      },
      {
        id: 'drukknop',
        label: 'Drukknop',
        voorbeeld: programma(
          'from machine import Pin',
          'from time import sleep',
          '',
          'knop = Pin("D7", Pin.IN, Pin.PULL_UP)',
          '',
          'while True:',
          '    print(knop.value())',
          '    sleep(0.2)',
        ),
        kern: ['knop = Pin("D7", Pin.IN, Pin.PULL_UP)', '    print(knop.value())'],
        uitleg:
          'Let op de omgekeerde waarde: `knop.value()` is 1 als je de knop loslaat en 0 als je hem indrukt.',
        links: [onderdeel('drukknop', 'Drukknop: aansluiten en uitlezen')],
      },
      {
        id: 'potmeter',
        label: 'Draaiknop (potmeter)',
        voorbeeld: programma(
          'from machine import ADC',
          'from time import sleep',
          '',
          'pot = ADC("A0")',
          '',
          'while True:',
          '    print(pot.read_u16())',
          '    sleep(0.2)',
        ),
        kern: ['pot = ADC("A0")', '    print(pot.read_u16())'],
        uitleg:
          '`read_u16()` geeft een getal van 0 tot en met 65535: 0 met de knop helemaal dicht, 65535 helemaal open.',
        links: [onderdeel('potmeter', 'Potmeter: aansluiten en uitlezen')],
      },
      {
        id: 'joystick',
        label: 'Joystick',
        voorbeeld: programma(
          'from machine import ADC',
          'from time import sleep',
          '',
          'x = ADC("A2")',
          'y = ADC("A1")',
          '',
          'while True:',
          '    print(x.read_u16(), y.read_u16())',
          '    sleep(0.2)',
        ),
        kern: ['x = ADC("A2")', 'y = ADC("A1")', '    print(x.read_u16(), y.read_u16())'],
        uitleg:
          'Een joystick is twee draaiknoppen in één: `x` voor links en rechts, `y` voor voor en achter. In het midden geven ze ongeveer 32000.',
        links: [onderdeel('joystick', 'Joystick: aansluiten en uitlezen')],
      },
    ],
  },
  {
    id: 'actuatoren',
    label: 'Actuatoren',
    bouwstenen: [
      {
        id: 'rijden',
        label: 'Rijden en stoppen',
        voorbeeld: programma(
          'from leaphymicropython.actuators.dcmotor import DCMotors',
          'from time import sleep',
          '',
          'motoren = DCMotors(',
          '    dir_pin_motor_a="D2",',
          '    pwm_pin_motor_a="D3",',
          '    dir_pin_motor_b="D4",',
          '    pwm_pin_motor_b="D11",',
          ')',
          'motor_a = motoren.motor_a',
          'motor_b = motoren.motor_b',
          '',
          'motor_a.forward(255)',
          'motor_b.forward(255)',
          'sleep(2)',
          'motor_a.forward(0)',
          'motor_b.forward(0)',
        ),
        kern: [
          'motor_a.forward(255)',
          'motor_b.forward(255)',
          'motor_a.forward(0)',
          'motor_b.forward(0)',
        ],
        uitleg:
          'Het getal is de snelheid, van 0 (stil) tot en met 255. Met `backward(255)` rijd je achteruit; twee verschillende snelheden geven een bocht.',
        links: [
          legoAuto('motoren/draaien', 'Deel 6: De motoren wakker maken'),
          legoAuto('lijnvolgen/rechtdoor', 'Deel 7: Rechtdoor rijden'),
          onderdeel('dc-motor', 'DC-motor: de vier pinnen'),
        ],
      },
      {
        id: 'servo',
        label: 'Servo draaien',
        voorbeeld: programma(
          'from leaphymicropython.actuators.servo import set_servo_angle',
          'from time import sleep',
          '',
          'set_servo_angle("D6", 0)',
          'sleep(1)',
          'set_servo_angle("D6", 90)',
          'sleep(1)',
          'set_servo_angle("D6", 180)',
        ),
        kern: ['set_servo_angle("D6", 90)'],
        uitleg:
          'Een servo draait naar een hoek en blijft daar staan. De hoek is een getal van 0 tot en met 180 graden.',
        links: [onderdeel('servo', 'Servo: aansluiten en aansturen')],
      },
      {
        id: 'lampje',
        label: 'Lampje aan en uit',
        voorbeeld: programma(
          'from machine import Pin',
          'from time import sleep',
          '',
          "lampje = Pin('LED', Pin.OUT)",
          '',
          'while True:',
          '    lampje.on()',
          '    sleep(0.5)',
          '    lampje.off()',
          '    sleep(0.5)',
        ),
        kern: ["lampje = Pin('LED', Pin.OUT)", '    lampje.on()', '    lampje.off()'],
        uitleg:
          "`'LED'` is het oranje lampje op de Arduino zelf. Voor een eigen lampje op het shield zet je daar de naam van zijn pin.",
        links: [
          legoAuto('eerste-programma/lampje', 'Deel 1: Een lampje aan'),
          legoAuto('eerste-programma/knipperen', 'Deel 2: Knipperen met een loop'),
          onderdeel('led', 'LED: een eigen lampje aansluiten'),
        ],
      },
      {
        id: 'rgb-led',
        label: 'RGB-led: een kleur',
        voorbeeld: programma(
          'from time import sleep',
          'from leaphymicropython.actuators.rgbled import RGBLed',
          '',
          'led = RGBLed("D10", "D9", "D6")',
          '',
          'while True:',
          '    led.set_color(255, 0, 0)  # rood',
          '    sleep(1)',
          '    led.set_color(0, 0, 0)    # uit',
          '    sleep(1)',
        ),
        kern: ['led = RGBLed("D10", "D9", "D6")', '    led.set_color(255, 0, 0)  # rood'],
        uitleg:
          'De drie getallen zijn rood, groen en blauw, elk van 0 tot en met 255. Samen mengen ze elke kleur.',
        links: [onderdeel('rgb-led', 'RGB-LED: aansluiten en kleuren mengen')],
      },
      {
        id: 'buzzer',
        label: 'Buzzer: een toon',
        voorbeeld: programma(
          'from machine import Pin, PWM',
          'from time import sleep',
          '',
          'buzzer = PWM(Pin("D6"))',
          'buzzer.freq(440)',
          'buzzer.duty_u16(32768)',
          'sleep(1)',
          'buzzer.duty_u16(0)',
        ),
        kern: ['buzzer.freq(440)', 'buzzer.duty_u16(32768)', 'buzzer.duty_u16(0)'],
        uitleg:
          '`freq` is de toonhoogte: een hoger getal klinkt hoger. `duty_u16(32768)` zet het geluid aan, `duty_u16(0)` uit.',
        links: [onderdeel('buzzer', 'Buzzer: aansluiten en tonen maken')],
      },
      {
        id: 'oled',
        label: 'Tekst op het scherm',
        voorbeeld: programma(
          'from leaphymicropython.actuators.oled_screen import OLEDSH1106',
          '',
          'oled = OLEDSH1106(',
          '    width=128, height=64, channel=7,',
          '    sda_gpio_pin="SDA", scl_gpio_pin="SCL",',
          ')',
          '',
          "oled.fill('white')",
          "oled.text('Hallo!', x=0, y=0)",
          'oled.show()',
        ),
        kern: ["oled.fill('white')", "oled.text('Hallo!', x=0, y=0)", 'oled.show()'],
        uitleg:
          '`fill` maakt het scherm leeg, `text` zet er tekst op en pas `show()` laat het zien. `x` en `y` zijn de plek, geteld vanaf linksboven.',
        links: [
          legoAuto('scherm/waardes-op-scherm', 'Deel 5: Waardes op het scherm'),
          onderdeel('oled-scherm', 'OLED-scherm: aansluiten en grotere tekst'),
        ],
      },
    ],
  },
  {
    id: 'python',
    label: 'Python',
    bouwstenen: [
      {
        id: 'herhaal-altijd',
        label: 'Herhaal voor altijd',
        voorbeeld: programma(
          'from time import sleep',
          '',
          'while True:',
          '    print("Hallo")',
          '    sleep(1)',
        ),
        kern: ['while True:'],
        uitleg:
          'Alles wat onder `while True:` is ingesprongen, herhaalt de robot tot je op Stop klikt. Vier spaties of één keer Tab.',
        links: [
          legoAuto('eerste-programma/knipperen', 'Deel 2: Knipperen met een loop'),
          WHILE_LOOP,
        ],
      },
      {
        id: 'herhaal-keer',
        label: 'Herhaal 3 keer',
        voorbeeld: programma(
          'teller = 0',
          'while teller < 3:',
          '    print("Hallo")',
          '    teller = teller + 1',
        ),
        kern: ['teller = 0', 'while teller < 3:', '    teller = teller + 1'],
        uitleg:
          'De teller begint op 0 en gaat elke ronde 1 omhoog. Bij 3 klopt `teller < 3` niet meer en stopt de loop.',
        links: [CODE_BEGRIJPEN, WHILE_LOOP],
      },
      {
        id: 'herhaal-zolang',
        label: 'Herhaal zolang',
        voorbeeld: programma(
          'afstand = 100',
          'while afstand > 10:',
          '    print(afstand)',
          '    afstand = afstand - 30',
          'print("gestopt")',
        ),
        kern: ['while afstand > 10:'],
        uitleg:
          'De loop gaat door zolang de voorwaarde klopt. Wat niet meer is ingesprongen, komt pas daarna aan de beurt.',
        links: [
          CODE_BEGRIJPEN,
          WHILE_LOOP,
          python('beslissen/05a-booleans-en-vergelijken', 'Vergelijken met < en =='),
        ],
      },
      {
        id: 'als',
        label: 'Als',
        voorbeeld: programma('afstand = 8', '', 'if afstand < 10:', '    print("dichtbij")'),
        kern: ['if afstand < 10:'],
        uitleg:
          'De ingesprongen regels draaien alleen als de voorwaarde klopt. Verander 8 in 50 en er gebeurt niets.',
        links: [
          legoAuto('afstand/stoppen', 'Deel 10: Stoppen voor een obstakel'),
          python('beslissen/05b-if-else', 'If en else'),
        ],
      },
      {
        id: 'als-anders',
        label: 'Als, anders',
        voorbeeld: programma(
          'afstand = 8',
          '',
          'if afstand < 10:',
          '    print("dichtbij")',
          'else:',
          '    print("ver weg")',
        ),
        kern: ['if afstand < 10:', 'else:'],
        uitleg:
          'Klopt de voorwaarde, dan draait het eerste blok, en anders het blok onder `else:`. Nooit allebei.',
        links: [
          legoAuto('lijnvolgen/rechtdoor', 'Deel 7: Rechtdoor rijden'),
          python('beslissen/05b-if-else', 'If en else'),
          python('beslissen/05c-and-or-elif', 'and, or en elif'),
        ],
      },
      {
        id: 'wacht',
        label: 'Wacht',
        voorbeeld: programma(
          'from time import sleep',
          '',
          'print("een")',
          'sleep(1)',
          'print("twee")',
          'sleep(0.5)',
          'print("drie")',
        ),
        kern: ['from time import sleep', 'sleep(1)', 'sleep(0.5)'],
        uitleg:
          'Het getal is de tijd in seconden; `sleep(0.5)` is een halve seconde. De import bovenaan heb je één keer nodig.',
        links: [legoAuto('eerste-programma/knipperen', 'Deel 2: Knipperen met een loop')],
      },
      {
        id: 'toon',
        label: 'Toon in de shell',
        voorbeeld: programma('afstand = 25', '', 'print("Hallo")', 'print(f"Afstand: {afstand}")'),
        kern: ['print("Hallo")', 'print(f"Afstand: {afstand}")'],
        uitleg:
          'Tekst staat tussen aanhalingstekens. Met een `f` ervoor en accolades zet je de waarde van een naam in de tekst.',
        links: [
          python('basis/jouw-naam-op-het-scherm', 'Tekst tonen met print'),
          python('tekst/04a-f-strings', 'Tekst en getallen combineren met f-strings'),
        ],
      },
      {
        id: 'onthoud',
        label: 'Onthoud iets',
        voorbeeld: programma(
          'lijnen = 0',
          'lijnen = lijnen + 1',
          'lijnen = lijnen + 1',
          'print(lijnen)',
        ),
        kern: ['lijnen = 0', 'lijnen = lijnen + 1'],
        uitleg:
          'Met `=` bewaar je een waarde onder een naam die je zelf kiest. Later gebruik je die naam om de waarde te lezen of te veranderen.',
        links: [
          python('basis/jij-als-variabele', 'Variabelen'),
          python('basis/rekenmachine', 'Rekenen met variabelen'),
        ],
      },
    ],
  },
];

export const BOUWSTENEN: Bouwsteen[] = GROEPEN.flatMap((g) => g.bouwstenen);

export function bouwsteenMetId(id: string): Bouwsteen | undefined {
  return BOUWSTENEN.find((b) => b.id === id);
}

/** De regelnummers (vanaf 1) van het voorbeeld waar de bouwsteen om gaat. */
export function kernRegels(bouwsteen: Bouwsteen): number[] {
  const kern = new Set(bouwsteen.kern);
  return bouwsteen.voorbeeld.split('\n').flatMap((regel, i) => (kern.has(regel) ? [i + 1] : []));
}
