"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { ConfirmLayer } from "@/components/feedback/confirm-layer";
import { ToastLayer } from "@/components/feedback/toast-layer";
import type {
  ConfirmOptions,
  ConfirmRequest,
  ToastApi,
  ToastMessage,
  ToastOptions,
} from "@/components/feedback/types";

const DEFAULT_TOAST_DURATION = 3200;

const ConfirmContext = createContext<
  ((options: ConfirmOptions) => Promise<boolean>) | null
>(null);

const ToastContext = createContext<ToastApi | null>(null);

function createFeedbackId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `feedback-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * FeedbackProvider 组件
 * @description 向全局注入确认弹窗与 Toast 消息能力。
 */
export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [confirmQueue, setConfirmQueue] = useState<ConfirmRequest[]>([]);
  const [messages, setMessages] = useState<ToastMessage[]>([]);
  const timerMapRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const clearToastTimer = useCallback((id: string) => {
    const timer = timerMapRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timerMapRef.current.delete(id);
    }
  }, []);

  const dismissToast = useCallback(
    (id: string) => {
      clearToastTimer(id);
      setMessages((previousMessages) =>
        previousMessages.filter((message) => message.id !== id)
      );
    },
    [clearToastTimer]
  );

  const clearToasts = useCallback(() => {
    timerMapRef.current.forEach((timer) => clearTimeout(timer));
    timerMapRef.current.clear();
    setMessages([]);
  }, []);

  const showToast = useCallback(
    (options: ToastOptions): string => {
      const id = createFeedbackId();
      const duration = options.duration ?? DEFAULT_TOAST_DURATION;
      const nextMessage: ToastMessage = {
        id,
        title: options.title,
        description: options.description,
        variant: options.variant ?? "default",
        duration,
        actionLabel: options.actionLabel,
        onAction: options.onAction,
      };

      setMessages((previousMessages) => [...previousMessages, nextMessage]);

      if (duration > 0) {
        const timer = setTimeout(() => dismissToast(id), duration);
        timerMapRef.current.set(id, timer);
      }

      return id;
    },
    [dismissToast]
  );

  const handleToastAction = useCallback(
    (id: string) => {
      const targetMessage = messages.find((message) => message.id === id);
      if (targetMessage?.onAction) {
        targetMessage.onAction();
      }
      dismissToast(id);
    },
    [dismissToast, messages]
  );

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setConfirmQueue((previousQueue) => [
        ...previousQueue,
        { id: createFeedbackId(), options, resolve },
      ]);
    });
  }, []);

  const resolveConfirm = useCallback((accepted: boolean) => {
    setConfirmQueue((previousQueue) => {
      if (previousQueue.length === 0) {
        return previousQueue;
      }
      const [currentRequest, ...restQueue] = previousQueue;
      currentRequest.resolve(accepted);
      return restQueue;
    });
  }, []);

  const activeConfirm = confirmQueue[0] ?? null;

  const toastApi = useMemo<ToastApi>(() => {
    const buildVariant = (
      variant: ToastMessage["variant"]
    ): ((title: string, description?: string, duration?: number) => string) => {
      return (title: string, description?: string, duration?: number) =>
        showToast({ title, description, duration, variant });
    };

    return {
      show: showToast,
      dismiss: dismissToast,
      clear: clearToasts,
      success: buildVariant("success"),
      error: buildVariant("error"),
      warning: buildVariant("warning"),
      info: buildVariant("info"),
    };
  }, [clearToasts, dismissToast, showToast]);

  useEffect(() => {
    const timerMap = timerMapRef.current;
    return () => {
      timerMap.forEach((timer) => clearTimeout(timer));
      timerMap.clear();
    };
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      <ToastContext.Provider value={toastApi}>
        {children}
        <ConfirmLayer
          activeRequest={activeConfirm}
          onConfirm={() => resolveConfirm(true)}
          onCancel={() => resolveConfirm(false)}
        />
        <ToastLayer
          messages={messages}
          onDismiss={dismissToast}
          onAction={handleToastAction}
        />
      </ToastContext.Provider>
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const confirm = useContext(ConfirmContext);
  if (!confirm) {
    throw new Error("useConfirm must be used within FeedbackProvider");
  }
  return confirm;
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) {
    throw new Error("useToast must be used within FeedbackProvider");
  }
  return toast;
}
