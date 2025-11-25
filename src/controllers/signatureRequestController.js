const { Op } = require("sequelize");
const SignatureRequest = require("../models/SignatureRequest");
const Document = require("../models/Document");
const User = require("../models/User");

// Create signature request (pakai email)
exports.createRequest = async (req, res) => {
  try {
    const { document_id, recipientEmail, note } = req.body;

    if (!document_id || !recipientEmail) {
      return res.status(400).json({ success: false, message: "document_id dan recipientEmail wajib diisi" });
    }

    const email = String(recipientEmail).trim().toLowerCase();

    // Validasi dokumen milik requester
    const doc = await Document.findOne({
      where: { document_id, user_id: req.user.user_id }
    });
    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Dokumen tidak ditemukan atau bukan milik Anda"
      });
    }

    // Jika email penerima sudah terdaftar sbg user, tautkan signer_id
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

// Incoming requests (user dimintai) — via signer_id ATAU email yang cocok
exports.getIncomingRequests = async (req, res) => {
  try {
    const requests = await SignatureRequest.findAll({
      where: {
        [Op.or]: [
          { signer_id: req.user.user_id },
          { recipient_email: req.user.email } // jika request dibuat sebelum user terdaftar
        ]
      },
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

// Outgoing requests (user peminta) — tidak berubah
exports.getOutgoingRequests = async (req, res) => {
  try {
    const requests = await SignatureRequest.findAll({
      where: { requester_id: req.user.user_id },
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

// Approve
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

    request.status = "approved";

    // Opsional: backfill signer_id jika sebelumnya null tapi user sekarang sudah login
    if (!request.signer_id) request.signer_id = req.user.user_id;

    await request.save();

    res.json({ success: true, message: "Permintaan disetujui", data: request });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Reject
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

    request.status = "rejected";

    // Opsional: backfill signer_id jika perlu
    if (!request.signer_id) request.signer_id = req.user.user_id;

    await request.save();

    res.json({ success: true, message: "Permintaan ditolak", data: request });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
