# Embedded Cheatsheet

Snel iets opzoeken? Hieronder staan de functies, pinnen en commando's die je het vaakst nodig hebt. Klik een blok open voor een minimaal voorbeeld.

## Arduino-basis

<details>
<summary>Hoe ziet een leeg programma eruit? (setup / loop)</summary>

```cpp
void setup() {
  // draait één keer bij het opstarten
}

void loop() {
  // draait daarna oneindig opnieuw
}
```

</details>

<details>
<summary>Een pin als uitgang of ingang instellen (pinMode)</summary>

```cpp
void setup() {
  pinMode(13, OUTPUT);       // pin 13 stuurt iets aan
  pinMode(2, INPUT_PULLUP);  // pin 2 leest iets in, met interne pull-up
}
```

</details>

<details>
<summary>Wachten (delay)</summary>

```cpp
delay(1000);  // wacht 1000 milliseconden = 1 seconde
```

</details>

## Digitale IO

<details>
<summary>Een LED aan- of uitzetten (digitalWrite)</summary>

```cpp
digitalWrite(13, HIGH);  // aan (5V)
digitalWrite(13, LOW);   // uit (0V)
```

</details>

<details>
<summary>Een knop uitlezen (digitalRead)</summary>

```cpp
int waarde = digitalRead(2);  // HIGH of LOW
```

Met `INPUT_PULLUP` is een ingedrukte knop `LOW`.

</details>

## Analoge IO & PWM

<details>
<summary>Een analoge waarde inlezen (analogRead)</summary>

```cpp
int waarde = analogRead(A0);  // 0 t/m 1023 op de Uno
```

</details>

<details>
<summary>Een LED dimmen met PWM (analogWrite)</summary>

```cpp
analogWrite(9, 128);  // 0 = uit, 255 = volledig aan. Alleen op ~pinnen.
```

</details>

<details>
<summary>Een bereik omrekenen (map)</summary>

```cpp
int helderheid = map(analogRead(A0), 0, 1023, 0, 255);
```

</details>

## Serieel

<details>
<summary>De seriële monitor starten en printen (Serial)</summary>

```cpp
void setup() {
  Serial.begin(9600);
}

void loop() {
  Serial.println("Hallo");
  delay(500);
}
```

Zet de monitor in je editor op dezelfde snelheid (9600 baud).

</details>

## Timing zonder delay

<details>
<summary>Iets doen op een interval zonder te blokkeren (millis)</summary>

```cpp
unsigned long vorige = 0;
const unsigned long interval = 1000;

void loop() {
  if (millis() - vorige >= interval) {
    vorige = millis();
    // doe hier iets elke seconde
  }
}
```

</details>

## PlatformIO

<details>
<summary>Een minimale platformio.ini voor de Arduino Uno</summary>

```ini
[env:uno]
platform = atmelavr
board = uno
framework = arduino
monitor_speed = 9600
```

</details>

<details>
<summary>Een platformio.ini voor de STM32 Blue Pill (HAL)</summary>

```ini
[env:bluepill]
platform = ststm32
board = bluepill_f103c8
framework = stm32cube
upload_protocol = stlink
```

</details>

<details>
<summary>Een library toevoegen (lib_deps)</summary>

```ini
lib_deps =
  adafruit/Adafruit SSD1306@^2.5.7
```

</details>

<details>
<summary>Veelgebruikte PlatformIO-commando's</summary>

```bash
pio run                 # bouwen
pio run --target upload # uploaden naar het board
pio device monitor      # seriële monitor openen
```

</details>

## STM32 (Blue Pill)

<details>
<summary>Klok naar een poort aanzetten (verplichte eerste stap)</summary>

```c
__HAL_RCC_GPIOC_CLK_ENABLE();  // poort C
__HAL_RCC_GPIOB_CLK_ENABLE();  // poort B
```

In een STM32 staat elk onderdeel uit tot je de klok aanzet. Vergeet je dit, dan werkt de pin niet.

</details>

<details>
<summary>Een pin als uitgang instellen en aansturen (HAL_GPIO)</summary>

```c
GPIO_InitTypeDef gpio = {0};
gpio.Pin = GPIO_PIN_13;
gpio.Mode = GPIO_MODE_OUTPUT_PP;
HAL_GPIO_Init(GPIOC, &gpio);

HAL_GPIO_WritePin(GPIOC, GPIO_PIN_13, GPIO_PIN_RESET);  // PC13: RESET = aan
HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13);
```

De ingebouwde LED (`PC13`) is omgekeerd bedraad: `GPIO_PIN_RESET` zet hem aan.

</details>

<details>
<summary>Een knop inlezen met pull-up (HAL_GPIO)</summary>

```c
GPIO_InitTypeDef knop = {0};
knop.Pin = GPIO_PIN_10;
knop.Mode = GPIO_MODE_INPUT;
knop.Pull = GPIO_PULLUP;
HAL_GPIO_Init(GPIOB, &knop);

if (HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_10) == GPIO_PIN_RESET) {
  // ingedrukt
}
```

</details>

<details>
<summary>Analoog inlezen met de ADC (12-bit)</summary>

```c
HAL_ADC_Start(&hadc);
HAL_ADC_PollForConversion(&hadc, 100);
uint32_t waarde = HAL_ADC_GetValue(&hadc);  // 0 t/m 4095
```

</details>

## Interfaces (HAL)

<details>
<summary>Tekst versturen via UART (HAL_UART)</summary>

```c
char tekst[] = "Hallo\r\n";
HAL_UART_Transmit(&huart, (uint8_t *)tekst, 7, 100);
```

</details>

<details>
<summary>I2C-apparaten zoeken (HAL_I2C)</summary>

```c
for (uint8_t adres = 1; adres < 127; adres++) {
  if (HAL_I2C_IsDeviceReady(&hi2c, adres << 1, 2, 10) == HAL_OK) {
    // gevonden op adres
  }
}
```

Schuif het adres één bit op (`adres << 1`): HAL verwacht het 8-bits adres.

</details>

<details>
<summary>Een byte sturen via SPI (HAL_SPI)</summary>

```c
HAL_GPIO_WritePin(GPIOA, GPIO_PIN_4, GPIO_PIN_RESET);  // CS laag = selecteer
HAL_SPI_Transmit(&hspi, &byte, 1, 100);
HAL_GPIO_WritePin(GPIOA, GPIO_PIN_4, GPIO_PIN_SET);    // CS hoog = klaar
```

</details>

<details>
<summary>PWM-helderheid aanpassen (HAL timer)</summary>

```c
HAL_TIM_PWM_Start(&htim, TIM_CHANNEL_1);
__HAL_TIM_SET_COMPARE(&htim, TIM_CHANNEL_1, 500);  // 0 = uit, period = vol
```

</details>

## Onder de motorkap (registers)

<details>
<summary>Blink met registers op de Blue Pill (PC13)</summary>

```c
#include "stm32f1xx.h"

int main(void) {
  RCC->APB2ENR |= RCC_APB2ENR_IOPCEN;        // klok naar poort C
  GPIOC->CRH &= ~(0xF << ((13 - 8) * 4));    // wis config van PC13
  GPIOC->CRH |=  (0x1 << ((13 - 8) * 4));    // output, 10 MHz

  while (1) {
    GPIOC->ODR ^= (1 << 13);                 // toggle PC13
    for (volatile int i = 0; i < 200000; i++);
  }
}
```

</details>
