import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { balanceRowsKey } from "../../src/components/relay/balanceRowsKey";
import {
  BALANCE_POLL_INTERVAL_MS,
  useBalancePolling,
} from "../../src/components/relay/useBalancePolling";

describe("useBalancePolling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("loads every logged-in account immediately and again every 5 seconds", async () => {
    const loadBalance = vi.fn().mockResolvedValue(undefined);
    const rowsKey = balanceRowsKey([
      [11, "alpha"],
      [22, "beta"],
    ]);

    renderHook(() => useBalancePolling(rowsKey, loadBalance));

    expect(loadBalance.mock.calls).toEqual([
      [11, "alpha"],
      [22, "beta"],
    ]);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(BALANCE_POLL_INTERVAL_MS - 1);
    });
    expect(loadBalance).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(loadBalance.mock.calls.slice(2)).toEqual([
      [11, "alpha"],
      [22, "beta"],
    ]);
  });

  it("skips interval ticks while the previous balance request is still running", async () => {
    let finishFirstRequest!: () => void;
    const firstRequest = new Promise<void>((resolve) => {
      finishFirstRequest = resolve;
    });
    const loadBalance = vi
      .fn<() => Promise<void>>()
      .mockReturnValueOnce(firstRequest)
      .mockResolvedValue(undefined);

    renderHook(() =>
      useBalancePolling(balanceRowsKey([[11, "alpha"]]), loadBalance),
    );
    expect(loadBalance).toHaveBeenCalledTimes(1);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(BALANCE_POLL_INTERVAL_MS * 3);
    });
    expect(loadBalance).toHaveBeenCalledTimes(1);

    await act(async () => {
      finishFirstRequest();
      await firstRequest;
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(BALANCE_POLL_INTERVAL_MS);
    });
    expect(loadBalance).toHaveBeenCalledTimes(2);
  });

  it("stops polling after unmount", async () => {
    const loadBalance = vi.fn().mockResolvedValue(undefined);
    const { unmount } = renderHook(() =>
      useBalancePolling(balanceRowsKey([[11, "alpha"]]), loadBalance),
    );
    expect(loadBalance).toHaveBeenCalledTimes(1);

    unmount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(BALANCE_POLL_INTERVAL_MS * 2);
    });
    expect(loadBalance).toHaveBeenCalledTimes(1);
  });

  it("restarts immediately with the new account list when rows change", async () => {
    const loadBalance = vi.fn().mockResolvedValue(undefined);
    const firstRowsKey = balanceRowsKey([[11, "alpha"]]);
    const secondRowsKey = balanceRowsKey([[22, "beta"]]);
    const { rerender } = renderHook(
      ({ rowsKey }) => useBalancePolling(rowsKey, loadBalance),
      { initialProps: { rowsKey: firstRowsKey } },
    );

    expect(loadBalance).toHaveBeenLastCalledWith(11, "alpha");
    rerender({ rowsKey: secondRowsKey });
    expect(loadBalance).toHaveBeenLastCalledWith(22, "beta");
    expect(loadBalance).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(BALANCE_POLL_INTERVAL_MS - 1);
    });
    expect(loadBalance).toHaveBeenCalledTimes(2);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(1);
    });
    expect(loadBalance).toHaveBeenLastCalledWith(22, "beta");
    expect(loadBalance).toHaveBeenCalledTimes(3);
  });
});
