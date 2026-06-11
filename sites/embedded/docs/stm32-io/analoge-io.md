---
sidebar_position: 3
hide_table_of_contents: true
---

# 9.3 Analoge IO met HAL

Analoog meten doe je op de STM32 met de **ADC** (*Analog-to-Digital Converter*). Met HAL kost dat wat meer opzet dan `analogRead()`, maar je krijgt er een fijnere meting voor terug: **12-bit** (0–4095) in plaats van de 10-bit van de Arduino.

## De ADC instellen en uitlezen

Een ADC-meting heeft drie delen: de ADC zelf instellen, de pin koppelen, en dan meten.

```c
#include "stm32f1xx_hal.h"

ADC_HandleTypeDef hadc;

void adc_setup(void) {
  __HAL_RCC_ADC1_CLK_ENABLE();
  __HAL_RCC_GPIOA_CLK_ENABLE();

  // PA0 als analoge ingang
  GPIO_InitTypeDef gpio = {0};
  gpio.Pin = GPIO_PIN_0;
  gpio.Mode = GPIO_MODE_ANALOG;
  HAL_GPIO_Init(GPIOA, &gpio);

  // de ADC zelf
  hadc.Instance = ADC1;
  hadc.Init.ContinuousConvMode = DISABLE;
  hadc.Init.DataAlign = ADC_DATAALIGN_RIGHT;
  HAL_ADC_Init(&hadc);

  // kanaal koppelen aan PA0
  ADC_ChannelConfTypeDef kanaal = {0};
  kanaal.Channel = ADC_CHANNEL_0;
  kanaal.Rank = ADC_REGULAR_RANK_1;
  kanaal.SamplingTime = ADC_SAMPLETIME_55CYCLES_5;
  HAL_ADC_ConfigChannel(&hadc, &kanaal);
}

uint32_t adc_lees(void) {
  HAL_ADC_Start(&hadc);
  HAL_ADC_PollForConversion(&hadc, 100);
  return HAL_ADC_GetValue(&hadc);
}

int main(void) {
  HAL_Init();
  adc_setup();

  while (1) {
    uint32_t waarde = adc_lees();  // 0 t/m 4095
    HAL_Delay(200);
  }
}
```

## Wat gebeurt hier?

De setup ziet er groot uit, maar het zijn vier bekende stappen:

1. **Klokken aanzetten** — voor de ADC én voor de poort van de pin.
2. **De pin op `GPIO_MODE_ANALOG`** zetten, zodat hij de spanning doorlaat naar de ADC.
3. **De ADC instellen** met `HAL_ADC_Init()`.
4. **Het kanaal koppelen**: `PA0` hoort bij `ADC_CHANNEL_0`.

Meten zelf is dan kort:

```c
HAL_ADC_Start(&hadc);
HAL_ADC_PollForConversion(&hadc, 100);
return HAL_ADC_GetValue(&hadc);
```

Je start een meting, wacht tot hij klaar is, en leest het getal (0–4095) uit. Dat is het HAL-equivalent van `analogRead()`.

:::caution
Een analoge pin op de Blue Pill mag maximaal **3,3 V** krijgen, niet 5 V. Sluit de buitenste pinnen van je potmeter aan op `3.3` en `GND`.
:::

## PWM met een timer

`analogWrite()` bestaat niet in HAL. Een PWM-signaal komt op de STM32 rechtstreeks uit een **hardware-timer**. Je stelt de timer in op PWM-modus en past daarna alleen de "vergelijkingswaarde" aan om de helderheid te veranderen:

```c
// als de timer eenmaal in PWM-modus staat (zie hoofdstuk 10.4):
__HAL_TIM_SET_COMPARE(&htim, TIM_CHANNEL_1, 500);  // helderheid
```

Hoe je de timer in PWM-modus zet, lees je in [10.4 Hardware-timers](/docs/stm32-interfaces/timers-pwm). Het mooie: zodra hij loopt, genereert de chip het signaal helemaal zelf — je hoofdprogramma hoeft er niets voor te doen.

## Controlevraag

<details>
<summary>De Arduino gaf 0–1023, de STM32 geeft 0–4095. Wat betekent dat voor je meting?</summary>

De STM32 verdeelt hetzelfde spanningsbereik in vier keer zoveel stapjes (12-bit in plaats van 10-bit). Je meet dus nauwkeuriger: kleinere veranderingen in spanning zie je terug in het getal.

</details>
