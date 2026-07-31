/**
 * TTS Engine — Web Speech API wrapper
 * Features: child-voice preference, iOS Safari compatibility, rate/pitch tuning
 */
export class TTS {
  static voices = { en: null, zh: null };
  static ready = false;
  static readyPromise = null;
  static speaking = false;

  /** Wait for voices to load (required for iOS Safari) */
  static async init() {
    if (TTS.ready) return;
    if (TTS.readyPromise) return TTS.readyPromise;

    TTS.readyPromise = new Promise((resolve) => {
      const loadVoices = () => {
        const all = speechSynthesis.getVoices();
        if (all.length === 0) return; // wait more

        // Prefer child-like voices
        const enPrefs = ['Samantha', 'Karen', 'Moira', 'Fiona', 'Google UK English Female', 'Microsoft Zira'];
        const zhPrefs = ['Tingting', 'Sin-Ji', 'Google 普通话（中国大陆）', 'Microsoft Xiaoxiao'];

        for (const v of all) {
          if (v.lang.startsWith('en') && !TTS.voices.en) {
            const match = enPrefs.find(p => v.name.includes(p));
            if (match) TTS.voices.en = v;
          }
          if (v.lang.startsWith('zh') && !TTS.voices.zh) {
            const match = zhPrefs.find(p => v.name.includes(p));
            if (match) TTS.voices.zh = v;
          }
        }

        // Fallback
        if (!TTS.voices.en) TTS.voices.en = all.find(v => v.lang.startsWith('en')) || all[0];
        if (!TTS.voices.zh) TTS.voices.zh = all.find(v => v.lang.startsWith('zh')) || all[0];

        TTS.ready = true;
        speechSynthesis.onvoiceschanged = null;
        resolve();
      };

      speechSynthesis.onvoiceschanged = loadVoices;
      loadVoices();
    });

    return TTS.readyPromise;
  }

  /**
   * Speak text aloud
   * @param {string} text
   * @param {'en-US'|'zh-CN'} lang
   * @param {object} opts — { rate, pitch }
   */
  static async speak(text, lang = 'en-US', opts = {}) {
    await TTS.init();

    // Cancel any ongoing speech
    speechSynthesis.cancel();
    TTS.speaking = true;

    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;
    utter.rate = opts.rate ?? 0.85;
    utter.pitch = opts.pitch ?? (lang === 'zh-CN' ? 1.0 : 1.1);
    utter.volume = 1;

    const voice = lang.startsWith('zh') ? TTS.voices.zh : TTS.voices.en;
    if (voice) utter.voice = voice;

    return new Promise((resolve) => {
      utter.onend = () => { TTS.speaking = false; resolve(); };
      utter.onerror = () => { TTS.speaking = false; resolve(); };
      speechSynthesis.speak(utter);
    });
  }

  /** Quick speak English word (optimized for child learner) */
  static async speakWord(word) {
    return TTS.speak(word, 'en-US', { rate: 0.8, pitch: 1.15 });
  }

  /** Quick speak Chinese */
  static async speakChinese(text) {
    return TTS.speak(text, 'zh-CN', { rate: 0.9, pitch: 1.0 });
  }

  /** Speak a sentence (slightly faster than word mode) */
  static async speakSentence(sentence) {
    return TTS.speak(sentence, 'en-US', { rate: 0.85, pitch: 1.05 });
  }

  /** Stop any active speech */
  static stop() {
    speechSynthesis.cancel();
    TTS.speaking = false;
  }
}
