const mysql = require("mysql2");

// Create MySQL connection
const db = mysql.createConnection({
  host: "localhost",        // XAMPP MySQL runs on localhost
  user: "root",             // default XAMPP MySQL user
  password: "",             // default is empty password
  database: "lost_and_found" // the DB you created in phpMyAdmin
});

// Try connecting
db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL database");
});

// Export the connection so other files can use it
module.exports = db;
