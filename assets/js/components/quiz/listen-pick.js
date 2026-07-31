/**
 * Listen & Pick Component — hear a word, pick the correct match
 */
import { TTS } from '../../core/tts.js';
import { el, showConfetti } from '../../utils/dom.js';
import { shuffleSeeded, hashStr } from '../../utils/shuffle.js';

export function renderListenPick(container, question, onResult) {
  const { id, prompt, audio, options, answer } = question;
  const shuffled = shuffleSeeded(options, hashStr(id));
  const correctIdx = shuffled.indexOf(options[answer]);

  let submitted = false;

  const item = el('div', { className: 'quiz-item' });
  const header = el('div', { className: 'quiz-item__prompt' });
  header.appendChild(el('span', { className: 'quiz-item__num' }, '👂'));
  header.appendChild(el('span', {}, prompt));
  const replay = el('button', {
    className: 'btn btn-blue btn-sm',
    style: 'margin-left:auto',
    onClick: () => TTS.speakWord(audio)
  }, '🔊 再听一次');
  header.appendChild(replay);
  item.appendChild(header);

  // Auto-play
  setTimeout(() => TTS.speakWord(audio), 300);

  const optsContainer = el('div', { className: 'quiz-options' });

  for (let i = 0; i < shuffled.length; i++) {
    const opt = el('div', {
      className: 'quiz-option',
      onClick: () => {
        if (submitted) return;
        submitted = true;

        if (i === correctIdx) {
          opt.classList.add('correct');
          resultDiv.textContent = '✓ 回答正确！';
          resultDiv.className = 'quiz-result quiz-result--correct';
          const rect = item.getBoundingClientRect();
          showConfetti(rect.left + rect.width / 2, rect.top + 50);
          onResult?.(true);
        } else {
          opt.classList.add('wrong');
          opt.classList.add('shake');
          setTimeout(() => opt.classList.remove('shake'), 400);
          optsContainer.children[correctIdx].classList.add('correct');
          resultDiv.textContent = `✗ 正确答案是：${options[answer]}`;
          resultDiv.className = 'quiz-result quiz-result--wrong';
          onResult?.(false);
        }
        resultDiv.style.display = 'block';

        // Disable all options
        for (const o of optsContainer.children) o.style.pointerEvents = 'none';
      }
    });
    opt.appendChild(el('span', {}, shuffled[i]));
    optsContainer.appendChild(opt);
  }

  item.appendChild(optsContainer);

  const resultDiv = el('div', { className: 'quiz-result', style: 'display:none' });
  item.appendChild(resultDiv);
  container.appendChild(item);

  return item;
}
