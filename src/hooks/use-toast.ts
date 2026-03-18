import { useMemo } from "react";
import { useToast as useFeedbackToast } from "@/components/feedback/feedback-provider";
import type { ToastApi, ToastOptions } from "@/components/feedback/types";
import { getErrorMessage } from "@/shared/errors";

export function useToast(): ToastApi {
  const toast = useFeedbackToast();

  return useMemo<ToastApi>(() => {
    return {
      ...toast,
      show: (options: ToastOptions): string =>
        toast.show({
          ...options,
          title: getErrorMessage(options.title),
          description: undefined,
        }),
      success: (title: string, _description?: string, duration?: number): string =>
        toast.success(getErrorMessage(title), undefined, duration),
      error: (title: string, _description?: string, duration?: number): string =>
        toast.error(getErrorMessage(title), undefined, duration),
      warning: (title: string, _description?: string, duration?: number): string =>
        toast.warning(getErrorMessage(title), undefined, duration),
      info: (title: string, _description?: string, duration?: number): string =>
        toast.info(getErrorMessage(title), undefined, duration),
    };
  }, [toast]);
}
