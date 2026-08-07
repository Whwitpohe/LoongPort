import type { ChannelMonitorInfo } from "@/lib/api/operator";

/**
 * 应用标签和渠道监控 Provider 的一对一对应关系。
 *
 * `/channel-monitors` 是一个运营商账号下的全量列表，而运营商页面一次只展示一个
 * 应用类别。这里宁可让无法确定归属的类别暂时不显示健康卡，也不能把 Claude、Gemini
 * 等监控混到 Codex 下面。
 */
const PROVIDERS_BY_APP: Readonly<Record<string, readonly string[]>> = {
  codex: ["openai"],
  "codex-image": ["openai"],
  claude: ["anthropic", "claude"],
  "claude-desktop": ["anthropic", "claude"],
  gemini: ["gemini", "google"],
  grokbuild: ["grok", "xai"],
};

function normalizedProvider(value: string): string {
  return value.trim().toLowerCase();
}

/**
 * 仅保留当前应用类别可以使用的监控项。
 *
 * 返回 `undefined` 表示这家运营商尚未成功拉到健康数据；空数组表示已拉到数据但当前
 * 类别没有可安全展示的 Provider，二者都会让健康面板保持隐藏。
 */
export function filterChannelMonitorsForApp(
  appId: string,
  monitors: readonly ChannelMonitorInfo[] | undefined,
): ChannelMonitorInfo[] | undefined {
  if (monitors === undefined) return undefined;

  const providers = PROVIDERS_BY_APP[appId];
  if (!providers) return [];

  const allowed = new Set(providers);
  return monitors.filter((monitor) =>
    allowed.has(normalizedProvider(monitor.provider)),
  );
}

/** 按运营商行过滤完整的健康快照字典，供当前应用页直接传给列表组件。 */
export function filterChannelMonitorsByOperatorForApp(
  appId: string,
  monitorsByOperator: Readonly<
    Record<number, readonly ChannelMonitorInfo[] | undefined>
  >,
): Record<number, ChannelMonitorInfo[] | undefined> {
  const scoped: Record<number, ChannelMonitorInfo[] | undefined> = {};
  for (const [operatorId, monitors] of Object.entries(monitorsByOperator)) {
    scoped[Number(operatorId)] = filterChannelMonitorsForApp(appId, monitors);
  }
  return scoped;
}
