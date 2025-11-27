const bcrypt = require("bcrypt");
const User = require("../models/User");

exports.createAdmin = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ message: "Admin sudah ada" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "admin_request", // ⬅️ bukan langsung admin
      status_regis: "pending" // ⬅️ wajib approval
    });

    return res.status(201).json({
      message: "Pengajuan admin berhasil dibuat. Menunggu persetujuan.",
      admin: {
        user_id: admin.user_id,
        email: admin.email,
        role: admin.role,
        status_regis: admin.status_regis
      }
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

exports.approveAdmin = async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

  if (user.role !== "admin_request") {
    return res.status(400).json({ error: "User ini bukan calon admin" });
  }

  user.role = "admin";
  user.status_regis = "approved";
  await user.save();

  res.json({ message: "Admin berhasil disetujui!", user });
};

exports.rejectAdmin = async (req, res) => {
  const { id } = req.params;

  const user = await User.findByPk(id);
  if (!user) return res.status(404).json({ error: "User tidak ditemukan" });

  user.status_regis = "rejected";
  await user.save();

  res.json({ message: "Pengajuan admin ditolak" });
};

exports.getPendingAdminRequests = async (req, res) => {
  try {
    const requests = await User.findAll({
      where: {
        role: "admin_request",
        status_regis: "pending"
      },
      attributes: ["user_id", "name", "email", "register_date", "status_regis"]
    });

    if (requests.length === 0) {
      return res.json({ message: "Tidak ada request admin." });
    }

    res.json({
      message: "List permintaan admin",
      data: requests
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

