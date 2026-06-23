-- 修正历史游客用户名过长问题
-- 旧逻辑会生成 username = guest_${guestToken}，而 guestToken 已包含 guest_ 前缀，导致 guest_guest_xxx
-- 2026-06-23

UPDATE users
SET username = CONCAT('guest_', LPAD(id, 6, '0'))
WHERE is_guest = 1
  AND username LIKE 'guest_guest_%';
