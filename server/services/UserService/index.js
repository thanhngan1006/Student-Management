const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 4003;
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
app.use(express.urlencoded({ extended: true }));

app.use(cors());
require("./config/db");
app.use(express.json());

app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
