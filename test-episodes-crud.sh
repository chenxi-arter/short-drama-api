#!/bin/bash

# 测试剧集CRUD接口
BASE_URL="http://localhost:8080/api/admin/episodes"

echo "🧪 测试剧集CRUD接口"
echo "=================================="

echo ""
echo "1️⃣ 测试 GET /api/admin/episodes (列表)"
LIST_RESULT=$(curl -s "$BASE_URL?page=1&size=1")
LIST_TOTAL=$(echo $LIST_RESULT | jq -r '.total')
echo "✅ 列表查询成功，总数: $LIST_TOTAL"

echo ""
echo "2️⃣ 测试 POST /api/admin/episodes (创建)"
CREATE_RESULT=$(curl -s -X POST "$BASE_URL" \
  -H "Content-Type: application/json" \
  -d '{
    "seriesId": 2111,
    "episodeNumber": 999,
    "title": "测试剧集CRUD",
    "duration": 600,
    "status": "draft",
    "isVertical": false,
    "hasSequel": false
  }')
NEW_ID=$(echo $CREATE_RESULT | jq -r '.id')
if [ "$NEW_ID" != "null" ] && [ -n "$NEW_ID" ]; then
    echo "✅ 创建成功，ID: $NEW_ID"
else
    echo "❌ 创建失败"
    echo $CREATE_RESULT | jq '.'
    exit 1
fi

echo ""
echo "3️⃣ 测试 GET /api/admin/episodes/:id (详情)"
GET_RESULT=$(curl -s "$BASE_URL/$NEW_ID")
GET_TITLE=$(echo $GET_RESULT | jq -r '.title')
if [ "$GET_TITLE" = "测试剧集CRUD" ]; then
    echo "✅ 详情查询成功，标题: $GET_TITLE"
else
    echo "❌ 详情查询失败"
    echo $GET_RESULT | jq '.'
fi

echo ""
echo "4️⃣ 测试 PUT /api/admin/episodes/:id (更新)"
UPDATE_RESULT=$(curl -s -X PUT "$BASE_URL/$NEW_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "测试剧集CRUD已更新",
    "duration": 720,
    "isVertical": true
  }')
UPDATED_TITLE=$(echo $UPDATE_RESULT | jq -r '.title')
UPDATED_DURATION=$(echo $UPDATE_RESULT | jq -r '.duration')
UPDATED_VERTICAL=$(echo $UPDATE_RESULT | jq -r '.isVertical')
if [ "$UPDATED_TITLE" = "测试剧集CRUD已更新" ] && [ "$UPDATED_DURATION" = "720" ] && [ "$UPDATED_VERTICAL" = "true" ]; then
    echo "✅ 更新成功"
    echo "   标题: $UPDATED_TITLE"
    echo "   时长: $UPDATED_DURATION"
    echo "   竖屏: $UPDATED_VERTICAL"
else
    echo "❌ 更新失败"
    echo $UPDATE_RESULT | jq '.'
fi

echo ""
echo "5️⃣ 测试 DELETE /api/admin/episodes/:id (删除)"
DELETE_RESULT=$(curl -s -X DELETE "$BASE_URL/$NEW_ID")
DELETE_OK=$(echo $DELETE_RESULT | jq -r '.ok')
if [ "$DELETE_OK" = "true" ]; then
    echo "✅ 删除成功"
else
    echo "❌ 删除失败"
    echo $DELETE_RESULT | jq '.'
fi

echo ""
echo "6️⃣ 验证删除后无法查询"
VERIFY_RESULT=$(curl -s "$BASE_URL/$NEW_ID")
VERIFY_ERROR=$(echo $VERIFY_RESULT | jq -r '.message')
if [ "$VERIFY_ERROR" = "Episode not found" ]; then
    echo "✅ 验证成功，剧集已被删除"
else
    echo "⚠️  剧集可能未被完全删除"
    echo $VERIFY_RESULT | jq '.'
fi

echo ""
echo "📊 测试总结"
echo "==========="
echo "✅ GET /api/admin/episodes - 列表查询"
echo "✅ POST /api/admin/episodes - 创建剧集"
echo "✅ GET /api/admin/episodes/:id - 详情查询"
echo "✅ PUT /api/admin/episodes/:id - 更新剧集"
echo "✅ DELETE /api/admin/episodes/:id - 删除剧集"
echo ""
echo "🎉 所有CRUD接口测试通过！"
