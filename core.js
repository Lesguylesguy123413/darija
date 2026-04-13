// ============================================================
// 🔒 BLOC-CORE — core.js [VERROUILLÉ]
// Contient : state S, localStorage, rebuildPool, completeDrag,
//            setF, navC, doFlip, allCards, getCM, shuffle
// ⚠️ Ne pas modifier sans accord explicite
// Dépend de : data.js (CM, DATA, RES_DEFAULT)
// ============================================================

// ── State ──
const LS = 'darija_v2';
let S = {
  unk: [],          // IDs des cartes "à revoir"
  knows: [],        // IDs des cartes "je sais"
  favs: [],         // IDs des cartes favorites
  overrides: {},    // Modifications des cartes de base {id: {fr,d,a,cat}}
  custom: [],       // Cartes créées par l'utilisateur
  af: 'all',        // Filtre actif
  resCustom: [],    // Ressources ajoutées par l'utilisateur
  resOrder: {},     // Ordre des ressources par section
  customCats: [],   // Catégories créées par l'utilisateur
};
let catsExpanded = false;

function loadState() {
  try { const r = localStorage.getItem(LS); if (r) Object.assign(S, JSON.parse(r)); } catch(e) {}
}
function saveState() {
  try { localStorage.setItem(LS, JSON.stringify(S)); } catch(e) {}
}

function importData(file) {
  const r = new FileReader();
  r.onload = e => {
    try {
      const p = JSON.parse(e.target.result);
      if (p._recs) { recs = p._recs; saveRecs(); delete p._recs; }
      Object.assign(S, p);
      saveState(); rebuildPool(); fl = false; sd = rsd();
      renderQuiz(); renderEdit(); renderRes();
      closeSyncMo();
      setTimeout(() => alert('✅ Données importées avec succès !'), 100);
    } catch(err) { alert('❌ Fichier invalide.'); }
  };
  r.readAsText(file);
}

function resetData() {
  if (!confirm('Réinitialiser TOUTES les données ?\n(progression, cartes perso, ressources ajoutées)\n\nCette action est irréversible.')) return;
  localStorage.removeItem(LS);
  S = { unk: [], knows: [], favs: [], overrides: {}, custom: [], af: 'all', resCustom: [], resOrder: {}, customCats: [] };
  rebuildPool(); fl = false; sd = rsd();
  renderQuiz(); renderEdit(); renderRes(); closeSyncMo();
}

// ── Export (data: URI — requis pour Android, ne pas remplacer par createObjectURL) ──
function _downloadJSON(data, filename) {
  const uri = 'data:application/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(data, null, 2));
  const a = document.createElement('a');
  a.href = uri; a.download = filename;
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
}
function exportData() {
  _downloadJSON(S, 'darija_sauvegarde_' + new Date().toISOString().slice(0, 10) + '.json');
}
function exportDataWithAudio() {
  _downloadJSON(Object.assign({}, S, { _recs: recs }), 'darija_complet_' + new Date().toISOString().slice(0, 10) + '.json');
}

// ── Helpers cartes ──
function allCards() {
  return [
    ...DATA.map(c => S.overrides[c.id] ? { ...c, ...S.overrides[c.id] } : c),
    ...S.custom,
  ];
}
function getCM() {
  const m = { ...CM };
  (S.customCats || []).forEach(cc => { m[cc.id] = { l: cc.name, bg: cc.bg, c: cc.c }; });
  return m;
}

// ── Quiz state ──
let pool = [], cur = 0, fl = false, sd = 'fr';
let ptX = 0, ptY = 0, ptDn = false, drg = false, drgCx = false, cdx = 0;
let shuffleOn = false;

function rsd() { return Math.random() > .5 ? 'fr' : 'd'; }
function shuf(a) { for (let i = a.length - 1; i > 0; i--) { const j = 0 | Math.random() * (i + 1); [a[i], a[j]] = [a[j], a[i]]; } return a; }

function rebuildPool() {
  const all = allCards();
  const unkSet = new Set(S.unk);
  const favSet = new Set(S.favs || []);
  const knowsSet = new Set(S.knows || []);
  if (S.af === 'all')       pool = [...all];
  else if (S.af === 'review')  pool = all.filter(x => unkSet.has(x.id));
  else if (S.af === 'favoris') pool = all.filter(x => favSet.has(x.id));
  else if (S.af === 'knows')   pool = all.filter(x => knowsSet.has(x.id));
  else                         pool = all.filter(x => x.cat === S.af);
  if (shuffleOn) shuf(pool);
}

// ⚠️ setF NE DOIT JAMAIS ÊTRE SUPPRIMÉE — utilisée par tous les boutons onclick de catégorie
function setF(f) { S.af = f; rebuildPool(); cur = 0; fl = false; sd = rsd(); saveState(); renderQuiz(); }

function applyDrag(dx) {
  const ci = document.getElementById('ci'); if (!ci) return;
  const base = fl ? 180 : 0;
  ci.style.transition = 'none';
  ci.style.transform = `translateX(${dx}px) rotateY(${base}deg) rotateZ(${dx * .026 * (fl ? -1 : 1)}deg)`;
  document.getElementById('slk').style.opacity = dx > 35 ? Math.min(1, (dx - 35) / 60) : '0';
  document.getElementById('slr').style.opacity = dx < -35 ? Math.min(1, (-dx - 35) / 60) : '0';
}
function resetDrag() {
  const ci = document.getElementById('ci'); if (!ci) return;
  ci.style.transition = 'transform .38s cubic-bezier(.25,.8,.25,1)';
  ci.style.transform = fl ? 'rotateY(180deg)' : 'rotateY(0deg)';
  document.getElementById('slk').style.opacity = '0';
  document.getElementById('slr').style.opacity = '0';
}

// 🔒 completeDrag — gère knows/unk/favs, ne pas modifier
function completeDrag(know) {
  if (!pool.length) return;
  const c = pool[cur];
  if (!S.knows) S.knows = [];
  if (!S.unk) S.unk = [];
  if (know) {
    S.unk = S.unk.filter(x => x !== c.id);
    if (!S.knows.includes(c.id)) S.knows.push(c.id);
  } else {
    if (!S.unk.includes(c.id)) S.unk.push(c.id);
    S.knows = S.knows.filter(x => x !== c.id);
  }
  saveState();
  const ci = document.getElementById('ci'); if (!ci) return;
  const out = know ? 580 : -580, base = fl ? 180 : 0;
  ci.style.transition = 'transform .2s ease-in,opacity .2s';
  ci.style.transform = `translateX(${out}px) rotateY(${base}deg) rotateZ(${know ? 12 : -12}deg)`;
  ci.style.opacity = '0';
  setTimeout(() => {
    stopAudioState();
    rebuildPool();
    if ((S.af === 'review' && know) || (S.af === 'knows' && !know)) {
      if (!pool.length) { cur = 0; fl = false; sd = rsd(); renderQuiz(); return; }
      if (cur >= pool.length) cur = pool.length - 1;
    } else if (pool.length) cur = (cur + 1) % pool.length;
    fl = false; sd = rsd(); renderQuiz();
  }, 210);
}

function doFlip() {
  fl = !fl;
  const ci = document.getElementById('ci'); if (!ci) return;
  ci.style.transition = 'transform .42s cubic-bezier(.25,.8,.25,1)';
  ci.style.transform = fl ? 'rotateY(180deg)' : 'rotateY(0deg)';
  const isFRH = sd === 'fr';
  document.getElementById('hint').textContent = fl
    ? (isFRH ? 'Côté darija · tapez pour revenir' : 'Côté français · tapez pour revenir')
    : (isFRH ? 'Côté français · tapez pour le darija' : 'Côté darija · tapez pour le français');
}

function navC(dir) {
  if (!pool.length) return;
  stopAudioState();
  if (dir < 0 && cur > 0) { cur--; fl = false; sd = rsd(); renderQuiz(); }
  else if (dir > 0 && cur < pool.length - 1) { cur++; fl = false; sd = rsd(); renderQuiz(); }
}
