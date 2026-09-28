/** Player page — shows the current track, video player, and recommendations **/
import { useNavigate } from "react-router-dom";
import { useSession, MAX_SESSION_USED } from "../context/SessionContext";
import SearchBar from "../components/SearchBar";
import Sidebar from "../components/Sidebar";
import TrackList from "../components/TrackList";
import Logo from "../components/Logo";
import { color, font } from "../theme";

function getYTUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?autoplay=1`;
}

export default function PlayerPage() {
  const navigate = useNavigate();
  const {
    preferences,
    setPreferences,
    appliedPreferences,
    applyPreferences,
    session,
    loading,
    error,
    searched,
    recommendations,
    stats,
    selectedSong,
    addToSession,
    removeFromSession,
    clearSession,
    play,
  } = useSession();

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden", background: color.ink }}>
      {/* Top bar: logo/back link + compact search to add more tracks */}
      <header
        className="flex items-center gap-4 px-6"
        style={{ height: "58px", background: color.ink, borderBottom: `1px solid ${color.line}`, flexShrink: 0 }}
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center shrink-0"
          style={{ minWidth: "150px", background: "none", border: "none", cursor: "pointer" }}
        >
          <Logo size={26} />
        </button>

        <div className="flex-1 max-w-xl mx-auto">
          <SearchBar variant="compact" onSearch={addToSession} loading={false} />
        </div>
      </header>

      {/* Session queue — which tracks are feeding the recommendation */}
      {session.length === 0 ? (
        <div style={{ fontFamily: font.mono, fontSize: "11px", color: color.textFaint, padding: "9px 24px", borderBottom: `1px solid ${color.line}` }}>
          No tracks in your session yet — search above, or{" "}
          <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: color.pink, cursor: "pointer", textDecoration: "underline", padding: 0, fontFamily: font.mono }}>
            go back home
          </button>{" "}
          to search or build a playlist.
        </div>
      ) : (
        <div className="flex items-center gap-2 flex-wrap" style={{ padding: "8px 24px", borderBottom: `1px solid ${color.line}` }}>
          <span style={{ fontFamily: font.mono, fontSize: "10px", color: color.textFaint, fontWeight: 700, letterSpacing: "0.08em", flexShrink: 0, textTransform: "uppercase" }}>
            Session
          </span>
          {session.map((item, i) => {
            const used = i < MAX_SESSION_USED;
            return (
              <span
                key={`${item.track}-${item.artist}-${i}`}
                className="flex items-center gap-1.5"
                style={{
                  background: used ? "rgba(124,58,237,0.1)" : color.surface,
                  border: `1px solid ${used ? "rgba(124,58,237,0.35)" : color.line}`,
                  borderRadius: "2px",
                  padding: "3px 8px 3px 10px",
                  fontSize: "12px",
                  color: used ? color.text : color.textFaint,
                }}
                title={used ? "Used to generate the current recommendations" : "Session only keeps the 3 most recent tracks"}
              >
                {i === 0 && <span style={{ color: color.pink }}>●</span>}
                <span style={{ maxWidth: "180px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {item.track} <span style={{ color: color.textFaint, fontFamily: font.mono, fontSize: "11px" }}>— {item.artist}</span>
                </span>
                <button
                  onClick={() => removeFromSession(i)}
                  aria-label={`Remove ${item.track} from session`}
                  style={{ background: "none", border: "none", color: color.textFaint, cursor: "pointer", fontSize: "13px", lineHeight: 1, padding: "0 2px" }}
                >
                  ×
                </button>
              </span>
            );
          })}
          <button
            onClick={clearSession}
            style={{ background: "none", border: "none", color: color.textFaint, fontSize: "11px", cursor: "pointer", marginLeft: "4px", textDecoration: "underline", flexShrink: 0, fontFamily: font.mono }}
          >
            Clear session
          </button>
        </div>
      )}

      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        <Sidebar
          preferences={preferences}
          onPreferencesChange={setPreferences}
          appliedPreferences={appliedPreferences}
          onApply={applyPreferences}
          canApply={session.length > 0}
          applying={loading}
          seedTags={searched?.tags}
          seedYear={searched?.year}
          seedArtist={searched?.artist ?? session[0]?.artist ?? null}
        />

        <main
          style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px", minWidth: 0 }}
        >
          {error && (
            <div
              className="text-sm"
              style={{ background: "rgba(255,77,77,0.08)", border: "1px solid rgba(255,77,77,0.35)", borderRadius: "2px", padding: "10px 12px", color: "#ff8a8a" }}
              role="alert"
            >
              {error}
            </div>
          )}

          {/* Now playing — track name/meta above the video, merged from the old NowPlayingBar */}
          {selectedSong && (
            <div>
              <div style={{ fontFamily: font.mono, fontSize: "10px", color: color.pink, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2px" }}>
                Now Playing
              </div>
              <div style={{ fontFamily: font.display, fontSize: "22px", letterSpacing: "0.01em", color: color.text }}>
                {selectedSong.track}
              </div>
              <div style={{ fontFamily: font.mono, fontSize: "12px", color: color.textMuted }}>
                {[selectedSong.artist, selectedSong.album, selectedSong.year].filter(Boolean).join(" • ")}
              </div>
            </div>
          )}

          {/* Video player */}
          {selectedSong?.youtube ? (
            <div style={{ width: "90%", margin: "0 auto" }}>
              <iframe
                width="100%"
                style={{ aspectRatio: "16/9", borderRadius: "2px", display: "block", border: `1px solid ${color.line}` }}
                src={getYTUrl(selectedSong.youtube.videoId)}
                title={`YouTube player for ${selectedSong.track}`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          ) : (
            <div
              className="flex items-center justify-center text-sm"
              style={{ width: "90%", margin: "0 auto", aspectRatio: "16/9", background: color.surface, border: `1px dashed ${color.line}`, borderRadius: "2px", color: color.textFaint, fontFamily: font.mono }}
            >
              {session.length === 0 ? "Search a track to start playing" : "Loading player…"}
            </div>
          )}

          {/* Stats panel */}
          {stats && (
            <div style={{ background: color.surface, border: `1px solid ${color.line}`, borderRadius: "2px", padding: "16px" }}>
              <div style={{ fontFamily: font.mono, fontSize: "10px", fontWeight: 700, color: color.textFaint, textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
                Stats
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Tracks analyzed", value: stats.tracksAnalyzed.toLocaleString() },
                  { label: "Best match", value: `${stats.bestMatch}%` },
                  { label: "Average match", value: `${stats.averageMatch}%` },
                  { label: "Top-tier match (95th percentile)", value: `${stats.topTierMatch}%` },
                  { label: "Score spread (STD)", value: stats.scoreSpread.toFixed(3) },
                  { label: "Search time", value: `${stats.searchTimeMs}ms` },
                  { label: "Songs in session", value: stats.listenedTracks.toLocaleString() },
                ].map((item) => (
                  <div key={item.label} style={{ background: color.ink, border: `1px solid ${color.line}`, borderRadius: "2px", padding: "10px 12px" }}>
                    <div style={{ fontSize: "11px", color: color.textFaint, marginBottom: "4px", lineHeight: 1.3 }}>{item.label}</div>
                    <div style={{ fontFamily: font.mono, fontSize: "18px", fontWeight: 700, color: color.text }}>{item.value}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!searched && !loading && session.length === 0 && (
            <div className="text-center text-sm mt-8" style={{ color: color.textFaint, fontFamily: font.mono }}>
              Search for a track above to get started
            </div>
          )}
        </main>

        <aside
          style={{ width: "320px", minWidth: "280px", background: color.ink, borderLeft: `1px solid ${color.line}`, overflowY: "auto", padding: "16px 0" }}
        >
          {recommendations.length === 0 && !loading ? (
            <div className="text-xs text-center mt-8 px-4" style={{ color: color.textFaint, fontFamily: font.mono }}>
              Recommendations will appear here
            </div>
          ) : (
            <TrackList recommendations={recommendations} loading={loading} onPlay={play} currentSong={selectedSong} />
          )}
        </aside>
      </div>
    </div>
  );
}
