const express = require("express");
const router = express.Router();
const { recommendEngine } = require("../core/recommendEngine");

// -------------------- POST /api/recommend --------------------
// Accepts a JSON body with a session (array of track/artist objects) and user preferences, then returns recommended tracks based on the session and preferences.
//
// Body (JSON):
// {
//   "session": [
//     { "track": "Shut Down", "artist": "BLACKPINK" },
//     { "track": "Typa Girl", "artist": "BLACKPINK" }
//   ],
//   "preferences": {
//     "genres": ["kpop", "hiphop"],
//     "sameDecade": false,
//     "sameArtist": false
//   }
// }

router.post("/recommend", async (req, res) => {
    try {
        // Make sure the request body exists
        const body = req.body || {};

        // Validate the session before sending it to the recommendation engine
        if (!Array.isArray(body.session) || body.session.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Session required"
            });
        }

        const result = await recommendEngine(body);

        res.json(result);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});


// -------------------- GET /api/recommend --------------------
// Quick-test version — query params, no body needed.
//
// Query params:
//   track      (required) — seed track name
//   artist     (required) — seed artist name
//   genres     (optional) — comma-separated genre ids,
//                           e.g. "kpop,hiphop"
//   sameDecade (optional) — "true" to filter by decade
//   sameArtist (optional) — "true" to filter by artist
//
// Examples:
//   GET /api/recommend?track=Shut+Down&artist=BLACKPINK
//   GET /api/recommend?track=Shut+Down&artist=BLACKPINK&genres=kpop
//   GET /api/recommend?track=Shut+Down&artist=BLACKPINK&genres=kpop,hiphop&sameDecade=true
//   GET /api/recommend?track=Shut+Down&artist=BLACKPINK&sameArtist=true

router.get("/recommend", async (req, res) => {
    try {
        const {
            track,
            artist,
            genres,
            sameDecade,
            sameArtist
        } = req.query;

        // Track and artist are required for GET recommendation
        if (!track || !artist) {
            return res.status(400).json({
                success: false,
                message: "Missing required query params: track and artist"
            });
        }

        // Convert comma-separated genre ids into an array
        const selectedGenres =
            typeof genres === "string"
                ? genres
                      .split(",")
                      .map(g => g.trim())
                      .filter(Boolean)
                : [];

        const result = await recommendEngine({
            session: [
                {
                    track,
                    artist
                }
            ],

            preferences: {
                genres: selectedGenres,
                sameDecade: sameDecade === "true",
                sameArtist: sameArtist === "true"
            }
        });

        res.json(result);
    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
});

module.exports = router;