# NextTrack

A session-based, privacy-first music recommendation app. No accounts, no stored
listening history — you feed it a song (or add songs into a playlist), and it recommends
what to play next based on that session alone.

Built as a REST API (Node/Express) backed by Last.fm, MusicBrainz, and
YouTube, with a React + TypeScript frontend on top.

## How it works

1. Search for a track, or build a playlist of several tracks at once
2. The backend pulls similar tracks from Last.fm, weighted by recency if you
   have more than one track in your session
3. Each candidate gets enriched with MusicBrainz metadata (album, year,
   duration) and Last.fm tags
4. Everything's scored on a blend of Last.fm similarity, tag overlap, era
   closeness, and popularity — see `backend/algorithms/scoringAlgorithm.js`
5. Optionally filter results to the same genre, same decade, and/or same
   artist as your seed track
6. Click a recommendation to play it — this pulls in a YouTube video and
   folds the track into your session, so the recommendations keep evolving
   as you go, like a radio station

## Project structure

```
NextTrack/
├── backend/     Express API — see backend/routes for endpoints
└── frontend/    React + TypeScript + Tailwind
```

## Prerequisites

- Node.js (v18+ recommended)
- A [Last.fm API key](https://www.last.fm/api/account/create) (free)
- A [YouTube Data API key](https://console.cloud.google.com/apis/library/youtube.googleapis.com) (free tier, 10,000 units/day)

## Setup

### Backend

```bash
cd backend
npm install
```

Create a `.env` file in `backend/` with your API keys:

```
LASTFM_API_KEY=your_key_here
YOUTUBE_API_KEY=your_key_here
```

Then run it:

```bash
node server.js
```

The API is now live at `http://localhost:5000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## API overview

| Method & path | What it does |
|---|---|
| `GET /api/search?q=...` | Search for tracks by name. Add `&enrich=true` for album/year/tags. |
| `POST /api/recommend` | Get recommendations for a session. Body: `{ session, preferences }`. |
| `GET /api/recommend?track=...&artist=...` | Quick-test version of the above, no body needed. |
| `GET /api/youtube?track=...&artist=...` | Look up a YouTube video for a track. |

`preferences` on `/api/recommend` supports `sameGenre`, `sameDecade`, and
`sameArtist` (all optional booleans) to constrain results to your seed
track's genre, decade, or artist.

## Notes on rate limits

- **MusicBrainz** allows ~1 request/sec per IP — the backend paces itself
  accordingly, so a full `/api/recommend` call takes ~15–25 seconds.
- **YouTube** videos are only fetched when a track is actually played, not
  upfront for every recommendation, to stay well within the daily quota.
