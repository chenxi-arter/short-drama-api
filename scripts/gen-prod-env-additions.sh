#!/usr/bin/env bash
#
# 生成「线上 .env 需要新增的安全配置」可粘贴块
#
# 用法：
#   bash scripts/gen-prod-env-additions.sh
#   bash scripts/gen-prod-env-additions.sh >> .env      # 直接追加（先自己备份）
#
# 特点：
# - 每次运行都现场用 openssl 生成新密钥，不把任何密钥写进仓库
# - 只输出「需要新增」的字段，SHORT_IO_API_KEY 留空由你填（无法生成）
#
set -euo pipefail

gen() {
  # 48 字节随机 → base64（约 64 字符），满足 >=16 位要求
  openssl rand -base64 48 | tr -d '\n'
}

cat <<EOF
# ===========================================
# 安全配置（2026-10 审计整改后新增）
# 追加到线上 .env 后重启进程；缺任何一项都会拒绝启动
# ===========================================

# --- 三把必需密钥（openssl rand -base64 48 生成）---
# 注意：若线上原有 JWT_SECRET，先把它复制成 JWT_SECRET_LEGACY 再替换，
#      否则所有已登录用户会掉线（详见 JWT_MIGRATION_GUIDE.md）
JWT_SECRET=$(gen)

# 管理员 token 独立密钥：必填，且必须与 JWT_SECRET 不同
# 以前可回退到 JWT_SECRET，现已取消回退
ADMIN_JWT_SECRET=$(gen)

# 播放地址 accessKey 的 HMAC 密钥
# 更换只影响「新入库」的 accessKey，库中已存的值不会变
APP_SECRET=$(gen)

# --- 短链（必需）---
# 去 https://app.short.io/ 后台获取。
# ⚠️ 旧代码里有硬编码兜底 key，已删除；不配这里，POST /api/short-links 会 500。
# ⚠️ 若你之前用的是仓库里那把（git 历史可见），视为已泄露，请到后台重新签发。
SHORT_IO_API_KEY=

# 短链默认域名（不填则用 xgtv.short.gy）
SHORT_IO_DEFAULT_DOMAIN=xgtv.short.gy

# 允许生成短链的目标域名白名单（逗号分隔，支持 *.example.com 通配）
# 不填 = 任何 HTTPS 地址都能建短链（开放重定向风险），启动日志会告警
SHORT_LINK_ALLOWED_DOMAINS=t.me,telegram.me,telegram.org

# --- 可选：仅灰度过渡期使用 ---
# 配置后，用旧密钥签发的 token 仍然有效；迁移完成后请删除这两行
# JWT_SECRET_LEGACY=<线上原来的 JWT_SECRET>
# ADMIN_JWT_SECRET_LEGACY=<线上原来的 ADMIN_JWT_SECRET>
EOF
