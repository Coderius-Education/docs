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
// De code volgt de lessen (zie CLAUDE.md van robotica): pinnen als naam,
// de pinnen van DCMotors, het scherm en de TOF voluit, en dezelfde namen als
// de onderdeelpagina's. leaphy-api.test.ts toetst elke bouwsteen tegen de
// bibliotheek, en CI compileert en draait ze (src/lego-tests/schrijf.ts).

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

export const GROEPEN: Groep[] = [
  {
    id: 'sensoren',
    label: 'Sensoren',
    bouwstenen: [
      {
        id: 'lijn-analoog',
        label: 'Lijnsensor (analoog)',
        imports: [{ uit: 'leaphymicropython.sensors.linesensor', namen: ['AnalogIR'] }],
        opzet: 'lijnsensor = AnalogIR("A0", 2500)',
        code: 'kleur = lijnsensor.black_or_white()',
        les: 'ir-analoog',
      },
      {
        id: 'lijn-digitaal',
        label: 'Lijnsensor (digitaal)',
        imports: [PIN],
        opzet: 'ir_sensor = Pin("D14", Pin.IN)',
        code: 'waarde = ir_sensor.value()',
        les: 'ir-digitaal',
      },
      {
        id: 'afstand-ultrasoon',
        label: 'Afstand (ultrasoon)',
        imports: [{ uit: 'leaphymicropython.sensors.sonar', namen: ['read_distance'] }],
        code: 'afstand = read_distance("D7", "D8")',
        les: 'afstandssensor',
      },
      {
        id: 'afstand-tof',
        label: 'Afstand (TOF)',
        imports: [{ uit: 'leaphymicropython.sensors.tof', namen: ['TimeOfFlight'] }],
        opzet: [
          'tof = TimeOfFlight(',
          '    sda_gpio_pin="SDA",',
          '    scl_gpio_pin="SCL",',
          ')',
        ].join('\n'),
        code: 'afstand = tof.get_distance()',
        les: 'tof',
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
        label: 'Potmeter',
        imports: [ADC],
        opzet: 'pot = ADC("A0")',
        code: 'stand = pot.read_u16()',
        les: 'potmeter',
      },
      {
        id: 'joystick',
        label: 'Joystick',
        imports: [ADC],
        opzet: 'joystick_x = ADC("A2")\njoystick_y = ADC("A1")',
        code: 'links_rechts = joystick_x.read_u16()\nvoor_achter = joystick_y.read_u16()',
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
        label: 'Stop de motoren',
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
        label: 'RGB-led kleur',
        imports: [{ uit: 'leaphymicropython.actuators.rgbled', namen: ['RGBLed'] }],
        opzet: 'rgb_led = RGBLed("D10", "D9", "D6")',
        code: 'rgb_led.set_color(255, 0, 0)',
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
      },
      { id: 'herhaal-als', label: 'Herhaal als', code: 'while ⟦voorwaarde⟧:\n    ' },
      { id: 'als', label: 'Als', code: 'if ⟦voorwaarde⟧:\n    ' },
      { id: 'als-anders', label: 'Als, anders', code: 'if ⟦voorwaarde⟧:\n    \nelse:\n    ' },
      { id: 'wacht', label: 'Wacht', imports: [SLEEP], code: 'sleep(1)' },
      { id: 'print', label: 'Print in de shell', code: 'print("Hallo")' },
      { id: 'variabele', label: 'Variabele', code: 'teller = 0' },
    ],
  },
];

export const BOUWSTENEN: Bouwsteen[] = GROEPEN.flatMap((g) => g.bouwstenen);

export function bouwsteenMetId(id: string): Bouwsteen | undefined {
  return BOUWSTENEN.find((b) => b.id === id);
}
