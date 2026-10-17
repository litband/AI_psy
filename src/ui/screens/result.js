// Экран результата: диаграмма, выраженные типы, действия.
import { buildResult } from '../../core/scoring.js';
import { getHistory } from '../../core/storage.js';
import { decodeAnswers, shareUrl } from '../../core/share.js';
import { renderChart } from '../chart.js';
import { el, mount, formatDate } from '../dom.js';

// Получить результат: по ссылке (?a=) или последний из истории. Вернуть { result, shared } | null
function resolveResult(ctx) {
  const { questionnaire: q, params } = ctx;
  if (params.a) {
    const answers = decodeAnswers(params.a, q.questions.length);
    return answers ? { result: buildResult(q, answers), shared: true, answers } : null;
  }
  const last = getHistory()[0];
  return last ? { result: last, shared: false, answers: last.answers } : null;
}

function noData(root, ctx) {
  mount(root,
    el('h1', {}, 'Результат'),
    el('div', { class: 'card' },
      el('p', {}, 'Нет данных для показа результата: ссылка повреждена или тест ещё не пройден.')),
    el('div', { class: 'btn-row' },
      el('button', { type: 'button', class: 'btn btn-primary', onclick: () => ctx.navigate('#/test') }, 'Пройти тест')),
  );
}

function list(items) {
  return el('ul', {}, (items || []).map((t) => el('li', {}, t)));
}

function section(title, items) {
  return items && items.length ? [el('h4', { class: 'muted' }, title), list(items)] : [];
}

// Карточка выраженного типа
function typeCard(scale, ctx) {
  const { types } = ctx;
  const info = types.TYPES[scale.id] || { name: scale.id };
  return el('div', { class: 'card type-card', style: `--type-color:${info.color || 'var(--primary)'}` },
    el('div', { class: 'type-head' },
      el('h3', {}, `${info.name} — ${scale.score} из ${ctx.questionnaire.maxScore}`),
      el('span', { class: `badge badge-${scale.level}` }, types.LEVELS[scale.level]),
    ),
    info.short ? el('p', {}, info.short) : null,
    section('Черты', info.traits),
    section('Сильные стороны', info.strengths),
    section('Риски', info.risks),
    section('Советы', info.tips),
  );
}

function summary(scales, ctx) {
  const expressed = scales.filter((s) => s.level !== 'norm');
  if (expressed.length) {
    // accent первыми, затем tendency; внутри уровня — по убыванию балла
    const rank = { accent: 0, tendency: 1 };
    expressed.sort((a, b) => rank[a.level] - rank[b.level] || b.score - a.score);
    return [el('h2', {}, 'Выраженные типы'), ...expressed.map((s) => typeCard(s, ctx))];
  }
  const top = [...scales].sort((a, b) => b.score - a.score).slice(0, 2);
  return [
    el('div', { class: 'card' },
      el('h2', {}, 'Ничего не выражено чрезмерно'),
      el('p', {}, 'Ни один тип не достиг уровня тенденции или акцентуации — характер гармоничен и сбалансирован. Это хороший результат.'),
      el('p', { class: 'muted' }, 'Чуть сильнее остальных проявились шкалы ниже.')),
    ...top.map((s) => typeCard(s, ctx)),
  ];
}

function copyLink(url, button) {
  const flash = (text) => {
    const old = button.textContent;
    button.textContent = text;
    setTimeout(() => { button.textContent = old; }, 2000);
  };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(url).then(() => flash('Ссылка скопирована'), () => window.prompt('Скопируйте ссылку:', url));
  } else {
    window.prompt('Скопируйте ссылку:', url);
  }
}

export function render(root, ctx) {
  const { questionnaire: q, types, navigate } = ctx;
  const found = resolveResult(ctx);
  if (!found) { noData(root, ctx); return; }

  const { result, shared, answers } = found;
  const chartScales = result.scales.map((s) => ({ id: s.id, score: s.score }));
  const copyBtn = el('button', { type: 'button', class: 'btn' }, 'Скопировать ссылку');
  copyBtn.addEventListener('click', () => copyLink(shareUrl(q.id, answers), copyBtn));

  mount(root,
    el('h1', {}, 'Ваш результат'),
    el('p', { class: 'muted' }, shared ? 'Результат открыт по ссылке (не сохраняется в историю).' : formatDate(result.date)),
    el('div', { class: 'card' },
      renderChart(chartScales, { types, maxScore: q.maxScore, thresholds: q.thresholds }),
      el('p', { class: 'hint' }, `Порог тенденции — ${q.thresholds.tendency}, акцентуации — ${q.thresholds.accent} баллов из ${q.maxScore}.`),
    ),
    ...summary(result.scales, ctx),
    el('div', { class: 'btn-row no-print' },
      el('button', { type: 'button', class: 'btn', onclick: () => window.print() }, 'Печать / PDF'),
      copyBtn,
      el('button', { type: 'button', class: 'btn btn-primary', onclick: () => navigate('#/test') }, 'Пройти снова'),
    ),
    el('div', { class: 'link-row no-print' }, el('a', { href: '#/history' }, 'История результатов')),
    el('p', { class: 'disclaimer' }, types.DISCLAIMER),
  );
}
