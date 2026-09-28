const express = require("express");
const router = express.Router();
const { GENRES } = require("../algorithms/genreTaxonomy");

// -------------------- GET /api/genres --------------------
// Returns a list of available genres with their IDs and labels.
router.get("/genres", (req, res) => {
    res.json({
        success: true,
        genres: GENRES.map(({ id, label }) => ({ id, label })),
    });
});

module.exports = router;
