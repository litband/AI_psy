// Мини-раннер без библиотек и тесты для src/core и данных опросника.
import { scoreScales, levelOf, buildResult, isComplete } from '../src/core/scoring.js';
import { encodeAnswers, decodeAnswers } from '../src/core/share.js';
import {
  saveProgress,
  loadProgress,
  clearProgress,
  addHistory,
  getHistory,
  removeHistory,
  clearHistory,
} from '../src/core/storage.js';

// ---------- раннер ----------

const tests = [];
function test(name, fn) {
  tests.push({ name, fn });
}

function isObject(v) {
  return typeof v === 'object' && v !== null;
}

function assertEqual(actual, expected, msg = '') {
  const ok =
    isObject(actual) || isObject(expected)
      ? JSON.stringify(actual) === JSON.stringify(expected)
      : Object.is(actual, expected);
  if (!ok) {
    throw new Error(
      `${msg ? msg + ': ' : ''}ожидалось ${JSON.stringify(expected)}, получено ${JSON.stringify(actual)}`
    );
  }
}

function assertTrue(cond, msg = 'условие ложно') {
  if (!cond) throw new Error(msg);
}

async function runAll() {
  const list = document.getElementById('results');
  const summary = document.getElementById('summary');
  let passed = 0;
  let failed = 0;
  for (const { name, fn } of tests) {
    const li = document.createElement('li');
    try {
      await fn();
      passed++;
      li.className = 'pass';
      li.textContent = 'OK    ' + name;
    } catch (e) {
      failed++;
      li.className = 'fail';
      li.textContent = 'FAIL  ' + name + ' — ' + (e && e.message ? e.message : String(e));
    }
    if (list) list.appendChild(li);
  }
  if (summary) summary.textContent = `${passed} passed / ${failed} failed`;
  return { passed, failed };
}

// ---------- синтетический мини-опросник ----------

const mini = {
  id: 'mini',
  questions: [
    { n: 1 },
    { n: 2 },
    { n: 3 },
    { n: 4 },
    { n: 5 },
    { n: 6 },
  ],
  scales: [
    { id: 'a', yes: [1, 2], no: [3], multiplier: 2 },
    { id: 'b', yes: [4], no: [5, 6], multiplier: 1 },
    { id: 'c', yes: [], no: [], multiplier: 1 },
  ],
  thresholds: { tendency: 5, accent: 6 },
};

test('scoreScales: считает попадания по ключу с множителем', () => {
  // да: 1,2,4; нет: 3,5,6
  const answers = [true, true, false, true, false, false];
  const s = scoreScales(mini, answers);
  assertEqual(s.a, 6, 'шкала a: (1 да, 2 да, 3 нет) * 2');
  assertEqual(s.b, 3, 'шкала b: (4 да, 5 нет, 6 нет) * 1');
  assertEqual(s.c, 0, 'шкала c пустая');
});

test('scoreScales: null и неверные ответы не дают баллов', () => {
  const answers = [null, false, true, null, null, true];
  const s = scoreScales(mini, answers);
  assertEqual(s.a, 0, 'шкала a');
  assertEqual(s.b, 0, 'шкала b');
});

test('levelOf: границы 12/13/18/19 (пороги 13 и 19)', () => {
  const th = { tendency: 13, accent: 19 };
  assertEqual(levelOf(12, th), 'norm', '12 → norm');
  assertEqual(levelOf(13, th), 'tendency', '13 → tendency');
  assertEqual(levelOf(18, th), 'tendency', '18 → tendency');
  assertEqual(levelOf(19, th), 'accent', '19 → accent');
});

test('buildResult: шкалы отсортированы по убыванию балла', () => {
  const answers = [true, true, false, true, false, false];
  const r = buildResult(mini, answers, '2024-01-01T00:00:00.000Z');
  assertEqual(r.questionnaireId, 'mini');
  assertEqual(r.date, '2024-01-01T00:00:00.000Z');
  assertEqual(
    r.scales.map((s) => s.id),
    ['a', 'b', 'c'],
    'порядок шкал'
  );
  assertEqual(r.scales[0], { id: 'a', score: 6, level: 'accent' }, 'первая шкала');
  assertEqual(r.scales[1], { id: 'b', score: 3, level: 'norm' }, 'вторая шкала');
  assertEqual(r.answers, answers, 'ответы сохранены');
});

test('isComplete: true только если нет null', () => {
  assertEqual(isComplete([true, false, true]), true);
  assertEqual(isComplete([true, null, true]), false);
  assertEqual(isComplete([]), true);
});

// ---------- реальный опросник ----------

async function loadSchmieschek() {
  const mod = await import('../src/data/schmieschek.js');
  return mod.default;
}

test('schmieschek: 88 вопросов, уникальные n от 1 до 88', async () => {
  const q = await loadSchmieschek();
  assertEqual(q.questions.length, 88, 'количество вопросов');
  const ns = q.questions.map((x) => x.n).sort((a, b) => a - b);
  assertEqual(ns, Array.from({ length: 88 }, (_, i) => i + 1), 'n = 1..88');
});

test('schmieschek: (да+нет)*multiplier === 24 для каждой шкалы', async () => {
  const q = await loadSchmieschek();
  for (const s of q.scales) {
    assertEqual((s.yes.length + s.no.length) * s.multiplier, 24, `шкала ${s.id}`);
  }
});

test('schmieschek: все номера ключа существуют в вопросах', async () => {
  const q = await loadSchmieschek();
  const known = new Set(q.questions.map((x) => x.n));
  for (const s of q.scales) {
    for (const n of [...s.yes, ...s.no]) {
      assertTrue(known.has(n), `шкала ${s.id}: нет вопроса с n=${n}`);
    }
  }
});

test('schmieschek: номер не повторяется внутри одной шкалы', async () => {
  const q = await loadSchmieschek();
  for (const s of q.scales) {
    const all = [...s.yes, ...s.no];
    assertEqual(new Set(all).size, all.length, `шкала ${s.id}`);
  }
});

test('schmieschek: все «да» и все «нет» дают баллы 0..24', async () => {
  const q = await loadSchmieschek();
  const allYes = q.questions.map(() => true);
  const allNo = q.questions.map(() => false);
  const sYes = scoreScales(q, allYes);
  const sNo = scoreScales(q, allNo);
  for (const s of q.scales) {
    assertTrue(sYes[s.id] >= 0 && sYes[s.id] <= 24, `все да, шкала ${s.id}: ${sYes[s.id]}`);
    assertTrue(sNo[s.id] >= 0 && sNo[s.id] <= 24, `все нет, шкала ${s.id}: ${sNo[s.id]}`);
  }
});

test('schmieschek: ответы строго по ключу шкалы дают 24 по этой шкале', async () => {
  const q = await loadSchmieschek();
  const pos = new Map(q.questions.map((x, i) => [x.n, i]));
  for (const s of q.scales) {
    const answers = q.questions.map(() => null);
    for (const n of s.yes) answers[pos.get(n)] = true;
    for (const n of s.no) answers[pos.get(n)] = false;
    const score = scoreScales(q, answers)[s.id];
    assertEqual(score, 24, `шкала ${s.id}`);
  }
});

// ---------- share ----------

function randomAnswers(length) {
  const values = [true, false, null];
  return Array.from({ length }, () => values[Math.floor(Math.random() * 3)]);
}

test('share: encode → decode туда-обратно для случайных массивов длиной 88', () => {
  for (let k = 0; k < 200; k++) {
    const original = randomAnswers(88);
    const str = encodeAnswers(original);
    assertTrue(/^[A-Za-z0-9_-]+$/.test(str), 'строка URL-safe без "="');
    assertEqual(decodeAnswers(str, 88), original, `итерация ${k}`);
  }
});

test('share: encode → decode для длин, не кратных 4', () => {
  for (const len of [0, 1, 2, 3, 5, 7, 9, 88]) {
    const original = randomAnswers(len);
    assertEqual(decodeAnswers(encodeAnswers(original), len), original, `длина ${len}`);
  }
});

test('share: decode мусора → null', () => {
  assertEqual(decodeAnswers('!!!', 88), null, 'недопустимые символы');
  assertEqual(decodeAnswers('abc', 88), null, 'слишком короткая строка');
  assertEqual(decodeAnswers('A', 4), null, 'длина 1 по модулю 4');
  assertEqual(decodeAnswers(undefined, 88), null, 'undefined');
  assertEqual(decodeAnswers(123, 88), null, 'не строка');
  assertEqual(decodeAnswers('AAAAAAAAAAAAAAAAAAAAAAAAAAAA', 88), null, 'несовпадение длины');
});

// ---------- storage ----------

function clearAipsy() {
  try {
    const keys = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('aipsy:')) keys.push(k);
    }
    keys.forEach((k) => localStorage.removeItem(k));
  } catch {
    // localStorage недоступен
  }
}

function fakeResult(date) {
  return buildResult(mini, [true, false, null, true, false, false], date);
}

test('storage: addHistory / getHistory / removeHistory / clearHistory', () => {
  clearAipsy();
  try {
    assertEqual(getHistory(), [], 'пусто в начале');
    addHistory(fakeResult('2024-01-01T00:00:00.000Z'));
    addHistory(fakeResult('2024-01-02T00:00:00.000Z'));
    const h = getHistory();
    assertEqual(h.length, 2, 'два результата');
    assertEqual(h[0].date, '2024-01-02T00:00:00.000Z', 'новые первыми');
    removeHistory('2024-01-02T00:00:00.000Z');
    assertEqual(
      getHistory().map((x) => x.date),
      ['2024-01-01T00:00:00.000Z'],
      'после removeHistory'
    );
    clearHistory();
    assertEqual(getHistory(), [], 'после clearHistory');
  } finally {
    clearAipsy();
  }
});

test('storage: getHistory при испорченных данных возвращает массив', () => {
  clearAipsy();
  try {
    localStorage.setItem('aipsy:history', '{bad json');
    assertEqual(getHistory(), [], 'битый JSON');
    localStorage.setItem('aipsy:history', '{"a":1}');
    assertEqual(getHistory(), [], 'не массив');
  } finally {
    clearAipsy();
  }
});

test('storage: saveProgress / loadProgress / clearProgress', () => {
  clearAipsy();
  try {
    assertEqual(loadProgress('mini'), null, 'пусто в начале');
    const answers = [true, null, false];
    saveProgress('mini', { answers, index: 2 });
    assertEqual(loadProgress('mini'), { answers, index: 2 }, 'после save');
    clearProgress('mini');
    assertEqual(loadProgress('mini'), null, 'после clear');
  } finally {
    clearAipsy();
  }
});

// ---------- запуск ----------

runAll();
