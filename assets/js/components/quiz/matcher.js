/**
 * Matcher Component — match word with picture/translation
 */
import { TTS } from '../../core/tts.js';
import { el, showConfetti } from '../../utils/dom.js';
import { shuffleSeeded, hashStr } from '../../utils/shuffle.js';

export function renderMatcher(container, question, onResult) {
  const { id, prompt, pairs } = question;

  const item = el('div', { className: 'quiz-item' });
  const header = el('div', { className: 'quiz-item__prompt' });
  header.appendChild(el('span', { className: 'quiz-item__num' }, '🔗'));
  header.appendChild(el('span', {}, prompt));
  item.appendChild(header);

  const wrapper = el('div', { className: 'matcher' });

  // Shuffle both columns independently
  const leftItems = shuffleSeeded(pairs.map((p, i) => ({ ...p, origIdx: i })), hashStr(id + 'L'));
  const rightItems = shuffleSeeded(pairs.map((p, i) => ({ ...p, origIdx: i })), hashStr(id + 'R'));

  let selectedLeft = null;
  let matched = new Set();
  let matchCount = 0;

  const leftCol = el('div', { className: 'matcher__col' });
  const rightCol = el('div', { className: 'matcher__col' });

  function renderCols() {
    leftCol.innerHTML = '';
    rightCol.innerHTML = '';

    for (const item of leftItems) {
      const elm = el('div', {
        className: `matcher-item ${matched.has(item.origIdx) ? 'matched' : ''}`,
        onClick: () => {
          if (matched.has(item.origIdx)) return;
          selectedLeft = item;
          renderCols();
        }
      });
      if (selectedLeft === item && !matched.has(item.origIdx)) {
        elm.classList.add('selected');
      }
      const wordBtn = el('span', {
        className: 'matcher-item__icon',
        style: 'cursor:pointer;margin-right:.25rem', title: '听发音',
        onClick: (e) => { e.stopPropagation(); TTS.speakWord(item.word); }
      }, '🔊 ');
      elm.appendChild(wordBtn);
      elm.appendChild(document.createTextNode(item.word));
      leftCol.appendChild(elm);
    }

    for (const item of rightItems) {
      const elm = el('div', {
        className: `matcher-item ${matched.has(item.origIdx) ? 'matched' : ''}`,
        onClick: () => {
          if (matched.has(item.origIdx) || !selectedLeft) return;
          if (selectedLeft.origIdx === item.origIdx) {
            matched.add(item.origIdx);
            matchCount++;
            selectedLeft = null;
            renderCols();

            if (matchCount === pairs.length) {
              resultDiv.textContent = '✓ 全部匹配正确！太棒了！';
              resultDiv.className = 'quiz-result quiz-result--correct';
              resultDiv.style.display = 'block';
              const rect = item.getBoundingClientRect();
              showConfetti(rect.left + rect.width / 2, rect.top + 50);
              onResult?.(true, matchCount, pairs.length);
            }
          } else {
            selectedLeft = null;
            renderCols();
            resultDiv.textContent = '不匹配，再试一次！';
            resultDiv.className = 'quiz-result quiz-result--wrong';
            resultDiv.style.display = 'block';
          }
        }
      });
      elm.appendChild(el('span', { className: 'matcher-item__icon' }, item.icon || ''));
      elm.appendChild(document.createTextNode(` ${item.zh || ''}`));
      rightCol.appendChild(elm);
    }
  }

  renderCols();

  wrapper.appendChild(leftCol);
  wrapper.appendChild(rightCol);
  item.appendChild(wrapper);

  const resultDiv = el('div', { className: 'quiz-result', style: 'display:none' });
  item.appendChild(resultDiv);
  container.appendChild(item);

  return item;
}
