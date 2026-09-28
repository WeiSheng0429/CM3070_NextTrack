// SessionContext.tsx
// React context for the current session state, including the list of tracks
// submitted so far, the current recommendations, and the currently playing
// track. Also handles fetching recommendations and YouTube videos.
import { createContext, useContext, useState, type ReactNode } from "react";
import { fetchRecommendations, fetchYoutubeVideo } from "../api";
import type {
  PlayableTrack,
  Recommendation,
  RecommendPreferences,
  RecommendStats,
  SearchedTrack,
  SessionTrack,
} from "../types";

const DEFAULT_PREFERENCES: RecommendPreferences = {
  genres: [],
  sameDecade: false,
  sameArtist: false,
};

export const MAX_SESSION_USED = 3;
export const MAX_SESSION_SHOWN = 5;

type SessionContextValue = {
  preferences: RecommendPreferences;
  setPreferences: (p: RecommendPreferences) => void;
  appliedPreferences: RecommendPreferences;
  applyPreferences: () => void;

  session: SessionTrack[];
  loading: boolean;
  error: string | null;

  searched: SearchedTrack | null;
  recommendations: Recommendation[];
  stats: RecommendStats | null;
  selectedSong: PlayableTrack | null;

  addToSession: (track: string, artist: string) => void;
  removeFromSession: (index: number) => void;
  clearSession: () => void;
  submitPlaylist: (tracks: SessionTrack[]) => void;
  play: (song: PlayableTrack) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<RecommendPreferences>(DEFAULT_PREFERENCES);
  const [appliedPreferences, setAppliedPreferences] = useState<RecommendPreferences>(DEFAULT_PREFERENCES);
  const [session, setSession] = useState<SessionTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searched, setSearched] = useState<SearchedTrack | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [stats, setStats] = useState<RecommendStats | null>(null);
  const [selectedSong, setSelectedSong] = useState<PlayableTrack | null>(null);
  const [recommendationMode, setRecommendationMode] = useState<"session" | "playlist">("session");

  // Re-fetches recommendations based on the current session and preferences.
  const runRecommendation = async (
    nextSession: SessionTrack[],
    options?: { autoPlay?: "seed" | "topRecommendation" | "none"; mode?: "session" | "playlist" }
  ) => {
    if (nextSession.length === 0) {
      setRecommendations([]);
      setSearched(null);
      setStats(null);
      setSelectedSong(null);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const requestMode = options?.mode || recommendationMode;
      const data = await fetchRecommendations(nextSession, preferences, requestMode);

      if (!data.success) {
        setError(data.message || "Something went wrong. Try again.");
        setRecommendations([]);
        setSearched(null);
        setStats(null);
        if (options?.autoPlay !== "none") setSelectedSong(null);
        return;
      }

      const recs = data.recommendations || [];
      setRecommendations(recs);
      setStats(data.stats || null);
      setAppliedPreferences(preferences);

      const result = data.searched || null;
      setSearched(result);

      if (options?.autoPlay === "topRecommendation" && recs.length > 0) {
        await playSong(recs[0]);
      } else if ((options?.autoPlay ?? "seed") === "seed") {
        setSelectedSong(result?.youtube ? result : null);
      }
      // If autoPlay is "none", we don't change the currently selected song at all.
    } catch (err) {
      console.error("API ERROR:", err);
      setError("Couldn't reach the server. Is the backend running?");
    } finally {
      setLoading(false);
    }
  };

  // Adds a track to the session queue, re-fetches recommendations, and optionally auto-plays the seed track.
  const addToSession = (track: string, artist: string) => {
    if (!track.trim() || !artist.trim()) return;

    setSession((prev) => {
      const key = (t: string, a: string) => `${t.toLowerCase()}-${a.toLowerCase()}`;
      const withoutDupe = prev.filter((s) => key(s.track, s.artist) !== key(track, artist));
      const next = [{ track, artist }, ...withoutDupe].slice(0, MAX_SESSION_SHOWN);
      runRecommendation(next, { mode: "session" });
      return next;
    });
  };

  const removeFromSession = (index: number) => {
    setSession((prev) => {
      const next = prev.filter((_, i) => i !== index);
      runRecommendation(next, { mode: "session" });
      return next;
    });
  };

  const clearSession = () => {
    setSession([]);
    runRecommendation([]);
  };

  const applyPreferences = () => {
    if (session.length === 0) return;
    runRecommendation(session, { autoPlay: "none", mode: recommendationMode });
  };

  
  const playSong = async (song: PlayableTrack) => {
    if (song.youtube) {
      setSelectedSong(song);
      return;
    }

    try {
      const youtube = await fetchYoutubeVideo(song.track, song.artist);
      setSelectedSong({ ...song, youtube });
    } catch (err) {
      console.error("YOUTUBE ERROR:", err);
      setSelectedSong({ ...song, youtube: null });
    }
  };

  // Playlist mode lets the user submit a full list of tracks (any number) and get recommendations based on the whole thing at once. 
  // This is different from the normal session mode, which only uses the 3 most recent tracks.
  const submitPlaylist = (tracks: SessionTrack[]) => {
    const cleaned = tracks
      .map((t) => ({ track: t.track.trim(), artist: t.artist.trim() }))
      .filter((t) => t.track && t.artist);

    const key = (t: string, a: string) => `${t.toLowerCase()}-${a.toLowerCase()}`;
    const seen = new Set<string>();
    const deduped = cleaned.filter((t) => {
      const k = key(t.track, t.artist);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    if (deduped.length === 0) {
      setError("Add at least one track to your playlist first.");
      return;
    }

    setSession(deduped);
    setRecommendationMode("playlist");
    runRecommendation(deduped, { autoPlay: "topRecommendation", mode: "playlist" });
  };

  // Plays a track and adds it to the session queue (if not already present). 
  // The session queue is capped at MAX_SESSION_SHOWN tracks, so if the queue is full, the oldest track is dropped.
  const play = async (song: PlayableTrack) => {
    await playSong(song);

    setSession((prev) => {
      const key = (t: string, a: string) => `${t.toLowerCase()}-${a.toLowerCase()}`;
      const withoutDupe = prev.filter((s) => key(s.track, s.artist) !== key(song.track, song.artist));
      const next = [{ track: song.track, artist: song.artist }, ...withoutDupe].slice(0, MAX_SESSION_SHOWN);
      runRecommendation(next, { autoPlay: "none" });
      return next;
    });
  };

  const value: SessionContextValue = {
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
    submitPlaylist,
    play,
  };

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within a SessionProvider");
  return ctx;
}
