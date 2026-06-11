export const cspBypass = {
  low: {
    title: 'CSP Bypass — Low',
    description: 'Geen CSP: inline scripts en externe bronnen zijn volledig toegestaan',
    method: 'POST',
    php: `<?php
$message = '';
if (isset($_POST['include'])) {
    $url = $_POST['include'];
    $message = '<div style="color:#f0ad4e;padding:10px;border:1px solid #f0ad4e;border-radius:4px;margin:10px 0">';
    $message .= 'Script opgenomen van: <code>' . htmlspecialchars($url) . '</code><br>';
    $message .= '<small>Zonder CSP kan elk extern script worden geladen.</small>';
    $message .= '</div>';
}
echo $message;
?>
<h3>CSP Bypass — Geen beleid</h3>
<p>Er is geen Content-Security-Policy header ingesteld.</p>
<div style="padding:10px;background:#16213e;border-radius:4px;margin:10px 0">
  <b>Huidige CSP:</b> <code style="color:#ff5f56">Geen</code>
</div>
<form method="POST">
  <div style="margin:8px 0"><label>Script-URL om op te nemen:</label><br><input type="text" name="include" placeholder="https://kwaadaardig.nl/xss.js" style="padding:6px;width:300px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Opnemen</button>
</form>
<p style="font-size:0.85em;color:#888">Zonder CSP kan een aanvaller via XSS elk script laden van elke bron.</p>`,
  },
  medium: {
    title: 'CSP Bypass — Medium',
    description: "CSP staat 'unsafe-inline' toe — inline scripts zijn nog mogelijk",
    method: 'POST',
    php: `<?php
$message = '';
if (isset($_POST['include'])) {
    $url = $_POST['include'];
    $message = '<div style="padding:10px;background:#16213e;border-radius:4px;margin:10px 0">';
    $message .= 'CSP header: <code>script-src \'self\' \'unsafe-inline\'</code><br>';
    $message .= 'Externe URL geblokkeerd, maar inline scripts werken nog: <code>&lt;script&gt;alert(1)&lt;/script&gt;</code>';
    $message .= '</div>';
}
echo $message;
?>
<h3>CSP Bypass — unsafe-inline</h3>
<div style="padding:10px;background:#16213e;border-radius:4px;margin:10px 0">
  <b>Huidige CSP:</b> <code>Content-Security-Policy: script-src 'self' 'unsafe-inline'</code>
</div>
<p>Externe scripts zijn geblokkeerd, maar <code>unsafe-inline</code> staat inline scripts toe.</p>
<form method="POST">
  <div style="margin:8px 0"><label>Script-URL:</label><br><input type="text" name="include" placeholder="https://extern.nl/script.js" style="padding:6px;width:300px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Testen</button>
</form>`,
  },
  high: {
    title: 'CSP Bypass — High',
    description: 'Strikte CSP met nonce — alleen scripts met het juiste nonce-attribuut worden uitgevoerd',
    method: 'POST',
    php: `<?php
$nonce = base64_encode(random_bytes(16));
$message = '';
if (isset($_POST['include'])) {
    $message = '<div style="padding:10px;background:#16213e;border-radius:4px;margin:10px 0">';
    $message .= 'CSP: <code>script-src \'nonce-' . $nonce . '\'</code><br>';
    $message .= 'Alleen scripts met <code>nonce="' . $nonce . '"</code> worden uitgevoerd.';
    $message .= '</div>';
}
echo $message;
?>
<h3>CSP Bypass — Nonce</h3>
<div style="padding:10px;background:#16213e;border-radius:4px;margin:10px 0">
  <b>Huidige CSP:</b> <code>Content-Security-Policy: script-src 'nonce-<?php echo $nonce; ?>'</code>
</div>
<p>Elk script heeft het juiste nonce-attribuut nodig om uitgevoerd te worden.</p>
<form method="POST">
  <div style="margin:8px 0"><label>Script-URL:</label><br><input type="text" name="include" style="padding:6px;width:300px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Testen</button>
</form>
<p style="font-size:0.85em;color:#888">Nonce wordt elke paginalading opnieuw gegenereerd — een aanvaller kan dit niet voorspellen.</p>`,
  },
  impossible: {
    title: 'CSP Bypass — Impossible',
    description: 'Strikte CSP met hash-verificatie + geen inline scripts + alleen eigen domein',
    method: 'POST',
    php: `<?php
$message = '';
if (isset($_POST['include'])) {
    $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">';
    $message .= 'Alle externe verzoeken zijn geblokkeerd door de CSP.';
    $message .= '</div>';
}
echo $message;
?>
<h3>CSP Bypass — Impossible</h3>
<div style="padding:10px;background:#16213e;border-radius:4px;margin:10px 0">
  <b>Huidige CSP:</b><br>
  <code>Content-Security-Policy: default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self'; connect-src 'none'</code>
</div>
<p>Maximaal restrictief beleid: alleen eigen bronnen, geen inline, geen eval.</p>
<form method="POST">
  <div style="margin:8px 0"><label>Script-URL (geblokkeerd):</label><br><input type="text" name="include" style="padding:6px;width:300px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Testen</button>
</form>
<p style="font-size:0.85em;color:#5f9eea">&#128737; Beveiligd: strikte CSP blokkeert alle externe en inline scripts.</p>`,
  },
};
