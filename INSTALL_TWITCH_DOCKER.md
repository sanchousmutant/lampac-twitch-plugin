# Установка плагина Twitch в Docker контейнер с Lampa

## Способ 1: Копирование в работающий контейнер (быстрый)

### Шаг 1: Найдите ID контейнера
```bash
docker ps | grep lampa
# или
docker ps
```

### Шаг 2: Скопируйте плагин в контейнер
```bash
# Из корня проекта
docker cp twitch_plugin.js 5c16004ca197:/usr/local/apache2/htdocs/plugins/twitch_plugin.js

# Проверьте что файл скопировался
docker exec 5c16004ca197 ls -la /usr/local/apache2/htdocs/plugins/
```

### Шаг 3: Установите плагин в Lampa
1. Откройте Lampa в браузере: `http://your-server:port/`
2. Перейдите в **Настройки** → **Расширения** → **Добавить плагин**
3. Вставьте URL: `http://your-server:port/plugins/twitch_plugin.js`
4. Нажмите "Установить"

---

## Способ 2: Пересборка образа с плагином (постоянный)

### Шаг 1: Скопируйте плагин в директорию Lampa
```bash
cp twitch_plugin.js Lampac/wwwroot/lampa-main/plugins/
```

### Шаг 2: Пересоберите Docker образ
```bash
cd Lampac/wwwroot/lampa-main/

# Используйте новый Dockerfile с плагином
docker build -f Dockerfile.twitch \
  --build-arg domain=your-lampac-server.com \
  -t lampa-twitch:latest .
```

### Шаг 3: Перезапустите контейнер
```bash
docker stop <CONTAINER_ID>
docker run -d -p 80:80 lampa-twitch:latest
```

---

## Способ 3: Через docker-compose (рекомендуется)

### Создайте docker-compose.yml:
```yaml
version: '3.8'

services:
  lampa:
    build:
      context: ./Lampac/wwwroot/lampa-main
      dockerfile: Dockerfile.twitch
      args:
        domain: your-lampac-server.com
        prefix: "http://"
    ports:
      - "80:80"
    volumes:
      - ./twitch_plugin.js:/usr/local/apache2/htdocs/plugins/twitch_plugin.js:ro
    restart: unless-stopped
```

### Запустите:
```bash
docker-compose up -d
```

---

## Способ 4: Монтирование через Volume (самый гибкий)

### Если контейнер уже запущен с volume:
```bash
# Найдите volume
docker volume ls
docker volume inspect <volume_name>

# Скопируйте плагин в путь volume
# Путь будет примерно: /var/lib/docker/volumes/<volume_name>/_data/
sudo cp twitch_plugin.js /var/lib/docker/volumes/<volume_name>/_data/plugins/
```

### Или создайте новый контейнер с volume:
```bash
docker run -d \
  -p 80:80 \
  -v $(pwd)/twitch_plugin.js:/usr/local/apache2/htdocs/plugins/twitch_plugin.js:ro \
  lampa:latest
```

---

## Проверка установки

### 1. Проверьте что файл доступен:
```bash
curl http://your-server/plugins/twitch_plugin.js
```

### 2. Проверьте консоль браузера (F12):
- Не должно быть ошибок загрузки плагина
- Должно быть сообщение: `[Twitch] Plugin initialized`

### 3. Проверьте меню Lampa:
- В главном меню должна появиться кнопка "Twitch"

---

## Важные замечания

1. **URL плагина должен быть доступен из браузера**, а не только внутри контейнера
2. **Lampac API должен быть доступен** для работы плагина (проверьте `/lite/twitch`)
3. **CORS настройки** - убедитесь что Lampac разрешает запросы от Lampa
4. **Twitch должен быть включен** в `current.conf`:
   ```json
   "Twitch": {
     "enabled": true,
     "client_id": "kd1unb4b3q4t58fwlpcbzcbnm76a8fp"
   }
   ```

---

## Troubleshooting

### Плагин не загружается
```bash
# Проверьте логи контейнера
docker logs <CONTAINER_ID>

# Проверьте что файл существует
docker exec <CONTAINER_ID> cat /usr/local/apache2/htdocs/plugins/twitch_plugin.js
```

### API не отвечает
```bash
# Проверьте что Lampac запущен и доступен
curl http://your-lampac-server:9118/lite/twitch

# Проверьте конфигурацию
docker exec <LAMPAC_CONTAINER_ID> cat /app/current.conf | grep -A 5 Twitch
```

### Карточки не отображаются
- Откройте консоль браузера (F12)
- Проверьте Network tab - приходят ли данные от API
- Проверьте Console tab - есть ли JavaScript ошибки
