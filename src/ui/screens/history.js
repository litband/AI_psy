// Экран истории: список прошлых результатов.
import { getHistory, removeHistory, clearHistory } from '../../core/storage.js';
import { encodeAnswers } from '../../core/share.js';
import { el, mount, formatDate } from '../dom.js';

export function render(root, ctx) {
  const { questionnaire: q, types, navigate } = ctx;
  const items = getHistory();

  const rerender = () => render(root, ctx);

  function row(result) {
    const top = [...result.scales].sort((a, b) => b.score - a.score).slice(0, 2)
      .map((s) => `${types.TYPES[s.id]?.name ?? s.id} — ${s.score}`).join(', ');
    const hash = `#/result?q=${encodeURIComponent(result.questionnaireId || q.id)}&a=${encodeAnswers(result.answers)}`;
    return el('div', { class: 'card history-item' },
      el('div', { class: 'history-info' },
        el('strong', {}, formatDate(result.date)),
        el('div', { class: 'muted' }, top),
      ),
      el('div', { class: 'history-actions' },
        el('button', { type: 'button', class: 'btn btn-small btn-primary', onclick: () => navigate(hash) }, 'Открыть'),
        el('button', {
          type: 'button',
          class: 'btn btn-small btn-danger',
          onclick: () => { removeHistory(result.date); rerender(); },
        }, 'Удалить'),
      ),
    );
  }

  const content = items.length
    ? items.map(row)
    : [el('div', { class: 'card' }, el('p', {}, 'История пока пуста. Пройдите тест, и результат появится здесь.'))];

  mount(root,
    el('h1', {}, 'История результатов'),
    ...content,
    el('div', { class: 'btn-row' },
      el('button', { type: 'button', class: 'btn', onclick: () => navigate('#/') }, 'На главную'),
      items.length
        ? el('button', {
            type: 'button',
            class: 'btn btn-danger',
            onclick: () => { if (window.confirm('Удалить всю историю результатов?')) { clearHistory(); rerender(); } },
          }, 'Очистить всё')
        : null,
    ),
  );
}
