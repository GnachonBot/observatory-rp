/*
 * CORTEX // CITY SURVEILLANCE ARRAY
 * Fictional, locally generated visual scans. No real cameras, photos,
 * face recognition, geolocation, network requests, or personal data collection.
 */
(() => {
  'use strict';
  const archive = document.getElementById('wikiView');
  const panel = document.getElementById('citySurveillance');
  if (!archive || !panel) return;

  const cards = Array.from(panel.querySelectorAll('[data-sweep-sector]'));
  const passNode = document.getElementById('sweepPass');
  const stateNode = document.getElementById('faceScanState');
  const matchNode = document.getElementById('faceMatchTotal');
  const logNode = document.getElementById('cityScanLog');
  const rerun = document.getElementById('rerunCityScan');
  const traceLayer = document.getElementById('traceLayer');
  const sectors = [
    { key: 'HARMONY', name: 'HARMONY-R02', message: 'RADIO TOWER / TIFF SIGNAL FRAGMENT REGISTERED. FACIAL ID: UNVERIFIED.' },
    { key: 'VINEWOOD', name: 'VINEWOOD-V07', message: 'OLDER VINEWOOD SIGN INTERCEPT INDEXED. CAMERAS RE-SCANNED; NO VERIFIED MATCH.' },
    { key: 'DOWNTOWN', name: 'LOS-SANTOS-C12', message: 'URBAN FACE GEOMETRY PASS COMPLETE. CANDIDATES REJECTED OR INCONCLUSIVE.' },
    { key: 'SANDY', name: 'BLAINE-S18', message: 'ROAD-NETWORK VISUAL SWEEP COMPLETE. NO POSITIVE SUBJECT ID.' }
  ];
  const statuses = [
    'FACE GEOMETRY // SCANNING',
    'OPTICAL MATCH // INCONCLUSIVE',
    'CROSS-CAMERA SEARCH // ACTIVE',
    'FACIAL ID // NO CONFIRMED MATCH'
  ];
  let pass = 1;
  let cursor = -1;
  let shown = false;
  let pulseTimeout = 0;

  function inArchive() {
    return !archive.classList.contains('hidden')
      && !document.hidden
      && (!traceLayer || traceLayer.classList.contains('hidden'));
  }

  function log(message) {
    const line = document.createElement('p');
    line.textContent = '> ' + message;
    logNode.prepend(line);
    while (logNode.children.length > 4) logNode.lastElementChild.remove();
  }

  function scan() {
    if (!inArchive()) return;
    cursor = (cursor + 1) % sectors.length;
    pass += 1;
    const active = sectors[cursor];
    const isCandidate = pass % 6 === 0 && cursor !== 0;
    passNode.textContent = String(pass).padStart(3, '0');
    if (stateNode) stateNode.textContent = isCandidate ? 'CANDIDATE / UNVERIFIED' : 'RUNNING // MULTI-SECTOR';
    if (matchNode) matchNode.textContent = '00';
    cards.forEach((card, index) => {
      const focused = index === cursor;
      card.classList.toggle('is-scanning', focused);
      card.classList.toggle('is-candidate', focused && isCandidate);
      const status = card.querySelector('[data-sweep-result]');
      const indicator = card.querySelector('.feed-live');
      if (indicator) indicator.textContent = focused ? '● ANALYSING' : (index === 0 ? '● SIGNAL' : '● SCANNING');
      if (status) {
        if (focused && isCandidate) status.textContent = 'POSSIBLE FACE / ID UNVERIFIED';
        else if (focused && index === 0) status.textContent = 'TOWER SIGNAL / FACE NOT VERIFIED';
        else status.textContent = statuses[(pass + index) % statuses.length];
      }
    });
    log('[' + active.name + '] ' + (isCandidate
      ? 'FACE CANDIDATE FLAGGED. INSUFFICIENT DATA / MATCH NOT CONFIRMED.'
      : active.message));
    panel.classList.remove('is-pulsing');
    // Restart the brief local highlight without forcing layout-heavy animation loops.
    void panel.offsetWidth;
    panel.classList.add('is-pulsing');
    clearTimeout(pulseTimeout);
    pulseTimeout = setTimeout(() => panel.classList.remove('is-pulsing'), 700);
  }

  if (rerun) rerun.addEventListener('click', () => {
    if (!inArchive()) return;
    window.ObservatoryAudio?.accent('scan');
    log('[CORTEX/OVERRIDE] SECONDARY CAMERA ARRAY PRIORITISED. EXPANDING SCAN RADIUS.');
    scan();
  });

  // The archive view can be entered by either Cortex credentials or a temporary
  // name-only session. Neither changes the source of the fictional surveillance UI.
  const observer = new MutationObserver(() => {
    const active = inArchive();
    if (active && !shown) {
      shown = true;
      log('[HARMONY-R02] NEW SIGNAL DETECTED / LAST SCAN: RADIO TOWER / TIFFY LOU.');
      scan();
    }
    if (!active) shown = false;
  });
  observer.observe(archive, { attributes: true, attributeFilter: ['class'] });
  window.setInterval(scan, 2700);
  if (inArchive()) {
    shown = true;
    scan();
  }
})();
