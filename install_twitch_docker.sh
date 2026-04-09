#!/bin/bash

# Скрипт установки плагина Twitch в Docker контейнер с Lampa
# Использование: ./install_twitch_docker.sh [CONTAINER_ID]

set -e

echo "=== Установка плагина Twitch в Lampa Docker ==="
echo ""

# Проверка наличия плагина
if [ ! -f "twitch_plugin.js" ]; then
    echo "❌ Ошибка: файл twitch_plugin.js не найден"
    echo "Запустите скрипт из корня проекта lampac/"
    exit 1
fi

# Получение ID контейнера
if [ -z "$1" ]; then
    echo "Поиск контейнера с Lampa..."
    CONTAINER_ID=$(docker ps --filter "ancestor=httpd:alpine" --format "{{.ID}}" | head -1)

    if [ -z "$CONTAINER_ID" ]; then
        echo "❌ Контейнер не найден автоматически"
        echo ""
        echo "Доступные контейнеры:"
        docker ps
        echo ""
        echo "Использование: $0 <CONTAINER_ID>"
        exit 1
    fi

    echo "✓ Найден контейнер: $CONTAINER_ID"
else
    CONTAINER_ID=$1
    echo "✓ Используется контейнер: $CONTAINER_ID"
fi

echo ""

# Создание директории для плагинов
echo "Создание директории plugins..."
docker exec $CONTAINER_ID mkdir -p /usr/local/apache2/htdocs/plugins || true

# Копирование плагина
echo "Копирование twitch_plugin.js..."
docker cp twitch_plugin.js $CONTAINER_ID:/usr/local/apache2/htdocs/plugins/twitch_plugin.js

# Проверка
echo "Проверка установки..."
if docker exec $CONTAINER_ID test -f /usr/local/apache2/htdocs/plugins/twitch_plugin.js; then
    echo "✓ Плагин успешно скопирован"

    # Показать размер файла
    SIZE=$(docker exec $CONTAINER_ID stat -c%s /usr/local/apache2/htdocs/plugins/twitch_plugin.js)
    echo "  Размер файла: $SIZE байт"
else
    echo "❌ Ошибка: плагин не найден в контейнере"
    exit 1
fi

echo ""
echo "=== Установка завершена ==="
echo ""
echo "Следующие шаги:"
echo "1. Откройте Lampa в браузере"
echo "2. Перейдите в Настройки → Расширения → Добавить плагин"
echo "3. Вставьте URL: http://your-server/plugins/twitch_plugin.js"
echo "4. Нажмите 'Установить'"
echo ""
echo "Для проверки доступности плагина:"
echo "  curl http://localhost/plugins/twitch_plugin.js"
echo ""
