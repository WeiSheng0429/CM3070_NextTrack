// Express app entry point for the backend service.
require("dotenv").config();

const express = require("express");
const cors = require("cors");

// -------------------- IMPORT ROUTES --------------------
const searchRoute    = require("./routes/search");
const recommendRoute = require("./routes/recommend");
const youtubeRoute   = require("./routes/youtube");
const genresRoute    = require("./routes/genres");

const app = express();

app.use(cors());
app.use(express.json());

// -------------------- TEST ROUTE --------------------
app.get("/", (req, res) => {
    res.send("NextTrack is working!");
});

// -------------------- ROUTES --------------------
app.use("/api", recommendRoute);
app.use("/api", searchRoute);
app.use("/api", youtubeRoute);
app.use("/api", genresRoute);

// -------------------- ERROR HANDLING --------------------
app.use((err, req, res, next) => {  
    console.error(err.stack);
    res.status(500).json({ success: false, message: "Internal Server Error" });
});

// Running the server on port 5000
app.listen(5000, () => {
    console.log("Server running on http://localhost:5000");
});
