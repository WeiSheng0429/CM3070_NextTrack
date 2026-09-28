// YouTube service for fetching video metadata by track/artist.
const axios = require("axios");

const API_KEY = process.env.YOUTUBE_API_KEY;
const CACHE_TTL_MS = 15 * 60 * 1000;
const youtubeCache = new Map();

function normalizeKey(track, artist) {
    return `${(track || "").toLowerCase().trim()}::${(artist || "").toLowerCase().trim()}`;
}

// Retrieve a cached YouTube video result for a given track and artist, if it exists and is still valid.
function getCachedYoutubeVideo(track, artist) {
    const key = normalizeKey(track, artist);
    const cached = youtubeCache.get(key);

    if (!cached) return null;
    if (Date.now() - cached.timestamp > CACHE_TTL_MS) {
        youtubeCache.delete(key);
        return null;
    }

    return cached.value;
}

// Store a YouTube video result in the cache for a given track and artist, along with the current timestamp.
function setCachedYoutubeVideo(track, artist, value) {
    const key = normalizeKey(track, artist);
    youtubeCache.set(key, { value, timestamp: Date.now() });
}

// -------------------- YOUTUBE SERVICE --------------------
// This function fetches the most relevant YouTube video for a given track and artist, using the YouTube Data API v3.
async function getYoutubeVideo(track, artist) {
    const cached = getCachedYoutubeVideo(track, artist);
    if (cached) return cached;

    if (!API_KEY) {
        return null;
    }

    try {
        // "Official Video" biases results toward official music videos
        const query = `${track} ${artist} Official Video`;

        const res = await axios.get("https://www.googleapis.com/youtube/v3/search", {
            params: {
                part: "snippet",
                q: query,
                key: API_KEY,
                maxResults: 1,
                type: "video",
                videoCategoryId: "10",  // Music category
            }
        });

        const item = res.data.items?.[0];
        const result = item
            ? {
                videoId: item.id.videoId,
                title: item.snippet.title,
                thumbnail: item.snippet.thumbnails.medium.url
            }
            : null;

        setCachedYoutubeVideo(track, artist, result);
        return result;

    } catch (err) {
        console.log("YouTube API error:", err.message);
        return null;
    }
}

module.exports = { getYoutubeVideo };
