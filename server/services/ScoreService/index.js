const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const PORT = process.env.PORT || 4002;
const scoreRoutes = require("./routes/scoreRoutes");

app.use(cors());
require("./config/db");
app.use(express.json());

app.use("/api/students", scoreRoutes);

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
