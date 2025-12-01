const User = require("../models/User");
const { Op } = require("sequelize");

exports.searchUsers = async (req, res) => {
  try {
    const query = req.query.q;

    // Minimal 2 huruf sebelum search
    if (!query || query.length < 2) {
      return res.json([]);
    }

    const users = await User.findAll({
      where: {
        email: { [Op.like]: `%${query}%` },
        user_id: { [Op.ne]: req.user.user_id } // ⛔ HILANGKAN user yang sedang login
      },
      attributes: ["user_id", "name", "email"],
      limit: 10
    });

    res.json(users);
  } catch (err) {
    console.error("❌ Search error:", err);
    res.status(500).json({ error: "Gagal mencari user" });
  }
};
