// Экран прохождения: один вопрос на экран, автосохранение после каждого ответа.
import { buildResult, isComplete } from '../../core/scoring.js';
import { saveProgress, loadProgress, clearProgress, addHistory, getHistory } from '../../core/storage.js';
import { encodeAnswers } from '../../core/share.js';
import { el, mount } from '../dom.js';

// Обработчик клавиш живёт в модуле, чтобы снять его при повторном рендере
let keyHandler = null;

function detachKeys() {
  if (keyHandler) document.removeEventListener('keydown', keyHandler);
  keyHandler = null;
}

// Восстановить состояние из сохранённого прогресса (с проверкой формы)
function initialState(q) {
  const total = q.questions.length;
  const saved = loadProgress(q.id);
  const answers = Array(total).fill(null);
  let index = 0;
  if (saved && Array.isArray(saved.answers) && saved.answers.length === total) {
    saved.answers.forEach((a, i) => { answers[i] = a === true || a === false ? a : null; });
    index = Number.isInteger(saved.index) ? Math.min(Math.max(saved.index, 0), total - 1) : 0;
  }
  return { answers, index };
}

export function render(root, ctx) {
  const { questionnaire: q, navigate } = ctx;
  const total = q.questions.length;
  const state = initialState(q);

  function finish() {
    const result = buildResult(q, state.answers);
    addHistory(result);
    clearProgress(q.id);
    detachKeys();
    // Если хранилище сработало — открываем «последний результат», иначе — по ссылке
    if (getHistory()[0]?.date === result.date) { navigate('#/result'); return; }
    navigate(`#/result?q=${encodeURIComponent(q.id)}&a=${encodeAnswers(state.answers)}`);
  }

  function answer(value) {
    state.answers[state.index] = value;
    if (state.index < total - 1) {
      state.index++;
    } else if (!isComplete(state.answers)) {
      state.index = state.answers.findIndex((a) => a === null);
    } else {
      saveProgress(q.id, { answers: state.answers, index: state.index });
      finish();
      return;
    }
    saveProgress(q.id, { answers: state.answers, index: state.index });
    draw();
  }

  function back() {
    if (state.index === 0) return;
    state.index--;
    saveProgress(q.id, { answers: state.answers, index: state.index });
    draw();
  }

  function onKey(e) {
    if (!root.isConnected || e.ctrlKey || e.metaKey || e.altKey) return;
    if (!document.getElementById('question-card')) { detachKeys(); return; }
    const k = e.key.toLowerCase();
    if (k === 'y' || k === 'н' || k === '1') answer(true);
    else if (k === 'n' || k === 'т' || k === '2') answer(false);
    else if (e.key === 'ArrowLeft') back();
    else return;
    e.preventDefault();
  }

  function draw() {
    const cur = state.answers[state.index];
    const done = state.answers.filter((a) => a !== null).length;
    const percent = Math.round((done / total) * 100);
    mount(root,
      el('div', { class: 'counter' },
        el('span', {}, `Вопрос ${state.index + 1} из ${total}`),
        el('span', {}, `${percent}%`),
      ),
      el('div', { class: 'progress', role: 'progressbar', 'aria-valuemin': 0, 'aria-valuemax': total, 'aria-valuenow': done, 'aria-label': 'Прогресс теста' },
        el('div', { class: 'progress-bar', style: `width:${percent}%` })),
      el('div', { class: 'card', id: 'question-card' },
        el('p', { class: 'question-text' }, q.questions[state.index].text),
        el('div', { class: 'answer-row' },
          el('button', { type: 'button', class: `btn btn-answer btn-yes${cur === true ? ' selected' : ''}`, onclick: () => answer(true) }, 'Да'),
          el('button', { type: 'button', class: `btn btn-answer btn-no${cur === false ? ' selected' : ''}`, onclick: () => answer(false) }, 'Нет'),
        ),
        el('p', { class: 'hint' }, 'Клавиши: Y / 1 — «Да», N / 2 — «Нет», ← — назад'),
      ),
      el('div', { class: 'btn-row' },
        el('button', { type: 'button', class: 'btn', onclick: back, disabled: state.index === 0 }, 'Назад'),
        el('button', { type: 'button', class: 'btn', onclick: () => { detachKeys(); navigate('#/'); } }, 'На главную'),
      ),
    );
  }

  detachKeys();
  keyHandler = onKey;
  document.addEventListener('keydown', keyHandler);
  draw();
}
