const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const distDir = path.join(__dirname, "dist");

// CORS header for the RTE plugin bundle
app.get("/json-rte.js", (req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  next();
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
