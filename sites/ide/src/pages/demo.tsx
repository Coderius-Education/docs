import InlineEditor from '@coderius/editor/InlineEditor';
import Layout from '@theme/Layout';
import type { ReactNode } from 'react';

const PYTHON_DEMO = `for i in range(5):
    print("Tel:", i)
`;

const PYTHON_MULTI = {
  'main.py': `import helpers

print(helpers.begroet("Coderius"))
`,
  'helpers.py': `def begroet(naam):
    return "Hallo, " + naam + "!"
`,
};

const PYTHON_ERROR = `print("Dit gaat goed")
print(onbekende_variabele)
`;

const WEB_DEMO = {
  'index.html': `<!DOCTYPE html>
<html lang="nl">
<head>
  <meta charset="UTF-8">
  <title>Demo</title>
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <h1 id="titel">Hallo web</h1>
  <script src="script.js"></script>
</body>
</html>
`,
  'style.css': `h1 { color: rebeccapurple; }
`,
  'script.js': `console.log("Script geladen");
document.getElementById("titel").textContent = "Hallo vanuit JavaScript";
`,
};

export default function Demo(): ReactNode {
  return (
    <Layout title="Demo" description="Demopagina voor de inline editor">
      <main className="container margin-vert--lg">
        <h1>InlineEditor-demo</h1>

        <h2>Python, één bestand</h2>
        <InlineEditor runner="python" code={PYTHON_DEMO} persistKey="demo-python" />

        <h2>Python, meerdere bestanden</h2>
        <InlineEditor runner="python" files={PYTHON_MULTI} entry="main.py" height={200} />

        <h2>Python, foutmelding</h2>
        <InlineEditor runner="python" code={PYTHON_ERROR} height={140} />

        <h2>Website met live voorbeeld</h2>
        <InlineEditor runner="web" files={WEB_DEMO} entry="index.html" height={220} />
      </main>
    </Layout>
  );
}
