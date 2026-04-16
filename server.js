const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

/* 🧠 SIMPLE VIRAL SCORING ENGINE */
function scoreIdea(idea) {
    let score = 50;
    const text = idea.toLowerCase();

    if (text.includes("how to")) score += 15;
    if (text.includes("money") || text.includes("rich")) score += 10;
    if (text.includes("secret")) score += 10;
    if (text.includes("nobody")) score += 10;
    if (text.includes("build")) score += 8;
    if (text.length < 20) score -= 10;

    if (score > 100) score = 100;
    if (score < 0) score = 0;

    return score;
}

/* 🚀 API */
app.post("/score", (req, res) => {
    const { idea } = req.body;

    if (!idea) {
        return res.status(400).json({ error: "No idea provided" });
    }

    const score = scoreIdea(idea);

    let verdict = "LOW";
    if (score > 80) verdict = "VIRAL 🔥";
    else if (score > 60) verdict = "GOOD ⚡";
    else if (score > 40) verdict = "MID ⚠️";

    res.json({
        idea,
        score,
        verdict
    });
});

app.listen(3000, () => {
    console.log("Xarvis AI running on port 3000");
});
