require("dotenv").config();
console.log("🚀 Seeder berjalan...");

const bcrypt = require("bcryptjs");
const User = require("../models/User");

(async () => {
  try {
    console.log("🔍 Mengecek apakah admin sudah ada...");

    const adminEmail = "admin@system.com";
    const adminPassword = "Admin123!";

    const existingAdmin = await User.findOne({ where: { email: adminEmail } });

    if (existingAdmin) {
      console.log("⚠️ Admin sudah ada, skip seeding...");
      process.exit();
      return;
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await User.create({
      name: "Super Admin",
      email: adminEmail,
      password: hashedPassword,
      role: "admin",
    });

    console.log("✅ Admin pertama berhasil dibuat!");
    console.log(`📩 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}`);
    process.exit();
  } catch (err) {
    console.error("❌ Gagal create admin:", err);
    process.exit(1);
  }
})();
