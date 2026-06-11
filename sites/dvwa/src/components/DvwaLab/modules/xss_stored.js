export const xssStored = {
  low: {
    title: 'XSS Stored — Low',
    description: 'Geen sanitisatie: berichten worden rauw opgeslagen en weergegeven',
    method: 'POST',
    php: `<?php
$db = new SQLite3('/tmp/dvwa_xss.db');
$db->exec('CREATE TABLE IF NOT EXISTS guestbook (name TEXT, comment TEXT)');
$message = '';
if (isset($_POST['name']) && isset($_POST['mtxMessage'])) {
    $name = $_POST['name'];
    $comment = $_POST['mtxMessage'];
    $stmt = $db->prepare("INSERT INTO guestbook (name, comment) VALUES (:name, :comment)");
    $stmt->bindValue(':name', $name, SQLITE3_TEXT);
    $stmt->bindValue(':comment', $comment, SQLITE3_TEXT);
    $stmt->execute();
}
$result = $db->query("SELECT name, comment FROM guestbook ORDER BY rowid DESC LIMIT 10");
$entries = '';
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $entries .= '<div style="margin:6px 0;padding:8px;background:#16213e;border-radius:4px;border-left:3px solid #e94560">';
    $entries .= '<b>' . $row['name'] . '</b>: ' . $row['comment'];
    $entries .= '</div>';
}
$db->close();
echo $entries;
?>
<h3>Gastenboek</h3>
<form method="POST">
  <div style="margin:8px 0"><label>Naam:</label><br><input type="text" name="name" maxlength="10" placeholder="Jan" style="padding:6px;width:200px" /></div>
  <div style="margin:8px 0"><label>Bericht:</label><br><textarea name="mtxMessage" maxlength="50" rows="3" style="padding:6px;width:300px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px"></textarea></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Opslaan</button>
</form>`,
  },
  medium: {
    title: 'XSS Stored — Medium',
    description: 'Script-tags worden gestript uit het bericht, maar naam is niet gefilterd',
    method: 'POST',
    php: `<?php
$db = new SQLite3('/tmp/dvwa_xss_medium.db');
$db->exec('CREATE TABLE IF NOT EXISTS guestbook (name TEXT, comment TEXT)');
if (isset($_POST['name']) && isset($_POST['mtxMessage'])) {
    $name = $_POST['name'];
    $comment = strip_tags($_POST['mtxMessage']);
    $stmt = $db->prepare("INSERT INTO guestbook (name, comment) VALUES (:name, :comment)");
    $stmt->bindValue(':name', $name, SQLITE3_TEXT);
    $stmt->bindValue(':comment', $comment, SQLITE3_TEXT);
    $stmt->execute();
}
$result = $db->query("SELECT name, comment FROM guestbook ORDER BY rowid DESC LIMIT 10");
$entries = '';
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $entries .= '<div style="margin:6px 0;padding:8px;background:#16213e;border-radius:4px;border-left:3px solid #e94560">';
    $entries .= '<b>' . $row['name'] . '</b>: ' . htmlspecialchars($row['comment']);
    $entries .= '</div>';
}
$db->close();
echo $entries;
?>
<h3>Gastenboek</h3>
<form method="POST">
  <div style="margin:8px 0"><label>Naam:</label><br><input type="text" name="name" maxlength="10" placeholder="Jan" style="padding:6px;width:200px" /></div>
  <div style="margin:8px 0"><label>Bericht:</label><br><textarea name="mtxMessage" maxlength="50" rows="3" style="padding:6px;width:300px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px"></textarea></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Opslaan</button>
</form>`,
  },
  high: {
    title: 'XSS Stored — High',
    description: 'Beide velden gefilterd via preg_replace — maar onerror-handlers zijn nog mogelijk',
    method: 'POST',
    php: `<?php
$db = new SQLite3('/tmp/dvwa_xss_high.db');
$db->exec('CREATE TABLE IF NOT EXISTS guestbook (name TEXT, comment TEXT)');
if (isset($_POST['name']) && isset($_POST['mtxMessage'])) {
    $name = preg_replace('/<(.*)s(.*)c(.*)r(.*)i(.*)p(.*)t/i', '', $_POST['name']);
    $comment = preg_replace('/<(.*)s(.*)c(.*)r(.*)i(.*)p(.*)t/i', '', $_POST['mtxMessage']);
    $stmt = $db->prepare("INSERT INTO guestbook (name, comment) VALUES (:name, :comment)");
    $stmt->bindValue(':name', $name, SQLITE3_TEXT);
    $stmt->bindValue(':comment', $comment, SQLITE3_TEXT);
    $stmt->execute();
}
$result = $db->query("SELECT name, comment FROM guestbook ORDER BY rowid DESC LIMIT 10");
$entries = '';
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $entries .= '<div style="margin:6px 0;padding:8px;background:#16213e;border-radius:4px;border-left:3px solid #e94560">';
    $entries .= '<b>' . $row['name'] . '</b>: ' . $row['comment'];
    $entries .= '</div>';
}
$db->close();
echo $entries;
?>
<h3>Gastenboek</h3>
<form method="POST">
  <div style="margin:8px 0"><label>Naam:</label><br><input type="text" name="name" maxlength="10" placeholder="Jan" style="padding:6px;width:200px" /></div>
  <div style="margin:8px 0"><label>Bericht:</label><br><textarea name="mtxMessage" maxlength="50" rows="3" style="padding:6px;width:300px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px"></textarea></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Opslaan</button>
</form>`,
  },
  impossible: {
    title: 'XSS Stored — Impossible',
    description: 'Veilige implementatie: alle invoer geëncodeerd bij opslag en weergave',
    method: 'POST',
    php: `<?php
$db = new SQLite3('/tmp/dvwa_xss_imp.db');
$db->exec('CREATE TABLE IF NOT EXISTS guestbook (name TEXT, comment TEXT)');
if (isset($_POST['name']) && isset($_POST['mtxMessage'])) {
    $name = htmlspecialchars(strip_tags($_POST['name']), ENT_QUOTES, 'UTF-8');
    $comment = htmlspecialchars(strip_tags($_POST['mtxMessage']), ENT_QUOTES, 'UTF-8');
    $stmt = $db->prepare("INSERT INTO guestbook (name, comment) VALUES (:name, :comment)");
    $stmt->bindValue(':name', $name, SQLITE3_TEXT);
    $stmt->bindValue(':comment', $comment, SQLITE3_TEXT);
    $stmt->execute();
}
$result = $db->query("SELECT name, comment FROM guestbook ORDER BY rowid DESC LIMIT 10");
$entries = '';
while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
    $entries .= '<div style="margin:6px 0;padding:8px;background:#16213e;border-radius:4px;border-left:3px solid #27c93f">';
    $entries .= '<b>' . $row['name'] . '</b>: ' . $row['comment'];
    $entries .= '</div>';
}
$db->close();
echo $entries;
?>
<h3>Gastenboek</h3>
<form method="POST">
  <div style="margin:8px 0"><label>Naam:</label><br><input type="text" name="name" maxlength="10" placeholder="Jan" style="padding:6px;width:200px" /></div>
  <div style="margin:8px 0"><label>Bericht:</label><br><textarea name="mtxMessage" maxlength="50" rows="3" style="padding:6px;width:300px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px"></textarea></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Opslaan</button>
</form>
<p style="font-size:0.85em;color:#5f9eea">&#128737; Beveiligd: strip_tags + htmlspecialchars bij opslag én weergave.</p>`,
  },
};
