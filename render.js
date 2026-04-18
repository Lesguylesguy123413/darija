// ============================================================
// render.js [MODIFIABLE avec précaution]
// Contient : renderQuiz, renderEdit, renderRes, bindResDrag
// Dépend de : core.js, audio.js, data.js
// ── Règle critique : setF doit toujours exister après renderQuiz
// ============================================================

// ── renderQuiz ──
function renderQuiz() {
  const all = allCards();
  const unkSet = new Set(S.unk);
  const favSet = new Set(S.favs || []);
  const knowsSet = new Set(S.knows || []);
  const cm = getCM();

  // Catégories
  let ch = `<button class="cat${S.af === 'all' ? ' on' : ''}" onclick="setF('all')">Toutes (${all.length})</button>`;
  for (const [k, v] of Object.entries(cm)) {
    const cnt = all.filter(x => x.cat === k).length;
    if (!cnt && k === 'autres') continue;
    const on = S.af === k;
    ch += `<button class="cat${on ? ' on' : ''}" style="${on ? `background:${v.c};border-color:${v.c};color:#fff` : `border-color:${v.c}28;color:${v.c}`}" onclick="setF('${k}')">${v.l} (${cnt})</button>`;
  }
  ch += `<button class="cat rv${S.af === 'review' ? ' on' : ''}" onclick="setF('review')">À revoir (${unkSet.size})</button>`;
  ch += `<button class="cat" style="${S.af === 'knows' ? 'background:#4D7A55;border-color:#4D7A55;color:#fff' : 'border-color:#4D7A5544;color:#4D7A55'}" onclick="setF('knows')">✓ Je sais (${knowsSet.size})</button>`;
  ch += `<button class="cat" style="${S.af === 'favoris' ? 'background:#C9973E;border-color:#C9973E;color:#fff' : 'border-color:#C9973E44;color:#C9973E'}" onclick="setF('favoris')">⭐ Favoris (${favSet.size})</button>`;

  const cats = document.getElementById('quiz-cats');
  cats.innerHTML = ch;
  cats.className = 'cats ' + (catsExpanded ? 'expanded' : 'collapsed');
  const tb = document.getElementById('cats-toggle-btn');
  if (tb) tb.textContent = catsExpanded ? '▲ Réduire' : '▼ Voir toutes';

  document.getElementById('pf').style.width = pool.length ? ((cur + 1) / pool.length * 100) + '%' : '0';
  document.getElementById('pc').textContent = pool.length ? `${cur + 1} / ${pool.length}` : '—';
  const ci = document.getElementById('ci');
  document.getElementById('slk').style.opacity = '0';
  document.getElementById('slr').style.opacity = '0';

  if (!pool.length) {
    ci.innerHTML = `<div class="face"><p style="color:var(--muted);font-size:11px;line-height:1.6;text-align:center">Aucune carte ici.</p></div>`;
    ci.style.transform = ''; ci.style.opacity = '1';
    document.getElementById('pbb').disabled = true;
    document.getElementById('nbb').disabled = true;
    document.getElementById('hint').textContent = '';
    updateSceneBtns();
    return;
  }

  const c = pool[cur], m = cm[c.cat] || cm.autres, isA = c.cat === 'alphabet', isFR = sd === 'fr';
  const isFav = favSet.has(c.id);
  const dot = unkSet.has(c.id) ? '<div class="fdot v"></div>' : '<div class="fdot"></div>';
  const bdg = `<span class="fbdg" style="background:${m.bg};color:${m.c}">${m.l}</span>`;
  const bFAV = `<button class="ffav${isFav ? ' on' : ''}" data-fav="${c.id}" title="${isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}">${isFav ? '⭐' : '☆'}</button>`;

  let fB, bB;
  if (isFR) {
    fB = `<div class="flbl">Français</div>${dot}${bdg}<p class="fmain${isA ? ' it' : ''}">${c.fr}</p>${bFAV}`;
    bB = isA
      ? `<div class="flbl">Darija · Arabe</div>${bdg}<p class="falp">${c.a}</p><p class="fdar">${c.d}</p><p class="fpro">[ ${c.p} ]</p>${c.n ? `<p class="fnot">${c.n}</p>` : ''}${bFAV}`
      : `<div class="flbl">Darija · Arabe</div>${bdg}<p class="fdar">${c.d}</p>${c.a ? `<p class="farb">${c.a}</p>` : ''}<p class="fpro">[ ${c.p} ]</p>${c.n ? `<p class="fnot">${c.n}</p>` : ''}${bFAV}`;
  } else {
    fB = isA
      ? `<div class="flbl">Darija · Arabe</div>${dot}${bdg}<p class="falp">${c.a}</p><p class="fdar">${c.d}</p><p class="fpro">[ ${c.p} ]</p>${bFAV}`
      : `<div class="flbl">Darija · Arabe</div>${dot}${bdg}<p class="fdar">${c.d}</p>${c.a ? `<p class="farb">${c.a}</p>` : ''}<p class="fpro">[ ${c.p} ]</p>${bFAV}`;
    bB = `<div class="flbl">Français</div>${bdg}<p class="fmain${isA ? ' it' : ''}">${c.fr}</p>${c.n ? `<p class="fnot">${c.n}</p>` : ''}${bFAV}`;
  }

  ci.innerHTML = `<div class="face">${fB}</div><div class="face fb">${bB}</div>`;
  ci.style.transition = 'none'; ci.style.transform = fl ? 'rotateY(180deg)' : 'rotateY(0deg)'; ci.style.opacity = '1';

  // Boutons favoris
  ci.querySelectorAll('.ffav').forEach(btn => {
    btn.addEventListener('pointerdown', e => e.stopPropagation(), { passive: false });
    btn.addEventListener('pointerup', e => e.stopPropagation(), { passive: false });
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const id = +btn.dataset.fav;
      if (!S.favs) S.favs = [];
      const idx = S.favs.indexOf(id);
      if (idx >= 0) S.favs.splice(idx, 1); else S.favs.push(id);
      saveState();
      const nowFav = S.favs.includes(id);
      ci.querySelectorAll('.ffav').forEach(b => { b.classList.toggle('on', nowFav); b.textContent = nowFav ? '⭐' : '☆'; b.title = nowFav ? 'Retirer des favoris' : 'Ajouter aux favoris'; });
      if (S.af === 'favoris' && !nowFav) { rebuildPool(); if (cur >= pool.length) cur = Math.max(0, pool.length - 1); fl = false; sd = rsd(); renderQuiz(); }
      else { document.querySelectorAll('#quiz-cats button').forEach(b => { if (b.textContent.startsWith('⭐')) b.textContent = `⭐ Favoris (${new Set(S.favs).size})`; }); }
    });
  });

  document.getElementById('pbb').disabled = cur === 0;
  document.getElementById('nbb').disabled = cur >= pool.length - 1;
  const isFRH = sd === 'fr';
  document.getElementById('hint').textContent = fl
    ? (isFRH ? 'Côté darija · tapez pour revenir' : 'Côté français · tapez pour revenir')
    : (isFRH ? 'Côté français · tapez pour le darija' : 'Côté darija · tapez pour le français');
  updateSceneBtns();
}

// ── renderEdit ──
let editFilter = 'all', editSearch = '';

function renderEdit() {
  const all = allCards();
  let vis = all;
  if (editFilter !== 'all') vis = vis.filter(c => c.cat === editFilter);
  if (editSearch.trim()) {
    const q = editSearch.toLowerCase();
    vis = vis.filter(c => c.fr.toLowerCase().includes(q) || c.d.toLowerCase().includes(q));
  }
  document.getElementById('edit-ctr').textContent = `${vis.length} carte${vis.length !== 1 ? 's' : ''}`;
  let fh = `<button class="ef${editFilter === 'all' ? ' on' : ''}" onclick="setEF('all')">Toutes</button>`;
  for (const [k, v] of Object.entries(getCM())) {
    const cnt = all.filter(c => c.cat === k).length;
    if (!cnt && k === 'autres') continue;
    fh += `<button class="ef${editFilter === k ? ' on' : ''}" onclick="setEF('${k}')">${v.l} (${cnt})</button>`;
  }
  document.getElementById('efilt').innerHTML = fh;
  let lh = '';
  for (const c of vis) {
    const m = getCM()[c.cat] || getCM().autres;
    const isC = !!c.custom, isMod = !isC && !!S.overrides[c.id];
    lh += `<div class="ec">
      <div class="ec-body">
        <div class="ec-fr">${c.fr}${isC ? '<span class="ec-tag" style="background:rgba(196,98,45,.1);color:var(--terra2)">Perso</span>' : ''}${isMod ? '<span class="ec-tag" style="background:rgba(77,122,85,.1);color:var(--know)">Modifié</span>' : ''}</div>
        <div class="ec-d">${c.d}</div>
        <span class="ec-bdg" style="background:${m.bg};color:${m.c}">${m.l}</span>
      </div>
      <div class="ec-acts">
        <button class="ea" onclick="openEditCard(${c.id})">✏️</button>
        ${isC ? `<button class="ea del" onclick="deleteCard(${c.id})">🗑</button>` : ''}
        ${isMod ? `<button class="ea" title="Réinitialiser" onclick="resetCard(${c.id})">↩</button>` : ''}
      </div>
    </div>`;
  }
  document.getElementById('edit-list').innerHTML = lh || `<p style="text-align:center;color:var(--muted);font-size:11px;margin-top:1rem">Aucune carte trouvée</p>`;
}

function setEF(f) { editFilter = f; renderEdit(); }

// ── renderRes ──
let resEditMode = false;

function allResLinks() { return [...RES_DEFAULT, ...S.resCustom]; }

function getLinksForSec(sec) {
  const links = allResLinks().filter(r => r.sec === sec);
  const order = S.resOrder && S.resOrder[sec];
  if (order) { links.sort((a, b) => { const ia = order.indexOf(a.id), ib = order.indexOf(b.id); return (ia < 0 ? 999 : ia) - (ib < 0 ? 999 : ib); }); }
  return links;
}

function renderRes() {
  let h = '';
  for (const [sk, sv] of Object.entries(RES_SECTIONS)) {
    const links = getLinksForSec(sk);
    if (!links.length && !resEditMode) continue;
    h += `<div class="rs" data-sec="${sk}"><div class="rs-title">${sv.l}</div><div class="rs-list" id="rslist-${sk}">`;
    links.forEach(r => {
      const isC = !!r.custom;
      h += `<div class="ri" data-id="${r.id}" data-sec="${sk}">
        <span class="drag-handle" data-id="${r.id}" data-sec="${sk}">⠿</span>
        <div class="ri-body">
          <div class="ri-title">${r.name}</div>
          ${r.desc ? `<div class="ri-desc">${r.desc}</div>` : ''}
          <div class="ri-url">${r.url}</div>
        </div>
        <a class="ri-open" href="${r.url}" target="_blank" rel="noopener">Ouvrir →</a>
        <div class="ri-acts">
          <button class="ria" onclick="openEditRes('${r.id}')">✏️</button>
          ${isC ? `<button class="ria del" onclick="deleteRes('${r.id}')">🗑</button>` : ''}
        </div>
      </div>`;
    });
    h += '</div></div>';
  }
  document.getElementById('res-body').innerHTML = h;
  if (resEditMode) bindResDrag();
}

function toggleResEdit() {
  resEditMode = !resEditMode;
  document.body.classList.toggle('edit-res', resEditMode);
  document.getElementById('res-edit-toggle').textContent = resEditMode ? '✅ Terminer' : '✏️ Éditer';
  renderRes();
}

function bindResDrag() {
  document.querySelectorAll('.drag-handle').forEach(handle => {
    handle.addEventListener('pointerdown', e => {
      e.stopPropagation();
      const ri = handle.closest('.ri'); if (!ri) return;
      const sec = handle.dataset.sec, id = handle.dataset.id;
      let startY = e.clientY, dragging = false, currentOver = null;
      const rect = ri.getBoundingClientRect();
      const clone = ri.cloneNode(true);
      clone.style.cssText = `position:fixed;width:${ri.offsetWidth}px;left:${rect.left}px;top:${rect.top}px;opacity:.8;pointer-events:none;z-index:999;border-radius:10px;background:var(--card);box-shadow:0 4px 16px rgba(26,16,8,.2);`;
      const onMove = ev => {
        if (!dragging && Math.abs(ev.clientY - startY) > 6) { dragging = true; ri.classList.add('dragging'); document.body.appendChild(clone); }
        if (!dragging) return;
        clone.style.top = (ev.clientY - ri.offsetHeight / 2) + 'px';
        const el = document.elementFromPoint(ev.clientX, ev.clientY);
        const target = el && el.closest(`.ri[data-sec="${sec}"]`);
        document.querySelectorAll(`.ri[data-sec="${sec}"]`).forEach(x => x.classList.remove('drag-over'));
        currentOver = target && target !== ri ? target : null;
        if (currentOver) currentOver.classList.add('drag-over');
      };
      const onUp = () => {
        document.removeEventListener('pointermove', onMove);
        document.removeEventListener('pointerup', onUp);
        ri.classList.remove('dragging');
        if (clone.parentNode) clone.parentNode.removeChild(clone);
        document.querySelectorAll(`.ri[data-sec="${sec}"]`).forEach(x => x.classList.remove('drag-over'));
        if (dragging && currentOver) {
          const links = getLinksForSec(sec);
          const fi = links.findIndex(r => r.id === id), ti = links.findIndex(r => r.id === currentOver.dataset.id);
          if (fi >= 0 && ti >= 0 && fi !== ti) {
            const ord = links.map(r => r.id);
            ord.splice(ti, 0, ord.splice(fi, 1)[0]);
            if (!S.resOrder) S.resOrder = {};
            S.resOrder[sec] = ord; saveState();
          }
        }
        renderRes(); if (resEditMode) bindResDrag();
      };
      document.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerup', onUp);
    }, { passive: true });
  });
}
