export const commandInjection = {
  low: {
    title: 'Command Injection — Low',
    description: 'Geen invoervalidatie — shell_exec() zonder filter',
    method: 'POST',
    php: `<?php
function fake_shell_exec($cmd) {
    $output = '';
    // Split on ; && || |
    $parts = preg_split('/([;]|[&]{2}|[|]{2}|[|])/', $cmd, -1, PREG_SPLIT_DELIM_CAPTURE);
    $commands = array();
    $operator = null;

    foreach ($parts as $part) {
        $part = trim($part);
        if ($part === ';' || $part === '&&' || $part === '||' || $part === '|') {
            $operator = $part;
            continue;
        }
        if (empty($part)) continue;

        // Simulate each command
        $result = simulate_command($part);
        $output .= $result . "\\n";
    }
    return $output;
}

function simulate_command($cmd) {
    $cmd = trim($cmd);
    if (strpos($cmd, 'ping') === 0) {
        $host = trim(str_replace(array('ping', '-c', '4', '3', '2', '1'), '', $cmd));
        if (empty($host)) $host = '127.0.0.1';
        return "PING $host: 64 bytes, icmp_seq=1 ttl=64 time=0.5ms\\n64 bytes from $host: icmp_seq=2 ttl=64 time=0.4ms";
    }
    if ($cmd === 'whoami') return 'www-data';
    if ($cmd === 'id') return 'uid=33(www-data) gid=33(www-data) groups=33(www-data)';
    if ($cmd === 'ls') return 'config\\nindex.php\\nlogin.php\\n.htaccess';
    if ($cmd === 'pwd') return '/var/www/html';
    if ($cmd === 'cat /etc/passwd') return 'root:x:0:0:root:/root:/bin/bash\\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\\nstudent:x:1000:1000::/home/student:/bin/bash';
    if ($cmd === 'uname -a') return 'Linux dvwa-lab 5.15.0 #1 SMP x86_64 GNU/Linux';
    if ($cmd === 'hostname') return 'dvwa-lab';
    return "bash: " . explode(' ', $cmd)[0] . ": command not found";
}

$message = '';
if (isset($_POST['ip'])) {
    $target = $_POST['ip'];
    $output = fake_shell_exec('ping -c 4 ' . $target);
    $message = '<pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:4px;overflow-x:auto">' . htmlspecialchars($output) . '</pre>';
}
echo $message;
?>
<h3>Ping een IP-adres</h3>
<form method="POST">
  <div style="margin:8px 0"><label>IP-adres:</label><br><input type="text" name="ip" placeholder="127.0.0.1" style="padding:6px;width:250px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer">Submit</button>
</form>`,
  },
  medium: {
    title: 'Command Injection — Medium',
    description: '&& en ; worden gefilterd',
    method: 'POST',
    php: `<?php
function fake_shell_exec($cmd) {
    $parts = preg_split('/([;]|[&]{2}|[|]{2}|[|])/', $cmd, -1, PREG_SPLIT_DELIM_CAPTURE);
    $output = '';
    foreach ($parts as $part) {
        $part = trim($part);
        if ($part === ';' || $part === '&&' || $part === '||' || $part === '|') continue;
        if (empty($part)) continue;
        $output .= simulate_command($part) . "\\n";
    }
    return $output;
}

function simulate_command($cmd) {
    $cmd = trim($cmd);
    if (strpos($cmd, 'ping') === 0) {
        $host = trim(str_replace(array('ping', '-c', '4'), '', $cmd));
        if (empty($host)) $host = '127.0.0.1';
        return "PING $host: 64 bytes, icmp_seq=1 ttl=64 time=0.5ms";
    }
    if ($cmd === 'whoami') return 'www-data';
    if ($cmd === 'id') return 'uid=33(www-data) gid=33(www-data)';
    if ($cmd === 'ls') return 'config  index.php  login.php';
    if ($cmd === 'cat /etc/passwd') return 'root:x:0:0::/root:/bin/bash\\nwww-data:x:33:33::/var/www:/usr/sbin/nologin';
    return "bash: " . explode(' ', $cmd)[0] . ": command not found";
}

$message = '';
if (isset($_POST['ip'])) {
    $target = $_POST['ip'];
    // MEDIUM: filter && and ;
    $target = str_replace('&&', '', $target);
    $target = str_replace(';', '', $target);
    $output = fake_shell_exec('ping -c 4 ' . $target);
    $message = '<pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:4px">' . htmlspecialchars($output) . '</pre>';
    $message .= '<p style="font-size:0.85em;color:#888">Gefilterde tekens: <code>&&</code> <code>;</code></p>';
}
echo $message;
?>
<h3>Ping een IP-adres</h3>
<form method="POST">
  <div style="margin:8px 0"><label>IP-adres:</label><br><input type="text" name="ip" placeholder="127.0.0.1" style="padding:6px;width:250px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer">Submit</button>
</form>`,
  },
  high: {
    title: 'Command Injection — High',
    description: 'Bijna alle operators gefilterd — maar er zit een fout in',
    method: 'POST',
    php: `<?php
function fake_shell_exec($cmd) {
    $parts = preg_split('/([;]|[&]{2}|[|]{2}|[|])/', $cmd, -1, PREG_SPLIT_DELIM_CAPTURE);
    $output = '';
    foreach ($parts as $part) {
        $part = trim($part);
        if (in_array($part, array(';','&&','||','|'))) continue;
        if (empty($part)) continue;
        $output .= simulate_command($part) . "\\n";
    }
    return $output;
}

function simulate_command($cmd) {
    $cmd = trim($cmd);
    if (strpos($cmd, 'ping') === 0) {
        $host = trim(str_replace(array('ping', '-c', '4'), '', $cmd));
        if (empty($host)) $host = '127.0.0.1';
        return "PING $host: 64 bytes, icmp_seq=1 ttl=64 time=0.5ms";
    }
    if ($cmd === 'whoami') return 'www-data';
    if ($cmd === 'id') return 'uid=33(www-data) gid=33(www-data)';
    if ($cmd === 'ls') return 'config  index.php  login.php';
    if ($cmd === 'cat /etc/passwd') return 'root:x:0:0::/root:/bin/bash\\nwww-data:x:33:33::/var/www:/usr/sbin/nologin';
    return "bash: " . explode(' ', $cmd)[0] . ": command not found";
}

$message = '';
if (isset($_POST['ip'])) {
    $target = $_POST['ip'];
    // HIGH: extensive filtering — note the deliberate bug: "| " (pipe-space) not "|" (pipe)
    $target = str_replace('&&', '', $target);
    $target = str_replace(';', '', $target);
    $target = str_replace('|| ', '', $target);
    $target = str_replace('| ', '', $target);  // Bug: only filters "| " not "|"
    $output = fake_shell_exec('ping -c 4 ' . $target);
    $message = '<pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:4px">' . htmlspecialchars($output) . '</pre>';
    $message .= '<p style="font-size:0.85em;color:#888">Gefilterde tekens: <code>&&</code> <code>;</code> <code>|| </code> <code>| </code></p>';
}
echo $message;
?>
<h3>Ping een IP-adres</h3>
<form method="POST">
  <div style="margin:8px 0"><label>IP-adres:</label><br><input type="text" name="ip" placeholder="127.0.0.1" style="padding:6px;width:250px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer">Submit</button>
</form>`,
  },
  impossible: {
    title: 'Command Injection — Impossible',
    description: 'Veilige implementatie: strikte IPv4-validatie via regex allowlist',
    method: 'POST',
    php: `<?php
$message = '';
if (isset($_POST['ip'])) {
    $target = $_POST['ip'];

    // IMPOSSIBLE: strict allowlist — only valid IPv4 addresses
    $parts = explode('.', $target);
    $valid = true;
    if (count($parts) !== 4) {
        $valid = false;
    } else {
        foreach ($parts as $octet) {
            if (!is_numeric($octet) || intval($octet) < 0 || intval($octet) > 255) {
                $valid = false;
                break;
            }
        }
    }

    if ($valid) {
        // Safe to execute — input is guaranteed to be a valid IPv4 address
        $output = "PING $target: 64 bytes, icmp_seq=1 ttl=64 time=0.5ms\\n64 bytes from $target: icmp_seq=2 ttl=64 time=0.4ms";
        $message = '<pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:4px">' . $output . '</pre>';
    } else {
        $message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Ongeldig IP-adres. Alleen geldige IPv4-adressen zijn toegestaan (bijv. 127.0.0.1).</div>';
    }
    $message .= '<p style="font-size:0.85em;color:#5f9eea">&#128737; Beveiliging: invoer wordt gevalideerd als geldig IPv4-adres. Geen command chaining mogelijk.</p>';
}
echo $message;
?>
<h3>Ping een IP-adres</h3>
<form method="POST">
  <div style="margin:8px 0"><label>IP-adres:</label><br><input type="text" name="ip" placeholder="127.0.0.1" style="padding:6px;width:250px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer">Submit</button>
</form>`,
  },
};
