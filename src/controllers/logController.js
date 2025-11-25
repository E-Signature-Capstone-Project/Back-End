const { LogVerification, User, Document } = require("../models");

exports.getLogs = async (req, res) => {
  try {
    let logs;

    if (req.user.role === "admin") {
      // Admin: ambil semua log
      logs = await LogVerification.findAll({
        include: [
          { model: User, attributes: ["user_id", "name", "email"] },
          { model: Document, attributes: ["document_id", "file_path"] }
        ],
        order: [["timestamp", "DESC"]]
      });

    } else {
      // User biasa: hanya log miliknya
      logs = await LogVerification.findAll({
        where: { user_id: req.user.user_id },
        include: [
          { model: User, attributes: ["user_id", "name", "email"] },
          { model: Document, attributes: ["document_id", "file_path"] }
        ],
        order: [["timestamp", "DESC"]]
      });
    }

    return res.json(logs);

  } catch (err) {
    console.error("❌ Log fetch error:", err);
    return res.status(500).json({ error: "Gagal mengambil log verifikasi" });
  }
};
