const state = {
  sort: 'desc',
  hidden: new Set(),
  posts: []
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
  const body = lines.slice(i).join('\n').trim();
  return { meta, body };
}

async function discoverPosts() {
  // Primero: intentar leer posts/index.json (lo genera el workflow de Pages
  // o se puede mantener a mano). Fallback: parsear el listado de directorio
  // que sirve Python http.server en local.
  try {
    const res = await fetch('posts/index.json');
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data)) return data.map(s => s.endsWith('.txt') ? s : s + '.txt');
    }
  } catch {}

  const html = await fetch('posts/').then(r => r.text());
  const matches = [...html.matchAll(/href="([^"]+\.txt)"/g)];
  return matches.map(m => decodeURIComponent(m[1]));
}

async function loadPosts() {
  const filenames = await discoverPosts();
  state.posts = await Promise.all(filenames.map(async filename => {
    const slug = filename.replace(/\.txt$/, '');
    const text = await fetch(`posts/${filename}`).then(r => r.text());
    const { meta } = parseMeta(text);
    return {
      slug,
      title: meta.title || slug,
      date: meta.date || '',
      topic: meta.topic || 'sin tópico',
      image: meta.image || ''
    };
  }));
  renderTopics();
  renderPosts();
}

function uniqueTopics() {
  return [...new Set(state.posts.map(p => p.topic).filter(Boolean))].sort();
}

function renderTopics() {
  const container = document.getElementById('topics');
  container.innerHTML = '';
  uniqueTopics().forEach(t => {
    const el = document.createElement('button');
    el.className = 'chip' + (state.hidden.has(t) ? '' : ' active');
    el.textContent = t;
    el.onclick = () => {
      if (state.hidden.has(t)) state.hidden.delete(t);
      else state.hidden.add(t);
      renderTopics();
      renderPosts();
    };
    container.appendChild(el);
  });
}

function formatDate(iso) {
  if (!iso) return 'sin fecha';
  const d = new Date(iso);
  if (isNaN(d)) return iso;
  return d.toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric' });
}

function renderPosts() {
  const container = document.getElementById('posts');
  const filtered = state.posts
    .filter(p => !state.hidden.has(p.topic))
    .sort((a, b) => state.sort === 'desc'
      ? (b.date || '').localeCompare(a.date || '')
      : (a.date || '').localeCompare(b.date || ''));

  if (filtered.length === 0) {
    container.innerHTML = '<div class="empty">nada por aquí — activá algún tópico</div>';
    return;
  }

  container.innerHTML = filtered.map(p => `
    <a class="post-link" href="post.html?slug=${encodeURIComponent(p.slug)}" data-slug="${p.slug}">
      <div class="meta">
        <span class="date">${formatDate(p.date)}</span>
        <span class="topic">· ${p.topic}</span>
      </div>
      <h2>${p.title}</h2>
    </a>
  `).join('');

  // Insert TTS inline buttons (read title aloud without navigating)
  filtered.forEach(p => {
    const link = container.querySelector(`.post-link[data-slug="${p.slug}"]`);
    if (link) link.appendChild(createTTSInlineButton(`${p.title}. Tópico: ${p.topic}. Fecha: ${formatDate(p.date)}.`));
  });
}

document.getElementById('sort').addEventListener('change', e => {
  state.sort = e.target.value;
  renderPosts();
});

loadPosts();
