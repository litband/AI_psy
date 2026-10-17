# План MVP

## Структура
```
index.html
css/        base.css, components.css, print.css
src/app.js  — hash-роутер
src/data/   schmieschek.js (вопросы+ключ), types.js (описания)
src/core/   scoring.js, storage.js, share.js
src/ui/     chart.js, screens/{home,test,result,history}.js
tests/      test.html, scoring.test.js
doc/Контекст/
```
Подробные API — в [contracts.md](contracts.md).

## Этапы
1. Скелет, контракты, контекст, репозиторий GitHub
2. Параллельно агенты: Контент (Sonnet) / UI (Sonnet) / Утилиты+тесты (Haiku)
3. Интеграция, ревью, тесты подсчёта
4. GitHub Pages, проверка в браузере (десктоп + 375px, тёмная тема)
5. Обновление status.md, коммит/push

## Бэклог после MVP
- ПДО Личко (подростковый) как второй опросник
- 97-вопросный вариант Шмишека со шкалой лжи
- Сравнение результатов в истории
