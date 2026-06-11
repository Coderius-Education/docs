---
sidebar_position: 2
hide_table_of_contents: true
---

# 9.2 GPIO als ingang

Een pin uitlezen werkt met HAL bijna hetzelfde als een pin aansturen: je vult een `GPIO_InitTypeDef` in, maar nu met een ingangs-modus. En net als bij de Arduino gebruik je een **pull-up** om een zwevende ingang te voorkomen.

## Een knop met pull-up

Sluit een knop aan tussen `PB10` en `GND`.

```c
#include "stm32f1xx_hal.h"

int main(void) {
  HAL_Init();
  __HAL_RCC_GPIOB_CLK_ENABLE();
  __HAL_RCC_GPIOC_CLK_ENABLE();

  // knop op PB10 als ingang met pull-up
  GPIO_InitTypeDef knop = {0};
  knop.Pin = GPIO_PIN_10;
  knop.Mode = GPIO_MODE_INPUT;
  knop.Pull = GPIO_PULLUP;
  HAL_GPIO_Init(GPIOB, &knop);

  // ingebouwde LED op PC13 als uitgang
  GPIO_InitTypeDef led = {0};
  led.Pin = GPIO_PIN_13;
  led.Mode = GPIO_MODE_OUTPUT_PP;
  HAL_GPIO_Init(GPIOC, &led);

  while (1) {
    if (HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_10) == GPIO_PIN_RESET) {
      HAL_GPIO_WritePin(GPIOC, GPIO_PIN_13, GPIO_PIN_RESET);  // LED aan
    } else {
      HAL_GPIO_WritePin(GPIOC, GPIO_PIN_13, GPIO_PIN_SET);    // LED uit
    }
  }
}
```

## Wat gebeurt hier?

```c
knop.Mode = GPIO_MODE_INPUT;
knop.Pull = GPIO_PULLUP;
```

`GPIO_MODE_INPUT` maakt de pin een ingang. `GPIO_PULLUP` zet de interne pull-up aan, zodat de pin in rust `SET` (hoog) is. Een ingedrukte knop verbindt de pin met `GND` en maakt hem `RESET` (laag) — dezelfde logica als `INPUT_PULLUP` op de Arduino.

```c
if (HAL_GPIO_ReadPin(GPIOB, GPIO_PIN_10) == GPIO_PIN_RESET) {
```

`HAL_GPIO_ReadPin()` geeft `GPIO_PIN_SET` of `GPIO_PIN_RESET`. Met pull-up betekent `RESET` "ingedrukt". Vergeet niet dat `PC13` (de ingebouwde LED) omgekeerd is: `RESET` = aan.

## Pull-up of pull-down

De STM32 heeft ook een ingebouwde **pull-down** (`GPIO_PULLDOWN`). Daarmee is de pin in rust laag, en maakt een knop naar `3.3V` hem hoog. Zo kies je zelf welke rusttoestand je prettig vindt.

## Controlevraag

<details>
<summary>Waarom zet de code de klok van zowel <code>GPIOB</code> als <code>GPIOC</code> aan?</summary>

Omdat de knop op poort B zit (`PB10`) en de LED op poort C (`PC13`). Elke poort heeft zijn eigen klok, en een poort waarvan de klok uit staat, werkt niet — ook al heb je de pin verder goed ingesteld.

</details>
