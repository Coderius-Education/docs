---
sidebar_position: 1
hide_table_of_contents: true
---

# 10.1 UART (serieel)

**UART** is de techniek waarmee twee chips tekst uitwisselen over twee draadjes: `TX` om te zenden, `RX` om te ontvangen. Het is dezelfde communicatie die op de Arduino achter de seriële monitor zat. Met HAL stel je hem zelf in. Het grote voordeel van de STM32: hij heeft er **meerdere**.

## UART instellen en zenden

`USART1` zit op de Blue Pill op `PA9` (`TX`) en `PA10` (`RX`).

```c
#include "stm32f1xx_hal.h"
#include <string.h>

UART_HandleTypeDef huart;

void uart_setup(void) {
  __HAL_RCC_USART1_CLK_ENABLE();
  __HAL_RCC_GPIOA_CLK_ENABLE();

  // PA9 = TX, PA10 = RX
  GPIO_InitTypeDef tx = {0};
  tx.Pin = GPIO_PIN_9;
  tx.Mode = GPIO_MODE_AF_PP;       // alternate function: de UART stuurt de pin
  tx.Speed = GPIO_SPEED_FREQ_HIGH;
  HAL_GPIO_Init(GPIOA, &tx);

  GPIO_InitTypeDef rx = {0};
  rx.Pin = GPIO_PIN_10;
  rx.Mode = GPIO_MODE_INPUT;
  HAL_GPIO_Init(GPIOA, &rx);

  huart.Instance = USART1;
  huart.Init.BaudRate = 115200;
  huart.Init.WordLength = UART_WORDLENGTH_8B;
  huart.Init.StopBits = UART_STOPBITS_1;
  huart.Init.Parity = UART_PARITY_NONE;
  huart.Init.Mode = UART_MODE_TX_RX;
  HAL_UART_Init(&huart);
}

int main(void) {
  HAL_Init();
  uart_setup();

  char tekst[] = "Hallo vanaf de STM32\r\n";

  while (1) {
    HAL_UART_Transmit(&huart, (uint8_t *)tekst, strlen(tekst), 100);
    HAL_Delay(1000);
  }
}
```

## Wat gebeurt hier?

```c
tx.Mode = GPIO_MODE_AF_PP;
```

Dit is nieuw: `AF` staat voor *alternate function*. Je geeft de pin niet aan jezelf, maar aan de UART-hardware. Die "neemt de pin over" om er bits uit te sturen.

```c
huart.Init.BaudRate = 115200;
HAL_UART_Init(&huart);
```

Je stelt de snelheid (baud) en het formaat in, en `HAL_UART_Init()` zet alles klaar. Daarna stuurt `HAL_UART_Transmit()` een rijtje bytes — hier de tekst. Sluit een USB-naar-serieel-adapter op `PA9`/`PA10` aan en open een seriële monitor op **115200** om de tekst te zien.

## Meerdere UART's

De Blue Pill heeft er drie: `USART1`, `USART2` en `USART3`. Je stelt ze elk los in (elk met zijn eigen pinnen en klok). Zo kun je tegelijk met je computer praten via de ene, en met bijvoorbeeld een GPS-module via de andere — iets wat op de Arduino Uno niet kan, want die heeft er maar één.

## Controlevraag

<details>
<summary>Waarom zet je de TX-pin op <code>GPIO_MODE_AF_PP</code> en niet op <code>GPIO_MODE_OUTPUT_PP</code>?</summary>

Omdat niet jouw code de pin aanstuurt, maar de UART-hardware. Met de "alternate function"-modus geef je de besturing van de pin door aan de UART, zodat die er zelf het seriële signaal op kan zetten.

</details>
