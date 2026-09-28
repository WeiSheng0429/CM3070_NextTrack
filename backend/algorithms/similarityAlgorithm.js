//Session weight decays exponentially with position in the session. The first track is the strongest signal, the second is weaker, and so on.
function getSessionWeight(position) {
    const decay = 0.6;
    return Math.pow(decay, position);
}

// Normalize a track's name and artist to a consistent key for merging duplicates.
function normalizeKey(name, artist) {
    return `${String(name || "").trim().toLowerCase()}-${String(artist || "").trim().toLowerCase()}`;
}

// Apply a simple artist diversity filter to the candidate list, limiting the number of tracks per artist.
function applyArtistDiversity(candidates, maxPerArtist = 3) {
    const artistCount = {};
    const diversified = [];

    for (const song of candidates) {
        const artist = song.artist?.toLowerCase() || "unknown";
        artistCount[artist] = (artistCount[artist] || 0) + 1;
        if (artistCount[artist] <= maxPerArtist) diversified.push(song);
    }

    return diversified;
}

// Merge candidates from multiple seed tracks, reweighting their similarity scores based on the session weight of each seed.
function mergeAndReweight(candidateGroups) {
    const merged = {};
    const totalWeight = candidateGroups.reduce((sum, group) => sum + group.weight, 0) || 1;

    candidateGroups.forEach(({ candidates, weight }, groupIndex) => {
        for (const song of candidates) {
            const key = normalizeKey(song.name, song.artist);
            if (!merged[key]) {
                merged[key] = {
                    name: song.name,
                    artist: song.artist,
                    weightedSimilarity: 0,
                    playcount: song.playcount || 0,
                    count: 0,
                    sourceGroups: new Set(),
                };
            }

            merged[key].weightedSimilarity += Number(song.similarity ?? song.score ?? song.match ?? 0) * weight;
            merged[key].count += 1;
            merged[key].sourceGroups.add(groupIndex);
            merged[key].playcount = Math.max(merged[key].playcount, song.playcount || 0);
        }
    });

    return Object.values(merged).map(song => {
        const coverage = song.count / candidateGroups.length;
        // Apply a small bonus for candidates that appear in multiple seed groups
        const coverageBonus = 1 + Math.min(0.15, 0.15 * coverage);
        const similarity = Math.min(
            (song.weightedSimilarity / totalWeight) * coverageBonus,
            1
        );

        return {
            name: song.name,
            artist: song.artist,
            similarity: Number(similarity.toFixed(4)),
            playcount: song.playcount,
            sourceGroups: Array.from(song.sourceGroups),
            sourceCount: song.count,
        };
    });
}

// Interleave candidates from different seed groups to maintain diversity while preserving similarity order within each group.
function interleaveBySource(candidates, numGroups) {
    const buckets = Array.from({ length: numGroups }, () => []);

    for (const song of candidates) {
        const homeGroup = Math.min(...song.sourceGroups);
        if (buckets[homeGroup]) buckets[homeGroup].push(song);
    }

    const result = [];
    let added = true;
    while (added) {
        added = false;
        for (let g = 0; g < numGroups; g++) {
            if (buckets[g].length > 0) {
                result.push(buckets[g].shift());
                added = true;
            }
        }
    }
    return result;
}

// Build a list of candidate tracks from the session seeds, applying similarity reweighting, artist diversity, and interleaving by source group.
async function buildCandidates(session, getSimilarTracks, delay, options = {}) {
    const seeds = Array.isArray(session) ? session.filter(Boolean) : [];
    const topPerSeed = options.topPerSeed || 10;
    const validSeeds = seeds.filter(item => item?.track && item?.artist);
    
    const perSeedResults = await Promise.all(
        validSeeds.map(item => getSimilarTracks(item.track, item.artist))
    );

    const candidateGroups = [];
    for (let i = 0; i < validSeeds.length; i++) {
        const similar = perSeedResults[i];
        if (!similar?.length) continue;

        candidateGroups.push({
            candidates: similar.slice(0, topPerSeed),
            weight: getSessionWeight(i),
            sessionTrack: validSeeds[i].track,
        });
    }

    if (!candidateGroups.length) return [];

    const merged = mergeAndReweight(candidateGroups);
    merged.sort((a, b) => b.similarity - a.similarity);

    // Diversity is applied after merging, so multi-seed matches are not lost.
    const diversified = applyArtistDiversity(merged, options.maxPerArtist || 3);

    // Interleave candidates from different seed groups to maintain diversity while preserving similarity order within each group.
    return interleaveBySource(diversified, candidateGroups.length);
}

module.exports = {
    getSessionWeight,
    applyArtistDiversity,
    mergeAndReweight,
    interleaveBySource,
    buildCandidates,
};