#!/bin/bash

# Node.js版本部署脚本(群晖专用)

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "未检测到Docker，请先在群晖套件中心安装Docker"
    exit 1
fi

# 检查Docker服务是否运行
if ! docker info &> /dev/null; then
    echo "Docker服务未运行，请在群晖Docker套件中启动Docker服务"
    exit 1
fi

# 创建项目目录
mkdir -p /volume1/docker/fridge-manager
cd /volume1/docker/fridge-manager

# 克隆仓库
echo "克隆仓库..."
if [ -d ".git" ]; then
    git pull
else
    git clone https://github.com/sjyb/fridge-manager.git .
fi

# 构建Docker镜像
echo "构建Docker镜像..."
docker build -t fridge-manager-node .

# 停止并删除旧容器(如果存在)
if [ "$(docker ps -a -q -f name=fridge-manager)" ]; then
    docker stop fridge-manager
    docker rm fridge-manager
fi

# 获取群晖数据库信息
echo "请输入群晖MariaDB数据库信息:"
read -p "数据库主机(默认: localhost): " DB_HOST
read -p "数据库端口(默认: 3306): " DB_PORT
read -p "数据库名称(默认: fridge_manager): " DB_NAME
read -p "数据库用户名: " DB_USER
read -s -p "数据库密码: " DB_PASSWORD
echo

# 设置默认值
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-3306}
DB_NAME=${DB_NAME:-fridge_manager}

# 创建数据库（如果不存在）
echo "正在检查并创建数据库..."
docker run --rm \
  --network=host \
  mariadb:10.3.32 \
  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"

# 初始化数据库结构
echo "正在初始化数据库结构..."
docker run --rm \
  --network=host \
  -v $(pwd)/db:/sql \
  mariadb:10.3.32 \
  mysql -h $DB_HOST -P $DB_PORT -u $DB_USER -p$DB_PASSWORD $DB_NAME < /sql/schema.sql

# 启动新容器
echo "启动应用容器..."
docker run -d \
  --name fridge-manager \
  --network=host \
  -e DB_HOST=$DB_HOST \
  -e DB_PORT=$DB_PORT \
  -e DB_NAME=$DB_NAME \
  -e DB_USER=$DB_USER \
  -e DB_PASSWORD=$DB_PASSWORD \
  -p 3000:3000 \
  --restart unless-stopped \
  fridge-manager-node

# 等待服务启动
echo "等待服务初始化..."
sleep 10

# 检查服务状态
if [ $(docker inspect -f '{{.State.Running}}' fridge-manager 2>/dev/null) = "true" ]; then
    echo "智能冰箱管理系统已成功部署！"
    echo "访问地址: http://群晖IP:3000"
else
    echo "服务启动失败，请检查日志: docker logs fridge-manager"
    exit 1
fi