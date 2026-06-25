# Stage 1: Build the React frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app
COPY projet-de-synthese-soutnence/front-end/package*.json ./
RUN npm install
COPY projet-de-synthese-soutnence/front-end ./
RUN npm run build

# Stage 2: Final Runner Image
FROM php:8.2-cli

# Install Nginx, Node.js, Supervisor, and tools
RUN apt-get update && apt-get install -y \
    nginx \
    supervisor \
    curl \
    git \
    unzip \
    libsqlite3-dev \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions
RUN docker-php-ext-install pdo pdo_sqlite

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Setup directories
WORKDIR /var/www

# Copy Laravel backend
COPY projet-de-synthese-soutnence/backend ./backend
WORKDIR /var/www/backend

# Setup backend dependencies and environment
RUN composer install --no-dev --optimize-autoloader
RUN cp .env.example .env
RUN touch database/database.sqlite
RUN php artisan key:generate
RUN php artisan migrate --force --seed

# Setup frontend and socket server
WORKDIR /var/www/front-end
COPY --from=frontend-builder /app/dist /usr/share/nginx/html
COPY projet-de-synthese-soutnence/front-end/socket-server.cjs ./
COPY projet-de-synthese-soutnence/front-end/package*.json ./
RUN npm install --only=production

# Copy Nginx and Supervisor configs
COPY nginx.conf /etc/nginx/nginx.conf
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose port 80 (Nginx)
EXPOSE 80

# Start Supervisor to run Nginx, Laravel server, and Socket server
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
