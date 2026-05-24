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

function renderBody(text) {
  return text.split(/\n\s*\n/)
    .map(b => b.trim())
    .filter(Boolean)
    .map(b => {
      const titleMatch = b.match(/^TÍTULO:\s*(.+)$/s);
      if (titleMatch) return `<h3>${escapeHtml(titleMatch[1].trim())}</h3>`;
      return `<p>${escapeHtml(b).replace(/\n/g, '<br>')}</p>`;
    })
    .join('\n');
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
}

load();
