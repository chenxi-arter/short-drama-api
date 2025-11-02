-- =====================================================
-- 更新短剧剧集的互动数据（点赞、收藏、播放数）
-- 执行时间：2025-11-02
-- 说明：只更新 category_id=1 的短剧数据
-- 说明：评论数不更新（通过API真实生成）
-- =====================================================

-- 1. 更新剧集的互动数据（随机生成，看起来真实，适配推荐算法）
UPDATE episodes e
INNER JOIN series s ON e.series_id = s.id
SET 
  -- 点赞数：20-1500之间的随机数（热门剧多一些，但不会太夸张）
  e.like_count = CASE 
    WHEN RAND() > 0.8 THEN FLOOR(800 + RAND() * 700)   -- 20%是热门剧（800-1500赞）
    WHEN RAND() > 0.5 THEN FLOOR(200 + RAND() * 600)   -- 30%是中等（200-800赞）
    ELSE FLOOR(20 + RAND() * 180)                       -- 50%是普通（20-200赞）
  END,
  
  -- 点踩数：0-20之间，很少（点踩通常少）
  e.dislike_count = FLOOR(0 + RAND() * 20),
  
  -- 收藏数：点赞数的8%-15%（收藏比点赞少，最高不超过200）
  e.favorite_count = LEAST(
    FLOOR(
      CASE 
        WHEN RAND() > 0.8 THEN (800 + RAND() * 700) * (0.08 + RAND() * 0.07)   -- 热门剧：64-225 → 最高200
        WHEN RAND() > 0.5 THEN (200 + RAND() * 600) * (0.08 + RAND() * 0.07)   -- 中等：16-120
        ELSE (20 + RAND() * 180) * (0.08 + RAND() * 0.07)                       -- 普通：1-30
      END
    ),
    200  -- 最高不超过200
  ),
  
  -- 播放数：点赞数的3-8倍（播放多于点赞）
  e.play_count = FLOOR(
    CASE 
      WHEN RAND() > 0.8 THEN (800 + RAND() * 700) * (3 + RAND() * 5)
      WHEN RAND() > 0.5 THEN (200 + RAND() * 600) * (3 + RAND() * 5)
      ELSE (20 + RAND() * 180) * (3 + RAND() * 5)
    END
  )

WHERE s.category_id = 1 
  AND e.status = 'published';


-- 2. 确保第1集的数据通常比较高（第1集播放最多）
UPDATE episodes e
INNER JOIN series s ON e.series_id = s.id
SET 
  e.like_count = FLOOR(e.like_count * 1.5),
  e.favorite_count = FLOOR(e.favorite_count * 1.3),
  e.play_count = FLOOR(e.play_count * 2)
WHERE s.category_id = 1 
  AND e.episode_number = 1
  AND e.status = 'published';


-- 3. 更新系列的总播放数（所有剧集播放数之和）
UPDATE series s
SET s.play_count = (
  SELECT COALESCE(SUM(e.play_count), 0)
  FROM episodes e
  WHERE e.series_id = s.id
    AND e.status = 'published'
)
WHERE s.category_id = 1;


-- 4. 显示统计结果
SELECT 
  '📊 短剧互动数据统计' as summary,
  COUNT(e.id) as total_episodes,
  FLOOR(AVG(e.like_count)) as avg_likes,
  FLOOR(AVG(e.favorite_count)) as avg_favorites,
  FLOOR(AVG(e.play_count)) as avg_plays,
  MAX(e.like_count) as max_likes,
  MIN(e.like_count) as min_likes
FROM episodes e
INNER JOIN series s ON e.series_id = s.id
WHERE s.category_id = 1 
  AND e.status = 'published';


-- 5. 查看前10个最热门的剧集
SELECT 
  e.short_id,
  s.title as series_title,
  e.episode_number,
  e.like_count,
  e.favorite_count,
  e.play_count
FROM episodes e
INNER JOIN series s ON e.series_id = s.id
WHERE s.category_id = 1 
  AND e.status = 'published'
ORDER BY e.like_count DESC
LIMIT 10;


-- =====================================================
-- 执行完成！
-- 说明：
-- - like_count: 20-1500 之间（适配推荐算法）
--   * 20% 热门：800-1500
--   * 30% 中等：200-800
--   * 50% 普通：20-200
-- - favorite_count: 最高200（点赞数的8%-15%）
-- - play_count: 点赞数的3-8倍
-- - 第1集数据通常更高（符合真实情况）
-- - comment_count: 不更新（保持真实数据）
--
-- ⚠️ 推荐算法平衡性说明：
-- 如果点赞数范围太大（如20-5000），会导致：
-- - 热门剧（5000赞）推荐分数：7500-26000
-- - 普通剧（100赞）推荐分数：50-950
-- - 结果：推荐流会被热门剧霸榜，普通剧没机会展示
--
-- 当前设置（20-1500）保证：
-- - 随机因子(0-500)和新鲜度(0-300)仍有显著影响
-- - 新内容和普通内容也有机会被推荐
-- - 推荐流更加多样化
-- =====================================================

