import { render, screen, within } from "@testing-library/react";
import { vi } from "vitest";

import { ChannelHealthPanel } from "@/components/relay/ChannelHealthPanel";
import type { ChannelMonitorInfo } from "@/lib/api/relay";

vi.mock("react-i18next", () => ({
  useTranslation: () => ({
    t: (key: string, options?: { name?: string }) =>
      options?.name ? `${key}: ${options.name}` : key,
  }),
}));

function monitor(
  overrides: Partial<ChannelMonitorInfo> = {},
): ChannelMonitorInfo {
  return {
    monitorId: 84,
    name: "GPT-5.6 Sol",
    provider: "openai",
    groupName: "",
    primaryModel: "gpt-5.6-sol",
    primaryStatus: "operational",
    primaryLatencyMs: 2385,
    primaryPingLatencyMs: 16,
    availability7d: 97.75280898876404,
    timeline: [
      {
        status: "operational",
        latencyMs: 2385,
        pingLatencyMs: 16,
        checkedAt: "2026-08-06T19:52:50Z",
      },
      {
        status: "degraded",
        latencyMs: 10_210,
        pingLatencyMs: 23,
        checkedAt: "2026-08-06T19:51:50Z",
      },
    ],
    ...overrides,
  };
}

describe("ChannelHealthPanel", () => {
  it("shows the monitor name and health metrics without pretending it is a group name", () => {
    render(<ChannelHealthPanel monitors={[monitor()]} />);

    const card = screen.getByText("GPT-5.6 Sol").closest("article");
    expect(card).not.toBeNull();
    const health = within(card!);
    expect(health.getByText("openai")).toHaveClass("uppercase");
    expect(health.getByText("gpt-5.6-sol")).toBeInTheDocument();
    expect(
      health.getByText("loongport.health.status.operational"),
    ).toBeInTheDocument();
    expect(health.getByText("2385")).toBeInTheDocument();
    expect(health.getByText("16")).toBeInTheDocument();
    expect(health.getByText("97.75")).toBeInTheDocument();
    expect(
      screen.queryByText(/loongport\.health\.group:/),
    ).not.toBeInTheDocument();

    const history = card!.querySelectorAll<HTMLElement>(
      '[aria-label*="loongport.health.status."]',
    );
    expect(history).toHaveLength(2);
    // 服务端最新在前；色块带应把旧点放左边、最新点放右边。
    expect(history[0].getAttribute("aria-label")).toContain(
      "loongport.health.status.degraded",
    );
    expect(history[1].getAttribute("aria-label")).toContain(
      "loongport.health.status.operational",
    );
  });

  it("shows group_name separately when the server provides an explicit association", () => {
    render(
      <ChannelHealthPanel
        monitors={[
          monitor({
            name: "探针显示名",
            groupName: "生产分组",
          }),
        ]}
      />,
    );

    expect(screen.getByText("探针显示名")).toBeInTheDocument();
    expect(
      screen.getByText("loongport.health.group: 生产分组"),
    ).toBeInTheDocument();
  });

  it("stays hidden when the site has no channel monitor endpoint or items", () => {
    const { container, rerender } = render(
      <ChannelHealthPanel monitors={undefined} />,
    );
    expect(container).toBeEmptyDOMElement();

    rerender(<ChannelHealthPanel monitors={[]} />);
    expect(container).toBeEmptyDOMElement();
  });
});
