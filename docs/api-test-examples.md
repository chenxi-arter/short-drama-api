# 接口测试示例

## 1. 使用 curl 命令测试

### 基本请求（获取所有频道的第一页数据）
```bash
curl -X GET "http://localhost:3000/api/home/getvideos" \
  -H "Content-Type: application/json"
```

### 指定频道ID和页码
```bash
curl -X GET "http://localhost:3000/api/home/getvideos?channeid=1&page=2" \
  -H "Content-Type: application/json"
```

### 只指定频道ID
```bash
curl -X GET "http://localhost:3000/api/home/getvideos?channeid=1" \
  -H "Content-Type: application/json"
```

### 只指定页码
```bash
curl -X GET "http://localhost:3000/api/home/getvideos?page=3" \
  -H "Content-Type: application/json"
```

## 2. 使用 Postman 测试

### 请求配置
- **方法**: GET
- **URL**: `http://localhost:3000/api/home/getvideos`
- **Headers**: 
  - `Content-Type: application/json`

### 查询参数（Query Params）
| 参数名 | 值 | 描述 |
|-------|----|----------|
| channeid | 1 | 频道ID（可选） |
| page | 1 | 页码（可选） |

## 3. 使用 JavaScript fetch 测试

```javascript
// 基本请求
fetch('http://localhost:3000/home/getvideos')
  .then(response => response.json())
  .then(data => {
    console.log('成功:', data);
  })
  .catch((error) => {
    console.error('错误:', error);
  });

// 带参数的请求
const params = new URLSearchParams({
  catid: '1',
  page: '2'
});

fetch(`http://localhost:3000/home/getvideos?${params}`)
  .then(response => response.json())
  .then(data => {
    console.log('成功:', data);
  })
  .catch((error) => {
    console.error('错误:', error);
  });
```

## 4. 使用 Python requests 测试

```python
import requests
import json

# 基本请求
response = requests.get('http://localhost:3000/home/getvideos')
print('状态码:', response.status_code)
print('响应数据:', json.dumps(response.json(), indent=2, ensure_ascii=False))

# 带参数的请求
params = {
    'catid': '1',
    'page': '2'
}

response = requests.get('http://localhost:3000/home/getvideos', params=params)
print('状态码:', response.status_code)
print('响应数据:', json.dumps(response.json(), indent=2, ensure_ascii=False))
```

## 5. 预期响应示例

### 成功响应（200）
```json
{
  "data": {
    "list": [
      {
        "type": 0,
        "name": "轮播图",
        "filters": [],
        "banners": [
          {
            "showURL": "https://example.com/cover1.jpg",
            "title": "热门剧集1",
            "id": 1,
            "channeID": 1,
            "url": "1"
          }
        ],
        "list": []
      },
      {
        "type": 1001,
        "name": "搜索过滤器",
        "filters": [
          {
            "channeID": 1,
            "name": "短剧",
            "title": "全部",
            "ids": "0,0,0,0,0"
          }
        ],
        "banners": [],
        "list": []
      },
      {
        "type": -1,
        "name": "广告",
        "filters": [],
        "banners": [],
        "list": []
      },
      {
        "type": 3,
        "name": "电影",
        "filters": [],
        "banners": [],
        "list": [
          {
            "id": 1,
            "coverUrl": "https://example.com/cover.jpg",
            "title": "精彩剧集",
            "score": "8.5",
            "playCount": 12345,
            "url": "1",
            "type": "剧情",
            "isSerial": true,
            "upStatus": "更新到10集",
            "upCount": 2
          }
        ]
      }
    ]
  },
  "code": 200,
  "msg": null
}
```

## 6. 错误响应示例

### 参数错误（400）
```json
{
  "statusCode": 400,
  "message": "Validation failed",
  "error": "Bad Request"
}
```

### 服务器错误（500）
```json
{
  "statusCode": 500,
  "message": "Internal server error"
}
```

## 7. 测试检查点

### 基本功能测试
- [ ] 无参数请求能正常返回数据
- [ ] 指定catid参数能正确过滤数据
- [ ] 指定page参数能正确分页
- [ ] 同时指定catid和page参数能正常工作

### 数据结构测试
- [ ] 响应包含data.list数组
- [ ] 轮播图板块（type: 0）包含banners数组
- [ ] 搜索过滤器板块（type: 1001）包含filters数组
- [ ] 广告板块（type: -1）存在
- [ ] 视频板块（type: 3）包含list数组

### 边界值测试
- [ ] page=0 或负数的处理
- [ ] catid为无效值的处理
- [ ] 非常大的page值的处理

### 性能测试
- [ ] 响应时间在合理范围内（< 2秒）
- [ ] 并发请求处理正常

## 8. 自动化测试脚本

### Jest 测试示例
```javascript
const request = require('supertest');
const app = require('../src/app'); // 根据实际路径调整

describe('GET /home/getvideos', () => {
  test('应该返回首页视频数据', async () => {
    const response = await request(app)
      .get('/home/getvideos')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
    expect(response.body.data).toHaveProperty('list');
    expect(Array.isArray(response.body.data.list)).toBe(true);
  });
  
  test('应该支持catid参数', async () => {
    const response = await request(app)
      .get('/home/getvideos?catid=1')
      .expect(200);
    
    expect(response.body.code).toBe(200);
  });
  
  test('应该支持page参数', async () => {
    const response = await request(app)
      .get('/home/getvideos?page=2')
      .expect(200);
    
    expect(response.body.code).toBe(200);
  });
});
```

## 9. 注意事项

1. **端口号**: 请根据实际运行的端口号修改示例中的 `3000`
2. **域名**: 生产环境请替换为实际的域名
3. **认证**: 如果接口需要认证，请添加相应的认证头
4. **CORS**: 前端调用时注意跨域问题
5. **数据库**: 确保数据库中有测试数据