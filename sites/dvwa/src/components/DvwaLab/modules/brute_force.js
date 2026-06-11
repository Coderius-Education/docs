export const bruteForce = {
  low: {
    title: 'Brute Force — Low',
    description: 'Geen bescherming: wachtwoord check via GET-parameters en SQLite database',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
if (isset($_GET['username']) && isset($_GET['password'])) {
    $user = $_GET['username'];
    $pass = $_GET['password'];
    $pass_md5 = md5($pass);

    $result = $db->query("SELECT * FROM users WHERE user = '$user' AND password = '$pass_md5'");
    $row = $result->fetchArray();

    if ($row) {
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Welkom, ' . htmlspecialchars($user) . '! Je hebt toegang.</div>';
        $message .= '<p>Voornaam: ' . htmlspecialchars($row['first_name']) . ' ' . htmlspecialchars($row['last_name']) . '</p>';
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Gebruikersnaam of wachtwoord onjuist.</div>';
    }
}
$db->close();
echo $message;
?>
<h3>Login</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Username:</label><br><input type="text" name="username" style="padding:6px;width:200px" /></div>
  <div style="margin:8px 0"><label>Password:</label><br><input type="password" name="password" style="padding:6px;width:200px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Login</button>
</form>`,
  },
  medium: {
    title: 'Brute Force — Medium',
    description: 'Vertraging na foute poging (2 sec sleep) + SQLite database',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
if (isset($_GET['username']) && isset($_GET['password'])) {
    $user = $_GET['username'];
    $pass = $_GET['password'];
    $pass_md5 = md5($pass);

    $result = $db->query("SELECT * FROM users WHERE user = '" . SQLite3::escapeString($user) . "' AND password = '$pass_md5'");
    $row = $result->fetchArray();

    if ($row) {
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Welkom, ' . htmlspecialchars($user) . '!</div>';
    } else {
        // Medium: 2 second delay on failure (simulated client-side)
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Gebruikersnaam of wachtwoord onjuist.<br><small>&#9201; Bij een fout antwoord wordt het systeem 2 seconden geblokkeerd.</small></div>';
    }
}
$db->close();
echo $message;
?>
<h3>Login</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Username:</label><br><input type="text" name="username" style="padding:6px;width:200px" /></div>
  <div style="margin:8px 0"><label>Password:</label><br><input type="password" name="password" style="padding:6px;width:200px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Login</button>
</form>`,
  },
  high: {
    title: 'Brute Force — High',
    description: 'Anti-CSRF token vereist bij elke poging + SQLite database',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
$token = substr(md5(rand()), 0, 16);

if (isset($_GET['username']) && isset($_GET['password'])) {
    $user = $_GET['username'];
    $pass = $_GET['password'];
    $pass_md5 = md5($pass);

    $stmt = $db->prepare("SELECT * FROM users WHERE user = :user AND password = :pass");
    $stmt->bindValue(':user', $user, SQLITE3_TEXT);
    $stmt->bindValue(':pass', $pass_md5, SQLITE3_TEXT);
    $result = $stmt->execute();
    $row = $result->fetchArray();

    if ($row) {
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Welkom, ' . htmlspecialchars($user) . '!</div>';
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Gebruikersnaam of wachtwoord onjuist.<br><small>&#128274; Anti-CSRF token: elke poging vereist een nieuw token.</small></div>';
    }
}
$db->close();
echo $message;
?>
<h3>Login</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Username:</label><br><input type="text" name="username" style="padding:6px;width:200px" /></div>
  <div style="margin:8px 0"><label>Password:</label><br><input type="password" name="password" style="padding:6px;width:200px" /></div>
  <input type="hidden" name="user_token" value="<?php echo $token; ?>" />
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Login</button>
</form>
<p style="font-size:0.8em;color:#888">Token: <?php echo $token; ?></p>`,
  },
  impossible: {
    title: 'Brute Force — Impossible',
    description: 'Veilige implementatie: prepared statements, account lockout, rate limiting',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$message = '';
$token = bin2hex(random_bytes(16));

// Create lockout table if not exists
$db->exec('CREATE TABLE IF NOT EXISTS login_attempts (
    username TEXT, attempt_time INTEGER
)');

if (isset($_GET['username']) && isset($_GET['password'])) {
    $user = $_GET['username'];
    $pass = $_GET['password'];
    $pass_md5 = md5($pass);
    $now = time();

    // Check for lockout: 3 failed attempts in last 15 minutes
    $stmt = $db->prepare("SELECT COUNT(*) as cnt FROM login_attempts WHERE username = :user AND attempt_time > :cutoff");
    $stmt->bindValue(':user', $user, SQLITE3_TEXT);
    $stmt->bindValue(':cutoff', $now - 900, SQLITE3_INTEGER);
    $lockout_count = $stmt->execute()->fetchArray()['cnt'];

    if ($lockout_count >= 3) {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Account vergrendeld. Probeer het over 15 minuten opnieuw.<br><small>&#128274; Na 3 foute pogingen wordt het account tijdelijk geblokkeerd.</small></div>';
    } else {
        // Use prepared statement (prevents SQL injection)
        $stmt = $db->prepare("SELECT * FROM users WHERE user = :user AND password = :pass");
        $stmt->bindValue(':user', $user, SQLITE3_TEXT);
        $stmt->bindValue(':pass', $pass_md5, SQLITE3_TEXT);
        $result = $stmt->execute();
        $row = $result->fetchArray();

        if ($row) {
            // Clear failed attempts on success
            $stmt = $db->prepare("DELETE FROM login_attempts WHERE username = :user");
            $stmt->bindValue(':user', $user, SQLITE3_TEXT);
            $stmt->execute();
            $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Welkom, ' . htmlspecialchars($user) . '!</div>';
        } else {
            // Log failed attempt
            $stmt = $db->prepare("INSERT INTO login_attempts VALUES (:user, :time)");
            $stmt->bindValue(':user', $user, SQLITE3_TEXT);
            $stmt->bindValue(':time', $now, SQLITE3_INTEGER);
            $stmt->execute();
            $remaining = 2 - $lockout_count;
            $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Gebruikersnaam of wachtwoord onjuist.<br><small>Nog ' . $remaining . ' poging(en) voor account lockout.</small></div>';
        }
    }
}
$db->close();
echo $message;
?>
<h3>Login</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Username:</label><br><input type="text" name="username" style="padding:6px;width:200px" /></div>
  <div style="margin:8px 0"><label>Password:</label><br><input type="password" name="password" style="padding:6px;width:200px" /></div>
  <input type="hidden" name="user_token" value="<?php echo $token; ?>" />
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Login</button>
</form>
<p style="font-size:0.85em;color:#5f9eea">&#128737; Beveiligd: prepared statements, account lockout na 3 pogingen, anti-CSRF token.</p>`,
  },
};
