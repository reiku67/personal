function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}

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
    .map(b => `<p>${escapeHtml(b).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

async function load() {
  const slug = new URLSearchParams(location.search).get('slug');
  const container = document.getElementById('post');

  if (!slug) {
    container.innerHTML = '<div class="empty">publicación no especificada</div>';
    return;
  }

  const text = await fetch(`posts/${slug}.txt`).then(r => {
    if (!r.ok) throw new Error('not found');
    return r.text();
  }).catch(() => null);

  if (text === null) {
    container.innerHTML = '<div class="empty">publicación no encontrada</div>';
    return;
  }

  const { meta, body } = parseMeta(text);
  document.title = (meta.title || slug) + ' — w/o fluff';

  const attachment = meta.archivo
    ? `<div class="attachment">
         <div class="attachment-label">${escapeHtml((meta.archivo_tipo || 'libro')).toUpperCase()} CITADO</div>
         <a href="archivo.html?file=${encodeURIComponent(meta.archivo)}&titulo=${encodeURIComponent(meta.archivo_titulo || meta.archivo)}&tipo=${encodeURIComponent(meta.archivo_tipo || 'libro')}">
           ${escapeHtml(meta.archivo_titulo || meta.archivo)} →
         </a>
       </div>`
    : '';

  container.innerHTML = `
    <div class="meta">
      <span class="date">${formatDate(meta.date)}</span>
      <span class="topic">· ${meta.topic || ''}</span>
    </div>
    <h2 class="post-title">${escapeHtml(meta.title || slug)}</h2>
    <div id="tts-mount"></div>
    ${meta.image ? `<img src="${meta.image}" alt="">` : ''}
    <div class="body">${renderBody(body)}</div>
    ${attachment}
  `;

  createTTSPlayer(
    document.getElementById('tts-mount'),
    () => `${meta.title || slug}. ${body}`
  );
}

load();
