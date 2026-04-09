# Интеграция Twitch в Lampa

## Описание проекта

Проект по интеграции стримингового сервиса Twitch в медиаплеер Lampa через серверную часть Lampac.

## Что было реализовано

### ✅ Серверная часть (Lampac API)

**Файлы:**
- `lampac/Online/Controllers/Twitch.cs` - контроллер с 6 маршрутами
- `lampac/Shared/Engine/Online/Twitch.cs` - движок для работы с Twitch GraphQL API
- `lampac/Shared/Models/Online/Twitch/Models.cs` - модели данных

**API Endpoints:**
- `/lite/twitch` - топ стримы / поиск
- `/lite/twitch/search` - поиск каналов
- `/lite/twitch/channel` - информация о канале (live + VODs)
- `/lite/twitch/stream` - URL прямой трансляции
- `/lite/twitch/vods` - список VOD канала
- `/lite/twitch/vod` - URL конкретного VOD

**Технологии:**
- GraphQL запросы к `gql.twitch.tv`
- HLS потоки через `usher.ttvnw.net`
- Client ID: `kd1unb4b3q4t58fwlpcbzcbnm76a8fp`

### ✅ Клиентская часть (Lampa Plugin)

**Файлы:**
- `lampac/Lampac/wwwroot/twitch_plugin.js` - плагин для Lampa
- `lampac/Lampac/wwwroot/lampa-main/plugins/modification.js` - файл модификации (очищен)
- `lampac/Lampac/wwwroot/lampainit.js` - инициализация плагинов

**Функционал плагина:**
- Добавление пункта "Twitch" в главное меню Lampa
- Отображение топ стримов Twitch
- Компонент для просмотра каталога стримов
- Интеграция с Lampa Activity и Controller API

### ⚙️ Конфигурация

**Файл:** `lampac/Lampac/current.conf`

```json
"Twitch": {
  "client_id": "kd1unb4b3q4t58fwlpcbzcbnm76a8fp",
  "enable": true,
  "enabled": true,  // ⚠️ Должно быть true для работы API
  "spider": true,
  "kit": true,
  "host": "https://gql.twitch.tv"
}
```

### 🔧 Исправленные проблемы

1. **Путь к BaseModule** - исправлен в `Startup.cs` (строка 648):
   ```csharp
   patchcontrol = "../BaseModule/Controllers";
   ```

2. **Отсутствующие файлы:**
   - Создана директория `lampac/Lampac/module/`
   - Создан файл `manifest.json`

3. **Символическая ссылка** - создана `basemod -> ../BaseModule`

## Установка и запуск

### 1. Запуск сервера Lampac

```bash
cd E:\Project\twich\lampac\Lampac
dotnet build
dotnet run --no-build
```

Сервер запустится на `http://localhost:9118`

### 2. Проверка API

Откройте в браузере: `http://localhost:9118/lite/twitch`

Должен вернуться JSON с топ стримами Twitch.

### 3. Установка плагина в Lampa

1. Откройте Lampa: `http://localhost:9118/`
2. Перейдите в **Настройки** → **Расширения** → **Добавить плагин**
3. Вставьте URL: `http://localhost:9118/twitch_plugin.js`
4. Нажмите "Установить"

После установки в главном меню появится кнопка **"Twitch"** с иконкой.

## Известные проблемы

### ❌ API возвращает 404

**Причина:** Twitch отключён в конфигурации

**Решение:**
1. Откройте `lampac/Lampac/current.conf`
2. Найдите секцию `"Twitch"`
3. Убедитесь что `"enabled": true`
4. Перезапустите сервер

### ❌ Плагин не загружается

**Причина:** Ошибки в JavaScript коде плагина

**Решение:** Проверьте консоль браузера (F12) на наличие ошибок

### ❌ Сервер не запускается

**Причина:** Порт 9118 занят или отсутствуют зависимости

**Решение:**
```bash
# Проверить порт
netstat -ano | grep :9118

# Убить процесс
taskkill /F /PID <PID>

# Установить зависимости
dotnet restore
```

## Структура проекта

```
E:\Project\twich\
├── lampac/
│   ├── Lampac/
│   │   ├── Controllers/
│   │   ├── Engine/
│   │   ├── wwwroot/
│   │   │   ├── lampa-main/
│   │   │   │   └── plugins/
│   │   │   │       ├── modification.js
│   │   │   │       └── twitch.js
│   │   │   ├── lampainit.js
│   │   │   └── twitch_plugin.js  ← Основной плагин
│   │   ├── Startup.cs
│   │   ├── Program.cs
│   │   └── current.conf
│   ├── Online/
│   │   └── Controllers/
│   │       └── Twitch.cs  ← API контроллер
│   ├── Shared/
│   │   ├── Engine/Online/
│   │   │   └── Twitch.cs  ← Движок Twitch
│   │   └── Models/Online/Twitch/
│   │       └── Models.cs
│   └── BaseModule/
├── Twire/  (референсный клиент)
├── Xtra/   (референсный клиент)
└── README.md  ← Этот файл
```

## Технические детали

### Архитектура Twitch API

1. **GraphQL запрос** к `gql.twitch.tv/gql` для получения `PlaybackAccessToken`
2. **Сборка HLS URL:**
   - Live: `usher.ttvnw.net/api/channel/hls/{channel}.m3u8`
   - VOD: `usher.ttvnw.net/vod/{vodId}.m3u8`
3. **Парсинг M3U8** плейлиста с выбором качества

### Lampa Plugin API

- `Lampa.Component.add()` - регистрация компонента
- `Lampa.Activity.push()` - навигация между экранами
- `Lampa.Scroll` - прокручиваемый контейнер
- `Lampa.Template.get('card')` - создание карточек контента
- `Lampa.Reguest` - HTTP запросы

## Дата создания

07.04.2026

## Статус

🟡 **В разработке** - серверная часть готова, клиентский плагин требует доработки для корректного отображения в Lampa.
