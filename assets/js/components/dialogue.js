/**
 * Dialogue Bubble Component
 */
import { TTS } from '../core/tts.js';
import { audioButton, el } from '../utils/dom.js';

export function renderDialogue(container, dialogueData, unitPartId) {
  const { lines } = dialogueData;
  const wrapper = el('div', { className: 'unit-dialogue' });

  // Mode controls
  const controls = el('div', { className: 'dialogue-controls' });
  let mode = 'en';
  const modes = [
    { value: 'en', label: 'English' },
    { value: 'zh', label: '中文' },
    { value: 'both', label: '中英对照' },
  ];
  for (const m of modes) {
    const btn = el('button', {
      className: `dialogue-mode-btn${m.value === mode ? ' active' : ''}`,
      onClick: () => {
        mode = m.value;
        controls.querySelectorAll('.dialogue-mode-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        renderLines();
      }
    }, m.label);
    controls.appendChild(btn);
  }
  const playAllBtn = audioButton(() => speakAll(mode), '');
  playAllBtn.title = '播放全部对话';
  playAllBtn.style.cssText = 'width:auto;border-radius:20px;padding:0.3rem 0.75rem;font-size:0.8rem';
  playAllBtn.innerHTML = '🔊 播放全部';
  controls.appendChild(playAllBtn);
  wrapper.appendChild(controls);

  const bubbleContainer = el('div', { className: 'dialogue-box' });
  wrapper.appendChild(bubbleContainer);
  container.appendChild(wrapper);

  async function speakAll(m) {
    for (const line of lines) {
      if (m === 'zh') {
        await TTS.speakChinese(line.zh);
      } else {
        await TTS.speakSentence(line.en);
      }
      await new Promise(r => setTimeout(r, 400));
    }
  }

  function renderLines() {
    bubbleContainer.innerHTML = '';
    lines.forEach((line, i) => {
      const side = i % 2 === 0 ? 'left' : 'right';
      const lineEl = el('div', { className: `dialogue-line dialogue-line--${side}` });
      const bubble = el('div', { className: 'dialogue-bubble' });

      const speaker = el('div', { className: 'dialogue-speaker' }, line.speaker);

      if (mode === 'en' || mode === 'both') {
        bubble.appendChild(el('div', { className: 'dialogue-en' }, line.en));
      }
      if (mode === 'zh' || mode === 'both') {
        bubble.appendChild(el('div', { className: 'dialogue-zh' }, line.zh));
      }

      bubble.insertBefore(speaker, bubble.firstChild);
      lineEl.appendChild(bubble);

      const speakText = mode === 'zh' ? line.zh : line.en;
      const speakLang = mode === 'zh' ? 'zh-CN' : 'en-US';
      const audio = audioButton(() => {
        if (mode === 'zh') return TTS.speakChinese(speakText);
        return TTS.speakSentence(speakText);
      });
      lineEl.appendChild(audio);

      bubbleContainer.appendChild(lineEl);
    });
  }

  renderLines();
  return { markComplete: () => {} };
}
