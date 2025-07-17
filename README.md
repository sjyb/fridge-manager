# 智能冰箱管理系统

一个现代化的智能冰箱管理应用，帮助用户追踪食物保质期、管理库存并提供膳食建议。

## 功能特点

- 直观的冰箱分区管理（冷藏、冷冻、解冻）
- 食物保质期追踪与提醒
- 智能膳食推荐
- 消费统计与分析
- 多设备同步

## 部署指南

### 前提条件

- Docker
- Git

### 选项1: 使用Docker Compose部署（推荐）

```bash
# 克隆仓库
git clone https://github.com/sjyb/fridge-manager.git
cd fridge-manager

# 启动服务
docker-compose up -d --build

# 访问应用
open http://localhost:3000
```

### 选项2: 仅使用Docker部署

如果你不想使用docker-compose，可以通过以下命令手动部署：

```bash
# 克隆仓库
git clone https://github.com/sjyb/fridge-manager.git
cd fridge-manager

# 创建专用网络
docker network create fridge-network

# 启动数据库容器
docker run -d \
  --name fridge-db \
  --network fridge-network \
  -v $(pwd)/db_data:/var/lib/mysql \
  -e MYSQL_ROOT_PASSWORD=rootpassword \
  -e MYSQL_DATABASE=fridge_manager \
  -p 3306:3306 \
  --restart unless-stopped \
  mariadb:10.6

# 构建应用镜像
docker build -t fridge-app .

# 启动应用容器
docker run -d \
  --name fridge-app \
  --network fridge-network \
  -v $(pwd)/src:/var/www/html/src \
  -v $(pwd)/public:/var/www/html/public \
  -e DB_HOST=fridge-db \
  -e DB_NAME=fridge_manager \
  -e DB_USER=root \
  -e DB_PASSWORD=rootpassword \
  -p 3000:80 \
  --restart unless-stopped \
  fridge-app

# 初始化数据库
docker exec fridge-db mysql -uroot -prootpassword fridge_manager < /var/www/html/db/schema.sql

# 访问应用
open http://localhost:3000
```

### 选项3: 使用一键部署脚本

```bash
# 下载并运行部署脚本
curl -fsSL https://raw.githubusercontent.com/sjyb/fridge-manager/main/deploy.sh | bash

# 或者从本地运行
./deploy.sh
```

## 使用说明

1. 首次登录后，设置你的冰箱功能区配置
2. 添加食物到相应的区域
3. 设置食物保质期
4. 查看统计分析和膳食建议

## 故障排除

- **数据库连接问题**: 确保数据库容器先于应用容器启动
- **端口冲突**: 如果3000或3306端口已被占用，可以在启动命令中修改端口映射
- **数据持久化**: 数据库数据存储在本地`db_data`目录中，删除此目录将清除所有数据

## 技术栈

- Frontend: React, TypeScript, Tailwind CSS
- Backend: PHP
- Database: MariaDB
- Containerization: Docker