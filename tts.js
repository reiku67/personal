// Text-to-speech compartido. Usa Web Speech API del navegador.
// Para mejor calidad en español: en Chrome/Edge instalá voces neurales del sistema.

const TTS = {
  voices: [],
  currentVoice: null,
  state: 'idle',           // idle | playing | paused
  onStateChange: null,
  _queue: [],
  _index: 0,

  async init() {
    if (this.voices.length) return;
    await new Promise(resolve => {
      const load = () => {
        this.voices = speechSynthesis.getVoices();
        this.currentVoice = this._pickBestSpanish();
        resolve();
      };
      const v = speechSynthesis.getVoices();
      if (v.length) { load(); return; }
      speechSynthesis.addEventListener('voiceschanged', load, { once: true });
      // En Firefox/Linux sin speech-dispatcher, voiceschanged nunca dispara.
      // Resolvemos igual tras un timeout para que la UI muestre el error.
      setTimeout(() => {
        if (!this.voices.length) resolve();
      }, 1500);
    });
  },

  spanishVoices() {
    return this.voices.filter(v => v.lang.toLowerCase().startsWith('es'));
  },

  _pickBestSpanish() {
    const es = this.spanishVoices();
    if (!es.length) return this.voices[0] || null;
    const ranked = es.slice().sort((a, b) => this._score(b) - this._score(a));
    return ranked[0];
  },

  _score(v) {
    let s = 0;
    if (/natural|neural|premium|enhanced/i.test(v.name)) s += 10;
    if (/google/i.test(v.name)) s += 5;
    if (/microsoft/i.test(v.name)) s += 4;
    if (v.localService) s += 1;
    return s;
  },

  setVoice(name) {
    const v = this.voices.find(v => v.name === name);
    if (v) this.currentVoice = v;
  },

  _chunk(text) {
    // Chrome corta utterances > ~200-300 chars. Dividimos por oraciones.
    const sentences = text.match(/[^.!?\n]+[.!?\n]+|[^.!?\n]+$/g) || [text];
    const chunks = [];
    let cur = '';
    for (const s of sentences) {
      if ((cur + s).length > 200 && cur) {
        chunks.push(cur.trim());
        cur = s;
      } else {
        cur += s;
      }
    }
    if (cur.trim()) chunks.push(cur.trim());
    return chunks;
  },

  speak(text) {
    this.stop();
    this._queue = this._chunk(text);
    this._index = 0;
    this.state = 'playing';
    this._fire();
    this._next();
  },

  _next() {
    if (this._index >= this._queue.length) {
      this.state = 'idle';
      this._fire();
      return;
    }
    const u = new SpeechSynthesisUtterance(this._queue[this._index++]);
    if (this.currentVoice) u.voice = this.currentVoice;
    u.lang = this.currentVoice ? this.currentVoice.lang : 'es-ES';
    u.rate = 1.0;
    u.onend = () => this._next();
    u.onerror = () => { this.state = 'idle'; this._fire(); };
    speechSynthesis.speak(u);
  },

  pause() {
    if (this.state !== 'playing') return;
    speechSynthesis.pause();
    this.state = 'paused';
    this._fire();
  },

  resume() {
    if (this.state !== 'paused') return;
    speechSynthesis.resume();
    this.state = 'playing';
    this._fire();
  },

  stop() {
    speechSynthesis.cancel();
    this._queue = [];
    this._index = 0;
    this.state = 'idle';
    this._fire();
  },

  _fire() {
    if (this.onStateChange) this.onStateChange(this.state);
  }
};

// Crea una barra de player y la inserta en `container`. `getText` es una
// función que devuelve el texto a leer (se llama recién al apretar play).
function createTTSPlayer(container, getText) {
  const bar = document.createElement('div');
  bar.className = 'tts-bar';
  bar.innerHTML = `
    <button class="tts-btn tts-play" type="button">🔊 Escuchar</button>
    <button class="tts-btn tts-stop" type="button" hidden>⏹</button>
    <select class="tts-voice" hidden></select>
  `;
  container.appendChild(bar);

  const playBtn = bar.querySelector('.tts-play');
  const stopBtn = bar.querySelector('.tts-stop');
  const voiceSel = bar.querySelector('.tts-voice');

  TTS.init().then(() => {
    if (!TTS.voices.length) {
      playBtn.disabled = true;
      playBtn.textContent = '🔊 sin voces (instalá speech-dispatcher o usá Chrome)';
      playBtn.title = 'Firefox en Linux necesita: sudo pacman -S speech-dispatcher espeak-ng';
      return;
    }
    const es = TTS.spanishVoices();
    if (es.length > 1) {
      voiceSel.innerHTML = es.map(v =>
        `<option value="${v.name}" ${v === TTS.currentVoice ? 'selected' : ''}>${v.name}</option>`
      ).join('');
      voiceSel.hidden = false;
      voiceSel.onchange = e => {
        const wasPlaying = TTS.state !== 'idle';
        TTS.setVoice(e.target.value);
        if (wasPlaying) TTS.speak(getText());
      };
    } else if (!es.length) {
      playBtn.title = 'No hay voces en español. Se usará la voz por defecto.';
    }
  });

  playBtn.onclick = () => {
    if (TTS.state === 'idle') TTS.speak(getText());
    else if (TTS.state === 'playing') TTS.pause();
    else if (TTS.state === 'paused') TTS.resume();
  };
  stopBtn.onclick = () => TTS.stop();

  TTS.onStateChange = state => {
    if (state === 'idle') {
      playBtn.textContent = '🔊 Escuchar';
      stopBtn.hidden = true;
    } else if (state === 'playing') {
      playBtn.textContent = '⏸ Pausar';
      stopBtn.hidden = false;
    } else if (state === 'paused') {
      playBtn.textContent = '▶ Reanudar';
      stopBtn.hidden = false;
    }
  };
}

// Botón inline (sin barra completa) — útil para listados.
function createTTSInlineButton(text) {
  const btn = document.createElement('button');
  btn.className = 'tts-inline';
  btn.type = 'button';
  btn.title = 'Escuchar';
  btn.textContent = '🔊';
  btn.onclick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    TTS.init().then(() => {
      if (TTS.state !== 'idle') TTS.stop();
      else TTS.speak(text);
    });
  };
  return btn;
}
