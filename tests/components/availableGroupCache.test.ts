import { describe, expect, it } from "vitest";

import {
  loadAvailableGroupCache,
  mergeAvailableGroupRefreshes,
  saveAvailableGroupCache,
} from "@/components/operator/availableGroupCache";
import type { AvailableGroupInfo, ProvisionSummary } from "@/lib/api/operator";

function group(
  groupId: number,
  groupName: string,
  appId: AvailableGroupInfo["appId"] = "codex",
): AvailableGroupInfo {
  return {
    groupId,
    groupName,
    appId,
    rateMultiplier: 1,
    balanceRechargeMultiplier: 0.14,
    allowImageGeneration: false,
  };
}

function summary(...availableGroups: AvailableGroupInfo[]): ProvisionSummary {
  return { tiers: [], availableGroups, failures: [], keysCreated: 0 };
}

describe("刷新结果合并到分组下拉缓存", () => {
  it("刷新单个运营商不会清掉其它运营商", () => {
    const current = {
      1: [group(1, "A-old")],
      2: [group(2, "B-keep")],
    };

    const merged = mergeAvailableGroupRefreshes(
      current,
      [[1, summary(group(3, "A-new"))]],
      "codex",
    );

    expect(merged[1].map((item) => item.groupName)).toEqual(["A-new"]);
    expect(merged[2]).toEqual(current[2]);
  });

  it("重新进入页面时能从本地存储恢复", () => {
    const values = new Map<string, string>();
    const storage = {
      get length() {
        return values.size;
      },
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: (index: number) => [...values.keys()][index] ?? null,
      removeItem: (key: string) => void values.delete(key),
      setItem: (key: string, value: string) => void values.set(key, value),
    } satisfies Storage;
    const current = { 7: [group(42, "持久化分组")] };

    saveAvailableGroupCache("codex", current, storage);

    expect(loadAvailableGroupCache("codex", storage)).toEqual(current);
    expect(loadAvailableGroupCache("claude", storage)).toEqual({});
  });

  it("兼容升级前没有充值比例的缓存，但不伪造为 1:1", () => {
    const storage = {
      length: 1,
      clear: () => undefined,
      getItem: () =>
        JSON.stringify({
          7: [
            {
              groupId: 42,
              groupName: "旧缓存",
              appId: "codex",
              rateMultiplier: 0.08,
              allowImageGeneration: false,
            },
          ],
        }),
      key: () => null,
      removeItem: () => undefined,
      setItem: () => undefined,
    } satisfies Storage;

    expect(loadAvailableGroupCache("codex", storage)[7][0]).toMatchObject({
      groupName: "旧缓存",
      balanceRechargeMultiplier: null,
    });
  });

  it("一次 provision 返回多平台分组，但只写入当前 tab", () => {
    const merged = mergeAvailableGroupRefreshes(
      {},
      [[1, summary(group(1, "Codex", "codex"), group(2, "Claude", "claude"))]],
      "claude",
    );

    expect(merged[1].map((item) => item.groupName)).toEqual(["Claude"]);
  });
});
