const state = {
  sort: 'title-asc',
  hiddenTipos: new Set(),
  fuentes: []
};

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
  return meta;
}

async function discoverFuentes() {
  try {
    const res = await fetch('archivos/index.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data.map(s => s.endsWith('.txt') ? s : s + '.txt');
    }
  } catch {}

  const html = await fetch('archivos/').then(r => r.text());
  const matches = [...html.matchAll(/href="([^"]+\.txt)"/g)];
  return matches.map(m => decodeURIComponent(m[1]));
}

async function loadFuentes() {
  const filenames = await discoverFuentes();
  state.fuentes = await Promise.all(filenames.map(async filename => {
    const text = await fetch(`archivos/${filename}`).then(r => r.text());
    const meta = parseMeta(text);
    return {
      file: `archivos/${filename}`,
      title: meta.title || filename.replace(/\.txt$/, ''),
      autor: meta.autor || '',
      tipo: meta.tipo || 'archivo',
      year: meta.year || ''
    };
  }));
  renderTipos();
  renderFuentes();
}

function uniqueTipos() {
  return [...new Set(state.fuentes.map(f => f.tipo).filter(Boolean))].sort();
}

function renderTipos() {
  const container = document.getElementById('tipos');
  container.innerHTML = '';
  uniqueTipos().forEach(t => {
    const el = document.createElement('button');
    el.className = 'chip' + (state.hiddenTipos.has(t) ? '' : ' active');
    el.textContent = t;
    el.onclick = () => {
      if (state.hiddenTipos.has(t)) state.hiddenTipos.delete(t);
      else state.hiddenTipos.add(t);
      renderTipos();
      renderFuentes();
    };
    container.appendChild(el);
  });
}

function sortFn(a, b) {
  switch (state.sort) {
    case 'title-asc':  return a.title.localeCompare(b.title);
    case 'title-desc': return b.title.localeCompare(a.title);
    case 'autor-asc':  return (a.autor || '').localeCompare(b.autor || '');
    case 'year-desc':  return (b.year || '').localeCompare(a.year || '');
    case 'year-asc':   return (a.year || '').localeCompare(b.year || '');
    default: return 0;
  }
}

function renderFuentes() {
  const container = document.getElementById('fuentes');
  const filtered = state.fuentes
    .filter(f => !state.hiddenTipos.has(f.tipo))
    .sort(sortFn);

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty">la biblioteca está vacía o filtraste todo</div>';
    return;
  }

  container.innerHTML = filtered.map(f => `
    <a class="fuente-link" href="archivo.html?file=${encodeURIComponent(f.file)}" data-file="${f.file}">
      <div class="meta">
        <span class="tipo">${f.tipo}</span>
        ${f.year ? `<span>· ${f.year}</span>` : ''}
      </div>
      <h2>${f.title}</h2>
      ${f.autor ? `<div class="autor">${f.autor}</div>` : ''}
    </a>
  `).join('');

  filtered.forEach(f => {
    const link = container.querySelector(`.fuente-link[data-file="${f.file}"]`);
    if (link) link.appendChild(createTTSInlineButton(`${f.title}${f.autor ? ', de ' + f.autor : ''}.`));
  });
}

document.getElementById('sort').addEventListener('change', e => {
  state.sort = e.target.value;
  renderFuentes();
});

loadFuentes();
