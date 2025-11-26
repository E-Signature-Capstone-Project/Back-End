const isAdmin = (req, res, next) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Akses ditolak, hanya admin" });
  }
  next();
};

module.exports = isAdmin;
