export const authorizationBypass = {
  low: {
    title: 'Authorization Bypass — Low',
    description: 'Rol wordt bepaald door een URL-parameter',
    method: 'GET',
    php: `<?php
$role = isset($_GET['role']) ? $_GET['role'] : 'user';
$content = '';

if ($role === 'admin') {
    $content = '<div style="color:#27c93f;padding:15px;border:2px solid #27c93f;border-radius:8px;margin:10px 0">
        <h4>Admin Dashboard</h4>
        <p>Welkom, admin! Hier zijn de geheime gegevens:</p>
        <ul>
            <li>Database wachtwoord: <code>supersecret123</code></li>
            <li>API key: <code>sk-dvwa-demo-key-12345</code></li>
            <li>Aantal gebruikers: 1337</li>
        </ul>
    </div>';
} else {
    $content = '<div style="padding:15px;border:2px solid #ffbd2e;border-radius:8px;margin:10px 0">
        <h4>Gebruiker Dashboard</h4>
        <p>Welkom! Je hebt beperkte toegang.</p>
        <p style="color:#888">Je bent ingelogd als: <strong>' . htmlspecialchars($role) . '</strong></p>
    </div>';
}
echo $content;
?>
<p style="font-size:0.85em;color:#888">Hint: bekijk de URL-parameters...</p>`,
  },
  medium: {
    title: 'Authorization Bypass — Medium',
    description: 'Rol wordt opgeslagen in een cookie',
    method: 'GET',
    php: `<?php
// In a real app, the role would be in a cookie
// Here we simulate it with a GET parameter that represents the cookie value
$role = isset($_GET['cookie_role']) ? $_GET['cookie_role'] : 'user';
$content = '';

if ($role === 'admin') {
    $content = '<div style="color:#27c93f;padding:15px;border:2px solid #27c93f;border-radius:8px;margin:10px 0">
        <h4>Admin Dashboard</h4>
        <p>Welkom, admin!</p>
        <ul>
            <li>Server status: <span style="color:#27c93f">Online</span></li>
            <li>Backup: laatste backup 2 uur geleden</li>
        </ul>
    </div>';
} else {
    $content = '<div style="padding:15px;border:2px solid #ffbd2e;border-radius:8px;margin:10px 0">
        <h4>Gebruiker Dashboard</h4>
        <p>Je hebt beperkte toegang.</p>
        <p style="color:#888">Cookie role: <code>' . htmlspecialchars($role) . '</code></p>
    </div>';
}
echo $content;
?>
<p style="font-size:0.85em;color:#888">Hint: de rol zit in een cookie. Open Developer Tools → Application → Cookies...</p>`,
  },
  high: {
    title: 'Authorization Bypass — High',
    description: 'Sessie-token vereist voor toegang tot admin-gegevens',
    method: 'GET',
    php: `<?php
// High: a session token is required to access the admin area.
// The server generates a token and stores it in the session.
// The user must submit the correct token to prove authorization.
session_start();
$session_token = isset($_SESSION['auth_token']) ? $_SESSION['auth_token'] : bin2hex(random_bytes(16));
$_SESSION['auth_token'] = $session_token;

$role = isset($_GET['role']) ? $_GET['role'] : 'user';
$submitted_token = isset($_GET['token']) ? $_GET['token'] : '';
$content = '';

if ($role === 'admin') {
    if ($submitted_token === $session_token) {
        $content = '<div style="color:#27c93f;padding:15px;border:2px solid #27c93f;border-radius:8px;margin:10px 0">
            <h4>Admin Dashboard</h4>
            <p>Welkom, admin! Toegang geverifieerd met sessie-token.</p>
            <ul>
                <li>Database wachtwoord: <code>supersecret123</code></li>
                <li>API key: <code>sk-dvwa-demo-key-12345</code></li>
                <li>Sessies actief: 42</li>
            </ul>
        </div>';
    } else {
        $content = '<div style="color:#ff5f56;padding:15px;border:2px solid #ff5f56;border-radius:8px;margin:10px 0">
            <h4>Toegang geweigerd</h4>
            <p>Ongeldig sessie-token. Je hebt niet het juiste token meegestuurd.</p>
        </div>';
    }
} else {
    $content = '<div style="padding:15px;border:2px solid #ffbd2e;border-radius:8px;margin:10px 0">
        <h4>Gebruiker Dashboard</h4>
        <p>Je hebt beperkte toegang.</p>
        <p style="color:#888">Sessie-token: <code>' . htmlspecialchars($session_token) . '</code></p>
    </div>';
}
echo $content;
?>
<p style="font-size:0.85em;color:#888">Hint: de server vereist een geldig sessie-token. Kun je het token vinden en meesturen?</p>`,
  },
  impossible: {
    title: 'Authorization Bypass — Impossible',
    description: 'Veilige implementatie: server-side rolcontrole vanuit de database',
    method: 'GET',
    php: `<?php
// IMPOSSIBLE: The role is determined entirely server-side from the database.
// No client-side parameter, cookie, or token can override it.
// The logged-in user's role is fetched from the users table.

$db = new SQLite3('/tmp/dvwa.db');

// Simulate a logged-in regular user (not admin)
$current_user = 'gordonb';

$stmt = $db->prepare("SELECT * FROM users WHERE user = :user");
$stmt->bindValue(':user', $current_user, SQLITE3_TEXT);
$result = $stmt->execute();
$row = $result->fetchArray();

// Role is determined by the user_id — only user_id 1 (admin) has admin access
$is_admin = ($row && $row['user_id'] == 1);

$content = '';
if ($is_admin) {
    $content = '<div style="color:#27c93f;padding:15px;border:2px solid #27c93f;border-radius:8px;margin:10px 0">
        <h4>Admin Dashboard</h4>
        <p>Welkom, admin!</p>
    </div>';
} else {
    $content = '<div style="padding:15px;border:2px solid #ffbd2e;border-radius:8px;margin:10px 0">
        <h4>Gebruiker Dashboard</h4>
        <p>Welkom, ' . htmlspecialchars($row['first_name']) . '! Je hebt beperkte toegang.</p>
        <p style="color:#888">Je rol wordt bepaald door de database, niet door client-side parameters.</p>
    </div>';
}
$db->close();
echo $content;
?>
<p style="font-size:0.85em;color:#5f9eea">&#128737; Beveiligd: de rol wordt server-side bepaald vanuit de database. URL-parameters, cookies en tokens hebben geen invloed.</p>`,
  },
};
