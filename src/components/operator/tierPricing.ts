/**
 * 把站点的扣费倍率换成用户实际支付口径的倍率。
 *
 * 充值手续费明确不参与：支付 1 单位到账 `rechargeMultiplier` 余额，而消耗官方 $1
 * 要扣 `rateMultiplier` 余额，所以实际倍率就是二者相除。
 */
export function calculateActualRateMultiplier(
  rateMultiplier: number | null,
  rechargeMultiplier: number | null | undefined,
): number | null {
  if (
    rateMultiplier === null ||
    !Number.isFinite(rateMultiplier) ||
    rateMultiplier < 0 ||
    rechargeMultiplier === null ||
    rechargeMultiplier === undefined ||
    !Number.isFinite(rechargeMultiplier) ||
    rechargeMultiplier <= 0
  ) {
    return null;
  }

  const actual = rateMultiplier / rechargeMultiplier;
  return Number.isFinite(actual) ? actual : null;
}

/** 最多显示 4 位有效数字，避免 0.08 / 0.14 直接露出一长串浮点数。 */
export function formatRateMultiplier(value: number): string {
  return Number(value.toPrecision(4)).toString();
}
