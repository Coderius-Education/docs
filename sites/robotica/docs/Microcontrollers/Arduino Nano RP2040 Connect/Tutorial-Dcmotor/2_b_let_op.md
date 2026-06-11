---
sidebar_position: 3
hide_table_of_contents: true
---

# 13.3 Let op: bezet pinnen

:::danger Pinnen D2, D3, D4 en D11 zijn bezet

Zodra je het motor shield gebruikt, zijn deze pinnen **niet meer beschikbaar** voor andere onderdelen:

- **D2** (GPIO25)
- **D3** (GPIO15)
- **D4** (GPIO16)
- **D11** (GPIO7)

Het motor shield gebruikt ze om de motoren aan te sturen. Als je hier een buzzer, LED of sensor op aansluit, gaan de motoren raar doen of werkt het andere onderdeel niet.

:::

Zie je later vreemd gedrag van je robot? Kom dan terug naar deze pagina en check welke pinnen je gebruikt.

<details>
<summary>Controlevraag</summary>

Je wilt een buzzer toevoegen. Op welke van deze pinnen mag dat: **D3**, **D6**, **D11**?

</details>

<details>
<summary>Antwoord</summary>

Alleen op **D6**. **D3** en **D11** zijn bezet door het motor shield.

</details>
