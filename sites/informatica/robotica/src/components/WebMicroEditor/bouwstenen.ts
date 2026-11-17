// De bouwstenen van het palet links in de editor: per onderdeel en per
// Python-stap het stukje code dat een klik in het programma zet. Zoals de
// blokken in een blokkeneditor, maar dan als Python.
//
// Een bouwsteen bestaat uit drie delen, en invoegen.ts zet elk op zijn plek:
// - `imports`: bovenaan het programma, één keer;
// - `opzet`: het onderdeel aanmaken (`tof = TimeOfFlight(…)`), één keer en
//   vóór de rest. Een blok in een blokkeneditor doet dat ongezien; hier staat
//   het in de code, zodat de leerling ziet welke pinnen bezet zijn;
// - `code`: op de regel van de cursor, met de inspringing van die plek.
//
// De code volgt de lessen (zie CLAUDE.md van robotica): pinnen als naam, de
// pinnen van DCMotors, het scherm en de TOF voluit, en de namen van de
// Lego-auto, of van de onderdeelpagina als de Lego-auto het onderdeel niet
// heeft. Wie lescode in de editor heeft en een bouwsteen aanklikt, krijgt zo
// geen tweede onderdeel op dezelfde pin. invoegen.test.ts eist dat elke opzet
// letterlijk in een les staat; leaphy-api.test.ts toetst elke bouwsteen tegen
// de bibliotheek, en CI compileert en draait ze (src/lego-tests/schrijf.ts).
//
// Een label zegt wat de bouwsteen doet ("Onthoud iets"), niet hoe het in
// Python heet ("Variabele").

export type Import = { uit: string; namen: string[] };

export type Bouwsteen = {
  id: string;
  label: string;
  imports?: Import[];
  opzet?: string;
  /**
   * Tussen ⟦ en ⟧ staat wat na het invoegen geselecteerd is: een voorwaarde
   * die de leerling nog invult. ⟦⟧ is alleen de cursor: het gat in een lus.
   * Zonder teken staat de cursor achter de code.
   */
  code: string;
  /**
   * Namen die de code zelf maakt en die per keer anders moeten heten: de
   * teller van een lus. Bestaat `teller` al, dan wordt het `teller_2`.
   */
  namen?: string[];
  /** De onderdeelpagina met de uitleg en het aansluitschema. */
  les?: string;
};

export type Groep = { id: string; label: string; bouwstenen: Bouwsteen[] };

/** Het soort gegevens dat een gesleepte bouwsteen meedraagt: zijn id. */
export const SLEEP_TYPE = 'application/x-coderius-bouwsteen';

/** De code waarmee een nieuwe editor begint. */
export const STARTCODE = "# Schrijf hier je code.\nprint('Hallo Lego-auto!')\n";

const PIN: Import = { uit: 'machine', namen: ['Pin'] };
const ADC: Import = { uit: 'machine', namen: ['ADC'] };
const SLEEP: Import = { uit: 'time', namen: ['sleep'] };

const MOTOREN = {
  imports: [{ uit: 'leaphymicropython.actuators.dcmotor', namen: ['DCMotors'] }],
  opzet: [
    'motoren = DCMotors(',
    '    dir_pin_motor_a="D2",',
    '    pwm_pin_motor_a="D3",',
    '    dir_pin_motor_b="D4",',
    '    pwm_pin_motor_b="D11",',
    ')',
    'motor_a = motoren.motor_a',
    'motor_b = motoren.motor_b',
  ].join('\n'),
  les: 'dc-motor',
};

const LAMPJE = {
  imports: [PIN],
  opzet: "lampje = Pin('LED', Pin.OUT)",
  les: 'ingebouwd-lampje',
};

const BUZZER = {
  imports: [{ uit: 'machine', namen: ['Pin', 'PWM'] }],
  opzet: 'buzzer = PWM(Pin("D6"))',
  les: 'buzzer',
};

const LIJNSENSOR = {
  imports: [{ uit: 'leaphymicropython.sensors.linesensor', namen: ['AnalogIR'] }],
  les: 'ir-analoog',
};

export const GROEPEN: Groep[] = [
  {
    id: 'sensoren',
    label: 'Sensoren',
    bouwstenen: [
      {
        id: 'lijn-links',
        label: 'Lijnsensor links',
        ...LIJNSENSOR,
        opzet: 'links = AnalogIR("A0", 2500)',
        code: 'kleur_links = links.black_or_white()',
      },
      {
        id: 'lijn-rechts',
        label: 'Lijnsensor rechts',
        ...LIJNSENSOR,
        opzet: 'rechts = AnalogIR("A1", 2500)',
        code: 'kleur_rechts = rechts.black_or_white()',
      },
      {
        id: 'lijn-digitaal',
        label: 'Lijnsensor (digitaal)',
        imports: [PIN],
        opzet: 'sensor = Pin("D14", Pin.IN)',
        code: 'waarde = sensor.value()',
        les: 'ir-digitaal',
      },
      {
        id: 'afstand-tof',
        label: 'Afstand in mm (TOF)',
        imports: [{ uit: 'leaphymicropython.sensors.tof', namen: ['TimeOfFlight'] }],
        // Kanaal 0 van de multiplexer, zoals op de Lego-auto. Zonder
        // multiplexer slaat de bibliotheek het kanaal over.
        opzet: [
          'tof = TimeOfFlight(',
          '    channel=0,',
          '    sda_gpio_pin="SDA", scl_gpio_pin="SCL",',
          ')',
        ].join('\n'),
        code: 'afstand = tof.get_distance()',
        les: 'tof',
      },
      {
        id: 'afstand-ultrasoon',
        label: 'Afstand in cm (ultrasoon)',
        imports: [{ uit: 'leaphymicropython.sensors.sonar', namen: ['read_distance'] }],
        code: 'afstand_cm = read_distance("D7", "D8")',
        les: 'afstandssensor',
      },
      {
        id: 'drukknop',
        label: 'Drukknop',
        imports: [PIN],
        opzet: 'knop = Pin("D7", Pin.IN, Pin.PULL_UP)',
        code: 'ingedrukt = knop.value() == 0',
        les: 'drukknop',
      },
      {
        id: 'potmeter',
        label: 'Draaiknop (potmeter)',
        imports: [ADC],
        opzet: 'pot = ADC("A0")',
        code: 'stand = pot.read_u16()',
        les: 'potmeter',
      },
      {
        id: 'joystick',
        label: 'Joystick',
        imports: [ADC],
        opzet: 'x = ADC("A2")\ny = ADC("A1")',
        code: 'links_rechts = x.read_u16()\nvoor_achter = y.read_u16()',
        les: 'joystick',
      },
    ],
  },
  {
    id: 'actuatoren',
    label: 'Actuatoren',
    bouwstenen: [
      {
        id: 'rijd-vooruit',
        label: 'Rijd vooruit',
        ...MOTOREN,
        code: 'motor_a.forward(255)\nmotor_b.forward(255)',
      },
      {
        id: 'rijd-achteruit',
        label: 'Rijd achteruit',
        ...MOTOREN,
        code: 'motor_a.backward(255)\nmotor_b.backward(255)',
      },
      {
        id: 'motoren-stop',
        label: 'Stop met rijden',
        ...MOTOREN,
        code: 'motor_a.forward(0)\nmotor_b.forward(0)',
      },
      {
        id: 'servo',
        label: 'Servo draaien',
        imports: [{ uit: 'leaphymicropython.actuators.servo', namen: ['set_servo_angle'] }],
        code: 'set_servo_angle("D6", 90)',
        les: 'servo',
      },
      { id: 'lampje-aan', label: 'Lampje aan', ...LAMPJE, code: 'lampje.on()' },
      { id: 'lampje-uit', label: 'Lampje uit', ...LAMPJE, code: 'lampje.off()' },
      {
        id: 'rgb-led',
        label: 'RGB-led rood',
        imports: [{ uit: 'leaphymicropython.actuators.rgbled', namen: ['RGBLed'] }],
        opzet: 'led = RGBLed("D10", "D9", "D6")',
        code: 'led.set_color(255, 0, 0)',
        les: 'rgb-led',
      },
      {
        id: 'buzzer-aan',
        label: 'Buzzer aan',
        ...BUZZER,
        code: 'buzzer.freq(440)\nbuzzer.duty_u16(32768)',
      },
      { id: 'buzzer-uit', label: 'Buzzer uit', ...BUZZER, code: 'buzzer.duty_u16(0)' },
      {
        id: 'oled',
        label: 'Tekst op het scherm',
        imports: [{ uit: 'leaphymicropython.actuators.oled_screen', namen: ['OLEDSH1106'] }],
        opzet: [
          'oled = OLEDSH1106(',
          '    width=128, height=64, channel=7,',
          '    sda_gpio_pin="SDA", scl_gpio_pin="SCL",',
          ')',
        ].join('\n'),
        code: "oled.fill('white')\noled.text('Hallo', x=0, y=0)\noled.show()",
        les: 'oled-scherm',
      },
    ],
  },
  {
    id: 'python',
    label: 'Python',
    bouwstenen: [
      { id: 'herhaal-altijd', label: 'Herhaal voor altijd', code: 'while True:\n    ⟦⟧' },
      {
        id: 'herhaal-keer',
        label: 'Herhaal 3 keer',
        code: 'teller = 0\nwhile teller < 3:\n    ⟦⟧\n    teller = teller + 1',
        namen: ['teller'],
      },
      { id: 'herhaal-zolang', label: 'Herhaal zolang', code: 'while ⟦voorwaarde⟧:\n    ' },
      { id: 'als', label: 'Als', code: 'if ⟦voorwaarde⟧:\n    ' },
      { id: 'als-anders', label: 'Als, anders', code: 'if ⟦voorwaarde⟧:\n    \nelse:\n    ' },
      { id: 'wacht', label: 'Wacht', imports: [SLEEP], code: 'sleep(1)' },
      { id: 'toon', label: 'Toon in de shell', code: 'print("Hallo")' },
      { id: 'onthoud', label: 'Onthoud iets', code: '⟦naam⟧ = 0' },
    ],
  },
];

export const BOUWSTENEN: Bouwsteen[] = GROEPEN.flatMap((g) => g.bouwstenen);

export function bouwsteenMetId(id: string): Bouwsteen | undefined {
  return BOUWSTENEN.find((b) => b.id === id);
}
