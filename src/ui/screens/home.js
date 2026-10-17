// Главный экран: описание, дисклеймер, старт/продолжение.
import { loadProgress, clearProgress } from '../../core/storage.js';
import { el, mount } from '../dom.js';

// Сколько вопросов уже отвечено в сохранённом прогрессе
function answeredCount(progress) {
  return progress && Array.isArray(progress.answers)
    ? progress.answers.filter((a) => a === true || a === false).length
    : 0;
}

export function render(root, ctx) {
  const { questionnaire: q, types, navigate } = ctx;
  const total = q.questions.length;
  const progress = loadProgress(q.id);
  const done = answeredCount(progress);
  const hasProgress = done > 0 && done < total;

  const buttons = [];
  if (hasProgress) {
    buttons.push(
      el('button', { type: 'button', class: 'btn btn-primary', onclick: () => navigate('#/test') }, `Продолжить (${done} из ${total})`),
      el('button', {
        type: 'button',
        class: 'btn',
        onclick: () => { clearProgress(q.id); navigate('#/test'); },
      }, 'Начать заново'),
    );
  } else {
    buttons.push(el('button', { type: 'button', class: 'btn btn-primary', onclick: () => navigate('#/test') }, 'Начать'));
  }

  mount(root,
    el('h1', {}, 'Тест акцентуаций характера'),
    el('div', { class: 'card' },
      el('h2', {}, q.title),
      el('p', {}, q.description),
      el('p', { class: 'muted' }, q.instruction),
      el('p', { class: 'muted' }, `Вопросов: ${total}. Ответы да/нет, около 10–15 минут.`),
    ),
    el('div', { class: 'btn-row' }, buttons),
    el('div', { class: 'link-row' }, el('a', { href: '#/history' }, 'История результатов')),
    el('p', { class: 'disclaimer' }, types.DISCLAIMER),
  );
}
