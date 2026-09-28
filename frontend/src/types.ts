/** Type definitions for the NextTrack frontend **/
export type SessionTrack = {
  track: string;
  artist: string;
};

export type YoutubeVideo = {
  videoId: string;
  title: string;
  thumbnail?: string;
};

export type SearchedTrack = {
  track: string;
  artist: string;
  album: string | null;
  year: number | null;
  tags: string[];
  bpm: number | null;
  albumArt: string | null;
  youtube: YoutubeVideo | null;
};

export type Recommendation = {
  track: string;
  artist: string;
  album: string | null;
  year: number | null;
  score: number;
  scoreBreakdown: ScoreBreakdown;
  tags: string[];
  bpm: number | null;
  albumArt: string | null;
  mbid: string | null;
  youtube: YoutubeVideo | null;
};

// Breakdown of how the score was computed — shown in UI tooltip
export type ScoreBreakdown = {
  lastfmSimilarity: number;  // 50% weight (40% if genres selected)
  tagOverlap: number;        // 25% weight (15% if genres selected)
  eraSimilarity: number;     // 10% weight
  popularity: number;        // 10% weight
  metadataBonus: number;     // 5% weight
  genreMatch: number | null;
};

export type RecommendStats = {
  tracksAnalyzed: number;
  bestMatch: number;
  averageMatch: number;
  topTierMatch: number;
  scoreSpread: number;
  searchTimeMs: number;
  listenedTracks: number;
};

export type GenreOption = {
  id: string;
  label: string;
};

export type RecommendPreferences = {
  // Genre ids from GET /api/genres. Empty array = no genre filter.
  genres: string[];
  sameDecade: boolean;
  sameArtist: boolean;
};

export type RecommendResponse = {
  success: boolean;
  mode?: "session" | "playlist";
  message?: string;
  searched?: SearchedTrack | null;
  recommendations?: Recommendation[];
  stats?: RecommendStats;
};

// A generic "playable track" shape used by components that don't care
// whether they're rendering the searched track or a recommendation.
export type PlayableTrack = {
  track: string;
  artist: string;
  album?: string | null;
  year?: number | null;
  tags?: string[];
  bpm?: number | null;
  albumArt?: string | null;
  score?: number;
  scoreBreakdown?: ScoreBreakdown;
  youtube?: YoutubeVideo | null;
};
