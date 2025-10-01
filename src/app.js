require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");

const { sequelize } = require("./models");

const routes = require("./routes");

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(cookieParser());

app.use("/", routes);

sequelize.authenticate()
  .then(() => {
    console.log("✅ Database connected");

    return sequelize.sync({ alter: true }); 
  })
  .then(() => {
    console.log("✅ Database synced with models");
  })
  .catch((err) => {
    console.error("❌ Database error:", err.message);
  });

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
