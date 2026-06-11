---
sidebar_position: 4
hide_table_of_contents: true
---

# 8.4 Je eerste HAL-programma

Tijd voor blink op de STM32 — maar nu met de **HAL**, niet met `digitalWrite()`. Je merkt dat het meer regels kost, maar elke regel heeft een duidelijke taak. En je ziet voor het eerst wat de Arduino altijd voor je verborg.

## Stap 1: Het project instellen

Maak een nieuw PlatformIO-project en zet in `platformio.ini` het **stm32cube**-framework. Dat is de HAL-laag van ST.

```ini
[env:bluepill]
platform = ststm32
board = bluepill_f103c8
framework = stm32cube
upload_protocol = stlink
```

Het enige wat tegenover de Arduino verandert, is `framework = stm32cube`. Vanaf nu zijn `pinMode()` en `digitalWrite()` er niet meer — je werkt met HAL-functies.

## Stap 2: De code

Zet dit in `src/main.c`:

```c
#include "stm32f1xx_hal.h"

int main(void) {
  HAL_Init();
  __HAL_RCC_GPIOC_CLK_ENABLE();

  GPIO_InitTypeDef gpio = {0};
  gpio.Pin = GPIO_PIN_13;
  gpio.Mode = GPIO_MODE_OUTPUT_PP;
  gpio.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOC, &gpio);

  while (1) {
    HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13);
    HAL_Delay(500);
  }
}
```

Dit laat de ingebouwde LED (`PC13`) elke halve seconde wisselen.

## Wat gebeurt hier?

Vier stappen, en de eerste is nieuw voor je:

```c
__HAL_RCC_GPIOC_CLK_ENABLE();
```

In een STM32 staat elk onderdeel standaard **uit** om stroom te sparen. Voordat je poort C kunt gebruiken, moet je er eerst de **klok** naartoe aanzetten. Dit is dé klassieke valkuil: vergeet je deze regel, dan doet je code helemaal niets.

```c
GPIO_InitTypeDef gpio = {0};
gpio.Pin = GPIO_PIN_13;
gpio.Mode = GPIO_MODE_OUTPUT_PP;
HAL_GPIO_Init(GPIOC, &gpio);
```

In plaats van `pinMode(PC13, OUTPUT)` vul je een **structuur** in: welke pin, welke modus (`OUTPUT_PP` is "push-pull output"), hoe snel. `HAL_GPIO_Init()` zet die instellingen in de chip.

```c
HAL_GPIO_TogglePin(GPIOC, GPIO_PIN_13);
```

Dit wisselt de pin, zoals `digitalToggle()` dat deed. Met `HAL_GPIO_WritePin(GPIOC, GPIO_PIN_13, GPIO_PIN_RESET)` zou je hem hard aanzetten (op de Blue Pill is `RESET`/laag = aan).

## Vergelijk met de Arduino

| Arduino | HAL |
|:---|:---|
| — (automatisch) | `__HAL_RCC_GPIOC_CLK_ENABLE()` |
| `pinMode(PC13, OUTPUT)` | `GPIO_InitTypeDef` invullen + `HAL_GPIO_Init()` |
| `digitalWrite(PC13, …)` | `HAL_GPIO_WritePin(GPIOC, GPIO_PIN_13, …)` |
| `delay(500)` | `HAL_Delay(500)` |

Meer typewerk, maar je ziet nu precies wat er gebeurt. In het volgende hoofdstuk gebruik je HAL om echte IO te configureren: uitgangen, ingangen en de ADC.

:::caution
HAL kun je niet in de Wokwi-browsersimulator draaien (die werkt met het Arduino-framework). De STM32-hoofdstukken test je daarom op een echt bord. Lukt het uploaden niet, kijk dan bij [Upload mislukt](/docs/er-gaat-iets-mis/upload-mislukt).
:::
