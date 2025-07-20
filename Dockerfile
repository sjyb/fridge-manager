# 使用官方Node.js镜像作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install

# 复制项目文件
COPY . .

# 构建前端应用
RUN npm run build

# 暴露端口
EXPOSE 3000

# 启动Node.js服务器
CMD ["node", "server.js"]
