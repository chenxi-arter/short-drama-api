# Ingest API 身份验证指南

## 🔐 重要提示

根据安全审计报告（漏洞 C4），所有 Ingest API 接口现在都需要**管理员身份验证**。

---

## 📋 快速开始

### 步骤 1：管理员登录

```bash
# 管理员登录（端口 9090 是管理端）
curl -X POST http://localhost:9090/api/admin/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "你的管理员密码"
  }'
```

**成功响应：**
```json
{
  "code": 200,
  "data": {
    "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjEsInR5cCI6ImFkbWluIiwiaWF0IjoxNzIzMDIxMjAwLCJleHAiOjE3MjMwNTAwMDB9.xxxxx",
    "admin": {
      "id": 1,
      "username": "admin",
      "role": "super_admin",
      "email": "admin@example.com"
    }
  },
  "message": "登录成功"
}
```

**保存 `access_token`** - 这是你调用所有 ingest 接口的凭证。

---

### 步骤 2：使用 Token 调用 Ingest 接口

```bash
# 将 token 保存为变量（方便后续使用）
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 调用 ingest 接口（注意添加 Authorization 头）
curl -X POST http://localhost:9090/api/admin/ingest/series \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "externalId": "drama_001",
    "title": "示例短剧",
    "description": "这是一个示例",
    "coverUrl": "https://example.com/cover.jpg",
    "categoryName": "都市",
    "episodes": [
      {
        "episodeNumber": 1,
        "title": "第1集",
        "urls": [
          {
            "quality": "1080p",
            "ossUrl": "https://example.com/ep1.mp4",
            "cdnUrl": "https://cdn.example.com/ep1.mp4"
          }
        ]
      }
    ]
  }'
```

**关键点：**
- ✅ 必须添加 `Authorization: Bearer <token>` 头
- ✅ `Bearer` 后面有一个空格
- ✅ token 就是登录返回的 `access_token`

---

## 🔑 如果没有管理员账号

### 方法 1：首次初始化（推荐）

如果是第一次部署，需要创建第一个管理员：

```bash
# 1. 在 .env 文件中配置初始化密钥
INIT_ADMIN_TOKEN=your_secret_init_token_here

# 2. 使用初始化接口创建第一个管理员
curl -X POST http://localhost:9090/api/admin/auth/initialize \
  -H "Content-Type: application/json" \
  -H "x-init-admin-token: your_secret_init_token_here" \
  -d '{
    "username": "admin",
    "password": "StrongPassword123!",
    "email": "admin@example.com"
  }'
```

**响应：**
```json
{
  "code": 200,
  "data": {
    "access_token": "eyJhbGci...",
    "admin": {
      "id": 1,
      "username": "admin",
      "role": "super_admin"
    }
  },
  "message": "管理员账户初始化成功"
}
```

### 方法 2：数据库直接创建

如果没有配置 `INIT_ADMIN_TOKEN`，可以直接在数据库中创建：

```sql
-- 使用 bcrypt 加密密码（密码：admin123）
INSERT INTO admin_users (username, password, email, role, is_active, created_at, updated_at)
VALUES (
  'admin',
  '$2b$10$abc123...', -- 使用 bcrypt 加密后的密码
  'admin@example.com',
  'super_admin',
  1,
  NOW(),
  NOW()
);
```

**生成 bcrypt 密码：**
```bash
# 使用 Node.js 生成
node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('admin123', 10));"
```

---

## 📖 完整示例：批量导入数据

### 1. 创建登录脚本 `login.sh`

```bash
#!/bin/bash

# 配置
ADMIN_URL="http://localhost:9090"
USERNAME="admin"
PASSWORD="your_password"

# 登录获取 token
RESPONSE=$(curl -s -X POST "$ADMIN_URL/api/admin/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

# 提取 token
TOKEN=$(echo $RESPONSE | jq -r '.data.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "登录失败！"
  echo $RESPONSE
  exit 1
fi

echo "登录成功！"
echo "Token: $TOKEN"

# 保存到文件供其他脚本使用
echo $TOKEN > .admin_token
```

### 2. 创建导入脚本 `ingest.sh`

```bash
#!/bin/bash

# 读取 token
TOKEN=$(cat .admin_token)

if [ -z "$TOKEN" ]; then
  echo "未找到 token，请先运行 login.sh"
  exit 1
fi

# 读取 JSON 数据文件
DATA=$(cat data.json)

# 调用 ingest 接口
curl -X POST http://localhost:9090/api/admin/ingest/series \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "$DATA"
```

### 3. 使用方法

```bash
# 1. 先登录
chmod +x login.sh
./login.sh

# 2. 导入数据
chmod +x ingest.sh
./ingest.sh
```

---

## 🐍 Python 示例

```python
import requests
import json

# 配置
ADMIN_URL = "http://localhost:9090"
USERNAME = "admin"
PASSWORD = "your_password"

class IngestClient:
    def __init__(self, base_url, username, password):
        self.base_url = base_url
        self.token = None
        self.login(username, password)
    
    def login(self, username, password):
        """管理员登录"""
        response = requests.post(
            f"{self.base_url}/api/admin/auth/login",
            json={"username": username, "password": password}
        )
        response.raise_for_status()
        data = response.json()
        self.token = data['data']['access_token']
        print(f"登录成功！用户: {data['data']['admin']['username']}")
    
    def get_headers(self):
        """获取请求头"""
        return {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {self.token}"
        }
    
    def ingest_series(self, series_data):
        """导入单个系列"""
        response = requests.post(
            f"{self.base_url}/api/admin/ingest/series",
            headers=self.get_headers(),
            json=series_data
        )
        return response.json()
    
    def ingest_series_batch(self, series_list):
        """批量导入系列"""
        response = requests.post(
            f"{self.base_url}/api/admin/ingest/series/batch",
            headers=self.get_headers(),
            json={"items": series_list}
        )
        return response.json()

# 使用示例
if __name__ == "__main__":
    # 1. 创建客户端（自动登录）
    client = IngestClient(ADMIN_URL, USERNAME, PASSWORD)
    
    # 2. 导入单个系列
    series_data = {
        "externalId": "drama_001",
        "title": "示例短剧",
        "description": "这是一个示例",
        "coverUrl": "https://example.com/cover.jpg",
        "categoryName": "都市",
        "episodes": [
            {
                "episodeNumber": 1,
                "title": "第1集",
                "urls": [
                    {
                        "quality": "1080p",
                        "ossUrl": "https://example.com/ep1.mp4",
                        "cdnUrl": "https://cdn.example.com/ep1.mp4"
                    }
                ]
            }
        ]
    }
    
    result = client.ingest_series(series_data)
    print("导入结果:", json.dumps(result, ensure_ascii=False, indent=2))
```

---

## ❌ 常见错误

### 错误 1：401 - 缺少管理员登录凭证

```json
{
  "statusCode": 401,
  "message": "缺少管理员登录凭证"
}
```

**原因：** 没有添加 `Authorization` 头  
**解决：** 添加 `-H "Authorization: Bearer <token>"`

---

### 错误 2：401 - 无效的管理员登录凭证

```json
{
  "statusCode": 401,
  "message": "无效的管理员登录凭证"
}
```

**原因：** 使用了普通用户的 token，或 token 格式错误  
**解决：** 确保使用管理员账号登录获取的 token

---

### 错误 3：401 - 管理员登录已过期或无效

```json
{
  "statusCode": 401,
  "message": "管理员登录已过期或无效"
}
```

**原因：** Token 已过期（默认 8 小时）  
**解决：** 重新登录获取新 token

---

## 🔒 安全最佳实践

### 1. 不要在代码中硬编码密码

❌ **错误示例：**
```bash
PASSWORD="admin123"  # 不要这样做！
```

✅ **正确示例：**
```bash
PASSWORD="${ADMIN_PASSWORD}"  # 从环境变量读取
```

### 2. 使用强密码

- 至少 12 位字符
- 包含大小写字母、数字、特殊字符
- 不使用常见密码

### 3. 定期更换密码

```bash
curl -X PUT http://localhost:9090/api/admin/auth/change-password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "oldPassword": "old_password",
    "newPassword": "new_strong_password"
  }'
```

### 4. Token 安全存储

- 不要提交到 Git
- 使用 `.gitignore` 忽略 token 文件
- 定期刷新 token

---

## 📞 需要帮助？

- 查看完整 API 文档：`docs/ingest-api-complete-guide.md`
- 查看管理员 API：`docs/admin-api.md`
- 安全审计报告：`docs/audit/审计报告.html`

---

**最后更新：** 2026-08-06  
**安全级别：** 管理员权限必需  
**修复漏洞：** C4 - admin/ingest 无鉴权守卫
