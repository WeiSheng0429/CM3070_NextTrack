// TrackCard.tsx
// Displays a track in the recommendation list, with album art, title, artist,
// and optional tags, BPM, and match score. Clicking the play button calls the
// onPlay callback with the track. Clicking the score opens a modal with a
// breakdown of how the score was calculated.
import { useState } from "react";
import { createPortal } from "react-dom";
import type { PlayableTrack, ScoreBreakdown } from "../types";
import { placeholderColor } from "../utils";
import { color, font } from "../theme";

type TrackCardProps = {
  song: PlayableTrack;
  onPlay: (song: PlayableTrack) => void;
  highlight?: boolean;
  compact?: boolean;
  index?: number;
};

// Helper component to display a track's album art or a letter avatar if no art is available.
type TrackAvatarProps = {
  track: string;
  artist: string;
  albumArt?: string | null;
  size?: number;
};

// Helper component to display a track's album art or a letter avatar if no art is available.
function TrackAvatar({ track, artist, albumArt, size = 44 }: TrackAvatarProps) {
  const style: React.CSSProperties = {
    width: size,
    height: size,
    borderRadius: "2px",
    flexShrink: 0,
    overflow: "hidden",
  };

  if (albumArt) {
    return (
      <div style={style}>
        <img
          src={albumArt}
          alt={`${track} cover`}
          style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          onError={(e) => {
            const wrapper = (e.target as HTMLImageElement).parentElement!;
            (e.target as HTMLImageElement).remove();
            wrapper.style.background = placeholderColor(track + artist);
            wrapper.style.display = "flex";
            wrapper.style.alignItems = "center";
            wrapper.style.justifyContent = "center";
            wrapper.style.color = "#fff";
            wrapper.style.fontWeight = "700";
            wrapper.style.fontSize = `${Math.round(size * 0.36)}px`;
            wrapper.textContent = artist.charAt(0).toUpperCase();
          }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        ...style,
        background: placeholderColor(track + artist),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#fff",
        fontWeight: 700,
        fontSize: Math.round(size * 0.36),
      }}
    >
      {artist.charAt(0).toUpperCase()}
    </div>
  );
}

function metaString(song: PlayableTrack): string {
  return [song.artist, song.album, song.year].filter(Boolean).join(" • ");
}

function ScoreBar({ value, barColor, label }: { value: number; barColor: string; label: string }) {
  const pct = Math.round(value * 100);
  return (
    <div style={{ marginBottom: "10px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", alignItems: "center" }}>
        <span style={{ fontSize: "12px", color: color.textMuted }}>{label}</span>
        <span style={{ fontFamily: font.mono, fontSize: "12px", fontWeight: 700, color: barColor, minWidth: "36px", textAlign: "right" }}>{pct}%</span>
      </div>
      <div style={{ height: "5px", background: color.line, borderRadius: "1px", overflow: "hidden" }}>
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: barColor,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

function ScoreModal({
  song,
  score,
  breakdown,
  onClose,
}: {
  song: PlayableTrack;
  score: number;
  breakdown?: ScoreBreakdown;
  onClose: () => void;
}) {
  const scoreColor = score >= 0.7 ? color.pink : score >= 0.4 ? color.violetBright : color.textMuted;

  const ringPct = Math.min(score / 1.0, 1) * 100;
  const circumference = 2 * Math.PI * 36; // r=36
  const offset = circumference - (ringPct / 100) * circumference;

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.8)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: color.surface,
          border: `1px solid ${color.line}`,
          borderTop: `3px solid ${color.violet}`,
          borderRadius: "2px",
          width: "100%",
          maxWidth: "420px",
          boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
          overflow: "hidden",
        }}
      >
        {/* Header band */}
        <div
          style={{
            background: color.surfaceRaised,
            borderBottom: `1px solid ${color.line}`,
            padding: "14px 18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <TrackAvatar track={song.track} artist={song.artist} albumArt={song.albumArt} size={36} />
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, color: color.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "240px" }}>
                {song.track}
              </div>
              <div style={{ fontFamily: font.mono, fontSize: "11px", color: color.textMuted }}>{song.artist}</div>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: "none",
              border: "none",
              color: color.textFaint,
              fontSize: "20px",
              cursor: "pointer",
              lineHeight: 1,
              padding: "0 4px",
              flexShrink: 0,
            }}
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 22px" }}>
          {/* Score ring + overall */}
          <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "22px" }}>
            <div style={{ flexShrink: 0, position: "relative", width: "88px", height: "88px" }}>
              <svg width="88" height="88" viewBox="0 0 88 88">
                <circle cx="44" cy="44" r="36" fill="none" stroke={color.line} strokeWidth="7" />
                <circle
                  cx="44"
                  cy="44"
                  r="36"
                  fill="none"
                  stroke={scoreColor}
                  strokeWidth="7"
                  strokeDasharray={circumference}
                  strokeDashoffset={offset}
                  transform="rotate(-90 44 44)"
                  style={{ transition: "stroke-dashoffset 0.6s ease" }}
                />
              </svg>
              <div style={{
                position: "absolute", inset: 0,
                display: "flex", flexDirection: "column",
                alignItems: "center", justifyContent: "center",
              }}>
                <span style={{ fontFamily: font.mono, fontSize: "16px", fontWeight: 700, color: scoreColor, lineHeight: 1 }}>
                  {score.toFixed(3)}
                </span>
                <span style={{ fontFamily: font.mono, fontSize: "9px", color: color.textFaint, marginTop: "2px" }}>/ 1.000</span>
              </div>
            </div>

            <div>
              <div style={{ fontFamily: font.display, fontSize: "16px", letterSpacing: "0.02em", color: color.text, marginBottom: "4px" }}>
                MATCH SCORE
              </div>
              <div style={{ fontSize: "12px", color: color.textMuted, lineHeight: "1.5" }}>
                Hybrid score combining 5 signals. Higher = more similar to your seed track.
              </div>
              <div style={{ marginTop: "8px", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {song.tags?.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    style={{
                      fontSize: "10px",
                      padding: "2px 8px",
                      borderRadius: "2px",
                      background: "rgba(124,58,237,0.12)",
                      color: color.violetBright,
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ height: "1px", background: color.line, marginBottom: "18px" }} />

          <div style={{ fontFamily: font.mono, fontSize: "11px", color: color.textFaint, marginBottom: "14px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
            Score Breakdown
          </div>

          {breakdown ? (
            <>
              <ScoreBar label={`Last.fm similarity  (${breakdown.genreMatch !== null ? "40" : "50"}% weight)`} value={breakdown.lastfmSimilarity} barColor={color.violetBright} />
              <ScoreBar label={`Tag overlap  (${breakdown.genreMatch !== null ? "15" : "25"}% weight)`} value={breakdown.tagOverlap} barColor={color.pink} />
              <ScoreBar label="Era similarity  (10% weight)" value={breakdown.eraSimilarity} barColor="#f0b429" />
              <ScoreBar label="Popularity  (10% weight)" value={breakdown.popularity} barColor="#34d399" />
              <ScoreBar label="Metadata bonus  (5% weight)" value={breakdown.metadataBonus} barColor="#f87171" />
              {breakdown.genreMatch !== null && (
                <ScoreBar label="Genre match  (20% weight)" value={breakdown.genreMatch} barColor="#22d3ee" />
              )}

              <div style={{ marginTop: "14px", background: color.ink, padding: "12px 14px", border: `1px solid ${color.line}`, borderRadius: "2px" }}>
                <div style={{ fontFamily: font.mono, fontSize: "11px", color: color.textFaint, marginBottom: "8px", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 600 }}>
                  Weighted contributions
                </div>
                {[
                  { label: "Last.fm similarity", raw: breakdown.lastfmSimilarity, weight: breakdown.genreMatch !== null ? 0.40 : 0.50, barColor: color.violetBright },
                  { label: "Tag overlap", raw: breakdown.tagOverlap, weight: breakdown.genreMatch !== null ? 0.15 : 0.25, barColor: color.pink },
                  { label: "Era similarity", raw: breakdown.eraSimilarity, weight: 0.10, barColor: "#f0b429" },
                  { label: "Popularity", raw: breakdown.popularity, weight: 0.10, barColor: "#34d399" },
                  { label: "Metadata bonus", raw: breakdown.metadataBonus, weight: 0.05, barColor: "#f87171" },
                  ...(breakdown.genreMatch !== null
                    ? [{ label: "Genre match", raw: breakdown.genreMatch, weight: 0.20, barColor: "#22d3ee" }]
                    : []),
                ].map(({ label, raw, weight, barColor }) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "4px" }}>
                    <span style={{ color: color.textMuted }}>{label}</span>
                    <span style={{ color: barColor, fontWeight: 600, fontFamily: font.mono }}>
                      {raw.toFixed(3)} × {weight.toFixed(2)} = {(raw * weight).toFixed(3)}
                    </span>
                  </div>
                ))}
                <div style={{ height: "1px", background: color.line, margin: "8px 0" }} />
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                  <span style={{ color: color.textMuted, fontWeight: 600 }}>Total</span>
                  <span style={{ color: scoreColor, fontWeight: 800, fontFamily: font.mono }}>{score.toFixed(3)}</span>
                </div>
              </div>
            </>
          ) : (
            <div style={{ fontSize: "12px", color: color.textFaint, textAlign: "center", padding: "20px 0" }}>
              No breakdown available for this track.
            </div>
          )}
        </div>

        <div style={{ borderTop: `1px solid ${color.line}`, padding: "10px 22px", textAlign: "center" }}>
          <span style={{ fontFamily: font.mono, fontSize: "11px", color: color.textFaint }}>Click anywhere outside to close</span>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function TrackCard({ song, onPlay, highlight = false, compact = false, index }: TrackCardProps) {
  const [showModal, setShowModal] = useState(false);
  const [hovered, setHovered] = useState(false);

  return (
    <>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="flex items-center gap-3 px-3 cursor-pointer"
        style={{
          paddingTop: highlight ? "14px" : "10px",
          paddingBottom: highlight ? "14px" : "10px",
          background: highlight ? "rgba(255,47,110,0.06)" : hovered ? color.surfaceRaised : "transparent",
          borderLeft: highlight ? `3px solid ${color.pink}` : "3px solid transparent",
          transition: "background 0.12s ease",
        }}
      >
        {/* Lineup index number for non-headliner rows */}
        {!highlight && typeof index === "number" && (
          <span
            style={{
              fontFamily: font.mono,
              fontSize: "11px",
              color: color.textFaint,
              width: "18px",
              flexShrink: 0,
              textAlign: "right",
            }}
          >
            {String(index).padStart(2, "0")}
          </span>
        )}

        <TrackAvatar
          track={song.track}
          artist={song.artist}
          albumArt={song.albumArt}
          size={compact ? 36 : highlight ? 52 : 44}
        />

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <div
            className="truncate"
            style={{
              color: color.text,
              fontWeight: highlight ? 400 : 600,
              fontFamily: highlight ? font.display : "inherit",
              fontSize: highlight ? "18px" : "14px",
              letterSpacing: highlight ? "0.01em" : "normal",
            }}
          >
            {song.track}
          </div>
          <div className="truncate" style={{ fontFamily: font.mono, fontSize: "11px", color: color.textMuted }}>
            {metaString(song)}
          </div>

          {/* Tags row */}
          {((song.tags && song.tags.length > 0) || typeof song.bpm === "number" || typeof song.score === "number") && (
            <div className="flex flex-wrap gap-1 mt-1">
              {song.tags?.slice(0, 2).map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5"
                  style={{ background: "rgba(124,58,237,0.12)", color: color.violetBright, borderRadius: "2px" }}
                >
                  {tag}
                </span>
              ))}

              {typeof song.bpm === "number" && (
                <span
                  className="text-xs px-2 py-0.5"
                  style={{ fontFamily: font.mono, background: "rgba(240,180,41,0.12)", color: "#f0b429", borderRadius: "2px" }}
                  title="Beats per minute (tempo)"
                >
                  ♩ {song.bpm} BPM
                </span>
              )}

              {typeof song.score === "number" && (
                <span
                  className="text-xs px-2 py-0.5 cursor-pointer"
                  style={{
                    fontFamily: font.mono,
                    background: "rgba(255,255,255,0.06)",
                    color: color.textMuted,
                    borderRadius: "2px",
                    borderBottom: `1px dashed ${color.pink}`,
                    userSelect: "none",
                  }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowModal(true);
                  }}
                  title="Click to see score breakdown"
                >
                  ★ {song.score} match
                </span>
              )}
            </div>
          )}
        </div>

        {/* Play button */}
        <button
          onClick={() => onPlay(song)}
          aria-label={`Play ${song.track}`}
          className="shrink-0 flex items-center justify-center transition-colors text-xs"
          style={{
            width: "30px",
            height: "30px",
            borderRadius: "2px",
            border: `1px solid ${color.violet}`,
            color: hovered ? color.ink : color.violetBright,
            background: hovered ? color.violet : "transparent",
          }}
        >
          ▶
        </button>
      </div>

      {showModal && typeof song.score === "number" && (
        <ScoreModal
          song={song}
          score={song.score}
          breakdown={song.scoreBreakdown}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
