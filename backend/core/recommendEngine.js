// Recommendation engine: given a session of tracks and user preferences, return a ranked list of recommended tracks with metadata and scoring stats.
const { getSimilarTracks, getTrackInfo, getArtistTopTracks } = require("../services/lastfmService");
const { getMusicBrainzData } = require("../services/musicbrainzService");
const { getYoutubeVideo } = require("../services/youtubeService");

const { buildCandidates } = require("../algorithms/similarityAlgorithm");
const { calculateScore } = require("../algorithms/scoringAlgorithm");
const { passesPreferenceFilters } = require("../algorithms/preferenceFilters");
const { GENRE_IDS } = require("../algorithms/genreTaxonomy");

// -------------------- UTILITY --------------------
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// -------------------- MUSICBRAINZ PACING --------------------
// MusicBrainz public service asks clients to stay around one request per second.
function createMbPacer(minIntervalMs = 1000) {
    let lastCallAt = 0;
    return async function pace() {
        const wait = lastCallAt + minIntervalMs - Date.now();
        if (wait > 0) await delay(wait);
        lastCallAt = Date.now();
    };
}

// -------------------- DEDUPLICATE --------------------
// Remove duplicate candidates by track name + artist, keeping the first occurrence.
function deduplicate(candidates) {
    const seen = new Set();
    return candidates.filter(song => {
        const key = `${song.name}-${song.artist}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

// -------------------- STATS BUILDER --------------------
// Build a stats object summarizing the recommendation results, including best match, average match, top-tier match, score spread, and search time.
function buildStats(finalResults, tracksAnalyzed, searchStartedAt, listenedTracks) {
    const searchTimeMs = Number((Date.now() - searchStartedAt).toFixed(3));

    if (!finalResults.length) {
        return { tracksAnalyzed, bestMatch: 0, averageMatch: 0, topTierMatch: 0, scoreSpread: 0, searchTimeMs, listenedTracks };
    }

    // Convert scores to percentages for easier interpretation.
    const percents = finalResults.map(r => Math.round(Math.max(0, Math.min(r.score, 1)) * 100));

    const bestMatch = Math.max(...percents);
    const averageMatch = Math.round(percents.reduce((a, b) => a + b, 0) / percents.length);

    const sortedPercents = [...percents].sort((a, b) => a - b);
    const idx95 = Math.min(sortedPercents.length - 1, Math.ceil(0.95 * sortedPercents.length) - 1);
    const topTierMatch = sortedPercents[idx95];

    const mean = percents.reduce((a, b) => a + b, 0) / percents.length;
    const variance = percents.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / percents.length;
    const scoreSpread = Number(Math.sqrt(variance).toFixed(3));

    return { tracksAnalyzed, bestMatch, averageMatch, topTierMatch, scoreSpread, searchTimeMs, listenedTracks };
}

// -------------------- MAIN ENGINE --------------------
async function recommendEngine(body = {}) {
    const searchStartedAt = Date.now();
    const { session, preferences = {}, mode = "session" } = body;

    const sameDecade = !!preferences.sameDecade;
    const sameArtist = !!preferences.sameArtist;

    const selectedGenres = Array.isArray(preferences.genres)
        ? preferences.genres.filter(id => GENRE_IDS.has(id))
        : [];

    if (!Array.isArray(session) || session.length === 0) {
        return {
            success: false,
            message: "Session required"
        };
    }

    // If the session is a playlist, use all tracks; otherwise, limit to the first 3 for a normal session.
    const isPlaylist = mode === "playlist";
    const seedSession = isPlaylist ? session : session.slice(0, 3);
    const seedArtists = seedSession.map(item => item?.artist).filter(Boolean);

    const seed = seedSession[0];
    let searched = null;
    const playlistTagSet = new Set();
    const playlistYears = [];
    const paceMb = createMbPacer(1000);

    // Fetch metadata for each seed track, including MusicBrainz data and Last.fm tags. The first seed's metadata is stored for the response.
    for (let i = 0; i < seedSession.length; i++) {
        const item = seedSession[i];
        if (!item?.track || !item?.artist) continue;

        try {
            await paceMb();
            const [mb, info] = await Promise.all([
                getMusicBrainzData(item.track, item.artist),
                getTrackInfo(item.track, item.artist),
            ]);

            (info?.tags || []).forEach(tag => playlistTagSet.add(String(tag).toLowerCase()));
            if (mb?.year) playlistYears.push(mb.year);

            if (i === 0) {
                const seedYt = await getYoutubeVideo(item.track, item.artist);
                searched = {
                    track: item.track,
                    artist: item.artist,
                    album: mb?.album || null,
                    year: mb?.year || null,
                    tags: info?.tags || [],
                    bpm: info?.bpm ?? null,
                    albumArt: info?.albumArt || null,
                    youtube: seedYt || null,
                };
            }
        } catch (error) {
            console.log("Seed metadata error:", item.track, error.message);
        }
    }

    const playlistTags = Array.from(playlistTagSet);

    // Build a list of candidate tracks from the session seeds, applying similarity reweighting, artist diversity, and interleaving by source group.
    const allCandidates = await buildCandidates(seedSession, getSimilarTracks, delay, {
        topPerSeed: isPlaylist ? 8 : 10,
        maxPerArtist: 3,
    });

    // If the user has requested "same artist" recommendations, fetch top tracks for each unique seed artist and add them to the candidate pool.
    let artistCandidates = [];
    if (sameArtist && seedArtists.length) {
        const uniqueSeedArtists = [...new Set(seedArtists.map(a => a.toLowerCase()))]
            .map(lower => seedArtists.find(a => a.toLowerCase() === lower));

        const results = await Promise.all(
            uniqueSeedArtists.map(artistName => getArtistTopTracks(artistName, 15))
        );
        artistCandidates = results.flat();
    }

    // Deduplicate candidates by track name + artist, keeping the first occurrence. Exclude any candidates that are already in the seed session.
    const seedKeys = new Set(
        seedSession.map(item => `${String(item.track).trim().toLowerCase()}-${String(item.artist).trim().toLowerCase()}`)
    );

    // Combine artist candidates and all candidates, deduplicate, and filter out any that are already in the seed session. 
    // Limit the number of candidates to analyze based on whether it's a playlist or same-artist mode.
    const unique = deduplicate([...artistCandidates, ...allCandidates]).filter(song => {
        const key = `${String(song.name).trim().toLowerCase()}-${String(song.artist).trim().toLowerCase()}`;
        return !seedKeys.has(key);
    });

    // Limit the number of candidates to analyze based on whether it's a playlist or same-artist mode.
    const CANDIDATES_TO_ANALYZE = isPlaylist ? 18 : (sameArtist ? 15 : 10);
    const limited = unique.slice(0, CANDIDATES_TO_ANALYZE);

    let results = [];

    for (let i = 0; i < limited.length; i++) {
        const song = limited[i];
        await paceMb();
        const [mb, info] = await Promise.all([
            getMusicBrainzData(song.name, song.artist),
            getTrackInfo(song.name, song.artist),
        ]);

        const keep = passesPreferenceFilters(song, mb, info, {
            seedYears: playlistYears,
            seedArtists,
            preferences: { genres: selectedGenres, sameDecade, sameArtist },
        });

        if (keep) {
            const { score, breakdown } = calculateScore(
                song,
                mb,
                info.tags,
                playlistTags,
                playlistYears,
                selectedGenres
            );

            results.push({
                track: song.name,
                artist: song.artist,
                album: mb?.album || null,
                year: mb?.year || null,
                score,
                scoreBreakdown: breakdown,
                tags: info.tags,
                bpm: info.bpm,
                albumArt: info.albumArt,
                mbid: mb?.mbid || null,
                youtube: null,
                sourceCount: song.sourceCount || 1,
            });
        }
    }

    results.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return (b.sourceCount || 1) - (a.sourceCount || 1);
    });

    const finalResults = results.slice(0, 8);
    const stats = buildStats(finalResults, results.length, searchStartedAt, seedSession.length);

    return {
        success: true,
        searched,
        recommendations: finalResults,
        stats,
        mode: isPlaylist ? "playlist" : "session",
    };
}

module.exports = { recommendEngine };
