// ============================================================
// 🔒 BLOC-AUDIO — audio.js [VERROUILLÉ]
// Contient : enregistrement vocal (MediaRecorder), lecture,
//            updateSceneBtns, loadRecs, saveRecs
// ⚠️ Ne pas modifier sans accord explicite
// Dépend de : core.js (curCardId, pool, cur)
// ============================================================

const LS_REC = 'darija_recs_v1';
let recs = {};
let _mediaRec = null, _recChunks = [], _recActive = false;
let _playAudio = null, _playActive = false;

function loadRecs() {
  try { const r = localStorage.getItem(LS_REC); if (r) recs = JSON.parse(r); } catch(e) {}
}
function saveRecs() {
  try {
    localStorage.setItem(LS_REC, JSON.stringify(recs));
  } catch(e) {
    alert("⚠️ Stockage plein !\nVos enregistrements ne peuvent plus être sauvegardés.\nUtilisez le menu Sync → Exporter avec audios pour libérer de l'espace.");
  }
}

function curCardId() { return pool.length ? String(pool[cur].id) : null; }

// ── SVG Icons ──
const ICO_MIC_IDLE = `<rect x="8" y="2" width="6" height="10" rx="3" fill="currentColor"/><path d="M4.5 10.5a6.5 6.5 0 0013 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="11" y1="17" x2="11" y2="20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="7.5" y1="20" x2="14.5" y2="20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>`;
const ICO_MIC_REC  = `<rect x="8" y="2" width="6" height="10" rx="3" fill="currentColor"/><path d="M4.5 10.5a6.5 6.5 0 0013 0" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="11" y1="17" x2="11" y2="20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="7.5" y1="20" x2="14.5" y2="20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="2" y1="10.5" x2="4" y2="10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="18" y1="10.5" x2="20" y2="10.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><line x1="3" y1="7.5" x2="4.8" y2="8.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/><line x1="19" y1="7.5" x2="17.2" y2="8.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>`;
const ICO_PLAY  = `<circle cx="11" cy="11" r="10" stroke="currentColor" stroke-width="1.3"/><path d="M9 8l6 3-6 3V8z" fill="currentColor"/>`;
const ICO_PAUSE = `<circle cx="11" cy="11" r="10" stroke="currentColor" stroke-width="1.3"/><rect x="7.5" y="7.5" width="2.5" height="7" rx="1" fill="currentColor"/><rect x="12" y="7.5" width="2.5" height="7" rx="1" fill="currentColor"/>`;

function updateSceneBtns() {
  const id = curCardId();
  const hasRec = id !== null && !!recs[id];
  const pb = document.getElementById('btn-play');
  const mb = document.getElementById('btn-mic');
  const ip = document.getElementById('ico-play');
  const im = document.getElementById('ico-mic');
  if (!pb || !mb) return;
  pb.classList.toggle('no-rec', !hasRec);
  pb.title = hasRec ? (_playActive ? 'Pause' : 'Jouer mon enregistrement') : 'Aucun enregistrement';
  if (ip) ip.innerHTML = _playActive ? ICO_PAUSE : ICO_PLAY;
  mb.classList.toggle('recording', _recActive);
  mb.title = _recActive ? "Arrêter l'enregistrement" : 'Enregistrer ma voix';
  if (im) im.innerHTML = _recActive ? ICO_MIC_REC : ICO_MIC_IDLE;
}

// ── Enregistrement ──
function toggleRec() { if (_recActive) { stopRec(); } else { startRec(); } }

function startRec() {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    alert('Microphone non disponible sur ce navigateur.'); return;
  }
  if (_playActive) stopPlay();
  navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    _recChunks = [];
    const mime = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
      ? 'audio/webm;codecs=opus'
      : MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/ogg';
    _mediaRec = new MediaRecorder(stream, { mimeType: mime });
    _mediaRec.ondataavailable = e => { if (e.data && e.data.size > 0) _recChunks.push(e.data); };
    _mediaRec.onstop = () => {
      const blob = new Blob(_recChunks, { type: _mediaRec.mimeType });
      const reader = new FileReader();
      reader.onloadend = () => {
        const id = curCardId(); if (!id) return;
        recs[id] = reader.result;
        saveRecs();
        _recActive = false;
        stream.getTracks().forEach(t => t.stop());
        updateSceneBtns();
      };
      reader.readAsDataURL(blob);
    };
    _mediaRec.start();
    _recActive = true;
    updateSceneBtns();
  })
  .catch(err => { alert("Accès au microphone refusé.\n(" + err.message + ")"); });
}

function stopRec() {
  if (_mediaRec && _mediaRec.state !== 'inactive') { _mediaRec.stop(); }
}

// ── Lecture ──
function togglePlay() { if (_playActive) { stopPlay(); } else { startPlay(); } }

function startPlay() {
  const id = curCardId(); if (!id || !recs[id]) return;
  if (_recActive) return;
  if (_playAudio) { _playAudio.pause(); _playAudio = null; }
  _playAudio = new Audio(recs[id]);
  _playAudio.onended = () => { _playActive = false; _playAudio = null; updateSceneBtns(); };
  _playAudio.onerror = () => { _playActive = false; _playAudio = null; updateSceneBtns(); };
  _playAudio.play().then(() => { _playActive = true; updateSceneBtns(); }).catch(() => {});
}

function stopPlay() {
  if (_playAudio) { _playAudio.pause(); _playAudio = null; }
  _playActive = false;
  updateSceneBtns();
}

function stopAudioState() {
  if (_recActive) stopRec();
  if (_playActive) stopPlay();
}
