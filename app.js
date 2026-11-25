/*
  THE OBSERVATORY — client-side archive interface.
  The terminal games, location scan and credential gate are theatrical UI effects.
  Everything inside this static site (including the archive) is public.
*/
(() => {
  'use strict';

  const STORAGE = 'observatory-access-v3';
  const SESSION = 'observatory-ephemeral-v3';
  const SESSION_MS = 5 * 60 * 1000;  // Archive access ends after five minutes.
  const TERMINAL_MS = 5 * 60 * 1000; // An open terminal shell also closes after five minutes.
  const TRACE_STEPS = 12;
  const TRACE_STEP_MS = 1500;
  const TRACE_FINAL_HOLD_MS = 2000; // The location screen stays up for ~20 seconds total.
  const CORTEX_USER = 'cortex';
  const CORTEX_PASS = 'element12';
  const TOTAL_ATTEMPTS = 5;
  const STAGES = 5;
  // Five progressive memory grids; safer tiles become harder to remember.
  const JAMMER_LEVELS = [
    {cols: 4, safe: 5, reveal: 7200},
    {cols: 4, safe: 6, reveal: 6000},
    {cols: 5, safe: 7, reveal: 5000},
    {cols: 5, safe: 8, reveal: 4200},
    {cols: 6, safe: 9, reveal: 3500}
  ];
  const $ = id => document.getElementById(id);
  const ROUTES = {
    wire: { name: 'POWER OVERLOAD', subtitle: 'Maintain a live connection from SOURCE to TARGET. Do not release.' },
    brute: { name: 'BRUTE FORCE', subtitle: 'Type each encrypted sequence precisely before the clock expires.' }
  };

  const ROUTE_POINTS = [
    [[68,170],[208,170],[208,91],[399,91],[399,233],[632,233]],
    [[68,260],[167,260],[167,85],[312,85],[312,256],[485,256],[485,104],[632,104]],
    [[68,83],[157,83],[157,264],[269,264],[269,115],[384,115],[384,255],[513,255],[513,82],[632,82]],
    [[68,224],[143,224],[143,59],[233,59],[233,284],[324,284],[324,78],[418,78],[418,269],[531,269],[531,119],[632,119]],
    [[68,91],[135,91],[135,270],[210,270],[210,67],[286,67],[286,269],[362,269],[362,83],[438,83],[438,272],[515,272],[515,96],[632,96]]
  ];
  const WIRE_TIMES = [28, 25, 23, 21, 19];
  const WIRE_TOLERANCES = [29, 27, 25, 22, 20];
  const BRUTE_TIMES = [18, 17, 15, 14, 12];
  const BRUTE_LENGTHS = [8, 11, 14, 17, 20];
  const ALPHABETS = [
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789',
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789#@',
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789#@%!',
    'ABCDEFGHJKLMNPQRSTUVWXYZ23456789#@%!?&'
  ];

  let state = readState();
  let game = null;
  let noticeTimer = 0;
  let toastTimer = 0;
  let terminalHasBooted = false;
  let lastTerminalMode = null;
  let sessionIdentity = null;
  let traceClock = null;
  let traceSweep = null;
  let traceActive = false;
  let terminalClock = null;
  let terminalExpiresAt = null;
  const terminalHistory = [];

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE) || '{}');
      const attempts = Number.isInteger(parsed.attempts) ? Math.max(0, Math.min(TOTAL_ATTEMPTS, parsed.attempts)) : TOTAL_ATTEMPTS;
      return { attempts, overrideGranted: Boolean(parsed.overrideGranted) };
    } catch (_) { return { attempts: TOTAL_ATTEMPTS, overrideGranted: false }; }
  }
  function persist() { localStorage.setItem(STORAGE, JSON.stringify(state)); }
  function syncSoundtrack() {
    const audio = window.ObservatoryAudio;
    if (!audio) return;
    let mode = 'login';
    if (traceActive) mode = 'trace';
    else if (!$('rebootLayer').classList.contains('hidden')) mode = 'reboot';
    else if (!$('gameModal').classList.contains('hidden') && game) mode = game.type;
    else if (!$('terminalModal').classList.contains('hidden')) mode = 'terminal';
    else if (!$('wikiView').classList.contains('hidden')) mode = 'archive';
    else if (!$('accountView').classList.contains('hidden')) mode = 'temp';
    audio.setMode(mode);
  }
  function showView(name) {
    for (const id of ['accessView', 'accountView', 'wikiView']) $(id).classList.toggle('hidden', id !== name);
    document.body.classList.toggle('archive-active', name === 'wikiView');
    syncSoundtrack();
    window.ObservatoryAudio?.page();
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function showModal(id) { $(id).classList.remove('hidden'); $(id).setAttribute('aria-hidden', 'false'); syncSoundtrack(); }
  function hideModal(id) {
    $(id).classList.add('hidden'); $(id).setAttribute('aria-hidden', 'true');
    if (id === 'terminalModal') clearTerminalClock();
    syncSoundtrack();
  }
  function clearTerminalClock() {
    clearInterval(terminalClock);
    terminalClock = null;
    terminalExpiresAt = null;
  }
  function startTerminalClock() {
    clearTerminalClock();
    if (sessionIdentity?.traceDisabled && !$('wikiView').classList.contains('hidden')) {
      $('terminalTTL').textContent = 'SHELL TTL / DISABLED';
      return;
    }
    terminalExpiresAt = Date.now() + TERMINAL_MS;
    function tick() {
      if ($('terminalModal').classList.contains('hidden') || traceActive) { clearTerminalClock(); return; }
      const left = Math.max(0, terminalExpiresAt - Date.now());
      const minutes = String(Math.floor(left / 60000)).padStart(2, '0');
      const seconds = String(Math.floor(left % 60000 / 1000)).padStart(2, '0');
      $('terminalTTL').textContent = `SHELL TTL / ${minutes}:${seconds}`;
      if (left <= 0) {
        hideModal('terminalModal');
        window.ObservatoryAudio?.error();
        toast('SHELL CONNECTION EXPIRED // TERMINAL CLOSED');
      }
    }
    tick();
    terminalClock = setInterval(tick, 500);
  }
  function toast(message) {
    const box = $('toast'); box.textContent = message; box.classList.remove('hidden');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => box.classList.add('hidden'), 3300);
  }
  function errorFlash(title, message) {
    $('errorTitle').textContent = title;
    $('errorMessage').textContent = message;
    $('errorOverlay').classList.remove('hidden');
    window.ObservatoryAudio?.error();
    clearTimeout(noticeTimer); noticeTimer = setTimeout(() => $('errorOverlay').classList.add('hidden'), 1150);
  }
  function updateAttempts() {
    $('cornerAttempts').textContent = state.attempts;
    $('attemptWarning').innerHTML = `WE ONLY HAVE <strong>${state.attempts}</strong> LOGIN ATTEMPT${state.attempts === 1 ? '' : 'S'}${state.attempts === 0 ? ' LEFT // LOCKED' : ' LEFT.'}`;
    $('attemptWarning').classList.toggle('danger', state.attempts <= 2);
    $('loginForm').querySelector('button[type="submit"]').disabled = state.attempts === 0;
    const button = $('openTerminal');
    button.textContent = state.attempts === 0 ? '[ >_ ] OPEN TERMINAL // RESET AVAILABLE' : '[ >_ ] OPEN EMERGENCY TERMINAL';
  }
  function consumeAttempt() {
    if (state.attempts <= 0) { toast('SESSION LOCKED. Open terminal and type reset to restore the gateway.'); return false; }
    state.attempts--; persist(); updateAttempts(); return true;
  }
  function clearTraceClock() {
    clearInterval(traceClock); traceClock = null;
  }
  function clearSession() {
    clearTraceClock();
    sessionIdentity = null;
    sessionStorage.removeItem(SESSION);
  }
  function resetLocalDemo() {
    if (!confirm('Purge this local cache? Five access attempts will be restored and unsynchronised notes stored in this browser will be erased.')) return;
    clearSession();
    localStorage.removeItem(STORAGE);
    localStorage.removeItem('observatory-rp-private-device-notes-v2');
    state = readState();
    closeGame(false); hideModal('terminalModal');
    $('loginForm').reset(); $('accountForm').reset();
    history.replaceState(null, '', location.pathname + location.search);
    updateAttempts(); showView('accessView'); toast('Local terminal reset. Five attempts restored.');
  }
  function startSession(alias, origin) {
    const entry = { alias, origin, expiresAt: Date.now() + SESSION_MS };
    sessionStorage.setItem(SESSION, JSON.stringify(entry));
    activateSession(entry);
  }
  function activateSession(entry) {
    clearTraceClock();
    sessionIdentity = entry;
    if (!entry.traceDisabled && (!Number.isFinite(entry.expiresAt) || entry.expiresAt <= Date.now())) { triggerLocationTrace(); return; }
    populateWiki(); showView('wikiView');
    $('traceIndicator').classList.toggle('trace-jammed', Boolean(entry.traceDisabled));
    $('traceIndicator').classList.remove('trace-critical');
    if (entry.traceDisabled) {
      $('traceCountdown').textContent = 'DISABLED';
      return;
    }
    function tick() {
      if (!sessionIdentity || traceActive) return;
      const left = Math.max(0, entry.expiresAt - Date.now());
      const mm = String(Math.floor(left / 60000)).padStart(2,'0');
      const ss = String(Math.floor(left % 60000 / 1000)).padStart(2,'0');
      $('traceCountdown').textContent = `${mm}:${ss}`;
      $('traceIndicator').classList.toggle('trace-critical', left <= 30000);
      if (left <= 0) triggerLocationTrace();
    }
    tick(); traceClock = setInterval(tick, 180);
  }
  function disableSessionTrace() {
    if (!sessionIdentity || traceActive || sessionIdentity.traceDisabled) return false;
    sessionIdentity = { ...sessionIdentity, traceDisabled: true, expiresAt: null };
    sessionStorage.setItem(SESSION, JSON.stringify(sessionIdentity));
    clearTraceClock();
    $('traceIndicator').classList.remove('trace-critical');
    $('traceIndicator').classList.add('trace-jammed');
    $('traceCountdown').textContent = 'DISABLED';
    return true;
  }
  function triggerLocationTrace() {
    if (traceActive) return;
    traceActive = true;
    clearSession();
    if (game) closeGame(false);
    hideModal('terminalModal'); hideModal('gameModal');
    $('errorOverlay').classList.add('hidden');
    $('traceLayer').classList.remove('hidden');
    syncSoundtrack();
    $('traceFill').style.width = '0%';
    $('traceLog').textContent = 'SIGNAL LOCK ACQUIRED...';
    window.ObservatoryAudio?.alarm();
    const lines = [
      '> LOCATION SIGNATURE IDENTIFIED',
      '> SEARCHING ACTIVE CONNECTION...',
      '> SWEEPING NETWORK NODES...',
      '> TRACE COMPLETE // SESSION EXPOSED',
      '> ERASING TEMPORARY CREDENTIALS...',
      '> REINITIALISING ACCESS GATEWAY...'
    ];
    let n = 0;
    clearInterval(traceSweep);
    traceSweep = setInterval(() => {
      n++;
      $('traceFill').style.width = `${Math.min(100, n / TRACE_STEPS * 100)}%`;
      $('traceLog').textContent = lines.slice(0, Math.min(lines.length, Math.ceil(n / TRACE_STEPS * lines.length))).join('\n');
      if (n >= TRACE_STEPS) {
        clearInterval(traceSweep); traceSweep = null;
        setTimeout(() => {
          $('traceLayer').classList.add('hidden');
          state.overrideGranted = false; state.attempts = TOTAL_ATTEMPTS; persist();
          $('loginForm').reset(); $('accountForm').reset(); updateAttempts();
          history.replaceState(null, '', location.pathname + location.search);
          traceActive = false;
          showView('accessView');
          window.ObservatoryAudio?.page();
        }, TRACE_FINAL_HOLD_MS);
      }
    }, TRACE_STEP_MS);
  }

  function terminalLine(message, tone = '') {
    terminalHistory.push({ message, tone });
    if (terminalHistory.length > 65) terminalHistory.shift();
    const log = $('terminalLog');
    log.textContent = '';
    for (const entry of terminalHistory) {
      const line = document.createElement('div'); line.className = `term-line ${entry.tone}`;
      line.textContent = entry.message; log.appendChild(line);
    }
    $('terminalScroll').scrollTop = $('terminalScroll').scrollHeight;
  }
  function openTerminal() {
    const isArchive = !$('wikiView').classList.contains('hidden');
    const mode = isArchive ? 'archive' : 'recovery';
    if (lastTerminalMode !== mode) {
      terminalHistory.splice(0); $('terminalLog').textContent = '';
      terminalHasBooted = false; lastTerminalMode = mode;
    }
    $('terminalTitle').textContent = isArchive ? '● OBSERVATORY // ARCHIVE_SHELL' : '● OBSERVATORY_SHELL.exe';
    $('terminalFooterLeft').textContent = isArchive ? 'FILE DIRECTORY // RECORD INDEX' : 'EMERGENCY RECOVERY CHANNELS';
    $('terminalInput').placeholder = isArchive ? 'help / list / mines / search Hazel' : 'help / overload / bruteforce / status';
    showModal('terminalModal');
    startTerminalClock();
    if (!terminalHasBooted) {
      terminalHasBooted = true;
      if (isArchive) {
        terminalLine('OBSERVATORY ARCHIVE SHELL // NODE 001 ONLINE', 'success');
        terminalLine(':: LOCAL FILE INDEX ONLINE // CACHE INTEGRITY: PARTIAL');
        terminalLine(':: COMMAND REGISTER PRESENT: LIST / OPEN / SEARCH / SCAN / MINES / STATUS');
        terminalLine(':: TRACE JAMMER MODULE ONLINE // MEMORY MINEFIELD');
        terminalLine(':: Type HELP for available commands.', 'muted');
      } else {
        terminalLine('OBSERVATORY RECOVERY SHELL // VERSION 0.5', 'success');
        terminalLine(':: Emergency recovery channels available.');
        terminalLine(':: Five global attempts; each recovery run spends ONE attempt.');
        terminalLine(':: Each route has THREE lives across FIVE escalating stages.');
        terminalLine(':: Select a protocol or type help to view commands.', 'muted');
      }
    }
    if (!isArchive) terminalLine(`> AUTH BUDGET: ${state.attempts}/5 attempts remaining${state.attempts === 0 ? ' // LOCKED' : ''}`, state.attempts === 0 ? 'error' : 'muted');
    updateTerminalOptions();
    setTimeout(() => $('terminalInput').focus(), 40);
  }
  function updateTerminalOptions() {
    const archive = !$('wikiView').classList.contains('hidden');
    $('terminalOptions').classList.toggle('hidden', archive);
    $('traceJammerEntry').classList.toggle('hidden', !archive);
    if (archive) {
      const jammed = Boolean(sessionIdentity?.traceDisabled);
      $('launchTraceJammer').disabled = jammed;
      $('traceJammerStatus').textContent = jammed ? 'TRACE SIGNAL / OFFLINE // SESSION EXEMPT' : 'MEMORY GRID READY // TRACE LINK ACTIVE';
      return;
    }
    for (const btn of $('terminalOptions').querySelectorAll('[data-route]')) btn.disabled = state.attempts === 0;
    if (state.attempts === 0) terminalLine(':: SYSTEM LOCKED. Type reset to restore terminal settings.', 'error');
  }
  function runCommand(raw) {
    const command = raw.trim().toLowerCase(); if (!command) return;
    terminalLine(`guest@observatory:~$ ${raw}`);
    const archive = !$('wikiView').classList.contains('hidden');
    if (archive) {
      if (['mines', 'minefield', 'jam', 'jammer', '03', 'traceoff'].includes(command)) { startTraceJammer(); return; }
      if (command === 'status') terminalLine(`TRACE STATUS: ${sessionIdentity?.traceDisabled ? 'DISABLED' : 'LIVE // FIVE-MINUTE WINDOW'}`, sessionIdentity?.traceDisabled ? 'success' : 'muted');
      if (command === 'help') terminalLine('MEMORY GRID: mines | jammer | 03 // Clear all five escalating stages to sever the session trace.');
      if (window.ObservatoryArchive?.terminalCommand(command, terminalLine)) return;
      if (command === 'clear') { terminalHistory.splice(0); $('terminalLog').textContent = ''; }
      else if (command === 'exit' || command === 'close') hideModal('terminalModal');
      else terminalLine(`UNKNOWN ARCHIVE COMMAND: ${command}. TYPE help.`, 'error');
      return;
    }
    if (command === 'help') {
      terminalLine('COMMANDS: help | status | overload | bruteforce | clear | exit | reset');
      terminalLine('overload = hold and trace 5 circuits // bruteforce = type 5 codes against the clock');
    } else if (command === 'status') {
      terminalLine(`SECURITY: ${state.attempts}/5 attempts | session: ${sessionIdentity?.alias || 'NONE'} | override: ${state.overrideGranted ? 'GRANTED' : 'DENIED'}`);
    } else if (['overload','power','wire','01'].includes(command)) startGame('wire');
    else if (['bruteforce','brute','02'].includes(command)) startGame('brute');
    else if (command === 'clear') { terminalHistory.splice(0); $('terminalLog').textContent = ''; }
    else if (command === 'exit' || command === 'close') hideModal('terminalModal');
    else if (command === 'reset') resetLocalDemo();
    else terminalLine(`COMMAND NOT FOUND: ${command}. TYPE help.`, 'error');
  }

  function stopGameClock() {
    if (!game) return;
    clearInterval(game.interval); game.interval = null; game.active = false;
  }
  function closeGame(showMessage = true) {
    const wasJammer = game?.type === 'jammer';
    if (game) {
      stopGameClock();
      if (wasJammer) { clearTimeout(game.revealTimeout); clearInterval(game.revealTicker); }
    }
    game = null; hideModal('gameModal');
    if (showMessage) toast(wasJammer ? 'MEMORY GRID CLOSED // TRACE STILL ACTIVE' : 'Recovery run aborted. The spent access attempt is not refunded.');
  }
  function startGame(type) {
    if (!ROUTES[type]) return;
    if (!consumeAttempt()) { terminalLine('ERROR: No access attempts left. Type reset.', 'error'); return; }
    hideModal('terminalModal');
    game = { type, stage: 1, lives: 3, active: false, progress: 0, interval: null, expected: '', timeLimit: 0, endsAt: 0 };
    $('gameTitle').textContent = `${type === 'wire' ? '01' : '02'} // ${ROUTES[type].name}`;
    window.ObservatoryAudio?.setIntensity(1);
    showModal('gameModal'); renderGame();
  }
  function startTraceJammer() {
    if ($('wikiView').classList.contains('hidden') || !sessionIdentity || traceActive) {
      terminalLine('TRACE JAMMER UNAVAILABLE // ARCHIVE SESSION REQUIRED', 'error'); return;
    }
    if (sessionIdentity.traceDisabled) { terminalLine('TRACE ALREADY DISABLED // NO SIGNAL EMITTED', 'success'); return; }
    if (game?.type === 'jammer') { clearTimeout(game.revealTimeout); clearInterval(game.revealTicker); }
    hideModal('terminalModal');
    game = {
      type:'jammer', stage:1, lives:3, safe:new Set(), found:new Set(), hit:new Set(),
      active:false, interval:null, revealTimeout:null, revealTicker:null
    };
    $('gameTitle').textContent = '03 // TRACE JAMMER / MEMORY MINEFIELD';
    window.ObservatoryAudio?.setMode('wire');
    showModal('gameModal');
    renderJammer();
  }
  function renderJammer() {
    if (!game || game.type !== 'jammer') return;
    const current = game;
    const level = JAMMER_LEVELS[current.stage - 1];
    const count = level.cols * level.cols;
    clearTimeout(current.revealTimeout); clearInterval(current.revealTicker);
    current.active = false; current.found = new Set(); current.hit = new Set();
    const order = Array.from({length:count},(_,i)=>i);
    for (let i = order.length-1; i > 0; i--) {
      const rand = new Uint32Array(1); crypto.getRandomValues(rand);
      const j = rand[0] % (i + 1);
      [order[i], order[j]] = [order[j], order[i]];
    }
    current.safe = new Set(order.slice(0,level.safe));
    window.ObservatoryAudio?.setIntensity(current.stage);
    const cells = Array.from({length:count}, (_, i) =>
      `<button type="button" class="memory-tile ${current.safe.has(i) ? 'is-safe' : 'is-mine'}" data-cell="${i}" disabled aria-label="Grid cell ${i+1}">${current.safe.has(i) ? '◆' : '×'}</button>`).join('');
    $('gameContent').innerHTML = `<div class="game-lead"><div class="eyebrow">CORTEX // TRACE-CONTROL MODULE / STAGE ${String(current.stage).padStart(2,'0')} OF 0${JAMMER_LEVELS.length}</div><h2>MEMORY MINEFIELD</h2><p>Memorise the illuminated safe blocks before the grid goes dark. All five stages must be cleared to disable the trace. Three strikes end the attempt.</p></div>
      <div class="jammer-stats"><span>INTEGRITY <strong id="memoryLives">${'♥'.repeat(current.lives)}${'♡'.repeat(3-current.lives)}</strong></span><span>SAFE BLOCKS <strong id="memoryProgress">0 / ${level.safe}</strong></span><span>PREVIEW <strong id="memoryClock">${(level.reveal/1000).toFixed(1)}s</strong></span></div>
      <div id="memoryBoard" class="memory-board" style="--grid-columns:${level.cols}" role="group" aria-label="${level.cols}-by-${level.cols} memory minefield, level ${current.stage}">${cells}</div>
      <div class="game-message" id="memoryMessage">OBSERVE // SAFE CELLS ILLUMINATED IN GREEN</div>
      <div class="game-controls"><span class="game-rule">LEVEL ${current.stage}/${JAMMER_LEVELS.length} // ${level.cols}×${level.cols} GRID // ${level.safe} SAFE NODES // NO RECOVERY ATTEMPT USED</span><button class="ghost-button" id="abortMemory" type="button">CLOSE MODULE</button></div>`;
    $('abortMemory').addEventListener('click', () => closeGame());
    const board = $('memoryBoard');
    const revealEnds = performance.now() + level.reveal;
    current.revealTicker = setInterval(() => {
      if (game !== current || !document.getElementById('memoryClock')) return;
      $('memoryClock').textContent = `${Math.max(0,(revealEnds-performance.now())/1000).toFixed(1)}s`;
    }, 100);
    current.revealTimeout = setTimeout(() => {
      if (game !== current || traceActive) return;
      clearInterval(current.revealTicker); current.revealTicker=null;
      current.active = true;
      board.classList.add('memory-concealed');
      for (const cell of board.querySelectorAll('[data-cell]')) {
        cell.disabled = false; cell.textContent = '·';
        cell.setAttribute('aria-label', `Hidden grid cell ${Number(cell.dataset.cell)+1}`);
      }
      $('memoryClock').textContent = 'HIDDEN';
      $('memoryMessage').textContent = `RECALL // SELECT ${level.safe} SAFE BLOCKS // ${current.lives} LIVES REMAIN`;
      window.ObservatoryAudio?.accent('scan');
    }, level.reveal);
    board.addEventListener('click', evt => {
      if (game !== current || !current.active || traceActive) return;
      const cell = evt.target.closest('button[data-cell]');
      if (!cell || cell.disabled) return;
      const index = Number(cell.dataset.cell);
      cell.disabled = true;
      if (current.safe.has(index)) {
        current.found.add(index);
        cell.classList.add('memory-revealed-safe'); cell.textContent = '◆';
        $('memoryProgress').textContent = `${current.found.size} / ${level.safe}`;
        $('memoryMessage').textContent = 'SAFE NODE CONFIRMED // SIGNAL DESTABILISING';
        window.ObservatoryAudio?.success();
        if (current.found.size === level.safe) {
          current.active = false;
          if (current.stage === JAMMER_LEVELS.length) {
            if (!disableSessionTrace()) return;
            $('gameContent').innerHTML = `<div class="stage-pass jammer-success"><div class="success-icon">◈</div><div class="eyebrow">CORTEX // ALL ${JAMMER_LEVELS.length} STAGES VERIFIED</div><h3>TRACE LINK SEVERED</h3><p>Locator beacon offline. Session expiry disabled and archive shell unlocked for this session.</p><button class="primary-button" id="exitMemory" type="button">RETURN TO ARCHIVE ↵</button></div>`;
            $('exitMemory').addEventListener('click', () => closeGame(false));
          } else {
            $('gameContent').innerHTML = `<div class="stage-pass jammer-success"><div class="success-icon">◈</div><div class="eyebrow">TRACE JAMMER // LEVEL ${current.stage} COMPLETE</div><h3>MEMORY BANK DECODED</h3><p>Proceed to level ${current.stage+1}. The grid grows larger and the preview gets shorter. ${current.lives} ${current.lives===1?'life':'lives'} remain.</p><button class="primary-button" id="nextMemory" type="button">NEXT LEVEL ↵</button></div>`;
            $('nextMemory').addEventListener('click', () => { if (game !== current || traceActive) return; current.stage++; renderJammer(); });
          }
        }
      } else {
        current.hit.add(index); current.lives--;
        cell.classList.add('memory-revealed-mine'); cell.textContent = '×';
        $('memoryLives').textContent = '♥'.repeat(current.lives) + '♡'.repeat(3-current.lives);
        errorFlash('MINE TRIGGERED', `SIGNAL SPIKE // ${current.lives} LIVES LEFT`);
        if (current.lives <= 0) {
          current.active = false;
          $('gameContent').innerHTML = `<div class="stage-pass"><div class="success-icon" style="color:#ec716d">×</div><div class="eyebrow">TRACE CONTROL // REJECTED</div><h3>MINEFIELD BREACHED</h3><p>All three lives lost. The five-minute trace is still active; restart the entire five-stage sequence.</p><button class="primary-button" id="retryMemory" type="button">RESTART SEQUENCE ↵</button></div>`;
          $('retryMemory').addEventListener('click', startTraceJammer);
        }
      }
    });
  }

  function gameHeader() {
    if (!game) return '';
    const route = ROUTES[game.type];
    return `<div class="game-lead"><div><div class="eyebrow">EMERGENCY RECOVERY // STAGE ${game.stage} OF ${STAGES}</div><h2>${route.name}</h2><p>${route.subtitle}</p></div></div>
      <div class="game-meta"><div class="stat">CIRCUIT <strong>${String(game.stage).padStart(2, '0')} / 0${STAGES}</strong></div><div class="stat lives">LIVES <strong>${'♥'.repeat(game.lives)}${'♡'.repeat(3 - game.lives)}</strong></div><div class="stat">TIME LEFT <strong id="timerLabel">--.-s</strong></div></div>`;
  }
  function renderGame() { if (!game) return; window.ObservatoryAudio?.setIntensity(game.stage); game.type === 'wire' ? renderWire() : renderBrute(); }
  function startClock(seconds, onTimeout) {
    if (!game) return;
    clearInterval(game.interval);
    game.timeLimit = seconds; game.endsAt = performance.now() + seconds * 1000;
    function tick() {
      if (!game || !game.active) return;
      const left = Math.max(0, (game.endsAt - performance.now()) / 1000);
      const timerLabel = $('timerLabel'); if (timerLabel) timerLabel.textContent = `${left.toFixed(1)}s`;
      const timeFill = $('timeFill'); if (timeFill) { timeFill.style.width = `${(left / seconds) * 100}%`; $('timeTrack')?.classList.toggle('danger', left < seconds * .25); }
      if (left <= 0) onTimeout();
    }
    tick(); game.interval = setInterval(tick, 80);
  }
  function wirePolylineData(points) {
    const segs = []; let total = 0;
    for (let i = 1; i < points.length; i++) {
      const [x1,y1] = points[i-1], [x2,y2] = points[i];
      const len = Math.hypot(x2-x1, y2-y1);
      segs.push({ x1,y1,x2,y2,len,start:total }); total += len;
    }
    return { segs, total };
  }
  function nearestWirePoint(x,y,geometry) {
    let best = { distance: Infinity, along: 0, x: 0, y: 0 };
    for (const s of geometry.segs) {
      const t = Math.max(0, Math.min(1, ((x-s.x1)*(s.x2-s.x1)+(y-s.y1)*(s.y2-s.y1))/(s.len*s.len)));
      const px = s.x1+(s.x2-s.x1)*t, py = s.y1+(s.y2-s.y1)*t;
      const distance = Math.hypot(x-px,y-py);
      if (distance < best.distance) best = { distance, along:s.start+s.len*t, x:px, y:py };
    }
    return best;
  }
  function pathAtProgress(points, geometry, progress) {
    const result = [points[0]];
    for (let i=0; i<geometry.segs.length; i++) {
      const s = geometry.segs[i];
      if (progress >= s.start + s.len) { result.push([s.x2,s.y2]); continue; }
      const t = Math.max(0, Math.min(1, (progress-s.start)/s.len));
      result.push([s.x1+(s.x2-s.x1)*t,s.y1+(s.y2-s.y1)*t]); break;
    }
    return result;
  }
  function renderWire() {
    if (!game) return;
    stopGameClock(); game.progress = 0;
    const stage = game.stage, points = ROUTE_POINTS[stage-1], geometry = wirePolylineData(points);
    const line = points.map(p=>p.join(',')).join(' '), [start,end] = [points[0],points[points.length-1]];
    $('gameContent').innerHTML = gameHeader() + `
      <p class="game-info">Hold down on the glowing <strong>START</strong> terminal, trace the cable continuously, and reach <strong>END</strong>. Leaving the cable or letting go costs one life. Difficulty rises each level.</p>
      <div class="wire-board-shell"><svg id="wireBoard" class="wire-board" viewBox="0 0 700 340" role="img" aria-label="Trace the cable from start to end without releasing the pointer">
      <defs><pattern id="wireGrid" width="35" height="35" patternUnits="userSpaceOnUse"><path d="M35 0H0V35" fill="none" stroke="#ffffff" stroke-opacity=".07" stroke-width="1"/></pattern></defs>
      <rect width="700" height="340" fill="url(#wireGrid)"/>
      <polyline points="${line}" class="track-back"/><polyline points="${line}" class="track-dash"/>
      <polyline id="wireProgress" points="${start.join(',')}" class="track-live"/>
      <circle cx="${start[0]}" cy="${start[1]}" r="16" class="source"/><circle cx="${end[0]}" cy="${end[1]}" r="16" class="target"/>
      <circle id="wireCursor" cx="${start[0]}" cy="${start[1]}" r="8" class="cursor-node"/>
      <text x="${start[0]}" y="${start[1]-28}" text-anchor="middle" class="board-label">START</text>
      <text x="${end[0]}" y="${end[1]-28}" text-anchor="middle" class="board-label">END</text>
      </svg></div>
      <div id="wireMessage" class="game-message">● CONNECTION IDLE — PRESS AND HOLD ON START</div>
      <div class="time-track" id="timeTrack"><div id="timeFill"></div></div>
      <div class="game-controls"><span class="game-rule">STAGE ${stage} · ${WIRE_TIMES[stage-1]} SEC · ${WIRE_TOLERANCES[stage-1]}PX TOLERANCE</span><button class="ghost-button" id="abortWire" type="button">ABORT RUN</button></div>`;
    $('timerLabel').textContent = `${WIRE_TIMES[stage-1].toFixed(1)}s`;
    const board = $('wireBoard');
    const pos = evt => { const rect = board.getBoundingClientRect(); return { x: (evt.clientX-rect.left)/rect.width*700, y: (evt.clientY-rect.top)/rect.height*340 }; };
    function redraw() {
      if (!game || game.type !== 'wire') return;
      const partial = pathAtProgress(points, geometry, game.progress);
      $('wireProgress').setAttribute('points', partial.map(p=>p.join(',')).join(' '));
      const p = partial[partial.length-1]; $('wireCursor').setAttribute('cx',p[0]); $('wireCursor').setAttribute('cy',p[1]);
    }
    board.addEventListener('pointerdown', evt => {
      if (!game || game.type !== 'wire' || game.active || game.stage !== stage) return;
      const p = pos(evt);
      if (Math.hypot(p.x-start[0],p.y-start[1]) > 36) { $('wireMessage').textContent = 'BEGIN AT THE GLOWING START TERMINAL.'; return; }
      evt.preventDefault(); board.setPointerCapture(evt.pointerId); game.active = true; game.pointerId = evt.pointerId;
      game.progress = 0; redraw(); $('wireMessage').textContent = '● LIVE CIRCUIT — KEEP HOLDING. DO NOT LEAVE THE LINE.';
      startClock(WIRE_TIMES[stage-1], () => wireLose('TIMEOUT // VOLTAGE COLLAPSED'));
    });
    board.addEventListener('pointermove', evt => {
      if (!game || !game.active || game.type !== 'wire' || game.pointerId !== evt.pointerId || game.stage !== stage) return;
      evt.preventDefault();
      const p = pos(evt), match = nearestWirePoint(p.x,p.y,geometry);
      if (match.distance > WIRE_TOLERANCES[stage-1]) { wireLose('CABLE DISCONNECTED // TRACE LOST'); return; }
      if (match.along - game.progress > 155) { wireLose('CURRENT SURGE // CANNOT SKIP THE WIRE'); return; }
      if (match.along > game.progress) { game.progress = match.along; redraw(); }
      if (game.progress > geometry.total - 17) stagePassed();
    });
    board.addEventListener('pointerup', evt => { if (game && game.type === 'wire' && game.active && game.pointerId === evt.pointerId) wireLose('EARLY RELEASE // CIRCUIT OPEN'); });
    board.addEventListener('pointercancel', evt => { if (game && game.type === 'wire' && game.active && game.pointerId === evt.pointerId) wireLose('SIGNAL INTERRUPTED'); });
    $('abortWire').addEventListener('click', () => closeGame());
  }
  function wireLose(message) {
    if (!game || !game.active) return;
    stopGameClock(); game.lives--;
    errorFlash('CIRCUIT ERROR', message);
    if (game.lives <= 0) { gameDefeated(message); return; }
    renderWire(); $('wireMessage').textContent = `${message} // ${game.lives} LIVE CONNECTION${game.lives===1?'':'S'} REMAIN`;
    $('wireMessage').classList.add('warn');
  }

  function randomCode(level) {
    const chars = ALPHABETS[level-1];
    const count = BRUTE_LENGTHS[level-1];
    const values = new Uint32Array(count); crypto.getRandomValues(values);
    return Array.from(values, n=>chars[n % chars.length]).join('');
  }
  function renderBrute() {
    if (!game) return;
    stopGameClock(); const stage = game.stage;
    $('gameContent').innerHTML = gameHeader() + `
      <p class="game-info">Copy the code using your keyboard, exactly as displayed. Press <strong>ENTER</strong> to submit. The strings grow longer, symbols appear, and the time limit shrinks. Three mistakes or timeouts end the run.</p>
      <div class="code-field" id="codeField" aria-live="polite">[ TRANSMISSION OFFLINE ]</div>
      <div class="time-track" id="timeTrack"><div id="timeFill"></div></div>
      <form id="bruteForm"><label class="copy-label" for="codeInput">ENTER EXACT SEQUENCE</label><input id="codeInput" class="code-input" type="text" autocomplete="off" autocapitalize="characters" spellcheck="false" disabled placeholder="start transmission to reveal code">
        <div class="game-submit"><button id="bruteAction" class="primary-button" type="button">START TRANSMISSION ↵</button></div></form>
      <div id="bruteMessage" class="game-message">● STANDBY — TIMER STARTS WHEN YOU BEGIN.</div>
      <div class="game-controls"><span class="game-rule">STAGE ${stage} · ${BRUTE_LENGTHS[stage-1]} CHARACTERS · ${BRUTE_TIMES[stage-1]} SEC</span><button class="ghost-button" id="abortBrute" type="button">ABORT RUN</button></div>`;
    $('timerLabel').textContent = `${BRUTE_TIMES[stage-1].toFixed(1)}s`;
    $('bruteAction').addEventListener('click', () => {
      if (!game || game.stage !== stage) return;
      if (game.active) { $('bruteForm').requestSubmit(); return; }
      game.expected = randomCode(stage); game.active = true;
      $('codeField').textContent = game.expected;
      $('codeInput').disabled = false; $('codeInput').value = '';
      $('codeInput').placeholder = 'TYPE NOW'; $('codeInput').focus();
      $('bruteAction').textContent = 'SUBMIT SEQUENCE ↵';
      $('bruteMessage').textContent = '● TRANSMISSION LIVE — TYPE EXACTLY, THEN ENTER.';
      startClock(BRUTE_TIMES[stage-1], () => bruteLose('TIMEOUT // KEY EXPIRED'));
    });
    $('bruteForm').addEventListener('submit', evt => {
      evt.preventDefault(); if (!game || !game.active || game.stage !== stage) return;
      if ($('codeInput').value === game.expected) stagePassed();
      else bruteLose('BAD KEY // SEQUENCE REJECTED');
    });
    // This is a typing game rather than a paste speed contest.
    $('codeInput').addEventListener('paste', evt => { evt.preventDefault(); toast('Direct pasting disabled for the typing challenge.'); });
    $('abortBrute').addEventListener('click', () => closeGame());
  }
  function bruteLose(message) {
    if (!game || !game.active) return;
    stopGameClock(); game.lives--; errorFlash('AUTH ERROR', message);
    if (game.lives <= 0) { gameDefeated(message); return; }
    renderBrute(); $('bruteMessage').textContent = `${message} // ${game.lives} ${game.lives===1?'LIFE':'LIVES'} REMAIN`;
    $('bruteMessage').classList.add('warn');
  }
  function stagePassed() {
    if (!game) return;
    stopGameClock();
    window.ObservatoryAudio?.success();
    const isFinal = game.stage >= STAGES;
    $('gameContent').innerHTML = `<div class="stage-pass"><div class="success-icon">◈</div><div class="eyebrow">${ROUTES[game.type].name} // STAGE ${game.stage} OF ${STAGES}</div><h3>${isFinal ? 'OVERRIDE SUCCESSFUL' : 'STAGE CLEARED'}</h3>
      <p>${isFinal ? 'All five recovery stages are complete. The archive will now restart and activate the temporary identity gateway.' : `Protocol integrity restored. Prepare for level ${game.stage+1}: the challenge becomes more difficult, and your remaining lives carry forward.`}</p>
      <button class="primary-button" id="advanceStage" type="button">${isFinal ? 'INITIATE REBOOT ↵' : 'NEXT STAGE ↵'}</button></div>`;
    $('advanceStage').addEventListener('click', () => {
      if (!game) return;
      if (isFinal) { closeGame(false); startReboot(); }
      else { game.stage++; renderGame(); }
    });
  }
  function gameDefeated(message) {
    if (!game) return;
    const title = ROUTES[game.type].name;
    $('gameContent').innerHTML = `<div class="stage-pass"><div class="success-icon" style="color:#e57b76">×</div><div class="eyebrow">RECOVERY CHANNEL FAILED</div><h3>CONNECTION TERMINATED</h3><p>${title}: ${message}. You have no lives remaining on this run. ${state.attempts} of ${TOTAL_ATTEMPTS} global attempts remain.</p><button class="primary-button" id="retryTerminal" type="button">RETURN TO TERMINAL ↵</button></div>`;
    $('retryTerminal').addEventListener('click', () => { closeGame(false); openTerminal(); });
  }

  function startReboot() {
    state.overrideGranted = true; state.attempts = TOTAL_ATTEMPTS; persist(); updateAttempts();
    const lines = [
      '[ OK ] Initialising emergency fallback kernel...',
      '[ OK ] Flushing failed authentication cache...',
      '[ OK ] Isolating archive interface...',
      '[ OK ] Restoring temporary session gateway...',
      '[ OK ] Five login attempts replenished...',
      '[ OK ] ACCESS GRANTED // NAME REQUIRED.'
    ];
    $('rebootTitle').textContent = 'SAFETY REBOOT // RECOVERY OVERRIDE ACCEPTED';
    window.ObservatoryAudio?.reboot();
    $('rebootLog').textContent = '';
    $('rebootFill').style.width = '0%'; $('rebootPercent').textContent = '0%';
    $('rebootLayer').classList.remove('hidden');
    syncSoundtrack();
    let n = 0;
    const interval = setInterval(() => {
      n++;
      const percent = Math.min(100, Math.round(n/16*100));
      $('rebootFill').style.width = `${percent}%`; $('rebootPercent').textContent = `${percent}%`;
      const count = Math.min(lines.length, Math.floor(n/2.7));
      $('rebootLog').textContent = lines.slice(0,count).join('\n');
      if (n >= 16) {
        clearInterval(interval);
        setTimeout(() => { $('rebootLayer').classList.add('hidden'); showView('accountView'); $('newAlias').focus(); }, 650);
      }
    }, 235);
  }

  function login(evt) {
    evt.preventDefault();
    if (traceActive) return;
    if (state.attempts === 0) { toast('Terminal locked. Use emergency recovery or type reset.'); return; }
    const alias = $('loginName').value.trim();
    const pass = $('loginPass').value;
    if (alias.toLowerCase() === CORTEX_USER && pass === CORTEX_PASS) {
      state.attempts = TOTAL_ATTEMPTS;
      state.overrideGranted = false;
      persist(); updateAttempts();
      $('loginPass').value = '';
      window.ObservatoryAudio?.success();
      startSession('CORTEX', 'credentials');
      toast('PRIMARY ACCESS ACCEPTED // SESSION ACTIVE');
      return;
    }
    consumeAttempt();
    errorFlash('ACCESS DENIED', 'INVALID ACCESS CREDENTIALS');
    toast('Authentication failed. Emergency recovery is available.');
  }
  function register(evt) {
    evt.preventDefault();
    if (!state.overrideGranted) { toast('Complete one emergency recovery protocol to unlock temporary access.'); showView('accessView'); return; }
    const alias = $('newAlias').value.trim();
    if (!/^[A-Za-z0-9_\- ]{2,24}$/.test(alias)) { toast('Enter 2–24 letters, numbers, spaces, hyphens or underscores.'); return; }
    state.overrideGranted = false;
    state.attempts = TOTAL_ATTEMPTS;
    persist();
    $('accountForm').reset(); updateAttempts();
    window.ObservatoryAudio?.success();
    startSession(alias, 'recovery');
    toast(`Temporary session active: ${alias}`);
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);
  }
  function populateWiki() {
    if (window.ObservatoryArchive) window.ObservatoryArchive.render(sessionIdentity?.alias || 'OPERATIVE');
  }

  function initialize() {
    updateAttempts();
    let entry = null;
    try { entry = JSON.parse(sessionStorage.getItem(SESSION) || 'null'); } catch (_) { entry = null; }
    if (entry?.alias && (entry.traceDisabled === true || (Number.isFinite(entry?.expiresAt) && entry.expiresAt > Date.now()))) activateSession(entry);
    else {
      if (entry) sessionStorage.removeItem(SESSION);
      if (state.overrideGranted) showView('accountView');
      else showView('accessView');
    }
    $('loginForm').addEventListener('submit', login);
    $('openTerminal').addEventListener('click', openTerminal);
    $('closeTerminal').addEventListener('click', () => hideModal('terminalModal'));
    $('launchTraceJammer').addEventListener('click', startTraceJammer);
    $('terminalOptions').addEventListener('click', evt => {
      const button = evt.target.closest('button[data-route]'); if (button) startGame(button.dataset.route);
    });
    $('terminalForm').addEventListener('submit', evt => { evt.preventDefault(); runCommand($('terminalInput').value); $('terminalInput').value = ''; });
    $('closeGame').addEventListener('click', () => closeGame());
    $('accountForm').addEventListener('submit', register);
    $('archiveTerminal').addEventListener('click', openTerminal);
    $('logoutButton').addEventListener('click', () => {
      clearSession();
      $('loginForm').reset();
      history.replaceState(null,'',location.pathname + location.search);
      showView('accessView');
    });
    $('resetDemo').addEventListener('click', resetLocalDemo);
    window.addEventListener('keydown', evt => {
      if (traceActive) return;
      if (evt.key === 'Escape') {
        if (!$('gameModal').classList.contains('hidden')) closeGame();
        else if (!$('terminalModal').classList.contains('hidden')) hideModal('terminalModal');
      }
      if (evt.key === '`' && !evt.repeat && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName)) {
        if ($('terminalModal').classList.contains('hidden') && $('gameModal').classList.contains('hidden') && !$('accessView').classList.contains('hidden')) openTerminal();
        else if (!$('terminalModal').classList.contains('hidden')) hideModal('terminalModal');
      }
    });
  }
  initialize();
})();