/**NextTrack design**/
export const color = {
  ink: "#0a090f",
  surface: "#141018",
  surfaceRaised: "#1c1622",
  line: "#2e2640",
  lineBright: "#453a5c",
  violet: "#7c3aed",
  violetBright: "#a78bfa",
  pink: "#ff2f6e",
  text: "#f2eefc",
  textMuted: "#948da3",
  textFaint: "#5c5568",
  danger: "#ff4d4d",
};

export const font = {
  display: "'Bebas Neue', 'Arial Narrow', sans-serif",
  body: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', 'SF Mono', monospace",
};

/** Shared inline-style fragments so components stay visually consistent. */
export const styleKit = {
  displayLabel: {
    fontFamily: font.display,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
  },
  monoLabel: {
    fontFamily: font.mono,
    letterSpacing: "0.02em",
  },
  hardBorder: `1px solid ${color.line}`,
};
