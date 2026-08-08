import { useRowsPolling } from "./useRowsPolling";

/** 页面停留期间每 5 秒刷新一次已登录账号的余额。 */
export const BALANCE_POLL_INTERVAL_MS = 5_000;

/**
 * 立即拉一次余额，随后固定间隔轮询。
 *
 * `rowsKey` 同时是稳定依赖与账号身份快照；账号或行列表变化时会清掉旧定时器、立即按
 * 新清单请求。上一轮尚未结束时跳过本次 tick，避免慢网络下请求无限堆积。
 */
export function useBalancePolling(
  rowsKey: string,
  loadBalance: (id: number, accountLabel: string) => Promise<void>,
): void {
  useRowsPolling(rowsKey, loadBalance, BALANCE_POLL_INTERVAL_MS);
}
