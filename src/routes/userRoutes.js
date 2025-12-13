const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

const { searchUsers } = require("../controllers/userController");

// ini buat cari user berdasarkan query yang ada di db jadi kaya search user gitu kalo mau minta ttd kaya gmail 
router.get("/search", authMiddleware, searchUsers);

module.exports = router;
