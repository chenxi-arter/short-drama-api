# 🐛 调试配置文档

## 📋 概述

本项目集成了基于环境变量的调试日志系统，允许开发者在不同环境中灵活控制调试输出的详细程度。
默认情况下仅输出错误日志（非关键信息默认不打印）。

## 🔧 环境变量配置

在你的 `.env` 文件中添加以下配置（默认关闭非关键调试输出）：

```bash
# =====================================================
# 调试配置
# =====================================================

# 主调试开关 - 控制除错误外的所有调试输出
DEBUG_ENABLED=false

# 缓存调试 - 显示缓存命中/未命中信息
DEBUG_CACHE=false

# 数据库调试 - 显示数据库查询信息
DEBUG_DATABASE=false

# 服务层调试 - 显示服务方法调用信息
DEBUG_SERVICE=false
```

## 🎛️ 调试级别

### 1. 主调试开关 (`DEBUG_ENABLED`)
- **用途**: 控制所有调试输出的总开关
- **默认值**: `false`
- **推荐设置**:
  - 开发环境: `true`
  - 生产环境: `false`

### 2. 缓存调试 (`DEBUG_CACHE`)
- **用途**: 显示Redis缓存的操作日志
- **默认值**: `false`
- **输出示例**:
  ```
  [CACHE 2025-09-16T07:30:45.123Z] 首页视频缓存命中 | Key: home_videos_1_1
  [CACHE 2025-09-16T07:30:45.124Z] 系列列表已缓存 | Key: series_list_1_1_20
  ```

### 3. 数据库调试 (`DEBUG_DATABASE`)
- **用途**: 显示数据库查询和操作日志
- **默认值**: `false`
- **注意**: 生产环境建议关闭，避免敏感信息泄露

### 4. 服务层调试 (`DEBUG_SERVICE`)
- **用途**: 显示服务方法的调用信息
- **默认值**: `false`
- **输出示例**:
  ```
  [SERVICE 2025-09-16T07:30:45.123Z] HomeService.getHomeVideos: 开始处理请求
  [SERVICE 2025-09-16T07:30:45.124Z] MediaService.listMedia: 查询参数 {categoryId: 1, page: 1}
  ```

## 📊 调试输出格式

### 通用日志格式
```
[TYPE TIMESTAMP] MESSAGE [DATA]
```

### 错误日志格式
```
[ERROR TIMESTAMP] MESSAGE
[ERROR STACK] Error Stack Trace
```
注：错误日志不受 `DEBUG_*` 变量影响，始终输出。

### 性能监控格式
```
[PERF TIMESTAMP] OPERATION: 123ms
```

## 🛠️ 使用方法

### 在服务中使用

```typescript
import { DebugUtil } from '../../common/utils/debug.util';

export class ExampleService {
  async someMethod() {
    // 通用调试日志
    DebugUtil.log('执行某个操作', { param1: 'value1' });

    // 缓存相关日志
    DebugUtil.cache('缓存命中', 'cache_key_123');

    // 数据库相关日志
    DebugUtil.database('执行查询', 'SELECT * FROM users');

    // 服务层日志
    DebugUtil.service('ExampleService', 'someMethod', '开始处理', { data: 'test' });

    // 错误日志
    try {
      // 一些操作
    } catch (error) {
      DebugUtil.error('操作失败', error as Error);
    }

    // 性能监控
    const startTime = Date.now();
    // 执行一些耗时操作
    DebugUtil.performance('某个操作', startTime);
  }
}
```

## 🌍 环境配置建议

未显式配置时，默认关闭非关键信息（仅错误日志输出）。下面为不同环境的建议配置：

### 开发环境
```bash
DEBUG_ENABLED=true
DEBUG_CACHE=true
DEBUG_DATABASE=true
DEBUG_SERVICE=true
```

### 测试环境
```bash
DEBUG_ENABLED=true
DEBUG_CACHE=true
DEBUG_DATABASE=false
DEBUG_SERVICE=false
```

### 生产环境
```bash
DEBUG_ENABLED=false
DEBUG_CACHE=false
DEBUG_DATABASE=false
DEBUG_SERVICE=false
```

### 问题排查环境
```bash
DEBUG_ENABLED=true
DEBUG_CACHE=true     # 仅在排查缓存问题时开启
DEBUG_DATABASE=true  # 仅在排查数据库问题时开启
DEBUG_SERVICE=true   # 仅在排查业务逻辑问题时开启
```

## 🔍 故障排查

### 1. 缓存问题
```bash
DEBUG_ENABLED=true
DEBUG_CACHE=true
DEBUG_DATABASE=false
DEBUG_SERVICE=false
```

### 2. 数据库性能问题
```bash
DEBUG_ENABLED=true
DEBUG_CACHE=false
DEBUG_DATABASE=true
DEBUG_SERVICE=false
```

### 3. 业务逻辑问题
```bash
DEBUG_ENABLED=true
DEBUG_CACHE=false
DEBUG_DATABASE=false
DEBUG_SERVICE=true
```

## 📈 性能影响

- **DEBUG_ENABLED=false**: 几乎无性能影响（默认）
- **DEBUG_ENABLED=true**: 轻微性能影响（主要是I/O操作）
- **生产环境**: 强烈建议关闭所有调试选项

## 🔒 安全考虑

1. **生产环境**: 务必关闭 `DEBUG_DATABASE`，避免SQL查询泄露
2. **敏感数据**: 避免在调试日志中输出密码、密钥等敏感信息
3. **日志轮转**: 配置合适的日志轮转策略，避免磁盘空间耗尽

## 📝 获取调试配置

可以通过以下方式检查当前调试配置：

```typescript
const config = DebugUtil.getConfig();
console.log('调试配置:', config);
// 输出: { enabled: true, cache: true, database: false, service: true }
```
