import { describe, expect, it } from "vitest";

import {
  filterChannelMonitorsByRelayForApp,
  filterChannelMonitorsForApp,
} from "@/components/relay/channelMonitorScope";
import type { ChannelMonitorInfo } from "@/lib/api/relay";

function monitor(monitorId: number, provider: string): ChannelMonitorInfo {
  return {
    monitorId,
    name: `${provider}-${monitorId}`,
    provider,
    groupName: "",
    primaryModel: "test-model",
    primaryStatus: "operational",
    primaryLatencyMs: 100,
    primaryPingLatencyMs: 10,
    availability7d: 100,
    timeline: [],
  };
}

describe("filterChannelMonitorsForApp", () => {
  const allProviders = [
    monitor(1, "openai"),
    monitor(2, "anthropic"),
    monitor(3, "gemini"),
    monitor(4, "grok"),
  ];

  it("does not show Claude health under Codex", () => {
    expect(
      filterChannelMonitorsForApp("codex", allProviders)?.map(
        (item) => item.monitorId,
      ),
    ).toEqual([1]);
    expect(
      filterChannelMonitorsForApp("claude", allProviders)?.map(
        (item) => item.monitorId,
      ),
    ).toEqual([2]);
  });

  it("handles known provider aliases and keeps unknown app scopes hidden", () => {
    expect(
      filterChannelMonitorsForApp("claude-desktop", [
        monitor(5, "Claude"),
      ])?.map((item) => item.monitorId),
    ).toEqual([5]);
    expect(
      filterChannelMonitorsForApp("grokbuild", [monitor(6, "xAI")])?.map(
        (item) => item.monitorId,
      ),
    ).toEqual([6]);
    expect(filterChannelMonitorsForApp("opencode", allProviders)).toEqual([]);
  });

  it("keeps the not-yet-loaded state distinct from an empty visible scope", () => {
    expect(filterChannelMonitorsForApp("codex", undefined)).toBeUndefined();
  });

  it("filters every operator row with the same active app scope", () => {
    expect(
      filterChannelMonitorsByRelayForApp("claude", {
        7: [monitor(7, "openai"), monitor(8, "anthropic")],
        9: [monitor(9, "anthropic")],
      }),
    ).toEqual({
      7: [monitor(8, "anthropic")],
      9: [monitor(9, "anthropic")],
    });
  });
});
