/*
 * OBSERVATORY // CINEMATIC BREACH MODULE
 * Fictional client-side intrusion animation only. No real hacking,
 * network scanning, tracking, or access-control bypass occurs.
 */
(() => {
  'use strict';
  const layer = document.getElementById('breachLayer');
  const consoleNode = document.getElementById('breachConsole');
  const matrixNode = document.getElementById('breachMatrix');
  const progress = document.getElementById('breachProgressFill');
  const percentage = document.getElementById('breachPercent');
  const headline = document.getElementById('breachHeadline');
  const subtitle = document.getElementById('breachSubline');
  const auth = document.getElementById('breachAuth');
  const node = document.getElementById('breachNode');
  const footer = document.getElementById('breachFooterStatus');
  const channel = document.getElementById('breachChannel');
  const abortButton = document.getElementById('abortIntrusion');
  if (!layer || !consoleNode || !progress || !abortButton) return;

  const phases = [
    {pct:4, headline:'ESTABLISHING\nCONNECTION', detail:'Probing fallback authentication channel...', auth:'AUTH: DENIED', node:'NODE: UNKNOWN', line:'> SYN 0x7F :: SESSION SPOOF PREPARED'},
    {pct:11, detail:'Mapping encrypted archive relay...', node:'NODE: VAULT/001', line:'> VAULT ROUTE DISCOVERED // FIREWALL: ACTIVE'},
    {pct:19, headline:'DECRYPTING\nHANDSHAKE', detail:'Intercepting trusted system signature...', line:'> KEYSTREAM CAPTURE // 0xA7EF 0x2B19 0x88C1'},
    {pct:29, detail:'Falsifying internal handshake tokens...', line:'> INJECT ROOT TOKEN ████:████ // HASH ACCEPTED'},
    {pct:39, headline:'FIREWALL\nBREACHED', detail:'Security watchdog attempting recovery...', auth:'AUTH: SPOOFED', line:'> FIREWALL WARNING // UNAUTHORISED ACCESS'},
    {pct:46, detail:'Scrambling security watchdog response...', line:'> WATCHDOG PID 0x0049 // RESPONSE JAMMED'},
    {pct:54, headline:'OVERRIDING\nSECURITY', detail:'Forging temporary filesystem privileges...', line:'> SUDO /SYSTEM/ARCHIVE // PRIVILEGE MASK 0xFF'},
    {pct:63, detail:'Locating the protected recovery kernel...', node:'NODE: KERNEL/RECOVERY', line:'> MOUNT /obs/archive // READ-ONLY MIRROR OPEN'},
    {pct:73, headline:'KERNEL\nCOMPROMISED', detail:'Writing failsafe access token...', auth:'AUTH: OVERRIDDEN', line:'> RECOVERY SIGNATURE INJECTED // 3 WARNINGS IGNORED'},
    {pct:82, detail:'Internal alarms triggered; forcing a reboot...', line:'> COUNTERMEASURES ONLINE // TRACKING PROCESS HALTED'},
    {pct:90, headline:'ACCESS\nESTABLISHED', detail:'Isolating terminal from security services...', line:'> IDENTITY CACHE INVALIDATED // REBOOT REQUIRED'},
    {pct:100, headline:'BREACH\nCOMPLETE', detail:'Emergency identity gateway recovered.', auth:'AUTH: BYPASSED', node:'NODE: RECOVERED', line:'> ACCESS GRANTED // INITIATING SYSTEM REBOOT'}
  ];

  let running = false;
  let stage = 0;
  let phaseTimer = null;
  let matrixTimer = null;
  let finishTimer = null;
  let seed = 0x17F3A5;
  let lines = [];

  const sequence = '01A75F9BC3E40DE6';
  function randomInt(limit) {
    seed ^= seed << 13; seed ^= seed >>> 17; seed ^= seed << 5;
    return (seed >>> 0) % limit;
  }
  function hexBlock(length) {
    let result = '';
    for (let i = 0; i < length; i++) result += sequence[randomInt(sequence.length)];
    return result;
  }
  function renderMatrix() {
    if (!running) return;
    let result = '';
    for (let i = 0; i < 25; i++) result += hexBlock(48) + '\n';
    matrixNode.textContent = result;
  }
  function write(message) {
    lines.push(message);
    if (lines.length > 8) lines.shift();
    consoleNode.textContent = lines.join('\n');
    consoleNode.scrollTop = consoleNode.scrollHeight;
  }
  function clearTimers() {
    clearTimeout(phaseTimer);
    clearTimeout(finishTimer);
    clearInterval(matrixTimer);
    phaseTimer = null;
    finishTimer = null;
    matrixTimer = null;
  }
  function close() {
    clearTimers();
    running = false;
    layer.classList.add('hidden');
    layer.classList.remove('breach-success', 'breach-alert');
    layer.setAttribute('aria-hidden', 'true');
  }
  function abort() {
    if (!running) return;
    close();
    window.ObservatoryAudio?.setMode('login');
    window.ObservatoryBridge?.syncSoundtrack?.();
    const toast = document.getElementById('toast');
    if (toast) {
      toast.textContent = 'INTRUSION TERMINATED // CONNECTION DISCONNECTED';
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 2800);
    }
  }
  function step() {
    if (!running) return;
    const p = phases[stage++];
    progress.style.width = p.pct + '%';
    percentage.textContent = String(p.pct).padStart(2, '0') + '%';
    if (p.headline) headline.textContent = p.headline;
    if (p.detail) subtitle.textContent = p.detail;
    if (p.auth) auth.textContent = p.auth;
    if (p.node) node.textContent = p.node;
    footer.textContent = p.pct < 73 ? 'UNAUTHORISED CONNECTION // INTERNAL ALARMS DETECTED'
      : 'FAILSAFE KERNEL // OVERRIDE IN PROGRESS';
    if (stage === 5 || stage === 10) {
      layer.classList.add('breach-alert');
      window.ObservatoryAudio?.error();
      setTimeout(() => layer.classList.remove('breach-alert'), 470);
    } else if (stage === 9) window.ObservatoryAudio?.accent('scan');
    write(p.line);
    if (stage % 3 === 0) write('> 0x' + hexBlock(8) + ' / ' + hexBlock(6) + ' / ACK=0x' + hexBlock(4));
    if (p.pct < 100) {
      phaseTimer = setTimeout(step, (stage % 3 === 0 ? 710 : 620));
      return;
    }
    layer.classList.add('breach-success');
    abortButton.disabled = true;
    footer.textContent = 'ACCESS CONTROL DISABLED // SYSTEM REBOOT PENDING';
    window.ObservatoryAudio?.success();
    finishTimer = setTimeout(() => {
      close();
      if (!window.ObservatoryBridge?.breachComplete?.()) {
        // If the gateway was reset while the animation ran, safely fall back.
        window.ObservatoryBridge?.syncSoundtrack?.();
      }
    }, 1050);
  }
  function start() {
    if (running || !layer.classList.contains('hidden')) return false;
    const account = document.getElementById('accountView');
    const archive = document.getElementById('wikiView');
    if ((!account?.classList.contains('hidden')) || (!archive?.classList.contains('hidden'))) return false;
    running = true;
    stage = 0;
    lines = [];
    seed = Math.floor(Math.random() * 0x7fffffff) || 0x17F3A5;
    abortButton.disabled = false;
    layer.classList.remove('hidden', 'breach-success', 'breach-alert');
    layer.setAttribute('aria-hidden', 'false');
    channel.textContent = 'CHANNEL 0x7F // CONNECTING';
    headline.textContent = 'ESTABLISHING\nCONNECTION';
    subtitle.textContent = 'Routing connection through the recovery channel...';
    progress.style.width = '0%';
    percentage.textContent = '00%';
    auth.textContent = 'AUTH: DENIED';
    node.textContent = 'NODE: UNRESOLVED';
    footer.textContent = 'ENCRYPTED ACCESS NODE // SECURITY ACTIVE';
    write('root@observatory:~# ./inject --mirror --recover');
    write('> SYNCHRONISING TERMINAL // ESTABLISHING UPLINK...');
    window.ObservatoryAudio?.setMode('breach');
    window.ObservatoryAudio?.accent('scan');
    renderMatrix();
    matrixTimer = setInterval(renderMatrix, 165);
    phaseTimer = setTimeout(step, 540);
    abortButton.focus();
    return true;
  }
  abortButton.addEventListener('click', abort);
  window.addEventListener('keydown', event => {
    if (event.key === 'Escape' && running && !abortButton.disabled) {
      event.preventDefault();
      abort();
    }
  });
  window.ObservatoryBreach = { start, abort };
})();
