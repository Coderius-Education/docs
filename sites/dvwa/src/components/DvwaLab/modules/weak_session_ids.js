export const weakSessionIds = {
  low: {
    title: 'Weak Session IDs — Low',
    description: 'Sequentiële sessie-ID: eenvoudig te raden door simpelweg te tellen',
    method: 'POST',
    php: `<?php
$db = new SQLite3('/tmp/dvwa_session.db');
$db->exec('CREATE TABLE IF NOT EXISTS session_counter (id INTEGER PRIMARY KEY, counter INTEGER DEFAULT 0)');
$row = $db->query('SELECT counter FROM session_counter WHERE id=1')->fetchArray();
if (!$row) {
    $db->exec('INSERT INTO session_counter VALUES (1, 0)');
    $counter = 0;
} else {
    $counter = $row['counter'];
}
$message = '';
if (isset($_POST['generate'])) {
    $counter++;
    $db->exec("UPDATE session_counter SET counter=$counter WHERE id=1");
    $session_id = $counter;
    $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">';
    $message .= 'Nieuwe sessie-ID: <b>' . $session_id . '</b><br>';
    $message .= '<small style="color:#f0ad4e">&#9888; Sequentieel: vorige ID was ' . ($session_id - 1) . ', volgende wordt ' . ($session_id + 1) . '</small>';
    $message .= '</div>';
}
$db->close();
echo $message;
?>
<h3>Sessie-ID genereren</h3>
<form method="POST">
  <input type="hidden" name="generate" value="1" />
  <button type="submit" style="padding:8px 20px;cursor:pointer">Genereer sessie-ID</button>
</form>
<p style="font-size:0.85em;color:#888">Sessie-IDs zijn opeenvolgend — een aanvaller kan eenvoudig andere sessies raden.</p>`,
  },
  medium: {
    title: 'Weak Session IDs — Medium',
    description: 'Tijdstempel als sessie-ID: voorspelbaar via timestamp',
    method: 'POST',
    php: `<?php
$message = '';
if (isset($_POST['generate'])) {
    $session_id = time();
    $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">';
    $message .= 'Nieuwe sessie-ID: <b>' . $session_id . '</b><br>';
    $message .= '<small style="color:#f0ad4e">&#9888; Gebaseerd op Unix timestamp: ' . date('Y-m-d H:i:s', $session_id) . '</small>';
    $message .= '</div>';
}
echo $message;
?>
<h3>Sessie-ID genereren</h3>
<form method="POST">
  <input type="hidden" name="generate" value="1" />
  <button type="submit" style="padding:8px 20px;cursor:pointer">Genereer sessie-ID</button>
</form>
<p style="font-size:0.85em;color:#888">Sessie-ID is de huidige Unix-tijd — voorspelbaar als je het tijdstip van aanmelden weet.</p>`,
  },
  high: {
    title: 'Weak Session IDs — High',
    description: 'MD5-hash van een combinatie van teller en tijd — beter maar nog steeds analyseerbaar',
    method: 'POST',
    php: `<?php
$db = new SQLite3('/tmp/dvwa_session_high.db');
$db->exec('CREATE TABLE IF NOT EXISTS session_counter (id INTEGER PRIMARY KEY, counter INTEGER DEFAULT 0)');
$row = $db->query('SELECT counter FROM session_counter WHERE id=1')->fetchArray();
if (!$row) {
    $db->exec('INSERT INTO session_counter VALUES (1, 0)');
    $counter = 0;
} else {
    $counter = $row['counter'];
}
$message = '';
if (isset($_POST['generate'])) {
    $counter++;
    $db->exec("UPDATE session_counter SET counter=$counter WHERE id=1");
    $session_id = md5($counter . time());
    $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">';
    $message .= 'Nieuwe sessie-ID: <b>' . $session_id . '</b><br>';
    $message .= '<small style="color:#f0ad4e">&#9888; MD5(teller + timestamp): beperkte entropie</small>';
    $message .= '</div>';
}
$db->close();
echo $message;
?>
<h3>Sessie-ID genereren</h3>
<form method="POST">
  <input type="hidden" name="generate" value="1" />
  <button type="submit" style="padding:8px 20px;cursor:pointer">Genereer sessie-ID</button>
</form>
<p style="font-size:0.85em;color:#888">MD5 van teller + tijd — met bruteforce en tijdsbepaling nog te achterhalen.</p>`,
  },
  impossible: {
    title: 'Weak Session IDs — Impossible',
    description: 'Cryptografisch veilige sessie-ID via random_bytes()',
    method: 'POST',
    php: `<?php
$message = '';
if (isset($_POST['generate'])) {
    $session_id = bin2hex(random_bytes(32));
    $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">';
    $message .= 'Nieuwe sessie-ID: <b style="word-break:break-all">' . $session_id . '</b><br>';
    $message .= '<small style="color:#27c93f">&#10003; 256-bit cryptografisch willekeurig — niet te raden</small>';
    $message .= '</div>';
}
echo $message;
?>
<h3>Sessie-ID genereren</h3>
<form method="POST">
  <input type="hidden" name="generate" value="1" />
  <button type="submit" style="padding:8px 20px;cursor:pointer">Genereer sessie-ID</button>
</form>
<p style="font-size:0.85em;color:#5f9eea">&#128737; Beveiligd: random_bytes(32) geeft 256-bit entropie — onmogelijk te raden.</p>`,
  },
};
