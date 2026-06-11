---
sidebar_position: 2
hide_table_of_contents: true
---

# 10.2 I2C

Met **I2C** sluit je veel apparaten aan op slechts **twee draadjes**: `SDA` (data) en `SCL` (klok). Denk aan schermpjes, temperatuursensoren en bewegingssensoren. Elk apparaat heeft een eigen **adres**, zodat de STM32 weet met wie hij praat.

Op de Blue Pill zit `I2C1` op `PB6` (`SCL`) en `PB7` (`SDA`).

## I2C instellen

```c
#include "stm32f1xx_hal.h"

I2C_HandleTypeDef hi2c;

void i2c_setup(void) {
  __HAL_RCC_I2C1_CLK_ENABLE();
  __HAL_RCC_GPIOB_CLK_ENABLE();

  // PB6 (SCL) en PB7 (SDA) als alternate function, open-drain
  GPIO_InitTypeDef gpio = {0};
  gpio.Pin = GPIO_PIN_6 | GPIO_PIN_7;
  gpio.Mode = GPIO_MODE_AF_OD;     // open-drain, vereist voor I2C
  gpio.Pull = GPIO_PULLUP;
  gpio.Speed = GPIO_SPEED_FREQ_HIGH;
  HAL_GPIO_Init(GPIOB, &gpio);

  hi2c.Instance = I2C1;
  hi2c.Init.ClockSpeed = 100000;   // 100 kHz
  hi2c.Init.DutyCycle = I2C_DUTYCYCLE_2;
  hi2c.Init.AddressingMode = I2C_ADDRESSINGMODE_7BIT;
  HAL_I2C_Init(&hi2c);
}
```

## Apparaten zoeken (een scanner)

Een handig eerste programma: controleer welke adressen er op de bus zitten. HAL heeft daar een kant-en-klare functie voor:

```c
int main(void) {
  HAL_Init();
  i2c_setup();

  while (1) {
    for (uint8_t adres = 1; adres < 127; adres++) {
      // bestaat er een apparaat op dit adres?
      if (HAL_I2C_IsDeviceReady(&hi2c, adres << 1, 2, 10) == HAL_OK) {
        // gevonden: adres
      }
    }
    HAL_Delay(2000);
  }
}
```

`HAL_I2C_IsDeviceReady()` "tikt" een adres aan en geeft `HAL_OK` als er iets antwoordt. Zo controleer je of je bedrading klopt vóór je verder bouwt. Een veelvoorkomend adres is `0x3C` voor een klein OLED-schermpje.

:::note
I2C-adressen op de STM32 schuif je één bit op (`adres << 1`), omdat HAL het 8-bits adres verwacht (7 bits adres + 1 richtingsbit). Dat is een klassiek struikelpunt: een sensor met adres `0x3C` geef je aan HAL als `0x3C << 1`.
:::

## Wat gebeurt hier?

```c
gpio.Mode = GPIO_MODE_AF_OD;
```

I2C-pinnen staan in **open-drain** (`OD`): ze kunnen de lijn alleen laag trekken, nooit hard hoog maken. De pull-up trekt de lijn in rust hoog. Dat is precies hoe I2C is bedoeld, zodat meerdere apparaten dezelfde twee draadjes kunnen delen zonder elkaar tegen te werken.

## Echte data lezen

Om een sensor echt uit te lezen gebruik je `HAL_I2C_Master_Transmit()` en `HAL_I2C_Master_Receive()` met de registers uit de datasheet van dat apparaat. De scanner hierboven is de eerste stap: weten dát het apparaat er is.
