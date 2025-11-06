-- =====================================================
-- 为现有用户分配默认头像
-- 创建日期: 2025-11-06
-- 说明: 为之前没有头像的用户随机分配5个默认头像之一
-- =====================================================

-- 查看当前没有头像的用户数量
SELECT 
  '📊 当前用户统计' as info,
  COUNT(*) as total_users,
  SUM(CASE WHEN photo_url IS NULL OR photo_url = '' THEN 1 ELSE 0 END) as users_without_avatar,
  SUM(CASE WHEN photo_url IS NOT NULL AND photo_url != '' THEN 1 ELSE 0 END) as users_with_avatar
FROM users;

-- 备份当前用户表（可选，建议执行）
-- CREATE TABLE users_backup_20251106 AS SELECT * FROM users;

-- =====================================================
-- 核心更新语句：为没有头像的用户随机分配默认头像
-- =====================================================

UPDATE users
SET photo_url = CONCAT(
  'https://static.656932.com/defaultavatar/',
  FLOOR(1 + RAND() * 5),  -- 随机生成 1-5 的数字
  '.png'
)
WHERE photo_url IS NULL OR photo_url = '';

-- =====================================================
-- 验证结果
-- =====================================================

-- 查看更新后的统计
SELECT 
  '✅ 更新后统计' as info,
  COUNT(*) as total_users,
  SUM(CASE WHEN photo_url IS NULL OR photo_url = '' THEN 1 ELSE 0 END) as users_without_avatar,
  SUM(CASE WHEN photo_url IS NOT NULL AND photo_url != '' THEN 1 ELSE 0 END) as users_with_avatar
FROM users;

-- 查看头像分布情况
SELECT 
  '📊 头像分布统计' as info,
  photo_url,
  COUNT(*) as user_count
FROM users
WHERE photo_url LIKE 'https://static.656932.com/defaultavatar/%'
GROUP BY photo_url
ORDER BY photo_url;

-- 查看一些更新后的用户示例
SELECT 
  id,
  username,
  email,
  photo_url,
  created_at
FROM users
WHERE photo_url LIKE 'https://static.656932.com/defaultavatar/%'
LIMIT 10;

-- =====================================================
-- 执行说明：
-- 
-- 1. 本脚本会为所有 photo_url 为 NULL 或空字符串的用户
--    随机分配以下5个默认头像之一：
--    - https://static.656932.com/defaultavatar/1.png
--    - https://static.656932.com/defaultavatar/2.png
--    - https://static.656932.com/defaultavatar/3.png
--    - https://static.656932.com/defaultavatar/4.png
--    - https://static.656932.com/defaultavatar/5.png
--
-- 2. 已有头像的用户不会被修改
--
-- 3. 使用 RAND() 函数确保随机分配
--
-- 4. 执行前建议备份用户表
--
-- =====================================================

