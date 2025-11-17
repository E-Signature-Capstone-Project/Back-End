const SignatureRequest = require("../models/SignatureRequest");
const Document = require("../models/Document");
const User = require("../models/User");

// Create signature request
exports.createRequest = async (req, res) => {
  try {
    const { document_id, signer_id, note } = req.body;

    // Cek apakah dokumen milik requester
    const doc = await Document.findOne({
      where: { document_id, user_id: req.user.user_id }
    });

    if (!doc) {
      return res.status(404).json({
        success: false,
        message: "Dokumen tidak ditemukan atau bukan milik Anda"
      });
    }

    const request = await SignatureRequest.create({
      document_id,
      requester_id: req.user.user_id,
      signer_id,
      note
    });

    res.status(201).json({
      success: true,
      message: "Permintaan tanda tangan berhasil dibuat",
      data: request
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Get incoming requests (user dimintai tanda tangan)
exports.getIncomingRequests = async (req, res) => {
  try {
    const requests = await SignatureRequest.findAll({
      where: { signer_id: req.user.user_id },
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

// Get outgoing requests (user yang meminta tanda tangan)
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

// Approve request
exports.approveRequest = async (req, res) => {
  try {
    const request = await SignatureRequest.findOne({
      where: { request_id: req.params.id, signer_id: req.user.user_id }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Permintaan tidak ditemukan" });
    }

    request.status = "approved";
    await request.save();

    res.json({ success: true, message: "Permintaan disetujui", data: request });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

// Reject request
exports.rejectRequest = async (req, res) => {
  try {
    const request = await SignatureRequest.findOne({
      where: { request_id: req.params.id, signer_id: req.user.user_id }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: "Permintaan tidak ditemukan" });
    }

    request.status = "rejected";
    await request.save();

    res.json({ success: true, message: "Permintaan ditolak", data: request });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};
