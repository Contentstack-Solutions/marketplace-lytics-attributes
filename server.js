const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const distDir = path.join(__dirname, "dist");

// CORS headers for RTE plugin (runs cross-origin from app.contentstack.com)
app.use("/json-rte.js", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
});

app.use("/api/lytics", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// Proxy for Lytics API (avoids browser CORS restrictions)
app.get("/api/lytics/schema", async (req, res) => {
  const token = req.headers.authorization;
  if (!token) {
    return res.status(400).json({ error: "Authorization header required" });
  }
  try {
    const response = await fetch("https://api.lytics.io/api/schema/user", {
      headers: {
        Authorization: token,
        Accept: "application/json",
      },
    });
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    res.status(502).json({ error: "Failed to reach Lytics API" });
  }
});

// Serve static files from dist
app.use(express.static(distDir));

// SPA fallback — serve index.html for all other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(distDir, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
