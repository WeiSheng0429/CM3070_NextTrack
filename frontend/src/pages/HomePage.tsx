/** Home page **/
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSession } from "../context/SessionContext";
import SearchBar from "../components/SearchBar";
import Logo from "../components/Logo";
import { color, font } from "../theme";
import type { SessionTrack } from "../types";

export default function HomePage() {
  const navigate = useNavigate();
  const { error, session, addToSession, submitPlaylist, clearSession } = useSession();

  const [mode, setMode] = useState<"search" | "playlist">("search");

  // Playlist mode lets the user submit a full list of tracks (any number) and get recommendations based on the whole thing at once.
  const [playlistDraft, setPlaylistDraft] = useState<SessionTrack[]>([]);

  const handleSearch = (track: string, artist: string) => {
    addToSession(track, artist);
    navigate("/player");
  };

  const addToPlaylistDraft = (track: string, artist: string) => {
    const key = (t: string, a: string) => `${t.toLowerCase()}-${a.toLowerCase()}`;
    setPlaylistDraft((prev) => {
      if (prev.some((s) => key(s.track, s.artist) === key(track, artist))) return prev;
      return [...prev, { track, artist }];
    });
  };

  const removeFromPlaylistDraft = (index: number) => {
    setPlaylistDraft((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePlaylistSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (playlistDraft.length === 0) return;
    submitPlaylist(playlistDraft);
    navigate("/player");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: color.ink,
        padding: "24px",
      }}
    >
      <div style={{ width: "100%", maxWidth: "600px" }}>
        {/* Logo */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
          <Logo size={64} />
        </div>

        {/* Poster-style headline, not a muted caption */}
        <div
          style={{
            fontFamily: font.display,
            fontSize: "clamp(28px, 5vw, 40px)",
            lineHeight: 1.05,
            textAlign: "center",
            color: color.text,
            marginBottom: "18px",
            letterSpacing: "0.01em",
          }}
        >
          WHAT PLAYS <span style={{ color: color.violetBright }}>NEXT?</span>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "26px",
          }}
        >
          <div style={{ flex: 1, height: "1px", background: color.line }} />
          <span
            style={{
              ...( { fontFamily: font.mono } ),
              fontSize: "11px",
              color: color.textMuted,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
            }}
          >
            search one, or build a playlist
          </span>
          <div style={{ flex: 1, height: "1px", background: color.line }} />
        </div>

        {/* Mode toggle — underline tabs, not a pill switch */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${color.line}`,
            marginBottom: "22px",
          }}
        >
          {(
            [
              { key: "search" as const, label: "Search a track" },
              { key: "playlist" as const, label: "Build a playlist" },
            ]
          ).map((tab) => {
            const active = mode === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setMode(tab.key)}
                style={{
                  fontFamily: font.display,
                  fontSize: "16px",
                  letterSpacing: "0.03em",
                  padding: "0 4px 12px",
                  marginRight: "28px",
                  background: "none",
                  border: "none",
                  borderBottom: `3px solid ${active ? color.pink : "transparent"}`,
                  color: active ? color.text : color.textFaint,
                  cursor: "pointer",
                  transition: "color 0.15s ease, border-color 0.15s ease",
                }}
              >
                {tab.label.toUpperCase()}
              </button>
            );
          })}
        </div>

        {error && (
          <div
            className="text-sm text-red-400"
            style={{
              background: "rgba(255,77,77,0.08)",
              border: "1px solid rgba(255,77,77,0.35)",
              borderRadius: "2px",
              padding: "10px 12px",
              marginBottom: "16px",
              textAlign: "left",
            }}
            role="alert"
          >
            {error}
          </div>
        )}

        {mode === "search" ? (
          <SearchBar
            variant="hero"
            onSearch={handleSearch}
            placeholder='Try "Shut Down BLACKPINK" or just an artist name'
            loading={false}
          />
        ) : (
          <form
            onSubmit={handlePlaylistSubmit}
            style={{
              background: color.surface,
              border: `1px solid ${color.line}`,
              borderLeft: `3px solid ${color.pink}`,
              borderRadius: "2px",
              padding: "20px",
              display: "grid",
              gap: "14px",
              textAlign: "left",
            }}
          >
            <div
              style={{
                fontFamily: font.mono,
                color: color.textMuted,
                fontSize: "11px",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                lineHeight: 1.6,
              }}
            >
              Search and add as many tracks as you like, then get one set of recs based on the whole playlist.
            </div>

            <SearchBar
              variant="compact"
              placeholder="Search a track to add…"
              onSearch={addToPlaylistDraft}
              loading={false}
            />

            {playlistDraft.length > 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  maxHeight: "220px",
                  overflowY: "auto",
                }}
              >
                {playlistDraft.map((item, i) => (
                  <div
                    key={`${item.track}-${item.artist}-${i}`}
                    className="flex items-center justify-between gap-2"
                    style={{
                      background: color.ink,
                      border: `1px solid ${color.line}`,
                      borderRadius: "2px",
                      padding: "8px 10px",
                    }}
                  >
                    <div style={{ minWidth: 0, overflow: "hidden" }}>
                      <span
                        style={{
                          fontFamily: font.mono,
                          fontSize: "10px",
                          color: color.textFaint,
                          marginRight: "8px",
                        }}
                      >
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <span style={{ fontSize: "13px", fontWeight: 600, color: color.text }}>{item.track}</span>
                      <span
                        style={{
                          fontFamily: font.mono,
                          fontSize: "11px",
                          color: color.textMuted,
                          marginLeft: "8px",
                        }}
                      >
                        {item.artist}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFromPlaylistDraft(i)}
                      aria-label={`Remove ${item.track} from playlist`}
                      style={{
                        background: "none",
                        border: "none",
                        color: color.textFaint,
                        cursor: "pointer",
                        fontSize: "16px",
                        lineHeight: 1,
                        flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={playlistDraft.length === 0}
                style={{
                  fontFamily: font.display,
                  fontSize: "15px",
                  letterSpacing: "0.04em",
                  padding: "10px 20px",
                  borderRadius: "2px",
                  border: `2px solid ${playlistDraft.length > 0 ? color.pink : color.line}`,
                  background: playlistDraft.length > 0 ? color.pink : "transparent",
                  color: playlistDraft.length > 0 ? color.ink : color.textFaint,
                  cursor: playlistDraft.length > 0 ? "pointer" : "not-allowed",
                  transition: "background 0.15s ease, color 0.15s ease",
                }}
              >
                GET RECOMMENDATIONS →
              </button>
              {playlistDraft.length > 0 && (
                <button
                  type="button"
                  onClick={() => setPlaylistDraft([])}
                  style={{
                    background: "none",
                    border: "none",
                    color: color.textFaint,
                    fontSize: "11px",
                    cursor: "pointer",
                    fontFamily: font.mono,
                    textTransform: "uppercase",
                    letterSpacing: "0.05em",
                  }}
                >
                  Clear playlist
                </button>
              )}
            </div>
          </form>
        )}

        {/* Returning users with an existing session can jump straight back in —
            styled like a ticket stub with a perforated edge. */}
        {session.length > 0 && (
          <div
            style={{
              marginTop: "26px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              background: color.surface,
              borderTop: `1px dashed ${color.lineBright}`,
              borderBottom: `1px dashed ${color.lineBright}`,
              padding: "12px 16px",
              textAlign: "left",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div
                style={{
                  fontFamily: font.mono,
                  fontSize: "10px",
                  color: color.textFaint,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  marginBottom: "3px",
                }}
              >
                Current session
              </div>
              <div style={{ fontSize: "13px", color: color.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {session.map((s) => s.track).join(" → ")}
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", flexShrink: 0 }}>
              <button
                onClick={clearSession}
                style={{
                  background: "none",
                  border: "none",
                  color: color.textFaint,
                  fontSize: "11px",
                  cursor: "pointer",
                  fontFamily: font.mono,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                }}
              >
                Clear
              </button>
              <button
                onClick={() => navigate("/player")}
                style={{
                  fontFamily: font.display,
                  fontSize: "14px",
                  letterSpacing: "0.03em",
                  padding: "8px 16px",
                  borderRadius: "2px",
                  border: `2px solid ${color.pink}`,
                  background: "transparent",
                  color: color.pink,
                  cursor: "pointer",
                }}
              >
                GO TO PLAYER →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
