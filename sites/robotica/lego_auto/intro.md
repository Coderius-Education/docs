---
sidebar_position: 1
hide_table_of_contents: true
---
import PdfFile from '@site/static/bricklink_studio/bom_lego.pdf';
import ObjViewer from '@site/src/components/ObjViewer';

# Het frame

Welkom bij de **Lego-auto**. Je bouwt eerst een klein rijdend frame van Lego, en in de volgende hoofdstukken zet je daar sensoren en motoren op. We beginnen met het frame hieronder.

<div style={{textAlign: 'center'}}>
  <img src={require('@site/static/bricklink_studio/v3.png').default} alt="Lego-frame voor de robotauto" style={{maxWidth: '400px', width: '100%'}} />
</div>

## Lego-onderdelen

Verzamel de volgende stukken Lego. De volledige stuklijst staat in de PDF hieronder.

<iframe src={PdfFile} width="100%" height="600px">
    Als de iframe niet wordt weergegeven, kun je de PDF hier downloaden: <a href={PdfFile}>Download PDF</a>
</iframe>

## 3D-model

Bekijk het model in 3D — draaien en zoomen met je muis.

### Linkerkant
<ObjViewer src="/models/linkerkant.obj" mtl="/models/linkerkant.mtl" />

### Rechterkant
<ObjViewer src="/models/rechterkant.obj" mtl="/models/rechterkant.mtl" />

### Onderkant
<ObjViewer src="/models/onderkant.obj" mtl="/models/onderkant.mtl" />

### Compleet model
<ObjViewer src="/models/main.obj" mtl="/models/main.mtl" />

<details>
<summary>Controlevraag</summary>

Waarom bouwen we eerst het frame en pas later de elektronica?

</details>

<details>
<summary>Antwoord</summary>

Een stabiel **frame** is de basis. Met losse motoren en sensoren is testen onmogelijk: je hebt iets nodig om ze aan te bevestigen en om over de baan te rijden.

</details>
