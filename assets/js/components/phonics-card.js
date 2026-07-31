/**
 * Phonics Card Component
 */
import { TTS } from '../core/tts.js';
import { audioButton, el } from '../utils/dom.js';

export function renderPhonicsGrid(container, phonicsList) {
  const grid = el('div', { className: 'phonics-grid' });

  for (const p of phonicsList) {
    const card = el('div', { className: 'phonics-card' });
    card.style.borderTopColor = 'var(--c-purple)';

    const letter = el('div', { className: 'phonics-card__letter' }, p.letter);
    const sound = el('div', { className: 'phonics-card__sound' }, p.sound);
    const example = el('div', { className: 'phonics-card__example' }, `${p.example}（${p.exampleZh}）`);
    const memory = el('div', { style: 'font-size:.8rem;color:var(--c-gray);margin-top:.25rem' }, `💡 ${p.memory}`);

    const actions = el('div', { style: 'display:flex;gap:.35rem;justify-content:center;margin:.4rem 0' });
    const btnSound = audioButton(() => TTS.speak(p.sound, 'en-US', { rate: 0.7, pitch: 1.0 }));
    btnSound.title = '听字母发音';
    btnSound.innerHTML = '🔤';
    const btnWord = audioButton(() => TTS.speakWord(p.example));
    btnWord.title = '听例词';
    btnWord.innerHTML = '📖';
    actions.appendChild(btnSound);
    actions.appendChild(btnWord);

    card.appendChild(letter);
    card.appendChild(sound);
    card.appendChild(example);
    card.appendChild(memory);
    card.appendChild(actions);
    grid.appendChild(card);
  }

  container.appendChild(grid);
  return grid;
}
