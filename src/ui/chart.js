// Горизонтальная диаграмма шкал в SVG. Без зависимостей, адаптивная (viewBox).
const NS = 'http://www.w3.org/2000/svg';
const W = 360;
const LABEL_W = 120;
const X0 = LABEL_W + 4;
const X1 = 322;
const TOP = 18;
const ROW = 30;
const BAR_H = 18;

function svg(tag, attrs = {}, text) {
  const node = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  if (text !== undefined) node.textContent = text;
  return node;
}

// scales: [{ id, score }], порядок сохраняется как передан.
export function renderChart(scales, { types, maxScore, thresholds }) {
  const typeMap = types.TYPES || types;
  const height = TOP + scales.length * ROW + 6;
  const x = (v) => X0 + (Math.min(v, maxScore) / maxScore) * (X1 - X0);
  const names = scales.map((s) => `${typeMap[s.id]?.name ?? s.id}: ${s.score}`).join('; ');

  const root = svg('svg', {
    viewBox: `0 0 ${W} ${height}`,
    width: '100%',
    class: 'chart',
    role: 'img',
    'aria-label': `Диаграмма выраженности типов характера. ${names}`,
  });

  const bottom = height - 6;
  // Фоновые зоны: тенденция и акцентуация
  root.append(
    svg('rect', { class: 'chart-zone-tendency', x: x(thresholds.tendency), y: TOP - 4, width: x(thresholds.accent) - x(thresholds.tendency), height: bottom - TOP + 4 }),
    svg('rect', { class: 'chart-zone-accent', x: x(thresholds.accent), y: TOP - 4, width: x(maxScore) - x(thresholds.accent), height: bottom - TOP + 4 }),
  );
  // Линии порогов и подписи
  for (const t of [thresholds.tendency, thresholds.accent]) {
    root.append(
      svg('line', { class: 'chart-line', x1: x(t), x2: x(t), y1: TOP - 4, y2: bottom }),
      svg('text', { class: 'chart-axis', x: x(t), y: 10, 'text-anchor': 'middle' }, String(t)),
    );
  }

  scales.forEach((s, i) => {
    const y = TOP + i * ROW;
    const info = typeMap[s.id] || {};
    const barW = Math.max(x(s.score) - X0, s.score > 0 ? 2 : 0);
    root.append(
      svg('text', { class: 'chart-label', x: LABEL_W, y: y + BAR_H / 2 + 4, 'text-anchor': 'end' }, info.name ?? s.id),
      svg('rect', { x: X0, y, width: barW, height: BAR_H, rx: 3, fill: info.color || '#888' }),
      svg('text', { class: 'chart-value', x: X0 + barW + 5, y: y + BAR_H / 2 + 4 }, String(s.score)),
    );
  });

  return root;
}
