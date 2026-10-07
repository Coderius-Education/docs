# Project-specifieke conventies (embedded)

Algemene schrijfstijl, didactiek en schrijfskills staan in `../CLAUDE.md` (en de daarin geïmporteerde documenten in `../org-handbook/`). Stijl-referentie blijft `play-docs`.

## Inleiding

Dit project leert leerlingen embedded programmeren: van een knipperende LED in de **Arduino IDE** (Arduino Uno), via **PlatformIO**, tot het configureren van **IO en interfaces op een STM32 "Blue Pill" (STM32F103)**. De STM32-leerlijn gebruikt **géén** Arduino-framework: het STM32-deel wordt geprogrammeerd met ST's **HAL** (`framework = stm32cube`, code in C), en het laatste gevorderde hoofdstuk gaat nog een laag dieper met **registers**.

## Aandachtspunten

- **Codevoorbeelden Arduino-deel in Arduino C++**: compleet en compileerbaar, altijd met `void setup()` en `void loop()`. **STM32-deel (HAL én registers) in C** met `int main(void)`.
- **Geen overbodige inline-comments.** Liever één korte zin in lopend Nederlands ónder het codeblok dan uitleg met `//` in de code.
- **Pinnen exact benoemen**: Uno-pinnen (`13`, `A0`, `~9`). STM32 in HAL/registers: poort + pin (`GPIOC`/`GPIO_PIN_13`, register `PC13`). Toon eerst een minimale werkende schets vóór uitbreidingen.
- **Simulator**: gebruik `<WokwiSimulator>` direct ná een runnable codeblok in de **Arduino**-hoofdstukken (zoals `<TryButton>` in play-docs). De STM32-hoofdstukken zijn C/HAL/registers en draaien niet in Wokwi — daar dus géén simulator, maar copy-paste-code + beschrijving van het verwachte gedrag.
- **Cheatsheet** staat in `src/pages/cheatsheet.md` met `<details><summary>vraag (functie_naam)</summary>`-blokken, gegroepeerd onder H2-thema's.
- **Foutmeldingen** volgens §8 van de schrijfgids (oorzaak + oplossing + FOUT/GOED), in `docs/er-gaat-iets-mis/`.
- **Interne links altijd controleren** dat ze bestaan vóór commit (`npm run build` met `onBrokenLinks: throw`).
