import React from "react";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  APP_UPDATE_LAST_CHECKED_AT_CONFIG_KEY,
  APP_UPDATE_LAST_SKIPPED_VERSION_CONFIG_KEY,
} from "@/domain/config/types";
import { AppUpdateProvider, useAppUpdateStore } from "./useAppUpdateStore";

const {
  mockCheckForAppUpdate,
  mockInstallAppUpdate,
  mockRestartToApplyUpdate,
  mockGetConfigValue,
  mockSetConfigValue,
} = vi.hoisted(() => ({
  mockCheckForAppUpdate: vi.fn(),
  mockInstallAppUpdate: vi.fn(),
  mockRestartToApplyUpdate: vi.fn(),
  mockGetConfigValue: vi.fn(),
  mockSetConfigValue: vi.fn(),
}));

vi.mock("@/services/update", () => ({
  checkForAppUpdate: mockCheckForAppUpdate,
  installAppUpdate: mockInstallAppUpdate,
  restartToApplyUpdate: mockRestartToApplyUpdate,
}));

vi.mock("@/services/config", () => ({
  getConfigValue: mockGetConfigValue,
  setConfigValue: mockSetConfigValue,
}));

function UpdateProbe() {
  const store = useAppUpdateStore();

  return (
    <div>
      <div data-testid="current-version">{store.currentVersion}</div>
      <div data-testid="latest-version">{store.latestVersion ?? ""}</div>
      <div data-testid="check-state">{store.checkState}</div>
      <div data-testid="install-state">{store.installState}</div>
      <button onClick={() => void store.checkForUpdates({ manual: true })}>manual-check</button>
      <button onClick={() => void store.installUpdate()}>install-update</button>
      <button onClick={() => void store.restartToApplyUpdate()}>restart-update</button>
      <button onClick={() => void store.skipVersion()}>skip-version</button>
    </div>
  );
}

describe("AppUpdateProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "__TAURI_INTERNALS__", {
      configurable: true,
      value: {},
    });
    mockGetConfigValue.mockImplementation(async (key: string) => {
      if (key === APP_UPDATE_LAST_CHECKED_AT_CONFIG_KEY) {
        return null;
      }

      if (key === APP_UPDATE_LAST_SKIPPED_VERSION_CONFIG_KEY) {
        return null;
      }

      return null;
    });
    mockSetConfigValue.mockResolvedValue(undefined);
    mockCheckForAppUpdate.mockResolvedValue({
      currentVersion: "0.1.0",
      latestVersion: "0.2.0",
      available: true,
      canInstallInApp: true,
      reason: null,
      notes: null,
      publishedAt: null,
      downloadUrl: null,
      target: "darwin-aarch64",
    });
    mockInstallAppUpdate.mockResolvedValue({
      currentVersion: "0.1.0",
      latestVersion: "0.2.0",
      readyToRestart: true,
    });
    mockRestartToApplyUpdate.mockResolvedValue(undefined);
  });

  afterEach(() => {
    delete (window as Window & { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
  });

  it("checks for updates on startup and records the last checked time", async () => {
    render(
      <AppUpdateProvider>
        <UpdateProbe />
      </AppUpdateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("current-version")).toHaveTextContent("0.1.0");
      expect(screen.getByTestId("latest-version")).toHaveTextContent("0.2.0");
      expect(screen.getByTestId("check-state")).toHaveTextContent("available");
    });

    expect(mockCheckForAppUpdate).toHaveBeenCalledTimes(1);
    expect(mockSetConfigValue).toHaveBeenCalledWith(
      APP_UPDATE_LAST_CHECKED_AT_CONFIG_KEY,
      expect.any(String),
    );
  });

  it("suppresses an auto-discovered version that the user has already skipped, but allows manual re-check to show it again", async () => {
    mockGetConfigValue.mockImplementation(async (key: string) => {
      if (key === APP_UPDATE_LAST_SKIPPED_VERSION_CONFIG_KEY) {
        return "0.2.0";
      }

      return null;
    });

    render(
      <AppUpdateProvider>
        <UpdateProbe />
      </AppUpdateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("check-state")).toHaveTextContent("suppressed");
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "manual-check" }));
    });

    await waitFor(() => {
      expect(screen.getByTestId("check-state")).toHaveTextContent("available");
    });

    expect(mockCheckForAppUpdate).toHaveBeenCalledTimes(2);
  });

  it("moves to ready-to-restart after installation finishes", async () => {
    render(
      <AppUpdateProvider>
        <UpdateProbe />
      </AppUpdateProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("check-state")).toHaveTextContent("available");
    });

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "install-update" }));
    });

    expect(mockInstallAppUpdate).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("install-state")).toHaveTextContent("ready_to_restart");
  });
});
