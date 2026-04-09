# Multi-stage build для Lampac с Twitch плагином
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Копируем solution и проекты
COPY *.sln ./
COPY Lampac/Lampac.csproj Lampac/
COPY Shared/Shared.csproj Shared/
COPY BaseModule/BaseModule.csproj BaseModule/
COPY Online/Online.csproj Online/
COPY SISI/SISI.csproj SISI/
COPY JacRed/JacRed.csproj JacRed/
COPY Catalog/Catalog.csproj Catalog/
COPY DLNA/DLNA.csproj DLNA/
COPY TorrServer/TorrServer.csproj TorrServer/
COPY Tracks/Tracks.csproj Tracks/
COPY Merchant/Merchant.csproj Merchant/

# Restore dependencies
RUN dotnet restore

# Копируем весь код
COPY . .

# Build
WORKDIR /src/Lampac
RUN dotnet publish -c Release -o /app/publish

# Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app

# Установка зависимостей для Chromium
RUN apt-get update && apt-get install -y \
    chromium \
    xvfb \
    libnspr4 \
    fontconfig \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Копируем собранное приложение
COPY --from=build /app/publish .

# Копируем BaseModule для динамической загрузки контроллеров
COPY --from=build /src/BaseModule /BaseModule

# Копируем конфигурацию
COPY current.conf ./init.conf

# Создаем необходимые директории
RUN mkdir -p /app/cache /app/runtimes/references

# Настройка Chromium
RUN echo '{"chromium":{"executablePath":"/usr/bin/chromium"}}' > chromium.conf

EXPOSE 9118

ENTRYPOINT ["dotnet", "Lampac.dll"]
