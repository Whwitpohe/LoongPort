import { describe, expect, it } from "vitest";

import { preserveUntouchedRelayTierInfo } from "@/components/relay/preserveRelayTierInfo";
import type { RelayRow, TierInfo } from "@/lib/api/relay";

function tier(
  providerId: string,
  rateMultiplier: number | null,
  allowImageGeneration: boolean | null,
): TierInfo {
  return {
    providerId,
    groupId: 1,
    appId: "codex",
    groupName: providerId,
    keyName: `key-${providerId}`,
    displayName: providerId,
    model: "gpt-5.6-sol",
    models: ["gpt-5.6-sol"],
    rateMultiplier,
    isCurrent: false,
    userEdited: false,
    allowImageGeneration,
  };
}

function relay(id: number, siteOrigin: string, tiers: TierInfo[]): RelayRow {
  return {
    id,
    siteOrigin,
    siteName: `site-${id}`,
    accountLabel: `account-${id}`,
    loggedIn: true,
    sessionExpired: false,
    tiers,
  };
}

describe("单运营商刷新时保留其它运营商的分组信息", () => {
  it("目标运营商使用新值，其它运营商保留上一轮远端补全值", () => {
    const previous = [
      relay(1, "https://a.dev", [tier("a-1", 0.1, true)]),
      relay(2, "https://b.dev", [tier("b-1", 0.2, false)]),
    ];
    // listOperators 是纯本地读取：两行的这两个字段都会回到 null。
    const fresh = [
      relay(1, "https://a.dev", [tier("a-1", null, null)]),
      relay(2, "https://b.dev", [tier("b-1", null, null)]),
    ];

    const merged = preserveUntouchedRelayTierInfo(
      previous,
      fresh,
      "https://a.dev",
    );

    expect(merged[0].tiers[0]).toMatchObject({
      rateMultiplier: null,
      allowImageGeneration: null,
    });
    expect(merged[1].tiers[0]).toMatchObject({
      rateMultiplier: 0.2,
      allowImageGeneration: false,
    });
  });

  it("全量刷新直接采用新列表，不保留旧远端值", () => {
    const previous = [relay(1, "https://a.dev", [tier("a-1", 0.1, true)])];
    const fresh = [relay(1, "https://a.dev", [tier("a-1", null, null)])];

    expect(preserveUntouchedRelayTierInfo(previous, fresh)).toBe(fresh);
  });
});
