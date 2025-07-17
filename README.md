# 冰箱管家 - 群晖NAS部署指南

## 目录
1. [准备工作](#准备工作)
2. [群晖MariaDB配置](#群晖mariadb配置)
3. [数据迁移（从SQLite到MariaDB）](#数据迁移从sqlite到mariadb)
4. [Docker部署](#docker部署)
5. [故障排除](#故障排除)

## 准备工作

### 环境要求
- 群晖NAS（DSM 6.2及以上版本）
- 已安装MariaDB 10.3.32套件
- 已安装Docker套件
- 网络连接正常

### 必要准备
1. 确保群晖NAS已启用SSH服务
   - 控制面板 > 终端机和SNMP > 启用SSH功能
2. 确保MariaDB已安装并运行
   - 套件中心 > 已安装 > MariaDB 10 > 启动
3. 准备一个SSH客户端（如PuTTY、Terminal等）

## 群晖MariaDB配置

### 1. 登录MariaDB管理界面
1. 打开群晖DSM界面
2. 启动MariaDB 10套件
3. 打开phpMyAdmin（可通过套件中心安装）

### 2. 创建数据库和用户
1. 登录phpMyAdmin（默认用户名：root，密码：安装MariaDB时设置的密码）
2. 创建数据库：
   - 点击左侧"数据库"
   - 数据库名称：`fridge_manager`
   - 排序规则：`utf8mb4_general_ci`
   - 点击"创建"
3. 创建用户并授权：
   - 点击"用户账户" > "添加用户账户"
   - 用户名：`fridge_user`
   - 主机名：`%`（允许所有主机访问）
   - 密码：设置一个安全密码（例如：`fridge_password`）
   - 全局权限：勾选"所有权限"
   - 点击"执行"

### 3. 配置MariaDB远程访问（如需要）
1. 打开群晖控制面板 > 防火墙 > 防火墙规则
2. 添加规则允许端口3306的TCP连接
3. 注意：如果仅在NAS内部访问，可跳过此步骤

## 数据迁移（从SQLite到MariaDB）

### 1. 获取SQLite数据库文件
如果您之前使用SQLite版本，需要获取`fridge.db`文件：
```bash
# 通过SSH连接到群晖NAS后执行
cd /path/to/your/fridge-manager/src/api
cp fridge.db /tmp/  # 备份数据库文件
```

### 2. 执行数据迁移
```bash
# 克隆仓库
git clone https://github.com/sjyb/fridge-manager.git
cd fridge-manager

# 运行迁移脚本
php db/migrate.php \
  --sqlite /path/to/your/fridge.db \
  --mysql-host localhost \
  --mysql-port 3306 \
  --mysql-db fridge_manager \
  --mysql-user fridge_user \
  --mysql-pass your_password
```

## Docker部署

### 1. 通过SSH连接到群晖NAS
```bash
ssh your_username@your_nas_ip
```

### 2. 克隆代码仓库
```bash
cd /volume1/docker  # 或您喜欢的目录
git clone https://github.com/sjyb/fridge-manager.git
cd fridge-manager
```

### 3. 执行部署脚本
```bash
chmod +x deploy.sh
./deploy.sh --plain-docker
```

### 4. 按照提示输入数据库信息
```
请输入群晖本地数据库信息:
数据库主机(默认: localhost): localhost
数据库端口(默认: 3306): 3306
数据库名称(默认: fridge_manager): fridge_manager
数据库用户名: fridge_user
数据库密码: your_password
```

### 5. 访问应用
部署完成后，通过以下地址访问冰箱管家：
```
http://your_nas_ip:3000
```

## 故障排除

### 常见问题及解决方法

#### 1. 数据库连接失败
- **症状**：应用无法启动，日志显示数据库连接错误
- **解决方法**：
  - 检查MariaDB是否正在运行
  - 验证数据库用户名和密码是否正确
  - 确认数据库主机和端口是否可访问
  - 检查防火墙设置是否阻止了连接

#### 2. 数据迁移失败
- **症状**：迁移脚本报错，数据未完全迁移
- **解决方法**：
  - 确保SQLite文件路径正确且有读取权限
  - 确认MariaDB用户有足够权限创建表和插入数据
  - 检查数据库字符集是否为utf8mb4

#### 3. Docker容器无法启动
- **症状**：执行deploy.sh后容器未运行
- **解决方法**：
  - 查看容器日志：`docker logs fridge-app`
  - 检查端口3000是否已被占用
  - 确认环境变量是否正确设置

#### 4. 网页无法访问
- **症状**：浏览器访问http://your_nas_ip:3000无响应
- **解决方法**：
  - 检查容器是否正在运行：`docker ps | grep fridge-app`
  - 检查群晖防火墙是否允许端口3000访问
  - 查看应用日志：`docker logs fridge-app`

### 获取帮助
如果遇到其他问题，请提交issue到GitHub仓库或联系技术支持。