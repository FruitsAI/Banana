export interface MotionMath {
  reduced: boolean;
  duration: (value: number) => number;
  distance: (value: number) => number;
  scale: (value: number) => number;
  scaleFactor?: number;
}

export interface MotionPresetValues {
  panel: {
    initial: false | { opacity: number; y: number; scale: number };
    animate: { opacity: number; y: number; scale: number };
    transition: { duration: number; ease: [number, number, number, number] };
  };
  control: {
    hover: undefined | { y: number; scale: number };
    tap: undefined | { scale: number };
    transition: { type: "spring"; stiffness: number; damping: number; mass: number };
  };
  focus: {
    active: { scale: number };
    rest: { scale: number };
    transition: { duration: number; ease: [number, number, number, number] };
  };
  selection: {
    transition: { type: "spring"; stiffness: number; damping: number; mass: number };
  };
  accessory: {
    initial: false | { opacity: number; y: number; scale: number };
    animate: { opacity: number; y: number; scale: number };
    transition: { duration: number; ease: [number, number, number, number] };
  };
}

export function createMotionPresets({
  reduced,
  duration,
  distance,
  scale,
  scaleFactor = 1,
}: MotionMath): MotionPresetValues {
  return {
    panel: {
      initial: reduced ? false : { opacity: 0, y: distance(12), scale: scale(0.985) },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: duration(0.34), ease: [0.16, 1, 0.3, 1] },
    },
    control: {
      hover: reduced
        ? undefined
        : {
            y: -distance(1.5),
            scale: Number((1 + 0.018 * scaleFactor).toFixed(3)),
          },
      tap: reduced ? undefined : { scale: scale(0.97) },
      transition: { type: "spring", stiffness: 420, damping: 30, mass: 0.8 },
    },
    focus: {
      active: { scale: Number((1 + 0.01 * scaleFactor).toFixed(3)) },
      rest: { scale: 1 },
      transition: { duration: duration(0.22), ease: [0.2, 0.9, 0.2, 1] },
    },
    selection: {
      transition: { type: "spring", stiffness: 440, damping: 32, mass: 0.78 },
    },
    accessory: {
      initial: reduced ? false : { opacity: 0, y: distance(8), scale: scale(0.965) },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { duration: duration(0.24), ease: [0.2, 1, 0.32, 1] },
    },
  };
}
