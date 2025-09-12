# 使用官方Node.js运行时作为基础镜像
FROM node:18-alpine

# 设置工作目录
WORKDIR /app

# 复制package.json和package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 复制应用源代码
COPY . .

# 创建必要的目录
RUN mkdir -p data logs temp

# 设置权限
RUN chmod -R 755 data logs temp

# 暴露端口（如果需要健康检查或监控）
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 创建非root用户
RUN addgroup -g 1001 -S nodejs
RUN adduser -S telechat -u 1001

# 更改文件所有权
RUN chown -R telechat:nodejs /app
USER telechat

# 启动应用
CMD ["node", "index.js"]