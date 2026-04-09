# Twitch Plugin для Lampa

Плагин для просмотра стримов Twitch в медиаплеере Lampa.

## Статус разработки

🟢 **Почти готово** - карточки отображаются, токены получаются, осталось настроить проксирование HLS.

## Что сделано

### ✅ Структура плагина
- Создан файл `Lampac/wwwroot/twitch.js`
- Добавлен пункт "Twitch" в главное меню Lampa
- Реализован компонент с использованием Lampa API
- Исправлены ошибки с навигацией и отображением

### ✅ Интеграция с Lampa
- Правильная структура компонента (по примеру из `lampa-source`)
- Использование `Lampa.Card`, `Lampa.Scroll`, `Lampa.Controller`, `Lampa.Activity`
- Корректная работа с навигацией и фокусом
- Карточки стримов отображаются с превью

### ✅ Twitch GraphQL API
- Упрощенный запрос для получения топ стримов работает
- Прокси endpoint `/twitch/proxy` в Startup.cs для обхода CORS
- Получение PlaybackAccessToken работает

### ⚠️ Осталось
- **HLS проксирование**: нужно настроить правильный endpoint для проксирования m3u8
  - `/proxy` и `/serverproxy` возвращают 404
  - Возможно нужен кастомный endpoint для Twitch HLS

## Установка

1. Запустите Lampac сервер:
```bash
cd Lampac
dotnet run
```

2. Откройте Lampa в браузере: `http://localhost:9118/`

3. Установите плагин:
   - Настройки → Расширения → Добавить плагин
   - URL: `http://localhost:9118/twitch.js?v=12`

## Технические детали

### Client ID
Используется публичный Client ID: `kimne78kx3ncx6brgo4mv6wki5h1ko`

### API Endpoint
`https://gql.twitch.tv/gql`

### Текущий запрос (упрощенный)
```javascript
{
  query: `query {
    streams(first: 30) {
      edges {
        node {
          id
          title
          viewersCount
          previewImageURL(width: 440, height: 248)
          broadcaster {
            displayName
            login
          }
          game {
            name
          }
        }
      }
    }
  }`
}
```

## Следующие шаги

1. **Найти рабочий GraphQL запрос** для Twitch API
   - Изучить актуальную документацию Twitch GraphQL
   - Проанализировать запросы из браузера на twitch.tv
   - Попробовать использовать официальный Helix API вместо GraphQL

2. **Альтернативный подход**: использовать Twitch Helix API
   - REST API вместо GraphQL
   - Endpoint: `https://api.twitch.tv/helix/streams`
   - Требуется OAuth токен

3. **Реализовать воспроизведение**
   - Получение PlaybackAccessToken
   - Формирование HLS URL
   - Интеграция с Lampa.Player

## Файлы проекта

```
E:\Project\lampac\
├── Lampac/
│   ├── wwwroot/
│   │   └── twitch.js          ← Основной плагин
│   └── module/
│       └── manifest.json      ← Манифест модуля
├── lampa-source/              ← Исходники Lampa (для справки)
├── id.txt                     ← Client ID
└── README_TWITCH.md           ← Этот файл
```

## Отладка

Логи в консоли браузера (F12):
- `[Twitch API full response:]` - полный ответ от API
- `[Twitch API error:]` - ошибки запросов
- `[Parsed streams:]` - распарсенные стримы

## Изменения

### 08.04.2026 11:09 UTC
- Упрощен GraphQL запрос - убраны `operationName`, `variables` и сложные параметры
- Запрос теперь использует базовый синтаксис без `options` и `sort`
- Убрана обработка `{width}` и `{height}` плейсхолдеров - используется прямой URL

## Дата последнего обновления

08.04.2026 11:09 UTC
