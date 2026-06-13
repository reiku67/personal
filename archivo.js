function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}

function parseMeta(text) {
  const meta = {};
  const lines = text.split('\n');
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim() === '') { i++; break; }
    const m = line.match(/^@(\w+):\s*(.*)$/);
    if (m) meta[m[1]] = m[2].trim();
    else break;
    i++;
  }
  const body = lines.slice(i).join('\n').trim();
  return { meta, body };
}

function slugify(s) {
  return s.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'sec';
}

function renderBody(text) {
  const used = new Set();
  const mkId = t => {
    const base = slugify(t);
    let id = base, n = 2;
    while (used.has(id)) id = `${base}-${n++}`;
    used.add(id);
    return id;
  };
  return text.split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(Boolean)
    .map(b => {
      const titleMatch = b.match(/^TÍTULO:\s*(.+)$/s);
      if (titleMatch) {
        const t = titleMatch[1].trim();
        return `<h3 id="${mkId(t)}">${escapeHtml(t)}</h3>`;
      }
      // Línea suelta en mayúsculas (p. ej. INTRODUCCIÓN) → encabezado de sección
      const isHeading = !b.includes('\n') && b.length <= 60 &&
        /[A-ZÁÉÍÓÚÑÜ]/.test(b) && b === b.toUpperCase();
      if (isHeading) return `<h3 id="${mkId(b)}">${escapeHtml(b)}</h3>`;
      return `<p>${escapeHtml(b).replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
}

function buildTOC() {
  const toc = document.getElementById('toc');
  const toggle = document.getElementById('nav-toggle');
  if (!toc) return;
  const heads = [...document.querySelectorAll('#archivo .body h3')];
  if (heads.length < 2) {
    if (toggle) toggle.hidden = true;          // sin secciones → sin índice
    return;
  }

  toc.innerHTML = heads.map(h => {
    const t = h.textContent.trim();
    const level = /^[A-C]\.\s/.test(t) ? 2 : 1; // A./B./C. → subsección
    return `<a class="p-item p-l${level}" href="#${h.id}" data-text="${escapeHtml(t.toLowerCase())}">` +
           `<span class="p-bullet"></span><span class="p-label">${escapeHtml(t)}</span></a>`;
  }).join('');

  // sección activa según el scroll
  const byId = new Map(
    [...toc.querySelectorAll('.p-item')].map(a => [a.getAttribute('href').slice(1), a])
  );
  const observer = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      byId.forEach(a => a.classList.remove('active'));
      const a = byId.get(e.target.id);
      if (a) a.classList.add('active');
    });
  }, { rootMargin: '0px 0px -75% 0px' });
  heads.forEach(h => observer.observe(h));

  setupPalette();
}

function setupPalette() {
  const palette = document.getElementById('palette');
  const toggle = document.getElementById('nav-toggle');
  const input = document.getElementById('palette-input');
  const empty = palette.querySelector('.palette-empty');
  if (!palette || !toggle || !input) return;

  const all = () => [...palette.querySelectorAll('.p-item')];
  const visible = () => all().filter(a => !a.hidden);
  let sel = 0;

  function paintSel() {
    const vis = visible();
    sel = Math.max(0, Math.min(sel, vis.length - 1));
    all().forEach(a => a.classList.remove('sel'));
    const el = vis[sel];
    if (el) { el.classList.add('sel'); el.scrollIntoView({ block: 'nearest' }); }
  }

  function filter() {
    const q = input.value.trim().toLowerCase();
    all().forEach(a => { a.hidden = q && !a.dataset.text.includes(q); });
    const none = visible().length === 0;
    if (empty) empty.hidden = !none;
    sel = 0;
    paintSel();
  }

  function open() {
    palette.hidden = false;
    document.body.style.overflow = 'hidden';
    input.value = '';
    filter();
    // arrancar en la sección que se está leyendo, si la hay
    const vis = visible();
    const act = vis.findIndex(a => a.classList.contains('active'));
    if (act >= 0) { sel = act; paintSel(); }
    requestAnimationFrame(() => input.focus());
  }
  function close() {
    palette.hidden = true;
    document.body.style.overflow = '';
    toggle.focus();
  }
  const isOpen = () => !palette.hidden;

  toggle.addEventListener('click', () => isOpen() ? close() : open());
  input.addEventListener('input', filter);
  palette.querySelectorAll('[data-close]').forEach(el =>
    el.addEventListener('click', close));
  all().forEach(a => a.addEventListener('click', () => setTimeout(close, 0)));

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      isOpen() ? close() : open();
      return;
    }
    if (!isOpen()) return;
    switch (e.key) {
      case 'Escape':    e.preventDefault(); close(); break;
      case 'ArrowDown': e.preventDefault(); sel++; paintSel(); break;
      case 'ArrowUp':   e.preventDefault(); sel--; paintSel(); break;
      case 'Enter':     e.preventDefault(); { const el = visible()[sel]; if (el) el.click(); } break;
    }
  });
}

async function load() {
  const params = new URLSearchParams(location.search);
  const file = params.get('file');
  const container = document.getElementById('archivo');

  if (!file) {
    container.innerHTML = '<div class="empty">archivo no especificado</div>';
    return;
  }

  const text = await fetch(file).then(r => {
    if (!r.ok) throw new Error('not found');
    return r.text();
  }).catch(() => null);

  if (text === null) {
    container.innerHTML = '<div class="empty">archivo no encontrado</div>';
    return;
  }

  const { meta, body } = parseMeta(text);
  const titulo = meta.title || file.split('/').pop();
  const autor = meta.autor || '';
  const tipo = (meta.tipo || 'archivo').toUpperCase();
  const year = meta.year || '';

  document.title = titulo + ' — w/o fluff';

  container.innerHTML = `
    <div class="source-banner">${escapeHtml(tipo)} · FUENTE</div>
    <h2 class="post-title">${escapeHtml(titulo)}</h2>
    ${autor ? `<div class="source-author">${escapeHtml(autor)}${year ? ` · ${escapeHtml(year)}` : ''}</div>` : ''}
    <div class="source-meta">
      texto completo · <a href="${file}" download>descargar .txt</a>
    </div>
    <div id="tts-mount"></div>
    <div class="body">${renderBody(body)}</div>
  `;

  createTTSPlayer(
    document.getElementById('tts-mount'),
    () => `${titulo}${autor ? ', de ' + autor : ''}. ${body}`
  );

  buildTOC();
}

load();
