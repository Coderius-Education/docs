---
sidebar_position: 3
hide_table_of_contents: true
---

# 11.3 Een knop met registers

Een uitgang met registers ken je nu. De laatste stap: een **ingang** uitlezen met registers. Je leest een knop op `PB10` en bestuurt daarmee de LED op `PC13` — net als de HAL-versie uit hoofdstuk 9, maar nu tot op de bit.

## De code

```c
#include "stm32f1xx.h"

int main(void) {
  // klok naar poort B (knop) en poort C (LED)
  RCC->APB2ENR |= RCC_APB2ENR_IOPBEN | RCC_APB2ENR_IOPCEN;

  // PB10 als ingang met pull-up
  GPIOB->CRH &= ~(0xF << ((10 - 8) * 4));
  GPIOB->CRH |=  (0x8 << ((10 - 8) * 4));  // input met pull-up/pull-down
  GPIOB->ODR |=  (1 << 10);                // pull-up kiezen

  // PC13 als output
  GPIOC->CRH &= ~(0xF << ((13 - 8) * 4));
  GPIOC->CRH |=  (0x1 << ((13 - 8) * 4));

  while (1) {
    if ((GPIOB->IDR & (1 << 10)) == 0) {   // knop ingedrukt = laag
      GPIOC->ODR &= ~(1 << 13);            // LED aan (PC13 omgekeerd)
    } else {
      GPIOC->ODR |=  (1 << 13);            // LED uit
    }
  }
}
```

## Wat gebeurt hier?

```c
GPIOB->CRH |= (0x8 << ((10 - 8) * 4));
GPIOB->ODR |= (1 << 10);
```

Voor een ingang mét pull-up zijn twee dingen nodig: de configuratiebits op "input met pull" zetten (`0x8`), en daarna in `ODR` kiezen of het een pull-**up** (`1`) of pull-**down** (`0`) wordt. Dit is wat `GPIO_PULLUP` in je HAL-`GPIO_InitTypeDef` deed.

```c
if ((GPIOB->IDR & (1 << 10)) == 0) {
```

`IDR` is het *Input Data Register*: het spiegelbeeld van `ODR`, maar dan voor inlezen. Met `& (1 << 10)` pak je bit 10 eruit. Is die `0`, dan is de knop ingedrukt (de pull-up houdt hem in rust hoog). Dit is wat `HAL_GPIO_ReadPin()` doet.

## Vergelijk met HAL

| HAL | Register |
|:---|:---|
| `GPIO_MODE_INPUT` + `GPIO_PULLUP` | `CRH` op input + `ODR`-bit op 1 |
| `HAL_GPIO_ReadPin()` | bit uit `GPIOB->IDR` lezen |
| `== GPIO_PIN_RESET` | `& (1 << 10)) == 0` |

## Wanneer kies je welke laag?

| | Makkelijk | Controle | Draagbaar |
|:---|:---:|:---:|:---:|
| Arduino | ✓✓✓ | ✓ | ✓✓✓ |
| HAL | ✓✓ | ✓✓ | ✓✓ |
| Registers | ✓ | ✓✓✓ | — |

Voor de meeste STM32-projecten is **HAL** de beste keuze: leesbaar, draagbaar tussen STM32-borden, en met genoeg controle. Pak registers erbij als je het laatste beetje snelheid of geheugen nodig hebt, of — net als nu — om echt te begrijpen wat er gebeurt.

:::note
Dit was het laatste lesonderdeel. Goed gedaan dat je tot op de registers bent gekomen. Tijd om zelf iets te bouwen: ga naar [Jouw project](/docs/category/jouw-project).
:::
