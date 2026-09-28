const express = require("express");
const router = express.Router();
const { getYoutubeVideo } = require("../services/youtubeService");

router.get("/youtube", async (req, res) => {
    // -------------------- GET /api/youtube --------------------
    // Query params:
    //   track  (required) — track name, e.g. "Shut Down"
    //   artist (required) — artist name, e.g. "BLACKPINK"
    const track = (req.query.track || "").trim();
    const artist = (req.query.artist || "").trim();

    if (!track || !artist) {
        return res.status(400).json({ success: false, message: "track and artist are required" });
    }

    try {
        const youtube = await getYoutubeVideo(track, artist);
        return res.json({ success: true, youtube });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;
