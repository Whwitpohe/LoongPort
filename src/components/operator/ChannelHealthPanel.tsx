import { Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

import type {
  ChannelMonitorInfo,
  ChannelMonitorTimelinePoint,
} from "@/lib/api/operator";
import { cn } from "@/lib/utils";

export interface ChannelHealthPanelProps {
  monitors: readonly ChannelMonitorInfo[] | undefined;
}

type HealthKind = "operational" | "degraded" | "failed" | "error" | "unknown";

const MAX_TIMELINE_POINTS = 60;

function healthKind(status: string): HealthKind {
  switch (status.trim().toLowerCase()) {
    case "operational":
      return "operational";
    case "degraded":
      return "degraded";
    case "failed":
      return "failed";
    case "error":
      return "error";
    default:
      return "unknown";
  }
}

function statusClasses(kind: HealthKind): string {
  switch (kind) {
    case "operational":
      return "bg-emerald-500/10 text-emerald-700 ring-emerald-500/25 dark:text-emerald-300";
    case "degraded":
      return "bg-amber-500/10 text-amber-700 ring-amber-500/25 dark:text-amber-300";
    case "failed":
    case "error":
      return "bg-red-500/10 text-red-700 ring-red-500/25 dark:text-red-300";
    case "unknown":
      return "bg-muted text-muted-foreground ring-border";
  }
}

function progressClasses(kind: HealthKind): string {
  switch (kind) {
    case "operational":
      return "bg-emerald-500";
    case "degraded":
      return "bg-amber-500";
    case "failed":
    case "error":
      return "bg-red-500";
    case "unknown":
      return "bg-muted-foreground/50";
  }
}

function finiteMetric(value: number | null): number | null {
  return value !== null && Number.isFinite(value) ? value : null;
}

export function ChannelHealthPanel({ monitors }: ChannelHealthPanelProps) {
  const { t } = useTranslation();
  if (!monitors || monitors.length === 0) return null;

  return (
    <section
      aria-label={t("loongport.health.title")}
      className="rounded-lg border border-border/80 bg-muted/20 p-3"
    >
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-foreground/90">
          <Activity className="h-3.5 w-3.5 text-emerald-500" />
          {t("loongport.health.title")}
        </div>
        <span className="text-[10px] text-muted-foreground">
          {t("loongport.health.autoRefresh")}
        </span>
      </div>

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {monitors.map((monitor) => {
          const kind = healthKind(monitor.primaryStatus);
          const latency = finiteMetric(monitor.primaryLatencyMs);
          const ping = finiteMetric(monitor.primaryPingLatencyMs);
          const availability = finiteMetric(monitor.availability7d);
          const availabilityWidth =
            availability === null
              ? 0
              : Math.max(0, Math.min(100, availability));

          return (
            <article
              key={monitor.monitorId}
              className="min-w-0 rounded-md border border-border/70 bg-background/75 p-2.5 shadow-sm"
            >
              <div className="flex min-w-0 items-start justify-between gap-2">
                <div className="min-w-0">
                  <div
                    className="truncate text-xs font-medium"
                    title={monitor.name}
                  >
                    {monitor.name}
                  </div>
                  {(monitor.provider || monitor.primaryModel) && (
                    <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[10px] text-muted-foreground">
                      {monitor.provider && (
                        <span className="shrink-0 uppercase">
                          {monitor.provider}
                        </span>
                      )}
                      {monitor.provider && monitor.primaryModel && (
                        <span aria-hidden="true">·</span>
                      )}
                      {monitor.primaryModel && (
                        <span
                          className="truncate font-mono"
                          title={monitor.primaryModel}
                        >
                          {monitor.primaryModel}
                        </span>
                      )}
                    </div>
                  )}
                  {monitor.groupName && (
                    <div
                      className="mt-0.5 truncate text-[10px] text-muted-foreground"
                      title={monitor.groupName}
                    >
                      {t("loongport.health.group", {
                        name: monitor.groupName,
                      })}
                    </div>
                  )}
                </div>
                <span
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-inset",
                    statusClasses(kind),
                  )}
                >
                  <span
                    className={cn(
                      "h-1.5 w-1.5 rounded-full",
                      progressClasses(kind),
                    )}
                  />
                  {t(`loongport.health.status.${kind}`)}
                </span>
              </div>

              <div className="mt-2 grid grid-cols-3 gap-1.5">
                <HealthMetric
                  label={t("loongport.health.responseLatency")}
                  value={
                    latency === null ? "—" : Math.round(latency).toString()
                  }
                  unit={latency === null ? undefined : "ms"}
                />
                <HealthMetric
                  label={t("loongport.health.ping")}
                  value={ping === null ? "—" : Math.round(ping).toString()}
                  unit={ping === null ? undefined : "ms"}
                />
                <HealthMetric
                  label={t("loongport.health.availability7d")}
                  value={availability === null ? "—" : availability.toFixed(2)}
                  unit={availability === null ? undefined : "%"}
                />
              </div>

              <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted">
                <div
                  className={cn(
                    "h-full rounded-full transition-[width] duration-300",
                    progressClasses(kind),
                  )}
                  style={{ width: `${availabilityWidth}%` }}
                />
              </div>

              <HealthTimeline points={monitor.timeline} />
            </article>
          );
        })}
      </div>
    </section>
  );
}

function HealthTimeline({
  points,
}: {
  points: readonly ChannelMonitorTimelinePoint[];
}) {
  const { t } = useTranslation();
  if (points.length === 0) return null;

  // 服务端按最新在前返回；界面按时间从左到右排，所以先截最近 60 条再反转。
  const recent = points.slice(0, MAX_TIMELINE_POINTS).reverse();

  return (
    <div className="mt-2.5">
      <div className="mb-1 flex items-center justify-between gap-2 text-[9px] text-muted-foreground">
        <span>
          {t("loongport.health.recentChecks", { count: recent.length })}
        </span>
        <span>{t("loongport.health.newestRight")}</span>
      </div>
      <div
        className="grid gap-px"
        style={{
          gridTemplateColumns: `repeat(${recent.length}, minmax(2px, 1fr))`,
        }}
      >
        {recent.map((point, index) => {
          const kind = healthKind(point.status);
          const checkedAt = formatCheckedAt(point.checkedAt);
          const latency = finiteMetric(point.latencyMs);
          const ping = finiteMetric(point.pingLatencyMs);
          const title = [
            checkedAt,
            t(`loongport.health.status.${kind}`),
            `${t("loongport.health.responseLatency")} ${formatMs(latency)}`,
            `${t("loongport.health.ping")} ${formatMs(ping)}`,
          ].join(" · ");

          return (
            <span
              key={`${point.checkedAt}:${index}`}
              aria-label={title}
              title={title}
              className={cn(
                "h-3 min-w-0 rounded-[1px] opacity-85 transition-opacity hover:opacity-100",
                progressClasses(kind),
              )}
            />
          );
        })}
      </div>
    </div>
  );
}

function formatMs(value: number | null): string {
  return value === null ? "—" : `${Math.round(value)} ms`;
}

function formatCheckedAt(value: string): string {
  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? value : new Date(timestamp).toLocaleString();
}

function HealthMetric({
  label,
  value,
  unit,
}: {
  label: string;
  value: string;
  unit?: string;
}) {
  return (
    <div className="min-w-0 rounded bg-muted/50 px-1.5 py-1 text-center">
      <div className="truncate text-[9px] text-muted-foreground" title={label}>
        {label}
      </div>
      <div className="mt-0.5 truncate text-[11px] font-semibold tabular-nums">
        {value}
        {unit && <span className="ml-0.5 text-[9px] font-normal">{unit}</span>}
      </div>
    </div>
  );
}
