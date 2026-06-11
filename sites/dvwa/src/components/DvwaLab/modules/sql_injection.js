export const sqlInjection = {
  low: {
    title: 'SQL Injection — Low',
    description: 'Geen bescherming: gebruikersinvoer direct in SQL-query ingevoegd',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
if (isset($_GET['id'])) {
    $id = $_GET['id'];
    $result = $db->query("SELECT first_name, last_name FROM users WHERE user_id = '$id'");
    if ($result) {
        $found = false;
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $found = true;
            $message .= '<div style="margin:8px 0;padding:8px;background:#16213e;border-radius:4px">';
            $message .= 'Voornaam: <b>' . $row['first_name'] . '</b><br>';
            $message .= 'Achternaam: <b>' . $row['last_name'] . '</b>';
            $message .= '</div>';
        }
        if (!$found) {
            $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Gebruiker niet gevonden.</div>';
        }
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">SQL-fout: ' . $db->lastErrorMsg() . '</div>';
    }
}
$db->close();
echo $message;
?>
<h3>Gebruikersopzoeking</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Gebruiker ID:</label><br><input type="text" name="id" placeholder="1" style="padding:6px;width:200px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Opzoeken</button>
</form>`,
  },
  medium: {
    title: 'SQL Injection — Medium',
    description: 'Beperkte bescherming: numerieke invoer via dropdown, maar geen prepared statement',
    method: 'POST',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
if (isset($_POST['id'])) {
    $id = (int)$_POST['id'];
    $result = $db->query("SELECT first_name, last_name FROM users WHERE user_id = $id");
    if ($result) {
        $found = false;
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $found = true;
            $message .= '<div style="margin:8px 0;padding:8px;background:#16213e;border-radius:4px">';
            $message .= 'Voornaam: <b>' . htmlspecialchars($row['first_name']) . '</b><br>';
            $message .= 'Achternaam: <b>' . htmlspecialchars($row['last_name']) . '</b>';
            $message .= '</div>';
        }
        if (!$found) {
            $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Gebruiker niet gevonden.</div>';
        }
    }
}
$db->close();
echo $message;
?>
<h3>Gebruikersopzoeking</h3>
<form method="POST">
  <div style="margin:8px 0"><label>Gebruiker ID:</label><br>
  <select name="id" style="padding:6px;width:200px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px">
    <option value="1">1</option>
    <option value="2">2</option>
    <option value="3">3</option>
    <option value="4">4</option>
    <option value="5">5</option>
  </select></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Opzoeken</button>
</form>`,
  },
  high: {
    title: 'SQL Injection — High',
    description: 'ID via cookie meegegeven — minder zichtbaar maar nog steeds kwetsbaar',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
$id = isset($_GET['id']) ? $_GET['id'] : '1';
$result = $db->query("SELECT first_name, last_name FROM users WHERE user_id = '$id' LIMIT 1");
if ($result) {
    $found = false;
    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
        $found = true;
        $message .= '<div style="margin:8px 0;padding:8px;background:#16213e;border-radius:4px">';
        $message .= 'Voornaam: <b>' . $row['first_name'] . '</b><br>';
        $message .= 'Achternaam: <b>' . $row['last_name'] . '</b>';
        $message .= '</div>';
    }
    if (!$found) {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Gebruiker niet gevonden.</div>';
    }
} else {
    $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">SQL-fout: ' . $db->lastErrorMsg() . '</div>';
}
$db->close();
echo $message;
?>
<h3>Gebruikersopzoeking (LIMIT 1)</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Gebruiker ID:</label><br><input type="text" name="id" placeholder="1" style="padding:6px;width:200px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Opzoeken</button>
</form>`,
  },
  impossible: {
    title: 'SQL Injection — Impossible',
    description: 'Veilige implementatie: prepared statements en strikte ID-validatie',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
if (isset($_GET['id'])) {
    $id = $_GET['id'];
    if (!is_numeric($id) || (int)$id != $id) {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Ongeldige invoer: alleen gehele getallen toegestaan.</div>';
    } else {
        $stmt = $db->prepare("SELECT first_name, last_name FROM users WHERE user_id = :id");
        $stmt->bindValue(':id', (int)$id, SQLITE3_INTEGER);
        $result = $stmt->execute();
        $found = false;
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $found = true;
            $message .= '<div style="margin:8px 0;padding:8px;background:#16213e;border-radius:4px">';
            $message .= 'Voornaam: <b>' . htmlspecialchars($row['first_name']) . '</b><br>';
            $message .= 'Achternaam: <b>' . htmlspecialchars($row['last_name']) . '</b>';
            $message .= '</div>';
        }
        if (!$found) {
            $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Gebruiker niet gevonden.</div>';
        }
    }
}
$db->close();
echo $message;
?>
<h3>Gebruikersopzoeking</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Gebruiker ID:</label><br><input type="text" name="id" placeholder="1" style="padding:6px;width:200px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Opzoeken</button>
</form>
<p style="font-size:0.85em;color:#5f9eea">&#128737; Beveiligd: prepared statements + strikte integer-validatie.</p>`,
  },
};
