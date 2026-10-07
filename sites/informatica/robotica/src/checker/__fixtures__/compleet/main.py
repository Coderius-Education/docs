from time import sleep
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.actuators.dcmotor import DCMotors
from leaphymicropython.actuators.oled_screen import OLEDSH1106
from leaphymicropython.sensors.tof import TimeOfFlight

links = AnalogIR("A0", 2500)
rechts = AnalogIR("A1", 2500)
oled = OLEDSH1106(width=128, height=64, channel=7)
tof = TimeOfFlight(channel=0)

motoren = DCMotors()
motor_a = motoren.motor_a
motor_b = motoren.motor_b

snelheid = 255


def toon(regel_een, regel_twee):
    oled.fill('white')
    oled.text(regel_een, 0, 0)
    oled.text(regel_twee, 0, 10)
    oled.show()


while True:
    kleur_links = links.black_or_white()
    kleur_rechts = rechts.black_or_white()
    afstand = tof.get_distance()

    toon(f'Links: {kleur_links}', f'Afstand: {afstand}')

    if afstand < 100:
        motor_a.stop()
        motor_b.stop()
    elif kleur_links == "white" and kleur_rechts == "white":
        motor_a.forward(snelheid)
        motor_b.forward(snelheid)
    else:
        motor_a.forward(snelheid - 100)
        motor_b.forward(snelheid)

    sleep(0.01)
