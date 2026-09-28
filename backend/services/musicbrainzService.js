// MusicBrainz service for fetching track metadata by title/artist or MBID.
const axios = require("axios");

const MB_HEADERS = {
    headers: { "User-Agent": "NextTrack/1.0 (weisheng322@gmail.com)" }
};

// MusicBrainz public service asks clients to stay around one request per second.
// This function returns a pacer function that enforces a minimum interval between requests.
const MB_MAX_RETRIES = 3;
const MB_RETRY_BASE_MS = 600;

function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status) {
    return status === 503 || status === 429;
}

async function mbGet(url) {
    let lastError;
    for (let attempt = 0; attempt <= MB_MAX_RETRIES; attempt++) {
        try {
            return await axios.get(url, MB_HEADERS);
        } catch (error) {
            lastError = error;
            const status = error.response?.status;
            if (!isRetryableStatus(status) || attempt === MB_MAX_RETRIES) {
                throw error;
            }
            const waitMs = MB_RETRY_BASE_MS * Math.pow(2, attempt); // 600ms, 1200ms, 2400ms
            console.log(`MusicBrainz ${status} — retrying in ${waitMs}ms (attempt ${attempt + 1}/${MB_MAX_RETRIES})`);
            await delay(waitMs);
        }
    }
    throw lastError;
}

// -------------------- HELPERS --------------------
function pickBestRelease(releases) {
    if (!releases || releases.length === 0) return null;
    const dated = releases.filter(r => r.date);
    if (dated.length === 0) return releases[0];
    dated.sort((a, b) => a.date.localeCompare(b.date));
    return dated[0];
}

// Some MusicBrainz recordings have multiple releases, some of which have no date.
function hasDatedRelease(recording) {
    return (recording.releases || []).some(r => r.date);
}

// This function picks the recording with the closest matching artist credit to the target artist.
function pickClosestArtistMatch(recordings, artist) {
    const target = artist.toLowerCase();
    const artistMatches = recordings.filter(r => {
        const credited = (r["artist-credit"]?.[0]?.name || "").toLowerCase();
        return credited === target || credited.includes(target) || target.includes(credited);
    });

    const candidates = artistMatches.length ? artistMatches : recordings;

    return candidates.find(hasDatedRelease) || candidates[0];
}

function buildResult(best, track, artist) {
    const bestRelease = pickBestRelease(best.releases);
    const year = bestRelease?.date ? parseInt(bestRelease.date.slice(0, 4), 10) || null : null;

    return {
        title: best.title || track,
        artist: best["artist-credit"]?.[0]?.name || artist,
        mbid: best.id || null,
        album: bestRelease?.title || null,
        albumMbid: bestRelease?.id || null,
        year,
        duration: best.length ? Math.round(best.length / 1000) : null
    };
}

// -------------------- GET BY TRACK + ARTIST --------------------
async function getMusicBrainzData(track, artist) {
    try {
        const strictUrl = `https://musicbrainz.org/ws/2/recording/?query=recording:"${encodeURIComponent(track)}" AND artist:"${encodeURIComponent(artist)}"&fmt=json&inc=releases`;
        let response = await mbGet(strictUrl);
        let recordings = response.data?.recordings || [];

        // If no recordings are found with the strict query, try a looser search that only matches the recording title.
        if (recordings.length === 0) {
            await delay(1100); // stay under MB's ~1 req/sec limit
            const looseUrl = `https://musicbrainz.org/ws/2/recording/?query=recording:"${encodeURIComponent(track)}"&fmt=json&inc=releases`;
            response = await mbGet(looseUrl);
            recordings = response.data?.recordings || [];
        }

        if (recordings.length === 0) {
            return { title: track, artist, mbid: null, album: null, year: null, duration: null, albumMbid: null };
        }

        const best = pickClosestArtistMatch(recordings, artist);
        return buildResult(best, track, artist);
    } catch (error) {
        console.log("MusicBrainz error:", error.message);
        return { title: track, artist, mbid: null, album: null, albumMbid: null, year: null, duration: null };
    }
}

// -------------------- GET BY MBID --------------------
async function getMusicBrainzById(mbid) {
    try {
        const url = `https://musicbrainz.org/ws/2/recording/${mbid}?fmt=json&inc=artists+releases+tags`;
        const response = await mbGet(url);
        const data = response.data;

        if (!data || !data.id) return null;

        const bestRelease = pickBestRelease(data.releases || []);
        const year = bestRelease?.date ? parseInt(bestRelease.date.slice(0, 4), 10) || null : null;

        return {
            mbid: data.id,
            title: data.title || null,
            artist: data["artist-credit"]?.[0]?.name || null,
            artistMbid: data["artist-credit"]?.[0]?.artist?.id || null,
            album: bestRelease?.title || null,
            albumMbid: bestRelease?.id || null,
            year,
            duration: data.length ? Math.round(data.length / 1000) : null,
            tags: (data.tags || []).map(t => t.name.toLowerCase())
        };
    } catch (error) {
        console.log("MusicBrainz getById error:", error.message);
        return null;
    }
}

module.exports = { getMusicBrainzData, getMusicBrainzById };
