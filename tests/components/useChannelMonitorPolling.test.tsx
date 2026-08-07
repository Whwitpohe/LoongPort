import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { balanceRowsKey } from "@/components/operator/balanceRowsKey";
import {
  CHANNEL_MONITOR_POLL_INTERVAL_MS,
  useChannelMonitorPolling,
} from "@/components/operator/useChannelMonitorPolling";

describe("useChannelMonitorPolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads immediately and refreshes the heavier monitor response every 30 seconds", async () => {
    const load = vi.fn().mockResolvedValue(undefined);
    const rowsKey = balanceRowsKey([[7, "account-a"]]);

    renderHook(() => useChannelMonitorPolling(rowsKey, load));
    expect(CHANNEL_MONITOR_POLL_INTERVAL_MS).toBe(30_000);
    expect(load).toHaveBeenCalledTimes(1);
    expect(load).toHaveBeenLastCalledWith(7, "account-a");

    await act(async () => {
      await vi.advanceTimersByTimeAsync(CHANNEL_MONITOR_POLL_INTERVAL_MS - 1);
    });
    expect(load).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(load).toHaveBeenCalledTimes(2);
  });
});
