---
sidebar_position: 1
hide_table_of_contents: true
---

# 9.1 GPIO als uitgang

**GPIO** staat voor *General Purpose Input/Output*: de gewone in- en uitgangspinnen. Je kent de HAL-blink al; nu sluit je je eigen LED aan en stuur je hem gericht aan.

## Een externe LED met HAL

Sluit een LED met weerstand aan tussen `PB0` en `GND`. Onthoud: de STM32 werkt op **3,3 V**, dus een weerstand van 220 Ω is prima.

```c
#include "stm32f1xx_hal.h"

int main(void) {
  HAL_Init();
  __HAL_RCC_GPIOB_CLK_ENABLE();

  GPIO_InitTypeDef gpio = {0};
  gpio.Pin = GPIO_PIN_0;
  gpio.Mode = GPIO_MODE_OUTPUT_PP;
  gpio.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOB, &gpio);

  while (1) {
    HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0, GPIO_PIN_SET);    // aan
    HAL_Delay(500);
    HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0, GPIO_PIN_RESET);  // uit
    HAL_Delay(500);
  }
}
```

## Wat gebeurt hier?

De stappen zijn hetzelfde als bij de ingebouwde LED, maar nu op poort B:

```c
__HAL_RCC_GPIOB_CLK_ENABLE();
```

Een andere poort betekent een andere klok. Pin `PB0` zit op poort B, dus zet je de klok naar `GPIOB` aan — niet `GPIOC`.

```c
HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0, GPIO_PIN_SET);
```

`GPIO_PIN_SET` maakt de pin hoog (3,3 V), `GPIO_PIN_RESET` maakt hem laag. Op een externe LED is `SET` gewoon "aan", zoals je verwacht. Alleen de ingebouwde LED op `PC13` is omgekeerd bedraad.

## Pin-namen kiezen

Bijna elke pin kan uitgang zijn. Veelgebruikte vrije pinnen op de Blue Pill zijn `PB0`, `PB1`, `PB5`, `PB6` en de meeste `PA`-pinnen. Een paar pinnen hebben een speciale taak (bijvoorbeeld de SWD-debugpinnen `PA13` en `PA14`); die laat je met rust.

Let op het patroon: bij `PB0` hoort poort `GPIOB` en pin `GPIO_PIN_0`, bij `PA5` hoort `GPIOA` en `GPIO_PIN_5`. De letter bepaalt de poort (en dus de klok), het cijfer bepaalt de pin.

## Opdracht 9.1.a: Stoplicht

Maak een stoplicht met drie LED's op `PB0` (rood), `PB1` (geel) en `PB5` (groen). Doorloop de volgorde: rood → rood+geel → groen → geel → rood.

<details>
<summary>Klik hier voor een tip!</summary>

Alle drie de pinnen zitten op poort B, dus je hoeft de klok maar één keer aan te zetten (`__HAL_RCC_GPIOB_CLK_ENABLE()`). Je kunt drie keer `HAL_GPIO_Init()` doen, of de drie pinnen combineren met `GPIO_PIN_0 | GPIO_PIN_1 | GPIO_PIN_5`.

</details>

<details>
<summary>Klik hier voor de oplossing!</summary>

```c
#include "stm32f1xx_hal.h"

int main(void) {
  HAL_Init();
  __HAL_RCC_GPIOB_CLK_ENABLE();

  GPIO_InitTypeDef gpio = {0};
  gpio.Pin = GPIO_PIN_0 | GPIO_PIN_1 | GPIO_PIN_5;
  gpio.Mode = GPIO_MODE_OUTPUT_PP;
  gpio.Speed = GPIO_SPEED_FREQ_LOW;
  HAL_GPIO_Init(GPIOB, &gpio);

  while (1) {
    // rood
    HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0, GPIO_PIN_SET);
    HAL_GPIO_WritePin(GPIOB, GPIO_PIN_1, GPIO_PIN_RESET);
    HAL_GPIO_WritePin(GPIOB, GPIO_PIN_5, GPIO_PIN_RESET);
    HAL_Delay(3000);
    // rood + geel
    HAL_GPIO_WritePin(GPIOB, GPIO_PIN_1, GPIO_PIN_SET);
    HAL_Delay(1000);
    // groen
    HAL_GPIO_WritePin(GPIOB, GPIO_PIN_0, GPIO_PIN_RESET);
    HAL_GPIO_WritePin(GPIOB, GPIO_PIN_1, GPIO_PIN_RESET);
    HAL_GPIO_WritePin(GPIOB, GPIO_PIN_5, GPIO_PIN_SET);
    HAL_Delay(3000);
    // geel
    HAL_GPIO_WritePin(GPIOB, GPIO_PIN_5, GPIO_PIN_RESET);
    HAL_GPIO_WritePin(GPIOB, GPIO_PIN_1, GPIO_PIN_SET);
    HAL_Delay(1000);
  }
}
```

Door de pinnen te combineren met `|` stel je ze in één keer in.

</details>
