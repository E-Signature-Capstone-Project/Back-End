const path = require("path");
const fs = require("fs");
const SignatureBaseline = require("../models/SignatureBaseline");

exports.uploadBaseline = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user.user_id;

    if (!file) {
      return res.status(400).json({ error: "File tidak ditemukan" });
    }

    // Pastikan folder uploads/signatures/user_{id} ada
    const userFolder = path.join(__dirname, "../uploads/signatures/user_" + userId);
    if (!fs.existsSync(userFolder)) {
      fs.mkdirSync(userFolder, { recursive: true });
    }

    const fileName = `${Date.now()}_${file.originalname}`;
    const filePath = path.join(userFolder, fileName);

    // Simpan file ke lokal
    fs.writeFileSync(filePath, file.buffer);

    // Simpan ke database (hanya path relatif)
    const relativePath = `uploads/signatures/user_${userId}/${fileName}`;
    const newBaseline = await SignatureBaseline.create({
      user_id: userId,
      sign_image: relativePath,
      feature_vector: null,
    });

    res.status(201).json({
      message: "Baseline berhasil diupload",
      baseline: newBaseline,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};

exports.getBaselines = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const baselines = await SignatureBaseline.findAll({ where: { user_id: userId } });
    res.json(baselines);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
};
