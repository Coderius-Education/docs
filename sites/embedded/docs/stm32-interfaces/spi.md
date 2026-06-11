---
sidebar_position: 3
hide_table_of_contents: true
---

# 10.3 SPI

**SPI** is een derde manier om met andere chips te praten, naast UART en I2C. Het is **snel** en wordt gebruikt voor onder andere SD-kaarten, grotere schermen en sommige sensoren. De prijs voor die snelheid: het kost meer pinnen.

## De vier draadjes

SPI gebruikt vier signalen:

- **`SCK`** — de klok (de timing).
- **`MOSI`** — data van de STM32 naar het apparaat (*Master Out, Slave In*).
- **`MISO`** — data van het apparaat naar de STM32 (*Master In, Slave Out*).
- **`CS`** — *Chip Select*: kiest met welk apparaat je praat.

Op de Blue Pill zit `SPI1` op `PA5` (`SCK`), `PA6` (`MISO`) en `PA7` (`MOSI`). De `CS`-pin kies je zelf, bijvoorbeeld `PA4`.

## SPI instellen en een byte sturen

```c
#include "stm32f1xx_hal.h"

SPI_HandleTypeDef hspi;

void spi_setup(void) {
  __HAL_RCC_SPI1_CLK_ENABLE();
  __HAL_RCC_GPIOA_CLK_ENABLE();

  // SCK, MISO, MOSI als alternate function
  GPIO_InitTypeDef af = {0};
  af.Pin = GPIO_PIN_5 | GPIO_PIN_6 | GPIO_PIN_7;
  af.Mode = GPIO_MODE_AF_PP;
  af.Speed = GPIO_SPEED_FREQ_HIGH;
  HAL_GPIO_Init(GPIOA, &af);

  // CS als gewone uitgang
  GPIO_InitTypeDef cs = {0};
  cs.Pin = GPIO_PIN_4;
  cs.Mode = GPIO_MODE_OUTPUT_PP;
  HAL_GPIO_Init(GPIOA, &cs);
  HAL_GPIO_WritePin(GPIOA, GPIO_PIN_4, GPIO_PIN_SET);  // niet geselecteerd

  hspi.Instance = SPI1;
  hspi.Init.Mode = SPI_MODE_MASTER;
  hspi.Init.Direction = SPI_DIRECTION_2LINES;
  hspi.Init.DataSize = SPI_DATASIZE_8BIT;
  hspi.Init.BaudRatePrescaler = SPI_BAUDRATEPRESCALER_16;
  HAL_SPI_Init(&hspi);
}

int main(void) {
  HAL_Init();
  spi_setup();

  uint8_t commando = 0x9F;

  while (1) {
    HAL_GPIO_WritePin(GPIOA, GPIO_PIN_4, GPIO_PIN_RESET);   // selecteer
    HAL_SPI_Transmit(&hspi, &commando, 1, 100);
    HAL_GPIO_WritePin(GPIOA, GPIO_PIN_4, GPIO_PIN_SET);     // klaar
    HAL_Delay(1000);
  }
}
```

## Wat gebeurt hier?

```c
HAL_GPIO_WritePin(GPIOA, GPIO_PIN_4, GPIO_PIN_RESET);
HAL_SPI_Transmit(&hspi, &commando, 1, 100);
HAL_GPIO_WritePin(GPIOA, GPIO_PIN_4, GPIO_PIN_SET);
```

Je trekt eerst `CS` laag om het apparaat te "selecteren". Daarna stuurt `HAL_SPI_Transmit()` één of meer bytes. Tot slot trek je `CS` weer hoog. Welke bytes je stuurt, staat in de datasheet van het apparaat. Wil je tegelijk ontvangen, gebruik dan `HAL_SPI_TransmitReceive()`.

## Welke interface kies je?

| Interface | Draadjes | Snelheid | Typisch gebruik |
|:---|:---:|:---:|:---|
| UART | 2 | laag–midden | computer, GPS, modules |
| I2C | 2 | midden | sensoren, klein scherm |
| SPI | 4+ | hoog | SD-kaart, groot scherm |

Geen interface is "de beste"; je kiest op basis van wat je apparaat ondersteunt en hoe snel het moet.
