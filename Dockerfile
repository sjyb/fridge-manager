# 使用官方PHP镜像作为基础镜像
FROM php:8.1-apache

# 安装必要的PHP扩展
RUN apt-get update && apt-get install -y \
    libpng-dev \
    libonig-dev \
    libxml2-dev \
    zip \
    unzip \
    mariadb-client \
    && docker-php-ext-install pdo_mysql mbstring exif pcntl bcmath gd

# 启用Apache的rewrite模块
RUN a2enmod rewrite

# 设置工作目录
WORKDIR /var/www/html

# 复制项目文件
COPY . .

# 安装Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# 安装依赖
RUN composer install --no-dev --optimize-autoloader

# 设置文件权限
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage

# 暴露端口
EXPOSE 80

# 启动Apache
CMD ["apache2-foreground"]
