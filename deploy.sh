#!/bin/bash

# 一键部署脚本(兼容OrbStack和云服务器)

# 检查操作系统
OS="unknown"
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
    OS="linux"
elif [[ "$OSTYPE" == "darwin"* ]]; then
    OS="mac"
fi

# 检查Docker/OrbStack是否安装
if ! command -v docker &> /dev/null; then
    if [[ "$OS" == "mac" ]]; then
        if ! command -v orb &> /dev/null; then
            echo "未检测到Docker或OrbStack，请先安装OrbStack: https://orbstack.dev"
            exit 1
        fi
    else
        echo "Docker未安装，正在安装..."
        curl -fsSL https://get.docker.com | sh
        sudo usermod -aG docker $USER
    fi
fi

# 检查OrbStack是否运行(Mac专用)
if [[ "$OS" == "mac" ]] && command -v orb &> /dev/null; then
    if ! orb status | grep -q "running"; then
        echo "OrbStack未运行，正在启动..."
        orb start
        sleep 10 # 等待OrbStack完全启动
    fi
fi

# 检查是否使用纯Docker模式
USE_PLAIN_DOCKER=0
if [[ "$1" == "--plain-docker" ]]; then
    USE_PLAIN_DOCKER=1
    echo "使用纯Docker模式部署..."
else
    # 检查docker-compose是否安装
    if ! command -v docker-compose &> /dev/null; then
        echo "docker-compose未安装，正在安装..."
        if [[ "$OS" == "mac" ]]; then
            brew install docker-compose
        else
            sudo curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
            sudo chmod +x /usr/local/bin/docker-compose
        fi
    fi
fi

# 创建项目目录
mkdir -p ~/fridge-manager
cd ~/fridge-manager

# 克隆仓库
echo "克隆仓库..."
if [ -d ".git" ]; then
    git pull
else
    git clone https://github.com/sjyb/fridge-manager.git .
fi

# 云服务器特定配置
if [[ "$OS" == "linux" && $USE_PLAIN_DOCKER -eq 0 ]]; then
    echo "检测到Linux系统，应用云服务器优化配置..."
    sed -i 's/ports:.*3306.*/# ports: 3306/g' docker-compose.yml
    echo "优化内存限制..."
    if ! grep -q "default-ulimits" docker-compose.yml; then
        echo "default-ulimits:" >> docker-compose.yml
        echo "  memlock:" >> docker-compose.yml
        echo "    hard: -1" >> docker-compose.yml
        echo "    soft: -1" >> docker-compose.yml
    fi
fi

# OrbStack特定配置
if [[ "$OS" == "mac" ]] && command -v orb &> /dev/null && $USE_PLAIN_DOCKER -eq 0; then
    echo "检测到OrbStack环境，应用优化配置..."
    sed -i '' 's/# networks:/networks:/g' docker-compose.yml
fi

# 设置文件权限
chmod -R 755 .

# 启动服务
echo "正在启动服务..."
if [[ $USE_PLAIN_DOCKER -eq 1 ]]; then
    # 纯Docker模式部署
    echo "创建专用网络..."
    docker network inspect fridge-network >/dev/null 2>&1 || docker network create fridge-network
    
    echo "启动数据库容器..."
    docker run -d \
      --name fridge-db \
      --network fridge-network \
      -v $(pwd)/db_data:/var/lib/mysql \
      -e MYSQL_ROOT_PASSWORD=rootpassword \
      -e MYSQL_DATABASE=fridge_manager \
      -p 3306:3306 \
      --restart unless-stopped \
      mariadb:10.6
    
    echo "构建应用镜像..."
    docker build -t fridge-app .
    
    echo "启动应用容器..."
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
    
    echo "等待数据库初始化..."
    sleep 10
    
    echo "初始化数据库结构..."
    docker exec fridge-db mysql -uroot -prootpassword fridge_manager < /var/www/html/db/schema.sql
else
    # 使用docker-compose部署
    docker-compose up -d --build
fi

# 等待服务启动
echo "等待服务初始化..."
sleep 15

# 检查服务状态
if [[ $USE_PLAIN_DOCKER -eq 1 ]]; then
    # 检查纯Docker部署的容器状态
    if [ $(docker inspect -f '{{.State.Running}}' fridge-app 2>/dev/null) = "true" ] && [ $(docker inspect -f '{{.State.Running}}' fridge-db 2>/dev/null) = "true" ]; then
        container_status="Up"
    else
        container_status="Down"
    fi
else
    # 检查docker-compose部署的容器状态
    container_status=$(docker-compose ps | grep -q "Up" && echo "Up" || echo "Down")
fi

if [[ "$container_status" == "Up" ]]; then
    echo "智能冰箱管理系统已成功部署！"
    echo "前端访问地址: http://localhost:3000"
    if [[ "$OS" == "linux" ]]; then
        IP=$(hostname -I | awk '{print $1}')
        echo "云服务器访问地址: http://$IP:3000"
    fi
else
    echo "服务启动失败，请检查日志: docker-compose logs"
    exit 1
fi



