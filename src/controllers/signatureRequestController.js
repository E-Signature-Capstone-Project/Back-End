const SignatureRequest = require("../models/SignatureRequest");
const Document = require("../models/Document");

// buat request tanda tangan
exports.createRequest = async (req, res) => {
  try {
    const { document_id, signer_id, note } = req.body;

    // cek apakah dokumen milik requester
    const doc = await Document.findOne({
      where: { document_id, user_id: req.user.user_id }
    });

    if (!doc) {
      return res.status(404).json({ error: "Dokumen tidak ditemukan atau bukan milik anda" });
    }

    const request = await SignatureRequest.create({
      document_id,
      requester_id: req.user.user_id,
      signer_id,
      note
    });

    res.status(201).json({ message: "Request tanda tangan berhasil dibuat", request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ambil semua request masuk (untuk user login)
exports.getIncomingRequests = async (req, res) => {
  try {
    const requests = await SignatureRequest.findAll({ where: { signer_id: req.user.user_id } });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ambil semua request keluar (dibuat user login)
exports.getOutgoingRequests = async (req, res) => {
  try {
    const requests = await SignatureRequest.findAll({ where: { requester_id: req.user.user_id } });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// approve request
exports.approveRequest = async (req, res) => {
  try {
    const request = await SignatureRequest.findOne({
      where: { request_id: req.params.id, signer_id: req.user.user_id }
    });

    if (!request) {
      return res.status(404).json({ error: "Request tidak ditemukan" });
    }

    request.status = "approved";
    await request.save();

    res.json({ message: "Request berhasil disetujui", request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// reject request
exports.rejectRequest = async (req, res) => {
  try {
    const request = await SignatureRequest.findOne({
      where: { request_id: req.params.id, signer_id: req.user.user_id }
    });

    if (!request) {
      return res.status(404).json({ error: "Request tidak ditemukan" });
    }

    request.status = "rejected";
    await request.save();

    res.json({ message: "Request berhasil ditolak", request });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
