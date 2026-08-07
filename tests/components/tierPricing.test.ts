import { describe, expect, it } from "vitest";

import {
  calculateActualRateMultiplier,
  formatRateMultiplier,
} from "@/components/operator/tierPricing";

describe("运营商实际倍率", () => {
  it("只除充值到账比例，不计算手续费", () => {
    expect(calculateActualRateMultiplier(0.08, 0.14)).toBeCloseTo(0.5714285714);
    expect(formatRateMultiplier(0.08 / 0.14)).toBe("0.5714");
  });

  it("1:1 充值时实际倍率等于扣费倍率", () => {
    expect(calculateActualRateMultiplier(0.08, 1)).toBe(0.08);
  });

  it("比例缺失或无效时不伪造实际倍率", () => {
    expect(calculateActualRateMultiplier(0.08, null)).toBeNull();
    expect(calculateActualRateMultiplier(0.08, 0)).toBeNull();
    expect(calculateActualRateMultiplier(0.08, Number.NaN)).toBeNull();
  });
});
