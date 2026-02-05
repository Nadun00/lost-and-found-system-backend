const express = require("express");
const cors = require("cors");
const db = require("./db"); // import our database connection

const app = express();

// ----- MIDDLEWARES -----

// Allow other origins (like React frontend) to call this API
app.use(cors());

// Automatically parse JSON bodies in incoming requests
app.use(express.json());

// ----- ROUTES -----

// Simple test route to make sure server is working
app.get("/", (req, res) => {
  res.send("Lost & Found backend is running ✅");
});

// Test route to check DB connection via HTTP
app.get("/test-db", (req, res) => {
  db.query("SELECT 1 + 1 AS solution", (err, results) => {
    if (err) {
      console.error("DB test failed:", err);
      return res.status(500).json({ message: "DB test failed" });
    }
    
    res.json({ message: "DB works!", db_result: results[0].solution });
  });
});

const PORT = 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
