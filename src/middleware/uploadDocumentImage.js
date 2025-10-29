const multer = require("multer");
const path = require("path");
const fs = require("fs");

// Storage khusus untuk dokumen
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join("uploads", "documents");
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const fileName = Date.now() + "_" + file.originalname.replace(/\s+/g, "_");
    cb(null, fileName);
  },
});

// Filter file image (PNG/JPG)
const uploadDocumentImage = multer({
  storage,
  fileFilter: (req, file, cb) => {
    console.log("Received file field:", file.fieldname); // DEBUG
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) cb(null, true);
    else cb(new Error(`Tipe file tidak diizinkan: ${file.mimetype}`));
  },
});

module.exports = uploadDocumentImage;
