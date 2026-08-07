import type { AppId } from "@/lib/api";
import type { AvailableGroupInfo, ProvisionSummary } from "@/lib/api/operator";

export type AvailableGroupsByOperator = Record<number, AvailableGroupInfo[]>;

const STORAGE_PREFIX = "loongport.available-groups.v1";

function storageKey(appId: AppId): string {
  return `${STORAGE_PREFIX}:${appId}`;
}

function parseAvailableGroup(value: unknown): AvailableGroupInfo | null {
  if (!value || typeof value !== "object") return null;
  const group = value as Partial<AvailableGroupInfo>;
  if (
    typeof group.groupId !== "number" ||
    typeof group.groupName !== "string" ||
    typeof group.appId !== "string" ||
    typeof group.rateMultiplier !== "number" ||
    !Number.isFinite(group.rateMultiplier) ||
    typeof group.allowImageGeneration !== "boolean"
  ) {
    return null;
  }

  const rechargeMultiplier = group.balanceRechargeMultiplier;
  if (
    rechargeMultiplier !== undefined &&
    rechargeMultiplier !== null &&
    (typeof rechargeMultiplier !== "number" ||
      !Number.isFinite(rechargeMultiplier) ||
      rechargeMultiplier <= 0)
  ) {
    return null;
  }

  return {
    groupId: group.groupId,
    groupName: group.groupName,
    appId: group.appId as AvailableGroupInfo["appId"],
    rateMultiplier: group.rateMultiplier,
    // v1 缓存里没有这个字段。保留旧分组列表，但在下一次刷新前不显示实际倍率。
    balanceRechargeMultiplier: rechargeMultiplier ?? null,
    allowImageGeneration: group.allowImageGeneration,
  };
}

/** 从 WebView 本地存储恢复最近一次刷新结果；坏数据直接忽略。 */
export function loadAvailableGroupCache(
  appId: AppId,
  storage: Storage | undefined = typeof window === "undefined"
    ? undefined
    : window.localStorage,
): AvailableGroupsByOperator {
  if (!storage) return {};
  try {
    const raw = storage.getItem(storageKey(appId));
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
      return {};

    const restored: AvailableGroupsByOperator = {};
    for (const [operatorId, groups] of Object.entries(parsed)) {
      const id = Number(operatorId);
      if (!Number.isSafeInteger(id) || !Array.isArray(groups)) continue;
      const valid = groups.map(parseAvailableGroup);
      if (valid.every((group) => group !== null)) {
        restored[id] = valid as AvailableGroupInfo[];
      }
    }
    return restored;
  } catch {
    return {};
  }
}

/** 保存最近一次刷新结果。分组元数据不含登录凭据或 API Key。 */
export function saveAvailableGroupCache(
  appId: AppId,
  groups: AvailableGroupsByOperator,
  storage: Storage | undefined = typeof window === "undefined"
    ? undefined
    : window.localStorage,
): void {
  if (!storage) return;
  try {
    storage.setItem(storageKey(appId), JSON.stringify(groups));
  } catch {
    // localStorage 被禁用/配额耗尽只影响缓存；刷新功能本身仍可用。
  }
}

/** 只取当前 tab 的分组；provision 一次返回全部平台。 */
export function availableGroupsForApp(
  provisioned: ProvisionSummary,
  appId: AppId,
): AvailableGroupInfo[] {
  return provisioned.availableGroups.filter((group) => group.appId === appId);
}

/**
 * 把成功刷新的运营商合并进缓存。未刷新或刷新失败的运营商必须保留原值，不能因为
 * 用户只点了一行的「刷新档位与密钥」就丢掉其它行的下拉选项。
 */
export function mergeAvailableGroupRefreshes(
  current: AvailableGroupsByOperator,
  refreshed: ReadonlyArray<readonly [number, ProvisionSummary]>,
  appId: AppId,
): AvailableGroupsByOperator {
  const next = { ...current };
  for (const [operatorId, provisioned] of refreshed) {
    next[operatorId] = availableGroupsForApp(provisioned, appId);
  }
  return next;
}
