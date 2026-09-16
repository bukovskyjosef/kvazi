FROM php:8.3-apache

RUN apt-get update && apt-get install -y --no-install-recommends libpq-dev libicu-dev libonig-dev \
    && docker-php-ext-install pdo pdo_pgsql intl mbstring \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

COPY docker/php/healthz.conf /etc/apache2/conf-available/kvazi-healthz.conf
RUN a2enconf kvazi-healthz

COPY app/public/ /var/www/html/
COPY app/data/ /var/www/data/

EXPOSE 80
