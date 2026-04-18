// ============================================================
// app.js [MODIFIABLE]
// Contient : init, swipe, event bindings, modales, tabs
// Dépend de : core.js, audio.js, render.js, data.js
// ============================================================

// ── Swipe (isolé de #scene-btns pour ne pas bloquer micro/play) ──
((() => {
  const sc = document.getElementById('sc');
  sc.addEventListener('pointerdown', e => {
    if (e.button && e.button !== 0) return;
    if (e.target.closest('#scene-btns')) return; // laisser mic/play recevoir leurs clics
    ptX = e.clientX; ptY = e.clientY; ptDn = true; drg = false; drgCx = false; cdx = 0;
  }, { passive: true });
  sc.addEventListener('pointermove', e => {
    if (!ptDn || drgCx) return;
    const dx = e.clientX - ptX, dy = e.clientY - ptY;
    if (!drg) {
      if (Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) { drgCx = true; ptDn = false; resetDrag(); return; }
      if (Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) drg = true;
    }
    if (drg) { cdx = dx; applyDrag(dx); }
  }, { passive: true });
  sc.addEventListener('pointerup', e => {
    if (!ptDn) return; ptDn = false;
    const dx = e.clientX - ptX, dy = e.clientY - ptY;
    if (!drg) { resetDrag(); if (Math.abs(dx) < 12 && Math.abs(dy) < 12) doFlip(); drg = false; return; }
    drg = false;
    if (cdx > 88) completeDrag(true);
    else if (cdx < -88) completeDrag(false);
    else resetDrag();
  }, { passive: true });
  sc.addEventListener('pointercancel', () => { ptDn = false; drg = false; resetDrag(); }, { passive: true });
})());

// ── Navigation ──
document.getElementById('pbb').onclick = () => navC(-1);
document.getElementById('nbb').onclick = () => navC(1);

// ── Shuffle toggle ──
document.getElementById('shufb').addEventListener('click', () => {
  shuffleOn = !shuffleOn;
  document.getElementById('shufb').classList.toggle('on', shuffleOn);
  rebuildPool(); cur = 0; fl = false; sd = rsd(); renderQuiz();
});

// ── Clavier (desktop) ──
document.addEventListener('keydown', e => {
  if (activeTab !== 'quiz') return;
  if (e.key === 'ArrowLeft') navC(-1);
  else if (e.key === 'ArrowRight') navC(1);
  else if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); doFlip(); }
  else if (e.key === 'k' || e.key === 'K') completeDrag(true);
  else if (e.key === 'j' || e.key === 'J') completeDrag(false);
});

// ── Micro + Play ──
document.getElementById('btn-mic').addEventListener('click', () => toggleRec());
document.getElementById('btn-play').addEventListener('click', () => togglePlay());

// ── Cats toggle + ajouter catégorie ──
document.getElementById('cats-toggle-btn').addEventListener('click', () => {
  catsExpanded = !catsExpanded;
  const cats = document.getElementById('quiz-cats');
  cats.className = 'cats ' + (catsExpanded ? 'expanded' : 'collapsed');
  document.getElementById('cats-toggle-btn').textContent = catsExpanded ? '▲ Réduire' : '▼ Voir toutes';
});
document.getElementById('open-cat-mo').addEventListener('click', openCatMo);

// ── Édition ──
document.getElementById('srch').addEventListener('input', e => { editSearch = e.target.value; renderEdit(); });

function deleteCard(id) {
  if (!confirm('Supprimer cette carte ?')) return;
  S.custom = S.custom.filter(c => c.id !== id);
  S.unk = S.unk.filter(x => x !== id);
  saveState(); rebuildPool(); renderQuiz(); renderEdit();
}
function resetCard(id) {
  if (!confirm('Réinitialiser à la version originale ?')) return;
  delete S.overrides[id];
  saveState(); rebuildPool(); renderQuiz(); renderEdit();
}

// ── Modale carte ──
let cmoMode = 'add', cmoEditId = null;
let nextCustomId = DATA.length + 1000;

function buildChips(selCat) {
  let h = '';
  for (const [k, v] of Object.entries(getCM())) {
    if (k === 'alphabet') continue;
    h += `<div class="chip${selCat === k ? ' sel' : ''}" data-c="${k}">${v.l}</div>`;
  }
  document.getElementById('cmo-chips').innerHTML = h;
  document.querySelectorAll('#cmo-chips .chip').forEach(ch => {
    ch.onclick = () => { document.querySelectorAll('#cmo-chips .chip').forEach(x => x.classList.remove('sel')); ch.classList.add('sel'); };
  });
}

function openAddCard() {
  cmoMode = 'add'; cmoEditId = null;
  document.getElementById('cmo-title').textContent = 'Nouvelle carte';
  document.getElementById('cmo-save').textContent = 'Ajouter';
  document.getElementById('cmo-del').classList.add('hidden');
  document.getElementById('cmo-fr').value = '';
  document.getElementById('cmo-d').value = '';
  document.getElementById('cmo-a').value = '';
  buildChips('');
  document.getElementById('card-mo').classList.add('open');
  setTimeout(() => document.getElementById('cmo-fr').focus(), 120);
}

function openEditCard(id) {
  const c = allCards().find(x => x.id === id); if (!c) return;
  cmoMode = 'edit'; cmoEditId = id;
  document.getElementById('cmo-title').textContent = 'Modifier la carte';
  document.getElementById('cmo-save').textContent = 'Enregistrer';
  document.getElementById('cmo-del').classList.toggle('hidden', !c.custom);
  document.getElementById('cmo-fr').value = c.fr || '';
  document.getElementById('cmo-d').value = c.d || '';
  document.getElementById('cmo-a').value = c.a || '';
  buildChips(c.cat || '');
  document.getElementById('card-mo').classList.add('open');
  setTimeout(() => document.getElementById('cmo-fr').focus(), 120);
}

function closeCardMo() { document.getElementById('card-mo').classList.remove('open'); }

function saveCard() {
  const fr = document.getElementById('cmo-fr').value.trim();
  const d = document.getElementById('cmo-d').value.trim();
  const a = document.getElementById('cmo-a').value.trim();
  if (!fr || !d) {
    const el = !fr ? document.getElementById('cmo-fr') : document.getElementById('cmo-d');
    el.style.outline = '1.5px solid var(--rev)'; setTimeout(() => el.style.outline = '', 1200); return;
  }
  const selChip = document.querySelector('#cmo-chips .chip.sel');
  const cat = selChip ? selChip.dataset.c : 'autres';
  if (cmoMode === 'add') {
    S.custom.push({ id: nextCustomId++, cat, fr, d, a, p: '', n: '', custom: true });
  } else {
    const orig = DATA.find(x => x.id === cmoEditId);
    if (orig) {
      const ov = {};
      if (fr !== orig.fr) ov.fr = fr; if (d !== orig.d) ov.d = d;
      if (a !== orig.a) ov.a = a; if (cat !== orig.cat) ov.cat = cat;
      if (Object.keys(ov).length) S.overrides[cmoEditId] = ov; else delete S.overrides[cmoEditId];
    } else {
      const idx = S.custom.findIndex(x => x.id === cmoEditId);
      if (idx >= 0) S.custom[idx] = { ...S.custom[idx], fr, d, a, cat };
    }
  }
  saveState(); closeCardMo(); rebuildPool(); renderQuiz(); renderEdit();
}

document.getElementById('cmo-save').onclick = saveCard;
document.getElementById('cmo-cancel').onclick = closeCardMo;
document.getElementById('cmo-close').onclick = closeCardMo;
document.getElementById('cmo-del').onclick = () => { deleteCard(cmoEditId); closeCardMo(); };
document.getElementById('card-mo').addEventListener('click', e => { if (e.target === document.getElementById('card-mo')) closeCardMo(); });
document.getElementById('fab-quiz').onclick = openAddCard;

// ── Ressources ──
document.getElementById('res-edit-toggle').onclick = toggleResEdit;

function deleteRes(id) {
  if (!confirm('Supprimer ce lien ?')) return;
  S.resCustom = S.resCustom.filter(r => r.id !== id);
  for (const sec of Object.keys(S.resOrder || {})) S.resOrder[sec] = (S.resOrder[sec] || []).filter(x => x !== id);
  saveState(); renderRes(); if (resEditMode) bindResDrag();
}

let rmoMode = 'add', rmoEditId = null, nextResId = 2000;

function buildSecChips(sel) {
  let h = '';
  for (const [k, v] of Object.entries(RES_SECTIONS)) h += `<div class="sc2${sel === k ? ' sel' : ''}" data-k="${k}">${v.l}</div>`;
  document.getElementById('rmo-sec').innerHTML = h;
  document.querySelectorAll('#rmo-sec .sc2').forEach(c => { c.onclick = () => { document.querySelectorAll('#rmo-sec .sc2').forEach(x => x.classList.remove('sel')); c.classList.add('sel'); }; });
}

function openAddRes() {
  rmoMode = 'add'; rmoEditId = null;
  document.getElementById('rmo-title').textContent = 'Nouveau lien';
  document.getElementById('rmo-save').textContent = 'Ajouter';
  document.getElementById('rmo-del').classList.add('hidden');
  document.getElementById('rmo-name').value = '';
  document.getElementById('rmo-url').value = '';
  document.getElementById('rmo-desc').value = '';
  buildSecChips('podcasts');
  document.getElementById('res-mo').classList.add('open');
  setTimeout(() => document.getElementById('rmo-name').focus(), 100);
}

function openEditRes(id) {
  const r = allResLinks().find(x => x.id === id); if (!r) return;
  rmoMode = 'edit'; rmoEditId = id;
  document.getElementById('rmo-title').textContent = 'Modifier le lien';
  document.getElementById('rmo-save').textContent = 'Enregistrer';
  document.getElementById('rmo-del').classList.toggle('hidden', !r.custom);
  document.getElementById('rmo-name').value = r.name || '';
  document.getElementById('rmo-url').value = r.url || '';
  document.getElementById('rmo-desc').value = r.desc || '';
  buildSecChips(r.sec || 'podcasts');
  document.getElementById('res-mo').classList.add('open');
}

function closeResMo() { document.getElementById('res-mo').classList.remove('open'); }

function saveRes() {
  const name = document.getElementById('rmo-name').value.trim();
  const url = document.getElementById('rmo-url').value.trim();
  const desc = document.getElementById('rmo-desc').value.trim();
  if (!name || !url) {
    const el = !name ? document.getElementById('rmo-name') : document.getElementById('rmo-url');
    el.style.outline = '1.5px solid var(--rev)'; setTimeout(() => el.style.outline = '', 1200); return;
  }
  const selSec = document.querySelector('#rmo-sec .sc2.sel');
  const sec = selSec ? selSec.dataset.k : 'autres';
  if (rmoMode === 'add') {
    S.resCustom.push({ id: 'rc' + (nextResId++), sec, name, url, desc, custom: true });
  } else {
    const idx = S.resCustom.findIndex(x => x.id === rmoEditId);
    if (idx >= 0) S.resCustom[idx] = { ...S.resCustom[idx], name, url, desc, sec };
  }
  saveState(); closeResMo(); renderRes(); if (resEditMode) bindResDrag();
}

document.getElementById('rmo-save').onclick = saveRes;
document.getElementById('rmo-cancel').onclick = closeResMo;
document.getElementById('rmo-close').onclick = closeResMo;
document.getElementById('rmo-del').onclick = () => { deleteRes(rmoEditId); closeResMo(); };
document.getElementById('res-mo').addEventListener('click', e => { if (e.target === document.getElementById('res-mo')) closeResMo(); });
document.getElementById('fab-res').onclick = openAddRes;

// ── Modale catégorie ──
const CAT_COLORS = [
  {bg:'#E2F5EF',c:'#2D6B4A'},{bg:'#FAF0E8',c:'#7A3B1A'},{bg:'#FDF4E0',c:'#7A5C1A'},
  {bg:'#F6ECF8',c:'#6B2D72'},{bg:'#FFF0F0',c:'#8C2020'},{bg:'#EAF4FF',c:'#1A4A7A'},
  {bg:'#F0F8EE',c:'#2A5C20'},{bg:'#FDF8EE',c:'#7A5E10'},{bg:'#EAF1FB',c:'#1E3D7A'},
  {bg:'#FFF6E8',c:'#7A4A10'},{bg:'#FDF0F8',c:'#7A1A5C'},{bg:'#EEFAF5',c:'#1A6B4A'},
  {bg:'#F0F4FF',c:'#2A3A7A'},{bg:'#FFF8E8',c:'#7A6010'},{bg:'#F5FAEC',c:'#3A6010'},
];
let selCatColor = 0;

function openCatMo() {
  if (!S.customCats) S.customCats = [];
  document.getElementById('catmo-name').value = '';
  selCatColor = 0;
  const cc = document.getElementById('catmo-colors');
  cc.innerHTML = CAT_COLORS.map((col, i) =>
    `<div class="cc${i === 0 ? ' sel' : ''}" style="background:${col.bg};border-color:${i === 0 ? col.c : 'transparent'}" data-i="${i}"></div>`
  ).join('');
  cc.querySelectorAll('.cc').forEach(el => {
    el.addEventListener('click', () => {
      selCatColor = +el.dataset.i;
      cc.querySelectorAll('.cc').forEach((x, j) => { x.classList.toggle('sel', j === selCatColor); x.style.borderColor = j === selCatColor ? CAT_COLORS[j].c : 'transparent'; });
    });
  });
  renderCatList();
  document.getElementById('cat-mo').classList.add('open');
  setTimeout(() => document.getElementById('catmo-name').focus(), 120);
}

function renderCatList() {
  const list = document.getElementById('catmo-list');
  if (!(S.customCats || []).length) { list.innerHTML = '<p style="font-size:10px;color:var(--muted);text-align:center;padding:.4rem 0">Aucune catégorie personnalisée</p>'; return; }
  list.innerHTML = S.customCats.map(cc => `
    <div class="custom-cat-item">
      <div class="cci-dot" style="background:${cc.bg};border:.5px solid ${cc.c}"></div>
      <span class="cci-name">${cc.name}</span>
      <button class="cci-del" data-ccid="${cc.id}">🗑</button>
    </div>`).join('');
  list.querySelectorAll('.cci-del').forEach(btn => { btn.addEventListener('click', () => deleteCat(btn.dataset.ccid)); });
}

function addCat() {
  const name = document.getElementById('catmo-name').value.trim();
  if (!name) return;
  const col = CAT_COLORS[selCatColor];
  const id = 'cc_' + Date.now();
  if (!S.customCats) S.customCats = [];
  S.customCats.push({ id, name, bg: col.bg, c: col.c });
  saveState();
  document.getElementById('catmo-name').value = '';
  renderCatList(); renderQuiz(); renderEdit();
}

function deleteCat(id) {
  if (!confirm('Supprimer cette catégorie ? Les cartes associées iront dans "Autres".')) return;
  S.customCats = (S.customCats || []).filter(cc => cc.id !== id);
  S.custom = S.custom.map(c => c.cat === id ? { ...c, cat: 'autres' } : c);
  if (S.af === id) S.af = 'all';
  saveState(); renderCatList(); rebuildPool(); renderQuiz(); renderEdit();
}

function closeCatMo() { document.getElementById('cat-mo').classList.remove('open'); }
document.getElementById('catmo-close').onclick = closeCatMo;
document.getElementById('catmo-add').onclick = addCat;
document.getElementById('cat-mo').addEventListener('click', e => { if (e.target === document.getElementById('cat-mo')) closeCatMo(); });

// ── Modale sync ──
function closeSyncMo() { document.getElementById('sync-mo').classList.remove('open'); }
document.getElementById('sync-btn').onclick = () => document.getElementById('sync-mo').classList.add('open');
document.getElementById('smo-close').onclick = closeSyncMo;
document.getElementById('sync-mo').addEventListener('click', e => { if (e.target === document.getElementById('sync-mo')) closeSyncMo(); });
document.getElementById('smo-export').onclick = exportData;
document.getElementById('smo-export-audio').onclick = exportDataWithAudio;
document.getElementById('smo-import-inp').addEventListener('change', e => { if (e.target.files[0]) importData(e.target.files[0]); });
document.getElementById('smo-reset').onclick = resetData;

// ── Tabs ──
let activeTab = 'quiz';
document.querySelectorAll('.tab').forEach(t => {
  t.onclick = () => {
    stopAudioState();
    activeTab = t.dataset.t;
    document.querySelectorAll('.tab').forEach(x => x.classList.toggle('on', x === t));
    document.querySelectorAll('.scr').forEach(s => s.classList.toggle('on', s.id === 'scr-' + activeTab));
    document.getElementById('fab-quiz').classList.toggle('hidden', activeTab !== 'quiz');
    document.getElementById('fab-res').classList.toggle('hidden', activeTab !== 'res');
    if (activeTab === 'edit') renderEdit();
    if (activeTab === 'res') renderRes();
  };
});

// ── Init ──
loadState();
loadRecs();
if (!S.knows) S.knows = [];
if (!S.customCats) S.customCats = [];
rebuildPool();
if (cur >= pool.length) cur = 0;
sd = rsd();
renderQuiz();
updateSceneBtns();
