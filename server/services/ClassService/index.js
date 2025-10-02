const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 4000;
const classRoutes = require("./routes/classRoutes");

app.use(cors());
require("./config/db");
app.use(express.json());

app.use("/api", classRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
