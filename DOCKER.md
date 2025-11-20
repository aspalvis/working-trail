# Docker Deployment Guide

## Быстрый старт

### 1. С помощью Docker Compose (проще всего)

```bash
# Запустить приложение
docker-compose up -d

# Остановить приложение
docker-compose down
```

### 2. С помощью Docker напрямую

```bash
# Сборка
docker build -t time-tracking:latest .

# Запуск
docker run -d \
  --name time-tracking \
  -p 3000:3000 \
  -v ${PWD}/data:/app/data \
  time-tracking:latest
```

## Архитектура Docker образа

### Multi-stage сборка

1. **deps** - установка зависимостей
2. **builder** - сборка приложения
3. **runner** - финальный минимальный образ

### Размер образа

- Базовый образ: `node:20-alpine` (~120MB)
- Финальный образ: ~200-250MB (зависит от зависимостей)

## Переменные окружения

| Переменная | Значение по умолчанию | Описание               |
| ---------- | --------------------- | ---------------------- |
| `NODE_ENV` | `production`          | Режим работы Node.js   |
| `PORT`     | `3000`                | Порт приложения        |
| `HOSTNAME` | `0.0.0.0`             | Хост для прослушивания |

### Пример с .env файлом

Создайте файл `.env`:

```env
NODE_ENV=production
PORT=3000
```

Запуск с .env:

```bash
docker run -d \
  --name time-tracking \
  --env-file .env \
  -p 3000:3000 \
  -v ${PWD}/data:/app/data \
  time-tracking:latest
```

## Volumes (Персистентные данные)

### Важно: данные Excel файлов

Директория `/app/data` должна быть примонтирована как volume для сохранения данных между перезапусками:

```bash
# Linux/Mac
-v $(pwd)/data:/app/data

# Windows PowerShell
-v ${PWD}/data:/app/data

# Windows CMD
-v %cd%/data:/app/data
```

### Docker Compose автоматически использует volume:

```yaml
volumes:
  - ./data:/app/data
```

## Health Check

Контейнер включает health check для мониторинга:

```bash
# Проверить статус
docker ps

# Подробная информация о health check
docker inspect time-tracking | grep -A 10 Health
```

## Логи

```bash
# Docker
docker logs -f time-tracking

# Docker Compose
docker-compose logs -f
```

## Обновление приложения

### С Docker Compose

```bash
# Пересобрать и перезапустить
docker-compose up -d --build

# Или пошагово
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

### С Docker

```bash
# Остановить старый контейнер
docker stop time-tracking
docker rm time-tracking

# Пересобрать образ
docker build --no-cache -t time-tracking:latest .

# Запустить новый контейнер
docker run -d \
  --name time-tracking \
  -p 3000:3000 \
  -v ${PWD}/data:/app/data \
  time-tracking:latest
```

## Production рекомендации

### 1. Использовать конкретные версии тегов

```bash
docker build -t time-tracking:1.0.0 .
```

### 2. Настроить автоматический перезапуск

```yaml
# docker-compose.yml
services:
  app:
    restart: unless-stopped
```

Или с Docker:

```bash
docker run -d \
  --restart unless-stopped \
  --name time-tracking \
  -p 3000:3000 \
  -v ${PWD}/data:/app/data \
  time-tracking:latest
```

### 3. Использовать reverse proxy (nginx/traefik)

Пример с nginx:

```nginx
server {
    listen 80;
    server_name timetracking.example.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Настроить backup данных

```bash
# Скрипт backup
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf backup_${DATE}.tar.gz data/
```

### 5. Мониторинг ресурсов

```bash
# Статистика контейнера
docker stats time-tracking

# Использование места
docker system df
```

## Troubleshooting

### Проблема: Контейнер не запускается

```bash
# Проверить логи
docker logs time-tracking

# Проверить права доступа к data/
ls -la data/
```

### Проблема: Не сохраняются данные

- Убедитесь, что volume примонтирован корректно
- Проверьте права доступа к директории `data/`

```bash
# Проверить volume
docker inspect time-tracking | grep -A 5 Mounts
```

### Проблема: Порт уже занят

```bash
# Найти процесс на порту 3000
# Linux/Mac
lsof -i :3000

# Windows
netstat -ano | findstr :3000

# Изменить порт в docker-compose.yml
ports:
  - "3001:3000"
```

## Безопасность

1. ✅ Приложение запускается от непривилегированного пользователя (nextjs)
2. ✅ Используется минимальный alpine образ
3. ✅ Не включены файлы разработки (.dockerignore)
4. ✅ Отключена телеметрия Next.js

## CI/CD Integration

### GitHub Actions пример

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Build Docker image
        run: docker build -t time-tracking:${{ github.sha }} .

      - name: Push to registry
        run: |
          docker tag time-tracking:${{ github.sha }} registry.example.com/time-tracking:latest
          docker push registry.example.com/time-tracking:latest
```
