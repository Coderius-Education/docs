// Insecure Direct Object Reference (IDOR): de server haalt een profiel op op
// basis van het ID dat de browser meestuurt, zonder te controleren of dat
// profiel wel van de ingelogde gebruiker is. De ingelogde gebruiker is telkens
// Gordon (user_id 2); alleen `impossible` dwingt dat server-side af.
export const authorizationBypass = {
  low: {
    title: 'Authorization Bypass — Low',
    description: 'De server haalt elk gevraagd profiel op, zonder autorisatiecheck',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$id = isset($_GET['id']) ? $_GET['id'] : '2';
$stmt = $db->prepare("SELECT user_id, first_name, last_name, user FROM users WHERE user_id = :id");
$stmt->bindValue(':id', $id, SQLITE3_INTEGER);
$row = $stmt->execute()->fetchArray();
$db->close();

if ($row) {
    if ($row['user_id'] == 1) {
        $geheim = 'Database wachtwoord: <code>supersecret123</code> &middot; API key: <code>sk-dvwa-demo-key-12345</code>';
    } else {
        $geheim = 'Privédossier van ' . htmlspecialchars($row['first_name']) . ' — alleen bedoeld voor de eigenaar.';
    }
    echo '<div style="color:#27c93f;padding:15px;border:2px solid #27c93f;border-radius:8px;margin:10px 0">
        <h4>Profiel van ' . htmlspecialchars($row['first_name']) . ' ' . htmlspecialchars($row['last_name']) . '</h4>
        <p>Gebruikersnaam: <code>' . htmlspecialchars($row['user']) . '</code> (ID ' . (int)$row['user_id'] . ')</p>
        <p style="color:#888">' . $geheim . '</p>
    </div>';
} else {
    echo '<div style="color:#ff5f56;padding:15px;border:2px solid #ff5f56;border-radius:8px;margin:10px 0">
        <h4>Niet gevonden</h4>
        <p>Geen profiel met ID ' . htmlspecialchars($id) . '.</p>
    </div>';
}
?>
<h3>Profiel bekijken</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Kies een profiel:</label><br>
  <select name="id" style="padding:6px;width:220px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px">
    <option value="2">Gordon Brown (jij)</option>
    <option value="3">Hack Me</option>
    <option value="5">Bob Smith</option>
  </select></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Opvragen</button>
</form>
<p style="font-size:0.85em;color:#888">De server haalt het gevraagde profiel op zonder te controleren of het van jou is.</p>`,
  },
  medium: {
    title: 'Authorization Bypass — Medium',
    description: 'De dropdown toont alleen je eigen profiel — de server controleert de waarde niet',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$id = isset($_GET['id']) ? $_GET['id'] : '2';
$stmt = $db->prepare("SELECT user_id, first_name, last_name, user FROM users WHERE user_id = :id");
$stmt->bindValue(':id', $id, SQLITE3_INTEGER);
$row = $stmt->execute()->fetchArray();
$db->close();

if ($row) {
    if ($row['user_id'] == 1) {
        $geheim = 'Database wachtwoord: <code>supersecret123</code> &middot; API key: <code>sk-dvwa-demo-key-12345</code>';
    } else {
        $geheim = 'Privédossier van ' . htmlspecialchars($row['first_name']) . ' — alleen bedoeld voor de eigenaar.';
    }
    echo '<div style="color:#27c93f;padding:15px;border:2px solid #27c93f;border-radius:8px;margin:10px 0">
        <h4>Profiel van ' . htmlspecialchars($row['first_name']) . ' ' . htmlspecialchars($row['last_name']) . '</h4>
        <p>Gebruikersnaam: <code>' . htmlspecialchars($row['user']) . '</code> (ID ' . (int)$row['user_id'] . ')</p>
        <p style="color:#888">' . $geheim . '</p>
    </div>';
} else {
    echo '<div style="color:#ff5f56;padding:15px;border:2px solid #ff5f56;border-radius:8px;margin:10px 0">
        <h4>Niet gevonden</h4>
        <p>Geen profiel met ID ' . htmlspecialchars($id) . '.</p>
    </div>';
}
?>
<h3>Profiel bekijken</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Jouw profiel:</label><br>
  <select name="id" style="padding:6px;width:220px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px">
    <option value="2">Gordon Brown (jij)</option>
  </select></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Opvragen</button>
</form>
<p style="font-size:0.85em;color:#888">De dropdown toont alleen je eigen profiel — maar de server controleert de meegestuurde waarde niet.</p>`,
  },
  high: {
    title: 'Authorization Bypass — High',
    description:
      'Een JavaScript-controle in de browser blokkeert andere profielen — de server niet',
    method: 'GET',
    php: `<?php
$db = new SQLite3('/tmp/dvwa.db');
$id = isset($_GET['id']) ? $_GET['id'] : '2';
$stmt = $db->prepare("SELECT user_id, first_name, last_name, user FROM users WHERE user_id = :id");
$stmt->bindValue(':id', $id, SQLITE3_INTEGER);
$row = $stmt->execute()->fetchArray();
$db->close();

if ($row) {
    if ($row['user_id'] == 1) {
        $geheim = 'Database wachtwoord: <code>supersecret123</code> &middot; API key: <code>sk-dvwa-demo-key-12345</code>';
    } else {
        $geheim = 'Privédossier van ' . htmlspecialchars($row['first_name']) . ' — alleen bedoeld voor de eigenaar.';
    }
    echo '<div style="color:#27c93f;padding:15px;border:2px solid #27c93f;border-radius:8px;margin:10px 0">
        <h4>Profiel van ' . htmlspecialchars($row['first_name']) . ' ' . htmlspecialchars($row['last_name']) . '</h4>
        <p>Gebruikersnaam: <code>' . htmlspecialchars($row['user']) . '</code> (ID ' . (int)$row['user_id'] . ')</p>
        <p style="color:#888">' . $geheim . '</p>
    </div>';
} else {
    echo '<div style="color:#ff5f56;padding:15px;border:2px solid #ff5f56;border-radius:8px;margin:10px 0">
        <h4>Niet gevonden</h4>
        <p>Geen profiel met ID ' . htmlspecialchars($id) . '.</p>
    </div>';
}
?>
<h3>Profiel bekijken</h3>
<form method="GET" onsubmit="return controleerProfiel(event)">
  <div style="margin:8px 0"><label>Kies een profiel:</label><br>
  <select name="id" id="profiel-keuze" style="padding:6px;width:220px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px">
    <option value="2">Gordon Brown (jij)</option>
    <option value="3">Hack Me</option>
    <option value="5">Bob Smith</option>
    <option value="1">admin</option>
  </select></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Opvragen</button>
</form>
<script>
  function controleerProfiel(e) {
    var eigenId = "2";
    var gekozen = document.getElementById('profiel-keuze').value;
    if (gekozen !== eigenId) {
      alert('Je mag alleen je eigen profiel bekijken.');
      e.preventDefault();
      e.stopPropagation();
      return false;
    }
    return true;
  }
</script>
<p style="font-size:0.85em;color:#888">Een JavaScript-controle blokkeert andere ID's — maar die draait in jouw browser, niet op de server.</p>`,
  },
  impossible: {
    title: 'Authorization Bypass — Impossible',
    description: 'Veilig: de server bepaalt je identiteit uit de sessie en weigert elk ander ID',
    method: 'GET',
    php: `<?php
// IMPOSSIBLE: de server kent de ingelogde gebruiker uit de sessie (hier
// gesimuleerd als user_id 2, Gordon) en negeert het ID uit de request voor de
// autorisatie. Een gewone gebruiker mag alleen zijn eigen profiel opvragen.
$db = new SQLite3('/tmp/dvwa.db');
$eigen_id = 2;
$gevraagd = isset($_GET['id']) ? (int)$_GET['id'] : $eigen_id;

if ($gevraagd !== $eigen_id) {
    echo '<div style="color:#ff5f56;padding:15px;border:2px solid #ff5f56;border-radius:8px;margin:10px 0">
        <h4>Toegang geweigerd</h4>
        <p>Je mag alleen je eigen profiel bekijken. Het gevraagde ID hoort niet bij jouw account.</p>
    </div>';
} else {
    $stmt = $db->prepare("SELECT first_name, last_name, user FROM users WHERE user_id = :id");
    $stmt->bindValue(':id', $eigen_id, SQLITE3_INTEGER);
    $row = $stmt->execute()->fetchArray();
    echo '<div style="padding:15px;border:2px solid #ffbd2e;border-radius:8px;margin:10px 0">
        <h4>Profiel van ' . htmlspecialchars($row['first_name']) . ' ' . htmlspecialchars($row['last_name']) . '</h4>
        <p>Gebruikersnaam: <code>' . htmlspecialchars($row['user']) . '</code></p>
        <p style="color:#888">Je rol en identiteit komen uit de sessie, niet uit de request.</p>
    </div>';
}
$db->close();
?>
<h3>Profiel bekijken</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Kies een profiel:</label><br>
  <select name="id" style="padding:6px;width:220px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px">
    <option value="2">Gordon Brown (jij)</option>
    <option value="3">Hack Me</option>
    <option value="1">admin</option>
  </select></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Opvragen</button>
</form>
<p style="font-size:0.85em;color:#5f9eea">&#128737; Beveiligd: de server bepaalt je identiteit uit de sessie. Een aangepast ID, cookie of uitgeschakelde JavaScript verandert daar niets aan.</p>`,
  },
};
