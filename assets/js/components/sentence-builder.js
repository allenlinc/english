/**
 * Sentence Builder — drag-to-assemble (click-based for touch friendliness)
 */
import { TTS } from '../core/tts.js';
import { audioButton, el, showConfetti } from '../utils/dom.js';
import { shuffleSeeded } from '../utils/shuffle.js';

export function renderSentenceBuilder(container, sentenceData) {
  const { en, zh, blocks } = sentenceData;

  const wrapper = el('div', { className: 'sentence-card' });
  wrapper.appendChild(el('div', { className: 'sentence-card__en' }, en));
  wrapper.appendChild(el('div', { className: 'sentence-card__zh' }, zh));

  let selected = [];
  let available = shuffleSeeded(blocks, `sb-${en}`);

  const availableArea = el('div', { className: 'sentence-builder' });
  const answerSlot = el('div', { className: 'answer-slot', id: `slot-${blocks.join('').slice(0,8)}` });

  const statusText = el('div', { style: 'font-size:.8rem;text-align:center;margin-top:.35rem;color:var(--c-gray)' }, '');

  function render() {
    availableArea.innerHTML = '';
    answerSlot.innerHTML = '';

    for (const block of available) {
      const b = el('div', {
        className: 'word-block',
        onClick: () => {
          selected.push(block);
          available = available.filter(x => x !== block);
          render();
        }
      }, block);
      availableArea.appendChild(b);
    }

    for (const block of selected) {
      const b = el('div', {
        className: 'word-block selected',
        onClick: () => {
          available.push(block);
          selected = selected.filter(x => x !== block);
          answerSlot.classList.remove('correct', 'wrong');
          statusText.textContent = '';
          render();
        }
      }, block);
      answerSlot.appendChild(b);
    }

    // Validate
    if (selected.length === blocks.length) {
      const sel = selected.join(' ');
      const exp = blocks.join(' ');
      if (sel === exp) {
        answerSlot.classList.add('correct');
        answerSlot.classList.remove('wrong');
        statusText.textContent = '✅ 太棒了！拼写正确！';
        statusText.style.color = 'var(--c-green)';
        const rect = answerSlot.getBoundingClientRect();
        showConfetti(rect.left + rect.width / 2, rect.top);
      } else {
        answerSlot.classList.add('wrong');
        answerSlot.classList.remove('correct');
        statusText.textContent = '❌ 再试一次吧！';
        statusText.style.color = 'var(--c-red)';
        answerSlot.classList.add('shake');
        setTimeout(() => answerSlot.classList.remove('shake'), 400);
      }
    }
  }

  render();

  // Reset button
  const resetBtn = el('button', {
    className: 'btn btn-outline btn-sm',
    style: 'margin-top:.5rem;margin-right:.5rem',
    onClick: () => {
      selected = [];
      available = shuffleSeeded(blocks, `sb-${en}-${Date.now()}`);
      answerSlot.classList.remove('correct', 'wrong');
      statusText.textContent = '';
      render();
    }
  }, '🔄 重新排列');

  // Audio
  const audio = audioButton(() => TTS.speakSentence(en));

  const actions = el('div', { style: 'display:flex;align-items:center;gap:.5rem;margin-top:.5rem;flex-wrap:wrap' });
  actions.appendChild(resetBtn);
  actions.appendChild(audio);
  wrapper.appendChild(actions);

  wrapper.appendChild(availableArea);
  wrapper.appendChild(answerSlot);
  wrapper.appendChild(statusText);
  container.appendChild(wrapper);

  return wrapper;
}
