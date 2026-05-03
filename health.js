const express = require("express");
const router  = express.Router();

router.get("/", (_req, res) => {
  res.json({
    status:        "running",
    nodeVersion:   process.version,
    groqKeyLoaded: !!process.env.GROQ_API_KEY,
    timestamp:     new Date().toISOString(),
  });
});

module.exports = router;
