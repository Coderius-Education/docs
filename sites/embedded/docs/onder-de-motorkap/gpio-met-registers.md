---
sidebar_position: 2
hide_table_of_contents: true
---

# 11.2 GPIO met registers

Je gaat de Blue Pill-LED (`PC13`) laten knipperen zónder één HAL-functie — alleen met registers. Zo zie je precies wat `HAL_GPIO_Init()` en `HAL_GPIO_WritePin()` onder water doen. Je blijft in hetzelfde `stm32cube`-project werken.

## Voorspel eerst

Bekijk de code. Geen HAL-functies, alleen rechtstreeks naar de chip-registers.

```c
#include "stm32f1xx.h"

void wacht(volatile int n) {
  while (n-- > 0);
}

int main(void) {
  // 1. Zet de klok naar poort C aan
  RCC->APB2ENR |= RCC_APB2ENR_IOPCEN;

  // 2. Stel PC13 in als output (10 MHz, push-pull)
  GPIOC->CRH &= ~(0xF << ((13 - 8) * 4));
  GPIOC->CRH |=  (0x1 << ((13 - 8) * 4));

  while (1) {
    GPIOC->ODR ^= (1 << 13);  // wissel PC13
    wacht(200000);
  }
}
```

<details>
<summary>Wat denk je dat dit doet?</summary>

Hetzelfde als de HAL-blink: de ingebouwde LED knippert. Alleen gebeurt het nu door rechtstreeks bits in de chip-registers te zetten, en de pauze maken we zelf met een lege tellus in plaats van `HAL_Delay()`.

</details>

## Stap 1: De klok aanzetten

```c
RCC->APB2ENR |= RCC_APB2ENR_IOPCEN;
```

Dit is dezelfde stap als `__HAL_RCC_GPIOC_CLK_ENABLE()`, maar nu zie je wat die functie écht doet: één bit zetten in het `APB2ENR`-register van `RCC`. In een STM32 staat elk onderdeel standaard **uit** om stroom te sparen; deze bit (`IOPCEN`) zet de klok naar poort C aan.

Vergeet je dit, dan doet je code helemaal niets — de klassieke valkuil, op elke laag.

## Stap 2: De pin als output instellen

```c
GPIOC->CRH &= ~(0xF << ((13 - 8) * 4));
GPIOC->CRH |=  (0x1 << ((13 - 8) * 4));
```

Elke pin heeft 4 configuratiebits. Voor pinnen 8–15 zitten die in `CRH`. De eerste regel **wist** de 4 bits van pin 13, de tweede zet ze op de waarde voor "output". Dit is precies wat `HAL_GPIO_Init()` met jouw `GPIO_InitTypeDef` deed — alleen zoek je nu zelf in de datasheet op welke bits het zijn.

## Stap 3: De pin wisselen

```c
GPIOC->ODR ^= (1 << 13);
```

`ODR` is het *Output Data Register*: elke bit is één pin. Met `^=` (exclusieve-of) **wissel** je bit 13 — was hij 1, dan wordt hij 0, en omgekeerd. Dit is wat `HAL_GPIO_TogglePin()` doet.

## Vergelijk met HAL

| HAL | Register |
|:---|:---|
| `__HAL_RCC_GPIOC_CLK_ENABLE()` | `RCC->APB2ENR \|= RCC_APB2ENR_IOPCEN` |
| `HAL_GPIO_Init()` (output) | `GPIOC->CRH` instellen |
| `HAL_GPIO_WritePin(... SET/RESET)` | bit in `GPIOC->ODR` zetten |
| `HAL_GPIO_TogglePin()` | `GPIOC->ODR ^= (1 << 13)` |

Je ziet: HAL bespaart je het opzoeken in de datasheet en doet extra controles. Maar nu weet je wat er werkelijk gebeurt — elke HAL-functie is uiteindelijk een handvol register-schrijfacties.

:::caution
Registercode is **chip-specifiek**. Deze code werkt op de STM32F103 (Blue Pill), maar niet zomaar op een andere STM32. HAL is juist draagbaar tussen STM32-borden — dat is precies de winst van die laag.
:::
