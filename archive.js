/* OBSERVATORY ARCHIVE VIEWER // fictional RP records, all public static data. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const records = Array.isArray(window.ARCHIVE_RECORDS) ? window.ARCHIVE_RECORDS : [];
  const notesKey = 'observatory-rp-private-device-notes-v2';
  let selectedId = records[0]?.id || '';
  let selectedTab = 'overview';
  let currentFilter = 'ALL';
  let archiveReady = false;

  const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const esc = escapeHTML;
  const recordById = id => records.find(r => r.id === id);
  const fmt = s => esc(s);
  const hasContent = r => r.completeness !== 'EMPTY' && r.kind !== 'redacted';
  function getNotes() {
    try { const found = JSON.parse(localStorage.getItem(notesKey) || '{}'); return found && typeof found === 'object' ? found : {}; }
    catch { return {}; }
  }
  function setNotes(id, text) {
    try {const notes = getNotes(); notes[id] = text; localStorage.setItem(notesKey,JSON.stringify(notes)); return true;}
    catch {return false;}
  }
  function flash(title, message) {
    $('errorTitle').textContent = title;
    $('errorMessage').textContent = message;
    $('errorOverlay').classList.remove('hidden');
    setTimeout(() => $('errorOverlay').classList.add('hidden'), 950);
  }
  function noteToast(message) {
    const el = $('toast'); el.textContent = message; el.classList.remove('hidden');
    clearTimeout(noteToast.timeout); noteToast.timeout = setTimeout(() => el.classList.add('hidden'), 3000);
  }
  function searchText(record) {
    return [record.name,record.id,record.alias,record.category,record.excerpt,record.lead,
      ...(record.facts || []).flat(), ...(record.events || []).flat(), ...(record.questions || []), ...(record.paragraphs || []).flatMap(p => [p.title,p.body])].join(' ').toLowerCase();
  }
  function matches(record) {
    const q = $('wikiSearch').value.trim().toLowerCase();
    return (currentFilter === 'ALL' || record.category === currentFilter) && (!q || searchText(record).includes(q));
  }
  function stripCount(total) {return String(total).padStart(2,'0');}
  function renderList() {
    const selected = recordById(selectedId);
    const filtered = records.filter(matches);
    $('wikiCount').textContent = `${stripCount(filtered.length)} / ${stripCount(records.length)} FILES`;
    $('metricTotal').textContent = stripCount(records.length);
    $('metricCases').textContent = stripCount(records.filter(r => r.kind==='case').length);
    $('metricRedacted').textContent = stripCount(records.filter(r => r.kind==='redacted').length);
    $('wikiCards').innerHTML = filtered.length ? filtered.map((r,index)=>`
       <button type="button" class="file-row ${r.id===selected?.id?'selected':''} ${r.kind==='redacted'?'file-redacted':''}" data-file="${esc(r.id)}" aria-current="${r.id===selected?.id?'true':'false'}">
          <span class="file-row-top"><span class="file-index">${stripCount(index+1)} // ${esc(r.id)}</span><span class="file-signal">${r.kind==='redacted'?'×':r.kind==='case'?'◆':'+'}</span></span>
          <span class="file-name">${esc(r.name)}</span>
          <span class="file-sub">${r.kind==='redacted'?'[ WITHDRAWN ]':r.completeness==='EMPTY'?'[ AWAITING INTEL ]':esc(r.label.toUpperCase())}</span>
        </button>`).join('') : '<div class="no-records">NO MATCHING RECORDS. TRY ANOTHER SEARCH OR CLEAR FILTERS.</div>';
    for (const btn of $('archiveFilters').querySelectorAll('button')) {
      btn.classList.toggle('active',btn.dataset.filter===currentFilter);
      btn.setAttribute('aria-pressed',btn.dataset.filter===currentFilter?'true':'false');
    }
  }
  function makeFactGrid(r) {
    return `<div class="fact-grid">${(r.facts || []).map(([k,v])=>`<div class="fact-cell"><span>${esc(k)}</span><strong>${esc(v)}</strong></div>`).join('')}</div>`;
  }
  function sectionTitle(number,title,aux='') {
    return `<div class="data-section-head"><span>${esc(number)} // ${esc(title)}</span>${aux?`<span>${esc(aux)}</span>`:''}</div>`;
  }
  function renderOverview(r) {
    if (r.completeness === 'EMPTY') return `
      <div class="empty-transmission"><div class="empty-icon">⌁</div><span class="eyebrow">TRANSMISSION INCOMPLETE / INDEX ONLY</span><h3>NO VERIFIED FILE BODY</h3><p>${esc(r.lead)}</p><div class="empty-command">&gt; awaiting user-supplied RP intelligence<span class="cursor">_</span></div></div>
      ${sectionTitle('00','RESERVED RECORD FIELDS')}${makeFactGrid(r)}
      <div class="archive-notice">No history, affiliations, incidents or personal information have been fabricated for this entry. Edit <code>data.js</code> when you have the character details.</div>`;
    return `${sectionTitle('00','PROFILE SNAPSHOT','DECODED')}${makeFactGrid(r)}
      ${sectionTitle('01','INTELLIGENCE SUMMARY','SOURCE MATERIAL')}
      <div class="brief-grid"><div class="brief-main"><p class="record-lead">${esc(r.lead)}</p>
        ${(r.paragraphs||[]).map(p=>`<div class="brief-section"><h3>${esc(p.title)}</h3><p>${esc(p.body)}</p></div>`).join('')}</div>
        <div class="brief-sidebar"><span>ATTACHED RECORDS</span><strong>${stripCount(r.events?.length||0)}</strong><p>Chronology entries indexed from the supplied case file.</p><button type="button" class="small-action" data-tab="incidents">OPEN INCIDENT LOG ↗</button></div></div>
      ${sectionTitle('02','RECENT FILED INCIDENTS','SELECT FOR DETAILS')}
      <div class="incident-teaser">${(r.events||[]).slice(0,3).map(ev=>`<button type="button" data-tab="incidents"><span>${esc(ev[0])}</span><strong>${esc(ev[1])}</strong><em>↗</em></button>`).join('')}</div>`;
  }
  function renderIncidents(r) {
    if (!r.events?.length) return `<div class="empty-transmission"><span class="eyebrow">NO TIMELINE RECEIVED</span><h3>INCIDENT LOG EMPTY</h3><p>There are no supplied incident statements for this entry.</p></div>`;
    return `${sectionTitle('02','CHRONOLOGICAL INCIDENT LOG',`${stripCount(r.events.length)} ENTRIES`)}
      <p class="tab-intro">Each incident is extracted or paraphrased from the submitted dossier. Order follows the source listing; not all calendar dates are known.</p>
      <div class="incident-list">${r.events.map((ev,i)=>`<details class="incident-entry" ${i===0?'open':''}><summary><span class="incident-number">${esc(ev[0])}</span><span class="incident-index">${stripCount(i+1)}</span><strong>${esc(ev[1])}</strong><span class="incident-toggle">+</span></summary><p>${esc(ev[2])}</p></details>`).join('')}</div>`;
  }
  function renderConnections(r) {
    const links = r.links || [];
    return `${sectionTitle('03','SUBJECT CONNECTIONS',`${stripCount(links.length)} CROSS-REFERENCES`)}
      <p class="tab-intro">Select a linked record to jump to its dossier. These relations are drawn only from the provided case material.</p>
      ${links.length?`<div class="connection-grid">${links.map(([id,name,desc])=>`<button type="button" data-open-file="${esc(id)}" class="connection-link"><span class="connection-icon">◈</span><span><small>RELATED FILE // ${esc(id)}</small><strong>${esc(name)}</strong><em>${esc(desc)}</em></span><b>↗</b></button>`).join('')}</div>`:'<div class="empty-relations">NO VERIFIED CONNECTIONS INDEXED FOR THIS RECORD.</div>'}
      ${hasContent(r)?`<div class="source-chain"><span>REFERENCED BY PRIMARY MATERIAL</span><p>${esc(r.source || 'Archive user entry')}</p><small>Source accounts may be incomplete or contested. Do not interpret an unresolved gap as a verified fact.</small></div>`:''}`;
  }
  function renderQuestions(r) {
    const issues = r.questions || [];
    return `${sectionTitle('04','UNRESOLVED INTELLIGENCE',`${stripCount(issues.length)} OPEN`)}
      ${issues.length?`<div class="question-list">${issues.map((q,i)=>`<article class="question-row"><span>Q-${stripCount(i+1)}</span><p>${esc(q)}</p><em>OPEN</em></article>`).join('')}</div>`:`<div class="empty-relations">NO OPEN QUESTIONS IN SOURCE. RECORD BODY ${r.kind==='redacted'?'WITHDRAWN':'AWAITING INPUT'}.</div>`}
      <div class="archive-notice">Information not present in the uploaded dossier has been left unresolved rather than filled with invented dates, identities or motives.</div>`;
  }
  function renderNotes(r) {
    const notes = getNotes();
    return `<div class="notes-area">${sectionTitle('05','FIELD NOTES','DEVICE ONLY')}
      <p>Write your own RP clues or follow-up questions for this file. Notes are saved only on this browser, not shared through GitHub or visible to other users.</p>
      <label for="archiveNote">PRIVATE LOCAL NOTE // ${esc(r.id)}</label>
      <textarea id="archiveNote" rows="6" maxlength="4000" placeholder="Your observations, possible connections, future RP leads…">${esc(notes[r.id] || '')}</textarea>
      <div class="notes-actions"><button type="button" data-save-note="${esc(r.id)}">SAVE LOCAL NOTE ↓</button><span id="notesFeedback" aria-live="polite">NOT SYNCHRONISED</span></div></div>`;
  }
  function renderRedacted(r) {
    return `<div class="redaction-file">
      <div class="redaction-glitch">[ DOCUMENT RECOVERED // PAYLOAD MISSING ]</div>
      <div class="redaction-mark">×</div><div class="redaction-lines"><div></div><div></div><div></div><div></div><div></div></div>
      <h3>FILE CONTENTS WITHDRAWN</h3><p>${esc(r.lead)}</p>
      <div class="redact-meta">ERROR 0x00F / INDEX ONLY / NO BODY STORED</div>
      <button type="button" class="small-action decrypt-action" data-decrypt="true">[ >_ ] REQUEST RESTORATION</button>
      <p class="redaction-aside">The crossed-out presentation is an RP visual effect. There is no concealed biography behind this page.</p>
    </div>`;
  }
  function renderDetail() {
    const r = recordById(selectedId) || records[0];
    if (!r) return;
    const redacted = r.kind==='redacted';
    const lastHash = '#file/'+r.slug;
    $('recordPanel').classList.toggle('is-redacted',redacted);
    $('recordPanel').innerHTML = `
      <div class="record-topline"><span><i class="signal-dot"></i> ${redacted?'SIGNAL REJECTED':'DECODING COMPLETE'} / ${esc(r.id)}</span><span>OBSERVATORY // ${esc(r.category)}</span></div>
      <div class="record-banner ${redacted?'withdrawn-banner':''}">
        <div class="banner-copy"><span class="banner-eyebrow">${redacted?'[ REMOVED FROM ACTIVE RECORDS ]':`ARCHIVE / ${esc(r.label).toUpperCase()} / ${esc(r.id)}`}</span><div class="banner-title-row"><h2 class="${redacted?'crossed-title':''}">${esc(r.name)}</h2><span class="archive-seal ${redacted?'red-seal':''}">${redacted?'VOID':r.completeness==='EMPTY'?'PENDING':'SOURCE FILE'}</span></div><p>${esc(r.excerpt)}</p><div class="banner-tags"><span>${esc(r.status)}</span><span>${esc(r.clearance)}</span><span>${esc(r.completeness)}</span></div></div>
        <div class="banner-art" aria-hidden="true"><div class="art-circle"></div><div class="art-cross"></div><div class="art-character">${redacted?'✕':r.kind==='case'?'◈':r.completeness==='EMPTY'?'?':'⌁'}</div><span>${esc(r.id)}</span></div>
      </div>
      <div class="file-toolbar"><div class="file-path">ROOT / VAULT / <span>${esc(r.slug.toUpperCase())}</span></div><div class="file-buttons"><button type="button" data-copy-file="${esc(r.id)}">⧉ COPY ID</button><button type="button" data-scan="true">◉ RUN SCAN</button></div></div>
      <div id="scanReadout" class="scan-readout" role="status">${redacted?'FILE BODY UNAVAILABLE':'FILE INTEGRITY: '+esc(r.completeness)} <span>// ${esc(r.id)}</span></div>
      ${redacted?renderRedacted(r):`<div class="record-tabs" role="tablist" aria-label="Dossier sections">${[['overview','OVERVIEW'],['incidents','INCIDENT LOG'],['connections','CONNECTIONS'],['questions','OPEN QUESTIONS'],['notes','FIELD NOTES']].map(([key,label])=>`<button type="button" role="tab" aria-selected="${selectedTab===key?'true':'false'}" class="${selectedTab===key?'active':''}" data-tab="${key}">${label}</button>`).join('')}</div>
      <div class="tab-body" role="tabpanel">${selectedTab==='overview'?renderOverview(r):selectedTab==='incidents'?renderIncidents(r):selectedTab==='connections'?renderConnections(r):selectedTab==='questions'?renderQuestions(r):renderNotes(r)}</div>`}
      <div class="record-bottom"><span>${redacted?'INDEX SURVIVED / SOURCE LOST':esc(r.source||'NO SOURCE DOSSIER ATTACHED')}</span><span>EOF // ${esc(r.id)}</span></div>`;
    const currentHash = location.hash;
    if (currentHash !== lastHash) history.replaceState(null,'',lastHash);
  }
  function select(id, options={}) {
    const r = recordById(id); if (!r) return false;
    selectedId = r.id; selectedTab='overview';
    renderList(); renderDetail();
    if (options.scroll) {
      const panel=$('recordPanel'); if (panel) panel.scrollIntoView({behavior:'smooth',block:'start'});
    }
    return true;
  }
  function openByName(input) {
    const text = input.trim().toLowerCase();
    if (!text) return null;
    return records.find(r => r.id.toLowerCase()===text || r.slug===text || r.name.toLowerCase()===text)
      || records.find(r => r.name.toLowerCase().includes(text) || r.slug.includes(text));
  }
  function terminalCommand(raw, emit) {
    const parts = raw.trim().split(/\s+/), cmd=(parts.shift()||'').toLowerCase(), arg=parts.join(' ');
    if (cmd==='help') {emit('COMMANDS: help | list | open <name> | search <text> | scan | status | exit | logout', 'success'); emit('EXAMPLE: open tiffy // open TFD-COMB // search Hazel'); return true;}
    if (cmd==='list' || cmd==='files') {records.forEach(r=>emit(`${r.id.padEnd(12)} ${r.kind==='redacted'?'[REDACTED]':r.completeness==='EMPTY'?'[UNFILED]  ':'[ACTIVE]   '} ${r.name}`));return true;}
    if (cmd==='open') {
      const r = openByName(arg); if (!r) {emit(`NO FILE MATCHES: ${arg || '[missing target]'}`,'error');return true;}
      select(r.id); emit(`${r.id} // ${r.kind==='redacted'?'FILE BODY WITHDRAWN':'FILE OPENED IN VIEWER'}`,r.kind==='redacted'?'error':'success'); return true;
    }
    if (cmd==='search') { $('wikiSearch').value=arg; currentFilter='ALL'; renderList(); emit(`${records.filter(matches).length} FILE(S) MATCH QUERY: ${arg || 'ALL'}`,'success');return true;}
    if (cmd==='scan') {const r=recordById(selectedId); emit(`${r.id} -> ${r.kind==='redacted'?'NO RECOVERABLE BODY':r.completeness==='EMPTY'?'AWAITING INTEL':'SOURCE FILE INDEXED / '+(r.events?.length||0)+' INCIDENTS'}`,r.kind==='redacted'?'error':'success');return true;}
    if (cmd==='status') {emit(`ARCHIVE ONLINE // ${records.length} FILES // ${records.filter(r=>r.kind==='redacted').length} WITHDRAWN // DEVICE-LOCAL ACCOUNT`,'success');return true;}
    if (cmd==='logout') { $('logoutButton').click(); $('closeTerminal').click(); emit('LOCAL SESSION ENDED.','muted');return true; }
    return false;
  }
  function render(alias) {
    $('wikiAlias').textContent = alias || 'OPERATIVE';
    if (!archiveReady) {
      archiveReady=true;
      const slug=(location.hash.match(/^#file\/(.+)$/)||[])[1];
      const deep=records.find(r=>r.slug===slug); if(deep) selectedId=deep.id;
      $('archiveLocalClock').textContent='SESSION / '+new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'}).toUpperCase();
    }
    renderList(); renderDetail();
  }
  $('archiveFilters')?.addEventListener('click',e=>{
    const b=e.target.closest('[data-filter]'); if(!b)return; currentFilter=b.dataset.filter; renderList();
  });
  $('wikiSearch')?.addEventListener('input',renderList);
  $('wikiCards')?.addEventListener('click',e=>{const b=e.target.closest('[data-file]');if(b)select(b.dataset.file,{scroll:window.innerWidth<1050});});
  $('recordPanel')?.addEventListener('click',async e=>{
    const b=e.target.closest('button');if(!b)return;
    if(b.dataset.tab){selectedTab=b.dataset.tab;renderDetail();return;}
    if(b.dataset.openFile){select(b.dataset.openFile,{scroll:window.innerWidth<1050});return;}
    if(b.hasAttribute('data-decrypt')){flash('FILE PURGED','NO RECOVERABLE DATA FOUND // ACCESS DENIED');return;}
    if(b.dataset.saveNote){const txt=$('archiveNote')?.value||'';const ok=setNotes(b.dataset.saveNote,txt);if($('notesFeedback'))$('notesFeedback').textContent=ok?'SAVED ON THIS DEVICE':'LOCAL STORAGE UNAVAILABLE';noteToast(ok?'Field note saved on this browser.':'Could not save note. Check local storage settings.');return;}
    if(b.dataset.copyFile){try {await navigator.clipboard.writeText(b.dataset.copyFile);noteToast(`Copied file ID: ${b.dataset.copyFile}`);}catch{noteToast(`File ID: ${b.dataset.copyFile} (copy manually)`);}return;}
    if(b.hasAttribute('data-scan')){ const r=recordById(selectedId);const output=$('scanReadout');if(!output)return;output.textContent='SCANNING ARCHIVE INDEX // PLEASE STAND BY';output.classList.add('scanning');setTimeout(()=>{if(!$('scanReadout')||selectedId!==r.id)return;output.textContent=r.kind==='redacted'?'SCAN ERROR: NO RECOVERABLE PAYLOAD':r.completeness==='EMPTY'?'SCAN COMPLETE: INDEX ONLY // AWAITING INTEL':`SCAN COMPLETE: ${r.events?.length||0} CHRONOLOGY ENTRIES / RECORD STATUS ${r.completeness}`;output.classList.remove('scanning');},850);}
  });
  $('sidebarConsole')?.addEventListener('click',()=> $('archiveTerminal')?.click());
  window.addEventListener('keydown',e=>{
    const wiki=$('wikiView');if (!wiki || wiki.classList.contains('hidden'))return;
    if(e.key==='/' && $('terminalModal').classList.contains('hidden') && !['INPUT','TEXTAREA'].includes(document.activeElement?.tagName) && !e.metaKey && !e.ctrlKey){e.preventDefault();$('wikiSearch').focus();}
  });
  window.addEventListener('hashchange',()=>{
    if($('wikiView')?.classList.contains('hidden'))return;
    const slug=(location.hash.match(/^#file\/(.+)$/)||[])[1];const r=records.find(x=>x.slug===slug);if(r&&r.id!==selectedId)select(r.id);
  });
  window.ObservatoryArchive={render,select,terminalCommand,records};
})();
