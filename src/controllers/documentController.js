const Document = require("../models/Document");
const path = require("path");

exports.getDocuments = async (req, res) => {
  try {
    const docs = await Document.findAll({ where: { user_id: req.user.user_id } });
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "File harus diupload" });
    }

    const doc = await Document.create({
      title: req.body.title || req.file.originalname,
      user_id: req.user.user_id,
      file_path: req.file.path,
      status: "pending"
    });

    res.status(201).json({ message: "Dokumen berhasil diupload", document: doc });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findOne({
      where: {
        document_id: req.params.id,
        user_id: req.user.user_id
      }
    });

    if (!doc) {
      return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};