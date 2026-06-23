#!/bin/bash

echo "========================================="
echo "1. 用户登录"
echo "========================================="

LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/email-login \
  -H "Content-Type: application/json" \
  -d '{"email":"user1@test.com","password":"Pass123456"}')

echo "$LOGIN_RESPONSE" | jq '.'

TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.access_token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "登录失败，无法获取token"
  exit 1
fi

echo ""
echo "获取到的 Token: $TOKEN"
echo ""

echo "========================================="
echo "2. 第一次心跳检测"
echo "========================================="
HEARTBEAT1=$(curl -s -X POST http://localhost:3000/api/user/heartbeat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")
echo "$HEARTBEAT1" | jq '.'
echo ""

sleep 1

echo "========================================="
echo "3. 第二次心跳检测"
echo "========================================="
HEARTBEAT2=$(curl -s -X POST http://localhost:3000/api/user/heartbeat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")
echo "$HEARTBEAT2" | jq '.'
echo ""

sleep 1

echo "========================================="
echo "4. 第三次心跳检测"
echo "========================================="
HEARTBEAT3=$(curl -s -X POST http://localhost:3000/api/user/heartbeat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")
echo "$HEARTBEAT3" | jq '.'
echo ""

echo "========================================="
echo "测试完成"
echo "========================================="
