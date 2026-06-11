export const fileInclusion = {
  low: {
    title: 'File Inclusion — Low',
    description: 'Geen validatie: elke bestandsnaam wordt direct geïnclude',
    method: 'GET',
    php: `<?php
$files = [
    'file1.php' => '<h4>Bestand 1</h4><p>Dit is de inhoud van bestand 1. Normale paginacontent.</p>',
    'file2.php' => '<h4>Bestand 2</h4><p>Dit is de inhoud van bestand 2. Meer paginacontent.</p>',
    'file3.php' => '<h4>Bestand 3</h4><p>Dit is de inhoud van bestand 3. Nog meer content.</p>',
    '../passwords.txt' => '<pre>admin:password123\nuser:letmein\nroot:toor</pre>',
    '../../etc/passwd' => '<pre>root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33::/var/www:/usr/sbin/nologin\nstudent:x:1000:1000::/home/student:/bin/bash</pre>',
];
$message = '';
if (isset($_GET['page'])) {
    $page = $_GET['page'];
    if (isset($files[$page])) {
        $message = '<div style="padding:10px;background:#16213e;border-radius:4px;margin:10px 0"><b>Inhoud van: ' . htmlspecialchars($page) . '</b><br>' . $files[$page] . '</div>';
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Bestand niet gevonden: ' . htmlspecialchars($page) . '</div>';
    }
}
echo $message;
?>
<h3>Bestandsweergave</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Bestand:</label><br><input type="text" name="page" placeholder="file1.php" style="padding:6px;width:250px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Openen</button>
</form>`,
  },
  medium: {
    title: 'File Inclusion — Medium',
    description: '../ en http:// worden gefilterd maar andere omwegen zijn mogelijk',
    method: 'GET',
    php: `<?php
$files = [
    'file1.php' => '<h4>Bestand 1</h4><p>Normale content van bestand 1.</p>',
    'file2.php' => '<h4>Bestand 2</h4><p>Normale content van bestand 2.</p>',
    'file3.php' => '<h4>Bestand 3</h4><p>Normale content van bestand 3.</p>',
    '....//passwords.txt' => '<pre>admin:password123\nuser:letmein</pre>',
];
$message = '';
if (isset($_GET['page'])) {
    $page = str_replace(array('../', 'http://', 'https://'), '', $_GET['page']);
    if (isset($files[$_GET['page']])) {
        $message = '<div style="padding:10px;background:#16213e;border-radius:4px;margin:10px 0"><b>' . htmlspecialchars($page) . '</b><br>' . $files[$_GET['page']] . '</div>';
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Bestand niet gevonden (na filter: <code>' . htmlspecialchars($page) . '</code>)</div>';
    }
}
echo $message;
?>
<h3>Bestandsweergave</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Bestand:</label><br><input type="text" name="page" placeholder="file1.php" style="padding:6px;width:250px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Openen</button>
</form>`,
  },
  high: {
    title: 'File Inclusion — High',
    description: 'Bestandsnaam moet beginnen met "file" — maar null-byte en andere tricks werken soms',
    method: 'GET',
    php: `<?php
$files = [
    'file1.php' => '<h4>Bestand 1</h4><p>Normale content van bestand 1.</p>',
    'file2.php' => '<h4>Bestand 2</h4><p>Normale content van bestand 2.</p>',
    'file3.php' => '<h4>Bestand 3</h4><p>Normale content van bestand 3.</p>',
];
$message = '';
if (isset($_GET['page'])) {
    $page = $_GET['page'];
    if (!fnmatch('file*', $page)) {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Toegang geweigerd: bestandsnaam moet beginnen met "file".</div>';
    } elseif (isset($files[$page])) {
        $message = '<div style="padding:10px;background:#16213e;border-radius:4px;margin:10px 0"><b>' . htmlspecialchars($page) . '</b><br>' . $files[$page] . '</div>';
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Bestand niet gevonden.</div>';
    }
}
echo $message;
?>
<h3>Bestandsweergave</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Bestand:</label><br><input type="text" name="page" placeholder="file1.php" style="padding:6px;width:250px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Openen</button>
</form>
<p style="font-size:0.85em;color:#888">Bestandsnaam moet beginnen met "file". Probeer <code>file1.php</code>, <code>file2.php</code>, <code>file3.php</code>.</p>`,
  },
  impossible: {
    title: 'File Inclusion — Impossible',
    description: 'Veilige implementatie: strikte whitelist van toegestane bestanden',
    method: 'GET',
    php: `<?php
$allowed = ['file1.php', 'file2.php', 'file3.php'];
$files = [
    'file1.php' => '<h4>Bestand 1</h4><p>Normale content van bestand 1.</p>',
    'file2.php' => '<h4>Bestand 2</h4><p>Normale content van bestand 2.</p>',
    'file3.php' => '<h4>Bestand 3</h4><p>Normale content van bestand 3.</p>',
];
$message = '';
if (isset($_GET['page'])) {
    $page = $_GET['page'];
    if (!in_array($page, $allowed)) {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Toegang geweigerd: bestand staat niet op de whitelist.</div>';
    } else {
        $message = '<div style="padding:10px;background:#16213e;border-radius:4px;margin:10px 0"><b>' . htmlspecialchars($page) . '</b><br>' . $files[$page] . '</div>';
    }
}
echo $message;
?>
<h3>Bestandsweergave</h3>
<form method="GET">
  <div style="margin:8px 0"><label>Bestand:</label><br>
  <select name="page" style="padding:6px;width:200px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px">
    <option value="file1.php">file1.php</option>
    <option value="file2.php">file2.php</option>
    <option value="file3.php">file3.php</option>
  </select></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Openen</button>
</form>
<p style="font-size:0.85em;color:#5f9eea">&#128737; Beveiligd: strikte whitelist — alleen bekende bestanden zijn toegankelijk.</p>`,
  },
};
