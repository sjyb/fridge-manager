# 冰箱管家应用 - 群晖Node.js部署指南

## 项目简介
冰箱管家是一款智能管理冰箱食物的应用，帮助用户追踪食物保质期、管理库存并提供膳食建议。本指南将详细介绍如何在群晖NAS上使用Node.js和Docker部署该应用。

## 前提条件

### 硬件要求
- 群晖NAS设备（推荐至少2GB内存）
- 至少1GB可用存储空间

### 软件要求
1. 群晖DSM 6.2或更高版本
2. 已安装以下套件：
   - Docker（从群晖套件中心安装）
   - MariaDB 10（从群晖套件中心安装）
   - Git（可选，从群晖套件中心安装）

### 网络要求
- 群晖NAS已连接到本地网络
- 能够通过浏览器访问群晖管理界面

## 安装步骤

### 1. 准备数据库

#### 1.1 安装MariaDB
1. 打开群晖套件中心
2. 搜索"MariaDB 10"并安装
3. 安装完成后，启动MariaDB服务

#### 1.2 创建数据库和用户
1. 打开群晖"Web Station"套件
2. 启动phpMyAdmin（或通过其他MySQL管理工具连接）
3. 使用root账户登录（默认密码在MariaDB安装时设置）
4. 创建新数据库：
   - 数据库名称：`fridge_manager`
   - 字符集：`utf8mb4`
   - 排序规则：`utf8mb4_unicode_ci`
5. 创建专用数据库用户：
   - 用户名：`fridge_user`
   - 密码：`fridge_password`（建议使用更安全的密码）
   - 权限：授予对`fridge_manager`数据库的所有权限

### 2. 获取项目代码

#### 方法1：使用Git（推荐）
1. 打开群晖"终端机"套件或通过SSH连接到群晖
2. 导航到要存放项目的目录：
   ```bash
   cd /volume1/docker/
   ```
3. 克隆代码仓库：
   ```bash
   git clone https://github.com/sjyb/fridge-manager.git
   cd fridge-manager
   ```

#### 方法2：手动上传
1. 从GitHub下载项目ZIP文件
2. 通过群晖File Station将ZIP文件上传到`/volume1/docker/`目录
3. 解压缩文件，重命名文件夹为`fridge-manager`

### 3. 配置环境变量

1. 在项目根目录创建`.env`文件：
   ```bash
   cd /volume1/docker/fridge-manager
   touch .env
   ```

2. 使用文本编辑器编辑`.env`文件，添加以下内容：
   ```
   # 数据库配置
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=fridge_manager
   DB_USER=fridge_user
   DB_PASSWORD=fridge_password  # 替换为你设置的密码
   
   # 应用配置
   PORT=3000
   NODE_ENV=production
   ```

### 4. 构建和启动应用

#### 方法1：使用部署脚本（推荐）
1. 确保部署脚本有执行权限：
   ```bash
   chmod +x deploy.sh
   ```

2. 运行部署脚本：
   ```bash
   ./deploy.sh
   ```

3. 按照提示输入数据库信息（如果未创建.env文件）

#### 方法2：手动构建和运行
1. 构建Docker镜像：
   ```bash
   docker build -t fridge-manager-node .
   ```

2. 启动容器：
   ```bash
   docker run -d \
     --name fridge-manager \
     --network=host \
     -e DB_HOST=localhost \
     -e DB_PORT=3306 \
     -e DB_NAME=fridge_manager \
     -e DB_USER=fridge_user \
     -e DB_PASSWORD=fridge_password \
     -p 3000:3000 \
     --restart unless-stopped \
     fridge-manager-node
   ```

### 5. 初始化数据库

1. 应用首次启动时会自动创建所需表结构
2. 如果需要导入示例数据，可以执行：
   ```bash
   docker exec -it fridge-manager node scripts/import-sample-data.js
   ```

### 6. 访问应用

1. 打开浏览器，访问以下地址：
   ```
   http://群晖IP:3000
   ```
2. 将"群晖IP"替换为你的群晖NAS的实际IP地址

## 配置说明

### 数据库迁移

如果从SQLite迁移数据到MariaDB：

1. 确保应用已停止：
   ```bash
   docker stop fridge-manager
   ```

2. 运行迁移脚本：
   ```bash
   docker run --rm \
     -v $(pwd)/db:/sql \
     -v $(pwd)/src/api:/data \
     php:7.4-cli \
     php /sql/migrate.php --sqlite=/data/fridge.db --mysql-host=localhost --mysql-port=3306 --mysql-db=fridge_manager --mysql-user=fridge_user --mysql-pass=fridge_password
   ```

3. 重新启动应用：
   ```bash
   docker start fridge-manager
   ```

### 自定义端口

如果需要使用不同端口（例如8080）：

1. 修改.env文件：
   ```
   PORT=8080
   ```

2. 重新构建并启动容器，确保端口映射正确：
   ```bash
   docker run -d \
     --name fridge-manager \
     -p 8080:8080 \
     # 其他参数保持不变
   ```

## 故障排除

### 常见问题

#### 1. "加载食物数据失败"错误

这通常是数据库连接问题：

- **检查数据库服务**：确保MariaDB服务正在运行
  ```bash
  # 检查MariaDB状态
  synoservice --status pkgctl-MariaDB10
  ```

- **验证数据库连接**：
  ```bash
  # 测试数据库连接
  docker run --rm mariadb:10.3.32 mysql -h localhost -P 3306 -u fridge_user -pfridge_password fridge_manager -e "SELECT 1"
  ```

- **检查数据库初始化**：
  ```bash
  # 查看数据库表是否已创建
  docker run --rm mariadb:10.3.32 mysql -h localhost -P 3306 -u fridge_user -pfridge_password fridge_manager -e "SHOW TABLES"
  ```

#### 2. 应用无法启动

- **查看容器日志**：
  ```bash
  docker logs fridge-manager
  ```

- **检查端口占用**：
  ```bash
  # 查看端口3000是否被占用
  netstat -tulpn | grep 3000
  ```

#### 3. Docker构建失败

- **检查网络连接**：确保群晖可以访问npm仓库
- **清理Docker缓存**：
  ```bash
  docker system prune -a
  ```

### 高级故障排除

如果遇到复杂问题，可以：

1. 检查应用日志：
   ```bash
   docker exec -it fridge-manager tail -f /app/logs/app.log
   ```

2. 进入容器调试：
   ```bash
   docker exec -it fridge-manager /bin/sh
   ```

3. 检查数据库日志：群晖DSM > MariaDB > 日志

## 更新应用

1. 进入项目目录：
   ```bash
   cd /volume1/docker/fridge-manager
   ```

2. 拉取最新代码：
   ```bash
   git pull
   ```

3. 重新构建并启动：
   ```bash
   ./deploy.sh
   ```

## 备份与恢复

### 数据库备份

1. 创建备份脚本：
   ```bash
   # 创建备份目录
   mkdir -p /volume1/backup/fridge-manager
   
   # 备份数据库
   docker run --rm \
     -v /volume1/backup/fridge-manager:/backup \
     mariadb:10.3.32 \
     mysqldump -h localhost -P 3306 -u fridge_user -pfridge_password fridge_manager > /backup/fridge_backup_$(date +%Y%m%d).sql
   ```

2. 设置定时任务：在群晖"任务计划"中添加定期执行的备份任务

### 恢复备份

```bash
# 恢复数据库
cat /volume1/backup/fridge-manager/fridge_backup_20250101.sql | docker run --rm -i \
  mariadb:10.3.32 \
  mysql -h localhost -P 3306 -u fridge_user -pfridge_password fridge_manager
```

## 安全建议

1. **更改默认密码**：不要使用示例中的默认密码
2. **限制访问**：通过群晖防火墙限制仅本地网络访问
3. **定期更新**：保持应用和群晖系统最新
4. **备份数据**：定期备份数据库以防数据丢失
5. **使用HTTPS**：通过群晖反向代理设置HTTPS访问

## 功能说明

### 主要功能

- **食物管理**：添加、编辑和删除冰箱中的食物
- **保质期管理**：跟踪食物保质期，接收过期提醒
- **分类统计**：查看不同类别食物的分布和消耗情况
- **膳食推荐**：根据季节和现有食材提供膳食建议
- **数据可视化**：通过图表直观展示食物消耗趋势

### 使用界面

1. **冰箱视图**：直观展示不同区域的食物分布
2. **食物管理**：添加和编辑食物信息
3. **保质期提醒**：查看即将过期的食物
4. **统计分析**：查看食物消费和浪费情况
5. **系统设置**：配置冰箱区域和其他参数

## 常见问题解答

**Q: 如何修改冰箱区域配置？**  
A: 在应用设置页面，选择"冰箱设置"，可以配置不同的功能区域组合。

**Q: 如何更新应用到最新版本？**  
A: 运行`git pull`拉取最新代码，然后重新执行部署脚本。

**Q: 应用支持多用户吗？**  
A: 当前版本为单用户设计，多用户功能计划在未来版本中添加。

**Q: 数据存储在哪里？**  
A: 所有数据存储在群晖MariaDB数据库中，确保数据安全。

## 技术支持

如果遇到本文档未涵盖的问题，请通过以下方式寻求支持：

- GitHub Issues: https://github.com/sjyb/fridge-manager/issues
- 电子邮件: support@fridgemanager.example.com

---

© 2025 冰箱管家应用 | 版本 1.0.0