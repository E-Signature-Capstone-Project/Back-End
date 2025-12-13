const { Op } = require("sequelize");
const SignatureRequest = require("../models/SignatureRequest");
const Document = require("../models/Document");
const User = require("../models/User");
const SignatureBaseline = require("../models/SignatureBaseline");

// ===============================
// CREATE REQUEST (EMAIL-BASED)
// ===============================
exports.createRequest = async (req, res) => {
  try {
    const { document_id, recipientEmail, note } = req.body;

    // 🔒 Validasi dasar
    if (!document_id || !recipientEmail) {
      return res.status(400).json({
        success: false,
        message: "document_id dan recipientEmail wajib diisi"
      });
    }

    const email = String(recipientEmail).trim().toLowerCase();

    // 🔒 Pastikan dokumen memang milik requester (user yang login)
    const doc = await Document.findOne({
      where: { document_id, user_id: req.user.user_id }
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Dokumen tidak ditemukan atau bukan milik Anda"
      });
    }

    // Jika email penerima sudah terdaftar, simpan user_id-nya
    const existingUser = await User.findOne({ where: { email } });

    const request = await SignatureRequest.create({
      document_id,
      requester_id: req.user.user_id,
      recipient_email: email,
      signer_id: existingUser ? existingUser.user_id : null,
      note: note || null,
      status: "pending"
    });
    

    return res.status(201).json({
      success: true,
      message: "Permintaan tanda tangan berhasil dibuat",
      data: request
    });
  } catch (err) {
    console.error("createRequest error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// ===========================================
// INCOMING REQUESTS (SIGNER) + FILTER STATUS
// ===========================================
exports.getIncomingRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const whereClause = {
      [Op.or]: [
        { signer_id: req.user.user_id },
        { recipient_email: req.user.email }
      ]
    };

    if (status) whereClause.status = status;

    const requests = await SignatureRequest.findAll({
      where: whereClause,
      include: [
        { model: User, as: "requester", attributes: ["user_id", "name", "email"] },
        { model: Document, attributes: ["document_id", "title", "file_path"] }
      ],
      order: [["created_at", "DESC"]]
    });

    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ===========================================
// OUTGOING REQUESTS (REQUESTER) + FILTER STATUS
// ===========================================
exports.getOutgoingRequests = async (req, res) => {
  try {
    const { status } = req.query;

    const whereClause = { requester_id: req.user.user_id };
    if (status) whereClause.status = status;

    const requests = await SignatureRequest.findAll({
      where: whereClause,
      include: [
        { model: User, as: "signer", attributes: ["user_id", "name", "email"] },
        { model: Document, attributes: ["document_id", "title", "file_path"] }
      ],
      order: [["created_at", "DESC"]]
    });

    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ===============================  
// APPROVE REQUEST
// ===============================
exports.approveRequest = async (req, res) => {
  try {
    const request = await SignatureRequest.findOne({
      where: {
        request_id: req.params.id,
        [Op.or]: [
          { signer_id: req.user.user_id },
          { recipient_email: req.user.email }
        ]
      }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Permintaan tidak ditemukan" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Permintaan sudah berstatus '${request.status}', tidak bisa di-approve lagi`
      });
    }

    request.status = "approved";
    if (!request.signer_id) request.signer_id = req.user.user_id;

    await request.save();

    res.json({ success: true, message: "Permintaan disetujui", data: request });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ===============================
// REJECT REQUEST
// ===============================
exports.rejectRequest = async (req, res) => {
  try {
    const request = await SignatureRequest.findOne({
      where: {
        request_id: req.params.id,
        [Op.or]: [
          { signer_id: req.user.user_id },
          { recipient_email: req.user.email }
        ]
      }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Permintaan tidak ditemukan" });
    }

    if (request.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: `Permintaan sudah berstatus '${request.status}', tidak bisa di-reject lagi`
      });
    }

    request.status = "rejected";
    if (!request.signer_id) request.signer_id = req.user.user_id;

    await request.save();

    res.json({ success: true, message: "Permintaan ditolak", data: request });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// ===============================
// GET SIGNATURE (HANYA JIKA APPROVED)
// ===============================
exports.getRequestSignature = async (req, res) => {
  try {
    const request = await SignatureRequest.findOne({
      where: {
        request_id: req.params.id,
        requester_id: req.user.user_id
      }
    });

    if (!request) {
      return res.status(404).json({
        success: false,
        message: "Request tidak ditemukan atau bukan milik Anda"
      });
    }

    // ❗ Hanya boleh kalau status masih approved
    if (request.status !== "approved") {
      return res.status(403).json({
        success: false,
        message: `Tidak bisa mengambil tanda tangan. Status request: '${request.status}'`
      });
    }

    // ✅ Cek status dokumen juga
    const doc = await Document.findByPk(request.document_id);
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Dokumen terkait request ini tidak ditemukan"
      });
    }

    // ❗ Kalau dokumen sudah signed, jangan izinkan ambil tanda tangan lagi
    if (doc.status === "signed") {
      return res.status(403).json({
        success: false,
        message: "Dokumen sudah ditandatangani. Tanda tangan tidak dapat diambil lagi."
      });
    }

    let signerId = request.signer_id;

    if (!signerId) {
      const user = await User.findOne({ where: { email: request.recipient_email }});
      if (user) {
        signerId = user.user_id;
        request.signer_id = signerId;
        await request.save();
      } else {
        return res.status(404).json({
          success: false,
          message: "User penerima belum memiliki akun"
        });
      }
    }

    const baseline = await SignatureBaseline.findOne({
      where: { user_id: signerId },
      order: [["created_at", "ASC"]]
    });

    if (!baseline) {
      return res.status(404).json({
        success: false,
        message: "Signer belum memiliki tanda tangan baseline"
      });
    }

    return res.json({
      success: true,
      data: {
        request_id: request.request_id,
        signer_id: signerId,
        baseline_id: baseline.baseline_id,
        sign_image: baseline.sign_image
      }
    });

  } catch (err) {
    console.error("getRequestSignature error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};

// ===============================
// REQUEST HISTORY (ADMIN & USER)
// ===============================
exports.getRequestHistory = async (req, res) => {
  try {
    let whereClause = {};

    if (req.user.role !== "admin") {
      whereClause = {
        [Op.or]: [
          { requester_id: req.user.user_id },
          { signer_id: req.user.user_id },
          { recipient_email: req.user.email }
        ]
      };
    }

    const history = await SignatureRequest.findAll({
      where: whereClause,
      include: [
        { model: User, as: "requester", attributes: ["user_id", "name", "email"] },
        { model: User, as: "signer", attributes: ["user_id", "name", "email"] },
        { model: Document, attributes: ["document_id", "title", "file_path"] }
      ],
      order: [["updatedAt", "DESC"]]
    });

    return res.json({
      success: true,
      message: "Riwayat permintaan tanda tangan berhasil didapat",
      data: history
    });

  } catch (err) {
    console.error("getRequestHistory error:", err);
    return res.status(500).json({ success: false, error: err.message });
  }
};
exports.getPublicSignatureRequestsByDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findOne({
      where: { document_id: documentId },
      attributes: ["document_id", "title"],
      include: [
        {
          model: User,
          as: "owner", // 🔥 HARUS ADA ALIAS
          attributes: ["user_id", "name", "email"]
        }
      ]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: "Dokumen tidak ditemukan"
      });
    }

    const signatures = await SignatureRequest.findAll({
      where: { document_id: documentId },
      attributes: ["request_id", "status", "created_at", "updated_at"],
      include: [
        {
          model: User,
          as: "signer",
          attributes: ["user_id", "name", "email"],
          required: false // 🔥 signer boleh null
        }
      ],
      order: [["created_at", "ASC"]]
    });

    return res.json({
      success: true,
      document: {
        id: document.document_id,
        title: document.title,
        owner: document.owner
          ? {
              id: document.owner.user_id,
              name: document.owner.name,
              email: document.owner.email
            }
          : null
      },
      signatures: signatures.map(sig => ({
        request_id: sig.request_id,
        status: sig.status,
        created_at: sig.created_at,
        updated_at: sig.updated_at,
        signer: sig.signer
          ? {
              id: sig.signer.user_id,
              name: sig.signer.name,
              email: sig.signer.email
            }
          : null
      }))
    });

  } catch (error) {
    console.error("QR Public Verification Error:", error);
    return res.status(500).json({
      success: false,
      message: "Gagal mengambil data verifikasi",
      error: error.message
    });
  }
};
