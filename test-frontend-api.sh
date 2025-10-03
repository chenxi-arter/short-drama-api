#!/bin/bash
set -e

BASE="http://127.0.0.1:8080"
EMAIL="smoke_test_$(date +%s)@example.com"
PASS="Test123456"

echo "========================================="
echo "前端API文档冒烟测试"
echo "========================================="
echo "BASE: $BASE"
echo "EMAIL: $EMAIL"
echo ""

# 1. 用户注册
echo ">>> 1. 邮箱注册 (POST /api/auth/register)"
REG_RESP=$(curl -s -X POST "$BASE/api/auth/register" \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASS\",
    \"confirmPassword\": \"$PASS\",
    \"username\": \"smoke_user\"
  }")
echo "$REG_RESP" | jq -C '.' || echo "$REG_RESP"
echo ""

# 2. 邮箱登录
echo ">>> 2. 邮箱登录 (POST /api/auth/email-login)"
LOGIN_RESP=$(curl -s -X POST "$BASE/api/auth/email-login" \
  -H 'Content-Type: application/json' \
  -d "{
    \"email\": \"$EMAIL\",
    \"password\": \"$PASS\"
  }")
echo "$LOGIN_RESP" | jq -C '.' || echo "$LOGIN_RESP"
TOKEN=$(echo "$LOGIN_RESP" | jq -r '.access_token // empty')
if [ -z "$TOKEN" ]; then
  echo "❌ 登录失败,未获取到 token"
  exit 1
fi
echo "✅ Token获取成功: ${TOKEN:0:20}..."
echo ""

# 3. 获取分类列表
echo ">>> 3. 获取分类列表 (GET /api/home/categories)"
CATEGORIES=$(curl -s "$BASE/api/home/categories")
echo "$CATEGORIES" | jq -C '.[:2]' || echo "$CATEGORIES"
CATEGORY_ID=$(echo "$CATEGORIES" | jq -r '.[0].id // 1')
echo "使用分类ID: $CATEGORY_ID"
echo ""

# 4. 获取首页数据
echo ">>> 4. 获取首页数据 (GET /api/home/gethomemodules)"
HOME_DATA=$(curl -s "$BASE/api/home/gethomemodules?channeid=$CATEGORY_ID&page=1")
echo "$HOME_DATA" | jq -C '.data.list[:2] | map({type,name})' || echo "$HOME_DATA" | head -20
echo ""

# 5. 获取筛选标签
echo ">>> 5. 获取筛选标签 (GET /api/list/getfilterstags)"
FILTER_TAGS=$(curl -s "$BASE/api/list/getfilterstags?channeid=$CATEGORY_ID")
echo "$FILTER_TAGS" | jq -C '.data[:2] | map({name, list: .list[:2]})' || echo "$FILTER_TAGS" | head -20
echo ""

# 6. 筛选数据
echo ">>> 6. 条件筛选 (GET /api/list/getfiltersdata)"
FILTER_DATA=$(curl -s "$BASE/api/list/getfiltersdata?channeid=$CATEGORY_ID&ids=0,0,0,0,0,0&page=1")
echo "$FILTER_DATA" | jq -C '.data | {total, page, size, itemCount: (.list | length)}' || echo "$FILTER_DATA" | head -20
SERIES_SHORT_ID=$(echo "$FILTER_DATA" | jq -r '.data.list[0].shortId // empty')
echo "使用系列ShortID: $SERIES_SHORT_ID"
echo ""

# 7. 获取剧集列表 (认证)
if [ -n "$SERIES_SHORT_ID" ]; then
  echo ">>> 7. 获取剧集列表-认证 (GET /api/video/episodes)"
  EPISODES=$(curl -s "$BASE/api/video/episodes?seriesShortId=$SERIES_SHORT_ID&page=1&size=3" \
    -H "Authorization: Bearer $TOKEN")
  echo "$EPISODES" | jq -C '.data | {seriesInfo: .seriesInfo.title, total, page, episodes: .list[:2] | map({shortId, episodeNumber, title, likeCount, dislikeCount, favoriteCount})}' || echo "$EPISODES" | head -30
  EP_SHORT_ID=$(echo "$EPISODES" | jq -r '.data.list[0].shortId // empty')
  EP_ACCESS_KEY=$(echo "$EPISODES" | jq -r '.data.list[0].episodeAccessKey // empty')
  URL_ACCESS_KEY=$(echo "$EPISODES" | jq -r '.data.list[0].urls[0].accessKey // empty')
  echo "Episode ShortID: $EP_SHORT_ID"
  echo "Episode AccessKey: ${EP_ACCESS_KEY:0:20}..."
  echo "URL AccessKey: ${URL_ACCESS_KEY:0:20}..."
  echo ""
  
  # 8. 获取播放地址
  if [ -n "$EP_ACCESS_KEY" ]; then
    echo ">>> 8. 获取播放地址 (POST /api/video/url/query)"
    URL_DATA=$(curl -s -X POST "$BASE/api/video/url/query" \
      -H "Authorization: Bearer $TOKEN" \
      -H 'Content-Type: application/json' \
      -d "{
        \"type\": \"episode\",
        \"accessKey\": \"$EP_ACCESS_KEY\"
      }")
    echo "$URL_DATA" | jq -C '. | {episodeShortId, urls: .urls | map({quality, accessKey: (.accessKey[:20] + "...")})[:2]}' || echo "$URL_DATA" | head -20
    echo ""
  fi
  
  # 9. 剧集交互 - 播放
  if [ -n "$EP_SHORT_ID" ]; then
    echo ">>> 9. 剧集交互-播放 (POST /api/video/episode/activity)"
    ACTIVITY_RESP=$(curl -s -X POST "$BASE/api/video/episode/activity" \
      -H "Authorization: Bearer $TOKEN" \
      -H 'Content-Type: application/json' \
      -d "{
        \"shortId\": \"$EP_SHORT_ID\",
        \"type\": \"play\"
      }")
    echo "$ACTIVITY_RESP" | jq -C '.' || echo "$ACTIVITY_RESP"
    echo ""
    
    # 10. 发表评论
    echo ">>> 10. 发表评论 (POST /api/video/episode/comment)"
    COMMENT_RESP=$(curl -s -X POST "$BASE/api/video/episode/comment" \
      -H "Authorization: Bearer $TOKEN" \
      -H 'Content-Type: application/json' \
      -d "{
        \"shortId\": \"$EP_SHORT_ID\",
        \"content\": \"冒烟测试评论 $(date +%H:%M:%S)\"
      }")
    echo "$COMMENT_RESP" | jq -C '.' || echo "$COMMENT_RESP"
    echo ""
    
    # 11. 获取评论列表
    echo ">>> 11. 获取评论列表 (GET /api/video/comments)"
    COMMENTS_RESP=$(curl -s "$BASE/api/video/comments?episodeShortId=$EP_SHORT_ID&page=1&size=5")
    echo "$COMMENTS_RESP" | jq -C '.data | {total, page, size, totalPages, commentCount: (.comments | length), firstComment: .comments[0]}' || echo "$COMMENTS_RESP" | head -30
    echo ""
    
    # 12. 记录观看进度
    echo ">>> 12. 记录观看进度 (POST /api/video/progress)"
    PROGRESS_RESP=$(curl -s -X POST "$BASE/api/video/progress" \
      -H "Authorization: Bearer $TOKEN" \
      -H 'Content-Type: application/json' \
      -d "{
        \"episodeIdentifier\": \"$EP_SHORT_ID\",
        \"stopAtSecond\": 120
      }")
    echo "$PROGRESS_RESP" | jq -C '.' || echo "$PROGRESS_RESP"
    echo ""
    
    # 13. 获取观看进度
    echo ">>> 13. 获取观看进度 (GET /api/video/progress)"
    PROGRESS_GET=$(curl -s "$BASE/api/video/progress?episodeIdentifier=$EP_SHORT_ID" \
      -H "Authorization: Bearer $TOKEN")
    echo "$PROGRESS_GET" | jq -C '.' || echo "$PROGRESS_GET"
    echo ""
  fi
fi

# 14. 获取浏览历史
echo ">>> 14. 获取浏览历史 (GET /api/video/browse-history)"
BROWSE_HISTORY=$(curl -s "$BASE/api/video/browse-history?page=1&size=5" \
  -H "Authorization: Bearer $TOKEN")
echo "$BROWSE_HISTORY" | jq -C '.data | {total, page, size, itemCount: (.list | length), firstItem: .list[0]}' || echo "$BROWSE_HISTORY" | head -30
echo ""

# 15. 模糊搜索
echo ">>> 15. 模糊搜索 (GET /api/list/fuzzysearch)"
SEARCH_RESP=$(curl -s "$BASE/api/list/fuzzysearch?keyword=总裁&page=1&size=5")
echo "$SEARCH_RESP" | jq -C '.data | {total, page, size, hasMore, itemCount: (.list | length)}' || echo "$SEARCH_RESP" | head -20
echo ""

# 16. 获取用户信息
echo ">>> 16. 获取用户信息 (GET /api/user/me)"
USER_INFO=$(curl -s "$BASE/api/user/me" \
  -H "Authorization: Bearer $TOKEN")
echo "$USER_INFO" | jq -C '.' || echo "$USER_INFO"
echo ""

echo "========================================="
echo "✅ 冒烟测试完成!"
echo "========================================="

