# Контракты модулей

Все модули — нативные ES-модули (`import`/`export`), без сборки и без зависимостей. Пути относительные.
Модули общаются только через эти контракты; любой модуль можно переписать, не трогая остальные.

## 1. Опросник — `src/data/<id>.js` (сейчас `schmieschek.js`)
```js
export default {
  id: 'schmieschek88',
  title: 'Опросник Леонгарда–Шмишека',
  description: '...',          // 1–2 предложения для главного экрана
  instruction: '...',          // инструкция перед тестом
  questions: [ { n: 1, text: '...' }, ... ],   // n — 1..88, порядок = порядок показа
  scales: [ { id: 'demonstrative', yes: [7, 19, ...], no: [51], multiplier: 2 }, ... ],
  maxScore: 24,
  thresholds: { tendency: 13, accent: 19 }      // score >= accent → акцентуация, >= tendency → тенденция
};
```
id шкал (общие для всех модулей): `demonstrative, stuck, pedantic, excitable, hyperthymic, dysthymic, anxious, cyclothymic, exalted, emotive`.

## 2. Описания типов — `src/data/types.js`
```js
export const TYPES = {
  hyperthymic: {
    name: 'Гипертимный',
    color: '#hex',           // цвет столбца (должен читаться и на светлом, и на тёмном фоне)
    short: 'одна фраза',
    traits: ['...'], strengths: ['...'], risks: ['...'], tips: ['...']
  }, ...
};
export const LEVELS = { norm: 'Не выражено', tendency: 'Тенденция', accent: 'Акцентуация' };
export const DISCLAIMER = '...';
```

## 3. Подсчёт — `src/core/scoring.js` (готов, без DOM)
- `answers` — массив длиной `questions.length`, элементы `true` (да) / `false` (нет) / `null` (нет ответа), индекс = позиция вопроса в `questions`.
- `scoreScales(q, answers) → { [scaleId]: number }`
- `levelOf(score, thresholds) → 'norm' | 'tendency' | 'accent'`
- `buildResult(q, answers, date?) → { questionnaireId, date (ISO), answers, scales: [{ id, score, level }] }` (scales отсортированы по убыванию балла)
- `isComplete(answers) → boolean`

## 4. Хранилище — `src/core/storage.js`
Все операции в try/catch, при недоступности localStorage — молча работаем без сохранения.
- `saveProgress(qid, { answers, index })`, `loadProgress(qid) → {answers, index} | null`, `clearProgress(qid)`
- `addHistory(result)`, `getHistory() → result[]` (новые первыми, максимум 50), `removeHistory(date)`, `clearHistory()`
- Ключи: `aipsy:progress:<qid>`, `aipsy:history`.

## 5. Поделиться — `src/core/share.js`
- `encodeAnswers(answers) → string` — URL-safe base64 битовой строки (2 бита на ответ: 00 null, 01 нет, 10 да).
- `decodeAnswers(str, length) → answers | null` (null при ошибке).
- `shareUrl(qid, answers) → string` — `location.origin+pathname + '#/result?q=<qid>&a=<code>'`.

## 6. UI
- `src/app.js` — hash-роутер: `#/` главная, `#/test`, `#/result` (последний) или `#/result?q=..&a=..` (по ссылке), `#/history`.
- Экран — модуль `src/ui/screens/<name>.js` с `export function render(root, ctx)`, где `ctx = { questionnaire, types, navigate(hash), params }`. Экран сам очищает `root` и вешает обработчики.
- `src/ui/chart.js` — `renderChart(scales, { types, maxScore, thresholds }) → SVGElement`.
- CSS: `css/base.css` (токены, светлая/тёмная тема через `prefers-color-scheme`), `css/components.css`, `css/print.css` (`@media print`).
