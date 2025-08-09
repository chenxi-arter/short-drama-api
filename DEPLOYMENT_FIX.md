# 部署问题修复指南

## 问题描述

部署后应用频繁重启并最终停止，PM2 日志显示错误：
```
Error: Cannot find module '/home/deploy/workspace/short-drama-api/dist/main.js'
```

## 问题原因

1. **构建文件路径不匹配**：PM2 配置文件中指定的入口文件路径 `dist/main.js` 与实际构建后的文件路径 `dist/src/main.js` 不匹配
2. **构建过程可能失败**：部署脚本中的构建步骤可能没有正确执行

## 解决方案

### 1. 修复 PM2 配置文件

已修复 `ecosystem.config.js` 中的入口文件路径：

```javascript
// 修改前
script: 'dist/main.js',

// 修改后
script: 'dist/src/main.js',
```

### 2. 确保构建过程正确执行

在服务器上执行以下步骤：

```bash
# 1. 进入项目目录
cd /home/deploy/workspace/short-drama-api

# 2. 安装依赖
npm install

# 3. 构建项目
npm run build

# 4. 验证构建结果
ls -la dist/src/main.js

# 5. 重启 PM2 应用
pm2 restart ecosystem.config.js
```

### 3. 部署脚本优化建议

在 `deploy.sh` 中确保构建步骤的错误处理：

```bash
# 构建项目
build_project() {
    print_info "Building project..."
    if npm run build; then
        print_success "Project built successfully"
        # 验证构建结果
        if [ ! -f "dist/src/main.js" ]; then
            print_error "Build failed: main.js not found in dist/src/"
            exit 1
        fi
    else
        print_error "Build failed"
        exit 1
    fi
}
```

### 4. 验证修复

执行以下命令验证应用是否正常运行：

```bash
# 查看 PM2 状态
pm2 status

# 查看应用日志
pm2 logs short-drama-api

# 测试 API 接口
curl http://localhost:3001/api/test
```

## 预防措施

1. **构建验证**：在部署脚本中添加构建结果验证
2. **路径检查**：确保 PM2 配置文件中的路径与实际构建输出路径一致
3. **日志监控**：定期检查 PM2 日志，及时发现问题
4. **环境一致性**：确保本地开发环境与生产环境的构建配置一致

## 常见问题

### Q: 为什么构建后的文件在 dist/src/ 目录下？
A: 这是 NestJS 默认的构建行为，它会保持源代码的目录结构。

### Q: 可以修改构建输出路径吗？
A: 可以通过修改 `nest-cli.json` 或 `tsconfig.build.json` 来调整输出路径，但建议保持默认配置并相应调整 PM2 配置。

### Q: 如何避免类似问题？
A: 建议在本地环境测试完整的构建和启动流程，确保配置文件的正确性。