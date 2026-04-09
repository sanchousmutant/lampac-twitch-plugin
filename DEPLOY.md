# Развертывание Lampac с Twitch плагином на OpenMediaVault

## Что создано

- `Dockerfile` - образ для сборки Lampac с вашим кодом
- `docker-compose.yml` - конфигурация для запуска
- `.dockerignore` - исключения для оптимизации сборки

## Подготовка на вашем ПК

### 1. Закоммитьте изменения в Git
```bash
git add .
git commit -m "Add Twitch plugin and Docker setup"
git push origin main
```

## Развертывание на OpenMediaVault сервере

### 2. Подключитесь к серверу по SSH
```bash
ssh your-user@your-openmediavault-ip
```

### 3. Клонируйте репозиторий
```bash
cd /srv/dev-disk-by-uuid-xxxxx/docker  # или ваша директория для Docker
git clone https://github.com/your-username/lampac-twitch-plugin.git
cd lampac-twitch-plugin
```

### 4. Запустите через Docker Compose
```bash
docker-compose up -d
```

### 5. Проверьте статус
```bash
docker-compose ps
docker-compose logs -f lampac
```

## Доступ к сервису

- **Lampac API**: `http://your-server-ip:9118`
- **Lampa Web**: `http://your-server-ip:9118/`
- **Twitch плагин**: `http://your-server-ip:9118/twitch.js`

## Установка плагина в Lampa

1. Откройте `http://your-server-ip:9118/` в браузере
2. Настройки → Расширения → Добавить плагин
3. URL: `http://your-server-ip:9118/twitch.js`

## Обновление

```bash
cd /path/to/lampac-twitch-plugin
git pull
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Остановка

```bash
docker-compose down
```

## Удаление (с данными)

```bash
docker-compose down -v
```

## Альтернатива: Использование готового Dockerfile

Если хотите собрать образ отдельно:

```bash
# Соберите образ
docker build -t lampac-twitch:latest -f Build/cloudflare/Dockerfile .

# Запустите контейнер
docker run -d \
  --name lampac-twitch \
  -p 9118:9118 \
  -v $(pwd)/current.conf:/app/init.conf:ro \
  -v lampac-data:/app/cache \
  lampac-twitch:latest
```

## Настройка через Portainer (если используете)

1. Откройте Portainer в OpenMediaVault
2. Stacks → Add stack
3. Вставьте содержимое `docker-compose.yml`
4. Deploy

## Troubleshooting

### Порт занят
```bash
# Измените порт в docker-compose.yml
ports:
  - "9119:9118"  # используйте другой внешний порт
```

### Проблемы с правами
```bash
sudo chown -R 1000:1000 ./current.conf
```

### Логи
```bash
docker-compose logs -f
```

### Перезапуск
```bash
docker-compose restart
```
