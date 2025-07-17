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
if [[ "$OS" == "linux" ]]; then
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
if [[ "$OS" == "mac" ]] && command -v orb &> /dev/null; then
    echo "检测到OrbStack环境，应用优化配置..."
    sed -i '' 's/# networks:/networks:/g' docker-compose.yml
fi

# 设置文件权限
chmod -R 755 .

# 启动服务
echo "正在启动服务..."
docker-compose up -d --build

# 等待服务启动
echo "等待服务初始化..."
sleep 15

# 检查服务状态
if docker-compose ps | grep -q "Up"; then
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



