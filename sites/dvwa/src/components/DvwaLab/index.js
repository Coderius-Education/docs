import React, { useState, useEffect, useRef, useCallback } from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';
import CodeBlock from '@theme/CodeBlock';
import styles from './styles.module.css';
import { bruteForce } from './modules/brute_force';
import { commandInjection } from './modules/command_injection';
import { authorizationBypass } from './modules/authorization_bypass';
import { sqlInjection } from './modules/sql_injection';
import { sqlInjectionBlind } from './modules/sql_injection_blind';
import { xssReflected } from './modules/xss_reflected';
import { xssStored } from './modules/xss_stored';
import { xssDom } from './modules/xss_dom';
import { csrf } from './modules/csrf';
import { fileInclusion } from './modules/file_inclusion';
import { fileUpload } from './modules/file_upload';
import { weakSessionIds } from './modules/weak_session_ids';
import { cspBypass } from './modules/csp_bypass';
import { javascriptAttacks } from './modules/javascript_attacks';
import { runPhp } from './PhpWasmProvider';

const modules = {
  brute_force: bruteForce,
  command_injection: commandInjection,
  authorization_bypass: authorizationBypass,
  sql_injection: sqlInjection,
  sql_injection_blind: sqlInjectionBlind,
  xss_reflected: xssReflected,
  xss_stored: xssStored,
  xss_dom: xssDom,
  csrf: csrf,
  file_inclusion: fileInclusion,
  file_upload: fileUpload,
  weak_session_ids: weakSessionIds,
  csp_bypass: cspBypass,
  javascript_attacks: javascriptAttacks,
};

/**
 * Simulate shell commands in JavaScript (for command injection only).
 * Command injection needs OS-level commands that php-wasm cannot provide,
 * so we keep the JS simulation for this module.
 */
function simulateShellExec(cmd) {
  const parts = cmd.split(/([;]|&&|\|\||\|)/);
  let output = '';
  for (const part of parts) {
    const trimmed = part.trim();
    if ([';', '&&', '||', '|'].includes(trimmed)) continue;
    if (!trimmed) continue;
    output += simulateCommand(trimmed) + '\n';
  }
  return output;
}

function simulateCommand(cmd) {
  const trimmed = cmd.trim();
  if (trimmed.startsWith('ping')) {
    const host = trimmed.replace(/ping\s*(-c\s*\d+\s*)?/, '').trim() || '127.0.0.1';
    return `PING ${host}: 64 bytes, icmp_seq=1 ttl=64 time=0.5ms\n64 bytes from ${host}: icmp_seq=2 ttl=64 time=0.4ms`;
  }
  if (trimmed === 'whoami') return 'www-data';
  if (trimmed === 'id') return 'uid=33(www-data) gid=33(www-data) groups=33(www-data)';
  if (trimmed === 'ls') return 'config\nindex.php\nlogin.php\n.htaccess';
  if (trimmed === 'pwd') return '/var/www/html';
  if (trimmed === 'cat /etc/passwd') return 'root:x:0:0:root:/root:/bin/bash\nwww-data:x:33:33:www-data:/var/www:/usr/sbin/nologin\nstudent:x:1000:1000::/home/student:/bin/bash';
  if (trimmed === 'uname -a') return 'Linux dvwa-lab 5.15.0 #1 SMP x86_64 GNU/Linux';
  if (trimmed === 'hostname') return 'dvwa-lab';
  const firstWord = trimmed.split(' ')[0];
  return `bash: ${firstWord}: command not found`;
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Run command injection simulation in JS (shell commands cannot run in php-wasm).
 */
function simulateCommandInjection(level, formData) {
  let message = '';
  const ip = formData.ip || '';

  if (ip) {
    let target = ip;
    if (level === 'medium') {
      target = target.replace(/&&/g, '');
      target = target.replace(/;/g, '');
    } else if (level === 'high') {
      target = target.replace(/&&/g, '');
      target = target.replace(/;/g, '');
      target = target.replace(/\|\| /g, '');
      target = target.replace(/\| /g, '');
    } else if (level === 'impossible') {
      // Strict IPv4 allowlist
      if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(target.trim())) {
        message = '<div style="color:#ff5f56;padding:10px;border:1px solid #ff5f56;border-radius:4px;margin:10px 0">Ongeldig IP-adres. Alleen IPv4-adressen (bijv. 127.0.0.1) zijn toegestaan.</div>';
        return message + commandInjectionForm(level);
      }
    }

    const fullCmd = 'ping -c 4 ' + target;
    const output = simulateShellExec(fullCmd);
    message = `<pre style="background:#1e1e1e;color:#d4d4d4;padding:12px;border-radius:4px;overflow-x:auto">${escapeHtml(output)}</pre>`;

    if (level === 'medium') {
      message += '<p style="font-size:0.85em;color:#888">Gefilterde tekens: <code>&&</code> <code>;</code></p>';
    } else if (level === 'high') {
      message += '<p style="font-size:0.85em;color:#888">Gefilterde tekens: <code>&&</code> <code>;</code> <code>|| </code> <code>| </code></p>';
    } else if (level === 'impossible') {
      message += '<p style="font-size:0.85em;color:#888">Beveiliging: strikte IPv4-validatie via regex.</p>';
    }
  }

  return message + commandInjectionForm(level);
}

function commandInjectionForm(level) {
  return `
<h3>Ping een IP-adres</h3>
<form method="POST">
  <div style="margin:8px 0"><label>IP-adres:</label><br><input type="text" name="ip" placeholder="127.0.0.1" style="padding:6px;width:250px" /></div>
  <button type="submit" style="padding:8px 20px;cursor:pointer">Submit</button>
</form>`;
}

function getLevelColor(level) {
  switch (level) {
    case 'low': return 'levelLow';
    case 'medium': return 'levelMedium';
    case 'high': return 'levelHigh';
    case 'impossible': return 'levelImpossible';
    default: return 'levelLow';
  }
}

function DvwaLabInner({ module: moduleName, level, title }) {
  const [isStarted, setIsStarted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [htmlOutput, setHtmlOutput] = useState('');
  const [showSource, setShowSource] = useState(false);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState('Lab wordt geladen...');
  const iframeRef = useRef(null);

  const config = modules[moduleName]?.[level];

  const executePhp = useCallback(async (formData = {}) => {
    if (!config) return;

    // Command injection uses JS simulation (shell commands don't work in php-wasm)
    if (moduleName === 'command_injection') {
      const output = simulateCommandInjection(level, formData);
      setHtmlOutput(output);
      setError(null);
      return;
    }

    try {
      const getData = config.method === 'GET' ? formData : {};
      const postData = config.method === 'POST' ? formData : {};
      const output = await runPhp(config.php, getData, postData);
      setHtmlOutput(output);
      setError(null);
    } catch (err) {
      setError('Fout bij PHP-uitvoering: ' + err.message);
    }
  }, [config, moduleName, level]);

  const handleStart = useCallback(async () => {
    setIsStarted(true);
    setIsLoading(true);

    if (moduleName !== 'command_injection') {
      setLoadingMessage('PHP WASM wordt geladen (eerste keer kan even duren)...');
    }

    try {
      await executePhp({});
    } catch (err) {
      setError('Fout bij starten: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  }, [executePhp, moduleName]);

  useEffect(() => {
    function handleMessage(event) {
      if (event.data && event.data.type === 'dvwa-form') {
        const formData = event.data.data || {};

        // For medium brute force, add a simulated delay
        if (moduleName === 'brute_force' && level === 'medium') {
          setIsLoading(true);
          setLoadingMessage('Verwerken (2 sec vertraging)...');
          setTimeout(async () => {
            await executePhp(formData);
            setIsLoading(false);
          }, 2000);
          return;
        }

        setIsLoading(true);
        setLoadingMessage('Verwerken...');
        executePhp(formData).finally(() => setIsLoading(false));
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [executePhp, moduleName, level]);

  if (!config) {
    return (
      <div className={styles.lab}>
        <div className={styles.header}>
          <span className={styles.title}>Module niet gevonden: {moduleName}/{level}</span>
        </div>
      </div>
    );
  }

  const displayTitle = title || config.title;

  const iframeSrcDoc = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    margin: 0;
    padding: 16px;
    background: #1a1a2e;
    color: #e0e0e0;
    font-size: 14px;
  }
  h3 { color: #fff; margin-top: 0; }
  h4 { color: #fff; }
  input[type="text"], input[type="password"] {
    background: #16213e;
    color: #e0e0e0;
    border: 1px solid #0f3460;
    border-radius: 4px;
    padding: 6px;
    font-size: 14px;
  }
  input[type="text"]:focus, input[type="password"]:focus {
    outline: none;
    border-color: #e94560;
  }
  button[type="submit"] {
    background: #e94560;
    color: #fff;
    border: none;
    border-radius: 4px;
    padding: 8px 20px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
  }
  button[type="submit"]:hover {
    background: #c73e54;
  }
  label { color: #b0b0b0; font-size: 0.9em; }
  code {
    background: #16213e;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 0.9em;
  }
  pre {
    background: #1e1e1e;
    color: #d4d4d4;
    padding: 12px;
    border-radius: 4px;
    overflow-x: auto;
    white-space: pre-wrap;
    word-wrap: break-word;
  }
  a { color: #e94560; }
  table { border-collapse: collapse; width: 100%; margin: 10px 0; }
  th, td { border: 1px solid #333; padding: 8px; text-align: left; }
  th { background: #16213e; }
</style>
</head>
<body>
${htmlOutput}
<script>
  document.addEventListener('submit', function(e) {
    e.preventDefault();
    var fd = new FormData(e.target);
    var data = {};
    fd.forEach(function(value, key) { data[key] = value; });
    window.parent.postMessage({
      type: 'dvwa-form',
      method: (e.target.method || 'GET').toUpperCase(),
      data: data
    }, '*');
  });
</script>
</body>
</html>`;

  return (
    <div className={styles.lab}>
      <div className={styles.header}>
        <span className={styles.title}>{displayTitle}</span>
        <span className={`${styles.levelBadge} ${styles[getLevelColor(level)]}`}>
          {level.toUpperCase()}
        </span>
        {isStarted && (
          <button
            className={styles.sourceToggle}
            onClick={() => setShowSource(!showSource)}
          >
            {showSource ? 'Verberg broncode' : 'Bekijk broncode'}
          </button>
        )}
      </div>

      {!isStarted && (
        <div className={styles.startContainer}>
          <p className={styles.description}>{config.description}</p>
          <button className={styles.startButton} onClick={handleStart}>
            Start Lab
          </button>
        </div>
      )}

      {isStarted && isLoading && (
        <div className={styles.loading}>
          <div className={styles.spinner}></div>
          <p>{loadingMessage}</p>
        </div>
      )}

      {error && (
        <div className={styles.error}>
          <p>{error}</p>
        </div>
      )}

      {isStarted && !isLoading && showSource && (
        <div className={styles.sourceCode}>
          <CodeBlock language="php" showLineNumbers>{config.php}</CodeBlock>
        </div>
      )}

      {isStarted && !isLoading && htmlOutput && (
        <iframe
          ref={iframeRef}
          className={styles.iframe}
          srcDoc={iframeSrcDoc}
          sandbox="allow-scripts allow-forms"
          title={displayTitle}
        />
      )}
    </div>
  );
}

export default function DvwaLab(props) {
  return (
    <BrowserOnly fallback={<div className={styles.loading}>Laden...</div>}>
      {() => <DvwaLabInner {...props} />}
    </BrowserOnly>
  );
}
