// Botón flotante "volver al inicio". Se inyecta solo en todas las páginas.
(function() {
  const style = document.createElement('style');
  style.textContent = `
    .scroll-top {
      position: fixed;
      bottom: 24px;
      right: 24px;
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background: #1a1a1a;
      color: #e8e8e8;
      border: 1px solid #222;
      font-size: 18px;
      font-family: ui-monospace, monospace;
      cursor: pointer;
      opacity: 0;
      pointer-events: none;
      transform: translateY(8px);
      transition: opacity 0.2s, transform 0.2s, border-color 0.12s, color 0.12s;
      z-index: 100;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .scroll-top.visible {
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
    }
    .scroll-top:hover {
      color: #fff;
      border-color: #3a3a3a;
    }
  `;
  document.head.appendChild(style);

  const btn = document.createElement('button');
  btn.className = 'scroll-top';
  btn.type = 'button';
  btn.title = 'Volver al inicio';
  btn.setAttribute('aria-label', 'Volver al inicio');
  btn.textContent = '↑';
  document.body.appendChild(btn);

  btn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const onScroll = () => {
    if (window.scrollY > 300) btn.classList.add('visible');
    else btn.classList.remove('visible');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
