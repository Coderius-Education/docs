"""Nagebootste `machine` voor draai-leaphy-blokken.py.

Alleen de regels van MicroPython v1.28.0 (ports/rp2, bord
ARDUINO_NANO_RP2040_CONNECT) die de robotica-lessen raken, met de bron erbij:

- een pinnaam komt uit de pins.csv van het bord (in leaphy-api.json onder
  `pinnen`); een onbekende naam geeft `unknown named pin` (machine_pin.c);
- A4 tot en met A7 (D18 tot en met D21) lopen via de wifi-chip (EXT_GPIO). PWM
  en I2C weigeren zo'n pin met `expecting a regular GPIO Pin`
  (mp_hal_get_pin_obj in machine_pin.c); ADC kan er wel mee
  (MICROPY_HW_ADC_EXT_COUNT 4, machine_adc.c);
- ADC alleen op GPIO26 tot en met 29 of A4 tot en met A7, anders
  `Pin doesn't have ADC capabilities`;
- I2C0 wil SCL op GPIO 1, 5, 9, … en SDA op 0, 4, 8, … (`bad SCL pin` eerst,
  dan `bad SDA pin`, machine_i2c.c).

GEBRUIK houdt bij welke GPIO waarvoor gebruikt wordt.
"""

import itertools
import json
import os

_PINS = json.load(open(os.environ["LEAPHY_API_JSON"]))["pinnen"]
GEBRUIK = []  # (gpio, wat)


class Pin:
    IN, OUT, OPEN_DRAIN, ALT = 0, 1, 2, 3
    PULL_UP, PULL_DOWN = 1, 2
    IRQ_RISING, IRQ_FALLING = 4, 8
    _invoer = itertools.cycle([1, 1, 0])

    def __init__(self, id, mode=-1, pull=-1, value=None):
        if isinstance(id, Pin):
            self.gpio, self.ext, self.naam = id.gpio, id.ext, id.naam
        elif isinstance(id, str):
            waar = _PINS.get(id) or (
                id if id.startswith(("GPIO", "EXT_GPIO")) else None
            )
            if waar is None:
                raise ValueError(f'unknown named pin "{id}"')
            self.ext = waar.startswith("EXT_")
            self.gpio = waar
            self.naam = id
        elif isinstance(id, int):
            if not 0 <= id < 30:
                raise ValueError("invalid pin")
            self.gpio, self.ext, self.naam = f"GPIO{id}", False, str(id)
        else:
            raise TypeError("pin moet een naam of getal zijn")
        self.mode = mode
        self._waarde = value or 0
        GEBRUIK.append((self.gpio, f"Pin({self.naam!r})"))

    def value(self, v=None):
        if v is None:
            return next(Pin._invoer) if self.mode == Pin.IN else self._waarde
        self._waarde = 1 if v else 0

    __call__ = value

    def on(self):
        self._waarde = 1

    def off(self):
        self._waarde = 0

    def high(self):
        self._waarde = 1

    def low(self):
        self._waarde = 0

    def toggle(self):
        self._waarde ^= 1

    def init(self, *a, **k):
        pass

    def irq(self, *a, **k):
        pass


def _gewone_gpio(p):
    pin = p if isinstance(p, Pin) else Pin(p)
    if pin.ext:
        raise ValueError("expecting a regular GPIO Pin")
    return int(pin.gpio[4:])


class PWM:
    def __init__(self, pin, freq=None, duty_u16=None, duty_ns=None, invert=False):
        self.gpio = _gewone_gpio(pin)
        GEBRUIK.append((f"GPIO{self.gpio}", "PWM"))
        self._duty = 0

    def freq(self, f=None):
        if f is not None and not 7 <= f <= 125_000_000:
            raise ValueError("freq too small")

    def duty_u16(self, d=None):
        if d is None:
            return self._duty
        if not 0 <= d <= 65535:
            raise ValueError("duty_u16 must be from 0 to 65535")
        self._duty = d

    def duty_ns(self, d=None):
        pass

    def deinit(self):
        pass


class ADC:
    _waarden = itertools.cycle([1800, 42000, 3100, 61000])

    def __init__(self, bron, *a, **k):
        if isinstance(bron, int) and 0 <= bron < 4:
            pin = Pin(26 + bron)
        else:
            pin = bron if isinstance(bron, Pin) else Pin(bron)
        geldig = pin.gpio in ("GPIO26", "GPIO27", "GPIO28", "GPIO29") or pin.gpio in (
            "EXT_GPIO3",
            "EXT_GPIO4",
            "EXT_GPIO5",
            "EXT_GPIO6",
        )
        if not geldig:
            e = ValueError("Pin doesn't have ADC capabilities")
            e.value = "Pin doesn't have ADC capabilities"
            raise e
        GEBRUIK.append((pin.gpio, "ADC"))

    def read_u16(self):
        return next(ADC._waarden)


class I2C:
    def __init__(self, id=0, *, scl=None, sda=None, freq=400_000, timeout=50000):
        if scl is not None:
            g = _gewone_gpio(scl)
            if g % 4 != (1 if id == 0 else 3):
                raise ValueError("bad SCL pin")
            GEBRUIK.append((f"GPIO{g}", "I2C SCL"))
        if sda is not None:
            g = _gewone_gpio(sda)
            if g % 4 != (0 if id == 0 else 2):
                raise ValueError("bad SDA pin")
            GEBRUIK.append((f"GPIO{g}", "I2C SDA"))
        self.mux = 0

    def scan(self):
        return [0x29, 0x3C, 0x70]

    def writeto(self, addr, buf, stop=True):
        if addr == 0x70 and buf:
            self.mux = buf[0]
        return len(buf)

    def writevto(self, addr, bufs, stop=True):
        return sum(len(b) for b in bufs)

    def readfrom(self, addr, n, stop=True):
        return bytes(n)

    def readfrom_into(self, addr, buf, stop=True):
        for i in range(len(buf)):
            buf[i] = 0

    def writeto_mem(self, addr, reg, buf, *, addrsize=8):
        pass

    def readfrom_mem(self, addr, reg, n, *, addrsize=8):
        return bytes([0xEE] if (addr, reg, n) == (0x29, 0xC0, 1) else [0xFF] * n)

    def readfrom_mem_into(self, addr, reg, buf, *, addrsize=8):
        for i in range(len(buf)):
            buf[i] = 0xFF


SoftI2C = I2C


def time_pulse_us(pin, level, timeout_us=1_000_000):
    return 1500


def freq(*a):
    return 125_000_000


def reset():
    raise SystemExit


def unique_id():
    return b"\x00" * 8
