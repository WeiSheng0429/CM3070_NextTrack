// Scoring logic that ranks candidate tracks after filtering.
const { matchGenres } = require("./genreTaxonomy");

// Content-based filtering: compare tags between seed profile and candidate.
function calculateTagOverlap(seedTags, candidateTags) {
    if (!seedTags?.length || !candidateTags?.length) return 0;

    const seedSet = new Set(seedTags.map(t => String(t).toLowerCase()));
    const candidateSet = new Set(candidateTags.map(t => String(t).toLowerCase()));
    let intersection = 0;
    for (const tag of candidateSet) if (seedSet.has(tag)) intersection++;

    const union = new Set([...seedSet, ...candidateSet]).size;
    return union > 0 ? intersection / union : 0;
}

function calculateEraSimilarity(seedYears, candidateYear) {
    const years = Array.isArray(seedYears)
        ? seedYears.filter(Boolean)
        : (seedYears ? [seedYears] : []);

    if (!years.length || !candidateYear) return 0.5;

    let best = 0.1;
    for (const seedYear of years) {
        const diff = Math.abs(seedYear - candidateYear);
        let sim = 0.1;
        if (diff === 0) sim = 1.0;
        else if (diff <= 5) sim = 0.8;
        else if (diff <= 10) sim = 0.6;
        else if (diff <= 20) sim = 0.3;
        best = Math.max(best, sim);
    }
    return best;
}

function calculatePopularityScore(playcount) {
    if (!playcount || playcount <= 0) return 0;
    return Math.min(Math.log10(playcount + 1) / 7, 1.0);
}

function calculateGenreMatchScore(selectedGenres, candidateTags) {
    const { matchedCount, totalSelected } = matchGenres(selectedGenres, candidateTags);
    if (totalSelected === 0) return null; 
    return matchedCount / totalSelected;
}

// Main scoring function that combines multiple factors into a final score.
function calculateScore(song, mb, tags, seedTags, seedYears, selectedGenres = []) {
    // Normalize similarity score to 0..1 range, defaulting to 0 if not present.
    const similarityScore = Math.max(0, Math.min(Number(song.similarity ?? song.score ?? 0), 1));
    const tagOverlap = calculateTagOverlap(seedTags || [], tags || []);
    const candidateYear = mb?.year || null;
    const eraSimilarity = calculateEraSimilarity(seedYears || [], candidateYear);
    const metadataBonus = mb ? 0.05 : 0;
    const popularityScore = calculatePopularityScore(song.playcount || 0);
    const genreMatchScore = calculateGenreMatchScore(selectedGenres, tags);

    // Weighting: genre match is a strong signal, but only if the user has selected genres.
    const weights = genreMatchScore === null
        ? { similarity: 0.50, tagOverlap: 0.25, era: 0.10, popularity: 0.10, metadata: 0.05, genreMatch: 0 }
        : { similarity: 0.40, tagOverlap: 0.15, era: 0.10, popularity: 0.10, metadata: 0.05, genreMatch: 0.20 };

    const finalScore =
        (similarityScore * weights.similarity) +
        (tagOverlap * weights.tagOverlap) +
        (eraSimilarity * weights.era) +
        (popularityScore * weights.popularity) +
        metadataBonus + // already the final weighted value (0 or 0.05), not a raw 0..1 score
        ((genreMatchScore ?? 0) * weights.genreMatch);

    return {
        score: Number(Math.min(finalScore, 1).toFixed(3)),
        breakdown: {
            lastfmSimilarity: Number(similarityScore.toFixed(3)),
            tagOverlap: Number(tagOverlap.toFixed(3)),
            eraSimilarity: Number(eraSimilarity.toFixed(3)),
            popularity: Number(popularityScore.toFixed(3)),
            metadataBonus: Number(metadataBonus.toFixed(3)),
            genreMatch: genreMatchScore === null ? null : Number(genreMatchScore.toFixed(3)),
        },
    };
}

module.exports = { calculateScore, calculateTagOverlap, calculateEraSimilarity };
