require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");

const { sequelize } = require("./models");
const routes = require("./routes");

const app = express();

// ===== Middleware dasar =====
app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

// ===== Middleware untuk akses file statis (uploads) =====
// Supaya file yang di-upload bisa diakses via URL seperti:
// http://localhost:4000/uploads/signatures/user_1/nama_file.png
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===== Routing utama =====
app.use("/", routes);

// ===== Koneksi dan sinkronisasi database =====
sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connected");
    return sequelize.sync({ alter: true }); // update struktur tabel sesuai model
  })
  .then(() => {
    console.log("✅ Database synced with models");
  })
  .catch((err) => {
    console.error("❌ Database error:", err.message);
  });

// ===== Jalankan server =====
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
