import type { RelayRow } from "@/lib/api/relay";

/**
 * 单站刷新时，保留其它中转站上一轮从服务端补全的档位信息。
 *
 * `relay_list_relays` 是纯本地读取，`rateMultiplier` 与
 * `allowImageGeneration` 都会回到 null。调用方随后只会重新查询 `onlySite`，所以若直接
 * 用 fresh 覆盖整表，其它运营商的信息会一直丢到下一次全局刷新。
 */
export function preserveUntouchedRelayTierInfo(
  previous: RelayRow[],
  fresh: RelayRow[],
  onlySite?: string,
): RelayRow[] {
  if (!onlySite) return fresh;

  const previousById = new Map(previous.map((row) => [row.id, row]));
  return fresh.map((row) => {
    if (row.siteOrigin === onlySite) return row;
    const old = previousById.get(row.id);
    if (!old) return row;
    const oldTiers = new Map(old.tiers.map((tier) => [tier.providerId, tier]));
    return {
      ...row,
      tiers: row.tiers.map((tier) => {
        const oldTier = oldTiers.get(tier.providerId);
        return oldTier
          ? {
              ...tier,
              rateMultiplier: oldTier.rateMultiplier,
              allowImageGeneration: oldTier.allowImageGeneration,
            }
          : tier;
      }),
    };
  });
}
