const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 🔹 Konfigurasi penyimpanan file dinamis
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads";

    // ===== Tentukan lokasi folder =====
    if (req.baseUrl.includes("documents")) {
      uploadPath = path.join("uploads", "documents");
    } 
    else if (req.baseUrl.includes("signature_baseline")) {
      // Pastikan user sudah terautentikasi
      const userId = req.user?.user_id;
      if (!userId) return cb(new Error("User ID tidak ditemukan dari token."));

      // Buat folder berdasarkan user_id
      uploadPath = path.join("uploads", "signatures", String(userId));
    }

    // ===== Pastikan folder ada =====
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const fileName = Date.now() + "_" + file.originalname.replace(/\s+/g, "_");
    cb(null, fileName);
  },
});

// 🔹 File filter fleksibel
const createFileFilter = (allowedTypes) => {
  return (req, file, cb) => {
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Tipe file tidak diizinkan: ${file.mimetype}`), false);
  };
};

// 🔹 Dua instance uploader (PDF & Gambar)
const uploadPDF = multer({
  storage,
  fileFilter: createFileFilter(["application/pdf"]),
});

const uploadImage = multer({
  storage,
  fileFilter: createFileFilter(["image/png", "image/jpeg", "image/jpg"]),
});

module.exports = { uploadPDF, uploadImage };
