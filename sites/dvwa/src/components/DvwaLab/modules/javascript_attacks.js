export const javascriptAttacks = {
  low: {
    title: 'JavaScript Attacks — Low',
    description: 'Token wordt client-side gegenereerd via JavaScript — eenvoudig te manipuleren',
    method: 'POST',
    php: `<?php
$message = '';
$success = false;
if (isset($_POST['token']) && isset($_POST['phrase'])) {
    $phrase = $_POST['phrase'];
    $token = $_POST['token'];
    $expected = strrev($phrase);
    if ($token === $expected && $phrase === 'success') {
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Gefeliciteerd! Correct token ingevoerd.</div>';
        $success = true;
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Ongeldig token of woord.</div>';
    }
}
echo $message;
?>
<h3>JavaScript Token Aanval</h3>
<p>Voer het woord "success" in. Het token wordt automatisch berekend door JavaScript.</p>
<form method="POST" id="js-form">
  <div style="margin:8px 0"><label>Woord:</label><br><input type="text" id="phrase" name="phrase" value="ChangeMe" style="padding:6px;width:200px" /></div>
  <input type="hidden" id="token" name="token" value="" />
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Submit</button>
</form>
<script>
  document.getElementById('js-form').addEventListener('submit', function() {
    var phrase = document.getElementById('phrase').value;
    document.getElementById('token').value = phrase.split('').reverse().join('');
  });
</script>`,
  },
  medium: {
    title: 'JavaScript Attacks — Medium',
    description: 'Token is ROT13-gecodeerd — obfuscatie maar geen echte beveiliging',
    method: 'POST',
    php: `<?php
$message = '';
if (isset($_POST['token']) && isset($_POST['phrase'])) {
    $phrase = $_POST['phrase'];
    $token = $_POST['token'];
    $expected = str_rot13($phrase);
    if ($token === $expected && $phrase === 'success') {
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Correct! Token gevalideerd.</div>';
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Ongeldig token. (Verwacht: ROT13 van het woord)</div>';
    }
}
echo $message;
?>
<h3>JavaScript Token — ROT13</h3>
<p>Het token is ROT13-gecodeerd. Voer het correcte woord in.</p>
<form method="POST" id="js-form-med">
  <div style="margin:8px 0"><label>Woord:</label><br><input type="text" id="phrase-med" name="phrase" value="ChangeMe" style="padding:6px;width:200px" /></div>
  <input type="hidden" id="token-med" name="token" value="" />
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Submit</button>
</form>
<script>
  function rot13(str) {
    return str.replace(/[a-zA-Z]/g, function(c) {
      return String.fromCharCode(
        c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13)
      );
    });
  }
  document.getElementById('js-form-med').addEventListener('submit', function() {
    var phrase = document.getElementById('phrase-med').value;
    document.getElementById('token-med').value = rot13(phrase);
  });
</script>`,
  },
  high: {
    title: 'JavaScript Attacks — High',
    description: 'SHA-256 hash van een samengesteld token — sterker maar server-side validatie ontbreekt',
    method: 'POST',
    php: `<?php
$message = '';
if (isset($_POST['token']) && isset($_POST['phrase'])) {
    $phrase = $_POST['phrase'];
    $token = $_POST['token'];
    $expected = hash('sha256', 'XX' . strtoupper($phrase) . 'XX');
    if ($token === $expected && $phrase === 'success') {
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Correct! SHA-256 token gevalideerd.</div>';
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Ongeldig token.</div>';
    }
}
echo $message;
?>
<h3>JavaScript Token — SHA-256</h3>
<p>Token is SHA-256("XX" + woord.toUpperCase() + "XX").</p>
<form method="POST" id="js-form-high">
  <div style="margin:8px 0"><label>Woord:</label><br><input type="text" id="phrase-high" name="phrase" value="ChangeMe" style="padding:6px;width:200px" /></div>
  <input type="hidden" id="token-high" name="token" value="" />
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Submit</button>
</form>
<script>
  async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  document.getElementById('js-form-high').addEventListener('submit', async function(e) {
    e.preventDefault();
    var phrase = document.getElementById('phrase-high').value;
    var token = await sha256('XX' + phrase.toUpperCase() + 'XX');
    document.getElementById('token-high').value = token;
    this.submit();
  });
</script>`,
  },
  impossible: {
    title: 'JavaScript Attacks — Impossible',
    description: 'Server-side token generatie en validatie — client-side code kan niet worden vertrouwd',
    method: 'POST',
    php: `<?php
$secret = 'dvwa_server_secret_2024';
$token = hash_hmac('sha256', 'success', $secret);
$message = '';
if (isset($_POST['token']) && isset($_POST['phrase'])) {
    $phrase = $_POST['phrase'];
    $submitted_token = $_POST['token'];
    $expected = hash_hmac('sha256', $phrase, $secret);
    if (hash_equals($expected, $submitted_token) && $phrase === 'success') {
        $message = '<div style="color:#27c93f;padding:10px;border:1px solid #27c93f;border-radius:4px;margin:10px 0">Correct! HMAC-token server-side gevalideerd.</div>';
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Ongeldig token — de geheime sleutel is server-side.</div>';
    }
}
echo $message;
?>
<h3>JavaScript Token — Server-side HMAC</h3>
<p>Token wordt server-side gegenereerd via HMAC-SHA256 met een geheime sleutel.</p>
<form method="POST">
  <div style="margin:8px 0"><label>Woord:</label><br><input type="text" name="phrase" value="success" style="padding:6px;width:200px" /></div>
  <div style="margin:8px 0"><label>Token (server-side):</label><br><input type="text" name="token" value="<?php echo $token; ?>" style="padding:6px;width:400px;font-family:monospace;font-size:0.85em" readonly /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer;margin-top:8px">Submit</button>
</form>
<p style="font-size:0.85em;color:#5f9eea">&#128737; Beveiligd: HMAC-token met server-side geheime sleutel. Client-side manipulatie is onmogelijk zonder de sleutel.</p>`,
  },
};
