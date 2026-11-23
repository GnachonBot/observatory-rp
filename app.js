/*
  THE OBSERVATORY — fictional, client-only RP mini-game.
  No actual hacking, protected account service or server-side security exists here.
  Everything inside this static site (including the archive) is public.
*/
(() => {
  'use strict';

  const STORAGE = 'observatory-rp-v1';
  const SESSION = 'observatory-rp-session';
  const TOTAL_ATTEMPTS = 5;
  const STAGES = 5;
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
  const terminalHistory = [];

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE) || '{}');
      const attempts = Number.isInteger(parsed.attempts) ? Math.max(0, Math.min(TOTAL_ATTEMPTS, parsed.attempts)) : TOTAL_ATTEMPTS;
      return { attempts, account: parsed.account || null, overrideGranted: Boolean(parsed.overrideGranted) };
    } catch (_) { return { attempts: TOTAL_ATTEMPTS, account: null, overrideGranted: false }; }
  }
  function persist() { localStorage.setItem(STORAGE, JSON.stringify(state)); }
  function showView(name) {
    for (const id of ['accessView', 'accountView', 'wikiView']) $(id).classList.toggle('hidden', id !== name);
    document.body.classList.toggle('archive-active', name === 'wikiView');
    window.scrollTo({ top: 0, behavior: 'instant' });
  }
  function showModal(id) { $(id).classList.remove('hidden'); $(id).setAttribute('aria-hidden', 'false'); }
  function hideModal(id) { $(id).classList.add('hidden'); $(id).setAttribute('aria-hidden', 'true'); }
  function toast(message) {
    const box = $('toast'); box.textContent = message; box.classList.remove('hidden');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => box.classList.add('hidden'), 3300);
  }
  function errorFlash(title, message) {
    $('errorTitle').textContent = title;
    $('errorMessage').textContent = message;
    $('errorOverlay').classList.remove('hidden');
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
    if (state.attempts <= 0) { toast('SESSION LOCKED. Open terminal and type reset to restart the RP simulation.'); return false; }
    state.attempts--; persist(); updateAttempts(); return true;
  }
  function resetLocalDemo() {
    if (!confirm('Reset this browser’s RP demo? This clears the local demo account, five-attempt counter, and current session.')) return;
    localStorage.removeItem(STORAGE); localStorage.removeItem('observatory-rp-private-device-notes-v2'); sessionStorage.removeItem(SESSION);
    state = readState(); closeGame(false); hideModal('terminalModal'); $('loginForm').reset();
    updateAttempts(); showView('accessView'); toast('Local RP simulation reset. Five attempts restored.');
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
    $('terminalFooterLeft').textContent = isArchive ? 'FILE DIRECTORY // READ-ONLY PUBLIC RP DATA' : 'SIMULATED RECOVERY OPTIONS';
    $('terminalInput').placeholder = isArchive ? 'help / list / open tiffy / search Hazel' : 'help / overload / bruteforce / status';
    showModal('terminalModal');
    if (!terminalHasBooted) {
      terminalHasBooted = true;
      if (isArchive) {
        terminalLine('OBSERVATORY ARCHIVE SHELL // NODE 001 ONLINE', 'success');
        terminalLine(':: Indexed casefiles loaded. Enter LIST to enumerate the archive.');
        terminalLine(':: OPEN <name> selects a dossier. SEARCH <term> filters the directory.');
        terminalLine(':: Type HELP for available commands.', 'muted');
      } else {
        terminalLine('OBSERVATORY RECOVERY SHELL // VERSION 0.5', 'success');
        terminalLine(':: Remote authorisation failed. Simulated emergency channels available.');
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
    if (archive) return;
    for (const btn of $('terminalOptions').querySelectorAll('[data-route]')) btn.disabled = state.attempts === 0;
    if (state.attempts === 0) terminalLine(':: SYSTEM LOCKED. Type reset to clear LOCAL demo data.', 'error');
  }
  function runCommand(raw) {
    const command = raw.trim().toLowerCase(); if (!command) return;
    terminalLine(`guest@observatory:~$ ${raw}`);
    const archive = !$('wikiView').classList.contains('hidden');
    if (archive) {
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
      terminalLine(`SECURITY: ${state.attempts}/5 attempts | identity: ${state.account ? state.account.alias : 'UNREGISTERED'} | override: ${state.overrideGranted ? 'GRANTED' : 'DENIED'}`);
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
    if (game) stopGameClock();
    game = null; hideModal('gameModal');
    if (showMessage) toast('Recovery run aborted. The spent access attempt is not refunded.');
  }
  function startGame(type) {
    if (!ROUTES[type]) return;
    if (!consumeAttempt()) { terminalLine('ERROR: No access attempts left. Type reset.', 'error'); return; }
    hideModal('terminalModal');
    game = { type, stage: 1, lives: 3, active: false, progress: 0, interval: null, expected: '', timeLimit: 0, endsAt: 0 };
    $('gameTitle').textContent = `${type === 'wire' ? '01' : '02'} // ${ROUTES[type].name}`;
    showModal('gameModal'); renderGame();
  }
  function gameHeader() {
    if (!game) return '';
    const route = ROUTES[game.type];
    return `<div class="game-lead"><div><div class="eyebrow">EMERGENCY RECOVERY // STAGE ${game.stage} OF ${STAGES}</div><h2>${route.name}</h2><p>${route.subtitle}</p></div></div>
      <div class="game-meta"><div class="stat">CIRCUIT <strong>${String(game.stage).padStart(2, '0')} / 0${STAGES}</strong></div><div class="stat lives">LIVES <strong>${'♥'.repeat(game.lives)}${'♡'.repeat(3 - game.lives)}</strong></div><div class="stat">TIME LEFT <strong id="timerLabel">--.-s</strong></div></div>`;
  }
  function renderGame() { if (!game) return; game.type === 'wire' ? renderWire() : renderBrute(); }
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
    const isFinal = game.stage >= STAGES;
    $('gameContent').innerHTML = `<div class="stage-pass"><div class="success-icon">◈</div><div class="eyebrow">${ROUTES[game.type].name} // STAGE ${game.stage} OF ${STAGES}</div><h3>${isFinal ? 'OVERRIDE SUCCESSFUL' : 'STAGE CLEARED'}</h3>
      <p>${isFinal ? 'All five recovery stages are complete. The archive will now perform a simulated safety reboot and enable identity registration.' : `Protocol integrity restored. Prepare for level ${game.stage+1}: the challenge becomes more difficult, and your remaining lives carry forward.`}</p>
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
      '[ OK ] Isolating RP archive interface...',
      '[ OK ] Restoring identity registration service...',
      '[ OK ] Five login attempts replenished...',
      '[ OK ] ACCESS GRANTED // NEW IDENTITY REQUIRED.'
    ];
    $('rebootTitle').textContent = 'SAFETY REBOOT // RECOVERY OVERRIDE ACCEPTED';
    $('rebootLog').textContent = '';
    $('rebootFill').style.width = '0%'; $('rebootPercent').textContent = '0%';
    $('rebootLayer').classList.remove('hidden');
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

  function toBase64(bytes) { return btoa(String.fromCharCode(...bytes)); }
  function fromBase64(value) { return Uint8Array.from(atob(value), ch => ch.charCodeAt(0)); }
  async function keyHash(passphrase, salt) {
    if (!crypto.subtle) throw new Error('Secure context unavailable. Please use localhost or HTTPS (GitHub Pages).');
    const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(passphrase), 'PBKDF2', false, ['deriveBits']);
    const derived = await crypto.subtle.deriveBits({ name:'PBKDF2', salt, iterations:150000, hash:'SHA-256' }, keyMaterial, 256);
    return toBase64(new Uint8Array(derived));
  }
  async function login(evt) {
    evt.preventDefault();
    if (state.attempts === 0) { toast('Session locked. Use terminal command reset.'); return; }
    const alias = $('loginName').value.trim(), pass = $('loginPass').value;
    const button = $('loginForm').querySelector('button[type="submit"]'); button.disabled = true;
    try {
      if (state.account && alias.toLowerCase() === state.account.alias.toLowerCase()) {
        const hash = await keyHash(pass, fromBase64(state.account.salt));
        if (hash === state.account.hash) {
          state.attempts = TOTAL_ATTEMPTS; persist(); updateAttempts();
          sessionStorage.setItem(SESSION,'1'); $('loginPass').value=''; showView('wikiView'); populateWiki(); return;
        }
      }
      consumeAttempt(); errorFlash('ACCESS DENIED', state.account ? 'INVALID CREDENTIALS' : 'NO ACCOUNT FOUND // USE TERMINAL');
      toast(state.account ? 'Incorrect alias or password.' : 'No local identity exists. Use the terminal recovery challenge to create one.');
    } catch (err) { toast(`Login unavailable: ${err.message}`); }
    finally { updateAttempts(); }
  }
  async function register(evt) {
    evt.preventDefault();
    if (!state.overrideGranted) { toast('Complete one recovery challenge to unlock registration.'); showView('accessView'); return; }
    const alias = $('newAlias').value.trim(), pass = $('newPass').value, confirmPass = $('confirmPass').value;
    if (!/^[A-Za-z0-9_-]{3,24}$/.test(alias)) { toast('Alias must be 3–24 letters, numbers, hyphens or underscores.'); return; }
    if (pass.length < 8 || pass !== confirmPass) { errorFlash('INPUT ERROR', 'PASSPHRASES DO NOT MATCH OR ARE TOO SHORT'); return; }
    const button = $('accountForm').querySelector('button[type="submit"]'); button.disabled = true;
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      state.account = { alias, salt:toBase64(salt), hash:await keyHash(pass, salt) };
      state.overrideGranted = false; state.attempts = TOTAL_ATTEMPTS; persist();
      sessionStorage.setItem(SESSION,'1'); $('accountForm').reset(); updateAttempts(); populateWiki(); showView('wikiView');
      toast(`Identity ${alias} created on this browser. Welcome to the fictional archive.`);
    } catch (err) { toast(`Registration unavailable: ${err.message}`); }
    finally { button.disabled = false; }
  }

  function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);
  }
  function populateWiki() {
    if (window.ObservatoryArchive) window.ObservatoryArchive.render(state.account?.alias || 'OPERATIVE');
  }

  function initialize() {
    updateAttempts();
    if (state.account && sessionStorage.getItem(SESSION) === '1') { populateWiki(); showView('wikiView'); }
    else if (state.overrideGranted) showView('accountView');
    else showView('accessView');
    $('loginForm').addEventListener('submit', login);
    $('openTerminal').addEventListener('click', openTerminal);
    $('closeTerminal').addEventListener('click', () => hideModal('terminalModal'));
    $('terminalOptions').addEventListener('click', evt => {
      const button = evt.target.closest('button[data-route]'); if (button) startGame(button.dataset.route);
    });
    $('terminalForm').addEventListener('submit', evt => { evt.preventDefault(); runCommand($('terminalInput').value); $('terminalInput').value = ''; });
    $('closeGame').addEventListener('click', () => closeGame());
    $('accountForm').addEventListener('submit', register);
    $('archiveTerminal').addEventListener('click', openTerminal);
    $('logoutButton').addEventListener('click', () => { sessionStorage.removeItem(SESSION); $('loginForm').reset(); showView('accessView'); });
    $('resetDemo').addEventListener('click', resetLocalDemo);
    window.addEventListener('keydown', evt => {
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
