const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const SECRET_KEY = process.env.JWT_SECRET;

// ================== REGISTER ==================
const register = async (req, res) => {
  try {
    const { name, email, password, request_admin } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) return res.status(400).json({ error: "Email sudah digunakan" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: request_admin ? "admin_request" : "user",
      status_regis: request_admin ? "pending" : "approved"
    });

    res.status(201).json({
      message: "Registrasi berhasil",
      status: user.status_regis,
      role: user.role
    });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// ================== LOGIN ==================
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

    if (user.role === "admin_request" && user.status_regis === "pending") {
      return res.status(403).json({ error: "Menunggu persetujuan admin." });
    }
    if (user.status_regis === "rejected") {
      return res.status(403).json({ error: "Pengajuan admin ditolak." });
    }


    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Password salah" });

    const token = jwt.sign(
      { user_id: user.user_id, role: user.role, email: user.email },
      SECRET_KEY,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login berhasil", token });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
// ================== GET PROFILE ==================
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.user_id, {
      attributes: ["user_id", "name", "email", "role", "register_date"]
    });

    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ================== CREATE ADMIN ==================
const createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email sudah terdaftar" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      password: hashed,
      role: "admin"
    });

    res.status(201).json({
      message: "Admin berhasil dibuat",
      admin: {
        user_id: admin.user_id,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (err) {
    console.error("❌ Create admin error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ================== UPDATE NAME ==================
const updateName = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || name.trim().length < 3) {
      return res.status(400).json({
        error: "Nama harus minimal 3 karakter"
      });
    }

    const user = await User.findByPk(req.user.user_id);

    if (!user) {
      return res.status(404).json({ error: "User tidak ditemukan" });
    }

    user.name = name.trim();
    await user.save();

    res.json({ 
      message: "Nama berhasil diperbarui", 
      user: { user_id: user.user_id, name: user.name, email: user.email }
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// ================== EXPORT ==================
module.exports = {
  register,
  login,
  getProfile,
  createAdmin,
  updateName // WAJIB ADA
};
