import type { ProjectTemplate } from './types';

export const BUILTIN_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'python-basis',
    runnerId: 'python',
    name: 'Python',
    description: 'Een leeg Python-project dat in je browser draait.',
    entry: 'main.py',
    files: {
      'main.py': 'print("Hallo vanuit je eigen project!")\n',
    },
  },
  {
    id: 'web-basis',
    runnerId: 'web',
    name: 'Website',
    description: 'HTML, CSS en JavaScript met een live voorbeeld.',
    entry: 'index.html',
    files: {
      'index.html': `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Mijn website</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1>Mijn eerste website</h1>
  <p>Verander deze tekst en kijk wat er gebeurt.</p>
  <button id="knop">Klik op mij</button>

  <script src="script.js"></script>
</body>
</html>
`,
      'style.css': `body {
  font-family: sans-serif;
  margin: 2rem;
}

h1 {
  color: #2e8555;
}
`,
      'script.js': `const knop = document.getElementById("knop");

knop.addEventListener("click", () => {
  console.log("Er is op de knop geklikt!");
});
`,
    },
  },
  {
    id: 'micropython-blink',
    runnerId: 'micropython',
    name: 'MicroPython',
    description: 'Knipperende LED voor een microcontroller (via USB).',
    entry: 'main.py',
    files: {
      'main.py': `from machine import Pin
import time

led = Pin("LED", Pin.OUT)

while True:
    led.toggle()
    time.sleep(0.5)
`,
    },
  },
];
