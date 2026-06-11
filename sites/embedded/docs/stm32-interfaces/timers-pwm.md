---
sidebar_position: 4
hide_table_of_contents: true
---

# 10.4 Hardware-timers

Een **timer** is een teller in de chip die zelfstandig doortelt, los van je hoofdprogramma. Timers zijn de motor achter PWM, en je kunt ze ook gebruiken om heel precies "elke zoveel tijd iets doen". Met HAL stel je ze zelf in.

## Waarom een hardware-timer?

Je zou in je `while`-lus telkens met `HAL_GetTick()` kunnen kijken of er genoeg tijd voorbij is. Dat werkt, maar het kan haperen als je programma druk is. Een hardware-timer telt **onafhankelijk** door en kan automatisch een stukje code afvuren op een exact moment. Zo blijft de timing kloppen, wat je hoofdprogramma ook doet.

## PWM met een timer

Voor een dimbare LED zet je een timerkanaal in PWM-modus. De timer genereert dan zelf het snelle aan/uit-signaal; jij stelt alleen de helderheid in.

```c
#include "stm32f1xx_hal.h"

TIM_HandleTypeDef htim;

void pwm_setup(void) {
  __HAL_RCC_TIM2_CLK_ENABLE();
  __HAL_RCC_GPIOA_CLK_ENABLE();

  // PA0 = kanaal 1 van TIM2, als alternate function
  GPIO_InitTypeDef gpio = {0};
  gpio.Pin = GPIO_PIN_0;
  gpio.Mode = GPIO_MODE_AF_PP;
  gpio.Speed = GPIO_SPEED_FREQ_HIGH;
  HAL_GPIO_Init(GPIOA, &gpio);

  // timer: tel van 0 tot 999
  htim.Instance = TIM2;
  htim.Init.Prescaler = 71;        // 72 MHz / 72 = 1 MHz
  htim.Init.Period = 999;          // 1 MHz / 1000 = 1 kHz PWM
  HAL_TIM_PWM_Init(&htim);

  TIM_OC_InitTypeDef oc = {0};
  oc.OCMode = TIM_OCMODE_PWM1;
  oc.Pulse = 500;                  // 500 van 1000 = 50% helderheid
  HAL_TIM_PWM_ConfigChannel(&htim, &oc, TIM_CHANNEL_1);
}

int main(void) {
  HAL_Init();
  pwm_setup();
  HAL_TIM_PWM_Start(&htim, TIM_CHANNEL_1);

  while (1) {
    // langzaam op- en afzwellen
    for (int h = 0; h <= 1000; h += 10) {
      __HAL_TIM_SET_COMPARE(&htim, TIM_CHANNEL_1, h);
      HAL_Delay(10);
    }
    for (int h = 1000; h >= 0; h -= 10) {
      __HAL_TIM_SET_COMPARE(&htim, TIM_CHANNEL_1, h);
      HAL_Delay(10);
    }
  }
}
```

## Wat gebeurt hier?

```c
htim.Init.Prescaler = 71;
htim.Init.Period = 999;
```

De timer telt op 72 MHz. De **prescaler** deelt dat eerst: `72 MHz / (71 + 1) = 1 MHz`. De **period** bepaalt tot hoe ver hij telt: tot 999, dus 1000 stappen. Dat geeft een PWM-frequentie van `1 MHz / 1000 = 1 kHz` — sneller dan je oog kan zien.

```c
__HAL_TIM_SET_COMPARE(&htim, TIM_CHANNEL_1, h);
```

`Pulse` (of hier `h`) bepaalt hoeveel van de 1000 stappen de pin aan is. `500` is half zo fel, `1000` is vol. Dit is het HAL-equivalent van de helderheid die je naar `analogWrite()` stuurde. Zodra de timer loopt, doet de chip de rest helemaal zelf.

:::tip
Wil je in plaats van PWM een functie automatisch laten afvuren (bijvoorbeeld elke seconde een LED wisselen), gebruik dan `HAL_TIM_Base_Start_IT()` met een **interrupt**. Houd zo'n interrupt-functie kort: geen `HAL_Delay()` erin.
:::

Hiermee ken je de belangrijkste interfaces van de STM32 — allemaal met HAL. In het volgende, gevorderde hoofdstuk ga je nóg een laag dieper: je bestuurt de chip rechtstreeks via zijn registers.
