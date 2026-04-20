export const springs = {
  snappy: { type: "spring" as const, stiffness: 400, damping: 32, mass: 0.8 },
  smooth: { type: "spring" as const, stiffness: 220, damping: 28, mass: 1 },
  gentle: { type: "spring" as const, stiffness: 160, damping: 24, mass: 1.2 },
};

export const durations = { fast: 0.15, base: 0.25, slow: 0.4 };
