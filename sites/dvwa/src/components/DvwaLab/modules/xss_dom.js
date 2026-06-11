export const xssDom = {
  low: {
    title: 'XSS DOM — Low',
    description: 'DOM-gebaseerde XSS: invoer wordt via JavaScript in de DOM ingevoegd zonder sanitisatie',
    method: 'GET',
    php: `<?php
$default = isset($_GET['default']) ? $_GET['default'] : 'Nederlands';
echo '<h3>Taal selecteren</h3>';
echo '<form method="GET">';
echo '  <div style="margin:8px 0"><label>Taal:</label><br>';
echo '  <select name="default" style="padding:6px;width:200px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px">';
echo '    <option value="Nederlands">Nederlands</option>';
echo '    <option value="Engels">Engels</option>';
echo '    <option value="Frans">Frans</option>';
echo '  </select></div>';
echo '  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Selecteren</button>';
echo '</form>';
?>
<div id="taal-output" style="margin:10px 0;padding:10px;background:#16213e;border-radius:4px"></div>
<script>
  var lang = "<?php echo $default; ?>";
  document.getElementById('taal-output').innerHTML = 'Geselecteerde taal: <b>' + lang + '</b>';
</script>`,
  },
  medium: {
    title: 'XSS DOM — Medium',
    description: 'Script-tags worden geblokkeerd maar de DOM-injectie via innerHTML blijft kwetsbaar',
    method: 'GET',
    php: `<?php
$default = isset($_GET['default']) ? $_GET['default'] : 'Nederlands';
$default = str_replace('<script>', '', $default);
echo '<h3>Taal selecteren</h3>';
echo '<form method="GET">';
echo '  <div style="margin:8px 0"><label>Taal:</label><br>';
echo '  <select name="default" style="padding:6px;width:200px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px">';
echo '    <option value="Nederlands">Nederlands</option>';
echo '    <option value="Engels">Engels</option>';
echo '    <option value="Frans">Frans</option>';
echo '  </select></div>';
echo '  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Selecteren</button>';
echo '</form>';
?>
<div id="taal-output" style="margin:10px 0;padding:10px;background:#16213e;border-radius:4px"></div>
<script>
  var lang = "<?php echo $default; ?>";
  document.getElementById('taal-output').innerHTML = 'Geselecteerde taal: <b>' + lang + '</b>';
</script>`,
  },
  high: {
    title: 'XSS DOM — High',
    description: 'Whitelist-controle op taalwaarden — alleen bekende waarden zijn toegestaan',
    method: 'GET',
    php: `<?php
$allowed = ['Nederlands', 'Engels', 'Frans', 'Duits'];
$default = isset($_GET['default']) ? $_GET['default'] : 'Nederlands';
if (!in_array($default, $allowed)) {
    $default = 'Nederlands';
}
echo '<h3>Taal selecteren</h3>';
echo '<form method="GET">';
echo '  <div style="margin:8px 0"><label>Taal:</label><br>';
echo '  <select name="default" style="padding:6px;width:200px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px">';
foreach ($allowed as $lang) {
    $sel = ($lang === $default) ? ' selected' : '';
    echo "  <option value=\"$lang\"$sel>$lang</option>";
}
echo '  </select></div>';
echo '  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Selecteren</button>';
echo '</form>';
?>
<div id="taal-output" style="margin:10px 0;padding:10px;background:#16213e;border-radius:4px"></div>
<script>
  var lang = "<?php echo $default; ?>";
  document.getElementById('taal-output').innerHTML = 'Geselecteerde taal: <b>' + lang + '</b>';
</script>
<p style="font-size:0.85em;color:#888">Alleen whitelisted waarden worden geaccepteerd. DOM-injectie via invoer is geblokkeerd.</p>`,
  },
  impossible: {
    title: 'XSS DOM — Impossible',
    description: 'Veilig: whitelist + textContent in plaats van innerHTML voorkomt DOM-injectie',
    method: 'GET',
    php: `<?php
$allowed = ['Nederlands', 'Engels', 'Frans', 'Duits'];
$default = isset($_GET['default']) ? $_GET['default'] : 'Nederlands';
if (!in_array($default, $allowed)) {
    $default = 'Nederlands';
}
$safe = htmlspecialchars($default, ENT_QUOTES, 'UTF-8');
echo '<h3>Taal selecteren</h3>';
echo '<form method="GET">';
echo '  <div style="margin:8px 0"><label>Taal:</label><br>';
echo '  <select name="default" style="padding:6px;width:200px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px">';
foreach ($allowed as $lang) {
    $sel = ($lang === $default) ? ' selected' : '';
    echo '  <option value="' . htmlspecialchars($lang, ENT_QUOTES, 'UTF-8') . '"' . $sel . '>' . htmlspecialchars($lang, ENT_QUOTES, 'UTF-8') . '</option>';
}
echo '  </select></div>';
echo '  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Selecteren</button>';
echo '</form>';
?>
<div id="taal-output" style="margin:10px 0;padding:10px;background:#16213e;border-radius:4px"></div>
<script>
  var lang = <?php echo json_encode($safe); ?>;
  document.getElementById('taal-output').textContent = 'Geselecteerde taal: ' + lang;
</script>
<p style="font-size:0.85em;color:#5f9eea">&#128737; Beveiligd: whitelist + textContent (geen innerHTML) + json_encode.</p>`,
  },
};
