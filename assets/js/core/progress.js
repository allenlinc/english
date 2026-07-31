/**
 * Progress Tracker — localStorage wrapper
 * Keys: g{grade}u{unit}.{section}
 */
export const Progress = {
  STORAGE_KEY: 'english_learning_progress',

  /** Build a storage key */
  key(grade, unit, section = null) {
    const base = `g${grade}u${unit}`;
    return section ? `${base}.${section}` : base;
  },

  /** Read all progress data */
  _read() {
    try {
      return JSON.parse(localStorage.getItem(this.STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  },

  /** Write all progress data */
  _write(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch {
      console.warn('[Progress] localStorage write failed — privacy mode?');
    }
  },

  /** Mark a section as complete */
  markComplete(grade, unit, section) {
    const k = this.key(grade, unit);
    const data = this._read();
    if (!data[k]) data[k] = { completed: [], score: null, lastVisit: null };
    if (!data[k].completed.includes(section)) {
      data[k].completed.push(section);
    }
    data[k].lastVisit = Date.now();
    this._write(data);
  },

  /** Get sections completed for a unit */
  getCompleted(grade, unit) {
    const k = this.key(grade, unit);
    const data = this._read();
    return data[k]?.completed || [];
  },

  /** Get progress ratio for a unit (0–1) */
  getUnitProgress(grade, unit, totalSections) {
    const completed = this.getCompleted(grade, unit);
    if (!totalSections || totalSections === 0) return 0;
    return Math.min(completed.length / totalSections, 1);
  },

  /** Get score for a unit quiz */
  getScore(grade, unit) {
    const k = this.key(grade, unit);
    const data = this._read();
    return data[k]?.score ?? null;
  },

  /** Set score for a unit quiz */
  setScore(grade, unit, score, total) {
    const k = this.key(grade, unit);
    const data = this._read();
    if (!data[k]) data[k] = { completed: [], score: null, lastVisit: null };
    data[k].score = { correct: score, total, pct: Math.round((score / total) * 100) };
    this._write(data);
  },

  /** Get all unit progress for a grade (for hub page) */
  getGradeProgress(grade, unitIds, totalSectionsMap) {
    return unitIds.map(uid => ({
      unitId: uid,
      progress: this.getUnitProgress(grade, uid, totalSectionsMap[uid] || 10),
      completed: this.getCompleted(grade, uid),
      score: this.getScore(grade, uid),
    }));
  },

  /** Find first unfinished unit (for daily recommendation) */
  getRecommendedUnit(grade, unitIds, totalSectionsMap) {
    for (const uid of unitIds) {
      const p = this.getUnitProgress(grade, uid, totalSectionsMap[uid] || 10);
      if (p < 1) return uid;
    }
    return unitIds[0]; // all done, recommend first
  },

  /** Reset all progress (debug) */
  reset() {
    try { localStorage.removeItem(this.STORAGE_KEY); } catch {}
  },

  /** Export progress as JSON string */
  export() {
    return JSON.stringify(this._read(), null, 2);
  },

  /** Import progress from JSON string */
  import(jsonStr) {
    try {
      const data = JSON.parse(jsonStr);
      this._write(data);
      return true;
    } catch { return false; }
  },
};
