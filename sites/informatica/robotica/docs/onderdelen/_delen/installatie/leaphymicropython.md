Voor de sensoren en motoren gebruiken we een kant-en-klare bibliotheek: **leaphymicropython**. Die moet één keer op je microcontroller staan.

:::tip[Sneller met de online editor]

Gebruik je de [online editor](site:robotica/editor)? Verbind met je board en klik op **Installeer Leaphy-library**. De editor zet alle bestanden automatisch in `/lib/leaphymicropython/` op de microcontroller. Hieronder staat de Thonny-werkwijze als fallback.

:::

### Download het pakket en pak het uit

Download het zip-bestand: [leaphy-micropython main.zip](https://github.com/leaphy-robotics/leaphy-micropython/archive/refs/heads/main.zip).

Pak het uit op je computer. Je hebt nu een map met onder andere de submap **`leaphymicropython`**.

### Kopieer naar de microcontroller

1. Klik in Thonny op **View** → **Files**. Links zie je nu twee lijsten: boven
   de bestanden op je laptop, onder die op de microcontroller.
2. Druk op **Stop** in Thonny, zodat er geen programma draait terwijl je
   bestanden kopieert.
3. Maak in de onderste lijst een map aan met de naam **`lib`** (rechtermuisknop,
   **New directory...**), als die er nog niet is, en dubbelklik erop om hem te
   openen.
4. Zoek in de bovenste lijst de map **`leaphymicropython`**, klik er met de
   rechtermuisknop op en kies **Upload to /lib**. In de onderste lijst staat de
   map daarna in `lib`.

**Controlevraag:** Waar moet de map `leaphymicropython` precies komen te staan?

<details>
<summary>Antwoord</summary>

In de map **`lib`** op de **microcontroller** (niet op je laptop). Het pad wordt dus `lib/leaphymicropython/...`.

</details>
