/**
 * Quiz Validator — anti-cheat enforcement
 *
 * Rules (permanent, cross-project):
 * 1. Each question must have id (stable shuffle seed)
 * 2. Options count 3–4
 * 3. Correct answer must NOT be strictly longest or shortest
 * 4. Distractors must NOT contain "书中说/教材说/the book says" etc.
 * 5. Cross-question: answer position distribution must be balanced
 */

/** Validate a single quiz question */
export function validateQuiz(question) {
  const errors = [];

  // Must have id
  if (!question.id) {
    errors.push('missing id — required for stable shuffle');
  }

  // Multiple choice specific
  if (question.type === 'multiple-choice' || question.type === 'listen-pick') {
    if (!question.options || question.options.length < 3) {
      errors.push('need at least 3 options');
    }
    if (question.options && question.options.length > 4) {
      errors.push('too many options (max 4)');
    }

    if (question.options && question.answer !== undefined) {
      const lens = question.options.map(o => String(o).length);
      const maxLen = Math.max(...lens);
      const minLen = Math.min(...lens);
      const correctLen = lens[question.answer];

      // Correct should not be strictly longest when diff > 4 chars
      if (maxLen - minLen > 4) {
        const sameAsCorrect = lens.filter(l => l === correctLen).length;
        if (correctLen === maxLen && sameAsCorrect === 1) {
          errors.push(`correct (idx ${question.answer}) is strictly longest`);
        }
        if (correctLen === minLen && sameAsCorrect === 1) {
          errors.push(`correct (idx ${question.answer}) is strictly shortest`);
        }
      }

      // No "book says" attestations in distractors
      const attestationPattern = /书中说|教材说|课本说|the book says|in the book|教材帮说|据.*说/i;
      question.options.forEach((opt, i) => {
        if (i !== question.answer && attestationPattern.test(String(opt))) {
          errors.push(`option ${i} breaks distractor rule (book attestation)`);
        }
      });
    }
  }

  return { ok: errors.length === 0, errors, id: question.id };
}

/** Validate an entire quiz bank (cross-question checks) */
export function validateQuizBank(bank) {
  const results = bank.map(q => validateQuiz(q));
  const allErrors = [];

  // Cross-question: answer position distribution
  const positionCounts = {};
  bank.forEach((q, qi) => {
    if (q.answer !== undefined) {
      positionCounts[q.answer] = (positionCounts[q.answer] || 0) + 1;
    }
  });

  const maxCount = Math.max(0, ...Object.values(positionCounts));
  const totalQuestions = bank.filter(q => q.answer !== undefined).length;

  if (totalQuestions > 0 && maxCount / totalQuestions > 0.6) {
    allErrors.push(
      `Answer position bias: ${maxCount}/${totalQuestions} (${Math.round(maxCount/totalQuestions*100)}%) questions have the same answer index. Must be <= 60%.`
    );
  }

  // Gather per-question errors
  results.forEach((r, i) => {
    if (!r.ok) {
      allErrors.push(...r.errors.map(e => `Q${i + 1} (${r.id}): ${e}`));
    }
  });

  return {
    ok: allErrors.length === 0,
    errors: allErrors,
    perQuestion: results,
  };
}
