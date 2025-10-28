const { LogVerification, User, Document } = require("../models");

exports.getLogs = async (req, res) => {
  try {
    const logs = await LogVerification.findAll({
      include: [
        {
          model: User,
          attributes: ["user_id", "name", "email"],
        },
        {
          model: Document,
          attributes: ["document_id", "title", "file_path"],
        },
      ],
      order: [["timestamp", "DESC"]],
    });

    res.status(200).json({
      success: true,
      message: "Berhasil mengambil log verifikasi",
      data: logs,
    });
  } catch (error) {
    console.error("Error mengambil log:", error);
    res.status(500).json({
      error: "Gagal mengambil log verifikasi",
      details: error.message,
    });
  }
};
