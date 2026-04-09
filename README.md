# Lampac с Twitch плагином

Lampac сервер с интегрированным плагином для просмотра Twitch стримов в медиаплеере Lampa.

![Демонстрация](gif/lampa_twich.gif)

## Быстрый старт (Docker)

```bash
# Клонируйте репозиторий
git clone https://github.com/sanchousmutant/lampac-twitch-plugin
cd lampac-twitch-plugin

# Запустите
docker compose up -d

# Проверьте логи
docker compose logs -f
```

Сервер будет доступен на `http://your-server-ip:9118`

## Установка Twitch плагина

1. Откройте Lampa: `http://your-server-ip:9118/`
2. Настройки → Расширения → Добавить плагин
3. URL: `http://your-server-ip:9118/twitch.js`

## Локальная разработка

```bash
cd Lampac
dotnet run
```

Сервер запустится на `http://localhost:9118`

## Структура проекта

```
lampac-twitch-plugin/
├── Lampac/              # Основной проект
│   └── wwwroot/
│       └── twitch.js    # Twitch плагин для Lampa
├── Shared/              # Общие библиотеки
├── Online/              # Онлайн провайдеры
├── current.conf         # Конфигурация
├── Dockerfile           # Docker образ
└── docker-compose.yml   # Docker Compose конфигурация
```

## Документация

- [DEPLOY.md](DEPLOY.md) - Полная инструкция по развертыванию

## Обновление

```bash
git pull
docker compose down
docker compose up -d --build
```

## Порты

- `9118` - Lampac API и Lampa Web интерфейс

## Требования

- Docker и Docker Compose
- 2GB RAM минимум
- Порт 9118 должен быть свободен

## Troubleshooting

### Проверка статуса
```bash
docker-compose ps
docker-compose logs lampac
```

### Перезапуск
```bash
docker compose restart
```

### Полная пересборка
```bash
docker compose down
docker compose build --no-cache
docker compose up -d
```

## Лицензия

См. оригинальный проект Lampac https://github.com/lampac-talks/lampac
