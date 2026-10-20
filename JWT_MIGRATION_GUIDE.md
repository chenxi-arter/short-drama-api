# JWT 密钥平滑迁移指南

## 🎯 目标

修复弱 JWT 密钥安全漏洞（H1/C1/C2），同时**不影响现有用户登录状态**。

---

## ✅ 已完成的代码修改

> 2026-10-20 修正：上一版实现覆写了 `JwtStrategy.authenticate()` 直接 `this.success(payload)`，
> 会绕过 passport-jwt 的 `_verify` 回调 → `validate()` 不执行 → `req.user` 退化成原始 payload，
> 全站 `req.user.userId` 变 `undefined`。现已改为 `secretOrKeyProvider` 只负责「选密钥」。

### 1. 用户 JWT 验证（JwtStrategy）
- **文件：** `src/auth/strategies/jwt.strategy.ts`
- **机制：** `secretOrKeyProvider` 内先用新密钥试签，失败再试旧密钥；验签与 `validate()` 仍由 passport-jwt 完成
- **效果：** 新旧 token 都能正常使用，且 `req.user = { userId }` 与改造前一致

### 2. 管理员 JWT 验证（AdminJwtAuthGuard）
- **文件：** `src/admin/guards/admin-jwt-auth.guard.ts`
- **机制：** 同上，先新后旧；管理员密钥独立，不再回退 `JWT_SECRET`
- **效果：** 管理员不会掉线，且用户密钥无法签出管理员 token

### 3. ⚠️ 旧密钥必须显式配置
代码里**不再有** `|| 'very-secret-key'` 这类硬编码兜底。因此：

- 配了 `JWT_SECRET_LEGACY` / `ADMIN_JWT_SECRET_LEGACY` → 旧 token 继续有效（过渡期）
- **不配** → 旧 token 立刻失效，用户需重新登录（安全性最好，也是推荐做法）

---

## 📝 配置步骤（零停机迁移）

### 步骤 1：更新 .env 文件

在 `.env` 文件中添加**新密钥**，同时保留旧密钥作为后备：

```bash
# === JWT 密钥配置 ===

# 新的强密钥（立即生效，新登录使用）
# 用 `openssl rand -base64 48` 现场生成，不要复制任何文档或聊天记录里的值
JWT_SECRET=<openssl rand -base64 48 的输出①>
ADMIN_JWT_SECRET=<openssl rand -base64 48 的输出②，必须与 JWT_SECRET 不同>

# 旧密钥（过渡期保留，兼容现有 token）
# 只在迁移期间填写；填的就是线上原来那把（例如 very-secret-key）
JWT_SECRET_LEGACY=<线上旧 JWT_SECRET>
ADMIN_JWT_SECRET_LEGACY=<线上旧 ADMIN_JWT_SECRET，若原本没有则留空>

# 应用密钥（用于 accessKey 生成）
APP_SECRET=<openssl rand -base64 48 的输出③>
```

> ⚠️ 本文档曾直接写出三把真实密钥，已全部替换为占位符。
> 如果你之前照着旧版本文档把那些值配进了环境，**视为已泄露，请重新轮换**。

### 步骤 2：重启服务

```bash
# 重新构建
npm run build

# 重启服务
npm run start:dev  # 或 pm2 restart all
```

### 步骤 3：验证迁移成功

```bash
# 测试：现有用户的旧 token 仍然有效
curl -H "Authorization: Bearer 旧token" http://localhost:8080/api/user/profile

# 测试：新登录的用户获得新 token
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"123456"}'
```

---

## ⏰ 过渡期计划

### 阶段 1：双密钥运行（7-30天）

**当前状态：** 新旧 token 都能使用

- ✅ 现有用户无感知，继续使用旧 token
- ✅ 新登录用户获得新密钥签发的 token
- ✅ 服务器日志会显示哪些用户还在用旧 token
- ⚠️ 旧密钥仍然可以被攻击者滥用（所以要尽快完成过渡）

**监控日志：**
```bash
# 查看有多少用户还在使用旧密钥
pm2 logs | grep "使用旧密钥验证成功"
```

### 阶段 2：移除旧密钥（过渡期结束后）

**时机：** 当绝大多数用户都已自然更新 token 后（建议 7-30 天）

**操作：**

1. 从 `.env` 删除旧密钥：
   ```bash
   # 删除或注释掉这两行
   # JWT_SECRET_LEGACY=very-secret-key
   # ADMIN_JWT_SECRET_LEGACY=very-secret-key
   ```

2. 重启服务：
   ```bash
   npm run build
   pm2 restart all
   ```

3. 此时仍然使用旧 token 的用户会被要求重新登录

---

## 🔒 迁移效果

### 立即生效（阶段1）
- ✅ **新登录用户** → 使用新密钥，安全
- ✅ **现有用户** → 继续使用旧 token，无感知
- ⚠️ **攻击者** → 仍可伪造 token（因为旧密钥还在）

### 完全修复（阶段2）
- ✅ **所有用户** → 都使用新密钥
- ✅ **攻击者** → 无法再伪造 token
- ⚠️ **少数用户** → 需要重新登录（使用旧 token 的）

---

## 📊 迁移进度跟踪

### 查看还有多少用户在使用旧 token

```bash
# 实时监控
pm2 logs | grep -i "旧密钥"

# 统计数量（最近24小时）
pm2 logs --lines 10000 | grep "使用旧密钥验证成功" | wc -l
```

### 建议的过渡期时长

| 用户活跃度 | 建议过渡期 | 说明 |
|-----------|-----------|------|
| 高活跃（每天都登录） | 7天 | 用户会频繁刷新 token |
| 中活跃（每周登录） | 14-21天 | 给用户足够时间自然更新 |
| 低活跃（偶尔登录） | 30天+ | 确保大部分用户都更新了 |

根据你的 JWT 过期时间（`JWT_EXPIRES_IN=7d`），建议**至少 7 天**过渡期。

---

## 🚨 紧急情况处理

### 如果发现攻击者正在滥用旧密钥

**立即行动：** 跳过过渡期，直接删除旧密钥

```bash
# 1. 从 .env 删除 JWT_SECRET_LEGACY
# 2. 重启服务
pm2 restart all

# 3. 通知用户
# 在前端显示："为了您的账户安全，请重新登录"
```

### 如果误删除旧密钥导致大量用户掉线

**恢复步骤：**

```bash
# 1. 在 .env 恢复旧密钥
JWT_SECRET_LEGACY=very-secret-key
ADMIN_JWT_SECRET_LEGACY=very-secret-key

# 2. 重启服务
pm2 restart all
```

---

## 📋 检查清单

### 部署前
- [x] 代码已修改（JwtStrategy 和 AdminJwtAuthGuard）
- [ ] `.env` 文件已更新（新旧密钥都配置）
- [ ] 已备份当前 `.env` 文件
- [ ] 已通知运维团队

### 部署时
- [ ] 构建成功（`npm run build`）
- [ ] 服务重启成功
- [ ] 测试现有 token 仍然有效
- [ ] 测试新登录获得新 token
- [ ] 查看日志确认双密钥机制工作正常

### 过渡期中
- [ ] 每天检查日志，统计旧 token 使用量
- [ ] 旧 token 使用率降到 5% 以下
- [ ] 过渡期至少 7 天

### 过渡期结束
- [ ] 删除 `.env` 中的旧密钥配置
- [ ] 重启服务
- [ ] 在前端添加"请重新登录"提示
- [ ] 监控用户登录量是否正常

---

## 💡 额外优化建议

### 1. 前端优化

在前端检测 token 过期，自动引导用户刷新：

```javascript
// 如果 API 返回 401
if (response.status === 401) {
  // 尝试刷新 token
  const newToken = await refreshToken();
  
  if (!newToken) {
    // 刷新失败，引导用户重新登录
    showMessage('登录已过期，请重新登录');
    redirectToLogin();
  }
}
```

### 2. 主动通知用户

在管理后台添加公告：

```
【安全升级】为保障账户安全，系统已升级加密算法。
如遇登录异常，请退出后重新登录。感谢您的理解！
```

### 3. Token 自动续期

如果用户活跃，可以在 token 快过期时自动刷新：

```typescript
// 在 JwtStrategy 的 validate 方法中
async validate(payload: any) {
  const userId = typeof payload.sub === 'string' ? parseInt(payload.sub, 10) : payload.sub;
  
  // 检查 token 是否快过期（比如还有1天）
  const expiresIn = payload.exp - Math.floor(Date.now() / 1000);
  if (expiresIn < 86400) { // 24小时
    // 标记为需要刷新
    return { userId, shouldRefresh: true };
  }
  
  return { userId };
}
```

---

## 🎯 总结

### 这个方案的优势

1. ✅ **零停机** - 用户无感知
2. ✅ **安全可控** - 逐步淘汰旧密钥
3. ✅ **可回退** - 出问题可以立即恢复
4. ✅ **可监控** - 随时了解迁移进度

### 迁移时间线

```
第 0 天：部署双密钥代码，新旧 token 都能用
第 1-7 天：用户自然更新 token
第 7 天：检查日志，旧 token 使用率应降到 20% 以下
第 14 天：旧 token 使用率应降到 5% 以下
第 14-30 天：移除旧密钥，少数用户需重新登录
```

### 关键指标

- **目标：** 95% 用户无感知完成迁移
- **代价：** 最多 5% 用户需要重新登录
- **安全性：** 过渡期结束后完全修复漏洞

---

## 📞 需要帮助？

- 查看日志：`pm2 logs | grep -i jwt`
- 监控旧 token：`pm2 logs | grep "使用旧密钥"`
- 回滚方案：恢复 `.env` 中的旧密钥配置

---

**更新时间：** 2026-08-06  
**状态：** 阶段 1 - 双密钥运行期  
**下一步：** 监控 7-14 天后移除旧密钥
