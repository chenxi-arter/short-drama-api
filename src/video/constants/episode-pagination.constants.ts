/**
 * 剧集列表分页上限
 *
 * 背景：部分短剧一季有 400~500 集，原先 `size` 被硬夹在 200，
 * 前端拿不全剧集，只能靠翻页拼，体验和数据一致性都不好。
 *
 * 策略：
 * - 指定了具体系列（seriesShortId / seriesId）：上限 1000。
 *   足够覆盖当前已知最长剧集，并留了约 2 倍冗余；仍保留上限是为了
 *   防止单次响应过大（每集还带 urls、互动数、评论数）。
 * - 未指定系列（全站剧集流）：保持 200，避免公开接口被用来一次拉全库。
 *
 * 超出上限不会被静默截断——`total` / `hasMore` 仍按真实总数计算，
 * 前端发现 hasMore=true 时继续翻页即可。
 */
export const MAX_SERIES_EPISODES_PAGE_SIZE = 1000;

export const MAX_GLOBAL_EPISODES_PAGE_SIZE = 200;

/**
 * 依据是否指定了系列，返回该次请求允许的每页最大条数
 * @param hasSeries 是否传了 seriesShortId 或 seriesId
 */
export function resolveEpisodePageSizeLimit(hasSeries: boolean): number {
  return hasSeries ? MAX_SERIES_EPISODES_PAGE_SIZE : MAX_GLOBAL_EPISODES_PAGE_SIZE;
}
