# syntax=docker/dockerfile:1

# ============================================
# Stage 1: Builder - 构建阶段
# ============================================
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 安装构建依赖（如果需要编译原生模块）
RUN apk add --no-cache python3 make g++

# 复制依赖文件
COPY package*.json ./

# 安装所有依赖（包括开发依赖）
RUN npm ci --legacy-peer-deps

# 复制源代码
COPY tsconfig*.json ./
COPY nest-cli.json ./
COPY src ./src

# 编译 TypeScript
RUN npm run build

# 删除开发依赖，只保留生产依赖
RUN npm prune --omit=dev


# ============================================
# Stage 2: Runner - 运行阶段
# ============================================
FROM node:20-alpine AS runner

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production

# 安装运行时依赖（curl用于健康检查）
RUN apk add --no-cache curl

# 创建非root用户（安全性）
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# 从builder阶段复制编译产物和生产依赖
COPY --from=builder --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --chown=nodejs:nodejs package*.json ./

# 切换到非root用户
USER nodejs

# 暴露端口（客户端8080，管理端9090）
EXPOSE 8080 9090

# 健康检查（根据PORT环境变量动态检查）
# 注意：健康检查会在docker-compose中根据具体服务配置
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:${PORT:-8080}/health || exit 1

# 默认启动命令（可被docker-compose覆盖）
# 注意：docker-compose.yml 中会覆盖此命令
CMD ["node", "dist/src/main.client.js"]


