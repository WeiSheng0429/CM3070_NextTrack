// Genre taxonomy and matching logic for the genre picker feature.
const GENRES = [
    { id: "kpop", label: "K-Pop", synonyms: ["k-pop", "kpop", "korean pop", "korean"] },
    { id: "hiphop", label: "Hip-Hop", synonyms: ["hip-hop", "hip hop", "hiphop", "rap", "trap"] },
    { id: "pop", label: "Pop", synonyms: ["pop", "pop rock", "electropop", "synth-pop", "synthpop", "dance pop"] },
    { id: "rnb", label: "R&B", synonyms: ["r&b", "rnb", "r and b", "rhythm and blues", "contemporary r&b"] },
    { id: "soul", label: "Soul / Funk", synonyms: ["soul", "funk", "neo soul", "neo-soul", "motown"] },
    { id: "rock", label: "Rock", synonyms: ["rock", "alternative rock", "indie rock", "pop rock", "classic rock"] },
    { id: "alternative", label: "Alternative", synonyms: ["alternative", "alt rock", "alt-rock"] },
    { id: "indie", label: "Indie", synonyms: ["indie", "indie pop", "indie rock", "indie folk"] },
    { id: "edm", label: "EDM / Dance", synonyms: ["edm", "dance", "electronic", "house", "electro", "big room"] },
    { id: "ballad", label: "Ballad", synonyms: ["ballad", "ballads", "power ballad"] },
    { id: "jazz", label: "Jazz", synonyms: ["jazz", "smooth jazz", "vocal jazz"] },
    { id: "classical", label: "Classical", synonyms: ["classical", "orchestral", "instrumental"] },
    { id: "latin", label: "Latin", synonyms: ["latin", "reggaeton", "latin pop"] },
    { id: "metal", label: "Metal", synonyms: ["metal", "heavy metal", "nu metal", "metalcore"] },
];

// Build a map of lowercased synonyms to genre ids for fast lookup.
const SYNONYM_TO_GENRE = new Map();
for (const genre of GENRES) {
    for (const synonym of genre.synonyms) {
        SYNONYM_TO_GENRE.set(synonym.toLowerCase(), genre.id);
    }
}

const GENRE_IDS = new Set(GENRES.map(g => g.id));

// Compares a candidate's (already-lowercased) tags against the user's selected genres, returning whether any match and how many.
function tagsMatchGenre(genreId, normalizedTags) {
    for (const tag of normalizedTags) {
        if (SYNONYM_TO_GENRE.get(tag) === genreId) return true;
    }
    return false;
}

// Checks if any of the selected genres match the candidate's tags.
function matchGenres(selectedGenreIds, candidateTags) {
    const validSelected = (selectedGenreIds || []).filter(id => GENRE_IDS.has(id));
    if (validSelected.length === 0) {
        return { matched: true, matchedCount: 0, matchedGenres: [], totalSelected: 0 };
    }

    const normalizedTags = (candidateTags || []).map(t => String(t).toLowerCase());
    const matchedGenres = validSelected.filter(id => tagsMatchGenre(id, normalizedTags));

    return {
        matched: matchedGenres.length > 0,
        matchedCount: matchedGenres.length,
        matchedGenres,
        totalSelected: validSelected.length,
    };
}

module.exports = { GENRES, GENRE_IDS, matchGenres };
