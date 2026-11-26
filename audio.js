/*
 * THE OBSERVATORY // ORIGINAL ADAPTIVE SOUNDTRACK
 * Entirely generated in the browser with Web Audio. No audio downloads,
 * trackers, third-party samples, or copyrighted recordings.
 */
(() => {
  'use strict';
  const PREF = 'observatory-audio-muted-v3';
  const LABELS = {login:'GATEWAY', terminal:'TERMINAL', breach:'INTRUSION', wire:'OVERLOAD', brute:'BRUTE FORCE',
    jammer:'TRACE JAMMER', archive:'ARCHIVE', temp:'RECOVERY', reboot:'REBOOT', trace:'SIGNAL TRACE'};
  // Low, detuned original horror score. Frequencies intentionally sit below the
  // previous high synth arpeggios, with audible upper harmonics on small speakers.
  const SCENES = {
    login:    {bpm:46, root:73.42, pad:.205, rhythm:.24},
    terminal: {bpm:54, root:65.41, pad:.245, rhythm:.40},
    breach:   {bpm:82, root:61.74, pad:.290, rhythm:.90},
    wire:     {bpm:68, root:69.30, pad:.235, rhythm:.70},
    brute:    {bpm:74, root:73.42, pad:.235, rhythm:.73},
    jammer:   {bpm:65, root:69.30, pad:.255, rhythm:.73},
    archive:  {bpm:42, root:69.30, pad:.250, rhythm:.32},
    temp:     {bpm:40, root:77.78, pad:.210, rhythm:.22},
    reboot:   {bpm:78, root:65.41, pad:.280, rhythm:.80},
    trace:    {bpm:100,root:58.27, pad:.335, rhythm:1.00}
  };
  const MELODY = {
    login:   [null,null,0,null,null,null,1,null,null,null,3,null,null,null,1,null],
    terminal:[0,null,null,1,null,null,3,null,1,null,4,null,null,2,null,null],
    breach:  [0,null,1,3,0,4,1,3,0,5,2,4,1,3,0,6],
    wire:    [0,null,1,3,0,2,4,1,0,5,3,1,0,4,2,3],
    brute:   [0,3,1,4,0,3,5,2,0,6,3,1,0,4,2,5],
    jammer:  [0,null,1,3,0,2,4,1,0,5,3,1,0,4,2,3],
    archive: [null,null,0,null,null,3,null,null,1,null,null,null,4,null,null,2],
    temp:    [null,null,0,null,null,null,null,null,3,null,null,null,null,null,1,null],
    reboot:  [0,1,3,2,4,3,5,1,0,3,2,5,4,1,6,3],
    trace:   [0,3,6,2,5,1,6,3,0,5,2,6,3,1,6,4]
  };
  // Chromatic seconds, tritones and uneven low intervals: intentionally unresolved.
  const STEPS = [1, 1.059463, 1.122462, 1.414214, 1.498307, 1.587401, 1.781797];
  const AudioContextImpl = window.AudioContext || window.webkitAudioContext;
  const MUSIC_PREF = 'observatory-background-music-volume-v5';
  let musicVolume = 82;
  try { musicVolume = Math.max(0,Math.min(100,Number(localStorage.getItem(MUSIC_PREF) ?? 82))); } catch (_) {}
  let enabled = true;
  try { enabled = localStorage.getItem(PREF) !== '1'; } catch (_) {}
  let unlocked = false, ctx = null, master = null, sfxBus = null, musicBus = null;
  let padBus = null, lowOsc = null, highOsc = null, subOsc = null, dreadOsc = null, air = null, noiseBuffer = null;
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
      lowFilter.frequency.value=620; lowFilter.Q.value=.55; lowFilter.connect(padBus);
      lowOsc=makeOsc('triangle', SCENES[scene].root,lowFilter);
      // A near-sub octave and two slightly dissonant upper drones create
      // an ominous moving texture while retaining audible harmonics.
      // 200–250 Hz harmonic makes the low drone audible on phone speakers.
      const upperGain = gainNode(.35,lowFilter);
      highOsc=makeOsc('triangle',SCENES[scene].root*2.9966,upperGain);
      const subGain = gainNode(.60,lowFilter);
      subOsc=makeOsc('sine',SCENES[scene].root*.5,subGain);
      const dreadGain = gainNode(.14,lowFilter);
      dreadOsc=makeOsc('sawtooth',SCENES[scene].root*1.061,dreadGain);
      const shimmer = ctx.createBiquadFilter(); shimmer.type='bandpass';
      shimmer.frequency.value=710; shimmer.Q.value=.55;
      const textureGain=gainNode(.019,musicBus);
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
    smooth(lowOsc.frequency,root,.7);
    smooth(highOsc.frequency,scene==='trace'?root*2.8284:root*2.9966,.6);
    smooth(subOsc.frequency,root*.5,.9);
    smooth(dreadOsc.frequency,root*1.061,.75);
    smooth(padBus.gain,settings.pad,scene==='trace'?.08:.75);
    if (scene==='trace') {riserAt=ctx.currentTime;}
    if (enabled) smooth(master.gain,.81,.12);
  }
  function scheduleStep(when, i) {
    const conf = SCENES[scene], active = scene;
    const tension = (active==='breach'||active==='trace') ? 1 : (active==='jammer' ? .6 : .3);
    const pulse = conf.rhythm;
    const pitch = MELODY[active][i % 16];
    const root = conf.root;
    // Sparse, low-register, dissonant melody rather than bright arcade notes.
    if (pitch!==null) {
      const hz = root * 1.85 * STEPS[pitch];
      voice(hz,when,active==='archive'?1.9:.85,{
        wave:(i%4===0?'triangle':'sine'),vol:active==='archive'?.025:.029,
        end:hz*.97,attack:.07,filter:800
      });
      if (i%8===0) voice(hz*.5,when,1.6,{wave:'sine',vol:.046,attack:.11,filter:250});
    }
    // A deep double heartbeat and speaker-friendly harmonics.
    if (i%8===0 || (pulse>.7 && i%4===0)) {
      voice(root*.82,when,.84,{wave:'sine',vol:.16+.035*tension,end:root*.48,attack:.021,filter:260});
      voice(root*1.64,when,.65,{wave:'triangle',vol:.039+.012*tension,end:root*1.10,attack:.018,filter:390});
    }
    if (i%16===2) voice(root*.92,when,.30,{wave:'sine',vol:.080,end:root*.7,attack:.014,filter:230});
    // Slow metallic groans and a minor-second harmonic swell.
    if (i%16===6 || (tension && i%16===14)) {
      voice(root*2.07,when,1.4,{wave:'sawtooth',vol:.014+.008*tension,end:root*1.65,attack:.22,filter:370});
      voice(root*2.19,when,1.1,{wave:'triangle',vol:.017,end:root*1.9,attack:.18,filter:470});
    }
    if ((i%2===1&&pulse>.45)||(i%4===2&&pulse>.3))
      noiseClick(when,.004+.007*pulse,.033,1100);
    if (active==='terminal'&&i%4===3)
      voice(246,when,.18,{wave:'square',vol:.009,end:124,filter:420});
    if (active==='breach') {
      if (i%2===0) voice(175+(i%8)*16,when,.11,{wave:'square',vol:.013,end:108,filter:570});
      if (i%8===5) voice(137,when,.75,{wave:'sawtooth',vol:.026,end:65,filter:360});
      if (i%4===3) noiseClick(when,.012,.063,650);
    }
    if (active==='jammer'&&i%4===1) voice(205,when,.16,{wave:'triangle',vol:.015,end:102,filter:480});
    if (active==='reboot'&&i%4===0) voice(116,when,.65,{wave:'sawtooth',vol:.019,end:62,filter:380});
    if (active==='trace') {
      // Pulsed low siren and distorted descent. No high-pitched shrieking.
      if (i%4===0) {
        voice(310,when,.72,{wave:'sawtooth',vol:.057,end:144,filter:920});
        voice(104,when,.83,{wave:'square',vol:.036,end:53,filter:400});
      }
      if (i%8===6) voice(74,when,.9,{wave:'sawtooth',vol:.040,end:38,filter:240});
      if (i%2===0) noiseClick(when,.018,.055,710);
    }
  }
  function schedule() {
    if (!ctx || !enabled || document.hidden || ctx.state!=='running') return;
    const conf=SCENES[scene];
    const intensity=(scene==='wire'||scene==='brute'||scene==='jammer') ? (level-1)/4:0;
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
    note(185,.054,'square',.012,0,111); note(308,.046,'triangle',.009,.018,162);
  }
  function page() {
    note(118,.48,'triangle',.028,0,67);
    note(184,.41,'sine',.026,.09,96);
    note(208,.24,'sine',.011,.22,151);
  }
  function error() {
    note(127,.49,'sawtooth',.038,0,43);
    note(83,.51,'square',.021,.13,36);
  }
  function success() { [98,116.54,174.61,146.83].forEach((hz,i)=>note(hz,.39,'triangle',.025,i*.09)); }
  function reboot() {
    note(65,.99,'sawtooth',.035,0,36);
    [104,131,156,174,117].forEach((hz,i)=>note(hz,.36,'triangle',.024,.4+i*.16));
  }
  function alarm() {
    note(350,.7,'sawtooth',.055,0,129);
    note(69,.95,'triangle',.085,.08,34);
    note(290,.72,'sawtooth',.041,.72,117);
  }
  function accent(kind='tab') {
    if (kind==='redacted') {
      note(154,.66,'sawtooth',.024,0,71);note(195,.81,'triangle',.016,.14,83);
    } else if (kind==='scan') {
      [104,123,166,148].forEach((hz,i)=>note(hz,.17,'triangle',.017,i*.085));
    } else if (kind==='dossier') {
      note(110,.33,'triangle',.018);note(164.8,.41,'sine',.015,.13);
    } else if (kind==='tab') {
      note(178,.10,'sine',.011,0,113);
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
    [73.42,77.78,138.59,146.83].forEach((hz,i)=>voice(hz,t+i*.18,1.15,{wave:i%2?'sine':'triangle',vol:.094,attack:.065,filter:580}));
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
