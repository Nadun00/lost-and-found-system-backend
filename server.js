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
    console.warn(" Missing required fields");
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

// GET /lost-items
// This endpoint returns all lost items
app.get("/lost-items", (req, res) => {
  const sql = `
    SELECT 
      id,
      user_id,
      item_type,
      lost_location,
      lost_time_from,
      lost_time_to,
      color,
      brand_model,
      public_description,
      status,
      created_at
    FROM lost_items
    ORDER BY created_at DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(" Error fetching lost items:", err);
      return res.status(500).json({ message: "Database error" });
    }

    // results is an array of rows
    res.json(results);
  });
});

// GET /lost-items/user/:id
// This endpoint returns all lost items for a specific user (student)
app.get("/lost-items/user/:id", (req, res) => {
  const userId = req.params.id; // route param from URL

  const sql = `
    SELECT 
      id,
      user_id,
      item_type,
      lost_location,
      lost_time_from,
      lost_time_to,
      color,
      brand_model,
      public_description,
      status,
      created_at
    FROM lost_items
    WHERE user_id = ?
    ORDER BY created_at DESC
  `;

  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error(" Error fetching user lost items:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});

// POST /found-items
// Admin logs a found item
app.post("/found-items", (req, res) => {
  console.log(" POST /found-items called");
  console.log(" req.body =", req.body);

  const {
    admin_id,
    item_type,
    found_location,
    found_time,
    color,
    brand_model,
    public_description,
    photo_url,
    storage_location,
  } = req.body;

  // Basic validation: required fields
  if (!admin_id || !item_type || !found_location || !found_time) {
    return res.status(400).json({
      message: "Missing required fields",
    });
  }

  const sql = `
    INSERT INTO found_items (
      admin_id,
      item_type,
      found_location,
      found_time,
      color,
      brand_model,
      public_description,
      photo_url,
      storage_location
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const values = [
    admin_id,
    item_type,
    found_location,
    found_time,
    color || null,
    brand_model || null,
    public_description || null,
    photo_url || null,
    storage_location || null,
  ];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error(" Error inserting found item:", err);
      return res.status(500).json({ message: "Database error", error: err });
    }

    console.log(" Found item logged, ID:", result.insertId);

    res.status(201).json({
      message: "Found item logged successfully",
      found_item_id: result.insertId,
    });
  });
});

// GET /found-items
// Returns all currently available found items
app.get("/found-items", (req, res) => {
  const sql = `
    SELECT
      id,
      admin_id,
      item_type,
      found_location,
      found_time,
      color,
      brand_model,
      public_description,
      photo_url,
      storage_location,
      status,
      created_at
    FROM found_items
    WHERE status = 'available'
    ORDER BY found_time DESC
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error(" Error fetching found items:", err);
      return res.status(500).json({ message: "Database error" });
    }

    res.json(results);
  });
});

// POST /claims
// Student claims a found item and provides secret verification info
app.post("/claims", (req, res) => {
  console.log("🔥 POST /claims called");
  console.log("📦 req.body =", req.body);

  const {
    lost_item_id,
    found_item_id,
    claimer_id,
    verification_input_1,
    verification_input_2,
  } = req.body;

  // Basic validation
  if (!lost_item_id || !found_item_id || !claimer_id) {
    return res.status(400).json({
      message: "lost_item_id, found_item_id, and claimer_id are required",
    });
  }

  //  Fetch the lost item to get its secret info
  const lostSql = `
    SELECT secret_info_1, secret_info_2
    FROM lost_items
    WHERE id = ?
  `;

  db.query(lostSql, [lost_item_id], (err, lostResults) => {
    if (err) {
      console.error("Error fetching lost item for claim:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (lostResults.length === 0) {
      // No lost item with that ID
      return res.status(404).json({ message: "Lost item not found" });
    }

    const lostItem = lostResults[0];

    //  Compare secrets to decide initial status
    let status = "pending"; // default

    if (
      lostItem.secret_info_1 &&
      lostItem.secret_info_2 &&
      verification_input_1 === lostItem.secret_info_1 &&
      verification_input_2 === lostItem.secret_info_2
    ) {
      status = "verified";
    }

    //  Insert claim into claims table
    const insertSql = `
      INSERT INTO claims (
        lost_item_id,
        found_item_id,
        claimer_id,
        verification_input_1,
        verification_input_2,
        status
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    const values = [
      lost_item_id,
      found_item_id,
      claimer_id,
      verification_input_1 || null,
      verification_input_2 || null,
      status,
    ];

    db.query(insertSql, values, (err, result) => {
      if (err) {
        console.error(" Error inserting claim:", err);
        return res.status(500).json({ message: "Database error" });
      }

      console.log(" Claim created, ID:", result.insertId, "Status:", status);

      res.status(201).json({
        message: "Claim created successfully",
        claim_id: result.insertId,
        status,
      });
    });
  });
});

// GET /lost-items/:id/matches
// Returns found items that likely match this lost item
app.get("/lost-items/:id/matches", (req, res) => {
  const lostItemId = req.params.id;
  console.log(" Matching for lost_item_id =", lostItemId);

  //  Get the lost item first
  const lostSql = `
    SELECT
      id,
      user_id,
      item_type,
      lost_location,
      lost_time_from,
      lost_time_to,
      color,
      brand_model,
      public_description
    FROM lost_items
    WHERE id = ?
  `;

  db.query(lostSql, [lostItemId], (err, lostResults) => {
    if (err) {
      console.error(" Error fetching lost item for matches:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (lostResults.length === 0) {
      return res.status(404).json({ message: "Lost item not found" });
    }

    const lostItem = lostResults[0];
    console.log(" Lost item for matching:", lostItem);

    //  Get all available found items
    const foundSql = `
      SELECT
        id,
        admin_id,
        item_type,
        found_location,
        found_time,
        color,
        brand_model,
        public_description,
        storage_location,
        status
      FROM found_items
      WHERE status = 'available'
    `;

    db.query(foundSql, (err, foundResults) => {
      if (err) {
        console.error(" Error fetching found items for matches:", err);
        return res.status(500).json({ message: "Database error" });
      }

      //  Compute match score for each found item
      const lostType = (lostItem.item_type || "").toLowerCase();
      const lostColor = (lostItem.color || "").toLowerCase();
      const lostLocation = (lostItem.lost_location || "").toLowerCase();

      const lostFrom = lostItem.lost_time_from
        ? new Date(lostItem.lost_time_from)
        : null;
      const lostTo = lostItem.lost_time_to
        ? new Date(lostItem.lost_time_to)
        : null;

      const matches = foundResults
        .map((found) => {
          let score = 0;

          const foundType = (found.item_type || "").toLowerCase();
          const foundColor = (found.color || "").toLowerCase();
          const foundLocation = (found.found_location || "").toLowerCase();

          //  1) Type match (very important)
          if (lostType && foundType && lostType === foundType) {
            score += 50;
          }

          //  2) Color match
          if (lostColor && foundColor && lostColor === foundColor) {
            score += 20;
          }

          //  3) Location similarity (simple substring check)
          if (
            lostLocation &&
            foundLocation &&
            (lostLocation.includes(foundLocation) ||
              foundLocation.includes(lostLocation))
          ) {
            score += 20;
          }

          //  4) Time overlap (if lost_from/to are set)
          if (lostFrom && lostTo && found.found_time) {
            const foundTime = new Date(found.found_time);
            if (foundTime >= lostFrom && foundTime <= lostTo) {
              score += 10;
            }
          }

          return {
            found_item: found,
            score,
          };
        })
        // Keep only good matches (>= 60)
        .filter((m) => m.score >= 60)
        // Sort by score descending
        .sort((a, b) => b.score - a.score);

      console.log(" Matches found:", matches.length);

      res.json(matches);
    });
  });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
