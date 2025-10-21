const fs = require("fs");
const path = require("path");
const axios = require("axios");
const FormData = require("form-data");
const { SignatureBaseline } = require("../models");

// URL Flask service
const FLASK_URL = process.env.FLASK_URL || "http://localhost:5000";

// ========================================================
// 🧩 Fungsi bantu: ambil embedding dari Flask
// ========================================================
async function getEmbeddingFromFlask(imagePath) {
  if (!fs.existsSync(imagePath)) throw new Error(`File tidak ditemukan: ${imagePath}`);

  const form = new FormData();
  form.append("image", fs.createReadStream(imagePath));

  const response = await axios.post(`${FLASK_URL}/extract`, form, {
    headers: form.getHeaders(),
  });

  return response.data.embedding;
}

// ========================================================
// 🧩 Fungsi bantu: bandingkan dua gambar via Flask
// ========================================================
async function compareWithFlask(imagePath1, imagePath2, threshold = 0.5) {
  if (!fs.existsSync(imagePath1)) throw new Error(`File 1 tidak ditemukan: ${imagePath1}`);
  if (!fs.existsSync(imagePath2)) throw new Error(`File 2 tidak ditemukan: ${imagePath2}`);

  const form = new FormData();
  form.append("image1", fs.createReadStream(imagePath1));
  form.append("image2", fs.createReadStream(imagePath2));
  form.append("threshold", threshold);

  const response = await axios.post(`${FLASK_URL}/compare`, form, {
    headers: form.getHeaders(),
  });

  return response.data;
}

// ========================================================
// 🎯 Controller utama: Tambah baseline
// ========================================================
exports.addBaseline = async (req, res) => {
  try {
    const userId = req.user.user_id;

    if (!req.file) {
      return res.status(400).json({ error: "File tanda tangan tidak ditemukan di request." });
    }

    // 🔹 Gunakan path relatif agar konsisten
    const filePath = path.normalize(req.file.path).replace(/\\/g, "/");

    // 🔹 Ambil semua baseline milik user
    const existingBaselines = await SignatureBaseline.findAll({
      where: { user_id: userId },
    });

    // 🔹 Cek batas maksimal baseline
    if (existingBaselines.length >= 5) {
      fs.unlinkSync(filePath);
      return res.status(400).json({ error: "Maksimal 5 tanda tangan baseline per user." });
    }

    // ========================================================
    // 🔹 Upload pertama → langsung diterima
    // ========================================================
    if (existingBaselines.length === 0) {
      const embedding = await getEmbeddingFromFlask(filePath);

      const newBaseline = await SignatureBaseline.create({
        user_id: userId,
        sign_image: path.join("uploads", "signatures", String(userId), path.basename(filePath)).replace(/\\/g, "/"),
        feature_vector: embedding,
      });

      return res.status(201).json({
        message: "Baseline pertama berhasil ditambahkan.",
        baseline: newBaseline,
      });
    }

    // ========================================================
    // 🔹 Upload ke-2 s/d ke-5 → validasi AI
    // ========================================================
    const newEmbedding = await getEmbeddingFromFlask(filePath);
    let isMatch = false;
    let matchedBaselineId = null;

    for (const baseline of existingBaselines) {
      // pastikan path baseline valid
      const baselinePath = path.resolve(baseline.sign_image);
      if (!fs.existsSync(baselinePath)) {
        console.warn(`⚠️ File baseline hilang: ${baselinePath}`);
        continue;
      }

      const compareResult = await compareWithFlask(filePath, baselinePath, 0.5);

      console.log(`🔍 Compare with baseline ${baseline.baseline_id}: distance=${compareResult.distance}`);

      if (compareResult.match) {
        isMatch = true;
        matchedBaselineId = baseline.baseline_id;
        break;
      }
    }

    if (!isMatch) {
      fs.unlinkSync(filePath);
      return res.status(400).json({
        error: "Tanda tangan tidak cocok dengan baseline yang ada.",
      });
    }

    // Jika match → simpan baseline baru
    const newBaseline = await SignatureBaseline.create({
      user_id: userId,
      sign_image: path.join("uploads", "signatures", String(userId), path.basename(filePath)).replace(/\\/g, "/"),
      feature_vector: newEmbedding,
    });


    return res.status(201).json({
      message: `Baseline baru berhasil ditambahkan (match dengan baseline #${matchedBaselineId}).`,
      baseline: newBaseline,
    });
  } catch (error) {
    console.error("❌ Error addBaseline:", error.message);

    // hapus file upload bila terjadi error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    return res.status(500).json({
      error: "Terjadi kesalahan saat menambah baseline.",
      detail: error.message,
    });
  }
};

// ========================================================
// 📜 Get semua baseline user
// ========================================================
exports.getBaselines = async (req, res) => {
  try {
    const userId = req.user.user_id;

    const baselines = await SignatureBaseline.findAll({
      where: { user_id: userId },
      order: [["created_at", "ASC"]],
    });

    return res.json({
      count: baselines.length,
      baselines,
    });
  } catch (error) {
    console.error("Error getBaselines:", error.message);
    return res.status(500).json({ error: "Gagal mengambil baseline." });
  }
};
