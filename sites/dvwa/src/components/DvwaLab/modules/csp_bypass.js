export const cspBypass = {
  low: {
    title: 'CSP Bypass — Low',
    description:
      'CSP met een te brede whitelist: pastebin.com en hastebin.com mogen scripts hosten',
    method: 'POST',
    php: `<?php
$message = '';
if (isset($_POST['include'])) {
    $url = trim($_POST['include']);
    $veilig = htmlspecialchars($url);
    $whitelist = stripos($url, 'pastebin.com') !== false || stripos($url, 'hastebin.com') !== false;
    $inline = stripos($url, '<script') !== false && stripos($url, 'src') === false;
    if ($whitelist) {
        $message  = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">';
        $message .= 'Script van de whitelist uitgevoerd: <code>' . $veilig . '</code><br>';
        $message .= '<small>pastebin.com staat op de whitelist, dus de browser laadt en draait dit script.</small>';
        $message .= '</div>';
    } elseif ($inline) {
        $message  = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">';
        $message .= 'Inline script geblokkeerd: <code>' . $veilig . '</code><br>';
        $message .= '<small>De CSP blokkeert inline scripts. Host je code op pastebin.com om erlangs te komen.</small>';
        $message .= '</div>';
    } else {
        $message  = '<div style="color:#f0ad4e;padding:10px;border:1px solid #f0ad4e;border-radius:4px;margin:10px 0">';
        $message .= 'Bron geblokkeerd: <code>' . $veilig . '</code><br>';
        $message .= '<small>Dit domein staat niet op de whitelist.</small>';
        $message .= '</div>';
    }
}
echo $message;
?>
<h3>CSP Bypass — Whitelist</h3>
<div style="padding:10px;background:#16213e;border-radius:4px;margin:10px 0">
  <b>Huidige CSP:</b> <code>Content-Security-Policy: script-src 'self' https://pastebin.com hastebin.com</code>
</div>
<p>Inline scripts zijn geblokkeerd, maar pastebin.com en hastebin.com staan op de whitelist.</p>
<form method="POST">
  <div style="margin:8px 0"><label>Script om op te nemen:</label><br><input type="text" name="include" placeholder="https://pastebin.com/raw/JOUW_ID" style="padding:6px;width:320px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Opnemen</button>
</form>
<p style="font-size:0.85em;color:#888">Een publieke host op de whitelist laat iedereen scripts hosten — ook een aanvaller.</p>`,
  },
  medium: {
    title: 'CSP Bypass — Medium',
    description: 'CSP met een hardcoded nonce die een aanvaller uit de broncode kopieert',
    method: 'POST',
    php: `<?php
$nonce = 'TmV2ZXIgZ29pbmcgdG8gZ2l2ZSB5b3UgdXA=';
$message = '';
if (isset($_POST['include'])) {
    $payload = trim($_POST['include']);
    $veilig = htmlspecialchars($payload);
    $juist = strpos($payload, 'nonce="' . $nonce . '"') !== false;
    if ($juist) {
        $message  = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">';
        $message .= 'Script met de juiste nonce uitgevoerd: <code>' . $veilig . '</code><br>';
        $message .= '<small>De nonce is hardcoded, dus je kon hem zo uit de broncode kopiëren.</small>';
        $message .= '</div>';
    } else {
        $message  = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">';
        $message .= 'Script geblokkeerd: <code>' . $veilig . '</code><br>';
        $message .= '<small>Zonder de juiste nonce weigert de browser dit script.</small>';
        $message .= '</div>';
    }
}
echo $message;
?>
<h3>CSP Bypass — Vaste nonce</h3>
<div style="padding:10px;background:#16213e;border-radius:4px;margin:10px 0">
  <b>Huidige CSP:</b> <code>Content-Security-Policy: script-src 'nonce-<?php echo $nonce; ?>'</code>
</div>
<p>Alleen een script met <code>nonce="<?php echo $nonce; ?>"</code> mag draaien. Die waarde staat hardcoded in de broncode.</p>
<form method="POST">
  <div style="margin:8px 0"><label>Script-tag om te testen:</label><br><input type="text" name="include" placeholder="script met nonce-attribuut" style="padding:6px;width:320px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Testen</button>
</form>
<p style="font-size:0.85em;color:#888">Een vaste nonce verandert nooit, dus iedereen die de broncode leest kent hem.</p>`,
  },
  high: {
    title: 'CSP Bypass — High',
    description:
      "Strikte CSP met script-src 'self', maar een JSONP-endpoint echoot de callback ongefilterd",
    method: 'POST',
    php: `<?php
$message = '';
if (isset($_POST['include'])) {
    $callback = $_POST['include'];
    $script = $callback . '({"answer":"15"});';
    $message  = '<div style="padding:10px;background:#16213e;border-radius:4px;margin:10px 0">';
    $message .= 'JSONP-aanroep: <code>jsonp.php?callback=' . htmlspecialchars($callback) . '</code><br>';
    $message .= 'De server geeft letterlijk terug: <code>' . $script . '</code><br>';
    if (strpos($callback, 'alert') !== false) {
        $message .= '<span style="color:#ff5f56">De ongefilterde callback draait als script van <code>self</code>.</span>';
    } else {
        $message .= '<small>De callback-naam staat ongefilterd in de response.</small>';
    }
    $message .= '</div>';
}
echo $message;
?>
<h3>CSP Bypass — JSONP</h3>
<div style="padding:10px;background:#16213e;border-radius:4px;margin:10px 0">
  <b>Huidige CSP:</b> <code>Content-Security-Policy: script-src 'self'</code>
</div>
<p>Alleen scripts van de eigen server mogen draaien. Maar het JSONP-endpoint plakt de <code>callback</code>-parameter ongefilterd in zijn uitvoer.</p>
<form method="POST">
  <div style="margin:8px 0"><label>callback-parameter:</label><br><input type="text" name="include" placeholder="alert(1);//" style="padding:6px;width:320px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Aanroepen</button>
</form>
<p style="font-size:0.85em;color:#888">De browser laadt dit script van self, dus de CSP laat het door.</p>`,
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
