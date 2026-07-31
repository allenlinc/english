/**
 * Flashcard Component — flip-to-reveal vocabulary cards
 */
import { TTS } from '../core/tts.js';
import { el } from '../utils/dom.js';

export function renderFlashcard(container, vocabList, options = {}) {
  const { onComplete } = options;
  let currentIdx = 0;
  let flipped = false;
  let seen = new Set();

  const wrapper = el('div', { style: 'text-align:center' });

  const counter = el('div', { className: 'flashcard-counter' },
    `${currentIdx + 1} / ${vocabList.length}`);
  wrapper.appendChild(counter);

  const cardContainer = el('div', { className: 'flashcard-container', style: 'width:220px;height:160px' });

  function updateCard() {
    const v = vocabList[currentIdx];
    cardContainer.innerHTML = '';
    const card = el('div', {
      className: `flashcard ${flipped ? 'flipped' : ''}`,
      onClick: () => {
        flipped = !flipped;
        card.classList.toggle('flipped');
        if (flipped) { seen.add(currentIdx); }
        if (seen.size >= vocabList.length) onComplete?.();
      }
    });

    const front = el('div', { className: 'flashcard__face flashcard__front' });
    const icon = el('span', { className: 'flashcard__icon' }, v.icon || '📝');
    const word = el('span', { className: 'flashcard__word' }, v.word);
    front.appendChild(icon);
    front.appendChild(word);

    const back = el('div', { className: 'flashcard__face flashcard__back' });
    back.appendChild(el('span', { style: 'font-size:1.3rem;font-weight:700' }, v.zh));
    const audio = el('button', {
      className: 'btn btn-sm btn-primary',
      style: 'margin-top:.5rem',
      onClick: (e) => { e.stopPropagation(); TTS.speakWord(v.word); }
    }, '🔊 听发音');
    back.appendChild(audio);

    card.appendChild(front);
    card.appendChild(back);
    cardContainer.appendChild(card);
    counter.textContent = `${currentIdx + 1} / ${vocabList.length}`;
  }

  updateCard();

  const nav = el('div', { className: 'flashcard-nav' });
  const prev = el('button', { className: 'btn btn-outline btn-sm', onClick: () => {
    currentIdx = (currentIdx - 1 + vocabList.length) % vocabList.length;
    flipped = false;
    updateCard();
  }}, '← 上一个');
  const next = el('button', { className: 'btn btn-outline btn-sm', onClick: () => {
    currentIdx = (currentIdx + 1) % vocabList.length;
    flipped = false;
    updateCard();
  }}, '下一个 →');
  const flip = el('button', { className: 'btn btn-accent btn-sm', onClick: () => {
    flipped = !flipped;
    updateCard();
  }}, '翻转 🔄');
  nav.appendChild(prev);
  nav.appendChild(flip);
  nav.appendChild(next);

  wrapper.appendChild(cardContainer);
  wrapper.appendChild(nav);

  // Keyboard controls
  const keyHandler = (e) => {
    if (e.key === 'ArrowLeft') { prev.click(); }
    else if (e.key === 'ArrowRight') { next.click(); }
    else if (e.key === ' ') { e.preventDefault(); flip.click(); }
  };
  document.addEventListener('keydown', keyHandler);

  container.appendChild(wrapper);
  return { keyHandler, wrapper };
}
