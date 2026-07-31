/**
 * Generic Unit Page Orchestrator (data-driven)
 * One renderer for every Grade-3 unit (u1..u6) + Revision.
 *
 * URL: grade3/unit.html?unit=u2   (or ?unit=rev)
 * Loads data/grade3/<file>.json and builds the page from the schema.
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
const UNIT_COLORS = {
  u1: '#6DBE45', u2: '#B07ACC', u3: '#FF8C2B', u4: '#3DA5E0',
  u5: '#FF7EB3', u6: '#FF6B6B', rev: '#2D3142'
};
const PART_EMOJI = { A: '💬', B: '🤝', C: '🎨' };

let activatePart = () => {};

export async function initUnit() {
  const unitKey = getUnitKey();
  const isRev = unitKey === 'rev';
  const fileName = isRev ? 'revision.json' : `unit${unitKey.slice(1)}.json`;

  const res = await fetch(`../data/grade3/${fileName}`);
  if (!res.ok) { showError(`找不到单元数据：${fileName}`); return; }
  const data = await res.json();

  // Resolve color / icon from meta.json (single source of truth)
  let color = UNIT_COLORS[unitKey] || '#6DBE45';
  let icon = '📘';
  try {
    const metaRes = await fetch('../data/grade3/meta.json');
    const meta = await metaRes.json();
    const m = isRev ? meta.revision : meta.units.find(u => u.id === unitKey);
    if (m) { color = m.color || color; icon = m.icon || icon; }
  } catch { /* ignore, fall back to defaults */ }

  // Apply part theme color (used by .content-section__title::before)
  document.body.style.setProperty('--part-color', color);

  // Validate quiz data
  const mkResult = validateQuizBank(data.mustKnow?.test || []);
  if (!mkResult.ok) console.warn('Must-know quiz validation:', mkResult.errors);

  renderHeader(data, unitKey, color, icon);
  renderBreadcrumb(data, unitKey);
  renderObjectives(data);
  buildNavAndTabs(data);
  buildPanels(data, unitKey);
  setupTabs(data);
  initSidebar(data.mustKnow?.test || []);
  initMiniTestButton(data.mustKnow?.test || []);

  // TTS init on first user click
  document.addEventListener('click', () => TTS.init(), { once: true });
}

function getUnitKey() {
  const params = new URLSearchParams(location.search);
  const u = params.get('unit');
  if (u && /^(u[1-6]|rev)$/i.test(u)) return u.toLowerCase();
  return 'u1';
}

function showError(msg) {
  const root = document.getElementById('unit-header');
  if (root) {
    root.innerHTML = `<h1>😢 ${msg}</h1><p class="unit-theme"><a href="../grade3.html">← 返回三年级</a></p>`;
  }
}

function renderHeader(data, unitKey, color, icon) {
  const root = document.getElementById('unit-header');
  const badgeText = data.number === 'Rev' ? '期末复习' : `Unit ${data.number}`;
  root.innerHTML = `
    <span class="badge badge--unit" style="background:${color}">${badgeText}</span>
    <h1>${data.titleEn} <small>${data.titleZh}</small></h1>
    <p class="unit-theme">单元主题：${data.theme || ''} ${icon}</p>
  `;
  document.getElementById('nav-current-unit').textContent = badgeText;
}

function renderBreadcrumb(data, unitKey) {
  const crumb = document.getElementById('breadcrumb');
  const badgeText = data.number === 'Rev' ? '期末复习' : `Unit ${data.number}`;
  crumb.innerHTML = `
    <a href="../index.html">首页</a> <span>›</span>
    <a href="../grade3.html">三年级</a> <span>›</span>
    <span>${badgeText} · ${data.titleZh}</span>
  `;
}

function renderObjectives(data) {
  const container = document.getElementById('objectives-list');
  for (const obj of data.objectives || []) {
    container.appendChild(el('li', {}, `${obj.icon || '🎯'} ${obj.text}`));
  }
}

/* ---------- Section helper ---------- */
function addSection(parent, title, builder) {
  const section = el('section', { className: 'content-section' });
  section.appendChild(el('div', { className: 'content-section__title' }, title));
  const inner = el('div', {});
  section.appendChild(inner);
  builder(inner);
  parent.appendChild(section);
  return inner;
}

/* ---------- Nav + Tabs ---------- */
function buildNavAndTabs(data) {
  const navLinks = document.getElementById('unit-nav-links');
  const tabsRoot = document.getElementById('part-tabs');
  navLinks.innerHTML = '';
  tabsRoot.innerHTML = '';

  navLinks.appendChild(el('a', {
    className: 'unit-nav__link',
    href: '#sec-objectives',
    dataset: { target: 'sec-objectives', part: '' }
  }, '🎯 学习目标'));

  for (const pk of ['A', 'B', 'C']) {
    const part = data.parts?.[pk];
    if (!part) continue;
    const label = part.label || `Part ${pk}`;
    navLinks.appendChild(el('a', {
      className: 'unit-nav__link unit-nav__part',
      href: `#part-${pk}`,
      dataset: { target: `part-${pk}`, part: pk }
    }, `${PART_EMOJI[pk] || '📌'} ${label}`));

    tabsRoot.appendChild(el('button', {
      className: 'tab-btn',
      dataset: { part: pk },
      role: 'tab'
    }, label));
  }
}

/* ---------- Panels (data-driven) ---------- */
function buildPanels(data, unitKey) {
  const root = document.getElementById('unit-panels');
  root.innerHTML = '';

  for (const pk of ['A', 'B', 'C']) {
    const part = data.parts?.[pk];
    if (!part) continue;

    const panel = el('div', { className: 'part-panel', id: `part-${pk}`, dataset: { part: pk } });

    if (part.intro) {
      panel.appendChild(el('p', {
        style: 'color:var(--c-gray);font-size:.9rem;margin-bottom:.5rem'
      }, part.intro));
    }

    if (part.dialogue) {
      addSection(panel, '💬 Let\'s talk · 对话', c =>
        renderDialogue(c, part.dialogue, `${unitKey}${pk.toLowerCase()}`));
    }
    if (part.vocab) {
      addSection(panel, '📝 Let\'s learn · 词汇', c =>
        renderVocabGrid(c, part.vocab));
    }
    if (part.phonics) {
      addSection(panel, '🔤 Letters and sounds · 语音', c =>
        renderPhonicsGrid(c, part.phonics));
    }
    if (part.coreSentences) {
      addSection(panel, '✨ 核心句型', c => {
        for (const s of part.coreSentences) renderSentenceBuilder(c, s);
      });
    }
    if (part.expressions) {
      addSection(panel, '💬 常用表达', c => renderExpressions(c, part.expressions));
    }
    if (part.startToRead) {
      addSection(panel, '📖 Start to read', c =>
        renderReadingBlock(c, part.startToRead));
    }
    if (part.readingTime) {
      addSection(panel, '📚 Reading time', c =>
        renderReadingBlock(c, part.readingTime));
    }
    if (part.song) {
      addSection(panel, '🎵 Song · 歌曲', c => renderSong(c, part.song));
    }
    // Part B practice flashcards
    if (part.id === 'B' && part.vocab) {
      addSection(panel, '🃏 重点词汇（网格 / 闪卡）', c =>
        renderFlashcardSection(c, part, unitKey));
    }
    if (part.project) {
      addSection(panel, '🎨 Project · 单元实践', c =>
        renderProject(c, part.project, unitKey));
    }

    root.appendChild(panel);
  }
}

function renderExpressions(container, exprs) {
  container.innerHTML = '';
  const list = el('div', { style: 'display:flex;flex-direction:column;gap:.5rem' });
  for (const ex of exprs) {
    const row = el('div', {
      style: 'display:flex;align-items:center;gap:.75rem;background:var(--c-surface);border-radius:var(--radius-sm);padding:.6rem .9rem;box-shadow:var(--shadow-sm)'
    });
    row.appendChild(el('span', { style: 'font-family:var(--font-en);font-weight:700;flex:1' }, ex.en));
    row.appendChild(el('span', { style: 'color:var(--c-gray);font-size:.85rem' }, ex.zh));
    row.appendChild(audioButton(() => TTS.speakSentence(ex.en)));
    list.appendChild(row);
  }
  container.appendChild(list);
}

function renderReadingBlock(container, block) {
  container.innerHTML = '';
  container.appendChild(el('h4', {
    style: 'margin-bottom:.5rem;color:var(--c-purple)'
  }, `📖 ${block.title}（${block.titleZh}）`));

  const passage = el('div', { className: 'reading-passage' });
  const lines = block.paragraphs || block.passage || [];
  const spoken = [];
  for (const line of lines) {
    for (const para of String(line).split('\n')) {
      passage.appendChild(el('p', {}, para));
      spoken.push(para);
    }
  }
  passage.appendChild(el('div', { style: 'text-align:right;margin-top:.5rem' },
    audioButton(() => TTS.speakSentence(spoken.join('. ')))));
  container.appendChild(passage);
}

function renderSong(container, song) {
  container.innerHTML = '';
  container.appendChild(el('h4', {
    style: 'margin-bottom:.5rem;color:var(--c-purple)'
  }, `🎵 ${song.title}（${song.titleZh}）`));

  const wrap = el('div', { className: 'reading-passage', style: 'font-family:var(--font-en)' });
  for (const line of song.lyrics) wrap.appendChild(el('p', {}, line));
  wrap.appendChild(el('div', { style: 'text-align:right;margin-top:.5rem' },
    audioButton(() => TTS.speakSentence(song.lyrics.join('. ')))));
  container.appendChild(wrap);
}

function renderFlashcardSection(container, part, unitKey) {
  container.innerHTML = '';
  const modeToggle = el('div', { className: 'mode-toggle' });
  const gridBtn = el('button', { className: 'active' }, '📋 网格');
  const flashBtn = el('button', {}, '🔄 闪卡');
  let flashcardRenderer = null;

  gridBtn.addEventListener('click', () => {
    gridBtn.classList.add('active');
    flashBtn.classList.remove('active');
    if (flashcardRenderer?.keyHandler) document.removeEventListener('keydown', flashcardRenderer.keyHandler);
    container.innerHTML = '';
    renderVocabGrid(container, part.vocab, { showExample: false });
  });

  flashBtn.addEventListener('click', () => {
    flashBtn.classList.add('active');
    gridBtn.classList.remove('active');
    container.innerHTML = '';
    flashcardRenderer = renderFlashcard(container, part.vocab, {
      onComplete: () => Progress.markComplete(GRADE, unitKey, 'flashcardsB')
    });
  });

  modeToggle.appendChild(gridBtn);
  modeToggle.appendChild(flashBtn);
  container.parentNode.insertBefore(modeToggle, container);
  renderVocabGrid(container, part.vocab, { showExample: false });
}

function renderProject(container, project, unitKey) {
  container.innerHTML = '';
  const card = el('div', { className: 'project-card' });
  card.appendChild(el('h3', {}, `🎨 ${project.title}（${project.titleEn}）`));

  const steps = el('div', { className: 'project-steps' });
  for (const step of project.steps) {
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
  meaning.appendChild(el('span', {}, ` ${project.meaning}`));
  card.appendChild(meaning);

  const ext = el('div', {
    style: 'background:var(--c-cream2);padding:.75rem;border-radius:var(--radius-sm)'
  });
  ext.appendChild(el('strong', {}, '🚀 实践拓展：'));
  ext.appendChild(el('span', {}, ` ${project.extension}`));
  card.appendChild(ext);

  const done = el('button', {
    className: 'btn btn-green btn-sm',
    style: 'margin-top:1rem',
    onClick: () => {
      Progress.markComplete(GRADE, unitKey, 'project');
      done.innerHTML = '✅ 已完成';
      done.disabled = true;
      done.classList.remove('btn-green');
      done.classList.add('btn-outline');
    }
  }, '✔ 标记完成');
  card.appendChild(done);

  container.appendChild(card);
}

/* ---------- Tabs + Sidebar ---------- */
function setupTabs(data) {
  const tabs = document.querySelectorAll('#part-tabs .tab-btn');
  const panels = document.querySelectorAll('#unit-panels .part-panel');

  activatePart = (part) => {
    tabs.forEach(t => t.classList.toggle('active', t.dataset.part === part));
    panels.forEach(p => p.classList.toggle('active', p.dataset.part === part));
    document.querySelectorAll('#unit-nav-links .unit-nav__part').forEach(a =>
      a.classList.toggle('active', a.dataset.part === part));
  };

  tabs.forEach(tab => tab.addEventListener('click', () => activatePart(tab.dataset.part)));

  const firstPart = ['A', 'B', 'C'].find(pk => data.parts?.[pk]);
  activatePart(firstPart || '');
}

function initSidebar(testQuestions) {
  const links = document.querySelectorAll('#unit-nav-links a[data-target]');
  links.forEach(a => {
    a.addEventListener('click', (e) => {
      e.preventDefault();
      const part = a.dataset.part;
      if (part) activatePart(part);
      document.getElementById(a.dataset.target)?.scrollIntoView({ behavior: 'smooth' });
    });
  });
}

function initMiniTestButton(testQuestions) {
  document.getElementById('nav-mini-test')?.addEventListener('click', () => openMiniTest(testQuestions));
}

/* ---------- Mini Test Modal ---------- */
function openMiniTest(testQuestions) {
  if (!testQuestions.length) {
    alert('本单元暂无必考点小测题目。');
    return;
  }
  let score = 0;
  let answered = 0;

  const overlay = el('div', { className: 'modal-overlay mini-test-modal' });
  const modal = el('div', { className: 'modal', style: 'position:relative' });

  const closeBtn = el('button', {
    className: 'modal-close',
    onClick: () => { document.body.removeChild(overlay); TTS.stop(); }
  }, '✕');

  modal.appendChild(el('h2', {}, '⭐ 必考点小测'));
  modal.appendChild(el('p', { style: 'color:var(--c-gray);margin-bottom:1rem' },
    `${testQuestions.length} 道题，检测本单元必考点掌握情况`));

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

      const uk = getUnitKey();
      Progress.setScore(GRADE, uk, score, testQuestions.length);
      Progress.markComplete(GRADE, uk, 'mustKnowTest');

      const doneBtn = el('button', {
        className: 'btn btn-primary',
        style: 'display:block;margin:1rem auto 0',
        onClick: () => document.body.removeChild(overlay)
      }, '完成');
      questionsContainer.appendChild(doneBtn);
    }
  }

  for (const q of testQuestions) {
    if (q.type === 'multiple-choice') renderMultipleChoice(questionsContainer, q, onResult);
    else if (q.type === 'listen-pick') renderListenPick(questionsContainer, q, onResult);
    else if (q.type === 'matcher') renderMatcher(questionsContainer, q, onResult);
  }
}
