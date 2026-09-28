const express = require("express");
const router = express.Router();
const { searchTracks, getTrackInfo } = require("../services/lastfmService");
const { getMusicBrainzData } = require("../services/musicbrainzService");

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// -------------------- GET /api/search --------------------
// Query params:
//   q      (required) — search term, e.g. "Shut Down"
//   enrich (optional) — "true" to also fetch tags + album + year
//   limit  (optional) — how many results, default 8, max 20
//
// Basic:    GET /api/search?q=Shut+Down
// Enriched: GET /api/search?q=Shut+Down&enrich=true&limit=3

router.get("/search", async (req, res) => {
    const query = (req.query.q || "").trim();
    const enrich = req.query.enrich === "true";
    const limit = Math.min(parseInt(req.query.limit || "8", 10), 20);

    if (!query || query.length < 2) {
        return res.json({ success: true, results: [] });
    }

    try {
        const results = await searchTracks(query, limit);

        if (!enrich) {
            // Fast mode — return what Last.fm gives us
            return res.json({ success: true, enriched: false, results });
        }

        // Enriched mode — fetch MusicBrainz data and Last.fm tags for each result, paced to stay under MB's ~1 req/sec limit.
        const enriched = [];
        for (const r of results) {
            try {
                const [mb, info] = await Promise.all([
                    getMusicBrainzData(r.track, r.artist),
                    getTrackInfo(r.track, r.artist)
                ]);
                enriched.push({
                    ...r,
                    album: mb?.album || null,
                    year: mb?.year || null,
                    duration: mb?.duration || null,   // seconds
                    mbid: r.mbid || mb?.mbid || null, // prefer Last.fm mbid, fallback to MB lookup
                    tags: info.tags.slice(0, 5)       // top 5 genre tags
                });
            } catch {
                enriched.push({ ...r, album: null, year: null, duration: null, tags: [] });
            }
            await delay(1100);
        }

        return res.json({ success: true, enriched: true, results: enriched });

    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
