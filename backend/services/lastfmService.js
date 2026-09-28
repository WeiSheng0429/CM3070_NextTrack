const axios = require("axios");

const API_KEY = process.env.LASTFM_API_KEY;

// -------------------- SIMILAR TRACKS --------------------
async function getSimilarTracks(track, artist) {
    try {
        const url = `https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&track=${encodeURIComponent(track)}&artist=${encodeURIComponent(artist)}&api_key=${API_KEY}&format=json`;
        const response = await axios.get(url);

        const similar = response.data?.similartracks?.track || [];
        if (!similar.length) return [];

        // Clean up the raw Last.fm data into a consistent format, filter out duplicates and junk, and sort by similarity score.
        const cleaned = similar.map(song => ({
            name: song?.name || "Unknown",
            artist: song?.artist?.name || song?.artist || "Unknown",
            similarity: Math.max(0, Math.min(parseFloat(song?.match || 0), 1)),
            playcount: parseFloat(song?.playcount || 0),
        }));

        const seen = new Set();
        return cleaned
            .filter(song => song.similarity > 0)
            .filter(song => {
                const key = `${song.name.toLowerCase()}-${song.artist.toLowerCase()}`;
                if (seen.has(key)) return false;
                seen.add(key);
                return true;
            })
            .sort((a, b) => b.similarity - a.similarity)
            .map(song => ({
                name: song.name,
                artist: song.artist,
                similarity: Number(song.similarity.toFixed(3)),
                playcount: song.playcount,
            }));

    } catch (error) {
        console.log("Last.fm getSimilarTracks error:", error.message);
        return [];
    }
}

// -------------------- ARTIST'S OWN TOP TRACKS --------------------
// Last.fm's track.getsimilar endpoint mostly returns OTHER artists' songs — it rarely returns the seed artist's own catalog. 
// This function retrieves the top tracks for a given artist from Last.fm.
async function getArtistTopTracks(artist, limit = 10) {
    try {
        const url = `https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=${encodeURIComponent(artist)}&api_key=${API_KEY}&format=json&limit=${limit}`;
        const response = await axios.get(url);

        const tracks = response.data?.toptracks?.track || [];
        if (!tracks.length) return [];

        return tracks.map((t, idx) => ({
            name: t?.name || "Unknown",
            artist: t?.artist?.name || artist,
            // Assign a similarity score that decreases with rank, ensuring a minimum similarity of 0.3 for the least similar track.
            similarity: Math.max(0.3, 1 - idx / limit),
            playcount: parseFloat(t?.playcount || 0),
        }));
    } catch (error) {
        console.log("Last.fm getArtistTopTracks error:", error.message);
        return [];
    }
}

// Junk tags are crowd-sourced and often just repeat the artist's or track's own name instead of describing genre/mood. 
// This set contains known junk tags to filter out.
const JUNK_TAGS = new Set([
    "unknown", "unknown tag", "unclassifiable", "no tag",
    "seen live", "see live",
    "favorite", "favorites", "favourite", "favourites", "my favorites", "my favourites",
    "favorite songs", "favourite songs", "favorite tracks", "favourite tracks",
    "awesome", "amazing", "beautiful", "great", "good", "best", "cool",
    "love", "loved", "love it", "love this song", "love this",
    "catchy", "addictive", "guilty pleasure",
    "check out", "check it out", "listen to this",
    "spotify", "itunes", "youtube", "soundcloud", "apple music",
    "albums i own", "cds i own", "vinyl", "playlist",
    "under 2000 listeners", "0",
]);

function isJunkTag(tagName) {
    const normalized = normalizeForCompare(tagName);
    if (!normalized) return true;
    if (JUNK_TAGS.has(normalized)) return true;
    if (/^\d+$/.test(normalized)) return true;
    if (normalized.length < 2) return true;
    return false;
}

function normalizeForCompare(str) {
    return (str || "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, " ")
        .trim();
}

// -------------------- TRACK INFO (TOP TAGS + BPM) --------------------
function isSelfReferentialTag(tagName, normArtist, normTrack, artistWordSet) {
    const normTag = normalizeForCompare(tagName);
    if (!normTag) return true;
    if (normTag === normArtist) return true;
    if (normTag === normTrack) return true;
    if (!normTag.includes(" ") && artistWordSet.has(normTag)) return true;
    return false;
}

// This function fetches detailed information about a specific track from Last.fm, including its top tags, BPM (if available), and album art. 
// It filters out tags that are self-referential (i.e., just repeat the artist or track name) or are considered junk/noise.
async function getTrackInfo(track, artist) {
    try {
        const url = `https://ws.audioscrobbler.com/2.0/?method=track.getInfo&track=${encodeURIComponent(track)}&artist=${encodeURIComponent(artist)}&api_key=${API_KEY}&format=json`;
        const response = await axios.get(url);
        const trackData = response.data?.track;

        if (!trackData) return { tags: [], bpm: null, albumArt: null };

        const rawTags = trackData.toptags?.tag || [];
        const tags = [];
        let bpm = null;

        const normArtist = normalizeForCompare(artist);
        const normTrack = normalizeForCompare(track);
        const artistWordSet = new Set(
            normArtist.split(" ").filter(w => w.length > 1) // skip "a", "&", etc.
        );

        for (const tag of rawTags) {
            const bpmMatch = tag.name?.match(/^(\d{2,3})\s*bpm$/i);
            if (bpmMatch) {
                const parsed = parseInt(bpmMatch[1], 10);
                if (parsed >= 40 && parsed <= 300) {
                    bpm = parsed;
                    continue; // don't add raw bpm string as a genre tag
                }
            }
            // Users often tag tracks with the bare release year (e.g. "2024").
            // We already get a proper `year` from MusicBrainz, so a plain
            // year tag here is just noise — drop it rather than showing it
            // as if it were a genre.
            const yearMatch = tag.name?.match(/^(19|20)\d{2}$/);
            if (yearMatch) {
                continue;
            }
            if (isSelfReferentialTag(tag.name, normArtist, normTrack, artistWordSet)) {
                continue; // skip tags that just restate the artist/track name
            }
            if (isJunkTag(tag.name)) {
                continue; // skip social/meta noise like "seen live", "favorites", "unknown"
            }
            tags.push(tag.name.toLowerCase());
        }

        // Last.fm returns album art sizes: small (34), medium (64), large (174), extralarge (300)
        const images = trackData.album?.image || [];
        const artEntry = images.find(img => img.size === "large") ||
                         images.find(img => img.size === "medium") ||
                         images[images.length - 1];
        const albumArt = artEntry?.["#text"] || null;

        return { tags, bpm, albumArt };

    } catch (error) {
        console.log("Last.fm getTrackInfo error:", error.message);
        return { tags: [], bpm: null, albumArt: null };
    }
}

// -------------------- TRACK SEARCH  --------------------
async function searchTracks(query, limit = 8) {
    try {
        // Last.fm's track.search endpoint returns a lot of results, but we only want the top few for our purposes.
        // Fetch a larger batch and then filter/sort client-side to ensure we get enough valid results.
        const FETCH_BATCH_SIZE = Math.max(limit * 4, 30);

        const res = await axios.get("https://ws.audioscrobbler.com/2.0/", {
            params: {
                method: "track.search",
                track: query,
                api_key: API_KEY,
                format: "json",
                limit: FETCH_BATCH_SIZE,
            }
        });

        const matches = res.data?.results?.trackmatches?.track || [];
        if (!Array.isArray(matches) || matches.length === 0) return [];

        return matches
            .filter(t => t.name && t.artist && t.artist !== "(null)")
            .map(t => ({
                track: t.name,
                artist: t.artist,
                listeners: parseInt(t.listeners || "0", 10),
                mbid: t.mbid || null,
            }))
            .sort((a, b) => b.listeners - a.listeners)
            .slice(0, limit);

    } catch (err) {
        console.log("Last.fm track.search error:", err.message);
        return [];
    }
}

module.exports = { getSimilarTracks, getTrackInfo, searchTracks, getArtistTopTracks };
