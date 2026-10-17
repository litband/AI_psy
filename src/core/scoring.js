// Подсчёт баллов по ключу опросника. Чистые функции, без DOM.

export function isComplete(answers) {
  return answers.every((a) => a === true || a === false);
}

export function scoreScales(q, answers) {
  const pos = new Map(q.questions.map((item, i) => [item.n, i]));
  const scores = {};
  for (const scale of q.scales) {
    let hits = 0;
    for (const n of scale.yes) if (answers[pos.get(n)] === true) hits++;
    for (const n of scale.no) if (answers[pos.get(n)] === false) hits++;
    scores[scale.id] = hits * scale.multiplier;
  }
  return scores;
}

export function levelOf(score, thresholds) {
  if (score >= thresholds.accent) return 'accent';
  if (score >= thresholds.tendency) return 'tendency';
  return 'norm';
}

export function buildResult(q, answers, date = new Date().toISOString()) {
  const scores = scoreScales(q, answers);
  const scales = q.scales
    .map((s) => ({ id: s.id, score: scores[s.id], level: levelOf(scores[s.id], q.thresholds) }))
    .sort((a, b) => b.score - a.score);
  return { questionnaireId: q.id, date, answers: [...answers], scales };
}
