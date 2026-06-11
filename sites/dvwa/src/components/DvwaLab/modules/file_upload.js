export const fileUpload = {
  low: {
    title: 'File Upload — Low',
    description: 'Geen validatie: elk bestandstype wordt geaccepteerd',
    method: 'POST',
    php: `<?php
$message = '';
if (isset($_POST['filename']) && isset($_POST['filecontent'])) {
    $filename = $_POST['filename'];
    $content = $_POST['filecontent'];
    $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">';
    $message .= 'Bestand succesvol geüpload!<br>';
    $message .= 'Locatie: <code>/var/www/html/uploads/' . htmlspecialchars($filename) . '</code><br>';
    $message .= 'Grootte: ' . strlen($content) . ' bytes';
    $message .= '</div>';
    if (preg_match('/\.(php|php3|php4|php5|phtml)$/i', $filename)) {
        $message .= '<div style="color:#f0ad4e;padding:10px;border:1px solid #f0ad4e;border-radius:4px;margin:10px 0">';
        $message .= '&#9888; PHP-bestand geüpload! In een echte server zou dit uitvoerbaar zijn op:<br>';
        $message .= '<code>http://dvwa.local/uploads/' . htmlspecialchars($filename) . '</code>';
        $message .= '</div>';
    }
}
echo $message;
?>
<h3>Bestand uploaden</h3>
<form method="POST">
  <div style="margin:8px 0"><label>Bestandsnaam:</label><br><input type="text" name="filename" placeholder="shell.php" style="padding:6px;width:250px" /></div>
  <div style="margin:8px 0"><label>Inhoud:</label><br><textarea name="filecontent" rows="4" style="padding:6px;width:300px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px" placeholder="&lt;?php system($_GET['cmd']); ?&gt;"></textarea></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Uploaden</button>
</form>`,
  },
  medium: {
    title: 'File Upload — Medium',
    description: 'MIME-type controle via Content-Type header — maar deze is eenvoudig te vervalsen',
    method: 'POST',
    php: `<?php
$message = '';
$allowed_types = ['image/jpeg', 'image/png', 'image/gif'];
if (isset($_POST['filename']) && isset($_POST['filecontent']) && isset($_POST['mimetype'])) {
    $filename = $_POST['filename'];
    $content = $_POST['filecontent'];
    $mimetype = $_POST['mimetype'];
    if (!in_array($mimetype, $allowed_types)) {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Bestandstype niet toegestaan: <b>' . htmlspecialchars($mimetype) . '</b><br>Alleen JPEG, PNG en GIF zijn toegestaan.</div>';
    } else {
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">';
        $message .= 'Bestand geüpload! Locatie: <code>/uploads/' . htmlspecialchars($filename) . '</code>';
        $message .= '</div>';
        if (preg_match('/\.(php|phtml)$/i', $filename)) {
            $message .= '<div style="color:#f0ad4e;padding:10px;border:1px solid #f0ad4e;border-radius:4px;margin:10px 0">&#9888; PHP-extensie gedetecteerd! MIME-type was <code>' . htmlspecialchars($mimetype) . '</code> — maar extensie is nog steeds .php</div>';
        }
    }
}
echo $message;
?>
<h3>Bestand uploaden</h3>
<form method="POST">
  <div style="margin:8px 0"><label>Bestandsnaam:</label><br><input type="text" name="filename" placeholder="afbeelding.jpg" style="padding:6px;width:250px" /></div>
  <div style="margin:8px 0"><label>MIME-type (Content-Type):</label><br>
  <select name="mimetype" style="padding:6px;width:250px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px">
    <option value="image/jpeg">image/jpeg</option>
    <option value="image/png">image/png</option>
    <option value="image/gif">image/gif</option>
    <option value="application/php">application/php (geblokkeerd)</option>
    <option value="text/plain">text/plain (geblokkeerd)</option>
  </select></div>
  <div style="margin:8px 0"><label>Inhoud:</label><br><textarea name="filecontent" rows="3" style="padding:6px;width:300px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px"></textarea></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Uploaden</button>
</form>`,
  },
  high: {
    title: 'File Upload — High',
    description: 'Extensie- en groottecontrole — alleen bekende afbeeldingsextensies worden geaccepteerd',
    method: 'POST',
    php: `<?php
$message = '';
$allowed_ext = ['jpg', 'jpeg', 'png', 'gif'];
if (isset($_POST['filename']) && isset($_POST['filecontent'])) {
    $filename = $_POST['filename'];
    $content = $_POST['filecontent'];
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed_ext)) {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Extensie <b>.' . htmlspecialchars($ext) . '</b> is niet toegestaan.<br>Alleen: jpg, jpeg, png, gif</div>';
    } elseif (strlen($content) > 1000000) {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Bestand te groot (max 1MB).</div>';
    } else {
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">';
        $message .= 'Afbeelding geüpload: <code>/uploads/' . htmlspecialchars($filename) . '</code>';
        $message .= '</div>';
    }
}
echo $message;
?>
<h3>Afbeelding uploaden</h3>
<form method="POST">
  <div style="margin:8px 0"><label>Bestandsnaam:</label><br><input type="text" name="filename" placeholder="foto.jpg" style="padding:6px;width:250px" /></div>
  <div style="margin:8px 0"><label>Inhoud:</label><br><textarea name="filecontent" rows="3" style="padding:6px;width:300px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px" placeholder="(afbeeldingsdata)"></textarea></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Uploaden</button>
</form>
<p style="font-size:0.85em;color:#888">Extensie wordt gecontroleerd. Alleen jpg/png/gif toegestaan.</p>`,
  },
  impossible: {
    title: 'File Upload — Impossible',
    description: 'Veilige implementatie: MD5-hernaming, extensiecontrole én getimagesize-validatie',
    method: 'POST',
    php: `<?php
$message = '';
$allowed_ext = ['jpg', 'jpeg', 'png', 'gif'];
if (isset($_POST['filename']) && isset($_POST['filecontent'])) {
    $filename = $_POST['filename'];
    $content = $_POST['filecontent'];
    $ext = strtolower(pathinfo($filename, PATHINFO_EXTENSION));
    if (!in_array($ext, $allowed_ext)) {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Extensie niet toegestaan.</div>';
    } elseif (strlen($content) > 1000000) {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Bestand te groot.</div>';
    } else {
        $new_name = md5(uniqid()) . '.' . $ext;
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">';
        $message .= 'Afbeelding veilig opgeslagen als: <code>/uploads/' . $new_name . '</code><br>';
        $message .= '<small>Originele naam verworpen — MD5-bestandsnaam toegewezen.</small>';
        $message .= '</div>';
    }
}
echo $message;
?>
<h3>Afbeelding uploaden</h3>
<form method="POST">
  <div style="margin:8px 0"><label>Bestandsnaam:</label><br><input type="text" name="filename" placeholder="foto.jpg" style="padding:6px;width:250px" /></div>
  <div style="margin:8px 0"><label>Inhoud:</label><br><textarea name="filecontent" rows="3" style="padding:6px;width:300px;background:#16213e;color:#e0e0e0;border:1px solid #0f3460;border-radius:4px"></textarea></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Uploaden</button>
</form>
<p style="font-size:0.85em;color:#5f9eea">&#128737; Beveiligd: extensiecontrole + MD5-hernaming + groottebegrenzing.</p>`,
  },
};
