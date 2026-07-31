/**
 * Vocabulary Grid Component
 */
import { TTS } from '../core/tts.js';
import { audioButton, el } from '../utils/dom.js';

export function renderVocabGrid(container, vocabList, options = {}) {
  const { showExample = true, onCardClick } = options;
  const grid = el('div', { className: 'vocab-grid' });

  for (const v of vocabList) {
    const card = el('div', {
      className: 'vocab-card',
      onClick: () => onCardClick?.(v),
    });
    const icon = el('span', { className: 'vocab-card__icon' }, v.icon || '📝');
    const word = el('span', { className: 'vocab-card__word' }, v.word);
    const zh = el('span', { className: 'vocab-card__zh' }, v.zh);

    const audio = audioButton(() => TTS.speakWord(v.word));

    card.appendChild(icon);
    card.appendChild(word);
    card.appendChild(zh);
    card.appendChild(audio);

    if (showExample && v.example) {
      const exBtn = el('button', {
        className: 'btn btn-outline btn-sm',
        style: 'margin-top:.35rem;font-size:.75rem',
        onClick: (e) => { e.stopPropagation(); TTS.speakSentence(v.example); }
      }, `💬 ${v.exampleZh || '听例句'}`);
      card.appendChild(exBtn);
    }

    grid.appendChild(card);
  }

  container.appendChild(grid);
  return grid;
}
