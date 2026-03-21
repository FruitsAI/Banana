import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/models/route";

describe("POST /api/models", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses anthropic-specific headers instead of bearer auth", async () => {
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: [{ id: "claude-3-5-sonnet" }],
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      ),
    );
    vi.stubGlobal("fetch", fetchMock);

    const request = new NextRequest("http://localhost/api/models", {
      method: "POST",
      body: JSON.stringify({
        apiKey: "anthropic-key",
        baseURL: "https://api.anthropic.com/v1",
        providerType: "anthropic",
      }),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.anthropic.com/v1/models",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          "x-api-key": "anthropic-key",
          "anthropic-version": expect.any(String),
        }),
      }),
    );

    const requestInit = (
      fetchMock.mock.calls as unknown as Array<[string, { headers?: Record<string, string> }]>
    )?.[0]?.[1];
    expect(requestInit?.headers ?? {}).not.toHaveProperty("Authorization");
  });
});
