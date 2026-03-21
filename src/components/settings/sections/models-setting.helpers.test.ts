import { describe, expect, it } from "vitest";
import type { Model } from "@/domain/models/types";
import {
  buildUniqueProviderId,
  groupModelsByGroupName,
  normalizeProviderId,
} from "./models-setting/helpers";

describe("models-setting helpers", () => {
  it("normalizes provider ids into lowercase kebab-case values", () => {
    expect(normalizeProviderId(" OpenAI Response ")).toBe("openai-response");
    expect(normalizeProviderId("My_Custom Provider!")).toBe("my-custom-provider");
  });

  it("builds a unique provider id with numeric suffixes when needed", () => {
    const existingIds = new Set(["nvidia", "nvidia-2"]);

    expect(buildUniqueProviderId("NVIDIA", "openai", existingIds)).toBe("nvidia-3");
    expect(buildUniqueProviderId("", "anthropic", new Set())).toBe("anthropic");
  });

  it("groups models by explicit group name or provider id fallback", () => {
    const models: Model[] = [
      {
        id: "gpt-5.3-codex",
        provider_id: "openai",
        name: "gpt-5.3-codex",
        group_name: "gpt-5.3",
        is_enabled: true,
      },
      {
        id: "gpt-5.3",
        provider_id: "openai",
        name: "gpt-5.3",
        group_name: "gpt-5.3",
        is_enabled: true,
      },
      {
        id: "claude-sonnet-4",
        provider_id: "anthropic",
        name: "claude-sonnet-4",
        is_enabled: true,
      },
    ];

    expect(groupModelsByGroupName(models)).toEqual([
      ["gpt-5.3", [models[0], models[1]]],
      ["anthropic", [models[2]]],
    ]);
  });
});
