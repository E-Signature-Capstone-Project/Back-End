const isAdmin = (req, res, next) => {
  if (req.user.role === "admin_request") {
    return res.status(403).json({ error: "Menunggu persetujuan admin." });
  }

  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Akses ditolak." });
  }

  next();
};

module.exports = isAdmin;
