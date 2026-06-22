# score 字段兼容性说明

## 📋 背景

采集接口原本使用 `score` 字段表示系列评分，现在改为使用 `seriesScore` 字段以更明确表达含义。为了保证向后兼容，两个字段都支持。

---

## ✅ 兼容性方案

### 支持的字段

1. **seriesScore** (推荐) - 新字段名，语义更清晰
2. **score** (兼容) - 旧字段名，保持向后兼容

### 优先级规则

```typescript
// 优先使用 seriesScore，如果没有则使用 score
const finalScore = payload.seriesScore ?? payload.score ?? 0;
```

**示例**：
- 只传 `seriesScore: 8.5` → 保存为 8.5 ✅
- 只传 `score: 7.8` → 保存为 7.8 ✅
- 同时传 `seriesScore: 9.2` 和 `score: 6.5` → 保存为 9.2 ✅

---

## 📝 API 使用示例

### 推荐方式（使用 seriesScore）

```json
{
  "externalId": "series-001",
  "title": "示例系列",
  "description": "简介",
  "coverUrl": "https://cdn.example.com/cover.jpg",
  "categoryId": 1,
  "isCompleted": false,
  "releaseDate": "2024-08-01T12:00:00Z",
  "seriesScore": 8.5,
  "regionOptionName": "中国",
  "languageOptionName": "中文",
  "statusOptionName": "连载中",
  "yearOptionName": "2024",
  "episodes": [...]
}
```

### 兼容方式（使用 score）

```json
{
  "externalId": "series-002",
  "title": "示例系列",
  "description": "简介",
  "coverUrl": "https://cdn.example.com/cover.jpg",
  "categoryId": 1,
  "isCompleted": false,
  "releaseDate": "2024-08-01T12:00:00Z",
  "score": 7.8,
  "regionOptionName": "中国",
  "languageOptionName": "中文",
  "statusOptionName": "连载中",
  "yearOptionName": "2024",
  "episodes": [...]
}
```

---

## 🔧 实现细节

### 修改的文件

1. **DTO 定义**
   - `/src/video/dto/ingest-series.dto.ts`
   - `/src/video/dto/update-ingest-series.dto.ts`
   - 添加了 `seriesScore` 字段
   - 保留了 `score` 字段用于兼容

2. **Service 层**
   - `/src/video/services/ingest.service.ts`
   - 创建系列时：`score: payload.seriesScore ?? payload.score ?? 0`
   - 更新系列时：优先使用 `seriesScore`，兼容 `score`

3. **文档**
   - `/docs/ingest-api.md`
   - 更新了字段说明和示例

### 代码示例

```typescript
// IngestSeriesDto
export class IngestSeriesDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  seriesScore?: number; // 推荐使用

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(10)
  score?: number; // 兼容旧字段
}

// IngestService
const finalScore = payload.seriesScore ?? payload.score ?? 0;
series.score = finalScore;
```

---

## 🧪 测试

### 运行测试脚本

```bash
./test-score-compatibility.sh
```

### 测试场景

1. ✅ 只传 `seriesScore` - 应正常保存
2. ✅ 只传 `score` - 应正常保存（兼容）
3. ✅ 同时传两个字段 - 应优先使用 `seriesScore`

---

## 📊 迁移建议

### 对于新接入方

- ✅ 直接使用 `seriesScore` 字段
- ✅ 语义更清晰，推荐使用

### 对于已接入方

- ✅ 可以继续使用 `score` 字段，无需修改
- 📝 建议逐步迁移到 `seriesScore`
- 🔄 迁移时可以同时传两个字段，确保平滑过渡

### 迁移步骤

1. **阶段1**：同时传入两个字段
   ```json
   {
     "seriesScore": 8.5,
     "score": 8.5
   }
   ```

2. **阶段2**：验证数据正确性

3. **阶段3**：移除 `score` 字段，只使用 `seriesScore`
   ```json
   {
     "seriesScore": 8.5
   }
   ```

---

## ⚠️ 注意事项

1. **字段验证**
   - 两个字段都有相同的验证规则：`@Min(0)` `@Max(10)`
   - 传入的值必须在 0-10 之间

2. **优先级**
   - 如果同时传入，`seriesScore` 优先级更高
   - 不会出现冲突或错误

3. **数据库存储**
   - 数据库中只有一个 `score` 字段
   - 两个 DTO 字段最终都映射到同一个数据库字段

4. **向后兼容**
   - 旧的调用方无需修改代码
   - 新的调用方推荐使用 `seriesScore`

---

## 📞 联系方式

如有疑问，请联系开发团队。

**实现时间**: 2025-11-17  
**版本**: v1.0  
**状态**: ✅ 已实现并测试
