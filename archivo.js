function escapeHtml(s) {
  return s.replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
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
  const titulo = params.get('titulo') || file;
  const tipo = params.get('tipo') || 'archivo';

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

  document.title = titulo + ' — w/o fluff';

  container.innerHTML = `
    <div class="source-banner">${escapeHtml(tipo).toUpperCase()} · FUENTE</div>
    <h2 class="post-title">${escapeHtml(titulo)}</h2>
    <div class="source-meta">
      texto completo · <a href="${file}" download>descargar .txt</a>
    </div>
    <div id="tts-mount"></div>
    <div class="body">${renderBody(text)}</div>
  `;

  createTTSPlayer(
    document.getElementById('tts-mount'),
    () => `${titulo}. ${text}`
  );
}

load();
