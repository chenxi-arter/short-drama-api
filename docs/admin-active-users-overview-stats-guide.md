# 活跃用户与运营总览接口说明

本文档单独说明以下两个接口的返回字段含义，以及前端/调用方的处理办法：

- `GET /api/admin/dashboard/active-users`
- `GET /api/admin/export/overview-stats?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`

> 补充说明：`docs/admin-api.md` 中也有这两个接口的主文档说明；若涉及活跃用户统计口径，请以本文档的详细口径说明与示例为准。

---

## 1. 活跃用户统计

### 接口地址

```text
GET /api/admin/dashboard/active-users
```

### 用途

用于获取当前平台的活跃用户核心指标，统计口径与 `overview-stats` 中的 `active_users` 保持一致，适合展示在管理后台首页概览卡片。

### 返回示例

```json
{
  "code": 200,
  "data": {
    "dau": 1250,
    "wau": 5430,
    "mau": 18900,
    "dau7DayAvg": 1180,
    "sticky": 6.61
  },
  "message": "活跃用户统计获取成功",
  "timestamp": "2026-04-06T08:00:00.000Z"
}
```

### 返回字段说明

#### 顶层字段

| 字段 | 类型 | 说明 | 处理办法 |
|------|------|------|----------|
| `code` | `number` | 业务状态码，`200` 表示成功 | 前端先判断 `code === 200`，否则按失败处理 |
| `data` | `object \| null` | 业务数据 | 成功时使用对象；失败时通常为 `null` |
| `message` | `string` | 返回消息 | 失败时建议直接展示 |
| `timestamp` | `string` | 服务端返回时间，ISO 8601 格式 | 可用于“数据更新时间”展示 |

#### data 字段

| 字段 | 类型 | 说明 | 处理办法 |
|------|------|------|----------|
| `data.dau` | `number` | 今日活跃用户数。实现与 `overview-stats` 单日 `active_users` 完全一致：Redis DAU 与 MySQL（当天观看用户 ∪ 当天注册用户）取较大值 | 按整数展示，可命名为“今日日活” |
| `data.wau` | `number` | 最近 7 天活跃用户数。统计口径：最近 7 天观看用户与注册用户的并集去重 | 展示为“近7日活跃”，是滚动 7 天窗口 |
| `data.mau` | `number` | 最近 30 天活跃用户数。统计口径：最近 30 天观看用户与注册用户的并集去重 | 展示为“近30日活跃”，是滚动 30 天窗口 |
| `data.dau7DayAvg` | `number` | 最近 7 天 DAU 平均值，已四舍五入 | 可用于和 `dau` 做环比感知 |
| `data.sticky` | `number` | 粘性系数，计算方式：`DAU / MAU × 100`，保留 2 位小数 | 展示时应加 `%`，如 `6.61%`；不要再次乘以 100 |

### 前端处理建议

#### 1）成功判断

```ts
if (res.code !== 200 || !res.data) {
  // 展示错误提示或占位态
}
```

#### 2）推荐展示文案

- `dau` → 今日日活
- `wau` → 近7日活跃
- `mau` → 近30日活跃
- `dau7DayAvg` → 7日日活均值
- `sticky` → 用户粘性

#### 3）格式化建议

- 数值字段均为整数，直接展示即可。
- 当数值较大时，可以转为万位展示，例如：
  - `12500` → `1.25万`
- `sticky` 属于百分比数值，格式化时建议：
  - `6.61` → `6.61%`

#### 4）空态/异常处理

- 当接口失败时：
  - 展示 `message`
  - 页面卡片显示 `--`
- 不建议在前端自行兜底计算 `sticky`，以服务端返回为准。

---

## 2. 运营核心指标总览

### 接口地址

```text
GET /api/admin/export/overview-stats?startDate=2026-04-01&endDate=2026-04-16
```

### 请求参数

| 参数 | 类型 | 必填 | 说明 | 处理办法 |
|------|------|------|------|----------|
| `startDate` | `string` | 是 | 开始日期，格式：`YYYY-MM-DD` | 前端按日期字符串传参，不要带时分秒 |
| `endDate` | `string` | 是 | 结束日期，格式：`YYYY-MM-DD` | 前端按日期字符串传参，不要带时分秒 |

### 用途

用于按天查看一段时间内的新增、活跃、启动、留存、观看时长等运营数据，适合趋势表格、导出、报表页面。

### 返回示例

```json
{
  "code": 200,
  "data": [
    {
      "date": "2026-04-16",
      "new_users": 120,
      "active_users": 950,
      "launches": 2680,
      "total_users": 35600,
      "new_user_ratio": 0.1263,
      "retention_next_day": null,
      "avg_session_duration": 184,
      "avg_daily_duration": null,
      "avg_daily_launches": null
    },
    {
      "date": "2026-04-15",
      "new_users": 98,
      "active_users": 910,
      "launches": 2410,
      "total_users": 35480,
      "new_user_ratio": 0.1077,
      "retention_next_day": 0.3125,
      "avg_session_duration": 176,
      "avg_daily_duration": 468,
      "avg_daily_launches": 2.65
    }
  ]
}
```

### 返回结构说明

#### 顶层字段

| 字段 | 类型 | 说明 | 处理办法 |
|------|------|------|----------|
| `code` | `number` | 业务状态码，`200` 表示成功 | 先判断 `code === 200` |
| `data` | `array \| null` | 按日期返回的统计数组 | 成功时按数组渲染；失败时为 `null` |
| `message` | `string` | 失败时的错误消息 | 若存在可直接提示 |

> 说明：该接口成功时主要返回 `code` 与 `data`；失败时会额外返回 `message`。

### data 数组项字段说明

| 字段 | 类型 | 说明 | 处理办法 |
|------|------|------|----------|
| `date` | `string` | 统计日期，格式 `YYYY-MM-DD` | 作为表格日期列或横轴使用 |
| `new_users` | `number` | 当日新增注册用户数 | 直接展示整数 |
| `active_users` | `number` | 当日活跃用户数 | 直接展示整数；适合做核心指标 |
| `launches` | `number` | 当日启动次数，当前以 `watch_progress` 更新次数作为代理值，非去重 | 展示时命名建议为“启动次数”或“打开次数” |
| `total_users` | `number` | 截止当天末尾的累计注册用户数 | 适合放在表格，不建议作为趋势增量 |
| `new_user_ratio` | `number` | 新增用户占活跃用户比例，范围 `0 ~ 1` | 前端展示时需乘以 100 后加 `%`，如 `0.1263` → `12.63%` |
| `retention_next_day` | `number \| null` | 次日留存率，范围 `0 ~ 1`；若当天数据尚未到次日则为 `null` | 非空时转百分比展示；为 `null` 时展示 `--` |
| `avg_session_duration` | `number` | 平均单次观看时长，单位秒 | 建议格式化为“分秒”或保留秒数 |
| `avg_daily_duration` | `number \| null` | 平均日观看时长，单位秒 | 若为 `null` 显示 `--`；非空可转 `X分Y秒` |
| `avg_daily_launches` | `number \| null` | 平均日观看次数/启动次数 | 可保留 2 位小数展示 |

### 特殊口径说明

#### 1）日期顺序

- 返回结果按 `date` **倒序** 排列。
- 即最近日期在前，最早日期在后。
- 如果前端需要画从左到右递增的折线图，建议先做一次升序排序。

#### 2）`active_users` / `dau` 统计口径

服务端统一按以下逻辑统计：

- 单日维度：与 `overview-stats` 完全一致，优先读取 Redis DAU，之后再与 MySQL 计算值比较并取较大值
- MySQL 计算口径：对应时间窗口内 **有观看行为的用户** 与 **新注册用户** 的并集去重
- 7 日维度：最近 7 天观看用户 ∪ 最近 7 天注册用户（窗口内去重）
- 30 日维度：最近 30 天观看用户 ∪ 最近 30 天注册用户（窗口内去重）

前端处理建议：

- 直接信任服务端返回值。
- 不需要前端自行二次计算或去重。
- 现在 `dashboard/active-users` 中的 `dau` 与 `overview-stats` 单日 `active_users` 实现与口径都保持一致。

#### 3）`new_user_ratio` 的展示

该字段不是百分比整数，而是 `0 ~ 1` 的比例值。

示例：

- `0.1263` 表示 `12.63%`
- `0.5` 表示 `50%`

推荐处理：

```ts
const formatRatio = (value: number | null | undefined) => {
  if (value == null) return '--';
  return `${(value * 100).toFixed(2)}%`;
};
```

#### 4）`retention_next_day` 的展示

该字段也是比例值，不是百分比整数。

同时要注意：

- 当天数据由于“次日”尚未发生，因此通常返回 `null`
- `null` 不表示错误，而是“暂时无法计算”

推荐处理：

```ts
const formatRetention = (value: number | null) => {
  if (value == null) return '--';
  return `${(value * 100).toFixed(2)}%`;
};
```

#### 5）时长字段展示

以下字段单位均为秒：

- `avg_session_duration`
- `avg_daily_duration`

推荐处理：

```ts
const formatSeconds = (seconds: number | null | undefined) => {
  if (seconds == null) return '--';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}分${s}秒`;
};
```

#### 6）`avg_daily_duration` / `avg_daily_launches` 可能为 null

出现 `null` 的常见原因：

- 当天数据尚未完成统计
- 依赖的 `watch_logs` 表暂无数据

推荐处理：

- 表格中显示 `--`
- 导出 Excel 时可写为空字符串或 `N/A`
- 不建议前端将 `null` 强行转成 `0`，避免误导业务判断

---

## 3. 推荐的前端映射方式

### active-users 卡片页

| 后端字段 | 前端展示名 |
|----------|------------|
| `dau` | 今日日活 |
| `wau` | 近7日活跃 |
| `mau` | 近30日活跃 |
| `dau7DayAvg` | 7日日活均值 |
| `sticky` | 用户粘性 |

### overview-stats 表格页

| 后端字段 | 前端列名 |
|----------|----------|
| `date` | 日期 |
| `new_users` | 新增用户 |
| `active_users` | 活跃用户 |
| `launches` | 启动次数 |
| `total_users` | 累计用户 |
| `new_user_ratio` | 新增占比 |
| `retention_next_day` | 次日留存 |
| `avg_session_duration` | 平均单次时长 |
| `avg_daily_duration` | 人均日观看时长 |
| `avg_daily_launches` | 人均日启动次数 |

---

## 4. 错误处理建议

### `active-users` 失败示例

```json
{
  "code": 500,
  "data": null,
  "message": "获取活跃用户统计失败: xxx",
  "timestamp": "2026-04-06T08:00:00.000Z"
}
```

### `overview-stats` 失败示例

```json
{
  "code": 500,
  "data": null,
  "message": "获取运营指标失败: xxx"
}
```

### 统一处理建议

- `code !== 200`：提示失败消息
- `data === null`：页面显示空态
- 列表页失败：保留筛选条件，允许用户重试
- 图表页失败：显示“暂无数据”而不是渲染 0 值图表

---

## 5. 最终建议

1. `active-users` 适合做顶部概览卡片。
2. `overview-stats` 适合做趋势表格、导出报表、折线图。
3. 比例字段统一按百分比格式化：
   - `sticky`：后端已是百分比数值，直接拼 `%`
   - `new_user_ratio` / `retention_next_day`：前端先乘 `100` 再拼 `%`
4. `null` 值统一展示为 `--`，不要强转为 `0`。
5. 时长字段建议统一封装秒转“分秒”的格式化函数，避免页面口径不一致。
