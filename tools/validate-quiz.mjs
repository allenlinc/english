/**
 * Quiz Validator CLI
 * Usage: node tools/validate-quiz.mjs data/grade3/unit1.json
 *
 * Checks all quiz questions against anti-cheat rules:
 * 1. Has id (stable shuffle)
 * 2. 3-4 options
 * 3. Correct not strictly longest/shortest
 * 4. No "书中说" attestations
 * 5. Cross-question answer position balance
 */

import { readFileSync } from 'fs';

const filePath = process.argv[2];
if (!filePath) {
  console.error('Usage: node tools/validate-quiz.mjs <path-to-unit.json>');
  process.exit(1);
}

const raw = readFileSync(filePath, 'utf-8');
let data;
try { data = JSON.parse(raw); } catch (e) {
  console.error('Invalid JSON:', e.message);
  process.exit(1);
}

/** Validate a single question */
function validateQuiz(question) {
  const errors = [];
  if (!question.id) errors.push('missing id');

  if (question.type === 'multiple-choice' || question.type === 'listen-pick') {
    if (!question.options || question.options.length < 3) errors.push('need ≥3 options');
    if (question.options && question.options.length > 4) errors.push('too many options (max 4)');

    if (question.options && question.answer !== undefined) {
      const lens = question.options.map(o => String(o).length);
      const maxLen = Math.max(...lens);
      const minLen = Math.min(...lens);
      const correctLen = lens[question.answer];

      if (maxLen - minLen > 4) {
        const sameAsCorrect = lens.filter(l => l === correctLen).length;
        if (correctLen === maxLen && sameAsCorrect === 1) {
          errors.push(`correct (idx ${question.answer}) is strictly longest (${correctLen} vs max ${maxLen})`);
        }
        if (correctLen === minLen && sameAsCorrect === 1) {
          errors.push(`correct (idx ${question.answer}) is strictly shortest (${correctLen} vs min ${minLen})`);
        }
      }

      const attestationPattern = /书中说|教材说|课本说|the book says|in the book|教材帮说|据.*说/i;
      question.options.forEach((opt, i) => {
        if (i !== question.answer && attestationPattern.test(String(opt))) {
          errors.push(`option ${i} breaks distractor rule: "${opt}"`);
        }
      });
    }
  }
  return { ok: errors.length === 0, errors, id: question.id };
}

function validateBank(bank, label) {
  console.log(`\n=== ${label} (${bank.length} questions) ===`);

  const results = bank.map(q => validateQuiz(q));
  let totalErrors = 0;
  let allErrors = [];

  results.forEach((r, i) => {
    const icon = r.ok ? '✅' : '❌';
    console.log(`  ${icon} Q${i+1} (${r.id})`);
    if (!r.ok) {
      r.errors.forEach(e => console.log(`     → ${e}`));
      totalErrors++;
      allErrors.push(...r.errors.map(e => `Q${i+1} (${r.id}): ${e}`));
    }
  });

  // Cross-question: answer position distribution
  const posCounts = {};
  bank.forEach((q, qi) => {
    if (q.answer !== undefined) {
      posCounts[q.answer] = (posCounts[q.answer] || 0) + 1;
    }
  });

  const choices = bank.filter(q => q.answer !== undefined).length;
  if (choices > 0) {
    const maxCount = Math.max(...Object.values(posCounts));
    const pct = Math.round(maxCount / choices * 100);
    console.log(`\n  📊 Answer position distribution: ${JSON.stringify(posCounts)}`);
    if (maxCount / choices > 0.6) {
      console.log(`  ⚠️  Answer bias: ${maxCount}/${choices} (${pct}%) — exceeds 60% threshold`);
      allErrors.push(`Answer bias: ${pct}%`);
    } else {
      console.log(`  ✅ Distribution balanced (max ${pct}%)`);
    }
  }

  return { ok: allErrors.length === 0, errors: allErrors };
}

// Run
console.log(`Quiz Validator — ${filePath}`);
console.log('='.repeat(50));

let exitCode = 0;

if (data.mustKnow?.test) {
  const r = validateBank(data.mustKnow.test, 'Must-Know Test');
  if (!r.ok) exitCode = 1;
}

if (data.review) {
  const r = validateBank(data.review, 'Unit Review');
  if (!r.ok) exitCode = 1;
}

console.log('\n' + '='.repeat(50));
if (exitCode === 0) {
  console.log('🎉 ALL CHECKS PASSED — Quiz is clean and ready to publish.');
} else {
  console.log('❌ VALIDATION FAILED — Fix the above errors before publishing.');
}
process.exit(exitCode);
