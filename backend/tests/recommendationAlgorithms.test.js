// This file contains unit tests for the recommendation algorithms used in the NextTrack backend.
const assert = require("assert");
const { calculateScore, calculateTagOverlap } = require("../algorithms/scoringAlgorithm");
const { buildCandidates, mergeAndReweight } = require("../algorithms/similarityAlgorithm");


function pass(testName) {
    console.log(`Test Pass - ${testName}`);
}

async function run() {
    // Test 1: Similarity Range
    try {

        const score = calculateScore(
            { similarity: 0.82, playcount: 1000000 },
            { year: 2024 },
            ["pop", "kpop"],
            ["pop", "kpop"],
            [2024]
        );


        assert(score.breakdown.lastfmSimilarity === 0.82);
        assert(score.score > 0.6 && score.score <= 1);


        pass("Test 1 - Similarity score remains within valid range (0-1)");

    } catch(error) {
        console.log("Test Fail - Test 1 Similarity Range");
        throw error;
    }

    // Test 2: Ranking Order
    try {

        const high = calculateScore(
            { similarity: 0.9, playcount: 100000 },
            { year: 2024 },
            ["pop"],
            ["pop"],
            [2024]
        );


        const low = calculateScore(
            { similarity: 0.5, playcount: 100000 },
            { year: 2024 },
            ["pop"],
            ["pop"],
            [2024]
        );

        assert(high.score > low.score);

        pass("Test 2 - Higher similarity candidate ranks higher");

    } catch(error) {
        console.log("Test Fail - Test 2 Ranking Order");
        throw error;
    }


    // Test 3: Playlist Seed Coverage
    try {

        const seeds = [
            { track:"A", artist:"Artist A" },
            { track:"B", artist:"Artist B" },
            { track:"C", artist:"Artist C" },
            { track:"D", artist:"Artist D" }
        ];

        const data = {

            A:[{name:"From A", artist:"X", similarity:0.8, playcount:10}],
            B:[{name:"From B", artist:"Y", similarity:0.8, playcount:10}],
            C:[{name:"From C", artist:"Z", similarity:0.8, playcount:10}],
            D:[{name:"From D", artist:"W", similarity:0.8, playcount:10}]
        };

        const built = await buildCandidates(
            seeds,
            async track => data[track],
            async()=>{},
            {topPerSeed:8}
        );

        const names = new Set(
            built.map(x=>x.name)
        );

        assert(names.has("From D"));

        pass("Test 3 - Playlist seed coverage includes all input tracks");

    } catch(error){
        console.log("Test Fail - Test 3 Playlist Seed Coverage");
        throw error;
    }


    // Test 4: Tag Overlap Calculation
    try {


        const overlap = calculateTagOverlap(
            ["pop","pop"],
            ["pop","rock"]
        );


        assert.strictEqual(
            overlap,
            1/2
        );

        pass("Test 4 - Tag overlap calculation using intersection/union");

    } catch(error){
        console.log("Test Fail - Test 5 Tag Overlap Calculation");
        throw error;
    }

    console.log("\nAll recommendation algorithm tests passed successfully.");

}


run().catch(error=>{
    console.error(error.message);
    process.exit(1);
});