// Компактная передача ответов в URL.
// 2 бита на ответ: 00 = null, 01 = false (нет), 10 = true (да).
// Четыре ответа в байте, первый ответ — в старших битах.
// Результат — base64 URL-safe без '='.

function codeOf(answer) {
  if (answer === true) return 2;
  if (answer === false) return 1;
  return 0;
}

function valueOf(code) {
  if (code === 2) return true;
  if (code === 1) return false;
  if (code === 0) return null;
  return undefined;
}

export function encodeAnswers(answers) {
  const list = Array.isArray(answers) ? answers : [];
  let bin = '';
  for (let i = 0; i < list.length; i += 4) {
    let byte = 0;
    for (let j = 0; j < 4; j++) {
      const code = i + j < list.length ? codeOf(list[i + j]) : 0;
      byte |= code << (6 - 2 * j);
    }
    bin += String.fromCharCode(byte);
  }
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeAnswers(str, length) {
  try {
    if (typeof str !== 'string' || !Number.isInteger(length) || length < 0) return null;
    if (!/^[A-Za-z0-9_-]*$/.test(str)) return null;

    const rem = str.length % 4;
    if (rem === 1) return null;
    const b64 = str.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat(rem ? 4 - rem : 0);
    const bin = atob(b64);

    const needBytes = Math.ceil(length / 4);
    if (bin.length !== needBytes) return null;

    const answers = [];
    for (let i = 0; i < length; i++) {
      const byte = bin.charCodeAt(i >> 2);
      const value = valueOf((byte >> (6 - 2 * (i % 4))) & 3);
      if (value === undefined) return null;
      answers.push(value);
    }

    // неиспользуемые младшие биты последнего байта должны быть нулевыми
    if (length % 4 !== 0) {
      const usedBits = 2 * (length % 4);
      const last = bin.charCodeAt(needBytes - 1);
      if (last & ((1 << (8 - usedBits)) - 1)) return null;
    }

    return answers;
  } catch {
    return null;
  }
}

export function shareUrl(qid, answers) {
  return (
    location.origin +
    location.pathname +
    '#/result?q=' +
    encodeURIComponent(qid) +
    '&a=' +
    encodeAnswers(answers)
  );
}
