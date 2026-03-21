# Chat Capability Controls And Observability Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make search/thinking controls real, render reasoning correctly, align model capability tags with runtime behavior, and make thread-title generation observable instead of silently falling back.

**Architecture:** Keep the current `Stage -> useBananaChat -> useChatSession -> services/chat -> /api/chat` pipeline, but make capability toggles explicit data instead of prompt-only hints. Add a dedicated reasoning-aware UI adapter, gate search tools at the runtime tool-map layer, and add lightweight title-generation diagnostics so the sidebar title state is explainable.

**Tech Stack:** Next.js 16, React hooks, AI SDK `streamText`/UIMessage streams, Vitest, ESLint, Tauri + SQLite persistence, MCP tool runtime.

---

### Task 1: Baseline and Regression Coverage

**Files:**
- Modify: `src/stores/chat/__tests__/useChatSession.test.ts`
- Modify: `src/hooks/__tests__/useBananaChat.test.ts`
- Modify: `src/components/layout/__tests__/stage.test.tsx`
- Create: `src/services/chat/__tests__/title.test.ts`

**Step 1: Write failing tests for the current broken behaviors**

Add tests for:
```ts
it("does not expose search tools to the runtime when search is disabled", async () => {
  // assert runtime.send receives tools: [] or non-search subset
});

it("maps assistant reasoning parts into stage-visible thought content", () => {
  // assistant parts: [{ type: "reasoning", text: "..." }, { type: "text", text: "answer" }]
  // expect stage message to include both visible answer and thought payload
});

it("renders structured reasoning parts in the thought block", () => {
  // feed Stage a message with thought content and assert the thought block is visible
});

it("records title generation fallback reason when AI summary fails", async () => {
  // assert background summary path emits observable result
});
```

**Step 2: Run the focused tests to verify they fail**

Run:
```bash
npx vitest run src/stores/chat/__tests__/useChatSession.test.ts src/hooks/__tests__/useBananaChat.test.ts src/components/layout/__tests__/stage.test.tsx src/services/chat/__tests__/title.test.ts
```
Expected: failing assertions for disabled search gating, reasoning rendering, and title diagnostics.

**Step 3: Keep only the minimal failing cases**

Remove any redundant assertions so each test covers one broken behavior.

**Step 4: Commit the red-state tests**

```bash
git add src/stores/chat/__tests__/useChatSession.test.ts src/hooks/__tests__/useBananaChat.test.ts src/components/layout/__tests__/stage.test.tsx src/services/chat/__tests__/title.test.ts
git commit -m "test: capture chat capability control regressions"
```

### Task 2: Make Search Toggle a Real Runtime Gate

**Files:**
- Modify: `src/services/chat/mcp-tools.ts`
- Modify: `src/stores/chat/useChatSession.ts`
- Modify: `src/domain/mcp/types.ts` (if helper typing is needed)
- Test: `src/stores/chat/__tests__/useChatSession.test.ts`

**Step 1: Write the failing runtime-gating test**

Use a server fixture with search-like tool names and assert that disabled search excludes them:
```ts
const runtimeToolMap = await createRuntimeToolMap(servers, { capabilityMode: { searchEnabled: false } });
expect(runtimeToolMap.brave_search).toBeUndefined();
expect(runtimeToolMap.get_current_time).toBeDefined();
```

**Step 2: Run the focused test to verify it fails**

Run:
```bash
npx vitest run src/stores/chat/__tests__/useChatSession.test.ts -t "does not expose search tools to the runtime when search is disabled"
```
Expected: search tool still present.

**Step 3: Implement minimal gating in the tool-map layer**

Add a capability filter in `createRuntimeToolMap`:
```ts
function isSearchTool(candidate: ListedToolCandidate): boolean {
  const haystack = `${candidate.name} ${candidate.description ?? ""}`.toLowerCase();
  return ["search", "web", "browser", "crawl", "extract", "tavily", "brave"].some(token => haystack.includes(token));
}
```
Then skip search tools when `searchEnabled === false`.

**Step 4: Thread the toggle through `useChatSession`**

When building the tool map inside `runAssistantTurn`, pass the request-scoped toggle:
```ts
const runtimeToolMap = await createRuntimeToolMap(servers, {
  capabilityMode: { searchEnabled: options?.isSearch ?? false },
});
```

**Step 5: Run tests to verify green**

Run:
```bash
npx vitest run src/stores/chat/__tests__/useChatSession.test.ts src/services/chat/__tests__/runtime.test.ts
```
Expected: PASS.

**Step 6: Commit**

```bash
git add src/services/chat/mcp-tools.ts src/stores/chat/useChatSession.ts src/stores/chat/__tests__/useChatSession.test.ts src/services/chat/__tests__/runtime.test.ts
git commit -m "feat: gate search tools behind chat toggle"
```

### Task 3: Preserve And Render Structured Reasoning Parts

**Files:**
- Modify: `src/domain/chat/types.ts`
- Modify: `src/hooks/useBananaChat.ts`
- Modify: `src/domain/chat/ui-message.ts`
- Modify: `src/components/layout/stage.tsx`
- Test: `src/hooks/__tests__/useBananaChat.test.ts`
- Test: `src/components/layout/__tests__/stage.test.tsx`

**Step 1: Write the failing adapter and rendering tests**

Add a canonical assistant fixture:
```ts
{
  id: "msg-assistant-1",
  role: "assistant",
  parts: [
    { type: "reasoning", text: "先判断时区" },
    { type: "text", text: "北京今天是 2026年3月21日" },
  ],
}
```
Expected stage payload shape:
```ts
{
  content: "北京今天是 2026年3月21日",
  reasoning: "先判断时区",
}
```

**Step 2: Run focused tests to verify fail**

Run:
```bash
npx vitest run src/hooks/__tests__/useBananaChat.test.ts src/components/layout/__tests__/stage.test.tsx -t "reasoning"
```
Expected: no reasoning exposed/rendered.

**Step 3: Extend stage message shape minimally**

In `src/domain/chat/types.ts`, add:
```ts
export interface ChatMessage {
  reasoning?: string;
  // existing fields...
}
```

**Step 4: Extract reasoning in `useBananaChat`**

Add a helper that collects:
- structured `reasoning` parts
- fallback `<think>` parsing only if structured reasoning is absent

Pseudo-shape:
```ts
function summarizeReasoning(message: BananaUIMessage): string | undefined {
  return message.parts
    .filter((part): part is { type: "reasoning"; text: string } => part.type === "reasoning" && typeof part.text === "string")
    .map(part => part.text)
    .join("\n")
    .trim() || undefined;
}
```

**Step 5: Update `Stage` to prefer explicit reasoning prop**

Refactor `ThoughtContent` to accept:
```ts
function ThoughtContent({ content, reasoning }: { content: string; reasoning?: string })
```
Behavior:
- if `reasoning` exists, render it in `ThoughtBlock`
- otherwise keep legacy `<think>` parsing for backward compatibility

**Step 6: Run tests to verify green**

Run:
```bash
npx vitest run src/hooks/__tests__/useBananaChat.test.ts src/components/layout/__tests__/stage.test.tsx src/domain/chat/__tests__/ui-message.test.ts
```
Expected: PASS.

**Step 7: Commit**

```bash
git add src/domain/chat/types.ts src/hooks/useBananaChat.ts src/domain/chat/ui-message.ts src/components/layout/stage.tsx src/hooks/__tests__/useBananaChat.test.ts src/components/layout/__tests__/stage.test.tsx
git commit -m "feat: render structured assistant reasoning"
```

### Task 4: Make Thinking Toggle Semantically Honest

**Files:**
- Modify: `src/components/layout/stage.tsx`
- Modify: `src/components/models/model-selector.tsx`
- Modify: `src/lib/model-settings.ts`
- Test: `src/components/layout/__tests__/stage.test.tsx`

**Step 1: Write the failing UI expectation test**

Cover two cases:
```ts
it("disables or de-emphasizes thinking when the active model lacks reasoning capability", () => {
  // expect disabled button state or explanatory tooltip
});

it("keeps thinking enabled when the model is tagged with reasoning capability", () => {
  // expect enabled affordance
});
```

**Step 2: Run the tests to verify fail**

Run:
```bash
npx vitest run src/components/layout/__tests__/stage.test.tsx -t "thinking"
```
Expected: button has no capability awareness.

**Step 3: Improve capability inference for known reasoning families**

Extend `inferModelCapabilities` heuristics beyond `reason/o1/o3/r1` to include likely current families:
```ts
if (includesAny(["reason", "thinking", "reasoner", "o1", "o3", "r1", "glm5", "deepseek-r", "qwq"])) {
  capabilities.add("reasoning");
}
```
Keep this minimal and deterministic.

**Step 4: Reflect capability state in `Stage`**

When current model lacks `reasoning`, do one of the following consistently:
- disable the button, or
- keep it clickable but label it as prompt-only mode

Recommended implementation:
```ts
const thinkingMode = activeModelCapabilities.has("reasoning") ? "native" : "prompt-only";
```
Tooltip examples:
- `原生思考可用`
- `当前模型仅提示词思考`

**Step 5: Run tests to verify green**

Run:
```bash
npx vitest run src/components/layout/__tests__/stage.test.tsx
```
Expected: PASS.

**Step 6: Commit**

```bash
git add src/components/layout/stage.tsx src/components/models/model-selector.tsx src/lib/model-settings.ts src/components/layout/__tests__/stage.test.tsx
git commit -m "feat: align thinking control with model capabilities"
```

### Task 5: Improve Title Summary Observability

**Files:**
- Modify: `src/services/chat/title.ts`
- Modify: `src/stores/chat/useChatSession.ts`
- Modify: `src/domain/chat/types.ts` (only if a typed diagnostic helper is useful)
- Test: `src/services/chat/__tests__/title.test.ts`
- Test: `src/stores/chat/__tests__/useChatSession.test.ts`

**Step 1: Write the failing observability test**

Add a result-shape test such as:
```ts
expect(await generateConversationTitle(...)).toEqual({
  title: "北京今天日期",
  source: "fallback",
  reason: "http-error",
});
```
And a session-level test that verifies fallback logging/telemetry path runs.

**Step 2: Run focused tests to verify fail**

Run:
```bash
npx vitest run src/services/chat/__tests__/title.test.ts src/stores/chat/__tests__/useChatSession.test.ts -t "title"
```
Expected: current API only returns a raw string/null.

**Step 3: Refactor title generation to return structured diagnostics**

Recommended result shape:
```ts
interface GeneratedTitleResult {
  title: string | null;
  source: "ai" | "fallback" | "none";
  reason?: "ok" | "empty-stream" | "invalid-title" | "http-error" | "network-error";
}
```

**Step 4: Surface diagnostics in `useChatSession`**

At minimum, log once when fallback is used:
```ts
console.info("[thread-title] fallback used", { threadId, reason: result.reason });
```
Do not block chat UX.

**Step 5: Run tests to verify green**

Run:
```bash
npx vitest run src/services/chat/__tests__/title.test.ts src/stores/chat/__tests__/useChatSession.test.ts
```
Expected: PASS.

**Step 6: Commit**

```bash
git add src/services/chat/title.ts src/stores/chat/useChatSession.ts src/services/chat/__tests__/title.test.ts src/stores/chat/__tests__/useChatSession.test.ts
git commit -m "feat: add title generation diagnostics"
```

### Task 6: End-To-End Chat Regression Pass

**Files:**
- Verify only

**Step 1: Run the focused chat regression suite**

Run:
```bash
npx vitest run src/app/api/chat/__tests__/route.test.ts src/services/chat/__tests__/persistence.test.ts src/services/chat/__tests__/runtime.test.ts src/services/chat/__tests__/title.test.ts src/stores/chat/__tests__/useChatSession.test.ts src/components/layout/__tests__/stage.test.tsx src/hooks/__tests__/useBananaChat.test.ts src/domain/chat/__tests__/ui-message.test.ts
```
Expected: PASS across all suites.

**Step 2: Run lint on touched files**

Run:
```bash
npx eslint src/app/api/chat/route.ts src/services/chat/mcp-tools.ts src/services/chat/title.ts src/services/chat/index.ts src/stores/chat/useChatSession.ts src/hooks/useBananaChat.ts src/components/layout/stage.tsx src/lib/model-settings.ts src/domain/chat/types.ts src/domain/chat/ui-message.ts src/services/chat/__tests__/title.test.ts src/stores/chat/__tests__/useChatSession.test.ts src/hooks/__tests__/useBananaChat.test.ts src/components/layout/__tests__/stage.test.tsx
```
Expected: no errors.

**Step 3: Manual verification in `tauri dev`**

Check these exact cases:
1. Search toggle off + ask latest news -> model must not call search MCP.
2. Search toggle on + ask latest news -> model may call search MCP and show tool card + answer in one bubble.
3. Thinking toggle on + reasoning-capable model -> thought block renders.
4. Thinking toggle on + non-reasoning model -> UI clearly says prompt-only or disabled.
5. First-turn title generation -> sidebar updates away from `新会话` and logs whether source was `ai` or `fallback`.

**Step 4: Final integration commit**

```bash
git add src
git commit -m "feat: make chat capability controls and title generation observable"
```
