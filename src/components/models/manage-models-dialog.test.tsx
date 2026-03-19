import { render, screen } from "@testing-library/react";
import { ManageModelsDialog } from "./manage-models-dialog";

vi.mock("@/components/models/model-selector", () => ({
  ModelIcon: () => <div data-testid="model-icon" />,
}));

describe("ManageModelsDialog", () => {
  it("shows a clear empty state when the provider API key is missing", () => {
    render(
      <ManageModelsDialog
        open
        onOpenChange={vi.fn()}
        activeProvider={{
          id: "anthropic",
          name: "Anthropic",
          icon: "A",
          is_enabled: true,
          provider_type: "anthropic",
        }}
        existingModels={[]}
        apiKey=""
        baseUrl="https://api.anthropic.com/v1"
        onAddModels={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.getByText("请先配置 API Key 后再同步模型库")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "确定" })).toBeInTheDocument();
  });
});
