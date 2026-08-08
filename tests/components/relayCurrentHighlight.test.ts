import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync(
  path.resolve(
    __dirname,
    "..",
    "..",
    "src",
    "components",
    "relay",
    "RelayRow.tsx",
  ),
  "utf8",
);

describe("当前运营商与当前配置高亮", () => {
  it("当前运营商有常驻标签、左侧色条和更强的蓝色卡片态", () => {
    expect(source).toContain('t("loongport.row.currentOperator")');
    expect(source).toContain("before:w-1 before:bg-blue-500");
    expect(source).toContain("border-blue-500/80 bg-blue-500/[0.06] shadow-md");
  });

  it("当前配置有常驻标签和独立的蓝色高亮", () => {
    expect(source).toContain('t("loongport.tier.currentConfig")');
    expect(source).toContain("before:w-0.5 before:bg-blue-500");
    expect(source).toContain("border-blue-500/80 bg-blue-500/10 shadow-md");
  });

  it("两层当前状态都暴露 aria-current", () => {
    expect(source.match(/aria-current=/g)).toHaveLength(2);
  });
});
