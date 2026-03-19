import { deriveThreadTitle } from "./thread-title";

describe("deriveThreadTitle", () => {
  it("uses the first user message as the thread title", () => {
    expect(deriveThreadTitle("帮我总结一下这个 PR 的风险点")).toBe(
      "帮我总结一下这个 PR 的风险点"
    );
  });

  it("collapses whitespace and trims overly long titles", () => {
    expect(
      deriveThreadTitle(
        "  第一行内容\n第二行内容\t第三行内容第四行内容第五行内容第六行内容第七行内容  "
      )
    ).toBe("第一行内容 第二行内容 第三行内容第四行内容第五行内容第六行...");
  });

  it("falls back to the default title when the message is empty", () => {
    expect(deriveThreadTitle("   \n\t  ")).toBe("新会话");
  });
});
