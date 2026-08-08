import { useRowsPolling } from "./useRowsPolling";

/**
 * 渠道监控本身通常约一分钟检测一次，而且列表响应带时间线、明显比余额响应大。
 * 30 秒刷新能及时看到新一轮结果，同时避免按余额的 5 秒频率重复下载同一份数据。
 */
export const CHANNEL_MONITOR_POLL_INTERVAL_MS = 30_000;

export function useChannelMonitorPolling(
  rowsKey: string,
  loadChannelMonitors: (id: number, accountLabel: string) => Promise<void>,
): void {
  useRowsPolling(
    rowsKey,
    loadChannelMonitors,
    CHANNEL_MONITOR_POLL_INTERVAL_MS,
  );
}
