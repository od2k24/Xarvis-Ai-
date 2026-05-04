import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Server is running 🚀");
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!process.env.API_KEY) {
      return res.status(500).json({ error: "Missing API key" });
    }

    const response = await fetch("YOUR_API_URL_HERE", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.API_KEY}`
      },
      body: JSON.stringify({
        message: userMessage
      })
    });

    const data = await response.json();

    res.json({ reply: data });

  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Server failed" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
