export const xssReflected = {
  low: {
    title: 'XSS Reflected — Low',
    description: 'Geen sanitisatie: gebruikersinvoer direct in de pagina weergegeven',
    method: 'GET',
    php: `<?php
$message = '';
if (isset($_GET['name'])) {
    $name = $_GET['name'];
    $message = '<div style="margin:10px 0;padding:10px;background:#16213e;border-radius:4px">Hallo, ' . $name . '!</div>';
}
echo $message;
?>
<h3>Naam invoeren</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Wat is je naam?</label><br><input type="text" name="name" placeholder="Jan" style="padding:6px;width:200px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Submit</button>
</form>`,
  },
  medium: {
    title: 'XSS Reflected — Medium',
    description: 'Script-tags worden gefilterd maar andere XSS-vectoren zijn nog mogelijk',
    method: 'GET',
    php: `<?php
$message = '';
if (isset($_GET['name'])) {
    $name = str_replace('<script>', '', $_GET['name']);
    $message = '<div style="margin:10px 0;padding:10px;background:#16213e;border-radius:4px">Hallo, ' . $name . '!</div>';
}
echo $message;
?>
<h3>Naam invoeren</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Wat is je naam?</label><br><input type="text" name="name" placeholder="Jan" style="padding:6px;width:200px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Submit</button>
</form>`,
  },
  high: {
    title: 'XSS Reflected — High',
    description: 'Script-tags gewhitelisted geblokkeerd via preg_replace, maar htmlspecialchars ontbreekt',
    method: 'GET',
    php: `<?php
$message = '';
if (isset($_GET['name'])) {
    $name = preg_replace('/<(.*)s(.*)c(.*)r(.*)i(.*)p(.*)t/i', '', $_GET['name']);
    $message = '<div style="margin:10px 0;padding:10px;background:#16213e;border-radius:4px">Hallo, ' . $name . '!</div>';
}
echo $message;
?>
<h3>Naam invoeren</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Wat is je naam?</label><br><input type="text" name="name" placeholder="Jan" style="padding:6px;width:200px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Submit</button>
</form>`,
  },
  impossible: {
    title: 'XSS Reflected — Impossible',
    description: 'Veilige implementatie: htmlspecialchars() encodeert alle speciale tekens',
    method: 'GET',
    php: `<?php
$message = '';
if (isset($_GET['name'])) {
    $name = htmlspecialchars($_GET['name'], ENT_QUOTES, 'UTF-8');
    $message = '<div style="margin:10px 0;padding:10px;background:#16213e;border-radius:4px">Hallo, ' . $name . '!</div>';
}
echo $message;
?>
<h3>Naam invoeren</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Wat is je naam?</label><br><input type="text" name="name" placeholder="Jan" style="padding:6px;width:200px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Submit</button>
</form>
<p style="font-size:0.85em;color:#5f9eea">&#128737; Beveiligd: htmlspecialchars() converteert &lt;, &gt;, " en ' naar HTML-entiteiten.</p>`,
  },
};
