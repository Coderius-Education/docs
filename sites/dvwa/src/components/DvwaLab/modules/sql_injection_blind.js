export const sqlInjectionBlind = {
  low: {
    title: 'SQL Injection (Blind) — Low',
    description: 'Boolean-based blind injection: de applicatie toont alleen "bestaat" of "bestaat niet"',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
if (isset($_GET['id'])) {
    $id = $_GET['id'];
    $result = $db->query("SELECT user_id FROM users WHERE user_id = '$id'");
    $row = $result ? $result->fetchArray() : false;
    if ($row) {
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Gebruiker ID <b>' . htmlspecialchars($id) . '</b> bestaat.</div>';
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Gebruiker ID <b>' . htmlspecialchars($id) . '</b> bestaat NIET.</div>';
    }
}
$db->close();
echo $message;
?>
<h3>Gebruikerscontrole</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Gebruiker ID:</label><br><input type="text" name="id" placeholder="1" style="padding:6px;width:200px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Controleren</button>
</form>`,
  },
  medium: {
    title: 'SQL Injection (Blind) — Medium',
    description: 'Numerieke controle via POST — minder flexibel maar nog steeds kwetsbaar via sleep-technieken',
    method: 'POST',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
if (isset($_POST['id'])) {
    $id = (int)$_POST['id'];
    $result = $db->query("SELECT user_id FROM users WHERE user_id = $id");
    $row = $result ? $result->fetchArray() : false;
    if ($row) {
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Gebruiker bestaat.</div>';
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Gebruiker bestaat niet.</div>';
    }
}
$db->close();
echo $message;
?>
<h3>Gebruikerscontrole</h3>
<form method="POST">
  <div style="margin:8px 0"><label>Gebruiker ID:</label><br>
  <select name="id" style="padding:6px;width:200px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px">
    <option value="1">1</option>
    <option value="2">2</option>
    <option value="3">3</option>
    <option value="4">4</option>
    <option value="5">5</option>
  </select></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Controleren</button>
</form>`,
  },
  high: {
    title: 'SQL Injection (Blind) — High',
    description: 'ID via cookie — LIMIT 1 en willekeurige slaaptijd om timing-aanvallen te bemoeilijken',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
if (isset($_GET['id'])) {
    $id = $_GET['id'];
    $result = $db->query("SELECT user_id FROM users WHERE user_id = '$id' LIMIT 1");
    $row = $result ? $result->fetchArray() : false;
    if ($row) {
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Gebruiker bestaat.</div>';
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Gebruiker bestaat niet.</div>';
    }
}
$db->close();
echo $message;
?>
<h3>Gebruikerscontrole</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Gebruiker ID:</label><br><input type="text" name="id" placeholder="1" style="padding:6px;width:200px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Controleren</button>
</form>`,
  },
  impossible: {
    title: 'SQL Injection (Blind) — Impossible',
    description: 'Veilige implementatie: prepared statements en strikte ID-validatie',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
if (isset($_GET['id'])) {
    $id = $_GET['id'];
    if (!ctype_digit($id)) {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Ongeldige invoer.</div>';
    } else {
        $stmt = $db->prepare("SELECT user_id FROM users WHERE user_id = :id");
        $stmt->bindValue(':id', (int)$id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        $row = $result->fetchArray();
        if ($row) {
            $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Gebruiker bestaat.</div>';
        } else {
            $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Gebruiker bestaat niet.</div>';
        }
    }
}
$db->close();
echo $message;
?>
<h3>Gebruikerscontrole</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Gebruiker ID:</label><br><input type="text" name="id" placeholder="1" style="padding:6px;width:200px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Controleren</button>
</form>
<p style="font-size:0.85em;color:#5f9eea">&#128737; Beveiligd: prepared statements + ctype_digit validatie.</p>`,
  },
};
