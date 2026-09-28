/** API functions for interacting with the backend **/
import axios from "axios";
import type { GenreOption, RecommendPreferences, RecommendResponse, SessionTrack } from "./types";
import type { YoutubeVideo } from "./types";
import { API_BASE_URL } from "./utils";

export async function fetchGenreOptions(): Promise<GenreOption[]> {
  const res = await axios.get<{ success: boolean; genres: GenreOption[] }>(`${API_BASE_URL}/api/genres`);
  return res.data.genres ?? [];
}

export async function fetchRecommendations(
  session: SessionTrack[],
  preferences: RecommendPreferences,
  mode: "session" | "playlist" = "session"
): Promise<RecommendResponse> {
  const res = await axios.post<RecommendResponse>(
    `${API_BASE_URL}/api/recommend`,
    {
      session,
      preferences,
      mode,
    }
  );

  return res.data;
}

export async function fetchYoutubeVideo(track: string, artist: string): Promise<YoutubeVideo | null> {
  const res = await axios.get<{ success: boolean; youtube: YoutubeVideo | null }>(
    `${API_BASE_URL}/api/youtube`,
    {
      params: { track, artist },
    }
  );

  return res.data.youtube ?? null;
}
