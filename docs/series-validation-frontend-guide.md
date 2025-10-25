# 系列验证模块 - 前端对接指南

## 📋 目录
- [接口概览](#接口概览)
- [API 详细说明](#api-详细说明)
- [前端代码示例](#前端代码示例)
- [UI 设计建议](#ui-设计建议)
- [错误处理](#错误处理)

---

## 接口概览

### 基础信息
- **Base URL**: `http://your-domain:9090/api/admin/series/validation`
- **认证**: 需要管理员权限（根据项目的auth配置）
- **响应格式**: JSON

### 接口列表

| 接口 | 方法 | 路径 | 描述 | 扫描范围 |
|------|------|------|------|---------|
| 统计信息 | GET | `/stats` | 获取数据质量统计 | 全量扫描 |
| 缺集检查 | GET | `/check-missing-episodes` | 检查缺集和重复集数 | 全量扫描 |
| 系列详情 | GET | `/episodes/:seriesId` | 获取单个系列的集数详情 | 指定系列 |
| 重复名称 | GET | `/check-duplicate-names` | 检查重复的系列名 | 全量扫描 |
| 重复外部ID | GET | `/check-duplicate-external-ids` | 检查重复的外部ID | 全量扫描 |

---

## API 详细说明

### 1. 获取统计信息

**请求**
```http
GET /api/admin/series/validation/stats
```

**响应示例**
```json
{
  "success": true,
  "code": 200,
  "message": "数据质量统计获取成功",
  "timestamp": "2025-10-25T11:34:29.725Z",
  "data": {
    "overview": {
      "totalSeries": 1139,
      "totalEpisodes": 26635,
      "healthySeries": 1125,
      "issuesSeries": 14
    },
    "issues": {
      "missingEpisodes": 9,
      "duplicateEpisodes": 1,
      "duplicateNames": 1,
      "duplicateExternalIds": 0,
      "emptySeries": 3
    },
    "breakdown": {
      "onlyMissing": 9,
      "onlyDuplicate": 1,
      "bothIssues": 1,
      "empty": 3
    },
    "quality": {
      "score": 99,
      "grade": "A+",
      "trend": "stable",
      "issueRate": "1.2%"
    },
    "lastCheck": {
      "timestamp": "2025-10-25T11:34:29.725Z",
      "duration": 639
    }
  }
}
```

**数据字段说明**
- `overview.totalSeries`: 总系列数
- `overview.totalEpisodes`: 总剧集数
- `overview.healthySeries`: 健康系列数（无问题）
- `overview.issuesSeries`: 有问题的系列数
- `issues.missingEpisodes`: 缺集问题数（只有缺集的系列）
- `issues.duplicateEpisodes`: 重复集数问题数（只有重复的系列）
- `issues.duplicateNames`: 重复名称组数（有多个系列使用相同名称）
- `issues.duplicateExternalIds`: 重复外部ID组数（有多个系列使用相同外部ID）
- `issues.emptySeries`: 空系列数（无剧集）
- `breakdown.onlyMissing`: 只有缺集问题的系列数
- `breakdown.onlyDuplicate`: 只有重复问题的系列数
- `breakdown.bothIssues`: 既有缺集又有重复的系列数
- `breakdown.empty`: 空系列数
- `quality.score`: 数据质量评分（0-100）
- `quality.grade`: 质量等级（A+/A/B+/B/C+/C/D/F）
- `quality.issueRate`: 问题率百分比

---

### 2. 检查缺集和重复集数

**请求**
```http
GET /api/admin/series/validation/check-missing-episodes
```

**可选参数**
- `seriesId` (number): 检查指定系列

**响应示例**
```json
{
  "success": true,
  "data": {
    "total": 14,
    "checkedSeries": 1138,
    "items": [
      {
        "seriesId": 3152,
        "seriesTitle": "[测试]复合问题系列-宫廷风云",
        "seriesShortId": "pYSstgdmiUV",
        "totalEpisodes": 10,
        "expectedEpisodes": 10,
        "missingEpisodes": [4],
        "duplicateEpisodes": [6],
        "status": "HAS_ISSUES",
        "issues": {
          "hasMissing": true,
          "hasDuplicates": true,
          "missingCount": 1,
          "duplicateCount": 1
        }
      },
      {
        "seriesId": 3145,
        "seriesTitle": "[测试]重复集数系列-甜蜜恋爱",
        "seriesShortId": "lGtrOSSzoul",
        "totalEpisodes": 8,
        "expectedEpisodes": 7,
        "missingEpisodes": [],
        "duplicateEpisodes": [5],
        "status": "HAS_ISSUES",
        "issues": {
          "hasMissing": false,
          "hasDuplicates": true,
          "missingCount": 0,
          "duplicateCount": 1
        }
      },
      {
        "seriesId": 3156,
        "seriesTitle": "你好",
        "seriesShortId": "bQJBThKvm9r",
        "totalEpisodes": 0,
        "missingEpisodes": [],
        "status": "NO_EPISODES",
        "message": "该系列没有任何剧集"
      }
    ]
  },
  "message": "发现 14 个系列存在集数问题",
  "timestamp": "2025-10-25T11:22:02.642Z"
}
```

**字段说明**
- `data.total`: 发现的问题系列总数
- `data.checkedSeries`: 检查的系列总数
- `data.items[]`: 问题系列列表

**问题系列字段**
- `seriesId`: 系列ID
- `seriesTitle`: 系列标题
- `seriesShortId`: 系列短ID
- `totalEpisodes`: 实际剧集数
- `expectedEpisodes`: 预期剧集数（最大集数）
- `missingEpisodes[]`: 缺失的集数数组
- `duplicateEpisodes[]`: 重复的集数数组
- `status`: 状态 (`HAS_ISSUES` 有问题 | `NO_EPISODES` 无剧集)
- `issues.hasMissing`: 是否有缺集
- `issues.hasDuplicates`: 是否有重复
- `issues.missingCount`: 缺集数量
- `issues.duplicateCount`: 重复集数量

---

### 3. 获取单个系列详情

**请求**
```http
GET /api/admin/series/validation/episodes/:seriesId
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "series": {
      "id": 123,
      "shortId": "abc123",
      "title": "示例剧集",
      "totalEpisodes": 10,
      "isCompleted": true
    },
    "episodes": [
      {
        "id": 1,
        "shortId": "ep001",
        "episodeNumber": 1,
        "title": "第1集",
        "status": "published",
        "duration": 600
      }
    ],
    "validation": {
      "expectedCount": 10,
      "actualCount": 10,
      "isContinuous": true,
      "missingEpisodes": [],
      "duplicates": []
    }
  }
}
```

---

### 4. 检查重复系列名

**请求**
```http
GET /api/admin/series/validation/check-duplicate-names
```

**响应示例**
```json
{
  "success": true,
  "data": {
    "total": 1,
    "checkedSeries": 1138,
    "totalDuplicateCount": 3,
    "items": [
      {
        "title": "[测试]重复名称系列",
        "count": 3,
        "series": [
          {
            "id": 3146,
            "shortId": "h8KHWWqgvgi",
            "title": "[测试]重复名称系列",
            "externalId": "test-duplicate-name-001",
            "createdAt": "2025-10-23T18:11:37.000Z"
          },
          {
            "id": 3148,
            "shortId": "IUeTPpr2wXN",
            "title": "[测试]重复名称系列",
            "externalId": "test-duplicate-name-003",
            "createdAt": "2025-10-23T18:11:38.000Z"
          }
        ]
      }
    ]
  },
  "message": "发现 1 个重复的系列名",
  "timestamp": "2025-10-25T11:22:02.647Z"
}
```

**字段说明**
- `data.total`: 重复名称组数
- `data.checkedSeries`: 检查的系列总数
- `data.totalDuplicateCount`: 所有重复系列的总数
- `items[].title`: 重复的系列名
- `items[].count`: 该名称重复的次数
- `items[].series[]`: 使用该名称的所有系列

---

### 5. 检查重复外部ID

**请求**
```http
GET /api/admin/series/validation/check-duplicate-external-ids
```

**响应格式与重复系列名类似**

---

## 前端代码示例

### Vue 3 + TypeScript 示例

#### 1. API 服务封装

```typescript
// src/api/seriesValidation.ts
import axios from 'axios';

const BASE_URL = '/api/admin/series/validation';

export interface ValidationStats {
  overview: {
    totalSeries: number;
    totalEpisodes: number;
    healthySeries: number;
    issuesSeries: number;
  };
  issues: {
    missingEpisodes: number;
    duplicateEpisodes: number;
    duplicateNames: number;
    duplicateExternalIds: number;
    emptySeries: number;
  };
  quality: {
    score: number;
    grade: string;
    trend: string;
  };
}

export interface SeriesIssue {
  seriesId: number;
  seriesTitle: string;
  seriesShortId: string;
  totalEpisodes: number;
  expectedEpisodes?: number;
  missingEpisodes: number[];
  duplicateEpisodes?: number[];
  status: 'HAS_ISSUES' | 'NO_EPISODES';
  message?: string;
  issues?: {
    hasMissing: boolean;
    hasDuplicates: boolean;
    missingCount: number;
    duplicateCount: number;
  };
}

export const seriesValidationAPI = {
  // 获取统计信息
  async getStats(): Promise<ValidationStats> {
    const response = await axios.get(`${BASE_URL}/stats`);
    return response.data.data;
  },

  // 检查缺集问题
  async checkMissingEpisodes(seriesId?: number) {
    const response = await axios.get(`${BASE_URL}/check-missing-episodes`, {
      params: { seriesId },
    });
    return response.data.data;
  },

  // 获取系列详情
  async getSeriesDetails(seriesId: number) {
    const response = await axios.get(`${BASE_URL}/episodes/${seriesId}`);
    return response.data.data;
  },

  // 检查重复名称
  async checkDuplicateNames() {
    const response = await axios.get(`${BASE_URL}/check-duplicate-names`);
    return response.data.data;
  },

  // 检查重复外部ID
  async checkDuplicateExternalIds() {
    const response = await axios.get(`${BASE_URL}/check-duplicate-external-ids`);
    return response.data.data;
  },
};
```

#### 2. Vue 组件示例

```vue
<template>
  <div class="series-validation">
    <!-- 统计卡片 -->
    <div class="stats-cards">
      <div class="stat-card">
        <div class="stat-value">{{ stats?.overview.totalSeries || 0 }}</div>
        <div class="stat-label">总系列数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">{{ stats?.overview.issuesSeries || 0 }}</div>
        <div class="stat-label">有问题系列</div>
      </div>
      <div class="stat-card quality">
        <div class="stat-value">{{ stats?.quality.score || 0 }}</div>
        <div class="stat-label">质量评分</div>
        <div class="grade">{{ stats?.quality.grade }}</div>
      </div>
    </div>

    <!-- 问题类型统计 -->
    <div class="issue-types">
      <div class="issue-item">
        <span class="label">缺集问题:</span>
        <span class="value">{{ stats?.issues.missingEpisodes || 0 }}</span>
      </div>
      <div class="issue-item">
        <span class="label">重复集数:</span>
        <span class="value">{{ stats?.issues.duplicateEpisodes || 0 }}</span>
      </div>
      <div class="issue-item">
        <span class="label">空系列:</span>
        <span class="value">{{ stats?.issues.emptySeries || 0 }}</span>
      </div>
      <div class="issue-item">
        <span class="label">重复名称:</span>
        <span class="value">{{ stats?.issues.duplicateNames || 0 }}</span>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="actions">
      <button @click="checkMissingEpisodes" :disabled="loading">
        <span v-if="loading">检查中...</span>
        <span v-else>检查缺集问题</span>
      </button>
      <button @click="checkDuplicateNames" :disabled="loading">
        检查重复名称
      </button>
      <button @click="checkDuplicateExternalIds" :disabled="loading">
        检查重复外部ID
      </button>
    </div>

    <!-- 问题列表 -->
    <div class="issues-list" v-if="issues.length > 0">
      <h3>发现的问题 ({{ issues.length }})</h3>
      <div
        v-for="issue in issues"
        :key="issue.seriesId"
        class="issue-card"
        :class="getIssueSeverityClass(issue)"
      >
        <div class="issue-header">
          <div class="info">
            <h4>{{ issue.seriesTitle }}</h4>
            <div class="meta">
              <span class="id">ID: {{ issue.seriesId }}</span>
              <span class="short-id">Short ID: {{ issue.seriesShortId }}</span>
              <span class="type-badge" :class="getIssueTypeClass(issue)">
                {{ getIssueTypeLabel(issue) }}
              </span>
              <span class="status-badge" :class="issue.status.toLowerCase()">
                {{ issue.status }}
              </span>
            </div>
          </div>
        </div>
        <div class="issue-body">
          <p class="description">{{ getIssueDescription(issue) }}</p>
          <div class="episode-stats">
            <span>总集数: {{ issue.totalEpisodes }}</span>
            <span v-if="issue.expectedEpisodes">预期集数: {{ issue.expectedEpisodes }}</span>
            <span v-if="issue.missingEpisodes && issue.missingEpisodes.length > 0">
              缺失: {{ issue.missingEpisodes.join(', ') }}
            </span>
            <span v-if="issue.duplicateEpisodes && issue.duplicateEpisodes.length > 0">
              重复: {{ issue.duplicateEpisodes.join(', ') }}
            </span>
          </div>
        </div>
        <div class="issue-actions">
          <button @click="viewDetails(issue.seriesId)">查看详情</button>
          <button @click="fixIssue(issue)">修复问题</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { seriesValidationAPI, ValidationStats, SeriesIssue } from '@/api/seriesValidation';

const stats = ref<ValidationStats | null>(null);
const issues = ref<SeriesIssue[]>([]);
const loading = ref(false);

// 加载统计信息
async function loadStats() {
  try {
    stats.value = await seriesValidationAPI.getStats();
  } catch (error) {
    console.error('加载统计失败:', error);
  }
}

// 检查缺集问题
async function checkMissingEpisodes() {
  loading.value = true;
  try {
    const result = await seriesValidationAPI.checkMissingEpisodes();
    issues.value = result.items || [];
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    loading.value = false;
  }
}

// 检查重复名称
async function checkDuplicateNames() {
  loading.value = true;
  try {
    const result = await seriesValidationAPI.checkDuplicateNames();
    // 处理重复名称数据...
    console.log('重复名称:', result);
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    loading.value = false;
  }
}

// 检查重复外部ID
async function checkDuplicateExternalIds() {
  loading.value = true;
  try {
    const result = await seriesValidationAPI.checkDuplicateExternalIds();
    console.log('重复外部ID:', result);
  } catch (error) {
    console.error('检查失败:', error);
  } finally {
    loading.value = false;
  }
}

// 查看详情
async function viewDetails(seriesId: number) {
  try {
    const details = await seriesValidationAPI.getSeriesDetails(seriesId);
    console.log('系列详情:', details);
    // 显示详情模态框...
  } catch (error) {
    console.error('获取详情失败:', error);
  }
}

// 修复问题
function fixIssue(issue: SeriesIssue) {
  // 实现修复逻辑...
  console.log('修复问题:', issue);
}

// 辅助函数
function getIssueTypeLabel(issue: SeriesIssue) {
  if (issue.status === 'NO_EPISODES') {
    return '空系列';
  }
  if (issue.issues) {
    if (issue.issues.hasMissing && issue.issues.hasDuplicates) {
      return '混合问题';
    } else if (issue.issues.hasMissing) {
      return '缺集';
    } else if (issue.issues.hasDuplicates) {
      return '重复';
    }
  }
  return '未知';
}

function getIssueTypeClass(issue: SeriesIssue) {
  if (issue.status === 'NO_EPISODES') return 'empty';
  if (issue.issues) {
    if (issue.issues.hasMissing && issue.issues.hasDuplicates) return 'both';
    if (issue.issues.hasMissing) return 'missing';
    if (issue.issues.hasDuplicates) return 'duplicate';
  }
  return '';
}

function getIssueSeverityClass(issue: SeriesIssue) {
  if (issue.status === 'NO_EPISODES') return 'high';
  if (issue.issues) {
    const totalIssues = issue.issues.missingCount + issue.issues.duplicateCount;
    if (totalIssues >= 3) return 'medium';
    return 'low';
  }
  return 'low';
}

function getIssueDescription(issue: SeriesIssue) {
  if (issue.message) return issue.message;
  if (issue.issues) {
    const parts = [];
    if (issue.issues.hasMissing) {
      parts.push(`缺少${issue.issues.missingCount}集`);
    }
    if (issue.issues.hasDuplicates) {
      parts.push(`${issue.issues.duplicateCount}集重复`);
    }
    return parts.join('，');
  }
  return '';
}

onMounted(() => {
  loadStats();
});
</script>

<style scoped>
.series-validation {
  padding: 20px;
}

.stats-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 32px;
  font-weight: bold;
  color: #333;
}

.stat-label {
  font-size: 14px;
  color: #666;
  margin-top: 5px;
}

.stat-card.quality .grade {
  display: inline-block;
  margin-top: 10px;
  padding: 4px 12px;
  background: #4caf50;
  color: white;
  border-radius: 4px;
  font-weight: bold;
}

.issue-types {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}

.issue-item {
  display: flex;
  justify-content: space-between;
}

.issue-item .label {
  color: #666;
}

.issue-item .value {
  font-weight: bold;
  color: #f44336;
}

.actions {
  margin-bottom: 30px;
  display: flex;
  gap: 10px;
}

button {
  padding: 10px 20px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #1976d2;
}

button:disabled {
  background: #ccc;
  cursor: not-allowed;
}

.issues-list h3 {
  margin-bottom: 20px;
}

.issue-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 15px;
  border-left: 4px solid #ff9800;
}

.issue-card.high {
  border-left-color: #f44336;
}

.issue-card.medium {
  border-left-color: #ff9800;
}

.issue-card.low {
  border-left-color: #ffc107;
}

.issue-header {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.issue-header .cover {
  width: 80px;
  height: 120px;
  object-fit: cover;
  border-radius: 4px;
}

.issue-header .info h4 {
  margin: 0 0 10px 0;
}

.meta {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.type-badge,
.severity-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 3px;
  font-size: 12px;
}

.type-badge {
  background: #e3f2fd;
  color: #1976d2;
}

.severity-badge.high {
  background: #ffebee;
  color: #c62828;
}

.severity-badge.medium {
  background: #fff3e0;
  color: #e65100;
}

.severity-badge.low {
  background: #fffde7;
  color: #f57f17;
}

.episode-stats {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  font-size: 14px;
  color: #666;
}

.issue-actions {
  margin-top: 15px;
  display: flex;
  gap: 10px;
}
</style>
```

### React + TypeScript 示例

```typescript
// hooks/useSeriesValidation.ts
import { useState, useEffect } from 'react';
import axios from 'axios';

const BASE_URL = '/api/admin/series/validation';

export function useSeriesValidation() {
  const [stats, setStats] = useState(null);
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(false);

  // 加载统计信息
  const loadStats = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/stats`);
      setStats(response.data.data);
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  // 检查缺集问题
  const checkMissingEpisodes = async (seriesId?: number) => {
    setLoading(true);
    try {
      const response = await axios.get(`${BASE_URL}/check-missing-episodes`, {
        params: { seriesId },
      });
      setIssues(response.data.data.items || []);
      return response.data.data;
    } catch (error) {
      console.error('检查失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // 获取系列详情
  const getSeriesDetails = async (seriesId: number) => {
    try {
      const response = await axios.get(`${BASE_URL}/episodes/${seriesId}`);
      return response.data.data;
    } catch (error) {
      console.error('获取详情失败:', error);
      throw error;
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  return {
    stats,
    issues,
    loading,
    loadStats,
    checkMissingEpisodes,
    getSeriesDetails,
  };
}
```

---

## UI 设计建议

### 1. 仪表板布局
```
┌─────────────────────────────────────────────┐
│  数据质量总览                                 │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐        │
│  │总系列数  │ │问题系列 │ │质量评分 │        │
│  │  1137   │ │   80   │ │  93 A  │        │
│  └─────────┘ └─────────┘ └─────────┘        │
├─────────────────────────────────────────────┤
│  问题类型分布                                 │
│  缺集: 34  重复: 23  空系列: 23  重名: 0     │
├─────────────────────────────────────────────┤
│  ┌────────┐ ┌────────┐ ┌────────┐          │
│  │检查缺集 │ │重复名称│ │重复ID │           │
│  └────────┘ └────────┘ └────────┘          │
├─────────────────────────────────────────────┤
│  问题列表                                     │
│  ┌─────────────────────────────────────┐    │
│  │ [封面] 系列名称                      │    │
│  │        ID: 123  类型: 缺集  严重度   │    │
│  │        缺失: 3, 7                    │    │
│  │        [查看详情] [修复]              │    │
│  └─────────────────────────────────────┘    │
└─────────────────────────────────────────────┘
```

### 2. 颜色方案
- **严重 (high)**: 红色 `#f44336`
- **中等 (medium)**: 橙色 `#ff9800`
- **轻微 (low)**: 黄色 `#ffc107`
- **正常**: 绿色 `#4caf50`

### 3. 推荐组件库
- Ant Design / Element Plus: 表格、卡片、徽章
- Chart.js / ECharts: 数据可视化
- Virtual Scroller: 大数据列表性能优化

---

## 错误处理

### 1. 网络错误
```typescript
try {
  const result = await seriesValidationAPI.checkMissingEpisodes();
} catch (error) {
  if (error.response) {
    // 服务器返回错误
    const { status, data } = error.response;
    if (status === 500) {
      message.error('服务器错误，请稍后重试');
    } else {
      message.error(data.message || '请求失败');
    }
  } else if (error.request) {
    // 请求发出但没有响应
    message.error('网络连接失败，请检查网络');
  } else {
    // 其他错误
    message.error('发生未知错误');
  }
}
```

### 2. 超时处理
```typescript
// 设置60秒超时（全量扫描可能较慢）
const response = await axios.get(url, {
  timeout: 60000,
});
```

### 3. 空数据处理
```typescript
// 使用可选链和默认值
const totalIssues = result?.data?.total || 0;
const items = result?.data?.items || [];
```

---

## 性能优化建议

### 1. 分页加载问题列表
虽然接口返回全量数据，但前端可以实现虚拟滚动或分页：

```typescript
// 使用虚拟滚动
import { RecycleScroller } from 'vue-virtual-scroller';

// 或者前端分页
const pageSize = 20;
const currentPage = ref(1);
const pagedIssues = computed(() => {
  const start = (currentPage.value - 1) * pageSize;
  return issues.value.slice(start, start + pageSize);
});
```

### 2. 缓存统计数据
```typescript
// 使用缓存，避免频繁请求
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟
let statsCache = null;
let cacheTime = 0;

async function getStats() {
  const now = Date.now();
  if (statsCache && now - cacheTime < CACHE_DURATION) {
    return statsCache;
  }
  statsCache = await seriesValidationAPI.getStats();
  cacheTime = now;
  return statsCache;
}
```

### 3. 加载状态优化
```vue
<template>
  <div v-if="loading" class="loading">
    <Spin tip="正在扫描全部系列，请稍候...">
      <p>已检查: {{ progress.checked }} / {{ progress.total }}</p>
    </Spin>
  </div>
</template>
```

---

## 测试建议

### 单元测试
```typescript
import { describe, it, expect, vi } from 'vitest';
import { seriesValidationAPI } from '@/api/seriesValidation';

describe('Series Validation API', () => {
  it('should fetch stats successfully', async () => {
    const stats = await seriesValidationAPI.getStats();
    expect(stats).toHaveProperty('overview');
    expect(stats.overview).toHaveProperty('totalSeries');
  });

  it('should check missing episodes', async () => {
    const result = await seriesValidationAPI.checkMissingEpisodes();
    expect(result).toHaveProperty('items');
    expect(Array.isArray(result.items)).toBe(true);
  });
});
```

---

## 常见问题 FAQ

### Q1: 接口扫描时间过长怎么办？
A: 全量扫描1000+系列通常需要几秒到十几秒。建议：
- 显示加载进度条
- 设置合理的超时时间（60秒）
- 考虑在后台定时任务中执行，前端只读取结果

### Q2: 如何处理大量问题数据？
A: 如果有数百个问题系列：
- 使用虚拟滚动渲染
- 实现前端过滤和排序
- 按严重程度分组显示

### Q3: 需要身份验证吗？
A: 是的，这些是管理端接口，需要在请求头中携带管理员token：
```typescript
axios.defaults.headers.common['Authorization'] = `Bearer ${adminToken}`;
```

---

## 更新日志

**v1.0.0** (2025-10-25)
- ✅ 所有接口默认全量扫描
- ✅ 优化响应数据结构
- ✅ 增加问题严重程度分级
- ✅ 新增质量评分和等级

---

## 联系支持

如有问题，请联系后端开发团队或提交 Issue。

