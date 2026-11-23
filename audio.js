/* The Observatory // Procedural user-interface sounds. No external audio requests. */
(() => {
  'use strict';
  const PREF = 'observatory-audio-muted-v3';
  let enabled = localStorage.getItem(PREF) !== '1';
  let context = null;
  let master = null;
  let unlocked = false;
  let lastClick = 0;
  const AudioEngine = window.AudioContext || window.webkitAudioContext;

  function audioContext() {
    if (!enabled || !unlocked || !AudioEngine) return null;
    try {
      if (!context) { context = new AudioEngine(); master = context.createGain(); master.connect(context.destination); }
      if (context.state === 'suspended') context.resume().catch(() => {});
      return context;
    } catch (_) { return null; }
  }
  function note(freq, duration = .065, type = 'sine', volume = .018, delay = 0, endFreq = null) {
    const ctx = audioContext(); if (!ctx) return;
    const now = ctx.currentTime + delay;
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, now);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(Math.max(35, endFreq), now + duration);
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(Math.max(.0002, volume), now + Math.min(.012, duration/5));
    g.gain.exponentialRampToValueAtTime(.0001, now + duration);
    o.connect(g); g.connect(master);
    o.start(now); o.stop(now + duration + .015);
  }
  function click() {
    const now = Date.now();
    if (now - lastClick < 38) return;
    lastClick = now;
    note(580, .038, 'square', .008, 0, 420);
    note(920, .024, 'sine', .007, .017);
  }
  function page() {
    note(180,.17,'triangle',.014,0, 260);
    note(340,.14,'sine',.013,.09, 520);
    note(690,.15,'sine',.007,.22);
  }
  function error() {
    note(195,.18,'sawtooth',.025,0,110);
    note(147,.19,'sawtooth',.018,.145,90);
  }
  function success() {
    [392,494,587,784].forEach((f,i)=>note(f,.15,'triangle',.02,i*.083));
  }
  function reboot() {
    note(100,.65,'sawtooth',.009,0,54);
    [186,247,330,494].forEach((f,i)=>note(f,.16,'triangle',.009,.48+i*.2));
  }
  function alarm() {
    for (let i=0;i<6;i++) {
      note(i%2?460:635,.34,'sawtooth',.021,i*.78,i%2?250:415);
      note(105,.24,'triangle',.015,i*.78+.16,65);
    }
  }
  function updateButton() {
    const btn = document.getElementById('soundToggle');
    if (!btn) return;
    btn.textContent = enabled ? '◖)) SOUND ON' : '◖× SOUND OFF';
    btn.setAttribute('aria-label',enabled?'Mute website audio':'Enable website audio');
    btn.setAttribute('aria-pressed', String(enabled));
  }
  document.addEventListener('pointerdown', () => { unlocked = true; }, {capture:true});
  document.addEventListener('keydown', () => { unlocked = true; }, {capture:true});
  document.addEventListener('click', evt => {
    if (evt.target.closest('#soundToggle')) {
      enabled = !enabled;
      localStorage.setItem(PREF, enabled ? '0' : '1');
      if (master) master.gain.value = enabled ? 1 : 0;
      updateButton();
      if (enabled) success();
    } else if (evt.target.closest('button, summary, [role="tab"], a')) click();
  }, {capture:true});
  window.ObservatoryAudio = {click,page,error,success,reboot,alarm};
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',updateButton);
  else updateButton();
})();
