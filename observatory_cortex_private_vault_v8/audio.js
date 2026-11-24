/*
 * THE OBSERVATORY // ORIGINAL ADAPTIVE SOUNDTRACK
 * Entirely generated in the browser with Web Audio. No audio downloads,
 * trackers, third-party samples, or copyrighted recordings.
 */
(() => {
  'use strict';
  const PREF = 'observatory-audio-muted-v3';
  const LABELS = {login:'GATEWAY', terminal:'TERMINAL', wire:'OVERLOAD', brute:'BRUTE FORCE',
    archive:'ARCHIVE', temp:'RECOVERY', reboot:'REBOOT', trace:'SIGNAL TRACE'};
  const SCENES = {
    login:    {bpm:66, root:110.0, pad:.115, tone:410, rhythm:.38},
    terminal: {bpm:83, root:110.0, pad:.137, tone:610, rhythm:.59},
    wire:     {bpm:96, root:116.54,pad:.145, tone:930, rhythm:.76},
    brute:    {bpm:112,root:110.0, pad:.147, tone:970, rhythm:.85},
    archive:  {bpm:71, root:110.0, pad:.142, tone:510, rhythm:.50},
    temp:     {bpm:61, root:130.82,pad:.092, tone:770, rhythm:.29},
    reboot:   {bpm:91, root:130.82,pad:.124,tone:1150,rhythm:.68},
    trace:    {bpm:146,root:103.82,pad:.17,tone:1400,rhythm:1.00}
  };
  const MELODY = {
    login:   [0,null,null,1,null,null,3,null,0,null,2,null,1,null,null,null],
    terminal:[0,null,1,null,3,2,1,null,0,1,null,4,3,null,1,null],
    wire:    [0,1,3,1,4,3,1,5,0,1,3,4,6,5,3,1],
    brute:   [0,3,1,4,0,5,3,1,6,4,1,3,0,5,4,1],
    archive: [0,null,null,3,null,null,1,null,0,null,4,null,2,null,null,1],
    temp:    [0,null,null,null,3,null,null,null,2,null,null,null,1,null,null,null],
    reboot:  [0,1,2,3,4,5,6,7,1,2,3,4,5,6,7,8],
    trace:   [0,1,6,1,7,5,2,6,0,8,6,2,7,5,1,8]
  };
  // Dorian and neighbouring half steps: a deliberately uneasy original motif.
  const STEPS = [1, 1.059463, 1.189207, 1.334840, 1.414214, 1.498307, 1.781797, 1.887749, 2.118926];
  const AudioContextImpl = window.AudioContext || window.webkitAudioContext;
  const MUSIC_PREF = 'observatory-background-music-volume-v5';
  let musicVolume = 82;
  try { musicVolume = Math.max(0,Math.min(100,Number(localStorage.getItem(MUSIC_PREF) ?? 82))); } catch (_) {}
  let enabled = true;
  try { enabled = localStorage.getItem(PREF) !== '1'; } catch (_) {}
  let unlocked = false, ctx = null, master = null, sfxBus = null, musicBus = null;
  let padBus = null, lowOsc = null, highOsc = null, air = null, noiseBuffer = null;
  let tickHandle = null, nextStepAt = 0, stepCount = 0;
  let scene = 'login', level = 1, lastClick = 0;
  let riserAt = 0, lastSceneChange = 0;

  function gainNode(value = 1, target = null) {
    const g = ctx.createGain(); g.gain.value = value;
    if (target) g.connect(target);
    return g;
  }
  function smooth(parameter, value, seconds = .23) {
    if (!ctx) return;
    parameter.cancelScheduledValues(ctx.currentTime);
    parameter.setTargetAtTime(value, ctx.currentTime, Math.max(.008,seconds));
  }
  function makeNoiseBuffer() {
    const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 9137;
    // Deterministic white-noise texture, not downloaded audio.
    for (let i=0; i<data.length; i++) {
      seed ^= seed<<13; seed ^= seed>>>17; seed ^= seed<<5;
      data[i] = ((seed>>>0)/2147483647)-1;
    }
    return buffer;
  }
  function makeOsc(type, hz, output) {
    const o = ctx.createOscillator(); o.type=type; o.frequency.value=hz;
    o.connect(output); o.start(); return o;
  }
  function initAudio() {
    if (!AudioContextImpl || !unlocked || !enabled) return;
    if (ctx) { if (ctx.state === 'suspended') ctx.resume().catch(()=>{}); return; }
    try {
      ctx = new AudioContextImpl();
      const limiter = ctx.createDynamicsCompressor();
      limiter.threshold.value=-22; limiter.knee.value=18;
      limiter.ratio.value=4; limiter.attack.value=.006; limiter.release.value=.18;
      limiter.connect(ctx.destination);
      master = gainNode(.0001,limiter);
      sfxBus = gainNode(.8,master);
      musicBus = gainNode(musicVolume / 100,master);
      padBus = gainNode(0,musicBus);

      const lowFilter = ctx.createBiquadFilter(); lowFilter.type='lowpass';
      lowFilter.frequency.value=1100; lowFilter.Q.value=.5; lowFilter.connect(padBus);
      lowOsc=makeOsc('sine', SCENES[scene].root,lowFilter);
      const upperGain = gainNode(.55,lowFilter);
      highOsc=makeOsc('triangle',SCENES[scene].root*1.5,upperGain);
      const shimmer = ctx.createBiquadFilter(); shimmer.type='bandpass';
      shimmer.frequency.value=2100; shimmer.Q.value=.4;
      const textureGain=gainNode(.009,musicBus);
      shimmer.connect(textureGain);
      noiseBuffer = makeNoiseBuffer();
      air=ctx.createBufferSource(); air.buffer=noiseBuffer; air.loop=true;
      air.connect(shimmer); air.start();

      smooth(master.gain,.81,.08);
      applyScene();
      nextStepAt=ctx.currentTime+.04;
      tickHandle=setInterval(schedule,95);
      schedule();
    } catch (err) { // If Web Audio is blocked, the rest of the site stays usable.
      console.warn('Soundtrack unavailable:', err);
      if (tickHandle) clearInterval(tickHandle);
      tickHandle=null;
      ctx=null;
    }
  }
  function voice(hz, when, duration, options={}) {
    if (!ctx || !enabled || ctx.state !== 'running') return;
    const {wave='triangle', vol=.01, end=hz, attack=.012, dest=musicBus, filter=0}=options;
    try {
      const o=ctx.createOscillator(), g=ctx.createGain(); o.type=wave;
      o.frequency.setValueAtTime(Math.max(30,hz),when);
      if (end && end!==hz) o.frequency.exponentialRampToValueAtTime(Math.max(30,end),when+duration);
      g.gain.setValueAtTime(.00001,when);
      g.gain.exponentialRampToValueAtTime(Math.max(.0001,vol),when+Math.min(attack,duration*.38));
      g.gain.exponentialRampToValueAtTime(.00001,when+duration);
      let out=g;
      if (filter) {const f=ctx.createBiquadFilter();f.type='lowpass';f.frequency.value=filter;
        g.connect(f);out=f;o.onended=()=>{o.disconnect();g.disconnect();f.disconnect();};}
      else o.onended=()=>{o.disconnect();g.disconnect();};
      o.connect(g);out.connect(dest);o.start(when);o.stop(when+duration+.02);
    } catch (_) {}
  }
  function noiseClick(when, vol=.008, len=.025, frequency=2600) {
    if (!ctx || !noiseBuffer || !enabled || ctx.state !== 'running') return;
    const n=ctx.createBufferSource(),hp=ctx.createBiquadFilter(),g=ctx.createGain();
    n.buffer=noiseBuffer;hp.type='highpass';hp.frequency.value=frequency;
    g.gain.setValueAtTime(.00001,when);g.gain.exponentialRampToValueAtTime(vol,when+.002);
    g.gain.exponentialRampToValueAtTime(.00001,when+len);
    n.connect(hp);hp.connect(g);g.connect(musicBus);
    n.onended=()=>{n.disconnect();hp.disconnect();g.disconnect();};
    n.start(when);n.stop(when+len+.01);
  }
  function applyScene() {
    if (!ctx) return;
    const settings=SCENES[scene];
    const root=settings.root;
    smooth(lowOsc.frequency,root,.5);
    smooth(highOsc.frequency,scene==='trace'?root*1.4142:root*1.4983,.6);
    smooth(padBus.gain,settings.pad,scene==='trace'?.08:.8);
    if (scene==='trace') {riserAt=ctx.currentTime;}
    if (enabled) smooth(master.gain,.81,.12);
  }
  function scheduleStep(when, i) {
    const conf=SCENES[scene], active=scene;
    const intensity= (active==='wire'||active==='brute') ? (level-1)/4 : 0;
    const melody=MELODY[active], pitch=melody[i%16];
    const halfbar=i%8, root=conf.root;
    const boost=1 + .30*intensity;
    if (pitch!==null) {
      const hz=root*4*STEPS[pitch];
      const bright=active==='trace' || active==='brute';
      voice(hz,when,active==='archive'?.47:.19,{wave:bright?'square':'triangle',vol:(active==='archive'?.033:.029)*boost,
        end:hz*(active==='trace'?.985:1),filter:bright?1700:2600});
      if ((i%16)===0 && (active==='archive'||active==='login'))
        voice(hz/2,when,.7,{wave:'sine',vol:.033});
    }
    if (halfbar===0 || (active==='trace'&&i%4===0) || (active==='brute'&&i%8===4)) {
      const bassFreq = root*((Math.floor(i/16)%4)===1 ? 1.05946:1);
      voice(bassFreq,when,active==='trace'?.39:.45,{wave:'sine',vol:active==='trace'?.13:.075*boost,end:bassFreq*.91,attack:.018});
      if (conf.rhythm>.45) voice(97,when,.17,{wave:'sine',vol:.066*conf.rhythm,end:36,attack:.009});
    }
    const rhythm=conf.rhythm;
    if ((i%2===1 && rhythm>.40) || (i%4===2 && rhythm>.27))
      noiseClick(when,.007+(rhythm*.012),.018+intensity*.008,2700);
    if (active==='terminal' && i%4===3) voice(988,when,.055,{wave:'sine',vol:.008,end:840});
    if (active==='wire' && i%4===1) voice(230+intensity*110,when,.095,{wave:'sawtooth',vol:.006,end:170,filter:590});
    if (active==='brute' && i%2===0) voice(430+i%8*35,when,.048,{wave:'square',vol:.004,end:380,filter:780});
    if (active==='reboot' && i%4===0) voice(170+i*25,when,.45,{wave:'sawtooth',vol:.014,end:300+i*27,filter:900});
    if (active==='trace') {
      if (i%4===0) {
        // Alternating alarm harmonics, intentionally unsettling without max volume.
        voice(735,when,.51,{wave:'sawtooth',vol:.035,end:390,filter:1800});
        voice(386,when,.63,{wave:'square',vol:.014,end:510,filter:1000});
      }
      if (i%8===6) voice(70,when,.62,{wave:'sawtooth',vol:.029,end:42,filter:430});
      if (i%2===0) noiseClick(when,.018,.047,1200);
    }
  }
  function schedule() {
    if (!ctx || !enabled || document.hidden || ctx.state!=='running') return;
    const conf=SCENES[scene];
    const intensity=(scene==='wire'||scene==='brute') ? (level-1)/4:0;
    const eighth=30/(conf.bpm*(1+intensity*.22));
    const at=ctx.currentTime;
    if (nextStepAt<at-.30) nextStepAt=at+.03;
    while(nextStepAt<at+.20) {
      scheduleStep(nextStepAt,stepCount++);
      nextStepAt+=eighth;
    }
  }
  function note(hz,duration=.065,wave='sine',volume=.022,delay=0,end=null) {
    if (!enabled) return;
    initAudio();
    if (!ctx) return;
    voice(hz,ctx.currentTime+delay,duration,{wave,vol:volume,end:end||hz,dest:sfxBus});
  }
  function click() {
    const now=Date.now(); if (now-lastClick<35) return;lastClick=now;
    note(570,.041,'square',.012,0,410); note(890,.031,'triangle',.01,.019);
  }
  function page() {
    note(175,.24,'triangle',.021,0,260);
    note(340,.21,'sine',.019,.08,510);
    note(690,.20,'sine',.011,.23);
  }
  function error() {
    note(197,.31,'sawtooth',.034,0,98);
    note(143,.35,'square',.019,.13,76);
  }
  function success() { [294,349.23,440,587.33].forEach((hz,i)=>note(hz,.22,'triangle',.025,i*.10)); }
  function reboot() {
    note(102,.9,'sawtooth',.020,0,48);
    [174,233,311,466,622].forEach((hz,i)=>note(hz,.28,'triangle',.016,.48+i*.19));
  }
  function alarm() {
    note(960,.6,'sawtooth',.032,0,440);
    note(77,.9,'triangle',.059,.11,37);
    note(655,.52,'sawtooth',.026,.78,305);
  }
  function accent(kind='tab') {
    if (kind==='redacted') {
      note(415,.54,'sawtooth',.022,0,210);note(292,.62,'triangle',.018,.16,141);
    } else if (kind==='scan') {
      [256,323,422,566].forEach((hz,i)=>note(hz,.12,'triangle',.014,i*.085));
    } else if (kind==='dossier') {
      note(220,.19,'triangle',.018);note(329.6,.27,'sine',.011,.13);
    } else if (kind==='tab') {
      note(450,.065,'sine',.009,0,620);
    }
  }
  function setMode(next) {
    if (!SCENES[next] || next===scene) return;
    scene=next;lastSceneChange=Date.now();
    applyScene();
    // Drop obsolete queued scheduling on transition, while preserving continuous pads.
    if(ctx) {nextStepAt=ctx.currentTime+.12;stepCount=0;}
    updateButton();
  }
  function setIntensity(next) {level=Math.max(1,Math.min(5,Number(next)||1));}
  function setMusicVolume(value) {
    musicVolume = Math.max(0,Math.min(100,Math.round(Number(value)||0)));
    try {localStorage.setItem(MUSIC_PREF,String(musicVolume));} catch (_) {}
    const number = document.getElementById('musicPercent');
    if (number) number.textContent=`${musicVolume}%`;
    const slider = document.getElementById('musicVolume');
    if (slider) slider.value=String(musicVolume);
    if (ctx && musicBus) smooth(musicBus.gain,musicVolume/100,.06);
  }
  async function testMusic() {
    unlocked=true;
    if (!enabled) { enabled=true; try {localStorage.setItem(PREF,'0');}catch(_) {} updateButton(); }
    initAudio();
    if (!ctx) return;
    try {await ctx.resume();}catch(_) {return;}
    if (musicVolume<10) setMusicVolume(82);
    smooth(master.gain,.81,.05);
    nextStepAt=ctx.currentTime+.08;
    const t=ctx.currentTime+.035;
    [330,392,440,587.33].forEach((hz,i)=>voice(hz,t+i*.13,.7,{wave:i%2?'sine':'triangle',vol:.115,attack:.025,filter:2100}));
  }
  function bindControls() {
    const slider=document.getElementById('musicVolume');
    if (slider) slider.addEventListener('input',e=>setMusicVolume(e.target.value));
    const tester=document.getElementById('testMusic');
    if (tester) tester.addEventListener('click',testMusic);
    setMusicVolume(musicVolume); updateButton();
  }
  function updateButton() {
    const btn=document.getElementById('soundToggle'); if(!btn) return;
    btn.textContent=enabled?`◖)) AUDIO ON · ${LABELS[scene]}`:'◖× AUDIO OFF';
    btn.setAttribute('aria-label',enabled?'Mute the soundtrack and effects':'Enable soundtrack and effects');
    btn.setAttribute('aria-pressed',String(enabled));
    btn.title='Original adaptive soundtrack • click to toggle';
  }
  function toggle() {
    enabled=!enabled;
    try {localStorage.setItem(PREF,enabled?'0':'1');}catch(_){}
    if (enabled) {unlocked=true;initAudio();if(ctx){smooth(master.gain,.81,.06);nextStepAt=ctx.currentTime+.04;}success();}
    else if (ctx) smooth(master.gain,0,.025);
    updateButton();
  }
  function unlock() {unlocked=true;if(enabled)initAudio();}
  document.addEventListener('pointerdown',unlock,{capture:true});
  document.addEventListener('keydown',unlock,{capture:true});
  document.addEventListener('click',e=>{
    if(e.target.closest('#soundToggle'))toggle();
    else if(e.target.closest('button, summary, [role="tab"], a'))click();
  },{capture:true});
  document.addEventListener('visibilitychange',()=>{
    if(!ctx)return;
    if(document.hidden)smooth(master.gain,0,.03);
    else if(enabled){smooth(master.gain,.81,.3);nextStepAt=ctx.currentTime+.08;}
  });
  window.addEventListener('pagehide',()=>{
    if(ctx)smooth(master.gain,0,.02);
  });
  window.ObservatoryAudio={click,page,error,success,reboot,alarm,accent,setMode,setIntensity,setMusicVolume,testMusic};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bindControls);
  else bindControls();
})();
