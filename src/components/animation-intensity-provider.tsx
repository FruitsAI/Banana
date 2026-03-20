"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useConfigStore } from "@/stores/config/useConfigStore";
import {
  ANIMATION_INTENSITY_CONFIG_KEY,
  DEFAULT_ANIMATION_INTENSITY,
  getMotionFactors,
  normalizeAnimationIntensity,
  type AnimationIntensity,
  type MotionFactors,
} from "@/lib/animation-intensity";

interface AnimationIntensityContextValue {
  intensity: AnimationIntensity;
  factors: MotionFactors;
  isLoading: boolean;
  setIntensity: (next: AnimationIntensity) => Promise<void>;
}

const AnimationIntensityContext = createContext<AnimationIntensityContextValue>({
  intensity: DEFAULT_ANIMATION_INTENSITY,
  factors: getMotionFactors(DEFAULT_ANIMATION_INTENSITY),
  isLoading: true,
  setIntensity: async () => undefined,
});

function applyIntensityToDocument(intensity: AnimationIntensity) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.motionLevel = intensity;
}

export function AnimationIntensityProvider({ children }: { children: ReactNode }) {
  const { loadConfig, saveConfig } = useConfigStore();
  const [intensity, setIntensityState] = useState<AnimationIntensity>(
    DEFAULT_ANIMATION_INTENSITY
  );
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const loadIntensity = async () => {
      try {
        const stored = await loadConfig(ANIMATION_INTENSITY_CONFIG_KEY);
        if (!active) return;
        const normalized = normalizeAnimationIntensity(stored);
        setIntensityState(normalized);
        applyIntensityToDocument(normalized);
      } catch (error) {
        if (!active) return;
        console.error("Failed to load animation intensity:", error);
        applyIntensityToDocument(DEFAULT_ANIMATION_INTENSITY);
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadIntensity();

    return () => {
      active = false;
    };
  }, [loadConfig]);

  const setIntensity = useCallback(async (next: AnimationIntensity) => {
    const normalized = normalizeAnimationIntensity(next);
    setIntensityState(normalized);
    applyIntensityToDocument(normalized);

    try {
      await saveConfig(ANIMATION_INTENSITY_CONFIG_KEY, normalized);
    } catch (error) {
      console.error("Failed to save animation intensity:", error);
    }
  }, [saveConfig]);

  const value = useMemo<AnimationIntensityContextValue>(
    () => ({
      intensity,
      factors: getMotionFactors(intensity),
      isLoading,
      setIntensity,
    }),
    [intensity, isLoading, setIntensity]
  );

  return (
    <AnimationIntensityContext.Provider value={value}>
      {children}
    </AnimationIntensityContext.Provider>
  );
}

export function useAnimationIntensity() {
  return useContext(AnimationIntensityContext);
}
