# 智能冰箱管理系统

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

一个基于React和PHP的智能冰箱管理系统，支持食物管理、保质期提醒和统计分析功能。

## 功能特性

- 🥗 食物分类管理
- ⏳ 保质期提醒
- 📊 消耗统计分析
- 🧊 多温区管理(冷藏/冷冻/解冻)
- 📱 移动端适配

## 部署指南

### 1. Docker本地部署

#### 前提条件
- Docker Desktop已安装
- docker-compose已安装

#### 部署步骤
```bash
# 克隆仓库
git clone https://github.com/sjyb/fridge-manager.git
cd fridge-manager

# 启动服务
docker-compose up -d --build

# 访问应用
http://localhost:3000
```

### 2. OrbStack(Mac)部署

#### 前提条件
- OrbStack已安装并运行
- Docker CLI已配置

#### 部署步骤
```bash
# 克隆仓库
git clone https://github.com/sjyb/fridge-manager.git
cd fridge-manager

# 启用OrbStack网络支持
sed -i '' 's/# networks:/networks:/g' docker-compose.yml

# 启动服务
docker-compose up -d --build

# 访问应用
http://localhost:3000
```

### 3. 云服务器部署

#### 前提条件
- Linux服务器(Ubuntu 20.04+)
- Docker和docker-compose已安装

#### 部署步骤
```bash
# 安装依赖
sudo apt update && sudo apt install -y docker.io docker-compose

# 克隆仓库
git clone https://github.com/sjyb/fridge-manager.git
cd fridge-manager

# 优化云服务器配置
sed -i 's/ports:.*3306.*/# ports: 3306/g' docker-compose.yml

# 启动服务
docker-compose up -d --build

# 配置防火墙(如果需要)
sudo ufw allow 3000

# 访问应用
http://<服务器IP>:3000
```

## 开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build
```

## 技术栈

- 前端: React 18, TypeScript, Tailwind CSS
- 后端: PHP 8.1
- 数据库: MariaDB
- 容器: Docker

## 许可证

MIT License
