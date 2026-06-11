---
sidebar_position: 8
hide_table_of_contents: true
---

# 2.7 Ballen grijpen

Nu je een bal kunt vinden, moet je hem ook nog **oppakken**. Hier komt vrijwel altijd een **servo** aan te pas.

## Vragen om mee te beginnen

- Hoe ziet je grijper eruit? Een schepje, een tang of een arm?
- Hoe zorg je dat de **servo** en de **afstandssensor** samenwerken (dichtbij = grijpen)?
- Welke **soort servo** heb je nodig?
  - Een **180-graden servo** (gewoon) voor een tangbeweging.
  - Een **continu draaiende servo** voor een transportband of rol.

## Inspiratie

- Een servo met een lepel die de bal opschept.
- Twee servo's die als kaken naar elkaar toe sluiten.
- Een rotor met rubberen randen die de bal naar binnen rolt.

<details>
<summary>Tip: bouw eerst de beweging</summary>

Test de grijpbeweging **handmatig** (met `set_servo_angle("D6", 0)` en `set_servo_angle("D6", 180)`) voordat je hem aan een afstandssensor koppelt.

</details>
