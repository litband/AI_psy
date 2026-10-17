// Хранилище в localStorage. Все обращения защищены try/catch:
// при недоступности localStorage работаем молча без сохранения.

const HISTORY_KEY = 'aipsy:history';
const HISTORY_LIMIT = 50;

function progressKey(qid) {
  return `aipsy:progress:${qid}`;
}

function readJson(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeJson(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // хранилище недоступно или переполнено — пропускаем
  }
}

function removeKey(key) {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export function saveProgress(qid, { answers, index }) {
  writeJson(progressKey(qid), { answers, index });
}

export function loadProgress(qid) {
  const data = readJson(progressKey(qid));
  if (!data || typeof data !== 'object') return null;
  if (!Array.isArray(data.answers) || !Number.isInteger(data.index)) return null;
  return { answers: data.answers, index: data.index };
}

export function clearProgress(qid) {
  removeKey(progressKey(qid));
}

export function getHistory() {
  const data = readJson(HISTORY_KEY);
  if (!Array.isArray(data)) return [];
  return data.filter((item) => item && typeof item === 'object');
}

export function addHistory(result) {
  const rest = getHistory().filter((item) => item.date !== result.date);
  const next = [result, ...rest].slice(0, HISTORY_LIMIT);
  writeJson(HISTORY_KEY, next);
}

export function removeHistory(date) {
  writeJson(
    HISTORY_KEY,
    getHistory().filter((item) => item.date !== date)
  );
}

export function clearHistory() {
  removeKey(HISTORY_KEY);
}
