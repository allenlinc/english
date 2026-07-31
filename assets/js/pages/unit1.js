/**
 * Unit 1 Page Orchestrator
 */
import { TTS } from '../core/tts.js';
import { Progress } from '../core/progress.js';
import { el, audioButton } from '../utils/dom.js';
import { validateQuizBank } from '../utils/validator.js';
import { renderDialogue } from '../components/dialogue.js';
import { renderVocabGrid } from '../components/vocab-grid.js';
import { renderPhonicsGrid } from '../components/phonics-card.js';
import { renderFlashcard } from '../components/flashcard.js';
import { renderSentenceBuilder } from '../components/sentence-builder.js';
import { renderMultipleChoice } from '../components/quiz/multiple-choice.js';
import { renderListenPick } from '../components/quiz/listen-pick.js';
import { renderMatcher } from '../components/quiz/matcher.js';

const GRADE = 3;
const UNIT = 1;

// Cross-section navigation: switch active part tab (must-know -> Part B)
let activatePart = () => {};

export async function initUnit1() {
  const res = await fetch('../data/grade3/unit1.json');
  const data = await res.json();

  // Validate quiz data
  const mkResult = validateQuizBank(data.mustKnow.test);
  if (!mkResult.ok) console.warn('Must-know quiz validation:', mkResult.errors);

  // Render objectives
  renderObjectives(data);

  // Setup tabs
  setupTabs();

  // Render each part
  renderPartA(data.parts.A);
  renderPartB(data.parts.B);
  renderPartC(data.parts.C);

  // Render must-know section
  renderMustKnow(data.mustKnow);

  // TTS init on first user click
  document.addEventListener('click', () => TTS.init(), { once: true });
}

function renderObjectives(data) {
  const container = document.getElementById('objectives-list');
  for (const obj of data.objectives) {
    const li = el('li', {}, `${obj.icon || '🎯'} ${obj.text}`);
    container.appendChild(li);
  }
}

function setupTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const panels = document.querySelectorAll('.part-panel');

  activatePart = (part) => {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.part === part));
    panels.forEach(p => p.classList.toggle('active', p.dataset.part === part));
  };

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activatePart(tab.dataset.part));
  });

  // Default: show Part A
  activatePart('A');
}

// --- Part A ---
function renderPartA(part) {
  renderDialogue(document.getElementById('pa-dialogue'), part.dialogue, 'u1a');
  renderVocabGrid(document.getElementById('pa-vocab'), part.vocab);
  renderPhonicsGrid(document.getElementById('pa-phonics'), part.phonics);

  // Core sentences
  const sentContainer = document.getElementById('pa-sentences');
  for (const s of part.coreSentences) {
    renderSentenceBuilder(sentContainer, s);
  }

  // Mark vocab section as listenable section in progress when all audio clicked
  const allAudioBtns = document.querySelectorAll('#part-A .audio-btn');
  let clickedCount = 0;
  allAudioBtns.forEach(b => {
    b.addEventListener('click', () => {
      clickedCount++;
      if (clickedCount >= 3 && !Progress.getCompleted(GRADE, UNIT).includes('partA')) {
        Progress.markComplete(GRADE, UNIT, 'partA');
      }
    });
  });
}

// --- Part B ---
function renderPartB(part) {
  renderDialogue(document.getElementById('pb-dialogue'), part.dialogue, 'u1b');
  renderVocabGrid(document.getElementById('pb-vocab'), part.vocab);

  // Core sentences
  const sentContainer = document.getElementById('pb-sentences');
  for (const s of part.coreSentences) {
    renderSentenceBuilder(sentContainer, s);
  }

  // Start to read
  if (part.startToRead) {
    const readContainer = document.getElementById('pb-startread');
    readContainer.innerHTML = '';
    const title = el('h4', { style: 'margin-bottom:.5rem;color:var(--c-purple)' },
      `📖 ${part.startToRead.title}（${part.startToRead.titleZh}）`);
    readContainer.appendChild(title);

    const passage = el('div', { className: 'reading-passage' });
    for (const line of part.startToRead.passage) {
      passage.appendChild(el('p', {}, line));
    }
    const audio = audioButton(() => TTS.speakSentence(part.startToRead.passage.join('. ')));
    passage.appendChild(el('div', { style: 'text-align:right;margin-top:.5rem' }, audio));
    readContainer.appendChild(passage);
  }

  // Reading time
  if (part.readingTime) {
    const rtContainer = document.getElementById('pb-reading');
    rtContainer.innerHTML = '';
    const title = el('h4', { style: 'margin-bottom:.5rem;color:var(--c-purple)' },
      `📚 ${part.readingTime.title}（${part.readingTime.titleZh}）`);
    rtContainer.appendChild(title);

    const passage = el('div', { className: 'reading-passage' });
    for (const para of part.readingTime.paragraphs) {
      passage.appendChild(el('p', {}, para));
    }
    const audio = audioButton(() => TTS.speakSentence(part.readingTime.paragraphs.join('. ')));
    passage.appendChild(el('div', { style: 'text-align:right;margin-top:.5rem' }, audio));
    rtContainer.appendChild(passage);
  }

  // Flashcard mode for Part B vocab
  const fcContainer = document.getElementById('pb-flashcards');
  fcContainer.innerHTML = '';
  const modeToggle = el('div', { className: 'mode-toggle' });
  const gridBtn = el('button', { className: 'active' }, '📋 网格');
  const flashBtn = el('button', {}, '🔄 闪卡');

  let flashcardRenderer = null;

  gridBtn.addEventListener('click', () => {
    gridBtn.classList.add('active');
    flashBtn.classList.remove('active');
    if (flashcardRenderer?.keyHandler) document.removeEventListener('keydown', flashcardRenderer.keyHandler);
    fcContainer.innerHTML = '';
    renderVocabGrid(fcContainer, part.vocab, { showExample: false });
  });

  flashBtn.addEventListener('click', () => {
    flashBtn.classList.add('active');
    gridBtn.classList.remove('active');
    fcContainer.innerHTML = '';
    flashcardRenderer = renderFlashcard(fcContainer, part.vocab, {
      onComplete: () => Progress.markComplete(GRADE, UNIT, 'flashcardsB')
    });
  });

  modeToggle.appendChild(gridBtn);
  modeToggle.appendChild(flashBtn);
  fcContainer.parentNode.insertBefore(modeToggle, fcContainer);

  // Default grid view
  renderVocabGrid(fcContainer, part.vocab, { showExample: false });
}

// --- Part C ---
function renderPartC(part) {
  const proj = part.project;
  const container = document.getElementById('pc-project');
  container.innerHTML = '';

  const card = el('div', { className: 'project-card' });
  card.appendChild(el('h3', {}, `🎨 ${proj.title}（${proj.titleEn}）`));

  const steps = el('div', { className: 'project-steps' });
  for (const step of proj.steps) {
    const s = el('div', { className: 'project-step' });
    s.appendChild(el('span', { className: 'project-step__icon' }, step.icon));
    s.appendChild(el('div', { className: 'project-step__label' }, step.label));
    steps.appendChild(s);
  }
  card.appendChild(steps);

  const meaning = el('div', {
    style: 'background:var(--c-cream2);padding:.75rem;border-radius:var(--radius-sm);margin:.75rem 0'
  });
  meaning.appendChild(el('strong', {}, '💡 实践意义：'));
  meaning.appendChild(el('span', {}, ` ${proj.meaning}`));
  card.appendChild(meaning);

  const ext = el('div', {
    style: 'background:var(--c-cream2);padding:.75rem;border-radius:var(--radius-sm)'
  });
  ext.appendChild(el('strong', {}, '🚀 实践拓展：'));
  ext.appendChild(el('span', {}, ` ${proj.extension}`));
  card.appendChild(ext);

  // Completion button
  const done = el('button', {
    className: 'btn btn-green btn-sm',
    style: 'margin-top:1rem',
    onClick: () => {
      Progress.markComplete(GRADE, UNIT, 'project');
      done.innerHTML = '✅ 已完成';
      done.disabled = true;
      done.classList.remove('btn-green');
      done.classList.add('btn-outline');
    }
  }, '✔ 标记完成');
  card.appendChild(done);

  container.appendChild(card);
}

// --- Must-Know Section ---
function renderMustKnow(mk) {
  const grid = document.getElementById('mk-grid');
  grid.innerHTML = '';

  // Vocab card
  const vocabCard = el('div', { className: 'mk-card mk-card--vocab' });
  vocabCard.appendChild(el('h3', {}, `📌 必考词汇（${mk.vocabCount} 个）`));
  vocabCard.appendChild(el('p', {}, mk.vocab.join(' / ')));
  const vocabBtn = el('button', {
    className: 'btn btn-green btn-sm',
    onClick: () => {
      // 先切到 Part B 让闪卡区域可见，再滚动过去
      activatePart('B');
      document.getElementById('pb-flashcards')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, '去看闪卡');
  vocabCard.appendChild(vocabBtn);
  grid.appendChild(vocabCard);

  // Grammar card
  const grammarCard = el('div', { className: 'mk-card mk-card--grammar' });
  grammarCard.appendChild(el('h3', {}, `📝 必考句型（${mk.sentenceCount} 句）`));
  grammarCard.appendChild(el('p', {}, mk.sentences.join(' / ')));
  const grammarBtn = el('button', {
    className: 'btn btn-blue btn-sm',
    onClick: () => {
      document.getElementById('pa-sentences')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, '去练句型');
  grammarCard.appendChild(grammarBtn);
  grid.appendChild(grammarCard);

  // Phonics card
  const phonicsCard = el('div', { className: 'mk-card mk-card--phonics' });
  phonicsCard.appendChild(el('h3', {}, `🔤 必考语音（${mk.phonicsCount} 个）`));
  phonicsCard.appendChild(el('p', {}, mk.phonics.join('  ')));
  const phonicsBtn = el('button', {
    className: 'btn btn-sm',
    style: 'background:var(--c-purple);color:white',
    onClick: () => {
      document.getElementById('pa-phonics')?.scrollIntoView({ behavior: 'smooth' });
    }
  }, '去听发音');
  phonicsCard.appendChild(phonicsBtn);
  grid.appendChild(phonicsCard);

  // Mini test card
  const testCard = el('div', { className: 'mk-card mk-card--test' });
  testCard.appendChild(el('h3', {}, `📝 必考点小测（${mk.test.length} 题）`));
  testCard.appendChild(el('p', {}, '3 分钟检测学习效果'));
  const testBtn = el('button', {
    className: 'btn btn-accent btn-sm',
    onClick: () => openMiniTest(mk.test)
  }, '开始小测');
  testCard.appendChild(testBtn);
  grid.appendChild(testCard);
}

function openMiniTest(testQuestions) {
  let score = 0;
  let answered = 0;

  const overlay = el('div', { className: 'modal-overlay mini-test-modal' });
  const modal = el('div', { className: 'modal', style: 'position:relative' });

  const closeBtn = el('button', {
    className: 'modal-close',
    onClick: () => { document.body.removeChild(overlay); TTS.stop(); }
  }, '✕');

  modal.appendChild(el('h2', {}, '⭐ 必考点小测'));
  modal.appendChild(el('p', { style: 'color:var(--c-gray);margin-bottom:1rem' }, `${testQuestions.length} 道题，检测 Unit 1 必考点掌握情况`));

  const scoreDisplay = el('div', {
    style: 'text-align:center;font-size:1.1rem;font-weight:700;margin-bottom:.75rem;color:var(--c-orange)'
  }, '');

  const questionsContainer = el('div', {});
  modal.appendChild(closeBtn);
  modal.appendChild(scoreDisplay);
  modal.appendChild(questionsContainer);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  function onResult(correct) {
    answered++;
    if (correct) score++;
    scoreDisplay.textContent = `已答 ${answered}/${testQuestions.length}  ·  正确 ${score}`;
    if (answered === testQuestions.length) {
      const pct = Math.round((score / testQuestions.length) * 100);
      const grade = pct >= 80 ? '🏆 优秀！' : pct >= 60 ? '👍 不错！' : '💪 继续加油！';
      scoreDisplay.textContent = `${grade} 得分 ${score}/${testQuestions.length}（${pct}%）`;

      // Save to progress
      Progress.setScore(GRADE, UNIT, score, testQuestions.length);
      Progress.markComplete(GRADE, UNIT, 'mustKnowTest');

      // Close button
      const doneBtn = el('button', {
        className: 'btn btn-primary',
        style: 'display:block;margin:1rem auto 0',
        onClick: () => document.body.removeChild(overlay)
      }, '完成');
      questionsContainer.appendChild(doneBtn);
    }
  }

  for (const q of testQuestions) {
    if (q.type === 'multiple-choice') {
      renderMultipleChoice(questionsContainer, q, onResult);
    } else if (q.type === 'listen-pick') {
      renderListenPick(questionsContainer, q, onResult);
    } else if (q.type === 'matcher') {
      renderMatcher(questionsContainer, q, onResult);
    }
  }
}
