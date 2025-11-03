# 短剧测试数据生成工具

独立运行版本，可复制到任何电脑上使用。

## 工具列表

### 1. 用户和评论生成器 (`generate.js`)
生成测试用户并自动发表评论

### 2. 头像更新工具 (`update-avatars.js`)
批量为用户更新随机头像

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 生成测试用户和评论

#### 修改配置
打开 `generate.js`，修改开头的配置：

```javascript
// API配置
const API_CONFIG = {
  BASE_URL: 'http://localhost:8080/api',  // 修改为你的API地址
  CONCURRENT_REQUESTS: 5,
  REQUEST_DELAY: 100,
};

// 生成配置
const CONFIG = {
  USER_COUNT: 100,               // 生成用户数量
  AVG_COMMENTS_PER_USER: 5,      // 每用户平均评论数
  MIN_COMMENTS_PER_EPISODE: 3,   // 每个剧集最少评论数
};
```

#### 运行
```bash
npm start
```

或直接运行：
```bash
node generate.js
```

运行后会自动生成 `generated-users.json` 文件保存用户信息。

### 3. 批量更新用户头像

#### 配置头像URL
打开 `update-avatars.js`，修改 `AVATAR_URLS` 数组：

```javascript
const AVATAR_URLS = [
  'https://your-cdn.com/avatar1.jpg',
  'https://your-cdn.com/avatar2.jpg',
  'https://your-cdn.com/avatar3.jpg',
  // 添加更多头像URL...
];
```

#### 运行
```bash
node update-avatars.js
```

脚本会提供两种模式：
1. **更新所有用户头像** - 为所有生成的用户更新头像
2. **随机更新指定数量** - 随机选择N个用户更新头像

## 命令行参数

### generate.js 参数

```bash
# 生成50个用户，每用户10条评论
node generate.js --users 50 --comments 10

# 自定义API地址
node generate.js --api-url http://192.168.1.100:8080/api

# 自定义并发数
node generate.js --concurrent 10

# 查看所有参数
node generate.js --help
```

### update-avatars.js 参数

```bash
# 自定义API地址
node update-avatars.js --api-url http://192.168.1.100:8080/api

# 自定义并发数
node update-avatars.js --concurrent 10

# 查看帮助
node update-avatars.js --help
```

## 常用命令

```bash
# 安装依赖
npm install

# 生成用户和评论（默认配置）
npm start
# 或
node generate.js

# 更新用户头像
node update-avatars.js

# 查看帮助
node generate.js --help
node update-avatars.js --help
```

## 使用流程

1. **首次使用**：运行 `generate.js` 生成用户和评论数据
2. **更新头像**：运行 `update-avatars.js` 为用户批量更新头像
3. **重复使用**：可以多次运行 `update-avatars.js` 来随机更换头像

## 复制到其他电脑

1. 整个文件夹打包：
```bash
zip -r test-data-generator.zip test-data-generator
```

2. 复制到目标电脑

3. 在目标电脑上：
```bash
unzip test-data-generator.zip
cd test-data-generator
npm install
node generate.js
```

## 环境要求

- Node.js >= 16.0.0
- 能访问目标API和数据库

## 重要说明

### 用户账号
- 生成的所有用户密码统一为：`123456`
- 用户数据保存在 `generated-users.json` 文件中
- 请妥善保管此文件，更新头像时需要使用

### 数据生成
- 只针对已发布的剧集生成评论
- 确保每个剧集至少有配置的最小评论数
- 额外评论随机分配到各个剧集

### API要求
- 请确保API服务正在运行
- 请确保数据库中有已发布的剧集数据
- 默认使用纯API方式，不需要直接连接数据库

### 头像配置
- 头像URL在 `update-avatars.js` 的 `AVATAR_URLS` 数组中配置
- 默认使用 UI Avatars API 生成的头像
- 可以替换为你自己的CDN头像链接
- 每次更新都会从配置的头像中随机选择

## 文件说明

- `generate.js` - 用户和评论生成器主程序
- `update-avatars.js` - 头像批量更新工具
- `package.json` - 依赖配置
- `generated-users.json` - 自动生成的用户数据文件（运行后生成）
- `README.md` - 使用说明文档

