const fs = require("fs");
const path = require("path");
const axios = require("axios");
const { PDFDocument } = require("pdf-lib");
const { SignatureBaseline, LogVerification } = require("../models");
const Document = require("../models/Document");


const FLASK_URL = process.env.FLASK_URL || "http://localhost:5000";
const VERIFY_REQUIRED = (process.env.SIGNATURE_VERIFY_REQUIRED || "true").toLowerCase() === "true";
const VERIFY_THRESHOLD = parseFloat(process.env.SIGNATURE_VERIFY_THRESHOLD || "0.8");

/** Helper: ekstrak embedding dari Flask /extract */
async function getEmbeddingFromFlask(imagePath) {
  if (!fs.existsSync(imagePath)) throw new Error(`File tidak ditemukan: ${imagePath}`);

  const FormData = require("form-data");
  const form = new FormData();
  form.append("image", fs.createReadStream(imagePath));

  const resp = await axios.post(`${FLASK_URL}/extract`, form, { headers: form.getHeaders() });
  return resp.data.embedding; // diasumsikan array angka
}

/** Helper: hitung Euclidean distance */
function euclideanDistance(vec1, vec2) {
  if (!vec1 || !vec2 || vec1.length !== vec2.length) return Infinity;
  let sum = 0;
  for (let i = 0; i < vec1.length; i++) {
    sum += Math.pow(vec1[i] - vec2[i], 2);
  }
  return Math.sqrt(sum);
}

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

    // Simpan path relatif agar mudah diakses oleh frontend
    const relativePath = path.relative(process.cwd(), req.file.path).replace(/\\/g, "/");

    const doc = await Document.create({
      title: req.body.title || req.file.originalname,
      user_id: req.user.user_id,
      file_path: relativePath,
      status: "pending",
    });

    res.status(201).json({
      message: "Dokumen berhasil diupload",
      document: {
        ...doc.toJSON(),
        file_url: `${req.protocol}://${req.get("host")}/${relativePath}`,
      },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findOne({
      where: {
        document_id: req.params.id,
        user_id: req.user.user_id,
      },
    });

    if (!doc) {
      return res.status(404).json({ error: "Dokumen tidak ditemukan" });
    }

    res.json(doc);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.applySignature = async (req, res) => {
  try {
    const documentId = req.params.id;
    const { pageNumber, x, y, width, height } = req.body;

    if (!req.file) return res.status(400).json({ error: "File gambar tanda tangan harus diupload." });

    // Ambil dokumen
    const docRecord = await Document.findOne({
      where: { document_id: documentId, user_id: req.user.user_id }
    });
    if (!docRecord) {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Dokumen tidak ditemukan atau bukan milik Anda." });
    }

    const uploadedSigPath = path.resolve(req.file.path);

    // Ambil semua baseline user
    const baselines = await SignatureBaseline.findAll({ where: { user_id: req.user.user_id } });

    let verificationResult = { match: false, distance: null, usedBaselineId: null };

    if (baselines.length === 0) {
      if (VERIFY_REQUIRED) {
        fs.unlinkSync(uploadedSigPath);
        return res.status(400).json({ error: "Tidak ditemukan baseline tanda tangan. Silakan tambahkan baseline terlebih dahulu." });
      }
    } else {
      // 🔹 Ekstrak embedding dari uploaded signature
      const uploadedEmbedding = await getEmbeddingFromFlask(uploadedSigPath);

      let bestMatch = { match: false, distance: Infinity, baselineId: null };
      for (const b of baselines) {
        const baselineVector = b.feature_vector; // array angka
        if (!baselineVector) continue;

        const dist = euclideanDistance(uploadedEmbedding, baselineVector);
        const match = dist <= VERIFY_THRESHOLD;

        if (dist < bestMatch.distance) {
          bestMatch = { match, distance: dist, baselineId: b.baseline_id };
        }

        if (match) break; // optional: stop at first match
      }

      verificationResult = {
        match: bestMatch.match,
        distance: bestMatch.distance === Infinity ? null : bestMatch.distance,
        usedBaselineId: bestMatch.baselineId
      };

      if (VERIFY_REQUIRED && !verificationResult.match) {
        await LogVerification.create({
          document_id: docRecord.document_id,
          user_id: req.user.user_id,
          verification_result: "invalid",
          similarity_score: verificationResult.distance,
        }).catch(err => console.error(err));

        fs.unlinkSync(uploadedSigPath);
        return res.status(400).json({
          error: "Tanda tangan tidak cocok dengan baseline yang tersimpan (verifikasi gagal).",
          verification: verificationResult
        });
      }

      // simpan log verifikasi
      await LogVerification.create({
        document_id: docRecord.document_id,
        user_id: req.user.user_id,
        verification_result: verificationResult.match ? "valid" : "invalid",
        similarity_score: verificationResult.distance,
      }).catch(err => console.error(err));
    }

    // 🔹 Menempel signature ke PDF
    const originalFilePath = path.join(process.cwd(), docRecord.file_path);
    if (!fs.existsSync(originalFilePath)) {
      if (fs.existsSync(uploadedSigPath)) fs.unlinkSync(uploadedSigPath);
      return res.status(500).json({ error: "File dokumen asli tidak ditemukan di server." });
    }

    const signedDir = path.join("uploads", "documents", "signed");
    fs.mkdirSync(signedDir, { recursive: true });

    const existingPdfBytes = await fs.promises.readFile(originalFilePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const signatureBytes = await fs.promises.readFile(uploadedSigPath);
    const embeddedImage = req.file.mimetype === "image/png"
      ? await pdfDoc.embedPng(signatureBytes)
      : await pdfDoc.embedJpg(signatureBytes);

    const pages = pdfDoc.getPages();
    const pn = Number(pageNumber || 1);
    if (pn < 1 || pn > pages.length) {
      if (fs.existsSync(uploadedSigPath)) fs.unlinkSync(uploadedSigPath);
      return res.status(400).json({ error: "Halaman tanda tangan di luar jangkauan." });
    }
    const targetPage = pages[pn - 1];

    targetPage.drawImage(embeddedImage, {
      x: Number(x || 0),
      y: Number(y || 0),
      width: Number(width || 150),
      height: Number(height || 50),
    });

    const pdfBytes = await pdfDoc.save();
    const signedFilename = `signed_${Date.now()}_${path.basename(originalFilePath)}`;
    const signedPath = path.join(signedDir, signedFilename);
    await fs.promises.writeFile(signedPath, pdfBytes);

    const relativeSignedPath = path.relative(process.cwd(), signedPath).replace(/\\/g, "/");
    await docRecord.update({ file_path: relativeSignedPath, status: "signed" });

    if (fs.existsSync(uploadedSigPath)) fs.unlinkSync(uploadedSigPath);

    const signedFileUrl = `${req.protocol}://${req.get("host")}/${relativeSignedPath}`;
    return res.json({
      message: "Dokumen berhasil ditandatangani",
      verification: verificationResult,
      document: {
        document_id: docRecord.document_id,
        title: docRecord.title,
        file_url: signedFileUrl,
        status: "signed"
      }
    });

  } catch (err) {
    console.error("applySignature error:", err);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ error: err.message });
  }
};

exports.signDocument = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const { id } = req.params;

    // Pastikan ada file signature
    if (!req.file) {
      return res.status(400).json({ error: "Tanda tangan tidak ditemukan." });
    }

    // Ambil dokumen
    const document = await Document.findByPk(id);
    if (!document) {
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ error: "Dokumen tidak ditemukan." });
    }

    // Ambil baseline user
    const baselines = await SignatureBaseline.findAll({ where: { user_id: userId } });
    if (!baselines.length) {
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ error: "Baseline tanda tangan tidak ditemukan untuk user ini." });
    }

    // Ambil embedding tanda tangan baru dari Flask
    const newEmbedding = await getEmbeddingFromFlask(req.file.path);

    // Bandingkan dengan semua baseline untuk menemukan yang paling mirip
    let bestMatch = { match: false, distance: Infinity, baselineId: null };

    for (const base of baselines) {
      const baselinePath = path.resolve(base.sign_image);
      if (!fs.existsSync(baselinePath)) continue;

      const compare = await compareWithFlask(req.file.path, baselinePath, 0.5);

      if (compare.distance < bestMatch.distance) {
        bestMatch = {
          match: compare.match,
          distance: compare.distance,
          baselineId: base.baseline_id
        };
      }
    }

    // 🔹 Simpan hasil tanda tangan ke dokumen PDF
    const signedFilePath = await createPdfWithSignature(document.file_path, req.file.path);

    // Update status dokumen
    document.status = "signed";
    document.file_url = signedFilePath;
    await document.save();

    // 🔹 Tambahkan ke LogVerification
    await LogVerification.create({
      document_id: document.document_id,
      user_id: userId,
      verification_result: bestMatch.match ? "valid" : "invalid",
      similarity_score: bestMatch.distance,
    });

    // Hapus file tanda tangan sementara
    fs.unlinkSync(req.file.path);

    return res.status(200).json({
      message: "Dokumen berhasil ditandatangani",
      verification: {
        match: bestMatch.match,
        distance: bestMatch.distance,
        usedBaselineId: bestMatch.baselineId,
      },
      document,
    });

  } catch (error) {
    console.error("❌ Error signDocument:", error);
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    return res.status(500).json({ error: "Gagal menandatangani dokumen", detail: error.message });
  }
};

exports.signDocumentExternally = async (req, res) => {
  try {
    const { baseline_id, pageNumber, x, y, width, height } = req.body;
    const documentId = req.params.id;

    if (!baseline_id) {
      return res.status(400).json({ error: "baseline_id harus diisi." });
    }

    // Ambil dokumen milik user yang sedang login
    const docRecord = await Document.findOne({
      where: { document_id: documentId, user_id: req.user.user_id }
    });

    if (!docRecord) {
      return res.status(404).json({ error: "Dokumen tidak ditemukan atau bukan milik Anda." });
    }

    // Ambil baseline tanda tangan signer yang disetujui
    const baseline = await SignatureBaseline.findOne({ where: { baseline_id } });

    if (!baseline || !baseline.sign_image) {
      return res.status(404).json({ error: "Baseline tanda tangan tidak ditemukan." });
    }

    const baselineImagePath = path.resolve(baseline.sign_image);
    if (!fs.existsSync(baselineImagePath)) {
      return res.status(500).json({ error: "File tanda tangan baseline tidak ditemukan di server." });
    }

    // Load PDF
    const originalFilePath = path.join(process.cwd(), docRecord.file_path);
    if (!fs.existsSync(originalFilePath)) {
      return res.status(500).json({ error: "File dokumen tidak ditemukan di server." });
    }

    const signedDir = path.join("uploads", "documents", "signed");
    fs.mkdirSync(signedDir, { recursive: true });

    const existingPdfBytes = await fs.promises.readFile(originalFilePath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const signatureBytes = await fs.promises.readFile(baselineImagePath);
    const embeddedImage = baselineImagePath.endsWith(".png")
      ? await pdfDoc.embedPng(signatureBytes)
      : await pdfDoc.embedJpg(signatureBytes);

    const pages = pdfDoc.getPages();
    const pn = Number(pageNumber || 1);

    if (pn < 1 || pn > pages.length) {
      return res.status(400).json({ error: "Halaman tanda tangan di luar jangkauan." });
    }

    const targetPage = pages[pn - 1];

    targetPage.drawImage(embeddedImage, {
      x: Number(x || 0),
      y: Number(y || 0),
      width: Number(width || 150),
      height: Number(height || 50),
    });

    const pdfBytes = await pdfDoc.save();
    const signedFilename = `signed_external_${Date.now()}_${path.basename(originalFilePath)}`;
    const signedPath = path.join(signedDir, signedFilename);
    await fs.promises.writeFile(signedPath, pdfBytes);

    const relativeSignedPath = path.relative(process.cwd(), signedPath).replace(/\\/g, "/");
    await docRecord.update({ file_path: relativeSignedPath, status: "signed" });

    return res.json({
      message: "Tanda tangan eksternal berhasil diterapkan.",
      document: {
        document_id: docRecord.document_id,
        title: docRecord.title,
        file_url: `${req.protocol}://${req.get("host")}/${relativeSignedPath}`,
        status: docRecord.status
      }
    });

  } catch (err) {
    console.error("signDocumentExternally error:", err);
    return res.status(500).json({ error: err.message });
  }
};