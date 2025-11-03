# 短剧测试数据生成工具

独立运行版本，可复制到任何电脑上使用。

## 工具列表

### 1. 用户和评论生成器 (`generate.js`)
生成测试用户并自动发表评论

### 2. 头像更新工具 (`update-avatars.js`)
批量为用户更新随机头像

## 快速开始

### 1. 安装依赖

**重要：必须先安装依赖才能运行！**

```bash
npm install
```

这将安装必需的依赖包：
- `node-fetch` - HTTP请求库
- `bcrypt` - 密码加密
- `mysql2` - 数据库连接（可选）

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
  USER_COUNT: 100,                // 生成用户数量
  AVG_COMMENTS_PER_USER: 5,       // 每用户平均评论数
  MIN_COMMENTS_PER_EPISODE: 3,    // 每个剧集最少评论数
  DISTRIBUTE_EVENLY: false,       // 是否均匀分配（true=平均分配，false=保证最小值后随机）
  USER_PASSWORD: 'test123456',    // 统一密码
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

## 评论分配策略详解

脚本支持两种评论分配策略，通过 `CONFIG.DISTRIBUTE_EVENLY` 配置：

### 策略1：保证最小值后随机分配（默认）
```javascript
DISTRIBUTE_EVENLY: false  // 默认策略
```

**工作原理：**
1. **阶段1**：确保每个剧集至少有 `MIN_COMMENTS_PER_EPISODE` 条评论
2. **阶段2**：剩余评论随机分配到所有剧集

**适用场景：**
- 希望某些热门剧集获得更多评论
- 模拟真实的评论分布（有的剧集评论多，有的少）

**示例：**
- 100用户 × 5评论/用户 = 500条评论
- 200个剧集 × 3条最小评论 = 600条基础评论
- 如果评论预算不足，会给出警告

### 策略2：均匀分配
```javascript
DISTRIBUTE_EVENLY: true  // 均匀分配
```

**工作原理：**
1. 计算每个剧集应得评论数：总评论数 ÷ 剧集数
2. 为每个剧集分配相同数量的评论
3. 余数随机分配

**适用场景：**
- 希望所有剧集获得相同数量的评论
- 测试时需要数据分布均匀

**示例：**
- 100用户 × 5评论/用户 = 500条评论
- 200个剧集
- 每个剧集获得：500 ÷ 200 = 2条评论（余数随机分配）

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
- 生成的所有用户密码统一为：`test123456`
  - 密码必须包含至少一个字母和一个数字（API验证要求）
  - 长度6-20位
- 用户名格式：3-20个字符，只包含字母、数字和下划线
- 用户数据保存在 `generated-users.json` 文件中
- 请妥善保管此文件，更新头像时需要使用

### 用户复用功能
- **智能检测**：脚本会自动检测是否已存在用户数据
- **灵活选择**：
  - 如果已有用户数量充足 → 可选择直接使用或重新生成
  - 如果已有用户数量不足 → 可选择补充生成或重新生成全部
- **节省时间**：避免重复注册用户，直接使用已有账号发表评论

### 数据生成
- 只针对已发布的剧集生成评论
- 支持两种分配策略：
  - **保证最小值后随机** (`DISTRIBUTE_EVENLY: false`)
    - 确保每个剧集至少有配置的最小评论数
    - 额外评论随机分配到各个剧集
  - **均匀分配** (`DISTRIBUTE_EVENLY: true`)
    - 将所有评论平均分配给每个剧集
    - 确保每个剧集获得的评论数量基本相同

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

## 故障排除

### 1. 错误：`fetch failed` 或 `fetch is not defined`

**原因：** 缺少 node-fetch 依赖包

**解决方法：**
```bash
# 确保在正确的目录中
cd test-data-generator

# 安装依赖
npm install
```

### 2. 错误：`获取剧集列表请求失败`

**可能原因：**
- API 服务未运行或地址错误
- 网络连接问题
- API 路径不正确

**解决方法：**
1. 检查 API 地址是否正确（在浏览器中访问测试）
2. 确保 API 服务正在运行
3. 尝试修改 `generate.js` 中的 `API_CONFIG.BASE_URL`

### 3. 错误：`找到 0 个剧集`

**原因：** 数据库中没有已发布的剧集

**解决方法：**
1. 登录后台管理系统
2. 确保至少有一部短剧已发布
3. 检查剧集的 `status` 字段是否为已发布状态

### 4. 错误：`未找到用户数据文件`（运行 update-avatars.js 时）

**原因：** 还未运行过 `generate.js`

**解决方法：**
```bash
# 先运行生成脚本
node generate.js

# 再运行头像更新脚本
node update-avatars.js
```

### 5. 错误：`参数验证失败`

**原因：** 注册数据不符合API验证规则

**常见问题：**
- 密码必须包含至少一个字母和一个数字（脚本已使用 `test123456`）
- 用户名只能包含字母、数字和下划线，长度3-20位
- 邮箱格式不正确

**解决方法：**
1. 确保使用最新版本的脚本（已修复密码和用户名生成问题）
2. 查看控制台的详细错误信息
3. 确认API服务版本是否匹配

### 6. 注册或登录失败

**可能原因：**
- 邮箱已被注册
- API 认证问题
- 网络连接问题

**解决方法：**
1. 检查 API 返回的错误信息
2. 可以尝试减少用户数量重新生成
3. 查看 API 服务的日志
4. 清空数据库中的测试用户后重试

## 技术支持

如果遇到其他问题：
1. 查看控制台的详细错误信息
2. 检查 API 服务的日志
3. 确认 Node.js 版本 >= 16.0.0

