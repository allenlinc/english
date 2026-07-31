/** DOM helper utilities */

/** Shorthand for document.querySelector */
export const $ = (sel, root = document) => root.querySelector(sel);

/** Shorthand for document.querySelectorAll */
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Create element with attributes and children */
export function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'className') e.className = v;
    else if (k === 'dataset') Object.assign(e.dataset, v);
    else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
    else e.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === 'string') e.appendChild(document.createTextNode(child));
    else if (child instanceof Node) e.appendChild(child);
  }
  return e;
}

/** Create an audio button that triggers TTS on click */
export function audioButton(onClickFn, className = '') {
  const btn = document.createElement('button');
  btn.className = `audio-btn ${className}`.trim();
  btn.innerHTML = '🔊';
  btn.title = '点击发音';
  btn.addEventListener('click', async (e) => {
    e.stopPropagation();
    btn.classList.add('speaking');
    try { await onClickFn(); } catch {}
    btn.classList.remove('speaking');
  });
  return btn;
}

/** Show confetti effect at position */
export function showConfetti(x, y) {
  const colors = ['#FFD429', '#FF6B6B', '#3DA5E0', '#6DBE45', '#B07ACC', '#FF8C2B'];
  for (let i = 0; i < 12; i++) {
    const dot = document.createElement('div');
    dot.className = 'confetti';
    dot.style.left = `${x + (Math.random() - 0.5) * 100}px`;
    dot.style.top = `${y}px`;
    dot.style.background = colors[i % colors.length];
    dot.style.animationDelay = `${Math.random() * 0.3}s`;
    document.body.appendChild(dot);
    setTimeout(() => dot.remove(), 1100);
  }
}

/** Smooth scroll to element */
export function scrollTo(el) {
  if (typeof el === 'string') el = document.querySelector(el);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
