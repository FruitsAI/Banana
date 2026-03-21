import { beforeEach, describe, expect, it, vi } from "vitest";
import * as modelSettings from "@/lib/model-settings";
import {
  ensureProvidersReady,
  ensureProviderModelsReady,
  inferModelCapabilities,
  resolveThinkingModelId,
  supportsNativeThinking,
} from "@/lib/model-settings";

const {
  mockGetActiveModelSelection,
  mockGetModelsByProvider,
  mockGetProviderModelsSeededState,
  mockGetProviderModelsSeedVersion,
  mockGetProviderSeedDismissedState,
  mockGetSeedModelDismissedState,
  mockGetProviders,
  mockDeleteModel,
  mockDeleteProvider,
  mockSetProviderSeedDismissedState,
  mockSetSeedModelDismissedState,
  mockSetProviderModelsSeededState,
  mockSetProviderModelsSeedVersion,
  mockSetActiveModelSelection,
  mockUpsertModel,
  mockUpsertProvider,
} = vi.hoisted(() => ({
  mockGetActiveModelSelection: vi.fn(),
  mockGetModelsByProvider: vi.fn(),
  mockGetProviderModelsSeededState: vi.fn(),
  mockGetProviderModelsSeedVersion: vi.fn(),
  mockGetProviderSeedDismissedState: vi.fn(),
  mockGetSeedModelDismissedState: vi.fn(),
  mockGetProviders: vi.fn(),
  mockDeleteModel: vi.fn(),
  mockDeleteProvider: vi.fn(),
  mockSetProviderSeedDismissedState: vi.fn(),
  mockSetSeedModelDismissedState: vi.fn(),
  mockSetProviderModelsSeededState: vi.fn(),
  mockSetProviderModelsSeedVersion: vi.fn(),
  mockSetActiveModelSelection: vi.fn(),
  mockUpsertModel: vi.fn(),
  mockUpsertProvider: vi.fn(),
}));

vi.mock("@/services/models", () => ({
  deleteModel: mockDeleteModel,
  deleteProvider: mockDeleteProvider,
  getActiveModelSelection: mockGetActiveModelSelection,
  getModelsByProvider: mockGetModelsByProvider,
  getProviderModelsSeededState: mockGetProviderModelsSeededState,
  getProviderModelsSeedVersion: mockGetProviderModelsSeedVersion,
  getProviderSeedDismissedState: mockGetProviderSeedDismissedState,
  getSeedModelDismissedState: mockGetSeedModelDismissedState,
  getProviders: mockGetProviders,
  setProviderSeedDismissedState: mockSetProviderSeedDismissedState,
  setSeedModelDismissedState: mockSetSeedModelDismissedState,
  setProviderModelsSeededState: mockSetProviderModelsSeededState,
  setProviderModelsSeedVersion: mockSetProviderModelsSeedVersion,
  setActiveModelSelection: mockSetActiveModelSelection,
  upsertModel: mockUpsertModel,
  upsertProvider: mockUpsertProvider,
}));

describe("inferModelCapabilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("treats NVIDIA MiniMax M2.5 as a reasoning-capable model", () => {
    expect(inferModelCapabilities("nvidia", "minimaxai/minimax-m2.5")).toContain("reasoning");
  });

  it("treats NVIDIA Kimi K2 Thinking as a reasoning-capable model", () => {
    expect(inferModelCapabilities("nvidia", "moonshotai/kimi-k2-thinking")).toContain("reasoning");
  });

  it("treats NVIDIA Kimi K2.5 as native-thinking capable when the thinking variant exists", () => {
    expect(
      supportsNativeThinking("nvidia", "moonshotai/kimi-k2.5", [
        {
          id: "moonshotai/kimi-k2.5",
          provider_id: "nvidia",
          name: "moonshotai/kimi-k2.5",
          is_enabled: true,
        },
        {
          id: "moonshotai/kimi-k2-thinking",
          provider_id: "nvidia",
          name: "moonshotai/kimi-k2-thinking",
          is_enabled: true,
          capabilities: ["reasoning"],
        },
      ]),
    ).toBe(true);
  });

  it("resolves NVIDIA Kimi K2.5 to the thinking variant when deep thinking is enabled", () => {
    expect(
      resolveThinkingModelId("nvidia", "moonshotai/kimi-k2.5", [
        {
          id: "moonshotai/kimi-k2.5",
          provider_id: "nvidia",
          name: "moonshotai/kimi-k2.5",
          is_enabled: true,
        },
        {
          id: "moonshotai/kimi-k2-thinking",
          provider_id: "nvidia",
          name: "moonshotai/kimi-k2-thinking",
          is_enabled: true,
          capabilities: ["reasoning"],
        },
      ], true),
    ).toBe("moonshotai/kimi-k2-thinking");
  });
});

describe("ensureProviderModelsReady", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("backfills missing NVIDIA seed models when the provider already has user models", async () => {
    const existingModels = [
      {
        id: "z-ai/glm5",
        provider_id: "nvidia",
        name: "z-ai/glm5",
        is_enabled: true,
      },
    ];
    const completedModels = [
      ...existingModels,
      {
        id: "moonshotai/kimi-k2-thinking",
        provider_id: "nvidia",
        name: "moonshotai/kimi-k2-thinking",
        is_enabled: true,
      },
    ];

    mockGetModelsByProvider
      .mockResolvedValueOnce(existingModels)
      .mockResolvedValueOnce(completedModels);
    mockGetProviderModelsSeededState.mockResolvedValue(false);
    mockUpsertModel.mockResolvedValue(undefined);
    mockSetProviderModelsSeededState.mockResolvedValue(undefined);

    const result = await ensureProviderModelsReady("nvidia");

    expect(mockUpsertModel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "moonshotai/kimi-k2-thinking",
        provider_id: "nvidia",
        name: "moonshotai/kimi-k2-thinking",
        capabilities: expect.arrayContaining(["reasoning"]),
        capabilities_source: "auto",
      }),
    );
    expect(mockSetProviderModelsSeededState).toHaveBeenCalledWith("nvidia");
    expect(result).toEqual(completedModels);
  });

  it("only backfills newly introduced NVIDIA seed models for legacy seeded providers", async () => {
    const existingModels = [
      {
        id: "z-ai/glm5",
        provider_id: "nvidia",
        name: "z-ai/glm5",
        is_enabled: true,
      },
    ];
    const completedModels = [
      ...existingModels,
      {
        id: "moonshotai/kimi-k2-thinking",
        provider_id: "nvidia",
        name: "moonshotai/kimi-k2-thinking",
        is_enabled: true,
      },
    ];

    mockGetModelsByProvider
      .mockResolvedValueOnce(existingModels)
      .mockResolvedValueOnce(completedModels);
    mockGetProviderModelsSeededState.mockResolvedValue(true);
    mockGetProviderModelsSeedVersion.mockResolvedValue(null);
    mockUpsertModel.mockResolvedValue(undefined);
    mockSetProviderModelsSeedVersion.mockResolvedValue(undefined);

    const result = await ensureProviderModelsReady("nvidia");

    expect(mockUpsertModel).toHaveBeenCalledTimes(1);
    expect(mockUpsertModel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "moonshotai/kimi-k2-thinking",
        provider_id: "nvidia",
        name: "moonshotai/kimi-k2-thinking",
        capabilities: expect.arrayContaining(["reasoning"]),
        capabilities_source: "auto",
      }),
    );
    expect(mockSetProviderModelsSeededState).not.toHaveBeenCalled();
    expect(result).toEqual(completedModels);
  });
});

describe("seed lifecycle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not recreate dismissed default providers", async () => {
    mockGetProviders.mockResolvedValue([]);
    mockGetProviderSeedDismissedState.mockImplementation(
      async (providerId: string) => providerId === "openai",
    );

    await ensureProvidersReady();

    expect(mockUpsertProvider).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: "openai" }),
    );
    expect(mockUpsertProvider).toHaveBeenCalledWith(
      expect.objectContaining({ id: "anthropic" }),
    );
  });

  it("canonicalizes legacy provider ids without seeding the same default provider twice", async () => {
    mockGetProviders.mockResolvedValue([
      {
        id: "OpenAI",
        name: "OpenAI",
        icon: "O",
        is_enabled: true,
        api_key: "openai-key",
        base_url: "https://api.openai.com/v1",
        provider_type: "openai",
      },
    ]);
    mockGetProviderSeedDismissedState.mockResolvedValue(false);
    mockGetModelsByProvider.mockResolvedValue([]);
    mockGetActiveModelSelection.mockResolvedValue({
      activeProviderId: null,
      activeModelId: null,
    });
    mockUpsertProvider.mockResolvedValue(undefined);
    mockDeleteProvider.mockResolvedValue(undefined);

    await ensureProvidersReady();

    const openaiWrites = mockUpsertProvider.mock.calls.filter(
      ([provider]) => provider?.id === "openai",
    );
    expect(openaiWrites).toHaveLength(1);
  });

  it("canonicalizes legacy default provider ids and migrates their models and selection", async () => {
    mockGetProviders
      .mockResolvedValueOnce([
        {
          id: "OpenAI",
          name: "OpenAI",
          icon: "O",
          is_enabled: true,
          api_key: "openai-key",
          base_url: "https://api.openai.com/v1",
          provider_type: "openai",
        },
      ])
      .mockResolvedValue([
        {
          id: "openai",
          name: "OpenAI",
          icon: "O",
          is_enabled: true,
          api_key: "openai-key",
          base_url: "https://api.openai.com/v1",
          provider_type: "openai",
        },
      ]);
    mockGetModelsByProvider.mockImplementation(async (providerId: string) => {
      if (providerId === "OpenAI") {
        return [
          {
            id: "gpt-4o-mini",
            provider_id: "OpenAI",
            name: "gpt-4o-mini",
            is_enabled: true,
          },
        ];
      }

      return [];
    });
    mockGetActiveModelSelection.mockResolvedValue({
      activeProviderId: "OpenAI",
      activeModelId: "gpt-4o-mini",
    });
    mockUpsertProvider.mockResolvedValue(undefined);
    mockUpsertModel.mockResolvedValue(undefined);
    mockDeleteProvider.mockResolvedValue(undefined);
    mockSetActiveModelSelection.mockResolvedValue(undefined);

    await ensureProvidersReady();

    expect(mockUpsertProvider).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "openai",
        api_key: "openai-key",
        base_url: "https://api.openai.com/v1",
      }),
    );
    expect(mockUpsertModel).toHaveBeenCalledWith(
      expect.objectContaining({
        id: "gpt-4o-mini",
        provider_id: "openai",
      }),
    );
    expect(mockSetActiveModelSelection).toHaveBeenCalledWith("openai", "gpt-4o-mini");
    expect(mockDeleteProvider).toHaveBeenCalledWith("OpenAI");
  });

  it("does not backfill dismissed seed models", async () => {
    const existingModels = [
      {
        id: "custom-model",
        provider_id: "openai",
        name: "custom-model",
        is_enabled: true,
      },
    ];
    const completedModels = [
      ...existingModels,
      {
        id: "gpt-4.1-mini",
        provider_id: "openai",
        name: "gpt-4.1-mini",
        is_enabled: true,
      },
    ];

    mockGetModelsByProvider
      .mockResolvedValueOnce(existingModels)
      .mockResolvedValueOnce(completedModels);
    mockGetProviderModelsSeededState.mockResolvedValue(false);
    mockGetSeedModelDismissedState.mockImplementation(
      async (_providerId: string, modelId: string) => modelId === "gpt-4o-mini",
    );
    mockUpsertModel.mockResolvedValue(undefined);
    mockSetProviderModelsSeededState.mockResolvedValue(undefined);

    const result = await ensureProviderModelsReady("openai");

    expect(mockUpsertModel).not.toHaveBeenCalledWith(
      expect.objectContaining({ id: "gpt-4o-mini" }),
    );
    expect(mockUpsertModel).toHaveBeenCalledWith(
      expect.objectContaining({ id: "gpt-4.1-mini" }),
    );
    expect(result).toEqual(completedModels);
  });

  it("marks seeded models dismissed before deleting them", async () => {
    const deleteModelWithSeedLifecycle = (
      modelSettings as {
        deleteModelWithSeedLifecycle?: (providerId: string, modelId: string) => Promise<void>;
      }
    ).deleteModelWithSeedLifecycle;

    expect(deleteModelWithSeedLifecycle).toEqual(expect.any(Function));

    mockSetSeedModelDismissedState.mockResolvedValue(undefined);
    mockDeleteModel.mockResolvedValue(undefined);

    await deleteModelWithSeedLifecycle?.("openai", "gpt-4o-mini");

    expect(mockSetSeedModelDismissedState).toHaveBeenCalledWith(
      "openai",
      "gpt-4o-mini",
      true,
    );
    expect(mockDeleteModel).toHaveBeenCalledWith("openai", "gpt-4o-mini");
  });
});
