// Preference filters: strict user constraints before scoring happens.

const { matchGenres } = require("./genreTaxonomy");

// -------------------- SAME ARTIST --------------------
function sharesArtist(seedArtists, candidateArtist) {
    if (!seedArtists?.length || !candidateArtist) return false;
    const normalizedArtist = candidateArtist.toLowerCase();
    return seedArtists.some(artist => artist?.toLowerCase() === normalizedArtist);
}

// -------------------- SAME DECADE --------------------
function decadeOf(year) {
    if (!year) return null;
    return Math.floor(year / 10) * 10;
}

function sameDecadeAs(seedYear, candidateYear) {
    const seedDecade = decadeOf(seedYear);
    if (seedDecade === null) return true; // no seed year known — don't filter
    return decadeOf(candidateYear) === seedDecade;
}

// -------------------- SAME DECADE (whole playlist) --------------------
function sameDecadeAsAny(seedYears, candidateYear) {
    const years = Array.isArray(seedYears) ? seedYears.filter(Boolean) : (seedYears ? [seedYears] : []);
    if (!years.length) return true; // no seed years known — don't filter
    const candidateDecade = decadeOf(candidateYear);
    return years.some((y) => decadeOf(y) === candidateDecade);
}

// -------------------- COMBINED FILTER --------------------
function passesPreferenceFilters(candidate, mb, info, seed) {
    const { seedYears, seedArtists, preferences } = seed;

    const genres = preferences.genres || [];
    if (genres.length > 0 && !matchGenres(genres, info.tags).matched) return false;
    if (preferences.sameDecade && seedYears?.length > 0 && !sameDecadeAsAny(seedYears, mb?.year)) return false;
    if (preferences.sameArtist && seedArtists.length > 0 && !sharesArtist(seedArtists, mb?.artist || candidate.artist)) return false;

    return true;
}

module.exports = { sharesArtist, decadeOf, sameDecadeAs, sameDecadeAsAny, passesPreferenceFilters };
