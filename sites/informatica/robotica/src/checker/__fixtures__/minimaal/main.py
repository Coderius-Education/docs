from machine import Pin
from time import sleep

lampje = Pin('LED', Pin.OUT)

while True:
    lampje.on()
    sleep(0.5)
    lampje.off()
    sleep(0.5)
