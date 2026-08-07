import { useEffect } from "react";

import { parseBalanceRowsKey } from "./balanceRowsKey";

/**
 * 对一组「行 id + 账号标签」立即执行一次任务，之后按固定间隔重复。
 *
 * 余额和渠道健康都依赖同一份已登录账号清单，但刷新频率不同。把定时器生命周期放在
 * 这一处，账号切换、卸载清理与慢请求防堆积就不会在两套轮询里逐渐分叉。
 */
export function useRowsPolling(
  rowsKey: string,
  load: (id: number, accountLabel: string) => Promise<void>,
  intervalMs: number,
): void {
  useEffect(() => {
    const rows = parseBalanceRowsKey(rowsKey);
    if (rows.length === 0) return;

    let polling = false;
    const poll = async () => {
      if (polling) return;
      polling = true;
      try {
        await Promise.all(
          rows.map(([id, accountLabel]) => load(id, accountLabel)),
        );
      } finally {
        polling = false;
      }
    };

    void poll();
    const interval = window.setInterval(() => void poll(), intervalMs);
    return () => window.clearInterval(interval);
  }, [rowsKey, load, intervalMs]);
}
