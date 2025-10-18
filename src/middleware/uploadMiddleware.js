const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 🔹 Konfigurasi penyimpanan file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadPath = "uploads";

    if (req.baseUrl.includes("documents")) uploadPath = "uploads/documents";
    else if (req.baseUrl.includes("baseline")) uploadPath = "uploads/signatures";

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

// 🔹 Dua instance uploader
const uploadPDF = multer({
  storage,
  fileFilter: createFileFilter(["application/pdf"]),
});

const uploadImage = multer({
  storage,
  fileFilter: createFileFilter(["image/png", "image/jpeg", "image/jpg"]),
});

module.exports = { uploadPDF, uploadImage };
