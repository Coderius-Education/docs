/**
 * SharedRunner — one iframe per page that hosts a single Pyodide instance.
 *
 * All PygbagRunners on the same page route their "▶ Speel" clicks through
 * this module. The iframe initialises once (Pyodide + packages + play
 * bootstrap), then handles every run via postMessage. Subsequent runs skip
 * the 5+ second Pyodide init entirely.
 *
 * The iframe lives at `position: fixed` and is repositioned to overlay the
 * active PygbagRunner's slot when running. When idle it hides off-screen.
 */
import { buildSharedRunnerSrcDoc } from '../CodeRunner/engine';

// --- Module-level singleton state ---
let iframe = null;
let scheduledCodes = [];
let scheduleTimer = null;
let pyodideReady = false;
let messageListenerAttached = false;
let currentOwner = null;   // { id, slotEl, listeners }
let nextRequestId = 1;
let trackingHandler = null;

function isBrowser() {
  return typeof window !== 'undefined' && typeof document !== 'undefined';
}

/**
 * PygbagRunners call this at mount with their code. We coalesce all codes
 * within a 250ms window into a single iframe init so the iframe sees the
 * union of packages it might ever need on this page.
 */
export function schedule(code) {
  if (!isBrowser()) return;
  if (iframe) return; // already initialised
  scheduledCodes.push(code);
  if (scheduleTimer) clearTimeout(scheduleTimer);
  scheduleTimer = setTimeout(() => {
    if (iframe) return;
    initIframe(scheduledCodes);
    scheduledCodes = [];
  }, 250);
}

function initIframe(codes) {
  iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  // allow-same-origin is required so the iframe can fetch local /whl/*.whl
  iframe.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-downloads');
  iframe.style.cssText =
    'position:fixed;top:0;left:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none;z-index:9999;background:#1a1a2e;';
  iframe.srcdoc = buildSharedRunnerSrcDoc(codes);
  document.body.appendChild(iframe);

  if (!messageListenerAttached) {
    window.addEventListener('message', handleMessage);
    messageListenerAttached = true;
  }
}

function handleMessage(e) {
  if (!iframe || e.source !== iframe.contentWindow) return;
  if (!e.data || !e.data.type) return;

  const { type } = e.data;

  if (type === 'iframe-ready') {
    pyodideReady = true;
    return;
  }

  // All other messages get routed to the current owner if any
  if (!currentOwner) return;
  const handlers = currentOwner.listeners || {};
  if (type === 'stdout' && handlers.onStdout) handlers.onStdout(e.data.text);
  else if (type === 'stderr' && handlers.onStderr) handlers.onStderr(e.data.text);
  else if (type === 'run-done' && handlers.onDone) handlers.onDone();
  else if (type === 'error' && handlers.onError) handlers.onError(e.data.message, e.data.fatal);
  else if (type === 'stopped' && handlers.onStopped) handlers.onStopped();
}

/**
 * Position the iframe to perfectly overlay the slot of the active runner.
 * Uses position:fixed so we re-position on scroll/resize.
 */
function positionOverSlot(slotEl) {
  if (!iframe || !slotEl) return;
  const rect = slotEl.getBoundingClientRect();
  iframe.style.top = rect.top + 'px';
  iframe.style.left = rect.left + 'px';
  iframe.style.width = rect.width + 'px';
  iframe.style.height = rect.height + 'px';
  iframe.style.visibility = 'visible';
  iframe.style.pointerEvents = 'auto';
}

function hideIframe() {
  if (!iframe) return;
  iframe.style.visibility = 'hidden';
  iframe.style.pointerEvents = 'none';
  iframe.style.width = '0';
  iframe.style.height = '0';
}

function startTracking(slotEl) {
  stopTracking();
  trackingHandler = () => positionOverSlot(slotEl);
  window.addEventListener('scroll', trackingHandler, true);
  window.addEventListener('resize', trackingHandler);
}
function stopTracking() {
  if (!trackingHandler) return;
  window.removeEventListener('scroll', trackingHandler, true);
  window.removeEventListener('resize', trackingHandler);
  trackingHandler = null;
}

/**
 * Run user code in the shared iframe. If another runner currently owns the
 * iframe, that run is stopped first and the iframe is reparented to the new
 * owner's slot.
 */
export function requestRun({ ownerId, slotEl, code, mode, lineOffset, listeners }) {
  if (!isBrowser() || !iframe) {
    if (listeners && listeners.onError) {
      listeners.onError('SharedRunner not initialised yet — try again in a second.', false);
    }
    return null;
  }

  // Switch owner
  if (currentOwner && currentOwner.id !== ownerId) {
    iframe.contentWindow.postMessage({ type: 'stop' }, '*');
    if (currentOwner.listeners && currentOwner.listeners.onPreempted) {
      currentOwner.listeners.onPreempted();
    }
  }

  currentOwner = { id: ownerId, slotEl, listeners };
  positionOverSlot(slotEl);
  startTracking(slotEl);

  const requestId = nextRequestId++;
  iframe.contentWindow.postMessage(
    { type: 'run', requestId, code, mode, lineOffset: lineOffset || 0 },
    '*'
  );
  return requestId;
}

/**
 * Stop the current run if this owner currently holds the iframe.
 * If another owner has since claimed it, this is a no-op.
 */
export function stop(ownerId) {
  if (!iframe || !currentOwner || currentOwner.id !== ownerId) return;
  iframe.contentWindow.postMessage({ type: 'stop' }, '*');
  hideIframe();
  stopTracking();
  currentOwner = null;
}

export function isReady() {
  return pyodideReady;
}
