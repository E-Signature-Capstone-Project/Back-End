const supabase = require("../services/supabaseService");
const SignatureBaseline = require("../models/SignatureBaseline");

exports.uploadBaseline = async (req, res) => {
  try {
    const file = req.file;
    const userId = req.user.user_id;

    if (!file) {
      return res.status(400).json({ error: "File tidak ditemukan" });
    }

    const fileName = `user_${userId}/${Date.now()}_${file.originalname}`;
    const { data, error } = await supabase.storage
      .from("signatures")
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true,
      });

    if (error) throw error;

    const newBaseline = await SignatureBaseline.create({
      user_id: userId,
      sign_image: fileName,
      feature_vector: null,
    });

    res.status(201).json({ 
      message: "Baseline berhasil diupload", 
      baseline: newBaseline 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getBaselines = async (req, res) => {
  try {
    const userId = req.user.user_id;
    const baselines = await SignatureBaseline.findAll({ where: { user_id: userId } });
    res.json(baselines);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
