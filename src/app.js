// Точка входа: hash-роутер. Все пути относительные (GitHub Pages, подпуть /AI_psy/).
import questionnaire from './data/schmieschek.js';
import * as types from './data/types.js';
import * as home from './ui/screens/home.js';
import * as test from './ui/screens/test.js';
import * as result from './ui/screens/result.js';
import * as history from './ui/screens/history.js';

const screens = { home, test, result, history };
const routes = { '': 'home', '/': 'home', '/test': 'test', '/result': 'result', '/history': 'history' };

// '#/result?q=a&a=b' → { path: '/result', params: { q, a } }
export function parseHash(hash) {
  const raw = hash.replace(/^#/, '');
  const qi = raw.indexOf('?');
  const path = qi === -1 ? raw : raw.slice(0, qi);
  const query = qi === -1 ? '' : raw.slice(qi + 1);
  return { path, params: Object.fromEntries(new URLSearchParams(query)) };
}

function navigate(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

function render() {
  const root = document.getElementById('app');
  const { path, params } = parseHash(location.hash);
  const name = routes[path] || 'home';
  const ctx = { questionnaire, types, navigate, params };
  window.scrollTo(0, 0);
  screens[name].render(root, ctx);
}

window.addEventListener('hashchange', render);
render();
