// Мелкие помощники для создания DOM без innerHTML.

// el('div', { class: 'card', onclick: fn }, 'текст' | узел | [..]) → HTMLElement
export function el(tag, attrs = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue;
    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2), value);
    } else if (key === 'class') {
      node.className = value;
    } else {
      node.setAttribute(key, value === true ? '' : String(value));
    }
  }
  append(node, children);
  return node;
}

function append(node, children) {
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
}

// Очистить корневой контейнер и вставить новое содержимое.
export function mount(root, ...children) {
  root.replaceChildren();
  append(root, children);
}

// Форматирование ISO-даты для пользователя.
export function formatDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('ru-RU', { dateStyle: 'long', timeStyle: 'short' });
}

// Кнопка-ссылка на хэш-маршрут (через navigate, чтобы не терять состояние).
export function linkButton(label, onClick, cls = 'btn') {
  return el('button', { type: 'button', class: cls, onclick: onClick }, label);
}
