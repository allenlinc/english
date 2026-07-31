/**
 * Multiple Choice Quiz Component
 */
import { el, showConfetti } from '../../utils/dom.js';
import { shuffleSeeded, hashStr } from '../../utils/shuffle.js';

export function renderMultipleChoice(container, question, onResult) {
  const { id, prompt, options, answer } = question;
  const shuffled = shuffleSeeded(options, hashStr(id));
  const correctIdx = shuffled.indexOf(options[answer]);

  let selectedIdx = null;
  let submitted = false;

  const item = el('div', { className: 'quiz-item' });
  const header = el('div', { className: 'quiz-item__prompt' });
  header.appendChild(el('span', { className: 'quiz-item__num' }, '?'));
  header.appendChild(el('span', {}, prompt));
  item.appendChild(header);

  const optsContainer = el('div', { className: 'quiz-options' });
  const letters = ['A', 'B', 'C', 'D'];

  for (let i = 0; i < shuffled.length; i++) {
    const opt = el('div', {
      className: 'quiz-option',
      onClick: () => {
        if (submitted) return;
        selectedIdx = i;
        optsContainer.querySelectorAll('.quiz-option').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        submitBtn.disabled = false;
      }
    });
    opt.appendChild(el('span', { className: 'quiz-option__letter' }, letters[i]));
    opt.appendChild(el('span', {}, shuffled[i]));
    optsContainer.appendChild(opt);
  }

  item.appendChild(optsContainer);

  const resultDiv = el('div', { className: 'quiz-result', style: 'display:none' });

  const submitBtn = el('button', {
    className: 'btn btn-primary btn-sm quiz-submit',
    disabled: true,
    onClick: () => {
      if (submitted) return;
      submitted = true;
      submitBtn.disabled = true;

      const isCorrect = selectedIdx === correctIdx;
      const allOpts = optsContainer.querySelectorAll('.quiz-option');

      // Highlight correct answer
      allOpts[correctIdx].classList.add('correct');

      if (!isCorrect) {
        allOpts[selectedIdx].classList.add('wrong');
        allOpts[selectedIdx].classList.add('shake');
        setTimeout(() => allOpts[selectedIdx].classList.remove('shake'), 400);
        resultDiv.textContent = `✗ 正确答案是 ${letters[correctIdx]}`;
        resultDiv.className = 'quiz-result quiz-result--wrong';
      } else {
        resultDiv.textContent = '✓ 回答正确！';
        resultDiv.className = 'quiz-result quiz-result--correct';
        const rect = item.getBoundingClientRect();
        showConfetti(rect.left + rect.width / 2, rect.top + 50);
      }
      resultDiv.style.display = 'block';
      onResult?.(isCorrect);
    }
  }, '提交答案');
  item.appendChild(submitBtn);
  item.appendChild(resultDiv);
  container.appendChild(item);

  return item;
}
