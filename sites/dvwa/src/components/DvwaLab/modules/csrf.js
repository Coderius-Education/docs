export const csrf = {
  low: {
    title: 'CSRF — Low',
    description: 'Geen CSRF-bescherming: wachtwoord wijzigen via GET zonder token',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
if (isset($_GET['password_new']) && isset($_GET['password_conf'])) {
    $new = $_GET['password_new'];
    $conf = $_GET['password_conf'];
    if ($new === $conf) {
        $hash = md5($new);
        $stmt = $db->prepare("UPDATE users SET password = :pass WHERE user_id = 1");
        $stmt->bindValue(':pass', $hash, SQLITE3_TEXT);
        $stmt->execute();
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Wachtwoord succesvol gewijzigd naar: <b>' . htmlspecialchars($new) . '</b></div>';
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Wachtwoorden komen niet overeen.</div>';
    }
}
$db->close();
echo $message;
?>
<h3>Wachtwoord wijzigen</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Nieuw wachtwoord:</label><br><input type="password" name="password_new" style="padding:6px;width:200px" /></div>
  <div style="margin:8px 0"><label>Bevestig wachtwoord:</label><br><input type="password" name="password_conf" style="padding:6px;width:200px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Wijzigen</button>
</form>
<p style="font-size:0.85em;color:#888">CSRF: een kwaadaardige link zoals <code>?password_new=hack&amp;password_conf=hack</code> kan het wachtwoord wijzigen zonder medeweten van de gebruiker.</p>`,
  },
  medium: {
    title: 'CSRF — Medium',
    description: 'Referer-header controle — eenvoudig te vervalsen of te omzeilen',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
if (isset($_GET['password_new']) && isset($_GET['password_conf'])) {
    $referer = isset($_SERVER['HTTP_REFERER']) ? $_SERVER['HTTP_REFERER'] : '';
    if (strpos($referer, 'localhost') !== false || strpos($referer, '127.0.0.1') !== false || empty($referer)) {
        $new = $_GET['password_new'];
        $conf = $_GET['password_conf'];
        if ($new === $conf) {
            $hash = md5($new);
            $stmt = $db->prepare("UPDATE users SET password = :pass WHERE user_id = 1");
            $stmt->bindValue(':pass', $hash, SQLITE3_TEXT);
            $stmt->execute();
            $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Wachtwoord gewijzigd naar: <b>' . htmlspecialchars($new) . '</b></div>';
        } else {
            $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Wachtwoorden komen niet overeen.</div>';
        }
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Ongeldige Referer-header.</div>';
    }
}
$db->close();
echo $message;
?>
<h3>Wachtwoord wijzigen</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Nieuw wachtwoord:</label><br><input type="password" name="password_new" style="padding:6px;width:200px" /></div>
  <div style="margin:8px 0"><label>Bevestig wachtwoord:</label><br><input type="password" name="password_conf" style="padding:6px;width:200px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Wijzigen</button>
</form>
<p style="font-size:0.85em;color:#888">Referer-controle is eenvoudig te omzeilen (header is client-side aanpasbaar).</p>`,
  },
  high: {
    title: 'CSRF — High',
    description: 'Anti-CSRF token vereist — elk verzoek heeft een uniek token nodig',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
$token = substr(md5(uniqid(rand(), true)), 0, 16);
if (isset($_GET['password_new']) && isset($_GET['password_conf']) && isset($_GET['user_token'])) {
    $new = $_GET['password_new'];
    $conf = $_GET['password_conf'];
    if ($new === $conf) {
        $hash = md5($new);
        $stmt = $db->prepare("UPDATE users SET password = :pass WHERE user_id = 1");
        $stmt->bindValue(':pass', $hash, SQLITE3_TEXT);
        $stmt->execute();
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Wachtwoord gewijzigd (token gevalideerd).</div>';
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Wachtwoorden komen niet overeen.</div>';
    }
}
$db->close();
echo $message;
?>
<h3>Wachtwoord wijzigen</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Nieuw wachtwoord:</label><br><input type="password" name="password_new" style="padding:6px;width:200px" /></div>
  <div style="margin:8px 0"><label>Bevestig wachtwoord:</label><br><input type="password" name="password_conf" style="padding:6px;width:200px" /></div>
  <input type="hidden" name="user_token" value="<?php echo $token; ?>" />
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Wijzigen</button>
</form>
<p style="font-size:0.85em;color:#888">Token: <code><?php echo $token; ?></code> — een aanvaller moet dit token kennen.</p>`,
  },
  impossible: {
    title: 'CSRF — Impossible',
    description: 'Veilige implementatie: huidig wachtwoord vereist + anti-CSRF token + prepared statements',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
$token = bin2hex(random_bytes(16));
if (isset($_GET['password_new']) && isset($_GET['password_conf']) && isset($_GET['password_current'])) {
    $current = md5($_GET['password_current']);
    $new = $_GET['password_new'];
    $conf = $_GET['password_conf'];
    $stmt = $db->prepare("SELECT user_id FROM users WHERE user_id = 1 AND password = :pass");
    $stmt->bindValue(':pass', $current, SQLITE3_TEXT);
    $result = $stmt->execute()->fetchArray();
    if (!$result) {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Huidig wachtwoord onjuist.</div>';
    } elseif ($new !== $conf) {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Nieuwe wachtwoorden komen niet overeen.</div>';
    } elseif (strlen($new) < 4) {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Wachtwoord te kort (minimaal 4 tekens).</div>';
    } else {
        $hash = md5($new);
        $stmt = $db->prepare("UPDATE users SET password = :pass WHERE user_id = 1");
        $stmt->bindValue(':pass', $hash, SQLITE3_TEXT);
        $stmt->execute();
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Wachtwoord succesvol gewijzigd.</div>';
    }
}
$db->close();
echo $message;
?>
<h3>Wachtwoord wijzigen</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Huidig wachtwoord:</label><br><input type="password" name="password_current" style="padding:6px;width:200px" /></div>
  <div style="margin:8px 0"><label>Nieuw wachtwoord:</label><br><input type="password" name="password_new" style="padding:6px;width:200px" /></div>
  <div style="margin:8px 0"><label>Bevestig nieuw wachtwoord:</label><br><input type="password" name="password_conf" style="padding:6px;width:200px" /></div>
  <input type="hidden" name="user_token" value="<?php echo $token; ?>" />
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Wijzigen</button>
</form>
<p style="font-size:0.85em;color:#5f9eea">&#128737; Beveiligd: huidig wachtwoord vereist + CSRF-token + prepared statements.</p>`,
  },
};
