/**
 * TransNova Mobile — Real-Time Hindi ↔ English Translation Engine
 * 
 * Features:
 * - Dual Engine Architecture: Google Translate (Primary) + MyMemory API (Fallback)
 * - Devanagari Hindi Script Detection
 * - Hinglish (Romanized Hindi) Stopword & Phonetic Pattern Recognition
 * - Fast In-Memory LRU Cache with TTL
 */

// LRU Cache
const cache = new Map();
const CACHE_MAX_SIZE = 500;
const CACHE_TTL_MS = 45 * 60 * 1000; // 45 minutes

function getCacheKey(text, from, to) {
  return `${from}|${to}|${text.trim().toLowerCase()}`;
}

function getCachedTranslation(text, from, to) {
  const key = getCacheKey(text, from, to);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.translation;
}

function setCachedTranslation(text, from, to, translation) {
  if (cache.size >= CACHE_MAX_SIZE) {
    const oldestKey = cache.keys().next().value;
    cache.delete(oldestKey);
  }
  cache.set(getCacheKey(text, from, to), {
    translation,
    timestamp: Date.now(),
  });
}

// Language Detection regexes & dictionaries
const DEVANAGARI_REGEX = /[\u0900-\u097F]/;
const DEVANAGARI_HEAVY_REGEX = /[\u0900-\u097F]/g;

// Extensive Romanized Hindi (Hinglish) Stopwords
const HINGLISH_WORDS = new Set([
  'mai', 'main', 'mein', 'mujhe', 'mujhse', 'mera', 'meri', 'mere',
  'tu', 'tum', 'tumhe', 'tumhara', 'tumhari', 'tumhare', 'tera', 'teri', 'tere',
  'aap', 'aapka', 'aapki', 'aapke', 'apna', 'apni', 'apne',
  'hum', 'humne', 'humara', 'humari', 'humare',
  'wo', 'woh', 'uska', 'uski', 'uske', 'unka', 'unki', 'unke',
  'ye', 'yeh', 'yah', 'iska', 'iski', 'iske', 'inke',
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
  'chal', 'chalo', 'chalna', 'chalta', 'chalti', 'chalte', 'chala', 'chali', 'chale',
  'bata', 'batao', 'batana', 'bataya', 'batayi', 'bataye',
  'mil', 'milo', 'milna', 'milta', 'milti', 'mila', 'mili', 'mile', 'milenge',
  'pata', 'puch', 'pucho', 'puchna', 'pucha',
  'raha', 'rahi', 'rahe', 'rhi', 'rhe', 'rha',
  'sakta', 'sakti', 'sakte', 'saka', 'saki', 'sake',
  'wala', 'wali', 'wale', 'waala', 'waali', 'waale',
  'chahiye', 'chahte', 'chahta', 'chahti',
  'kya', 'kyaa', 'kyu', 'kyun', 'kyon', 'kyunki', 'kaise', 'kaisa', 'kaisi',
  'kab', 'kaha', 'kahaan', 'kahan', 'kidhar', 'kaun', 'kon',
  'kitna', 'kitni', 'kitne', 'kaunsa', 'kaunsi',
  'aur', 'ya', 'lekin', 'par', 'magar', 'phir', 'fir', 'tab', 'jab',
  'to', 'toh', 'bhi', 'hi', 'sirf', 'bas', 'abhi',
  'agar', 'nahi', 'nhi', 'nahin', 'mat', 'na',
  'ke', 'ka', 'ki', 'ko', 'se', 'me', 'pe', 'tak', 'warna',
  'isliye', 'islye', 'isiliye', 'kyuki',
  'accha', 'achha', 'acha', 'theek', 'thik', 'sahi', 'galat',
  'bahut', 'bohot', 'boht', 'zyada', 'jyada', 'kam', 'thoda', 'thodi', 'thode',
  'bhai', 'bhaiya', 'didi', 'yaar', 'yar', 'dost', 'ji',
  'kuch', 'kuchh', 'sab', 'sabko', 'sabse', 'koi', 'kahin',
  'aaj', 'kal', 'parso', 'pehle', 'baad', 'baadme',
  'idhar', 'udhar', 'yahan', 'wahan', 'yahaan', 'wahaan',
  'namaste', 'shukriya', 'dhanyawad', 'badhiya', 'mast', 'pakka', 'zaroor'
]);

const ENGLISH_STOPWORDS = new Set([
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'are', 'is', 'was', 'were', 'been', 'being', 'am', 'sir', 'bro', 'dude', 'please', 'thanks'
]);

export function isDevanagariHindi(text) {
  if (!text || !text.trim()) return false;
  const matches = text.match(DEVANAGARI_HEAVY_REGEX);
  if (!matches) return false;
  const nonSpace = text.replace(/\s/g, '');
  return matches.length / nonSpace.length > 0.25;
}

export function isRomanizedHindi(text) {
  if (!text || !text.trim()) return false;
  const lowerText = text.toLowerCase().trim();
  const cleanedText = lowerText.replace(/[^\w\s]/g, ' ');
  const words = cleanedText.split(/\s+/).filter(w => w.length > 0);
  if (words.length === 0) return false;

  let hindiCount = 0;
  let englishCount = 0;

  for (const word of words) {
    if (HINGLISH_WORDS.has(word)) hindiCount++;
    else if (ENGLISH_STOPWORDS.has(word)) englishCount++;
  }

  if (englishCount > hindiCount && hindiCount < 2) return false;
  const ratio = hindiCount / words.length;
  if (ratio >= 0.3) return true;
  if (hindiCount >= 2 && words.length <= 8) return true;
  if (hindiCount === 1 && words.length <= 3 && englishCount === 0) return true;

  return false;
}

export function isHindiText(text) {
  return isDevanagariHindi(text) || isRomanizedHindi(text);
}

export function detectLanguage(text) {
  if (isDevanagariHindi(text)) return 'hi-devanagari';
  if (isRomanizedHindi(text)) return 'hi-roman';
  if (DEVANAGARI_REGEX.test(text)) return 'hi';
  return 'en';
}

/**
 * Dual Engine Translation Service:
 * 1. Google Translate Unofficial Endpoint (Primary)
 * 2. MyMemory API (Fallback)
 */
export async function translateText(text, fromLang = 'hi', toLang = 'en') {
  if (!text || !text.trim()) return text;

  // Normalization for Hinglish to Devanagari/Hindi code
  const sourceLang = fromLang === 'hi-roman' ? 'hi' : fromLang;

  const cached = getCachedTranslation(text, sourceLang, toLang);
  if (cached) return cached;

  // Primary: Google Translate Free Endpoint
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&dt=t&sl=${sourceLang}&tl=${toLang}&q=${encodeURIComponent(text.trim())}`;
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      if (data && data[0] && Array.isArray(data[0])) {
        const translatedText = data[0].map(item => item[0]).join('');
        if (translatedText && translatedText.trim() !== text.trim()) {
          setCachedTranslation(text, sourceLang, toLang, translatedText);
          return translatedText;
        }
      }
    }
  } catch (err) {
    console.warn('[TransNova Mobile] Google Translate primary failed, attempting fallback...', err);
  }

  // Fallback: MyMemory API
  try {
    const fallbackUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.trim())}&langpair=${sourceLang}|${toLang}`;
    const res = await fetch(fallbackUrl);
    if (res.ok) {
      const data = await res.json();
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        const translatedText = data.responseData.translatedText;
        setCachedTranslation(text, sourceLang, toLang, translatedText);
        return translatedText;
      }
    }
  } catch (err) {
    console.error('[TransNova Mobile] MyMemory API fallback error:', err);
  }

  return text;
}
