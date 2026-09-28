// TrackList.tsx
// Displays a list of recommended tracks, with the "Up Next" track highlighted
// at the top and the rest of the lineup below. Clicking a track calls the onPlay
// callback with the track.
import type { PlayableTrack, Recommendation } from "../types";
import TrackCard from "./TrackCard";
import { color, font } from "../theme";

type TrackListProps = {
  recommendations: Recommendation[];
  loading: boolean;
  onPlay: (song: PlayableTrack) => void;
  currentSong?: PlayableTrack | null;
};

function trackKey(song: { track: string; artist: string }): string {
  return `${song.track}-${song.artist}`.toLowerCase();
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontFamily: font.mono,
        fontSize: "10px",
        fontWeight: 700,
        color: color.textFaint,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        padding: "0 12px",
      }}
    >
      {children}
    </div>
  );
}

export default function TrackList({ recommendations, loading, onPlay, currentSong }: TrackListProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 mt-2 px-3">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-12 animate-pulse"
            style={{ background: color.surface, opacity: 1 - i * 0.15, borderRadius: "2px" }}
          />
        ))}
      </div>
    );
  }

  if (recommendations.length === 0) return null;

  const currentKey = currentSong ? trackKey(currentSong) : null;
  const remaining = currentKey
    ? recommendations.filter((song) => trackKey(song) !== currentKey)
    : recommendations;

  if (remaining.length === 0) return null;

  const [upNext, ...others] = remaining;

  return (
    <div className="flex flex-col">
      <SectionLabel>Up Next — Headliner</SectionLabel>
      <div style={{ marginBottom: "18px", marginTop: "6px" }}>
        <TrackCard song={upNext} onPlay={onPlay} highlight />
      </div>

      {others.length > 0 && (
        <>
          <SectionLabel>The Rest Of The Lineup</SectionLabel>
          <div style={{ marginTop: "6px", borderTop: `1px solid ${color.line}` }}>
            {others.map((song, i) => (
              <div key={trackKey(song)} style={{ borderBottom: `1px solid ${color.line}` }}>
                <TrackCard song={song} onPlay={onPlay} index={i + 1} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
