const express = require("express");
const cors = require("cors");
const db = require("./db"); 

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

// POST /lost-items
// This endpoint creates a new lost item
app.post("/lost-items", (req, res) => {
  // Extract data from request body
  const {
    user_id,
    item_type,
    lost_location,
    lost_time_from,
    lost_time_to,
    color,
    brand_model,
    public_description,
    secret_info_1,
    secret_info_2,
  } = req.body;

  if (!user_id || !item_type || !lost_location) {
    console.warn("⚠️ Missing required fields");
    return res.status(400).json({ message: "Missing required fields" });
  }

  // SQL query with placeholders
  const sql = `
    INSERT INTO lost_items (
      user_id,
      item_type,
      lost_location,
      lost_time_from,
      lost_time_to,
      color,
      brand_model,
      public_description,
      secret_info_1,
      secret_info_2
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  // Values array
  const values = [
    user_id,
    item_type,
    lost_location,
    lost_time_from,
    lost_time_to,
    color,
    brand_model,
    public_description,
    secret_info_1,
    secret_info_2,
  ];

console.log("Running SQL with values:", values);


  // Execute query
  db.query(sql, values, (err, result) => {
    if (err) {
      console.error("Error inserting lost item:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // Success response
    res.status(201).json({
      message: "Lost item reported successfully",
      lost_item_id: result.insertId,
    });
  });
});


app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
