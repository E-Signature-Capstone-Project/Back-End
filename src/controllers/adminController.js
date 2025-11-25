const bcrypt = require("bcrypt");
const User = require("../models/User");

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Cek apakah admin sudah ada
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Admin sudah ada" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin"
    });

    return res.status(201).json({
      message: "Admin berhasil dibuat",
      admin
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
