export type Template = {
  id: string;
  label: string;
  code: string;
};

export const TEMPLATES: Template[] = [
  {
    id: 'leeg',
    label: 'Leeg bestand',
    code: `# Schrijf hier je code.\nprint('Hallo Lego-auto!')\n`,
  },
  {
    id: 'motoren',
    label: 'Motoren testen',
    code: `from leaphymicropython.actuators.dcmotor import DCMotors
from time import sleep

motoren = DCMotors()

motoren.motor_a.forward(255)   # rechts vooruit (snelheid 0-255)
motoren.motor_b.forward(255)   # links vooruit
sleep(2)

motoren.motor_a.stop()
motoren.motor_b.stop()
`,
  },
  {
    id: 'ir',
    label: 'IR-sensor uitlezen',
    code: `from leaphymicropython.sensors.linesensor import AnalogIR
from time import sleep

# Pin als string, drempel waarboven het zwart is (raw waarde 0-65535).
links = AnalogIR("A0", 2500)
rechts = AnalogIR("A1", 2500)

while True:
    print("links:", links.get_analog_value(),
          "rechts:", rechts.get_analog_value())
    # Of: print(links.black_or_white(), rechts.black_or_white())
    sleep(0.2)
`,
  },
  {
    id: 'oled',
    label: 'OLED-scherm tekst',
    code: `from leaphymicropython.actuators.oled_screen import OLEDSH1106
from time import sleep

# Voeg channel=... toe wanneer je via een multiplexer aansluit.
oled = OLEDSH1106()

oled.fill("white")
oled.text("Hallo!", 0, 0)
oled.text("Lego-auto", 0, 16)
oled.show()           # zonder show() zie je niets

sleep(3)
`,
  },
  {
    id: 'tof',
    label: 'Afstand meten (TOF)',
    code: `from leaphymicropython.sensors.tof import TimeOfFlight
from time import sleep

# Voeg channel=... toe wanneer je via een multiplexer aansluit.
tof = TimeOfFlight()

while True:
    mm = tof.get_distance()   # afstand in millimeters
    if mm == 8191:
        print("buiten bereik")
    else:
        print("afstand (mm):", mm)
    sleep(0.3)
`,
  },
];
