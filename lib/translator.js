/**
 * TransNova — Translation Engine
 * Handles Hindi ↔ English translation via MyMemory API
 * with caching, batching, and language detection.
 * Supports both Devanagari Hindi AND Romanized Hindi (Hinglish).
 */

const TransNovaTranslator = (() => {
  // ── Cache ──────────────────────────────────────────────────
  const cache = new Map();
  const CACHE_MAX_SIZE = 500;
  const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  function getCacheKey(text, from, to) {
    return `${from}|${to}|${text.trim().toLowerCase()}`;
  }

  function getCached(text, from, to) {
    const key = getCacheKey(text, from, to);
    const entry = cache.get(key);
    if (!entry) return null;
    if (Date.now() - entry.timestamp > CACHE_TTL) {
      cache.delete(key);
      return null;
    }
    return entry.translation;
  }

  function setCache(text, from, to, translation) {
    if (cache.size >= CACHE_MAX_SIZE) {
      const oldest = cache.keys().next().value;
      cache.delete(oldest);
    }
    cache.set(getCacheKey(text, from, to), {
      translation,
      timestamp: Date.now(),
    });
  }

  // ── Language Detection ─────────────────────────────────────

  // Devanagari script detection
  const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
  const DEVANAGARI_HEAVY_REGEX = /[\u0900-\u097F]/g;

  // Romanized Hindi (Hinglish) common stopwords — extensive list
  const HINGLISH_WORDS = new Set([
    // Pronouns & basics
    'mai', 'main', 'mein', 'mujhe', 'mujhse', 'mera', 'meri', 'mere',
    'tu', 'tum', 'tumhe', 'tumhara', 'tumhari', 'tumhare', 'tera', 'teri', 'tere',
    'aap', 'aapka', 'aapki', 'aapke', 'apna', 'apni', 'apne',
    'hum', 'humne', 'humara', 'humari', 'humare',
    'wo', 'woh', 'uska', 'uski', 'uske', 'unka', 'unki', 'unke',
    'ye', 'yeh', 'yah', 'iska', 'iski', 'iske', 'inke',
    // Verbs & helpers
    'hai', 'hain', 'tha', 'thi', 'the', 'hoga', 'hogi', 'hoge',
    'kar', 'karo', 'karna', 'karke', 'karti', 'karta', 'karte', 'karenge', 'karunga', 'karungi',
    'ho', 'hona', 'hoti', 'hota', 'hote', 'hua', 'hui', 'hue',
    'ja', 'jao', 'jana', 'jaana', 'jata', 'jati', 'jaate', 'jaunga', 'jaungi',
    'aa', 'aao', 'aana', 'aata', 'aati', 'aate', 'aaya', 'aayi', 'aaye',
    'de', 'do', 'dena', 'deta', 'deti', 'dete', 'diya', 'diye', 'di',
    'le', 'lo', 'lena', 'leta', 'leti', 'lete', 'liya', 'liye', 'li',
    'bol', 'bolo', 'bolna', 'bolta', 'bolti', 'bolte', 'bola', 'boli', 'bole',
    'dekh', 'dekho', 'dekhna', 'dekhta', 'dekhti', 'dekha', 'dekhi', 'dekhe',
    'sun', 'suno', 'sunna', 'sunta', 'sunti', 'suna', 'suni', 'sune',
    'rakh', 'rakho', 'rakhna', 'rakha', 'rakhi', 'rakhe',
    'baith', 'baitho', 'baithna', 'baitha', 'baithi', 'baithe',
    'chal', 'chalo', 'chalna', 'chalta', 'chalti', 'chalte', 'chala', 'chali', 'chale',
    'ruk', 'ruko', 'rukna', 'ruka', 'ruki', 'ruke',
    'soch', 'socho', 'sochna', 'socha', 'sochi', 'soche',
    'samajh', 'samjho', 'samajhna', 'samjha', 'samjhi', 'samjhe',
    'bata', 'batao', 'batana', 'bataya', 'batayi', 'bataye',
    'mil', 'milo', 'milna', 'milta', 'milti', 'mila', 'mili', 'mile', 'milenge',
    'pata', 'puch', 'pucho', 'puchna', 'pucha',
    'raha', 'rahi', 'rahe', 'rhi', 'rhe', 'rha',
    'sakta', 'sakti', 'sakte', 'saka', 'saki', 'sake',
    'wala', 'wali', 'wale', 'waala', 'waali', 'waale',
    'chahiye', 'chahte', 'chahta', 'chahti',
    // Question words
    'kya', 'kyaa', 'kyu', 'kyun', 'kyon', 'kyunki', 'kaise', 'kaisa', 'kaisi',
    'kab', 'kaha', 'kahaan', 'kahan', 'kidhar', 'kaun', 'kon',
    'kitna', 'kitni', 'kitne', 'kaunsa', 'kaunsi',
    // Conjunctions & particles
    'aur', 'ya', 'lekin', 'par', 'magar', 'phir', 'fir', 'tab', 'jab',
    'to', 'toh', 'bhi', 'hi', 'sirf', 'bas', 'abhi',
    'agar', 'ger', 'nahi', 'nhi', 'nahin', 'mat', 'na',
    'ke', 'ka', 'ki', 'ko', 'se', 'me', 'pe', 'tak', 'warna',
    'isliye', 'islye', 'isiliye', 'kyuki', 'kyunki',
    // Common words
    'accha', 'achha', 'acha', 'theek', 'thik', 'sahi', 'galat',
    'bahut', 'bohot', 'boht', 'zyada', 'jyada', 'kam', 'thoda', 'thodi', 'thode',
    'bhai', 'bhaiya', 'didi', 'yaar', 'yar', 'dost', 'ji',
    'kuch', 'kuchh', 'sab', 'sabko', 'sabse', 'koi', 'kahin',
    'abhi', 'ab', 'tab', 'jab', 'kabhi', 'hamesha', 'humesha',
    'aaj', 'kal', 'parso', 'pehle', 'baad', 'baadme',
    'idhar', 'udhar', 'yahan', 'wahan', 'yahaan', 'wahaan',
    'log', 'logo', 'logon', 'banda', 'bande',
    'paisa', 'paise', 'kaam', 'ghar', 'jagah',
    'chota', 'choti', 'chote', 'bada', 'badi', 'bade',
    'naya', 'nayi', 'naye', 'purana', 'purani', 'purane',
    'pehla', 'pehli', 'pehle', 'aakhri', 'aakhir',
    // Greetings & expressions
    'namaste', 'namaskar', 'dhanyawad', 'dhanyavaad', 'shukriya',
    'alvida', 'chalo', 'achha', 'haan', 'han', 'naa',
    'arrey', 'arre', 'are', 'oye', 'abe',
    'kaise', 'kaisa', 'kaisi', 'badhiya', 'mast', 'zabardast',
    'theek', 'sahi', 'pakka', 'bilkul', 'zaroor', 'jaroor',
    // Time, numbers  
    'ek', 'do', 'teen', 'char', 'paanch', 'chhe', 'saat', 'aath', 'nau', 'das',
    'subah', 'dopahar', 'shaam', 'raat',
    // Chat-specific & extra stopwords
    'btao', 'bta', 'btw', 'hmm', 'hmne',
    'krna', 'krne', 'krta', 'krti', 'krte', 'kro', 'kr',
    'chl', 'chlte', 'chlo',
    'pta', 'smjh', 'smjha',
    'agr', 'mgr', 'jaise', 'waise',
    'koi', 'kuch', 'sb', 'sbko',
    'pasand', 'pasnd',
    'khana', 'peena', 'sona', 'jaagna',
    'padhna', 'likhna', 'bolna',
    'rona', 'hasna', 'khilna',
    'hal', 'haal', 'hao', 'h', 'nh', 'nhi',
    'kaise', 'kaisey', 'kaiseni',
  ]);

  // Common English stopwords to prevent misidentifying English sentences containing words like "sir" as Hindi
  const ENGLISH_STOPWORDS = new Set([
    'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
    'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
    'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
    'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
    'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
    'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
    'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
    'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
    'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
    'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
    'are', 'is', 'was', 'were', 'been', 'being', 'am', 'sir', 'bro', 'dude', 'please', 'pls', 'thanks', 'thank'
  ]);

  // Common Hindi phonetic digraphs/patterns (rare in English)
  const HINDI_DIGRAPHS_REGEX = /(?:aa|bh|dh|gh|jh|kh|th|chh|shh|oo|ee|ai|au)/gi;

  function isDevanagariHindi(text) {
    if (!text || !text.trim()) return false;
    const matches = text.match(DEVANAGARI_HEAVY_REGEX);
    if (!matches) return false;
    const nonSpace = text.replace(/\s/g, '');
    return matches.length / nonSpace.length > 0.3;
  }

  function isRomanizedHindi(text) {
    if (!text || !text.trim()) return false;

    const lowerText = text.toLowerCase().trim();
    // Replace punctuation with spaces so "sir?kya" becomes "sir kya"
    const cleanedText = lowerText.replace(/[^\w\s]/g, ' ');
    const words = cleanedText.split(/\s+/).filter((w) => w.length > 0);
    if (words.length === 0) return false;

    // Count how many words match our Hinglish dictionary vs English stopwords
    let hindiWordCount = 0;
    let englishWordCount = 0;

    for (const word of words) {
      if (HINGLISH_WORDS.has(word)) {
        hindiWordCount++;
      } else if (ENGLISH_STOPWORDS.has(word)) {
        englishWordCount++;
      }
    }

    // If English words outnumber Hindi words, it's English, not Romanized Hindi
    if (englishWordCount > hindiWordCount && hindiWordCount < 2) {
      return false;
    }

    const hindiRatio = hindiWordCount / words.length;

    // If >=30% of words are Hindi stopwords, consider it Hindi
    if (hindiRatio >= 0.3) return true;

    // Heavy phonetic Hindi patterns
    const digraphMatches = lowerText.match(HINDI_DIGRAPHS_REGEX) || [];
    if (digraphMatches.length >= 2 && hindiRatio > 0.15) return true;

    // Short chat messages with clear Hindi words
    if (hindiWordCount >= 2 && words.length <= 8) return true;
    if (hindiWordCount === 1 && words.length <= 3 && englishWordCount === 0) return true;

    return false;
  }

  function isHindi(text) {
    return isDevanagariHindi(text) || isRomanizedHindi(text);
  }

  function isEnglish(text) {
    if (!text || !text.trim()) return false;
    // If it has Devanagari, it's not English
    if (DEVANAGARI_REGEX.test(text)) return false;
    // If it's Romanized Hindi, it's not English
    if (isRomanizedHindi(text)) return false;
    // Contains mostly Latin characters
    const latinMatches = text.match(/[a-zA-Z]/g);
    if (!latinMatches) return false;
    const nonSpace = text.replace(/[\s\d\p{P}\p{S}]/gu, '');
    return nonSpace.length === 0 || latinMatches.length / nonSpace.length > 0.5;
  }

  function detectLanguage(text) {
    if (isDevanagariHindi(text)) return 'hi';
    if (isRomanizedHindi(text)) return 'hi-roman';
    if (isEnglish(text)) return 'en';
    return 'unknown';
  }

  // ── Translation API ────────────────────────────────────────
  const API_URL = 'https://api.mymemory.translated.net/get';

  async function translateText(text, from, to) {
    if (!text || !text.trim()) return text;

    // Check cache first
    const cached = getCached(text, from, to);
    if (cached) return cached;

    try {
      const params = new URLSearchParams({
        q: text.trim(),
        langpair: `${from}|${to}`,
      });

      const response = await fetch(`${API_URL}?${params.toString()}`);

      if (!response.ok) {
        console.warn('[TransNova] API error:', response.status);
        return text;
      }

      const data = await response.json();

      if (data.responseStatus === 200 && data.responseData) {
        const translation = data.responseData.translatedText;
        // Avoid "no-op" translations where API returns the same text
        if (translation.trim().toLowerCase() === text.trim().toLowerCase()) {
          return text;
        }
        setCache(text, from, to, translation);
        return translation;
      }

      console.warn('[TransNova] Translation failed:', data);
      return text;
    } catch (err) {
      console.error('[TransNova] Translation error:', err);
      return text;
    }
  }

  // ── Batch Translation ──────────────────────────────────────
  async function translateBatch(texts, from, to) {
    const results = [];
    for (const text of texts) {
      const translated = await translateText(text, from, to);
      results.push(translated);
      await new Promise((r) => setTimeout(r, 100));
    }
    return results;
  }

  // ── Public API ─────────────────────────────────────────────
  return {
    translateText,
    translateBatch,
    isHindi,
    isEnglish,
    isDevanagariHindi,
    isRomanizedHindi,
    detectLanguage,
    getCached,
  };
})();

if (typeof window !== 'undefined') {
  window.TransNovaTranslator = TransNovaTranslator;
}
