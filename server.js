import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import mysql from "mysql2";
import dotenv from "dotenv";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

// Fix __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ===== Middleware =====
app.use(
  cors({
    origin: "http://localhost:8080", // Frontend URL
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (Uploaded images)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== MySQL Database Connection =====
const db = mysql.createConnection({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASS || "24June1987",
  database: process.env.DB_NAME || "Bits",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err.message);
  } else {
    console.log("✅ Connected to MySQL database.");
  }
});

// ===== Multer Setup for Image Upload =====
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// ===== Routes =====

// Root route - check server status
app.get("/", (req, res) => {
  res.send("Donation Server is Running! 🎉");
});

// ===== GET route for /api/donate =====
app.get("/api/donate", (req, res) => {
  res.send("Donation API is live! Use POST to submit donation data.");
});

// ===== Donation POST Route =====
app.post("/api/donate", upload.array("images", 10), (req, res) => {
  const {
    itemName,
    category,
    condition,
    quantity,
    description,
    pickupAddress,
    pickupDate,
    pickupTime,
  } = req.body;

  if (!itemName || !category || !condition || !quantity || !description) {
    console.error("❌ Missing required fields:", req.body);
    return res.status(400).json({ message: "All fields are required." });
  }

  const imagePaths = req.files.map((file) => `/uploads/${file.filename}`);

  const sql = `INSERT INTO donation_details (item_name, category, \`condition\`, quantity, description, image_path, pickup_address, pickup_date, pickup_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

  db.query(
    sql,
    [
      itemName,
      category,
      condition,
      quantity,
      description,
      JSON.stringify(imagePaths),
      pickupAddress,
      pickupDate,
      pickupTime,
    ],
    (err, result) => {
      if (err) {
        console.error("❌ Error inserting donation:", err.message);
        return res.status(500).json({ message: "Database insert error." });
      }
      console.log("✅ Donation inserted successfully:", result);
      return res.status(200).json({ message: "Donation inserted successfully!" });
    }
  );
});

// ===== Start Server =====
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
