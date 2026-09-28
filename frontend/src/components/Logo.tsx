import { color, font } from "../theme";

type LogoProps = {
  size?: number;
  showText?: boolean;
};

/**NextTrack logo **/
export default function Logo({ size = 40, showText = true }: LogoProps) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: Math.round(size * 0.2),
      }}
    >
      <img
        src="/nexttrack_logo.png"
        alt="NextTrack"
        style={{ height: size, width: "auto", display: "block", flexShrink: 0 }}
      />
      {showText && (
        <span
          style={{
            fontFamily: font.display,
            fontSize: Math.round(size * 0.78),
            lineHeight: 1,
            letterSpacing: "0.02em",
            color: color.text,
            whiteSpace: "nowrap",
          }}
        >
          NEXT<span style={{ color: color.pink }}>TRACK</span>
        </span>
      )}
    </div>
  );
}
