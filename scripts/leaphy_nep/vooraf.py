# Een fragment in de les (een losse `oled.fill(...)`) bouwt voort op een eerder
# blok. Geeft het blok een NameError, dan draait het opnieuw met deze regels
# ervoor: de objecten zoals de lessen ze aanmaken. Gebruikt een fragment een
# naam die hier niet staat, zet hem dan hier, of maak het blok compleet.
# De imports zijn voor het fragment, niet voor dit bestand: niet weghalen.
# ruff: noqa: F401
from time import sleep

from leaphymicropython.actuators.dcmotor import DCMotors
from leaphymicropython.actuators.oled_screen import OLEDSH1106
from leaphymicropython.actuators.rgbled import RGBLed
from leaphymicropython.actuators.servo import set_servo_angle
from leaphymicropython.sensors.linesensor import AnalogIR
from leaphymicropython.sensors.sonar import read_distance
from leaphymicropython.sensors.tof import TimeOfFlight
from machine import ADC, PWM, Pin

oled = OLEDSH1106(
    width=128, height=64, channel=7, sda_gpio_pin="SDA", scl_gpio_pin="SCL"
)
tof = TimeOfFlight(channel=0, sda_gpio_pin="SDA", scl_gpio_pin="SCL")
motoren = DCMotors(
    dir_pin_motor_a="D2",
    pwm_pin_motor_a="D3",
    dir_pin_motor_b="D4",
    pwm_pin_motor_b="D11",
)
motor_a = motoren.motor_a
motor_b = motoren.motor_b
a0 = AnalogIR("A0", 2500)
led = RGBLed("D10", "D9", "D6")
lampje = pin_van_lampje = Pin("LED", Pin.OUT)
afstand = 150
kleur_links = kleur_rechts = kleur_buiten_links = kleur_buiten_rechts = "white"
pin_name = "D5"
angle = 90
red, green, blue = 255, 0, 128
