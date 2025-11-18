# 用户昵称生成逻辑

## 问题背景

之前 Telegram 用户注册后，评论中会直接显示 `username`（格式为 `tg123456789`），用户体验不佳。

## 解决方案

在用户注册时自动生成默认昵称（`nickname` 字段），优先级如下：

### 昵称生成优先级

1. **first_name + last_name**（最优先）
   - 如果用户有 Telegram 姓名，使用姓名组合
   - 示例：`John Doe`、`张三`、`Alice`

2. **Telegram username**（次优先）
   - 如果没有姓名但有 username，使用 username
   - 自动去除 `@` 符号
   - 示例：`john_doe`、`alice123`

3. **"用户xxxx"**（兜底方案）
   - 如果以上都没有，生成 "用户" + Telegram ID 后4位
   - 示例：`用户6789`、`用户4321`

## 代码实现

位置：`src/user/user.service.ts` - `createNewUser()` 方法

```typescript
const generateDefaultNickname = (): string => {
  // 1. 优先使用 first_name + last_name
  const firstName = userData.first_name?.trim() || '';
  const lastName = userData.last_name?.trim() || '';
  const fullName = [firstName, lastName].filter(Boolean).join(' ');
  
  if (fullName) {
    return fullName;
  }
  
  // 2. 如果有 Telegram username，使用它（去掉 @ 符号）
  const tgUsername = userData.username?.trim();
  if (tgUsername) {
    return tgUsername.startsWith('@') ? tgUsername.slice(1) : tgUsername;
  }
  
  // 3. 最后生成 "用户" + 后4位ID
  const shortId = String(userData.id).slice(-4);
  return `用户${shortId}`;
};
```

## 显示逻辑

### 评论接口

评论接口返回两个字段：
- `username`：数据库中的 username（格式为 `tg123456789` 或 Telegram username）
- `nickname`：自动生成的昵称

前端应优先显示 `nickname`，如果为空则显示 `username`。

### `/me` 接口

`/me` 接口的 `nickname` 字段有更复杂的计算逻辑（见 `user.controller.ts`）：
1. 如果用户手动设置了 `nickname`，使用用户设置的值
2. 否则使用 `first_name + last_name` 组合
3. 最后兜底使用 `username`

## 测试

运行测试脚本验证逻辑：

```bash
node test-nickname-generation.js
```

## 影响范围

- ✅ 新注册的 Telegram 用户会自动获得友好的昵称
- ✅ 评论显示更加友好
- ⚠️ 已注册的老用户不受影响（需要单独迁移脚本）

## 后续优化建议

1. 为已存在的用户批量生成昵称（数据迁移脚本）
2. 允许用户在设置中修改昵称
3. 考虑昵称唯一性检查（如果需要）
